import { keepPreviousData, useQuery } from '@tanstack/react-query';

import {
  getTourCourses,
  TOUR_COURSE_PAGE_SIZE,
  type GetTourCoursesParams,
} from '@/features/courses/api/course-api';

export const courseQueryKeys = {
  all: ['tourCourses'] as const,
  list: ({ page, size = TOUR_COURSE_PAGE_SIZE }: GetTourCoursesParams) =>
    [...courseQueryKeys.all, 'list', page, size] as const,
  detail: (id: string) => [...courseQueryKeys.all, 'detail', id] as const,
  weather: (id: string) => [...courseQueryKeys.all, 'weather', id] as const,
  recommendations: (limit: number) => [...courseQueryKeys.all, 'recommendations', limit] as const,
};

export function useTourCourses(params: GetTourCoursesParams) {
  return useQuery({
    queryKey: courseQueryKeys.list(params),
    queryFn: () => getTourCourses(params),
    placeholderData: keepPreviousData,
  });
}
