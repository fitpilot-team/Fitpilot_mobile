import { NativeModule, requireOptionalNativeModule } from 'expo';

import type {
  FitpilotHealthAvailability,
  FitpilotHealthModuleEvents,
  FitpilotHealthPermissionStatus,
  FitpilotHealthSyncPayload,
  FitpilotHealthSyncRange,
} from './FitpilotHealth.types';

declare class FitpilotHealthModule extends NativeModule<FitpilotHealthModuleEvents> {
  isAvailable(): Promise<FitpilotHealthAvailability>;
  requestPermissions(): Promise<FitpilotHealthPermissionStatus>;
  getGrantedPermissions(): Promise<FitpilotHealthPermissionStatus>;
  syncRange(range: FitpilotHealthSyncRange): Promise<FitpilotHealthSyncPayload>;
  openSettings(): Promise<void>;
}

const nativeModule =
  requireOptionalNativeModule<FitpilotHealthModule>('FitpilotHealth');

const unavailableMessage =
  'Salud conectada requiere una build nativa de FitPilot con el modulo FitpilotHealth instalado.';

const unsupportedAvailability = async (): Promise<FitpilotHealthAvailability> => ({
  available: false,
  platform: 'unsupported',
  status: 'unsupported',
  message: unavailableMessage,
});

const unsupportedPermissions = async (): Promise<FitpilotHealthPermissionStatus> => ({
  platform: 'unsupported',
  granted: [],
  missing: [],
});

export const isAvailable = () =>
  nativeModule?.isAvailable() ?? unsupportedAvailability();
export const requestPermissions = () =>
  nativeModule?.requestPermissions() ?? unsupportedPermissions();
export const getGrantedPermissions = () =>
  nativeModule?.getGrantedPermissions() ?? unsupportedPermissions();
export const syncRange = (range: FitpilotHealthSyncRange) =>
  nativeModule?.syncRange(range) ??
  Promise.reject(new Error(unavailableMessage));
export const openSettings = () => nativeModule?.openSettings() ?? Promise.resolve();
