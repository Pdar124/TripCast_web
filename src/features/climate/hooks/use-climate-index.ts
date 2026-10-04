import { useQuery } from '@tanstack/react-query';

import { getClimateIndexRange, getLatestClimateIndex } from '@/features/climate/api/climate-api';

export function useLatestClimateIndex(regionId: string) {
  return useQuery({
    enabled: Boolean(regionId),
    queryFn: () => getLatestClimateIndex(regionId),
    queryKey: ['climate-index', 'latest', regionId],
  });
}

export function useClimateIndexRange(regionId: string, from: string, to: string) {
  return useQuery({
    enabled: Boolean(regionId && from && to),
    queryFn: () => getClimateIndexRange(regionId, from, to),
    queryKey: ['climate-index', 'range', regionId, from, to],
  });
}
