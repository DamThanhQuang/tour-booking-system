/**
 * API CLIENT với AUTO REFRESH TOKEN
 *
 * Mục tiêu:
 * - Tự động gắn accessToken vào mọi request
 * - Khi accessToken hết hạn (401) → tự refresh
 * - Retry lại request cũ sau khi refresh thành công
 * - Nếu nhiều request cùng 401 → chỉ refresh 1 lần, các request khác chờ
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setAccessToken, clearTokens } from './tokenManager';

// ============================================
// KHỞI TẠO AXIOS INSTANCE
// ============================================

const apiClient = axios.create({
  // Base URL cho toàn bộ API
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',

  // Header mặc định
  headers: { 'Content-Type': 'application/json' },

  // Cho phép browser gửi HttpOnly cookie (refreshToken)
  withCredentials: true,
});

// ============================================
// BIẾN PHỤC VỤ REFRESH TOKEN
// ============================================

// Flag: đang refresh hay chưa
// Dùng để đảm bảo chỉ gọi refresh 1 lần duy nhất
let isRefreshing = false;

// Queue chứa các request bị 401 trong lúc đang refresh
// Mỗi phần tử là 1 Promise đang "chờ token mới"
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

// ============================================
// HÀM XỬ LÝ QUEUE SAU KHI REFRESH
// ============================================

/**
 * @param error  Lỗi nếu refresh thất bại
 * @param token Access token mới nếu refresh thành công
 *
 * - Nếu thành công → resolve toàn bộ request đang chờ
 * - Nếu thất bại → reject toàn bộ request
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      // Refresh thất bại → reject request
      promise.reject(error);
    } else {
      // Refresh thành công → trả token mới cho request
      promise.resolve(token!);
    }
  });

  // Clear queue sau khi xử lý
  failedQueue = [];
};

// ============================================
// REQUEST INTERCEPTOR
// ============================================

apiClient.interceptors.request.use(
  (config) => {
    // Lấy accessToken từ storage memory
    const token = getAccessToken();

    // Nếu có token → gắn vào Authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Trả config để request tiếp tục
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// RESPONSE INTERCEPTOR - XỬ LÝ 401 + REFRESH TOKEN
// ============================================

apiClient.interceptors.response.use(
  // Nếu response thành công → trả thẳng
  (response) => response,

  // Nếu response lỗi → xử lý tại đây
  async (error: AxiosError) => {
    // Lấy request gốc
    // _retry dùng để tránh loop vô hạn
    const originalRequest =
      error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    /**
     * Chỉ xử lý khi:
     * - Status = 401 (Unauthorized)
     * - Request chưa từng retry
     */
    if (error.response?.status === 401 && !originalRequest._retry) {

      // ======================================================
      // CASE 1: ĐANG REFRESH TOKEN
      // ======================================================
      // → Đưa request vào queue để chờ token mới
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            // Khi có token mới → gắn lại header
            originalRequest.headers.Authorization = `Bearer ${token}`;
            // Retry request cũ
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      // ======================================================
      // CASE 2: CHƯA REFRESH → BẮT ĐẦU REFRESH
      // ======================================================

      originalRequest._retry = true; // Đánh dấu đã retry
      isRefreshing = true;           // Khoá refresh

      try {
        /**
         * Gọi API refresh token
         * - refreshToken được gửi tự động qua HttpOnly cookie
         * - Dùng axios thường để tránh interceptor loop
         */
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // Lưu accessToken mới
        setAccessToken(data.accessToken);

        // Giải phóng các request đang chờ trong queue
        processQueue(null, data.accessToken);

        // Retry lại request ban đầu với token mới
        originalRequest.headers.Authorization =
          `Bearer ${data.accessToken}`;

        return apiClient(originalRequest);

      } catch (refreshError) {
        // ======================================================
        // REFRESH THẤT BẠI → LOGOUT
        // ======================================================

        // Reject toàn bộ request đang chờ
        processQueue(refreshError, null);

        // Xoá token local
        clearTokens();

        // Redirect về trang login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);

      } finally {
        // Mở khoá refresh
        isRefreshing = false;
      }
    }

    // Các lỗi khác → trả lỗi gốc
    return Promise.reject(error);
  }
);

// Export apiClient để dùng toàn app
export default apiClient;
