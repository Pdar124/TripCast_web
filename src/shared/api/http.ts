import axios from 'axios';
import { toast } from 'sonner';

import { useAuthStore } from '@/features/admin/store/auth-store';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const { token, clearSession } = useAuthStore.getState();

      if (token) {
        clearSession();
        toast.error('세션이 만료되었습니다.', {
          description: '보안을 위해 자동 로그아웃되었습니다.',
        });
      }
    }

    return Promise.reject(error instanceof Error ? error : new Error('HTTP request failed'));
  },
);
