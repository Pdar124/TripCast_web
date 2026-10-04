import type { components } from '@/types/api';

export type LoginCredentials = components['schemas']['LoginRequest'];
export type LoginResponse = components['schemas']['LoginResponse'];

export type ClimateIndexSyncResult = {
  requestedRegions: number;
  successfulRegions: number;
  savedRecords: number;
  failedRegions: number;
};
