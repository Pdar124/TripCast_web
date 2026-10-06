import { useQuery } from '@tanstack/react-query';

import {
  getClimateIndexRange,
  getLatestClimateIndex,
  getRegions,
} from '@/features/climate/api/climate-api';

const REGION_ID_PATTERN = /^\d{10}$/;

export function useRegions() {
  return useQuery({
    queryFn: getRegions,
    queryKey: ['regions'],
    staleTime: 60 * 60 * 1000,
  });
}

export function useLatestClimateIndex(regionId: string) {
  return useQuery({
    enabled: REGION_ID_PATTERN.test(regionId),
    queryFn: () => getLatestClimateIndex(regionId),
    queryKey: ['climate-index', 'latest', regionId],
  });
}

export function useClimateIndexRange(regionId: string, from: string, to: string) {
  return useQuery({
    enabled: REGION_ID_PATTERN.test(regionId) && Boolean(from && to),
    queryFn: () => getClimateIndexRange(regionId, from, to),
    queryKey: ['climate-index', 'range', regionId, from, to],
  });
}
