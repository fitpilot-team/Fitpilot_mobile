import type { GlucoseRecord } from '../types/healthMetrics';
import { getTodayDateInput, isValidMeasurementDateInput } from './measurements';

const longDateTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const shortDateTimeFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const TIME_INPUT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const padNumber = (value: number) => value.toString().padStart(2, '0');

const parseRecordedAt = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const getCurrentTimeInput = () => {
  const now = new Date();
  return `${padNumber(now.getHours())}:${padNumber(now.getMinutes())}`;
};

export const isValidTimeInput = (value: string) =>
  TIME_INPUT_REGEX.test(value.trim());

export const buildRecordedAtFromInputs = (
  dateInput: string,
  timeInput: string,
) => {
  const normalizedDateInput = dateInput.trim();
  const normalizedTimeInput = timeInput.trim();

  if (
    !isValidMeasurementDateInput(normalizedDateInput) ||
    !isValidTimeInput(normalizedTimeInput)
  ) {
    return null;
  }

  const [year, month, day] = normalizedDateInput
    .split('-')
    .map((segment) => Number.parseInt(segment, 10));
  const [hours, minutes] = normalizedTimeInput
    .split(':')
    .map((segment) => Number.parseInt(segment, 10));

  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
};

export const splitRecordedAtToLocalInputs = (value?: string | null) => {
  const parsedDate = parseRecordedAt(value);

  if (!parsedDate) {
    return {
      dateInput: getTodayDateInput(),
      timeInput: getCurrentTimeInput(),
    };
  }

  return {
    dateInput: `${parsedDate.getFullYear()}-${padNumber(parsedDate.getMonth() + 1)}-${padNumber(parsedDate.getDate())}`,
    timeInput: `${padNumber(parsedDate.getHours())}:${padNumber(parsedDate.getMinutes())}`,
  };
};

export const formatGlucoseRecordedAt = (
  value?: string | null,
  variant: 'long' | 'short' = 'long',
) => {
  const parsedDate = parseRecordedAt(value);

  if (!parsedDate) {
    return 'Sin fecha';
  }

  return variant === 'long'
    ? longDateTimeFormatter.format(parsedDate)
    : shortDateTimeFormatter.format(parsedDate);
};

export const hasAdditionalHealthMetrics = (
  record?:
    | Pick<
        GlucoseRecord,
        | 'systolic_mmhg'
        | 'diastolic_mmhg'
        | 'heart_rate_bpm'
        | 'oxygen_saturation_pct'
      >
    | null,
) =>
  Boolean(
    record &&
      (
        record.systolic_mmhg !== null ||
        record.diastolic_mmhg !== null ||
        record.heart_rate_bpm !== null ||
        record.oxygen_saturation_pct !== null
      ),
  );
