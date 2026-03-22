import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export type MeasurementPreference = 'mx' | 'us';

export const MEASUREMENT_PREFERENCE_KEY = 'fitpilot_measurement_preference';

export const MEASUREMENT_PREFERENCE_LABELS: Record<MeasurementPreference, string> = {
  mx: 'México',
  us: 'Estados Unidos (USA)',
};

interface MeasurementPreferenceState {
  preference: MeasurementPreference;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  setPreference: (preference: MeasurementPreference) => Promise<void>;
}

export const useMeasurementPreferenceStore = create<MeasurementPreferenceState>((set, get) => ({
  preference: 'mx',
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) {
      return;
    }

    try {
      const storedPreference = await SecureStore.getItemAsync(MEASUREMENT_PREFERENCE_KEY);

      set({
        preference:
          storedPreference === 'mx' || storedPreference === 'us' ? storedPreference : 'mx',
        isInitialized: true,
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('[MeasurementPreference] Failed to load preference', error);
      }

      set({ isInitialized: true });
    }
  },

  setPreference: async (preference) => {
    const previousPreference = get().preference;
    set({ preference });

    try {
      await SecureStore.setItemAsync(MEASUREMENT_PREFERENCE_KEY, preference);
    } catch (error) {
      set({ preference: previousPreference });

      if (__DEV__) {
        console.warn('[MeasurementPreference] Failed to save preference', error);
      }

      throw error;
    }
  },
}));
