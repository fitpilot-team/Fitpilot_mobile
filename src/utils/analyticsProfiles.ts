/**
 * Analytics Profiles — Frontend adapter layer.
 *
 * Provides utilities to interpret the backend's AnalyticsProfile-aware
 * data and drive the UI without hardcoding metric meanings.
 */

import type {
  AnalyticsProfileId,
  AvailableMetric,
  ExerciseDetailMetric,
  ExerciseTrendDetail,
  ExerciseTrendPoint,
} from '../types';

// ---------------------------------------------------------------------------
// Profile configuration (client-side mirror of backend profiles)
// ---------------------------------------------------------------------------

export interface ProfileConfig {
  id: AnalyticsProfileId;
  label: string;
  primaryMetric: ExerciseDetailMetric;
  primaryUnit: string;
  showVolumeBars: boolean;
  showRepRangeBuckets: boolean;
  showEffortComparison: boolean;
  chartType: 'line_with_volume_bars' | 'line_only' | 'bar_chart';
}

const PROFILE_CONFIGS: Record<AnalyticsProfileId, ProfileConfig> = {
  double_progression_hypertrophy: {
    id: 'double_progression_hypertrophy',
    label: 'Doble progresión (hipertrofia)',
    primaryMetric: 'best_weight',
    primaryUnit: 'kg',
    showVolumeBars: true,
    showRepRangeBuckets: true,
    showEffortComparison: false,
    chartType: 'line_with_volume_bars',
  },
  percentage_1rm_strength: {
    id: 'percentage_1rm_strength',
    label: 'Fuerza (% 1RM)',
    primaryMetric: 'e1rm',
    primaryUnit: 'kg',
    showVolumeBars: false,
    showRepRangeBuckets: false,
    showEffortComparison: true,
    chartType: 'line_only',
  },
  rpe_strength: {
    id: 'rpe_strength',
    label: 'Fuerza (RPE/RIR)',
    primaryMetric: 'top_set_weight',
    primaryUnit: 'kg',
    showVolumeBars: false,
    showRepRangeBuckets: false,
    showEffortComparison: true,
    chartType: 'line_only',
  },
  bodyweight_progression: {
    id: 'bodyweight_progression',
    label: 'Peso corporal',
    primaryMetric: 'best_reps',
    primaryUnit: 'reps',
    showVolumeBars: false,
    showRepRangeBuckets: false,
    showEffortComparison: false,
    chartType: 'bar_chart',
  },
};

const DEFAULT_PROFILE: AnalyticsProfileId = 'double_progression_hypertrophy';

export const getProfileConfig = (
  profileId: AnalyticsProfileId | null | undefined,
): ProfileConfig => PROFILE_CONFIGS[profileId ?? DEFAULT_PROFILE] ?? PROFILE_CONFIGS[DEFAULT_PROFILE];

// ---------------------------------------------------------------------------
// Metric value extraction from a trend point
// ---------------------------------------------------------------------------

const METRIC_EXTRACTORS: Record<ExerciseDetailMetric, (p: ExerciseTrendPoint) => number | null | undefined> = {
  best_weight: (p) => p.best_weight_kg,
  volume: (p) => (p.volume_kg > 0 ? p.volume_kg : null),
  best_reps: (p) => p.best_reps,
  effort: (p) => p.avg_effort,
  e1rm: (p) => p.e1rm_kg,
  top_set_weight: (p) => p.top_set_weight_kg,
  total_reps: (p) => p.total_reps,
};

export const getMetricValue = (
  point: ExerciseTrendPoint,
  metricKey: ExerciseDetailMetric,
): number | null | undefined => {
  const extractor = METRIC_EXTRACTORS[metricKey];
  return extractor ? extractor(point) : null;
};

// ---------------------------------------------------------------------------
// Dynamic metric options from backend response
// ---------------------------------------------------------------------------

/**
 * Returns the metric options the UI should present as pills.
 * Uses backend `available_metrics` if present (Phase 2), otherwise
 * falls back to the static EXERCISE_DETAIL_METRIC_OPTIONS (Phase 1).
 */
export const getAvailableMetrics = (
  detail: ExerciseTrendDetail | null,
): AvailableMetric[] => {
  if (detail?.available_metrics && detail.available_metrics.length > 0) {
    return detail.available_metrics;
  }

  // Phase 1 fallback — static list
  return [
    { key: 'best_weight', label: 'Mejor carga', unit: 'kg', available: true },
    { key: 'volume', label: 'Volumen', unit: 'kg', available: true },
    { key: 'best_reps', label: 'Mejor reps', unit: 'reps', available: true },
    { key: 'effort', label: 'Esfuerzo', unit: '', available: true },
  ];
};

/**
 * Returns the default metric to show based on the backend response.
 */
export const getDefaultMetric = (
  detail: ExerciseTrendDetail | null,
): ExerciseDetailMetric => {
  if (detail?.default_metric) {
    return detail.default_metric;
  }

  const config = getProfileConfig(detail?.analytics_profile);
  return config.primaryMetric;
};

// ---------------------------------------------------------------------------
// Metric label / chart subtitle helpers
// ---------------------------------------------------------------------------

const METRIC_LABELS: Record<ExerciseDetailMetric, string> = {
  best_weight: 'Mejor carga',
  volume: 'Volumen',
  best_reps: 'Mejor reps',
  effort: 'Esfuerzo',
  e1rm: '1RM estimado',
  top_set_weight: 'Top set',
  total_reps: 'Total reps',
};

const METRIC_CHART_SUBTITLES: Record<ExerciseDetailMetric, string> = {
  best_weight:
    'La linea principal sigue la mejor carga registrada; las barras dejan ver el volumen por rango de reps.',
  volume: 'Volumen total (reps × kg) por sesion a lo largo del tiempo.',
  best_reps: 'Las repeticiones mas altas logradas en un set por sesion.',
  effort:
    'Esfuerzo promedio registrado (RIR/RPE) por sesion. Menor valor = mas cerca del fallo.',
  e1rm: '1RM estimado (Epley) basado en el top set de cada sesion. Util como tendencia relativa.',
  top_set_weight: 'Peso del top set (set con mayor carga) por sesion.',
  total_reps: 'Total de repeticiones completadas por sesion.',
};

export const getMetricLabel = (metric: ExerciseDetailMetric): string =>
  METRIC_LABELS[metric] ?? metric;

export const getMetricChartSubtitle = (metric: ExerciseDetailMetric): string =>
  METRIC_CHART_SUBTITLES[metric] ?? '';

export const getProfileContextCopy = (
  profileId: AnalyticsProfileId | null | undefined,
): string => {
  const profile = getProfileConfig(profileId);

  if (profile.id === 'percentage_1rm_strength') {
    return 'La progresion prioriza 1RM estimado, top set e intensidad relativa frente al volumen total.';
  }

  if (profile.id === 'rpe_strength') {
    return 'La lectura principal combina top set, esfuerzo real y adherencia a la prescripcion.';
  }

  if (profile.id === 'bodyweight_progression') {
    return 'La senal principal es reps y densidad; el peso externo deja de ser la metrica dominante.';
  }

  return 'La lectura principal sigue la mejor carga, pero mantiene el volumen repartido por rangos de reps.';
};

export const getProfilePrimaryMetricLabel = (
  profileId: AnalyticsProfileId | null | undefined,
): string => getMetricLabel(getProfileConfig(profileId).primaryMetric);

export const getPrimaryMetricPersonalBest = (
  detail: ExerciseTrendDetail | null,
): { label: string; value: number | null; unit: string } => {
  const profile = getProfileConfig(detail?.analytics_profile);
  const metric = profile.primaryMetric;
  const values = (detail?.series ?? [])
    .map((point) => getMetricValue(point, metric))
    .filter((value): value is number => value != null);

  return {
    label: getMetricLabel(metric),
    value: values.length ? Math.max(...values) : null,
    unit: profile.primaryUnit,
  };
};

// ---------------------------------------------------------------------------
// Format helpers for profile-aware display
// ---------------------------------------------------------------------------

export const formatMetricValue = (
  value: number | null | undefined,
  unit: string,
): string => {
  if (value == null || Number.isNaN(value)) {
    return '--';
  }

  const formatted =
    unit === 'reps'
      ? `${Math.round(value)}`
      : new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(value);

  return unit ? `${formatted} ${unit}` : formatted;
};
