import { useQuery } from '@tanstack/react-query';

import { getTourSpotCourses } from '@/features/spots/api/spot-api';
import { spotQueryKeys } from '@/features/spots/hooks/use-tour-spots';

export function useTourSpotCourses(id: string | undefined) {
  return useQuery({
    queryKey: spotQueryKeys.courses(id ?? ''),
    queryFn: () => getTourSpotCourses(id!),
    enabled: Boolean(id),
  });
}
