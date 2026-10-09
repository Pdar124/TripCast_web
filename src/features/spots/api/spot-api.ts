import { http } from '@/shared/api/http';
import type {
  PageResponse,
  TourSpot,
  TourSpotCourse,
  TourSpotWeather,
} from '@/features/spots/types';

export const TOUR_SPOT_PAGE_SIZE = 20;

export type GetTourSpotsParams = {
  keyword: string;
  page: number;
  size?: number;
};

export async function getTourSpots({
  keyword,
  page,
  size = TOUR_SPOT_PAGE_SIZE,
}: GetTourSpotsParams) {
  const response = await http.get<PageResponse<TourSpot>>('/api/tour-spots', {
    params: { keyword, page, size },
  });
  return response.data;
}

export async function getTourSpotWeather(id: string) {
  const response = await http.get<TourSpotWeather>(`/api/tour-spots/${id}/weather`);
  return response.data;
}

export async function getTourSpotCourses(id: string) {
  const response = await http.get<TourSpotCourse[]>(`/api/tour-spots/${id}/courses`);
  return response.data;
}
