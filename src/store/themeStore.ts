import { Appearance, type ColorSchemeName } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const THEME_PREFERENCE_KEY = 'fitpilot_theme_preference';

const isThemePreference = (value: string | null): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

const getResolvedTheme = (
  preference: ThemePreference,
  colorScheme: ColorSchemeName = Appearance.getColorScheme(),
): ResolvedTheme => {
  if (preference === 'system') {
    return colorScheme === 'dark' ? 'dark' : 'light';
  }

  return preference;
};

interface ThemeState {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isHydrated: boolean;
  hydrateTheme: () => Promise<void>;
  setPreference: (preference: ThemePreference) => Promise<void>;
  syncWithSystem: (colorScheme: ColorSchemeName) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  preference: 'light',
  resolvedTheme: 'light',
  isHydrated: false,

  hydrateTheme: async () => {
    try {
      const storedPreference = await SecureStore.getItemAsync(THEME_PREFERENCE_KEY);
      const preference = isThemePreference(storedPreference) ? storedPreference : 'light';

      set({
        preference,
        resolvedTheme: getResolvedTheme(preference),
        isHydrated: true,
      });
    } catch {
      set({
        preference: 'light',
        resolvedTheme: 'light',
        isHydrated: true,
      });
    }
  },

  setPreference: async (preference) => {
    set({
      preference,
      resolvedTheme: getResolvedTheme(preference),
    });

    try {
      await SecureStore.setItemAsync(THEME_PREFERENCE_KEY, preference);
    } catch {
      // Keep the in-memory preference so the UI update remains immediate.
    }
  },

  syncWithSystem: (colorScheme) => {
    if (get().preference !== 'system') {
      return;
    }

    set({
      resolvedTheme: getResolvedTheme('system', colorScheme),
    });
  },
}));
