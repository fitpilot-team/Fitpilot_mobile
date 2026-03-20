import { create } from 'zustand';
import { getCurrentUser } from '../services/account';
import {
  clearSessionTokens,
  getAccessToken,
  getRefreshToken,
  nutritionApi,
  nutritionClient,
  setSessionTokens,
  setUnauthorizedHandler,
} from '../services/api';
import { useWorkoutStore } from './workoutStore';
import type {
  LoginCredentials,
  LoginResponse,
  User,
} from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  uploadAvatar: (uri: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const clearAuthenticatedState = async (error: string | null = null) => {
    await clearSessionTokens();
    useWorkoutStore.getState().reset();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isInitialized: true,
      error,
    });
  };

  const ensureClientUser = async (user: User) => {
    if (user.role !== 'client') {
      await clearAuthenticatedState(
        'Esta aplicacion es solo para clientes. Los profesionales deben usar la aplicacion web.',
      );
      return null;
    }

    return user;
  };

  const authStore: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null,

    initialize: async () => {
      try {
        const accessToken = await getAccessToken();

        if (!accessToken) {
          set({
            isInitialized: true,
            isAuthenticated: false,
            user: null,
            error: null,
          });
          return;
        }

        if (__DEV__) {
          console.log('[Auth] init: access token found');
        }

        const user = await ensureClientUser(await getCurrentUser());
        if (!user) {
          return;
        }

        if (__DEV__) {
          console.log('[Auth] init: user loaded', user.email);
        }

        set({
          user,
          isAuthenticated: true,
          isInitialized: true,
          error: null,
        });
      } catch (error) {
        if (__DEV__) {
          console.warn('[Auth] init error', error);
        }

        await clearAuthenticatedState();
      }
    },

    login: async (credentials: LoginCredentials) => {
      set({ isLoading: true, error: null });

      try {
        if (__DEV__) {
          console.log('[Auth] login start', credentials.email);
        }

        const response = await nutritionClient.post<LoginResponse>(
          '/auth/login',
          {
            identifier: credentials.email.trim(),
            password: credentials.password,
            app_type: 'CLIENT_APP',
          },
          {
            skipAuth: true,
            skipAuthRefresh: true,
          },
        );

        await setSessionTokens({
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
        });

        const user = await ensureClientUser(await getCurrentUser());
        if (!user) {
          return false;
        }

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          isInitialized: true,
          error: null,
        });

        if (__DEV__) {
          console.log('[Auth] login success', user.email);
        }

        return true;
      } catch (error: any) {
        if (__DEV__) {
          console.warn('[Auth] login error', error?.message || error);
        }

        set({
          isLoading: false,
          error: error.message || 'Error al iniciar sesion',
        });

        return false;
      }
    },

    logout: async () => {
      try {
        const refreshToken = await getRefreshToken();

        if (refreshToken) {
          await nutritionClient.post(
            '/auth/logout',
            { refresh_token: refreshToken },
            { skipAuthRefresh: true },
          );
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[Auth] logout request failed', error);
        }
      } finally {
        await clearAuthenticatedState();
      }
    },

    refreshUser: async () => {
      try {
        const user = await ensureClientUser(await getCurrentUser());
        if (!user) {
          return null;
        }

        set({
          user,
          isAuthenticated: true,
          isInitialized: true,
          error: null,
        });

        return user;
      } catch (error: any) {
        if (__DEV__) {
          console.warn('[Auth] refreshUser error', error?.message || error);
        }

        set({
          error: error.message || 'No fue posible actualizar tu perfil',
        });

        throw error;
      }
    },

    uploadAvatar: async (uri: string) => {
      set({ isLoading: true, error: null });

      try {
        const formData = new FormData();
        formData.append('file', {
          uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        } as unknown as Blob);

        await nutritionApi.patch('/users/me/profile-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const user = await ensureClientUser(await getCurrentUser());
        if (!user) {
          return;
        }

        set({
          user,
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
          error: null,
        });

        if (__DEV__) {
          console.log('[Auth] uploadAvatar success', user.email);
        }
      } catch (error: any) {
        if (__DEV__) {
          console.warn('[Auth] uploadAvatar error', error?.message || error);
        }

        set({
          isLoading: false,
          error: error.message || 'Error al subir la imagen',
        });

        throw error;
      }
    },

    clearError: () => set({ error: null }),
  };

  setUnauthorizedHandler(async () => {
    const { isAuthenticated } = get();
    if (isAuthenticated) {
      await clearAuthenticatedState();
    }
  });

  return authStore;
});
