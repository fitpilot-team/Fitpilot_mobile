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
  lastChangedAt: number | null;
  setFromNetInfo: (state: NetInfoState) => void;
};

const resolveOfflineState = (
  isConnected: boolean | null,
  isInternetReachable: boolean | null,
) => isConnected === false || isInternetReachable === false;

export const useConnectivityStore = create<ConnectivityState>((set) => ({
  isInitialized: false,
  isConnected: null,
  isInternetReachable: null,
  type: 'unknown',
  isOffline: false,
  lastChangedAt: null,

  setFromNetInfo: (state) => {
    const isConnected = state.isConnected;
    const isInternetReachable = state.isInternetReachable;

    set({
      isInitialized: true,
      isConnected,
      isInternetReachable,
      type: state.type,
      isOffline: resolveOfflineState(isConnected, isInternetReachable),
      lastChangedAt: Date.now(),
    });
  },
}));
