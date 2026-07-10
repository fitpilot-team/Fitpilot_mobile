import { create } from 'zustand';

export type AppToastVariant = 'success' | 'error' | 'info';

export interface AppToastConfig {
  variant: AppToastVariant;
  message: string;
  subtitle?: string;
}

interface ToastState {
  config: AppToastConfig | null;
  visible: boolean;
  show: (config: AppToastConfig) => void;
  hide: () => void;
}

let reshowTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set, get) => ({
  config: null,
  visible: false,

  show: (config) => {
    if (reshowTimer) {
      clearTimeout(reshowTimer);
      reshowTimer = null;
    }

    if (get().visible) {
      // Ocultar y re-mostrar tras un breve intervalo para que toasts
      // consecutivos se perciban como eventos distintos.
      set({ visible: false });
      reshowTimer = setTimeout(() => {
        reshowTimer = null;
        set({ config, visible: true });
      }, 50);
      return;
    }

    set({ config, visible: true });
  },

  hide: () => set({ visible: false }),
}));

const createShow =
  (variant: AppToastVariant) =>
  (message: string, subtitle?: string): void => {
    useToastStore.getState().show({ variant, message, subtitle });
  };

export const toast = {
  success: createShow('success'),
  error: createShow('error'),
  info: createShow('info'),
};
