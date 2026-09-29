import { useQuery } from '@tanstack/react-query';

import { getTourSpotWeather } from '@/features/spots/api/spot-api';
import { spotQueryKeys } from '@/features/spots/hooks/use-tour-spots';

export function useTourSpotWeather(id: string | undefined) {
  return useQuery({
    queryKey: spotQueryKeys.detail(id ?? ''),
    queryFn: () => getTourSpotWeather(id!),
    enabled: Boolean(id),
  });
}
