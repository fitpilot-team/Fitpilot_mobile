import type { FitpilotHealthSnapshot } from '../../modules/fitpilot-health';
import type {
  ConnectedHealthDailySummary,
  ConnectedHealthSummaryResponse,
} from '../services/connectedHealth';

/**
 * Métricas que MIDE el dispositivo. Aquí manda el teléfono: es la fuente original y la que
 * el usuario ve también en Salud / Health Connect, así que si difieren es porque el backend
 * está desfasado, no porque tenga mejor información.
 */
const DEVICE_OWNED_FIELDS = [
  'active_energy_kcal',
  'basal_energy_kcal',
  'total_energy_kcal',
  'steps',
  'distance_m',
  'exercise_minutes',
  'sleep_minutes',
  'resting_hr_bpm',
  'avg_hr_bpm',
  'hrv_ms',
  'systolic_avg_mmhg',
  'diastolic_avg_mmhg',
  'glucose_avg_mg_dl',
] as const;

/**
 * Lo que el backend CALCULA (recovery_score, sleep_efficiency_pct, flags, recomendaciones)
 * no se toca: depende de fusionar ambas plataformas y del histórico completo, que el
 * dispositivo no tiene. Se refresca en el siguiente sync.
 *
 * El reparto es deliberado: el número grande de cada tarjeta sale siempre de la misma
 * fuente, así que nunca cambia de valor delante del usuario cuando responde la red.
 */
const isPresent = (value: unknown): value is number =>
  value !== null && value !== undefined;

const emptySummaryForDate = (date: string): ConnectedHealthDailySummary => ({
  date,
  active_energy_kcal: null,
  basal_energy_kcal: null,
  total_energy_kcal: null,
  steps: null,
  distance_m: null,
  exercise_minutes: null,
  sleep_minutes: null,
  sleep_efficiency_pct: null,
  resting_hr_bpm: null,
  avg_hr_bpm: null,
  hrv_ms: null,
  systolic_avg_mmhg: null,
  diastolic_avg_mmhg: null,
  glucose_avg_mg_dl: null,
  recovery_score: null,
  flags: [],
  sources: [],
});

const mergeSources = (backend: string[], device: string[] | undefined) =>
  Array.from(new Set([...(device ?? []), ...backend]));

/** ¿El snapshot trae al menos una medición real (ni basal ni total sintéticos)? */
export const snapshotHasRealData = (snapshot: FitpilotHealthSnapshot | null): boolean =>
  (snapshot?.daily_summaries ?? []).some((day) =>
    [
      day.active_energy_kcal,
      day.steps,
      day.distance_m,
      day.exercise_minutes,
      day.sleep_minutes,
      day.resting_hr_bpm,
      day.avg_hr_bpm,
      day.hrv_ms,
    ].some(isPresent),
  );

/**
 * Superpone la lectura del dispositivo sobre el resumen del backend.
 *
 * Un `null` del dispositivo NUNCA borra un valor del backend: puede significar "ese tipo no
 * se leyó" tanto como "no hay dato", y el backend sí sabe distinguirlo.
 */
export const mergeDeviceSnapshotIntoSummary = (
  backendSummary: ConnectedHealthSummaryResponse | null,
  snapshot: FitpilotHealthSnapshot | null,
  nowMs = Date.now(),
): ConnectedHealthSummaryResponse | null => {
  if (!snapshot?.daily_summaries.length) {
    return backendSummary;
  }

  const byDate = new Map<string, ConnectedHealthDailySummary>(
    (backendSummary?.summaries ?? []).map((day) => [day.date, day]),
  );

  for (const deviceDay of snapshot.daily_summaries) {
    if (!deviceDay?.date) {
      continue;
    }

    const base = byDate.get(deviceDay.date) ?? emptySummaryForDate(deviceDay.date);
    const merged: ConnectedHealthDailySummary = { ...base };

    for (const field of DEVICE_OWNED_FIELDS) {
      const deviceValue = deviceDay[field];
      if (isPresent(deviceValue)) {
        merged[field] = deviceValue;
      }
    }

    merged.sources = mergeSources(base.sources, deviceDay.sources);
    byDate.set(deviceDay.date, merged);
  }

  const summaries = Array.from(byDate.values()).sort((left, right) =>
    right.date.localeCompare(left.date),
  );

  // La "última lectura" pasa a ser ahora: los datos vienen del dispositivo en este instante,
  // no del último viaje al backend. Solo cuando el snapshot aporta algo real — marcar
  // "actualizado" sobre la nada es justo lo que hacía que la app pareciera funcionar cuando
  // no lo hacía.
  const latestSync = snapshotHasRealData(snapshot)
    ? {
        platform: snapshot.platform,
        status: 'completed',
        completed_at: new Date(nowMs).toISOString(),
        records_received: backendSummary?.latest_sync?.records_received ?? 0,
        records_upserted: backendSummary?.latest_sync?.records_upserted ?? 0,
        error_message: null,
      }
    : (backendSummary?.latest_sync ?? null);

  if (!backendSummary) {
    // Primer arranque sin red o sin haber sincronizado nunca: el dispositivo basta para
    // pintar la pantalla. Las recomendaciones quedan vacías porque son cálculo del backend.
    return {
      connections: [
        {
          platform: snapshot.platform,
          status: 'active',
          permissions: snapshot.permissions,
          sharing_enabled: true,
          last_sync_at: latestSync?.completed_at ?? null,
          updated_at: latestSync?.completed_at ?? null,
        },
      ],
      range: {
        start_date: summaries[summaries.length - 1]?.date ?? snapshot.from_at.slice(0, 10),
        end_date: summaries[0]?.date ?? snapshot.to_at.slice(0, 10),
      },
      summaries,
      recommendations: {
        observed_tdee_kcal: { days_7: null, days_14: null, days_30: null },
        current_tdee_kcal: null,
        current_target_calories: null,
        suggested_tdee_kcal: null,
        delta_from_current_kcal: null,
        confidence: 'low',
        application_mode: 'recommendation_only',
      },
      latest_sync: latestSync,
    };
  }

  return { ...backendSummary, summaries, latest_sync: latestSync };
};
