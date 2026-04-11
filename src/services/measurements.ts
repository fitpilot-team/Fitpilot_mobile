import { nutritionClient } from './api';
import type {
  CreateOwnMeasurementPayload,
  MeasurementDetail,
  MeasurementHistoryResponse,
} from '../types';

export const listMyMeasurements = (
  page: number = 1,
  limit: number = 20,
  options?: {
    skipErrorLogging?: boolean;
  },
): Promise<MeasurementHistoryResponse> =>
  nutritionClient.get<MeasurementHistoryResponse>('/measurements/me', {
    params: { page, limit },
    skipErrorLogging: options?.skipErrorLogging,
  });

export const getMyMeasurementDetail = (
  measurementId: string,
): Promise<MeasurementDetail> =>
  nutritionClient.get<MeasurementDetail>(`/measurements/me/${measurementId}`);

export const createMyMeasurement = (
  payload: CreateOwnMeasurementPayload,
): Promise<MeasurementDetail> =>
  nutritionClient.post<MeasurementDetail>('/measurements/me', payload);

export const updateMyMeasurement = (
  measurementId: string,
  payload: CreateOwnMeasurementPayload,
): Promise<MeasurementDetail> =>
  nutritionClient.patch<MeasurementDetail>(
    `/measurements/me/${measurementId}`,
    payload,
  );
