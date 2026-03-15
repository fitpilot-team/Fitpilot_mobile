import { nutritionClient } from './api';
import type {
  CreateOwnMeasurementPayload,
  MeasurementDetail,
  MeasurementHistoryResponse,
} from '../types';

export const listMyMeasurements = (
  page: number = 1,
  limit: number = 20,
): Promise<MeasurementHistoryResponse> =>
  nutritionClient.get<MeasurementHistoryResponse>('/measurements/me', {
    params: { page, limit },
  });

export const getMyMeasurementDetail = (
  measurementId: string,
): Promise<MeasurementDetail> =>
  nutritionClient.get<MeasurementDetail>(`/measurements/me/${measurementId}`);

export const createMyMeasurement = (
  payload: CreateOwnMeasurementPayload,
): Promise<MeasurementDetail> =>
  nutritionClient.post<MeasurementDetail>('/measurements/me', payload);
