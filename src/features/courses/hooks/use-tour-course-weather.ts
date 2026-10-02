import { useQuery } from '@tanstack/react-query';

import { getTourCourseWeather } from '@/features/courses/api/course-api';
import { courseQueryKeys } from '@/features/courses/hooks/use-tour-courses';

export function useTourCourseWeather(id: string | undefined) {
  return useQuery({
    queryKey: courseQueryKeys.weather(id ?? ''),
    queryFn: () => getTourCourseWeather(id!),
    enabled: Boolean(id),
  });
}
