import { NativeModule, requireNativeModule } from 'expo';

import type {
  FitpilotHealthAvailability,
  FitpilotHealthModuleEvents,
  FitpilotHealthChanges,
  FitpilotHealthPermissionStatus,
  FitpilotHealthSnapshot,
  FitpilotHealthSyncPayload,
  FitpilotHealthSyncRange,
} from './FitpilotHealth.types';

declare class FitpilotHealthModule extends NativeModule<FitpilotHealthModuleEvents> {
  isAvailable(): Promise<FitpilotHealthAvailability>;
  requestPermissions(): Promise<FitpilotHealthPermissionStatus>;
  getGrantedPermissions(): Promise<FitpilotHealthPermissionStatus>;
  getChangesToken(): Promise<string | null>;
  getChanges(token: string): Promise<FitpilotHealthChanges>;
  startObservingChanges(): Promise<boolean>;
  stopObservingChanges(): Promise<void>;
  readSnapshot(range: FitpilotHealthSyncRange): Promise<FitpilotHealthSnapshot>;
  syncRange(range: FitpilotHealthSyncRange): Promise<FitpilotHealthSyncPayload>;
  openSettings(): Promise<void>;
}

const nativeModule = requireNativeModule<FitpilotHealthModule>('FitpilotHealth');

export const isAvailable = () => nativeModule.isAvailable();
export const requestPermissions = () => nativeModule.requestPermissions();
export const getGrantedPermissions = () => nativeModule.getGrantedPermissions();
export const getChangesToken = () => nativeModule.getChangesToken();
export const getChanges = (token: string) => nativeModule.getChanges(token);
/** Devuelve `true` si la plataforma sí empuja cambios (hoy, solo iOS). */
export const startObservingChanges = () => nativeModule.startObservingChanges();
export const stopObservingChanges = () => nativeModule.stopObservingChanges();
export const addHealthDataChangedListener = (
  listener: (event: { types?: string[] }) => void,
) => nativeModule.addListener('onHealthDataChanged', listener);
export const readSnapshot = (range: FitpilotHealthSyncRange) =>
  nativeModule.readSnapshot(range);
export const syncRange = (range: FitpilotHealthSyncRange) =>
  nativeModule.syncRange(range);
export const openSettings = () => nativeModule.openSettings();
