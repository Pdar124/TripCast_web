import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  getTourSpots,
  TOUR_SPOT_PAGE_SIZE,
  type GetTourSpotsParams,
} from '@/features/spots/api/spot-api';

export const spotQueryKeys = {
  all: ['tourSpots'] as const,
  list: ({ keyword, page, size = TOUR_SPOT_PAGE_SIZE }: GetTourSpotsParams) =>
    [...spotQueryKeys.all, 'list', keyword, page, size] as const,
  detail: (id: string) => [...spotQueryKeys.all, 'detail', id] as const,
};

export function useTourSpots(params: GetTourSpotsParams) {
  return useQuery({
    queryKey: spotQueryKeys.list(params),
    queryFn: () => getTourSpots(params),
    placeholderData: keepPreviousData,
  });
}
