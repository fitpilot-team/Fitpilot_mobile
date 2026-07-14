import AsyncStorage from '@react-native-async-storage/async-storage';

const CONNECTED_HEALTH_INSTALLATION_KEY_PREFIX =
  'fitpilot:connected-health:installation-setup:v1:';
const HANDLED_VALUE = 'handled';

const getInstallationSetupKey = (userId: string) =>
  `${CONNECTED_HEALTH_INSTALLATION_KEY_PREFIX}${encodeURIComponent(userId)}`;

/**
 * This marker intentionally lives in AsyncStorage: it survives sign-out and app
 * updates, but is removed with the app on a fresh installation.
 */
export const hasHandledConnectedHealthSetupForInstallation = async (
  userId: string,
): Promise<boolean> =>
  (await AsyncStorage.getItem(getInstallationSetupKey(userId))) === HANDLED_VALUE;

export const markConnectedHealthSetupHandledForInstallation = async (
  userId: string,
): Promise<void> => {
  await AsyncStorage.setItem(getInstallationSetupKey(userId), HANDLED_VALUE);
};
