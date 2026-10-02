import type { components } from '@/types/api';

export type TourCourseSummary = components['schemas']['TourCourseSummaryResponse'];
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
