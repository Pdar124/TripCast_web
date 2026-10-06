import type { ClimateIndex, Region } from '@/features/climate/types';
import { http } from '@/shared/api/http';

export async function getRegions() {
  const response = await http.get<Region[]>('/api/regions');
  return response.data;
}

export async function getLatestClimateIndex(regionId: string) {
  const response = await http.get<ClimateIndex>(`/api/regions/${regionId}/climate-index`);
  return response.data;
}

export async function getClimateIndexRange(regionId: string, from: string, to: string) {
  const response = await http.get<ClimateIndex[]>(`/api/regions/${regionId}/climate-index/range`, {
    params: { from, to },
  });
  return response.data;
}
