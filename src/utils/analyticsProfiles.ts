/**
 * Analytics Profiles - Frontend adapter layer.
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
  ExerciseTrendSummary,
  WorkoutAnalyticsMetricContext,
} from '../types';

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
    label: 'Doble progresion (hipertrofia)',
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

const METRIC_EXTRACTORS: Record<
  ExerciseDetailMetric,
  (point: ExerciseTrendPoint) => number | null | undefined
> = {
  best_weight: (point) => point.best_weight_kg,
  volume: (point) => (point.volume_kg > 0 ? point.volume_kg : null),
  best_reps: (point) => point.best_reps,
  effort: (point) => point.avg_effort,
  e1rm: (point) => point.e1rm_kg,
  top_set_weight: (point) => point.top_set_weight_kg,
  total_reps: (point) => point.total_reps,
};

const CONTEXTUAL_METRICS = new Set<ExerciseDetailMetric>([
  'best_weight',
  'best_reps',
  'e1rm',
  'top_set_weight',
]);

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
  volume: 'Volumen total (reps x kg) por sesion a lo largo del tiempo.',
  best_reps: 'Las repeticiones mas altas logradas en un set por sesion.',
  effort:
    'Esfuerzo promedio registrado (RIR/RPE) por sesion. Menor valor = mas cerca del fallo.',
  e1rm: '1RM estimado (Epley) basado en el top set de cada sesion. Util como tendencia relativa.',
  top_set_weight: 'Peso del top set (set con mayor carga) por sesion.',
  total_reps: 'Total de repeticiones completadas por sesion.',
};

export type MetricContextVariant =
  | 'list_compact'
  | 'summary_compact'
  | 'record_detail'
  | 'chart_weight_meta'
  | 'chart_reps_meta'
  | 'chart_default';

const formatContextWeight = (weightKg: number): string =>
  `${new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(weightKg)} kg`;

export const getProfileConfig = (
  profileId: AnalyticsProfileId | null | undefined,
): ProfileConfig => PROFILE_CONFIGS[profileId ?? DEFAULT_PROFILE] ?? PROFILE_CONFIGS[DEFAULT_PROFILE];

export const getMetricValue = (
  point: ExerciseTrendPoint,
  metricKey: ExerciseDetailMetric,
): number | null | undefined => {
  const extractor = METRIC_EXTRACTORS[metricKey];
  return extractor ? extractor(point) : null;
};

export const getPointMetricContext = (
  point: ExerciseTrendPoint | null | undefined,
  metricKey: ExerciseDetailMetric,
): WorkoutAnalyticsMetricContext | null => {
  if (!point || !CONTEXTUAL_METRICS.has(metricKey)) {
    return null;
  }

  return point.metric_contexts?.[metricKey] ?? null;
};

export const getSummaryMetricContext = (
  summary: ExerciseTrendSummary | null | undefined,
  kind: 'primary' | 'personal_best' = 'primary',
): WorkoutAnalyticsMetricContext | null => {
  if (!summary) {
    return null;
  }

  return kind === 'personal_best'
    ? summary.personal_best_context ?? null
    : summary.primary_metric_context ?? null;
};

export const formatMetricContext = (
  metricKey: ExerciseDetailMetric,
  context: WorkoutAnalyticsMetricContext | null | undefined,
  options?: { variant?: MetricContextVariant },
): string | null => {
  if (!context?.reps_exact) {
    return null;
  }

  const variant = options?.variant ?? 'chart_default';
  const parts: string[] = [];
  const weightKg = context.weight_kg;
  const hasWeight =
    metricKey === 'best_reps' &&
    typeof weightKg === 'number' &&
    weightKg > 0;

  if (variant === 'record_detail' && metricKey === 'e1rm') {
    return null;
  }

  if (hasWeight) {
    parts.push(formatContextWeight(weightKg));
  }

  if (
    (variant === 'record_detail' || variant === 'chart_reps_meta') &&
    metricKey === 'best_reps'
  ) {
    return parts.length ? parts.join(' · ') : null;
  }

  if (variant === 'chart_weight_meta' && metricKey === 'best_weight') {
    return `${context.reps_exact} reps`;
  }

  parts.push(`${context.reps_exact} reps`);

  const shouldIncludeBucket =
    Boolean(context.rep_bucket_label) &&
    (
      variant === 'list_compact' ||
      variant === 'summary_compact' ||
      (variant === 'chart_default' && metricKey !== 'best_reps')
    );

  if (shouldIncludeBucket && context.rep_bucket_label) {
    parts.push(
      variant === 'list_compact' || variant === 'summary_compact'
        ? context.rep_bucket_label
        : `rango ${context.rep_bucket_label}`,
    );
  }

  return parts.join(' · ');
};

export const getAvailableMetrics = (
  detail: ExerciseTrendDetail | null,
): AvailableMetric[] => {
  if (detail?.available_metrics && detail.available_metrics.length > 0) {
    return detail.available_metrics;
  }

  return [
    { key: 'best_weight', label: 'Mejor carga', unit: 'kg', available: true },
    { key: 'volume', label: 'Volumen', unit: 'kg', available: true },
    { key: 'best_reps', label: 'Mejor reps', unit: 'reps', available: true },
    { key: 'effort', label: 'Esfuerzo', unit: '', available: true },
  ];
};

export const getDefaultMetric = (
  detail: ExerciseTrendDetail | null,
): ExerciseDetailMetric => {
  if (detail?.default_metric) {
    return detail.default_metric;
  }

  const config = getProfileConfig(detail?.analytics_profile);
  return config.primaryMetric;
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
): {
  label: string;
  value: number | null;
  unit: string;
  context: WorkoutAnalyticsMetricContext | null;
} => {
  const profile = getProfileConfig(detail?.analytics_profile);
  const metric = profile.primaryMetric;
  let bestValue: number | null = null;
  let bestContext: WorkoutAnalyticsMetricContext | null = null;

  (detail?.series ?? []).forEach((point) => {
    const value = getMetricValue(point, metric);
    if (value == null || (bestValue != null && value < bestValue)) {
      return;
    }

    bestValue = value;
    bestContext = getPointMetricContext(point, metric);
  });

  return {
    label: getMetricLabel(metric),
    value: bestValue,
    unit: profile.primaryUnit,
    context: bestContext,
  };
};

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
