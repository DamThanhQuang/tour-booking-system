/**
 * AUTH STORE (Zustand)
 * 
 * Tác dụng:
 * - Lưu user info và authentication state
 * - Global state: Dùng được ở mọi component
 * - Reactive: Component tự động re-render khi state thay đổi
 */

import { create } from 'zustand';

interface User {
  username: string;
  email: string;
  userGroup: 'Admin' | 'Business' | 'User';
  sub: string; // Cognito user ID
}

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: true, // Ban đầu là true để check silent refresh
  
  // Actions
  setUser: (user) => set({ 
    user, 
    isAuthenticated: true,
    isLoading: false 
  }),
  
  clearAuth: () => set({ 
    user: null, 
    isAuthenticated: false,
    isLoading: false 
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
}));