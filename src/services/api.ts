import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import type { MuscleVolumeResponse } from '../types';

// Get API URL from app config or use default
const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:8000/api';

if (__DEV__) {
  console.log('[API] base URL:', API_URL);
}

// Get base URL (without /api) for static assets
const BASE_URL = API_URL.replace(/\/api$/, '');

/**
 * Constructs full URL for static assets (videos, images, etc.)
 * Converts relative paths like "/static/videos/file.mp4" to full URLs
 */
export const getAssetUrl = (relativePath: string | null | undefined): string | null => {
  if (!relativePath) return null;
  // If already a full URL, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }
  // Ensure path starts with /
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${BASE_URL}${path}`;
};

/**
 * Extracts a thumbnail frame from a Cloudinary video URL.
 * Converts video URL to image URL using Cloudinary transformations.
 * Example: .../video/upload/v123/file.mp4 → .../video/upload/so_0/v123/file.jpg
 * @param videoUrl - The Cloudinary video URL
 * @returns Thumbnail image URL or null if not a Cloudinary video
 */
export const getVideoThumbnailUrl = (videoUrl: string | null | undefined): string | null => {
  if (!videoUrl) return null;

  // Only process Cloudinary URLs
  if (!videoUrl.includes('res.cloudinary.com')) return null;

  // Insert transformation after /upload/ and change extension to .jpg
  const thumbnailUrl = videoUrl
    .replace('/video/upload/', '/video/upload/so_0,w_400,h_400,c_fill/')
    .replace(/\.(mp4|webm|mov|avi)$/i, '.jpg');

  return thumbnailUrl;
};

// Token storage keys and in-memory cache to avoid SecureStore read on every request
const TOKEN_KEY = 'fitpilot_access_token';
let cachedToken: string | null = null;
let unauthorizedHandler: (() => void | Promise<void>) | null = null;

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Token management functions
export const getToken = async (): Promise<string | null> => {
  try {
    if (cachedToken !== null) {
      return cachedToken;
    }
    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    cachedToken = stored;
    return stored;
  } catch {
    return null;
  }
};

export const setToken = async (token: string): Promise<void> => {
  cachedToken = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const removeToken = async (): Promise<void> => {
  cachedToken = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

export const setUnauthorizedHandler = (handler: (() => void | Promise<void>) | null) => {
  unauthorizedHandler = handler;
};

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    const token = cachedToken || (await getToken());
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (__DEV__) {
      console.log('[API] request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ detail?: string | Array<{ msg: string; loc: string[] }> }>) => {
    // Handle 401 - clear token (will redirect to login via store)
    if (error.response?.status === 401) {
      await removeToken();
      if (unauthorizedHandler) {
        await unauthorizedHandler();
      }
    }

    if (__DEV__) {
      console.warn(
        '[API] error:',
        error.config?.url,
        error.response?.status,
        error.message
      );
    }

    // Extract error message
    let errorMessage = 'Ha ocurrido un error inesperado';
    const detail = error.response?.data?.detail;

    if (typeof detail === 'string') {
      errorMessage = detail;
    } else if (Array.isArray(detail)) {
      errorMessage = detail
        .map((err) => {
          const field = err.loc?.slice(1).join('.') || 'campo';
          return `${field}: ${err.msg}`;
        })
        .join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
    });
  }
);

// API client with typed methods
export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const response = await api.get<T>(url);
    return response.data;
  },

  post: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await api.post<T>(url, data);
    return response.data;
  },

  put: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await api.put<T>(url, data);
    return response.data;
  },

  patch: async <T>(url: string, data?: unknown): Promise<T> => {
    const response = await api.patch<T>(url, data);
    return response.data;
  },

  delete: async <T>(url: string): Promise<T> => {
    const response = await api.delete<T>(url);
    return response.data;
  },
};

/**
 * Get muscle volume breakdown for a training day.
 * Returns effective sets and total sets per muscle group.
 * @param trainingDayId - The training day ID
 * @param countSecondary - Whether to count secondary muscles with 0.5x multiplier (default: true)
 */
export const getMuscleVolume = async (
  trainingDayId: string,
  countSecondary: boolean = true
): Promise<MuscleVolumeResponse> => {
  return apiClient.get<MuscleVolumeResponse>(
    `/training-days/${trainingDayId}/muscle-volume?count_secondary=${countSecondary}`
  );
};

export default api;
