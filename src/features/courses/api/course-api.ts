import type {
  CourseRecommendation,
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

export async function getTourCourseWeather(id: string) {
  const response = await http.get<TourCourseWeather>(`/api/tour-courses/${id}/weather`);
  return response.data;
}

export async function getCourseRecommendations(limit: number) {
  const response = await http.get<CourseRecommendation[]>('/api/tour-courses/recommendations', {
    params: { limit },
  });
  return response.data;
}
