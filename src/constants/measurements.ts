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
  'relaxed_arm_midpoint_cm',
  'contracted_arm_midpoint_cm',
  'forearm_cm',
  'wrist_cm',
  'mesosternal_cm',
  'umbilical_cm',
  'arm_left_cm',
  'arm_right_cm',
  'mid_thigh_cm',
  'calf_cm',
  'thigh_left_cm',
  'thigh_right_cm',
  'calf_left_cm',
  'calf_right_cm',
] as const satisfies readonly MeasurementNumericFormKey[];

export const SUMMARY_METRICS: Array<
  MeasurementFieldConfig<'weight_kg' | 'body_fat_pct' | 'muscle_mass_kg'> & {
    emphasizeDecrease?: boolean;
  }
> = [
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
        key: 'hip_cm',
        label: 'Cadera',
        placeholder: '98.0',
        unit: 'cm',
        icon: 'ellipse-outline',
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
        key: 'arm_left_cm',
        label: 'Brazo izquierdo',
        placeholder: '30.1',
        unit: 'cm',
        icon: 'fitness-outline',
      },
      {
        key: 'arm_right_cm',
        label: 'Brazo derecho',
        placeholder: '30.6',
        unit: 'cm',
        icon: 'fitness-outline',
      },
      {
        key: 'relaxed_arm_midpoint_cm',
        label: 'Brazo relajado',
        placeholder: '29.7',
        unit: 'cm',
        icon: 'fitness-outline',
      },
      {
        key: 'contracted_arm_midpoint_cm',
        label: 'Brazo contraido',
        placeholder: '31.4',
        unit: 'cm',
        icon: 'fitness-outline',
      },
      {
        key: 'forearm_cm',
        label: 'Antebrazo',
        placeholder: '26.3',
        unit: 'cm',
        icon: 'barbell-outline',
      },
      {
        key: 'wrist_cm',
        label: 'Muneca',
        placeholder: '16.2',
        unit: 'cm',
        icon: 'watch-outline',
      },
    ],
  },
  {
    title: 'Miembro inferior',
    description: 'Perimetros del tren inferior.',
    fields: [
      {
        key: 'mid_thigh_cm',
        label: 'Muslo medio',
        placeholder: '54.8',
        unit: 'cm',
        icon: 'walk-outline',
      },
      {
        key: 'thigh_left_cm',
        label: 'Muslo izquierdo',
        placeholder: '55.1',
        unit: 'cm',
        icon: 'walk-outline',
      },
      {
        key: 'thigh_right_cm',
        label: 'Muslo derecho',
        placeholder: '55.4',
        unit: 'cm',
        icon: 'walk-outline',
      },
      {
        key: 'calf_cm',
        label: 'Pantorrilla',
        placeholder: '35.0',
        unit: 'cm',
        icon: 'walk-outline',
      },
      {
        key: 'calf_left_cm',
        label: 'Pantorrilla izquierda',
        placeholder: '35.2',
        unit: 'cm',
        icon: 'walk-outline',
      },
      {
        key: 'calf_right_cm',
        label: 'Pantorrilla derecha',
        placeholder: '35.1',
        unit: 'cm',
        icon: 'walk-outline',
      },
    ],
  },
];

export const PERIMETER_CARD_FIELDS = PERIMETER_SECTIONS.flatMap(
  (section) => section.fields,
);

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

export const CALCULATION_METADATA: Record<
  string,
  { label: string; order: number }
> = {
  bmi: { label: 'IMC', order: 1 },
  waist_hip_ratio: { label: 'Indice cintura-cadera', order: 2 },
  waist_height_ratio: { label: 'Indice cintura-estatura', order: 3 },
  body_fat_pct_bioimpedance: { label: 'Grasa corporal', order: 4 },
  fat_mass_kg: { label: 'Masa grasa', order: 5 },
  lean_mass_kg: { label: 'Masa libre de grasa', order: 6 },
  ideal_weight_robinson: { label: 'Peso ideal Robinson', order: 7 },
  ideal_weight_metropolitan: { label: 'Peso ideal Metropolitan', order: 8 },
  ideal_weight_hamwi: { label: 'Peso ideal Hamwi', order: 9 },
  ideal_weight_lorentz: { label: 'Peso ideal Lorentz', order: 10 },
  ideal_weight_traditional: { label: 'Peso ideal tradicional', order: 11 },
  frisancho_indicators: { label: 'Indicador Frisancho', order: 12 },
};
