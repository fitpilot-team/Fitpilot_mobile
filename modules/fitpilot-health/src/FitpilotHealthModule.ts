import { NativeModule, requireNativeModule } from 'expo';

import type {
  FitpilotHealthAvailability,
  FitpilotHealthModuleEvents,
  FitpilotHealthPermissionStatus,
  FitpilotHealthSnapshot,
  FitpilotHealthSyncPayload,
  FitpilotHealthSyncRange,
} from './FitpilotHealth.types';

declare class FitpilotHealthModule extends NativeModule<FitpilotHealthModuleEvents> {
  isAvailable(): Promise<FitpilotHealthAvailability>;
  requestPermissions(): Promise<FitpilotHealthPermissionStatus>;
  getGrantedPermissions(): Promise<FitpilotHealthPermissionStatus>;
  readSnapshot(range: FitpilotHealthSyncRange): Promise<FitpilotHealthSnapshot>;
  syncRange(range: FitpilotHealthSyncRange): Promise<FitpilotHealthSyncPayload>;
  openSettings(): Promise<void>;
}

const nativeModule = requireNativeModule<FitpilotHealthModule>('FitpilotHealth');

export const isAvailable = () => nativeModule.isAvailable();
export const requestPermissions = () => nativeModule.requestPermissions();
export const getGrantedPermissions = () => nativeModule.getGrantedPermissions();
export const readSnapshot = (range: FitpilotHealthSyncRange) =>
  nativeModule.readSnapshot(range);
export const syncRange = (range: FitpilotHealthSyncRange) =>
  nativeModule.syncRange(range);
export const openSettings = () => nativeModule.openSettings();
