import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const isHapticsSupported = Platform.OS !== 'web';

export const hapticSuccess = (): void => {
  if (!isHapticsSupported) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
};

export const hapticError = (): void => {
  if (!isHapticsSupported) return;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
};

export const hapticImpactLight = (): void => {
  if (!isHapticsSupported) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
};
