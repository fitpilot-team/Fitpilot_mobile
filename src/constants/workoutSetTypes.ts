import type { WorkoutSetSegmentInput, WorkoutSetType } from '../types';

export type WorkoutSetCaptureMode = 'single' | 'dynamic';

export type WorkoutSetTypeDefinition = {
  value: WorkoutSetType;
  label: string;
  shortLabel: string;
  description: string;
  captureHint: string;
  captureMode: WorkoutSetCaptureMode;
  minimumSegments: number;
};

export const WORKOUT_SET_TYPE_DEFINITIONS: Record<WorkoutSetType, WorkoutSetTypeDefinition> = {
  straight: {
    value: 'straight',
    label: 'Serie normal',
    shortLabel: 'NORMAL',
    description: 'Series estandar con descanso completo entre cada una.',
    captureHint: 'Registra una sola fase por serie.',
    captureMode: 'single',
    minimumSegments: 1,
  },
  rest_pause: {
    value: 'rest_pause',
    label: 'Rest-Pause',
    shortLabel: 'RP',
    description: 'Breves pausas para extender la serie con mas repeticiones efectivas.',
    captureHint: 'Registra cada mini-bloque como un segmento adicional.',
    captureMode: 'dynamic',
    minimumSegments: 2,
  },
  drop_set: {
    value: 'drop_set',
    label: 'Drop Set',
    shortLabel: 'DROP',
    description: 'Reduce el peso dentro de la misma serie para continuar acumulando fatiga.',
    captureHint: 'Registra varios segmentos y mantén el peso igual o menor en cada paso.',
    captureMode: 'dynamic',
    minimumSegments: 2,
  },
  top_set: {
    value: 'top_set',
    label: 'Top Set',
    shortLabel: 'TOP',
    description: 'Serie principal de mayor esfuerzo que marca la referencia de rendimiento.',
    captureHint: 'Registra una sola fase con tu mejor rendimiento planificado.',
    captureMode: 'single',
    minimumSegments: 1,
  },
  backoff: {
    value: 'backoff',
    label: 'Backoff Set',
    shortLabel: 'BACK',
    description: 'Serie de descarga con menos peso para sumar volumen despues de la top set.',
    captureHint: 'Registra una sola fase con la carga de descarga.',
    captureMode: 'single',
    minimumSegments: 1,
  },
  myo_reps: {
    value: 'myo_reps',
    label: 'Myo-Reps',
    shortLabel: 'MYO',
    description: 'Una serie activadora seguida de mini-series cortas con descansos minimos.',
    captureHint: 'Registra la activacion y despues cada mini-serie como un segmento.',
    captureMode: 'dynamic',
    minimumSegments: 2,
  },
  cluster: {
    value: 'cluster',
    label: 'Cluster Set',
    shortLabel: 'CL',
    description: 'Micro-pausas intra-serie para sostener mas repeticiones con carga alta.',
    captureHint: 'Registra cada cluster como un segmento independiente.',
    captureMode: 'dynamic',
    minimumSegments: 2,
  },
};

export const resolveWorkoutSetType = (value: WorkoutSetType | string | null | undefined): WorkoutSetType =>
  value && value in WORKOUT_SET_TYPE_DEFINITIONS
    ? (value as WorkoutSetType)
    : 'straight';

export const getWorkoutSetTypeDefinition = (
  value: WorkoutSetType | string | null | undefined,
): WorkoutSetTypeDefinition => WORKOUT_SET_TYPE_DEFINITIONS[resolveWorkoutSetType(value)];

export const usesSegmentedWorkoutCapture = (value: WorkoutSetType | string | null | undefined): boolean =>
  getWorkoutSetTypeDefinition(value).captureMode === 'dynamic';

export const validateSegmentedWeightFlow = (
  value: WorkoutSetType | string | null | undefined,
  segments: WorkoutSetSegmentInput[],
): string | null => {
  if (resolveWorkoutSetType(value) !== 'drop_set') {
    return null;
  }

  for (let index = 1; index < segments.length; index += 1) {
    const previousWeight = segments[index - 1]?.weight_kg ?? null;
    const currentWeight = segments[index]?.weight_kg ?? null;

    if (
      previousWeight != null &&
      currentWeight != null &&
      currentWeight > previousWeight
    ) {
      return 'En drop set el peso no puede subir entre segmentos.';
    }
  }

  return null;
};
