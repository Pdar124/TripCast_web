import type { components } from '@/types/api';

export type ClimateIndex = components['schemas']['ClimateIndexResponse'];

export type Region = {
  regionId: string;
  name: string;
  sidoName: string;
  displayName: string;
};
