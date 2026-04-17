import type {
  AssignedProfessionalDomain,
  AssignedProfessionalSummary,
} from '../types';

export type CareTeamSummaryMap = Record<
  AssignedProfessionalDomain,
  AssignedProfessionalSummary | null
>;

const normalizeComparableText = (value: string | null | undefined) => {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return null;
  }

  return trimmedValue
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
};

const hasAssignedProfessional = (
  summary: AssignedProfessionalSummary | null | undefined,
): summary is AssignedProfessionalSummary => summary?.status === 'assigned';

const hasMatchingAssignedId = (
  left: AssignedProfessionalSummary,
  right: AssignedProfessionalSummary,
) => Boolean(left.id) && Boolean(right.id) && left.id === right.id;

const hasMatchingAssignedName = (
  left: AssignedProfessionalSummary,
  right: AssignedProfessionalSummary,
) => {
  const normalizedLeftName = normalizeComparableText(left.fullName);
  const normalizedRightName = normalizeComparableText(right.fullName);

  return Boolean(normalizedLeftName) && normalizedLeftName === normalizedRightName;
};

export const areSameAssignedProfessionals = (
  left: AssignedProfessionalSummary | null | undefined,
  right: AssignedProfessionalSummary | null | undefined,
) => {
  if (!hasAssignedProfessional(left) || !hasAssignedProfessional(right)) {
    return false;
  }

  return hasMatchingAssignedId(left, right) || hasMatchingAssignedName(left, right);
};

export const mergeDistinctText = (...values: (string | null | undefined)[]) => {
  const uniqueValues = Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );

  return uniqueValues.length ? uniqueValues.join(' / ') : null;
};

const selectFirstNonEmptyText = (...values: (string | null | undefined)[]) =>
  values
    .map((value) => value?.trim())
    .find((value): value is string => Boolean(value)) ?? null;

export const mergeAssignedProfessionalSummaries = (
  primary: AssignedProfessionalSummary,
  secondary: AssignedProfessionalSummary,
): AssignedProfessionalSummary => ({
  ...primary,
  fullName: selectFirstNonEmptyText(primary.fullName, secondary.fullName),
  avatarUrl: selectFirstNonEmptyText(primary.avatarUrl, secondary.avatarUrl),
  roleLabel: mergeDistinctText(primary.roleLabel, secondary.roleLabel),
  contextLabel: mergeDistinctText(primary.contextLabel, secondary.contextLabel),
});

export const countUniqueAssignedProfessionals = (
  summaries: CareTeamSummaryMap,
) => {
  const trainingSummary = summaries.training;
  const nutritionSummary = summaries.nutrition;

  if (
    hasAssignedProfessional(trainingSummary) &&
    hasAssignedProfessional(nutritionSummary)
  ) {
    return areSameAssignedProfessionals(trainingSummary, nutritionSummary)
      ? 1
      : 2;
  }

  if (
    hasAssignedProfessional(trainingSummary) ||
    hasAssignedProfessional(nutritionSummary)
  ) {
    return 1;
  }

  return 0;
};
