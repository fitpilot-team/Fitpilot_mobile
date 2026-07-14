import type { Ionicons } from '@expo/vector-icons';

export type ConnectedHealthFeedbackRange = 7 | 14 | 30;

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
};
