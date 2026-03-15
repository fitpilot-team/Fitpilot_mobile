import type {
  MeasurementCalculationStatus,
  MeasurementHistoryFieldKey,
  MeasurementHistoryItem,
} from '../types/measurements';
import { getTodayDateKey } from './date';

const longDateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const roundTo = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const parseDateValue = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const normalizedValue = value.includes('T') ? value : `${value}T00:00:00`;
  const parsedDate = new Date(normalizedValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const parseMeasurementNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const normalized = value.trim();
    if (!normalized) {
      return null;
    }

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === 'object' && value !== null && 'toString' in value) {
    const parsed = Number.parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export const formatMeasurementNumber = (
  value: unknown,
  decimals = 1,
  fallback = '--',
) => {
  const parsedValue = parseMeasurementNumber(value);

  if (parsedValue === null) {
    return fallback;
  }

  if (Number.isInteger(parsedValue)) {
    return parsedValue.toString();
  }

  return parsedValue.toFixed(decimals).replace(/\.?0+$/, '');
};

export const getMeasurementDisplayDate = (measurement?: {
  date?: string | null;
  logged_at?: string | null;
}) => measurement?.date ?? measurement?.logged_at ?? null;

export const formatMeasurementDate = (
  value?: string | null,
  variant: 'long' | 'short' = 'long',
) => {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return 'Sin fecha';
  }

  return variant === 'long'
    ? longDateFormatter.format(parsedDate)
    : shortDateFormatter.format(parsedDate);
};

export const calculateMeasurementChange = (
  measurements: MeasurementHistoryItem[],
  fieldKey: MeasurementHistoryFieldKey,
) => {
  if (measurements.length < 2) {
    return null;
  }

  const currentValue = parseMeasurementNumber(measurements[0]?.[fieldKey]);
  if (currentValue === null) {
    return null;
  }

  const previousMeasurement = measurements
    .slice(1)
    .find((measurement) => parseMeasurementNumber(measurement[fieldKey]) !== null);

  if (!previousMeasurement) {
    return null;
  }

  const previousValue = parseMeasurementNumber(previousMeasurement[fieldKey]);
  if (previousValue === null) {
    return null;
  }

  return roundTo(currentValue - previousValue, 2);
};

export const isValidMeasurementDateInput = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return parseDateValue(value) !== null;
};

export const getTodayDateInput = () => {
  return getTodayDateKey();
};

export const getCalculationStatusLabel = (status: MeasurementCalculationStatus) => {
  if (status === 'computed') {
    return 'Calculado';
  }

  if (status === 'error') {
    return 'Error';
  }

  return 'Pendiente';
};
