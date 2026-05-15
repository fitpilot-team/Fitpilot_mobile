export type FitpilotHealthPlatform = 'healthkit' | 'health_connect' | 'unsupported';

export type FitpilotHealthAvailability = {
  available: boolean;
  platform: FitpilotHealthPlatform;
  status: 'available' | 'unavailable' | 'needs_install' | 'unsupported';
  message?: string;
};

export type FitpilotHealthPermissionStatus = {
  platform: FitpilotHealthPlatform;
  granted: string[];
  missing: string[];
  requiresManualGrant?: boolean;
};

export type FitpilotHealthRecord = {
  type: string;
  start_at: string;
  end_at?: string | null;
  value?: number | null;
  unit?: string | null;
  external_id?: string | null;
  source_name?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type FitpilotHealthDailySummary = {
  date: string;
  active_energy_kcal?: number | null;
  basal_energy_kcal?: number | null;
  total_energy_kcal?: number | null;
  steps?: number | null;
  distance_m?: number | null;
  exercise_minutes?: number | null;
  sleep_minutes?: number | null;
  sleep_efficiency_pct?: number | null;
  resting_hr_bpm?: number | null;
  avg_hr_bpm?: number | null;
  hrv_ms?: number | null;
  systolic_avg_mmhg?: number | null;
  diastolic_avg_mmhg?: number | null;
  glucose_avg_mg_dl?: number | null;
  recovery_score?: number | null;
  flags?: string[];
  sources?: string[];
  metadata?: Record<string, unknown> | null;
};

export type FitpilotHealthSyncRange = {
  startAt: string;
  endAt: string;
};

export type FitpilotHealthSyncPayload = {
  platform: Exclude<FitpilotHealthPlatform, 'unsupported'>;
  from_at: string;
  to_at: string;
  permissions: string[];
  records: FitpilotHealthRecord[];
  daily_summaries: FitpilotHealthDailySummary[];
  metadata?: Record<string, unknown>;
};

export type FitpilotHealthModuleEvents = Record<string, never>;
