export type MeasurementValue = string | number | null;

export interface MeasurementHistoryItem {
  id: string;
  user_id: number;
  date: string | null;
  logged_at?: string | null;
  weight_kg?: MeasurementValue;
  height_cm?: MeasurementValue;
  body_fat_pct?: MeasurementValue;
  upper_body_fat_pct?: MeasurementValue;
  lower_body_fat_pct?: MeasurementValue;
  fat_free_mass_kg?: MeasurementValue;
  muscle_mass_kg?: MeasurementValue;
  bone_mass_kg?: MeasurementValue;
  metabolic_age?: number | null;
  visceral_fat?: MeasurementValue;
  water_pct?: MeasurementValue;
  waist_cm?: MeasurementValue;
  hip_cm?: MeasurementValue;
  chest_cm?: MeasurementValue;
  cephalic_cm?: MeasurementValue;
  neck_cm?: MeasurementValue;
  relaxed_arm_midpoint_left_cm?: MeasurementValue;
  relaxed_arm_midpoint_right_cm?: MeasurementValue;
  contracted_arm_midpoint_left_cm?: MeasurementValue;
  contracted_arm_midpoint_right_cm?: MeasurementValue;
  forearm_left_cm?: MeasurementValue;
  forearm_right_cm?: MeasurementValue;
  wrist_left_cm?: MeasurementValue;
  wrist_right_cm?: MeasurementValue;
  mesosternal_cm?: MeasurementValue;
  umbilical_cm?: MeasurementValue;
  biacromial_cm?: MeasurementValue;
  biiliocrestal_cm?: MeasurementValue;
  foot_length_cm?: MeasurementValue;
  thorax_transverse_cm?: MeasurementValue;
  thorax_anteroposterior_cm?: MeasurementValue;
  humerus_biepicondylar_cm?: MeasurementValue;
  wrist_bistyloid_cm?: MeasurementValue;
  femur_biepicondylar_cm?: MeasurementValue;
  bimaleolar_cm?: MeasurementValue;
  foot_transverse_cm?: MeasurementValue;
  hand_length_cm?: MeasurementValue;
  hand_transverse_cm?: MeasurementValue;
  subgluteal_thigh_left_cm?: MeasurementValue;
  subgluteal_thigh_right_cm?: MeasurementValue;
  mid_thigh_left_cm?: MeasurementValue;
  mid_thigh_right_cm?: MeasurementValue;
  calf_left_cm?: MeasurementValue;
  calf_right_cm?: MeasurementValue;
  ankle_left_cm?: MeasurementValue;
  ankle_right_cm?: MeasurementValue;
  subscapular_fold_mm?: MeasurementValue;
  triceps_fold_mm?: MeasurementValue;
  biceps_fold_mm?: MeasurementValue;
  iliac_crest_fold_mm?: MeasurementValue;
  supraspinal_fold_mm?: MeasurementValue;
  abdominal_fold_mm?: MeasurementValue;
  front_thigh_fold_mm?: MeasurementValue;
  medial_calf_fold_mm?: MeasurementValue;
  mid_axillary_fold_mm?: MeasurementValue;
  pectoral_fold_mm?: MeasurementValue;
  notes?: string | null;
  recorded_by_user_id?: number | null;
  appointment_id?: number | null;
}

export type MeasurementHistoryFieldKey = keyof MeasurementHistoryItem;

export interface MeasurementPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface MeasurementHistoryResponse {
  data: MeasurementHistoryItem[];
  pagination: MeasurementPagination;
}

export type MeasurementCalculationStatus = 'computed' | 'skipped' | 'error';

export interface MeasurementCalculationValue {
  value: number | null;
  unit: string | null;
  method: string;
  formulaVersion: string;
  status: MeasurementCalculationStatus;
  details?: Record<string, unknown> | null;
}

export interface MeasurementWarning {
  code: string;
  calculation: string;
  message: string;
  missingFields?: string[];
}

export interface MeasurementChartEntry {
  key: string;
  label: string;
  kind: 'patient' | 'theoretical';
  value: number;
  deltaFromPatient: number | null;
}

export interface MeasurementIdealWeightComparisonChart {
  chartType: 'horizontal_bar';
  unit: 'kg';
  patientWeight: number | null;
  theoreticalWeightAverage: number | null;
  theoreticalWeightRange: {
    min: number;
    max: number;
  } | null;
  entries: MeasurementChartEntry[];
}

export interface MeasurementCharts {
  idealWeightComparison: MeasurementIdealWeightComparisonChart | null;
}

export interface MeasurementCalculationRun {
  id: string;
  engineVersion: string;
  status: 'completed' | 'partial' | 'failed' | 'running';
  startedAt: string;
  finishedAt: string | null;
}

export interface MeasurementDetail {
  measurement: MeasurementHistoryItem;
  calculations: Record<string, MeasurementCalculationValue>;
  warnings: MeasurementWarning[];
  missingFieldsByCalculation: Record<string, string[]>;
  charts: MeasurementCharts;
  calculationRun: MeasurementCalculationRun | null;
}

export interface CreateOwnMeasurementPayload {
  date: string;
  weight_kg?: number;
  height_cm?: number;
  body_fat_pct?: number;
  upper_body_fat_pct?: number;
  lower_body_fat_pct?: number;
  fat_free_mass_kg?: number;
  muscle_mass_kg?: number;
  bone_mass_kg?: number;
  metabolic_age?: number;
  visceral_fat?: number;
  water_pct?: number;
  waist_cm?: number;
  hip_cm?: number;
  chest_cm?: number;
  cephalic_cm?: number;
  neck_cm?: number;
  relaxed_arm_midpoint_left_cm?: number;
  relaxed_arm_midpoint_right_cm?: number;
  contracted_arm_midpoint_left_cm?: number;
  contracted_arm_midpoint_right_cm?: number;
  forearm_left_cm?: number;
  forearm_right_cm?: number;
  wrist_left_cm?: number;
  wrist_right_cm?: number;
  mesosternal_cm?: number;
  umbilical_cm?: number;
  subgluteal_thigh_left_cm?: number;
  subgluteal_thigh_right_cm?: number;
  mid_thigh_left_cm?: number;
  mid_thigh_right_cm?: number;
  calf_left_cm?: number;
  calf_right_cm?: number;
  ankle_left_cm?: number;
  ankle_right_cm?: number;
  notes?: string;
}
