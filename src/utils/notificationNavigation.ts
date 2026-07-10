import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

export const handleNotificationResponse = (
  response: Notifications.NotificationResponse,
): void => {
  const data = response.notification.request.content.data ?? {};
  const conversationId = data.conversation_id;

  if (data.type === 'chat' && conversationId) {
    router.push({
      pathname: '/(tabs)/chat',
      params: { conversationId: String(conversationId) },
    });
  }
};

let hasConsumedInitialResponse = false;

/**
 * Procesa el tap de notificación que abrió la app (cold start). Sin esto,
 * los taps con la app cerrada se pierden porque el listener se monta
 * hasta que los tabs renderizan. Solo se consume una vez por proceso para
 * no re-navegar en remontajes del layout (p. ej. logout → login).
 */
export const consumeInitialNotificationResponse = async (): Promise<void> => {
  if (hasConsumedInitialResponse) {
    return;
  }
  hasConsumedInitialResponse = true;

  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      handleNotificationResponse(response);
    }
  } catch {
    // Best-effort: si falla, el usuario simplemente aterriza en Home.
  }
};
