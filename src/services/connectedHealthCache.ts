import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ConnectedHealthSummaryResponse } from './connectedHealth';

// La versión va en la clave: si el shape del resumen cambia, las entradas viejas se
// ignoran solas en lugar de romper la pantalla con datos de otro formato.
const CACHE_KEY_PREFIX = 'fitpilot:connected-health:summary:v1:';

// Más allá de esto, lo cacheado ya no dice nada útil y es preferible el estado vacío a
// enseñar la actividad de la semana pasada como si fuera la de hoy.
const MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type CacheEnvelope = {
  cachedAtMs: number;
  days: number;
  summary: ConnectedHealthSummaryResponse;
};

const getKey = (userId: string, days: number) =>
  `${CACHE_KEY_PREFIX}${encodeURIComponent(userId)}:${days}`;

/**
 * Último resumen conocido, para pintar algo real en el primer frame.
 *
 * Sin esto, abrir la pantalla siempre empezaba por un skeleton: `getSummary` pega a la red
 * en cada montaje y hasta que responde no hay nada que enseñar. Con la caché, el número
 * aparece de inmediato —incluso sin cobertura— y se refresca por debajo.
 */
export const readCachedConnectedHealthSummary = async (
  userId: string,
  days: number,
): Promise<ConnectedHealthSummaryResponse | null> => {
  try {
    const raw = await AsyncStorage.getItem(getKey(userId, days));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CacheEnvelope;
    if (
      !parsed?.summary ||
      typeof parsed.cachedAtMs !== 'number' ||
      Date.now() - parsed.cachedAtMs > MAX_CACHE_AGE_MS
    ) {
      return null;
    }

    return parsed.summary;
  } catch {
    // Una entrada corrupta no debe impedir arrancar: se trata como si no hubiera caché.
    return null;
  }
};

export const writeCachedConnectedHealthSummary = async (
  userId: string,
  days: number,
  summary: ConnectedHealthSummaryResponse,
): Promise<void> => {
  try {
    const envelope: CacheEnvelope = { cachedAtMs: Date.now(), days, summary };
    await AsyncStorage.setItem(getKey(userId, days), JSON.stringify(envelope));
  } catch {
    // Escribir la caché es una optimización, nunca un motivo para fallar un refresco.
  }
};

/** Al cerrar sesión: la caché es por usuario y no debe sobrevivir al cambio de cuenta. */
export const clearCachedConnectedHealthSummaries = async (
  userId: string,
): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = `${CACHE_KEY_PREFIX}${encodeURIComponent(userId)}:`;
    const mine = keys.filter((key) => key.startsWith(prefix));
    if (mine.length) {
      await AsyncStorage.multiRemove(mine);
    }
  } catch {
    // Idem: no bloquea el cierre de sesión.
  }
};
