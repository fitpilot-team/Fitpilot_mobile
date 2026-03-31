import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
  isAxiosError,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import type { ApiError, LoginResponse, MuscleVolumeResponse } from '../types';

type ValidationDetail = {
  msg?: string;
  loc?: (string | number)[];
};

type ApiErrorPayload = {
  code?: string;
  detail?: string | ValidationDetail[];
  message?: string | string[];
  error?: string;
};

const CLOSED_WORKOUT_EDIT_ERROR = 'Workout must be reopened before editing sets';

type PublicExtra = {
  nutritionApiUrl?: string;
  trainingApiUrl?: string;
};

type SessionTokens = {
  accessToken: string | null;
  refreshToken: string | null;
};

interface RequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  skipAuth?: boolean;
  skipAuthRefresh?: boolean;
  skipErrorLogging?: boolean;
}

interface InternalRequestConfig<D = unknown> extends InternalAxiosRequestConfig<D> {
  skipAuth?: boolean;
  skipAuthRefresh?: boolean;
  skipErrorLogging?: boolean;
  _retry?: boolean;
}

const ACCESS_TOKEN_KEY = 'fitpilot_access_token';
const REFRESH_TOKEN_KEY = 'fitpilot_refresh_token';
const REQUEST_TIMEOUT_MS = 30_000;

const extra = (Constants.expoConfig?.extra ?? {}) as PublicExtra;

const resolveRequiredUrl = (
  value: string | undefined,
  envKey: 'EXPO_PUBLIC_NUTRITION_API_URL' | 'EXPO_PUBLIC_TRAINING_API_URL',
) => {
  const normalized = value?.trim();

  if (!normalized) {
    throw new Error(
      `[Config] Missing ${envKey}. Configure both EXPO_PUBLIC_NUTRITION_API_URL and EXPO_PUBLIC_TRAINING_API_URL.`,
    );
  }

  return normalized.replace(/\/+$/, '');
};

const NUTRITION_API_URL = resolveRequiredUrl(
  process.env.EXPO_PUBLIC_NUTRITION_API_URL || extra.nutritionApiUrl,
  'EXPO_PUBLIC_NUTRITION_API_URL',
);
const TRAINING_API_URL = resolveRequiredUrl(
  process.env.EXPO_PUBLIC_TRAINING_API_URL || extra.trainingApiUrl,
  'EXPO_PUBLIC_TRAINING_API_URL',
);
const TRAINING_ASSET_BASE_URL = new URL(TRAINING_API_URL).origin;

if (__DEV__) {
  console.log('[API] nutrition base URL:', NUTRITION_API_URL);
  console.log('[API] training base URL:', TRAINING_API_URL);
}

let cachedTokens: SessionTokens = {
  accessToken: null,
  refreshToken: null,
};
let tokensHydrated = false;
let unauthorizedHandler: (() => void | Promise<void>) | null = null;
let refreshPromise: Promise<SessionTokens | null> | null = null;
let unauthorizedPromise: Promise<void> | null = null;

const createApiError = (
  error: AxiosError<ApiErrorPayload> | Error,
  fallbackMessage = 'Ha ocurrido un error inesperado',
) => {
  if (!isAxiosError<ApiErrorPayload>(error)) {
    const apiError = new Error(error.message || fallbackMessage) as ApiError;
    apiError.code = undefined;
    return apiError;
  }

  const detail = error.response?.data?.detail;
  const message = error.response?.data?.message;
  let errorMessage = fallbackMessage;

  console.warn(`[API ERROR TRACE] status: ${error.response?.status}`, error.response?.data);

  if (typeof detail === 'string') {
    errorMessage = detail;
  } else if (Array.isArray(detail)) {
    errorMessage = detail
      .map((item) => {
        const field = item.loc?.slice(1).join('.') || 'campo';
        return `${field}: ${item.msg || 'valor invalido'}`;
      })
      .join(', ');
  } else if (Array.isArray(message)) {
    errorMessage = message.join(', ');
  } else if (typeof message === 'string') {
    errorMessage = message;
  } else if (typeof error.response?.data?.error === 'string') {
    errorMessage = error.response.data.error;
  } else if (error.message) {
    errorMessage = error.message;
  }

  const apiError = new Error(errorMessage) as ApiError;
  apiError.status = error.response?.status;
  apiError.code = error.response?.data?.code;
  return apiError;
};

const extractApiErrorMessage = (error: AxiosError<ApiErrorPayload>) => {
  console.warn(`[API ERROR TRACE] status: ${error.response?.status}`, error.response?.data);
  const detail = error.response?.data?.detail;
  const message = error.response?.data?.message;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string') {
    return message;
  }

  if (typeof error.response?.data?.error === 'string') {
    return error.response.data.error;
  }

  return error.message;
};

const shouldSkipDevErrorLog = (error: AxiosError<ApiErrorPayload>) => {
  if (error.response?.status !== 409) {
    return false;
  }

  const message = extractApiErrorMessage(error);
  return typeof message === 'string' &&
    message.toLowerCase().includes(CLOSED_WORKOUT_EDIT_ERROR.toLowerCase());
};

const hydrateTokens = async (): Promise<SessionTokens> => {
  if (tokensHydrated) {
    return cachedTokens;
  }

  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);

  cachedTokens = { accessToken, refreshToken };
  tokensHydrated = true;

  return cachedTokens;
};

export const getAccessToken = async (): Promise<string | null> => {
  const tokens = await hydrateTokens();
  return tokens.accessToken;
};

export const getRefreshToken = async (): Promise<string | null> => {
  const tokens = await hydrateTokens();
  return tokens.refreshToken;
};

export const setSessionTokens = async (tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> => {
  cachedTokens = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
  tokensHydrated = true;

  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
};

export const clearSessionTokens = async (): Promise<void> => {
  cachedTokens = {
    accessToken: null,
    refreshToken: null,
  };
  tokensHydrated = true;

  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
};

export const setUnauthorizedHandler = (handler: (() => void | Promise<void>) | null) => {
  unauthorizedHandler = handler;
};

const notifyUnauthorized = async () => {
  if (unauthorizedPromise) {
    await unauthorizedPromise;
    return;
  }

  unauthorizedPromise = (async () => {
    await clearSessionTokens();
    if (unauthorizedHandler) {
      await unauthorizedHandler();
    }
  })();

  try {
    await unauthorizedPromise;
  } finally {
    unauthorizedPromise = null;
  }
};

const refreshSession = async (): Promise<SessionTokens | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      await notifyUnauthorized();
      return null;
    }

    try {
      const response = await axios.post<LoginResponse>(
        `${NUTRITION_API_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-refresh-transport': 'body',
          },
          timeout: REQUEST_TIMEOUT_MS,
        },
      );

      const nextTokens = {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken,
      };

      await setSessionTokens(nextTokens);
      return nextTokens;
    } catch (error) {
      if (__DEV__) {
        console.warn('[API] refresh failed', error);
      }
      await notifyUnauthorized();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const createAxiosInstance = (baseURL: string) =>
  axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: REQUEST_TIMEOUT_MS,
  });

const attachAuthInterceptors = (instance: AxiosInstance, label: 'nutrition' | 'training') => {
  instance.interceptors.request.use(
    async (config: InternalRequestConfig) => {
      if (!config.skipAuth) {
        const accessToken = await getAccessToken();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
      }

      if (__DEV__) {
        console.log(`[API:${label}] request`, config.method?.toUpperCase(), config.url);
      }

      return config;
    },
    (error) => Promise.reject(createApiError(error)),
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorPayload>) => {
      const config = error.config as InternalRequestConfig | undefined;

      if (error.response?.status === 401 && config && !config.skipAuthRefresh) {
        if (!config._retry) {
          config._retry = true;
          const refreshedSession = await refreshSession();

          if (refreshedSession?.accessToken) {
            config.headers.Authorization = `Bearer ${refreshedSession.accessToken}`;
            return instance.request(config);
          }
        } else {
          await notifyUnauthorized();
        }
      }

      if (__DEV__ && !config?.skipErrorLogging && !shouldSkipDevErrorLog(error)) {
        console.warn(
          `[API:${label}] error`,
          error.config?.url,
          error.response?.status,
          error.message,
        );
      }

      return Promise.reject(createApiError(error));
    },
  );
};

const withData = async <T>(request: Promise<{ data: T }>): Promise<T> => {
  const response = await request;
  return response.data;
};

const createClient = (instance: AxiosInstance) => ({
  get: async <T>(url: string, config?: RequestConfig): Promise<T> =>
    withData(instance.get<T>(url, config)),

  post: async <T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> =>
    withData(instance.post<T>(url, data, config)),

  put: async <T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> =>
    withData(instance.put<T>(url, data, config)),

  patch: async <T>(url: string, data?: unknown, config?: RequestConfig): Promise<T> =>
    withData(instance.patch<T>(url, data, config)),

  delete: async <T>(url: string, config?: RequestConfig): Promise<T> =>
    withData(instance.delete<T>(url, config)),
});

export const nutritionApi = createAxiosInstance(NUTRITION_API_URL);
export const trainingApi = createAxiosInstance(TRAINING_API_URL);

attachAuthInterceptors(nutritionApi, 'nutrition');
attachAuthInterceptors(trainingApi, 'training');

export const nutritionClient = createClient(nutritionApi);
export const trainingClient = createClient(trainingApi);

export const getAssetUrl = (relativePath: string | null | undefined): string | null => {
  if (!relativePath) return null;

  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return new URL(normalizedPath, `${TRAINING_ASSET_BASE_URL}/`).toString();
};

export const getVideoThumbnailUrl = (videoUrl: string | null | undefined): string | null => {
  if (!videoUrl) return null;

  if (!videoUrl.includes('res.cloudinary.com')) return null;

  return videoUrl
    .replace('/video/upload/', '/video/upload/so_0,w_400,h_400,c_fill/')
    .replace(/\.(mp4|webm|mov|avi)$/i, '.jpg');
};

export const getMuscleVolume = async (
  trainingDayId: string,
  countSecondary: boolean = true,
): Promise<MuscleVolumeResponse> =>
  trainingClient.get<MuscleVolumeResponse>(
    `/training-days/${trainingDayId}/muscle-volume?count_secondary=${countSecondary}`,
  );
