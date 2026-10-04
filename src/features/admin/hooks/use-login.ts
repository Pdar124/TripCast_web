import { useMutation } from '@tanstack/react-query';

import { login } from '@/features/admin/api/admin-api';

export function useLogin() {
  return useMutation({ mutationFn: login });
}
