import { create } from 'zustand';
import {
  apiClient,
  setToken,
  removeToken,
  getToken,
  setUnauthorizedHandler,
  default as api,
} from '../services/api';
import { useWorkoutStore } from './workoutStore';
import type { User, LoginCredentials, LoginResponse } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  uploadAvatar: (uri: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const authStore: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    isInitialized: false,
    error: null,

    initialize: async () => {
      try {
        const token = await getToken();
        if (token) {
          if (__DEV__) {
            console.log('[Auth] init: token found');
          }
          // Try to get current user
          const user = await apiClient.get<User>('/auth/me');

          // Only allow clients to use the mobile app
          if (user.role !== 'client') {
            await removeToken();
            set({
              user: null,
              isAuthenticated: false,
              isInitialized: true,
              error: 'Esta aplicación es solo para clientes',
            });
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
        } else {
          set({ isInitialized: true });
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[Auth] init error', err);
        }
        await removeToken();
        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
        });
      }
    },

    login: async (credentials: LoginCredentials) => {
      set({ isLoading: true, error: null });

      try {
        if (__DEV__) {
          console.log('[Auth] login start', credentials.email);
        }
        // Get token
        const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
        await setToken(response.access_token);

        // Get user info
        const user = await apiClient.get<User>('/auth/me');

        // Only allow clients
        if (user.role !== 'client') {
          await removeToken();
          set({
            isLoading: false,
            error:
              'Esta aplicación es solo para clientes. Los entrenadores y administradores deben usar la aplicación web.',
          });
          return false;
        }

        if (__DEV__) {
          console.log('[Auth] login success', user.email);
        }
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        return true;
      } catch (err: any) {
        if (__DEV__) {
          console.warn('[Auth] login error', err?.message || err);
        }
        set({
          isLoading: false,
          error: err.message || 'Error al iniciar sesión',
        });
        return false;
      }
    },

    logout: async () => {
      await removeToken();
      useWorkoutStore.getState().reset();
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
      if (__DEV__) {
        console.log('[Auth] logout');
      }
    },

    clearError: () => set({ error: null }),

    uploadAvatar: async (uri: string) => {
      set({ isLoading: true, error: null });
      try {
        const formData = new FormData();
        // @ts-ignore - React Native handles file uploads this way
        formData.append('file', {
          uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        });

        // Upload image
        // We use the raw api instance to set multipart/form-data header
        const response = await api.post<User>('/users/me/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const updatedUser = response.data;

        if (__DEV__) {
          console.log('[Auth] uploadAvatar success', updatedUser.email);
        }

        set({
          user: updatedUser,
          isLoading: false,
          error: null,
        });
      } catch (err: any) {
        if (__DEV__) {
          console.warn('[Auth] uploadAvatar error', err?.message || err);
        }
        set({
          isLoading: false,
          error: err.message || 'Error al subir la imagen',
        });
        throw err;
      }
    },
  };

  // Global handler for 401s -> clear session and workout state
  setUnauthorizedHandler(async () => {
    const { isAuthenticated } = get();
    if (isAuthenticated) {
      await authStore.logout();
    }
  });

  return authStore;
});
