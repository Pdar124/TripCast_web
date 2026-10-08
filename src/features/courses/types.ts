import type { components } from '@/types/api';

type Coordinate = number | null;

/**
 * 목록 응답에 추가될 좌표 필드. 백엔드 계약이 확정되기 전이라 선택 필드로 두며,
 * 값이 없으면 썸네일은 기존 대체 화면을 보여 준다.
 */
export type CourseStartEndCoordinates = {
  startLatitude?: Coordinate;
  startLongitude?: Coordinate;
  endLatitude?: Coordinate;
  endLongitude?: Coordinate;
};
export type CourseRepresentativeCoordinates = {
  representativeLatitude?: Coordinate;
  representativeLongitude?: Coordinate;
};

export type TourCourseSummary = components['schemas']['TourCourseSummaryResponse'] &
  CourseStartEndCoordinates;
export type CourseRecommendation = components['schemas']['CourseRecommendationResponse'] &
  CourseRepresentativeCoordinates;
export type TourCourseStop = components['schemas']['TourCourseStopResponse'];
export type Weather = components['schemas']['WeatherResponse'];
export type ClimateIndex = components['schemas']['ClimateIndexResponse'];

export type TourCourseStopWeather = {
  spot: TourCourseStop;
  climateIndex: ClimateIndex | null;
  weather: Weather | null;
};

export type TourCourseWeather = {
  courseId: number;
  sourceCourseId: string;
  stops: TourCourseStopWeather[];
};

export type TourCoursePage = {
  content: TourCourseSummary[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
