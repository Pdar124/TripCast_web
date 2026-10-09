import type { components } from '@/types/api';

export type TourSpot = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
};

export type PageResponse<T> = {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type Weather = {
  forecastDate?: string | null;
  forecastTime?: string | null;
  temperature?: number | null;
  rainProbability?: number | null;
  sky?: string | null;
};

export type ClimateIndex = {
  regionId?: string | null;
  date?: string | null;
  score?: number | null;
  grade?: string | null;
};

export type TourSpotWeather = {
  tourSpotId: number;
  tourSpotName: string;
  latitude: number;
  longitude: number;
  weather?: Weather | null;
  climateIndex?: ClimateIndex | null;
};

export type TourSpotCourse = components['schemas']['TourSpotCourseResponse'];
