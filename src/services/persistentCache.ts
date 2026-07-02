import AsyncStorage from '@react-native-async-storage/async-storage';

const FITPILOT_CACHE_PREFIX = 'fitpilot:cache:';

type CacheEnvelope<T> = {
  version: number;
  cachedAt: string;
  value: T;
};

export const readPersistentCache = async <T>(
  key: string,
  version: number,
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
