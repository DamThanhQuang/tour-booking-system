/**
 * AUTH HOOK
 * 
 * Tác dụng:
 * - Custom hook tiện dụng để dùng trong components
 * - Wrapper cho Zustand store + API functions
 */

import { useAuthStore } from '@/stores/authStore';
import * as authApi from '@/api/auth';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  const login = async (username: string, password: string) => {
    try {
      await authApi.signIn({ username, password });
      router.push('/dashboard'); // Redirect sau khi login
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = async () => {
    await authApi.signOut();
    router.push('/login');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};