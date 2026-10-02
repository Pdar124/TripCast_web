import type { components } from '@/types/api';

export type TourCourseSummary = components['schemas']['TourCourseSummaryResponse'];

export type TourCoursePage = {
  content: TourCourseSummary[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
