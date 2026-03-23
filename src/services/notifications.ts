import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const resolveExpoProjectId = (): string | undefined => {
  const resolvedProjectId =
    Constants?.easConfig?.projectId ?? Constants?.expoConfig?.extra?.eas?.projectId;

  if (typeof resolvedProjectId !== 'string') {
    return undefined;
  }

  const trimmedProjectId = resolvedProjectId.trim();
  return trimmedProjectId || undefined;
};

// Configure how notifications behave when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Requests permission to send push notifications and returns the Expo push token.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#10b981', // emerald-500
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return undefined;
    }

    try {
      const projectId = resolveExpoProjectId();

      if (!projectId) {
        console.warn(
          'Expo push notifications disabled: missing EAS project ID. Set EXPO_PUBLIC_EAS_PROJECT_ID to enable push tokens.',
        );
        return undefined;
      }

      // Expo expects an EAS project UUID; guard before calling the remote token endpoint.
      if (!UUID_PATTERN.test(projectId)) {
        console.warn(
          `Expo push notifications disabled: invalid EAS project ID "${projectId}".`,
        );
        return undefined;
      }

      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      console.log('Expo Push Token generated:', token);
      return token;
    } catch (e) {
      console.warn('Error evaluating push token:', e);
    }
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return undefined;
}

/**
 * Sends the generated token to the backend to associate it with the logged-in user.
 */
export async function sendPushTokenToBackend(pushToken: string): Promise<void> {
  try {
    const { nutritionClient } = await import('./api');

    await nutritionClient.post('/users/push-token', { token: pushToken });
    console.log('Successfully registered push token with backend');
  } catch (error) {
    console.error('Failed to send push token to backend:', error);
  }
}
