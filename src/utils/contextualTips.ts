import { scienceTips, type ScienceTip, type TipContextTag } from '../constants/scienceTips';
import type {
  DashboardTrainingDaySummary,
  MicrocycleProgress,
  MuscleVolumeResponse,
} from '../types';

export interface TipContext {
  nextSession: DashboardTrainingDaySummary | null;
  microcycleProgress: MicrocycleProgress | null;
  muscleVolume: MuscleVolumeResponse | null;
  allCompleted: boolean;
  workoutPosition: number | null;
  workoutTotal: number | null;
  currentHour: number;
}

const UPPER_BODY_KEYWORDS = [
  'pecho', 'espalda', 'hombro', 'biceps', 'bíceps', 'triceps', 'tríceps',
  'dorsal', 'pectoral', 'deltoid', 'trapecio', 'upper', 'chest', 'back',
  'shoulder', 'arm', 'push', 'pull', 'tren superior', 'torso',
];

const LOWER_BODY_KEYWORDS = [
  'pierna', 'cuadriceps', 'cuádriceps', 'isquiotibial', 'glúteo', 'gluteo',
  'pantorrilla', 'femoral', 'lower', 'leg', 'squat', 'sentadilla',
  'tren inferior',
];

const HIGH_VOLUME_THRESHOLD = 15;

const inferBodyFocus = (
  session: DashboardTrainingDaySummary | null,
  muscleVolume: MuscleVolumeResponse | null,
): 'upper_body' | 'lower_body' | 'full_body' | null => {
  if (!session || session.rest_day) return null;

  const focusLower = (session.focus ?? session.name ?? '').toLowerCase();
  const muscleNames = (muscleVolume?.muscles ?? [])
    .map((m) => m.display_name.toLowerCase());
  const searchables = [focusLower, ...muscleNames];
  const searchText = searchables.join(' ');

  const hasUpper = UPPER_BODY_KEYWORDS.some((kw) => searchText.includes(kw));
  const hasLower = LOWER_BODY_KEYWORDS.some((kw) => searchText.includes(kw));

  if (hasUpper && hasLower) return 'full_body';
  if (hasUpper) return 'upper_body';
  if (hasLower) return 'lower_body';
  return null;
};

export const deriveContextTags = (context: TipContext): TipContextTag[] => {
  const tags: TipContextTag[] = [];

  // ── Time of day ─────────────────────────────────────────
  const hour = context.currentHour;
  if (hour >= 6 && hour < 12) tags.push('morning');
  else if (hour >= 12 && hour < 18) tags.push('afternoon');
  else if (hour >= 18 && hour < 23) tags.push('evening');

  // ── Workout state ───────────────────────────────────────
  if (context.nextSession && !context.nextSession.rest_day) {
    tags.push('pre_workout');
  } else {
    tags.push('post_workout');
  }

  // ── Body focus ──────────────────────────────────────────
  const bodyFocus = inferBodyFocus(context.nextSession, context.muscleVolume);
  if (bodyFocus) tags.push(bodyFocus);

  // ── Volume ──────────────────────────────────────────────
  if (
    context.muscleVolume &&
    context.muscleVolume.total_effective_sets >= HIGH_VOLUME_THRESHOLD
  ) {
    tags.push('high_volume');
  }

  // ── Microcycle intensity ────────────────────────────────
  const microcycleProgress = context.microcycleProgress;
  if (microcycleProgress?.microcycle_name) {
    const name = microcycleProgress.microcycle_name.toLowerCase();
    if (name.includes('deload') || name.includes('descarga')) {
      tags.push('deload_week');
    }
  }

  // ── Program position ────────────────────────────────────
  if (
    context.workoutPosition != null &&
    context.workoutTotal != null &&
    context.workoutTotal > 0
  ) {
    const progressPct = context.workoutPosition / context.workoutTotal;
    if (progressPct <= 0.25) tags.push('program_start');
    else if (progressPct <= 0.75) tags.push('program_mid');
    else tags.push('program_end');
  } else if (!context.allCompleted) {
    tags.push('program_start');
  }

  // consistency is always relevant
  tags.push('consistency');

  return tags;
};

export const selectContextualTips = (
  tips: ScienceTip[],
  contextTags: TipContextTag[],
  count: number = 5,
): ScienceTip[] => {
  const contextSet = new Set(contextTags);

  const scored = tips.map((tip) => {
    const matchedCount = tip.tags.filter((tag) => contextSet.has(tag)).length;
    const score = tip.tags.length > 0 ? matchedCount / tip.tags.length : 0;
    return { tip, score, matchedCount };
  });

  // Sort by score desc, then by matched count desc to prefer more specific matches.
  // Add a small random jitter to shuffle tips with same score.
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.matchedCount !== a.matchedCount) return b.matchedCount - a.matchedCount;
    return Math.random() - 0.5;
  });

  return scored.slice(0, count).map((s) => s.tip);
};

export const getContextualTips = (context: TipContext, count: number = 5): ScienceTip[] => {
  const contextTags = deriveContextTags(context);
  return selectContextualTips(scienceTips, contextTags, count);
};
