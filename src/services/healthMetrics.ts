import { nutritionClient } from './api';
import type {
  CreateOwnGlucosePayload,
  GlucoseListResponse,
  GlucoseRecord,
  UpdateOwnGlucosePayload,
} from '../types';

export const listMyGlucoseRecords = (
  page: number = 1,
  limit: number = 20,
): Promise<GlucoseListResponse> =>
  nutritionClient.get<GlucoseListResponse>('/client-health-metrics/me', {
    params: { page, limit },
  });

export const getMyGlucoseRecord = (recordId: string): Promise<GlucoseRecord> =>
  nutritionClient.get<GlucoseRecord>(`/client-health-metrics/me/${recordId}`);

export const createMyGlucoseRecord = (
  payload: CreateOwnGlucosePayload,
): Promise<GlucoseRecord> =>
  nutritionClient.post<GlucoseRecord>('/client-health-metrics/me', payload);

export const updateMyGlucoseRecord = (
  recordId: string,
  payload: UpdateOwnGlucosePayload,
): Promise<GlucoseRecord> =>
  nutritionClient.patch<GlucoseRecord>(
    `/client-health-metrics/me/${recordId}`,
    payload,
  );

export const deleteMyGlucoseRecord = (
  recordId: string,
): Promise<GlucoseRecord> =>
  nutritionClient.delete<GlucoseRecord>(`/client-health-metrics/me/${recordId}`);
