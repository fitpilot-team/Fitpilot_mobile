import AsyncStorage from '@react-native-async-storage/async-storage';

const FITPILOT_CACHE_PREFIX = 'fitpilot:cache:';

export const DEFAULT_PERSISTENT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type CacheEnvelope<T> = {
  version: number;
  cachedAt: string;
  value: T;
};

export const readPersistentCache = async <T>(
  key: string,
  version: number,
  maxAgeMs: number = DEFAULT_PERSISTENT_CACHE_TTL_MS,
): Promise<T | null> => {
  try {
    const storedValue = await AsyncStorage.getItem(key);
    if (!storedValue) {
      return null;
    }

    const parsed = JSON.parse(storedValue) as Partial<CacheEnvelope<T>>;
    if (parsed.version !== version || parsed.value === undefined) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    const cachedAtMs =
      typeof parsed.cachedAt === 'string' ? Date.parse(parsed.cachedAt) : Number.NaN;
    if (!Number.isFinite(cachedAtMs) || Date.now() - cachedAtMs > maxAgeMs) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return parsed.value as T;
  } catch {
    return null;
  }
};

export const clearFitpilotPersistentCaches = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((key) => key.startsWith(FITPILOT_CACHE_PREFIX));

    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch {
    // Cache cleanup is best-effort.
  }
};

export const removePersistentCache = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Cache removal is best-effort.
  }
};

export const writePersistentCache = async <T>(
  key: string,
  version: number,
  value: T,
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({
        version,
        cachedAt: new Date().toISOString(),
        value,
      } satisfies CacheEnvelope<T>),
    );
  } catch {
    // Offline caches should never block the live request path.
  }
};
