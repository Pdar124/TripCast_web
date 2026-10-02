import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { getCourseRecommendations } from '@/features/courses/api/course-api';
import { courseQueryKeys } from '@/features/courses/hooks/use-tour-courses';

export function useCourseRecommendations(limit: number) {
  return useQuery({
    queryKey: courseQueryKeys.recommendations(limit),
    queryFn: () => getCourseRecommendations(limit),
    placeholderData: keepPreviousData,
  });
}
