import {
  getNutritionAssetUrl,
  getTrainingAssetUrl,
  nutritionClient,
  trainingClient,
} from './api';
import type {
  AssignedProfessionalDomain,
  AssignedProfessionalSummary,
  AssignedProfessionalStatus,
} from '../types';
import { normalizeOptionalRemoteText, normalizeRemoteText } from '../utils/text';

type AssignedProfessionalApiResponse = {
  id?: string | null;
  full_name?: string | null;
  role_label?: string | null;
  avatar_url?: string | null;
  domain?: AssignedProfessionalDomain | null;
  context_label?: string | null;
  status?: AssignedProfessionalStatus | null;
};

export type CareTeamDomainResult = {
  error: string | null;
  summary: AssignedProfessionalSummary | null;
};

export type CareTeamDomainResults = Record<
  AssignedProfessionalDomain,
  CareTeamDomainResult
>;

const mapAssignedProfessionalSummary = (
  payload: AssignedProfessionalApiResponse,
  fallbackDomain: AssignedProfessionalDomain,
): AssignedProfessionalSummary => ({
  id: normalizeOptionalRemoteText(payload.id),
  fullName: normalizeOptionalRemoteText(payload.full_name),
  roleLabel: normalizeOptionalRemoteText(payload.role_label),
  avatarUrl:
    fallbackDomain === 'training'
      ? getTrainingAssetUrl(payload.avatar_url)
      : getNutritionAssetUrl(payload.avatar_url),
  domain: payload.domain ?? fallbackDomain,
  contextLabel: normalizeOptionalRemoteText(payload.context_label),
  status: payload.status === 'assigned' ? 'assigned' : 'unassigned',
});

const toErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error && error.message.trim()) {
    return normalizeRemoteText(error.message.trim());
  }

  return fallbackMessage;
};

export const fetchCareTeamDomainSummaries = async (
  clientId: string,
  dateKey: string,
): Promise<CareTeamDomainResults> => {
  const [trainingResult, nutritionResult] = await Promise.allSettled([
    trainingClient.get<AssignedProfessionalApiResponse>(
      '/client-app/training-professional-summary',
    ),
    nutritionClient.get<AssignedProfessionalApiResponse>(
      `/menus/client-professional-summary?client_id=${encodeURIComponent(clientId)}&date=${encodeURIComponent(dateKey)}`,
    ),
  ]);

  return {
    training:
      trainingResult.status === 'fulfilled'
        ? {
            error: null,
            summary: mapAssignedProfessionalSummary(
              trainingResult.value,
              'training',
            ),
          }
        : {
            error: toErrorMessage(
              trainingResult.reason,
              'No fue posible cargar tu profesional de entrenamiento.',
            ),
            summary: null,
          },
    nutrition:
      nutritionResult.status === 'fulfilled'
        ? {
            error: null,
            summary: mapAssignedProfessionalSummary(
              nutritionResult.value,
              'nutrition',
            ),
          }
        : {
            error: toErrorMessage(
              nutritionResult.reason,
              'No fue posible cargar tu profesional de nutrici\u00f3n.',
            ),
            summary: null,
          },
  };
};
