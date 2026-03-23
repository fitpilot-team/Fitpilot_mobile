import type { MeasurementPreference } from '../store/measurementPreferenceStore';

const KG_TO_LB = 2.2046226218;
const CM_TO_IN = 0.3937007874;
const MM_TO_IN = 0.0393700787;

const roundTo = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const normalizeUnit = (unit: string | null | undefined) => unit?.trim().toLowerCase() ?? null;

export const convertMeasurementUnitValue = (
  value: number,
  unit: string | null | undefined,
  preference: MeasurementPreference,
) => {
  const normalizedUnit = normalizeUnit(unit);

  if (preference !== 'us' || !normalizedUnit) {
    return { value, unit: unit?.trim() ?? null };
  }

  switch (normalizedUnit) {
    case 'kg':
      return {
        value: roundTo(value * KG_TO_LB, 2),
        unit: 'lb',
      };
    case 'cm':
      return {
        value: roundTo(value * CM_TO_IN, 2),
        unit: 'in',
      };
    case 'mm':
      return {
        value: roundTo(value * MM_TO_IN, 2),
        unit: 'in',
      };
    default:
      return { value, unit: unit?.trim() ?? null };
  }
};

export const convertMeasurementInputToMetricValue = (
  value: number,
  unit: string | null | undefined,
  preference: MeasurementPreference,
) => {
  if (preference !== 'us' || !unit) {
    return value;
  }

  switch (normalizeUnit(unit)) {
    case 'kg':
      return roundTo(value / KG_TO_LB, 4);
    case 'cm':
      return roundTo(value / CM_TO_IN, 4);
    case 'mm':
      return roundTo(value / MM_TO_IN, 4);
    default:
      return value;
  }
};

export const getMeasurementDisplayUnit = (
  unit: string | null | undefined,
  preference: MeasurementPreference,
) => convertMeasurementUnitValue(1, unit, preference).unit;
