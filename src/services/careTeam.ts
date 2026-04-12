import { nutritionClient, trainingClient } from './api';
import type {
  AssignedProfessionalDomain,
  AssignedProfessionalSummary,
  AssignedProfessionalStatus,
} from '../types';

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

const normalizeOptionalText = (value: string | null | undefined) => {
  const trimmedValue = value?.trim() ?? '';
  return trimmedValue || null;
};

const mapAssignedProfessionalSummary = (
  payload: AssignedProfessionalApiResponse,
  fallbackDomain: AssignedProfessionalDomain,
): AssignedProfessionalSummary => ({
  id: normalizeOptionalText(payload.id),
  fullName: normalizeOptionalText(payload.full_name),
  roleLabel: normalizeOptionalText(payload.role_label),
  avatarUrl: normalizeOptionalText(payload.avatar_url),
  domain: payload.domain ?? fallbackDomain,
  contextLabel: normalizeOptionalText(payload.context_label),
  status: payload.status === 'assigned' ? 'assigned' : 'unassigned',
});

const toErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
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
              'No fue posible cargar tu profesional de nutricion.',
            ),
            summary: null,
          },
  };
};
