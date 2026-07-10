import { create } from 'zustand';
import type {
  NetInfoState,
  NetInfoStateType,
} from '@react-native-community/netinfo';

type ConnectivityState = {
  isInitialized: boolean;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: NetInfoStateType | 'unknown';
  isOffline: boolean;
  isBackendUnreachable: boolean;
  bannerHeight: number;
  lastChangedAt: number | null;
  setFromNetInfo: (state: NetInfoState) => void;
  noteBackendUnreachable: () => void;
  noteBackendReachable: () => void;
  setBannerHeight: (height: number) => void;
};

// NOTE: isInternetReachable is intentionally NOT used here. On iOS, netinfo
// computes it via an HTTP probe to a Google endpoint, which fails on networks
// that filter Google even though our backend works — causing a permanent
// false "Sin conexión" banner. We keep the value in the store for telemetry only.
const resolveOfflineState = (isConnected: boolean | null) => isConnected === false;

export const useConnectivityStore = create<ConnectivityState>((set, get) => ({
  isInitialized: false,
  isConnected: null,
  isInternetReachable: null,
  type: 'unknown',
  isOffline: false,
  isBackendUnreachable: false,
  bannerHeight: 0,
  lastChangedAt: null,

  setFromNetInfo: (state) => {
    const isConnected = state.isConnected;
    const isInternetReachable = state.isInternetReachable;

    set({
      isInitialized: true,
      isConnected,
      isInternetReachable,
      type: state.type,
      isOffline: resolveOfflineState(isConnected),
      lastChangedAt: Date.now(),
    });
  },

  noteBackendUnreachable: () => {
    if (!get().isBackendUnreachable) {
      set({ isBackendUnreachable: true });
    }
  },

  noteBackendReachable: () => {
    if (get().isBackendUnreachable) {
      set({ isBackendUnreachable: false });
    }
  },

  setBannerHeight: (height) => {
    if (get().bannerHeight !== height) {
      set({ bannerHeight: height });
    }
  },
}));
