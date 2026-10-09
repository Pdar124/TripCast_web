import { useQuery } from '@tanstack/react-query';

import { getTourCourseWeather } from '@/features/courses/api/course-api';
import { courseQueryKeys } from '@/features/courses/hooks/use-tour-courses';

/** 서버 캐시(30분) 안에서는 값이 같으므로 같은 간격으로 다시 받지 않는다. */
const WEATHER_STALE_TIME_MS = 30 * 60_000;

export function useTourCourseWeather(id: string | undefined) {
  return useQuery({
    queryKey: courseQueryKeys.weather(id ?? ''),
    queryFn: () => getTourCourseWeather(id!),
    enabled: Boolean(id),
    staleTime: WEATHER_STALE_TIME_MS,
    // 느린 요청을 재시도하면 대기 시간이 두 배가 되므로 실패하면 바로 대체 문구를 보여 준다.
    retry: false,
  });
}
