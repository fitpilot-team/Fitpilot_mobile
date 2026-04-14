import type { GlucoseContext } from '../types/healthMetrics';

export const GLUCOSE_CONTEXT_OPTIONS: {
  value: GlucoseContext;
  label: string;
}[] = [
  { value: 'ayuno', label: 'Ayuno' },
  { value: 'posprandial', label: 'Posprandial' },
  { value: 'casual', label: 'Casual' },
];

export const GLUCOSE_CONTEXT_LABELS: Record<GlucoseContext, string> = {
  ayuno: 'Ayuno',
  posprandial: 'Posprandial',
  casual: 'Casual',
};
