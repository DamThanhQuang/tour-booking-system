/**
 * AUTH API
 *
 * Vai trò:
 * - Wrapper cho toàn bộ auth endpoints (signup / signin / refresh / me / logout)
 * - Đồng bộ auth state với Zustand store
 * - Quản lý token trong memory (accessToken, idToken)
 *
 * ⚠️ refreshToken KHÔNG lưu ở frontend
 * → backend set HttpOnly cookie
 */

import apiClient from '@/lib/api-client';
import { setAccessToken, setIdToken, clearTokens } from '@/lib/tokenManager';
import { useAuthStore } from '@/stores/authStore';

// ============================================
// TYPES - ĐỊNH NGHĨA DATA GỬI / NHẬN
// ============================================

/**
 * Data gửi khi đăng ký
 */
export interface SignUpData {
  username: string;
  email: string;
  password: string;
  userGroup?: 'Admin' | 'Business' | 'User';
}

/**
 * Data gửi khi confirm signup (OTP)
 */
export interface ConfirmSignUpData {
  username: string;
  code: string;
}

/**
 * Data gửi khi đăng nhập
 */
export interface SignInData {
  username: string;
  password: string;
}

/**
 * Response trả về khi đăng nhập thành công
 */
interface SignInResponse {
  message: string;

  // Token trả về từ backend
  tokens: {
    accessToken: string;
    idToken: string;

    // refreshToken KHÔNG trả về
    // → backend set HttpOnly cookie
    refreshToken: string;
  };

  // Thông tin user
  user: {
    username: string;
    email: string;
    userGroup: 'Admin' | 'Business' | 'User'; 
    sub: string;
  };
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * SIGN UP
 *
 * - Gửi data đăng ký lên backend
 * - Backend tạo user trong Cognito
 * - Chưa login ngay (cần confirm OTP)
 */
export const signUp = async (data: SignUpData) => {
  const response = await apiClient.post('/auth/signup', data);
  return response.data;
};

/**
 * CONFIRM SIGN UP
 *
 * - Xác thực OTP
 * - Kích hoạt user trong Cognito
 */
export const confirmSignUp = async (data: ConfirmSignUpData) => {
  const response = await apiClient.post('/auth/confirm-signup', data);
  return response.data;
};

/**
 * SIGN IN
 *
 * Luồng:
 * 1. Gửi username + password
 * 2. Backend xác thực Cognito
 * 3. Backend trả accessToken + idToken
 * 4. Backend set refreshToken vào HttpOnly cookie
 * 5. Frontend:
 *    - Lưu token vào memory
 *    - Update Zustand store
 */
export const signIn = async (
  data: SignInData
): Promise<SignInResponse> => {

  const response = await apiClient.post<SignInResponse>(
    '/auth/signin',
    data
  );

  // ===============================
  // LƯU TOKEN (MEMORY)
  // ===============================
  if (response.data.tokens) {
    setAccessToken(response.data.tokens.accessToken);
    setIdToken(response.data.tokens.idToken);

    // ⚠️ refreshToken:
    // - KHÔNG lưu frontend
    // - Đã được backend set vào HttpOnly cookie
  }

  // ===============================
  // UPDATE AUTH STORE (ZUSTAND)
  // ===============================
  if (response.data.user) {
    // Dùng getState() vì đang ở ngoài React component
    useAuthStore.getState().setUser(response.data.user);
  }

  return response.data;
};

/**
 * GET CURRENT USER
 *
 * - Dùng accessToken để gọi API /auth/me
 * - Trả về user hiện tại
 * - Đồng bộ lại Zustand store
 */
export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');

  // Update store
  useAuthStore.getState().setUser(response.data.user);

  return response.data;
};

/**
 * SIGN OUT
 *
 * Luồng:
 * 1. Gọi backend xoá refreshToken cookie
 * 2. Clear toàn bộ token frontend
 * 3. Reset auth store
 */
export const signOut = async () => {
  try {
    await apiClient.post('/auth/signout');
  } finally {
    // Clear token memory
    clearTokens();

    // Clear Zustand state
    useAuthStore.getState().clearAuth();
  }
};

/**
 * SILENT REFRESH
 *
 * Dùng khi:
 * - App load lần đầu
 * - F5 browser
 * - Restore session
 *
 * Luồng:
 * 1. Gọi /auth/refresh
 * 2. refreshToken tự động gửi qua HttpOnly cookie
 * 3. Backend trả accessToken mới
 * 4. Lưu token
 * 5. Fetch user info
 */
export const refreshAuth = async (): Promise<boolean> => {
  try {
    // ===============================
    // REFRESH TOKEN
    // ===============================
    const { data } = await apiClient.post('/auth/refresh');

    // Lưu token mới
    setAccessToken(data.accessToken);

    if (data.idToken) {
      setIdToken(data.idToken);
    }

    // ===============================
    // FETCH USER INFO
    // ===============================
    await getCurrentUser();

    return true;

  } catch (error) {
    // ===============================
    // REFRESH FAIL → LOGOUT
    // ===============================
    clearTokens();
    useAuthStore.getState().clearAuth();
    return false;
  }
};
