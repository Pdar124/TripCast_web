import { useMutation } from '@tanstack/react-query';

import { syncClimateIndex } from '@/features/admin/api/admin-api';

export function useClimateIndexSync() {
  return useMutation({ mutationFn: syncClimateIndex });
}
