import type {
  CourseRecommendation,
  TourCourse,
  TourCoursePage,
  TourCourseWeather,
} from '@/features/courses/types';
import { http } from '@/shared/api/http';

export const TOUR_COURSE_PAGE_SIZE = 20;

export type GetTourCoursesParams = {
  page: number;
  size?: number;
};

export async function getTourCourses({ page, size = TOUR_COURSE_PAGE_SIZE }: GetTourCoursesParams) {
  const response = await http.get<TourCoursePage>('/api/tour-courses', {
    params: { page, size },
  });
  return response.data;
}

/** 코스·관광지 목록만 내려오는 DB 조회 API. 날씨는 포함하지 않는다. */
export async function getTourCourse(id: string) {
  const response = await http.get<TourCourse>(`/api/tour-courses/${id}`);
  return response.data;
}

/**
 * 서버가 기상청 호출을 정류지별로 최대 약 8초(동시 4개)까지 기다리므로,
 * 서버가 weather: null로 정리해 응답할 시간을 주도록 공통 타임아웃(10초)보다 길게 둔다.
 */
export const TOUR_COURSE_WEATHER_TIMEOUT_MS = 15_000;

export async function getTourCourseWeather(id: string) {
  const response = await http.get<TourCourseWeather>(`/api/tour-courses/${id}/weather`, {
    timeout: TOUR_COURSE_WEATHER_TIMEOUT_MS,
  });
  return response.data;
}

export async function getCourseRecommendations(limit: number) {
  const response = await http.get<CourseRecommendation[]>('/api/tour-courses/recommendations', {
    params: { limit },
  });
  return response.data;
}
