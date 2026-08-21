import type { Ionicons } from '@expo/vector-icons';

export type ConnectedHealthFeedbackRange = 7 | 14 | 30;

/**
 * Estado en el que está la integración, con la granularidad que la UI necesita para decir
 * algo accionable. Hasta ahora "sin permisos", "con permisos pero con la plataforma de
 * salud vacía" y "funcionando" eran indistinguibles: los tres acababan en el mismo empty
 * state genérico con un botón de Sincronizar que no arreglaba nada.
 */
export type ConnectedHealthConnectionState =
  | 'unavailable'
  | 'needs_update'
  | 'needs_install'
  | 'no_permissions'
  | 'no_source_data'
  | 'partial_permissions'
  | 'ok';

export type ConnectedHealthStateAction = 'permissions' | 'settings' | 'sync' | 'none';

export type ConnectedHealthStateCopy = {
  title: string;
  message: string;
  /** Versión de una línea, para la tarjeta compacta del dashboard. */
  compactMessage: string;
  action: ConnectedHealthStateAction;
};

export type ConnectedHealthReadinessStatus =
  | 'good'
  | 'watch'
  | 'low'
  | 'unknown';

export type ConnectedHealthInsightTone = 'positive' | 'warning' | 'neutral';

export type ConnectedHealthInsight = {
  id: string;
  title: string;
  message: string;
  tone: ConnectedHealthInsightTone;
  source: string;
  metricKeys: string[];
};

export type ConnectedHealthMetricKey =
  | 'recovery'
  | 'sleep'
  | 'active_energy'
  | 'total_energy'
  | 'steps'
  | 'distance'
  | 'hrv'
  | 'resting_hr';

export type ConnectedHealthMetricCard = {
  key: ConnectedHealthMetricKey;
  label: string;
  value: string;
  helper: string;
  trendLabel: string | null;
  icon: keyof typeof Ionicons.glyphMap;
  tone: ConnectedHealthInsightTone;
};

export type ConnectedHealthHistoryChartKind = 'bar' | 'line';

export type ConnectedHealthHistoryValueFormat =
  | 'score'
  | 'duration'
  | 'kcal'
  | 'count'
  | 'distance'
  | 'milliseconds'
  | 'bpm';

export type ConnectedHealthHistoryPoint = {
  date: string;
  value: number | null;
};

export type ConnectedHealthHistoryValuePoint = {
  date: string;
  value: number;
};

export type ConnectedHealthHistorySeries = {
  key: ConnectedHealthMetricKey;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  chartKind: ConnectedHealthHistoryChartKind;
  valueFormat: ConnectedHealthHistoryValueFormat;
  points: ConnectedHealthHistoryPoint[];
  latest: ConnectedHealthHistoryValuePoint | null;
  average: number | null;
  change: number | null;
};

export type ConnectedHealthHistoryModel = {
  range: ConnectedHealthFeedbackRange;
  series: ConnectedHealthHistorySeries[];
};

export type ConnectedHealthFeedbackModel = {
  range: ConnectedHealthFeedbackRange;
  hasData: boolean;
  // Distingue "hay datos de verdad" de "hay filas". Health Connect sintetiza un gasto
  // basal desde el perfil del usuario aunque no haya ningún dispositivo conectado, así
  // que hasData puede ser true con cero mediciones reales detrás.
  hasRealData: boolean;
  sourceLabel: string;
  latestSyncAt: string | null;
  freshnessLabel: string;
  isStale: boolean;
  latestDateLabel: string;
  readiness: {
    status: ConnectedHealthReadinessStatus;
    score: number | null;
    title: string;
    message: string;
  };
  metrics: ConnectedHealthMetricCard[];
  insights: ConnectedHealthInsight[];
  // Motivo del último sync fallido, tal y como lo guardó el backend. Se rellena solo
  // cuando latest_sync.status === 'failed'.
  lastSyncErrorMessage: string | null;
};
