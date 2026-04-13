import {
  getNutritionAssetUrl,
  getRefreshToken,
  nutritionClient,
} from './api';
import type {
  ApiMessageResponse,
  ChangePasswordPayload,
  NutritionAuthUserResponse,
  UpdateCurrentUserPayload,
  User,
  UserRole,
} from '../types';
import { normalizeOptionalRemoteText } from '../utils/text';

const normalizeRole = (role: string | null | undefined): UserRole => {
  const normalizedRole = role?.trim().toLowerCase();

  if (normalizedRole === 'admin' || normalizedRole === 'administrator') {
    return 'admin';
  }

  if (normalizedRole === 'professional' || normalizedRole === 'trainer') {
    return 'trainer';
  }

  return 'client';
};

const normalizeProfessionalRoles = (
  professionalRole: NutritionAuthUserResponse['professional_role'],
): string[] => {
  if (Array.isArray(professionalRole)) {
    return professionalRole.filter((role): role is string => typeof role === 'string');
  }

  if (typeof professionalRole === 'string' && professionalRole.trim()) {
    return [professionalRole.trim()];
  }

  return [];
};

export const mapNutritionUserToUser = (
  payload: NutritionAuthUserResponse,
): User => {
  const firstName = normalizeOptionalRemoteText(payload.name);
  const lastName = normalizeOptionalRemoteText(payload.lastname);
  const displayName =
    [firstName, lastName].filter(Boolean).join(' ').trim() || payload.email;

  return {
    id: String(payload.id),
    email: payload.email,
    displayName,
    firstName,
    lastName,
    role: normalizeRole(payload.role),
    phoneNumber: payload.phone_number ?? null,
    isPhoneVerified: payload.is_phone_verified ?? false,
    onboardingStatus: payload.onboarding_status ?? null,
    profilePictureUrl: getNutritionAssetUrl(payload.profile_picture),
    professionalRoles: normalizeProfessionalRoles(payload.professional_role),
    currentSubscription: payload.current_subscription ?? null,
    hasSubscription: payload.has_subscription ?? false,
    hasActiveSubscription: payload.has_active_subscription ?? false,
    subscriptionVigency: payload.subscription_vigency ?? null,
  };
};

export const getCurrentUser = async (): Promise<User> => {
  const payload = await nutritionClient.get<NutritionAuthUserResponse>('/auth/me');
  return mapNutritionUserToUser(payload);
};

export const updateCurrentUser = async (
  payload: UpdateCurrentUserPayload,
): Promise<User> => {
  const response = await nutritionClient.patch<NutritionAuthUserResponse>(
    '/users/me',
    payload,
  );
  return mapNutritionUserToUser(response);
};

export const changePassword = async (
  payload: ChangePasswordPayload,
): Promise<ApiMessageResponse> => {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    throw new Error(
      'No fue posible validar tu sesi\u00f3n actual. Inicia sesi\u00f3n de nuevo.',
    );
  }

  return nutritionClient.post<ApiMessageResponse>(
    '/auth/change-password',
    {
      current_password: payload.currentPassword,
      new_password: payload.newPassword,
    },
    {
      headers: {
        'x-refresh-token': refreshToken,
      },
      skipAuthRefresh: true,
    },
  );
};
