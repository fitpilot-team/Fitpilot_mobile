import type {
  CreateOwnMeasurementPayload,
  MeasurementHistoryItem,
} from '../types/measurements';

export type MeasurementNumericFormKey = Exclude<
  keyof CreateOwnMeasurementPayload,
  'date' | 'notes'
>;
export type MeasurementHistoryFieldKey = keyof MeasurementHistoryItem;

export interface MeasurementFieldConfig<Key extends string = string> {
  key: Key;
  label: string;
  placeholder?: string;
  unit?: string;
  icon?: string;
  advanced?: boolean;
}

export interface MeasurementFieldSection<Key extends string = string> {
  title: string;
  description: string;
  fields: MeasurementFieldConfig<Key>[];
}

export const MEASUREMENT_NUMERIC_FORM_KEYS = [
  'weight_kg',
  'height_cm',
  'body_fat_pct',
  'upper_body_fat_pct',
  'lower_body_fat_pct',
  'fat_free_mass_kg',
  'muscle_mass_kg',
  'bone_mass_kg',
  'metabolic_age',
  'visceral_fat',
  'water_pct',
  'waist_cm',
  'hip_cm',
  'chest_cm',
  'cephalic_cm',
  'neck_cm',
  'relaxed_arm_midpoint_right_cm',
  'relaxed_arm_midpoint_left_cm',
  'contracted_arm_midpoint_right_cm',
  'contracted_arm_midpoint_left_cm',
  'forearm_right_cm',
  'forearm_left_cm',
  'wrist_right_cm',
  'wrist_left_cm',
  'mesosternal_cm',
  'umbilical_cm',
  'subgluteal_thigh_right_cm',
  'subgluteal_thigh_left_cm',
  'mid_thigh_right_cm',
  'mid_thigh_left_cm',
  'calf_right_cm',
  'calf_left_cm',
  'ankle_right_cm',
  'ankle_left_cm',
] as const satisfies readonly MeasurementNumericFormKey[];

export const SUMMARY_METRICS: (MeasurementFieldConfig<'weight_kg' | 'body_fat_pct' | 'muscle_mass_kg' | 'visceral_fat'> & {
    emphasizeDecrease?: boolean;
  })[] = [
  {
    key: 'weight_kg',
    label: 'Peso',
    unit: 'kg',
    icon: 'scale-outline',
    emphasizeDecrease: true,
  },
  {
    key: 'body_fat_pct',
    label: 'Grasa corporal',
    unit: '%',
    icon: 'body-outline',
    emphasizeDecrease: true,
  },
  {
    key: 'muscle_mass_kg',
    label: 'Masa muscular',
    unit: 'kg',
    icon: 'barbell-outline',
  },
  {
    key: 'visceral_fat',
    label: 'Grasa visceral',
    icon: 'scan-outline',
    emphasizeDecrease: true,
  },
];

export const BASE_MEASUREMENT_FIELDS: MeasurementFieldConfig<MeasurementNumericFormKey>[] = [
  { key: 'weight_kg', label: 'Peso', placeholder: '78.5', unit: 'kg' },
  { key: 'height_cm', label: 'Estatura', placeholder: '175', unit: 'cm' },
];

export const BIOIMPEDANCE_SECTIONS: MeasurementFieldSection<MeasurementNumericFormKey>[] = [
  {
    title: 'Composicion corporal',
    description: 'Datos que suele entregar una bascula de bioimpedancia.',
    fields: [
      {
        key: 'body_fat_pct',
        label: 'Grasa corporal',
        placeholder: '18.2',
        unit: '%',
      },
      {
        key: 'upper_body_fat_pct',
        label: 'Grasa corporal superior',
        placeholder: '17.4',
        unit: '%',
      },
      {
        key: 'lower_body_fat_pct',
        label: 'Grasa corporal inferior',
        placeholder: '19.1',
        unit: '%',
      },
      {
        key: 'fat_free_mass_kg',
        label: 'Masa libre de grasa',
        placeholder: '62.8',
        unit: 'kg',
      },
      {
        key: 'muscle_mass_kg',
        label: 'Masa muscular',
        placeholder: '34.1',
        unit: 'kg',
      },
      {
        key: 'bone_mass_kg',
        label: 'Masa osea',
        placeholder: '3.2',
        unit: 'kg',
      },
      {
        key: 'water_pct',
        label: 'Agua corporal',
        placeholder: '56.4',
        unit: '%',
      },
      {
        key: 'visceral_fat',
        label: 'Grasa visceral',
        placeholder: '8',
      },
      {
        key: 'metabolic_age',
        label: 'Edad metabolica',
        placeholder: '31',
        unit: 'anos',
      },
    ],
  },
];

export const PERIMETER_SECTIONS: MeasurementFieldSection<MeasurementNumericFormKey>[] = [
  {
    title: 'Tronco',
    description: 'Circunferencias centrales y del tronco.',
    fields: [
      {
        key: 'waist_cm',
        label: 'Cintura',
        placeholder: '82.0',
        unit: 'cm',
        icon: 'resize-outline',
      },
      {
        key: 'chest_cm',
        label: 'Pecho',
        placeholder: '102.0',
        unit: 'cm',
        icon: 'body-outline',
      },
      {
        key: 'mesosternal_cm',
        label: 'Mesoesternal',
        placeholder: '88.0',
        unit: 'cm',
        icon: 'body-outline',
      },
      {
        key: 'umbilical_cm',
        label: 'Umbilical',
        placeholder: '84.2',
        unit: 'cm',
        icon: 'body-outline',
      },
    ],
  },
  {
    title: 'Cabeza y miembro superior',
    description: 'Perimetros del tren superior y perimetro cefalico.',
    fields: [
      {
        key: 'cephalic_cm',
        label: 'Cefalico',
        placeholder: '56.2',
        unit: 'cm',
        icon: 'radio-button-on-outline',
      },
      {
        key: 'neck_cm',
        label: 'Cuello',
        placeholder: '34.8',
        unit: 'cm',
        icon: 'radio-button-on-outline',
      },
      {
        key: 'relaxed_arm_midpoint_right_cm',
        label: 'Brazo medio relajado Der.',
        placeholder: '29.7',
        unit: 'cm',
        icon: 'fitness-outline',
      },
      {
        key: 'relaxed_arm_midpoint_left_cm',
        label: 'Brazo medio relajado Izq.',
        placeholder: '29.4',
        unit: 'cm',
        icon: 'fitness-outline',
        advanced: true,
      },
      {
        key: 'contracted_arm_midpoint_right_cm',
        label: 'Brazo medio contraido Der.',
        placeholder: '31.4',
        unit: 'cm',
        icon: 'fitness-outline',
      },
      {
        key: 'contracted_arm_midpoint_left_cm',
        label: 'Brazo medio contraido Izq.',
        placeholder: '31.0',
        unit: 'cm',
        icon: 'fitness-outline',
        advanced: true,
      },
      {
        key: 'forearm_right_cm',
        label: 'Antebrazo Der.',
        placeholder: '26.3',
        unit: 'cm',
        icon: 'barbell-outline',
      },
      {
        key: 'forearm_left_cm',
        label: 'Antebrazo Izq.',
        placeholder: '26.0',
        unit: 'cm',
        icon: 'barbell-outline',
        advanced: true,
      },
      {
        key: 'wrist_right_cm',
        label: 'Muneca Der.',
        placeholder: '16.2',
        unit: 'cm',
        icon: 'watch-outline',
      },
      {
        key: 'wrist_left_cm',
        label: 'Muneca Izq.',
        placeholder: '16.0',
        unit: 'cm',
        icon: 'watch-outline',
        advanced: true,
      },
    ],
  },
  {
    title: 'Miembro inferior',
    description: 'Perimetros del tren inferior.',
    fields: [
      {
        key: 'hip_cm',
        label: 'Cadera',
        placeholder: '98.0',
        unit: 'cm',
        icon: 'ellipse-outline',
      },
      {
        key: 'subgluteal_thigh_right_cm',
        label: 'Muslo subglúteo Der.',
        placeholder: '57.1',
        unit: 'cm',
        icon: 'walk-outline',
      },
      {
        key: 'subgluteal_thigh_left_cm',
        label: 'Muslo subglúteo Izq.',
        placeholder: '56.9',
        unit: 'cm',
        icon: 'walk-outline',
        advanced: true,
      },
      {
        key: 'mid_thigh_right_cm',
        label: 'Muslo medio Der.',
        placeholder: '54.8',
        unit: 'cm',
        icon: 'walk-outline',
      },
      {
        key: 'mid_thigh_left_cm',
        label: 'Muslo medio Izq.',
        placeholder: '54.5',
        unit: 'cm',
        icon: 'walk-outline',
        advanced: true,
      },
      {
        key: 'calf_right_cm',
        label: 'Pantorrilla Der.',
        placeholder: '35.0',
        unit: 'cm',
        icon: 'walk-outline',
      },
      {
        key: 'calf_left_cm',
        label: 'Pantorrilla Izq.',
        placeholder: '34.8',
        unit: 'cm',
        icon: 'walk-outline',
        advanced: true,
      },
      {
        key: 'ankle_right_cm',
        label: 'Tobillo Der.',
        placeholder: '22.1',
        unit: 'cm',
        icon: 'walk-outline',
      },
      {
        key: 'ankle_left_cm',
        label: 'Tobillo Izq.',
        placeholder: '22.0',
        unit: 'cm',
        icon: 'walk-outline',
        advanced: true,
      },
    ],
  },
];

export const PERIMETER_CARD_FIELDS = PERIMETER_SECTIONS.flatMap(
  (section) => section.fields,
);

const roundTo = (value: number, decimals: number) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const getBodyMassIndexValue = (measurement: MeasurementHistoryItem) => {
  if (measurement.weight_kg === null || measurement.weight_kg === undefined) {
    return null;
  }

  if (measurement.height_cm === null || measurement.height_cm === undefined) {
    return null;
  }

  const weightKg = Number(measurement.weight_kg);
  const heightCm = Number(measurement.height_cm);

  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || heightCm <= 0) {
    return null;
  }

  const heightM = heightCm / 100;
  const bmiValue = weightKg / (heightM * heightM);

  return Number.isFinite(bmiValue) ? roundTo(bmiValue, 2) : null;
};

export type MeasurementProgressMetricKey =
  | (typeof SUMMARY_METRICS)[number]['key']
  | 'bmi'
  | (typeof PERIMETER_CARD_FIELDS)[number]['key'];

interface MeasurementProgressMetricBase
  extends MeasurementFieldConfig<MeasurementProgressMetricKey> {
  progressTitle: string;
  progressSubtitle: string;
  decimals?: number;
}

type DirectMeasurementProgressMetricConfig = MeasurementProgressMetricBase & {
  source: 'field';
  fieldKey: MeasurementHistoryFieldKey;
};

type DerivedMeasurementProgressMetricConfig = MeasurementProgressMetricBase & {
  source: 'derived';
  getValue: (measurement: MeasurementHistoryItem) => number | null;
};

export type MeasurementProgressMetricConfig =
  | DirectMeasurementProgressMetricConfig
  | DerivedMeasurementProgressMetricConfig;

export const DEFAULT_MEASUREMENT_PROGRESS_SUBTITLE =
  'Tendencia real, filtros por rango y detalle de cada registro.';

export const MEASUREMENT_PROGRESS_METRICS = [
  {
    key: 'weight_kg',
    source: 'field',
    fieldKey: 'weight_kg',
    label: 'Peso',
    unit: 'kg',
    icon: 'scale-outline',
    progressTitle: 'Progreso de peso',
    progressSubtitle: DEFAULT_MEASUREMENT_PROGRESS_SUBTITLE,
  },
  {
    key: 'body_fat_pct',
    source: 'field',
    fieldKey: 'body_fat_pct',
    label: 'Grasa corporal',
    unit: '%',
    icon: 'body-outline',
    progressTitle: 'Progreso de grasa corporal',
    progressSubtitle: DEFAULT_MEASUREMENT_PROGRESS_SUBTITLE,
  },
  {
    key: 'muscle_mass_kg',
    source: 'field',
    fieldKey: 'muscle_mass_kg',
    label: 'Masa muscular',
    unit: 'kg',
    icon: 'barbell-outline',
    progressTitle: 'Progreso de masa muscular',
    progressSubtitle: DEFAULT_MEASUREMENT_PROGRESS_SUBTITLE,
  },
  {
    key: 'bmi',
    source: 'derived',
    label: 'IMC',
    unit: 'kg/m2',
    icon: 'analytics-outline',
    progressTitle: 'Progreso de IMC',
    progressSubtitle: DEFAULT_MEASUREMENT_PROGRESS_SUBTITLE,
    decimals: 2,
    getValue: getBodyMassIndexValue,
  },
  ...PERIMETER_CARD_FIELDS.map((field) => ({
    ...field,
    source: 'field' as const,
    fieldKey: field.key,
    progressTitle: `Progreso de ${field.label.toLowerCase()}`,
    progressSubtitle: DEFAULT_MEASUREMENT_PROGRESS_SUBTITLE,
  })),
] satisfies MeasurementProgressMetricConfig[];

export const MEASUREMENT_PROGRESS_METRIC_MAP = Object.fromEntries(
  MEASUREMENT_PROGRESS_METRICS.map((metric) => [metric.key, metric]),
) as Record<MeasurementProgressMetricKey, MeasurementProgressMetricConfig>;

export const getMeasurementProgressMetricConfig = (metricKey?: string | null) => {
  if (!metricKey) {
    return null;
  }

  return MEASUREMENT_PROGRESS_METRIC_MAP[metricKey as MeasurementProgressMetricKey] ?? null;
};

export const DETAIL_MEASUREMENT_SECTIONS: MeasurementFieldSection<MeasurementHistoryFieldKey>[] = [
  {
    title: 'Datos base',
    description: 'Peso y estatura capturados.',
    fields: BASE_MEASUREMENT_FIELDS,
  },
  {
    title: 'Bioimpedancia',
    description: 'Composicion corporal disponible para este registro.',
    fields: BIOIMPEDANCE_SECTIONS.flatMap((section) => section.fields),
  },
  ...PERIMETER_SECTIONS,
  {
    title: 'Complementarios',
    description: 'Medidas adicionales relevantes para calculos disponibles.',
    fields: [
      {
        key: 'triceps_fold_mm',
        label: 'Pliegue tricipital',
        unit: 'mm',
      },
    ],
  },
];

const formFieldLabels = [
  { key: 'date', label: 'Fecha' },
  { key: 'notes', label: 'Notas' },
  ...BASE_MEASUREMENT_FIELDS,
  ...BIOIMPEDANCE_SECTIONS.flatMap((section) => section.fields),
  ...PERIMETER_SECTIONS.flatMap((section) => section.fields),
];

export const MEASUREMENT_FIELD_LABELS = Object.fromEntries(
  formFieldLabels.map((field) => [field.key, field.label]),
) as Record<string, string>;

export const RECENT_CALCULATION_CODES = [
  'bmi',
  'waist_height_ratio',
  'waist_hip_ratio',
] as const;

export type MeasurementCalculationGroup =
  | 'main'
  | 'ideal_weight'
  | 'special';

export interface MeasurementCalculationMetadata {
  label: string;
  patientLabel: string;
  order: number;
  group: MeasurementCalculationGroup;
  showInPrimarySummary: boolean;
  shortDescription?: string;
}

export const CALCULATION_METADATA: Record<
  string,
  MeasurementCalculationMetadata
> = {
  bmi: {
    label: 'IMC',
    patientLabel: 'Indice de masa corporal',
    order: 1,
    group: 'main',
    showInPrimarySummary: true,
    shortDescription: 'Relacion entre tu peso y estatura.',
  },
  waist_hip_ratio: {
    label: 'Indice cintura-cadera',
    patientLabel: 'Relacion cintura-cadera',
    order: 2,
    group: 'main',
    showInPrimarySummary: true,
    shortDescription: 'Ayuda a vigilar la distribucion de grasa corporal.',
  },
  waist_height_ratio: {
    label: 'Indice cintura-estatura',
    patientLabel: 'Relacion cintura-estatura',
    order: 3,
    group: 'main',
    showInPrimarySummary: true,
    shortDescription: 'Compara tu cintura con tu estatura.',
  },
  body_fat_pct_bioimpedance: {
    label: 'Grasa corporal',
    patientLabel: 'Grasa corporal estimada',
    order: 4,
    group: 'main',
    showInPrimarySummary: true,
    shortDescription: 'Estimacion de grasa total a partir de bioimpedancia.',
  },
  fat_mass_kg: {
    label: 'Masa grasa',
    patientLabel: 'Masa grasa',
    order: 5,
    group: 'main',
    showInPrimarySummary: true,
    shortDescription: 'Cantidad estimada de grasa corporal.',
  },
  lean_mass_kg: {
    label: 'Masa libre de grasa',
    patientLabel: 'Masa libre de grasa',
    order: 6,
    group: 'main',
    showInPrimarySummary: true,
    shortDescription: 'Peso estimado sin contar la grasa corporal.',
  },
  ideal_weight_robinson: {
    label: 'Peso ideal Robinson',
    patientLabel: 'Referencia Robinson',
    order: 7,
    group: 'ideal_weight',
    showInPrimarySummary: false,
  },
  ideal_weight_metropolitan: {
    label: 'Peso ideal Metropolitan',
    patientLabel: 'Referencia Metropolitan',
    order: 8,
    group: 'ideal_weight',
    showInPrimarySummary: false,
  },
  ideal_weight_hamwi: {
    label: 'Peso ideal Hamwi',
    patientLabel: 'Referencia Hamwi',
    order: 9,
    group: 'ideal_weight',
    showInPrimarySummary: false,
  },
  ideal_weight_lorentz: {
    label: 'Peso ideal Lorentz',
    patientLabel: 'Referencia Lorentz',
    order: 10,
    group: 'ideal_weight',
    showInPrimarySummary: false,
  },
  ideal_weight_traditional: {
    label: 'Peso ideal tradicional',
    patientLabel: 'Referencia tradicional',
    order: 11,
    group: 'ideal_weight',
    showInPrimarySummary: false,
  },
  frisancho_indicators: {
    label: 'Indicador Frisancho',
    patientLabel: 'Reserva muscular braquial',
    order: 12,
    group: 'special',
    showInPrimarySummary: true,
    shortDescription: 'Referencia de reserva muscular del brazo.',
  },
};
