import type {
  FitpilotHealthAvailability,
  FitpilotHealthPermissionStatus,
  FitpilotHealthSyncPayload,
  FitpilotHealthSyncRange,
} from './FitpilotHealth.types';

export const isAvailable = async (): Promise<FitpilotHealthAvailability> => ({
  available: false,
  platform: 'unsupported',
  status: 'unsupported',
  message: 'Connected health is only available on native iOS and Android builds.',
});

export const requestPermissions = async (): Promise<FitpilotHealthPermissionStatus> => ({
  platform: 'unsupported',
  granted: [],
  missing: [],
});

export const getGrantedPermissions = requestPermissions;

export const syncRange = async (
  range: FitpilotHealthSyncRange,
): Promise<FitpilotHealthSyncPayload> => ({
  platform: 'health_connect',
  from_at: range.startAt,
  to_at: range.endAt,
  permissions: [],
  records: [],
  daily_summaries: [],
  metadata: { unsupported: true },
});

export const openSettings = async () => {};
