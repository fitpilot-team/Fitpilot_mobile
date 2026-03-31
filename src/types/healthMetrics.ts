export type GlucoseContext = 'ayuno' | 'posprandial' | 'casual';

export type HealthMetricValue = string | number | null;

export interface GlucoseRecord {
  id: string;
  user_id: number;
  recorded_at: string | null;
  glucose_mg_dl: number | null;
  glucose_context: GlucoseContext | null;
  systolic_mmhg: number | null;
  diastolic_mmhg: number | null;
  heart_rate_bpm: number | null;
  oxygen_saturation_pct: HealthMetricValue;
  notes: string | null;
}

export interface GlucosePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GlucoseListResponse {
  data: GlucoseRecord[];
  pagination: GlucosePagination;
}

export interface CreateOwnGlucosePayload {
  recorded_at: string;
  glucose_mg_dl: number;
  glucose_context: GlucoseContext;
  notes?: string | null;
}

export interface UpdateOwnGlucosePayload {
  recorded_at?: string;
  glucose_mg_dl?: number;
  glucose_context?: GlucoseContext;
  notes?: string | null;
}
