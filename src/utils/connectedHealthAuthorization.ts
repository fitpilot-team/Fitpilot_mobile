import { Platform } from 'react-native';

// HealthKit lanza "Authorization not determined" cuando la autorización aún no se ha
// resuelto: o el usuario no ha respondido la hoja de permisos, o iOS quedó con el estado
// partido tras reinstalar la app (la base de datos de Salud conserva los grants de la
// instalación anterior, pero el HKHealthStore del binario nuevo los sigue viendo como
// `notDetermined`). En ese segundo caso la hoja se presenta en blanco y se cierra sola,
// `requestAuthorization` resuelve con éxito y la primera query revienta.
export const isConnectedHealthAuthorizationPending = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : '';
  return /not[\s_]?determined/i.test(message);
};

/**
 * Texto de recuperación para cuando un intento EXPLÍCITO del usuario (Conectar /
 * Sincronizar) ya pidió autorización y aun así la plataforma no la aplicó. La app no
 * puede arreglarlo por su cuenta: hay que resincronizar el estado del sistema.
 */
export const getConnectedHealthAuthorizationRecoveryMessage = (): string =>
  Platform.OS === 'android'
    ? 'Health Connect no aplicó los permisos. Ábrelo con "Abrir Health Connect", concede los permisos de FitPilot y vuelve a intentar.'
    : 'iOS no aplicó los permisos de Salud. Reinicia el iPhone y vuelve a intentar: suele bastar, incluso si en Ajustes > Privacidad y seguridad > Salud > FitPilot los permisos ya aparecen activados.';
