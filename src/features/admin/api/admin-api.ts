import type { LoginCredentials, LoginResponse } from '@/features/admin/types';
import { http } from '@/shared/api/http';

export async function login(credentials: LoginCredentials) {
  const response = await http.post<LoginResponse>('/api/auth/login', credentials);
  return response.data;
}
