import { useQuery } from '@tanstack/react-query';

import { getTourCourse } from '@/features/courses/api/course-api';
import { courseQueryKeys } from '@/features/courses/hooks/use-tour-courses';

export function useTourCourse(id: string | undefined) {
  return useQuery({
    queryKey: courseQueryKeys.detail(id ?? ''),
    queryFn: () => getTourCourse(id!),
    enabled: Boolean(id),
  });
}
