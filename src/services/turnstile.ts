import Constants from 'expo-constants';

type PublicExtra = {
  turnstileBridgeUrl?: string;
};

export type TurnstileBridgeMessage =
  | { type: 'ready' }
  | { type: 'token'; token: string }
  | { type: 'expired'; message?: string }
  | { type: 'error'; message?: string };

const DEFAULT_TURNSTILE_BRIDGE_URL = 'https://pro.fitpilot.fit/turnstile/mobile';

const extra = (Constants.expoConfig?.extra ?? {}) as PublicExtra;
let hasLoggedDefaultBridgeUsage = false;
let hasLoggedInvalidBridgeUrl = false;

const normalizeBridgeUrl = (value: string | undefined): string | null => {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized).toString();
  } catch {
    return null;
  }
};

const resolveConfiguredBridgeUrl = () => {
  const envValue = process.env.EXPO_PUBLIC_TURNSTILE_BRIDGE_URL?.trim();
  if (envValue) {
    return {
      source: 'env',
      value: envValue,
    } as const;
  }

  const extraValue = extra.turnstileBridgeUrl?.trim();
  if (extraValue) {
    return {
      source: 'expo-config',
      value: extraValue,
    } as const;
  }

  return null;
};

export const resolveTurnstileBridgeUrl = (): string | null => {
  const configuredBridge = resolveConfiguredBridgeUrl();
  if (configuredBridge) {
    const normalized = normalizeBridgeUrl(configuredBridge.value);

    if (__DEV__ && !normalized && !hasLoggedInvalidBridgeUrl) {
      hasLoggedInvalidBridgeUrl = true;
      console.warn('[Turnstile] Invalid public bridge URL configuration:', configuredBridge);
    }

    return normalized;
  }

  const fallbackUrl = normalizeBridgeUrl(DEFAULT_TURNSTILE_BRIDGE_URL);
  if (__DEV__ && fallbackUrl && !hasLoggedDefaultBridgeUsage) {
    hasLoggedDefaultBridgeUsage = true;
    console.warn(
      '[Turnstile] EXPO_PUBLIC_TURNSTILE_BRIDGE_URL is not configured. Falling back to default bridge URL:',
      fallbackUrl,
    );
  }

  return fallbackUrl;
};

export const buildTurnstileBridgeUrl = (reloadKey: number, platform: string): string | null => {
  const baseUrl = resolveTurnstileBridgeUrl();
  if (!baseUrl) {
    return null;
  }

  const url = new URL(baseUrl);
  url.searchParams.set('platform', platform);
  url.searchParams.set('reload', String(reloadKey));
  return url.toString();
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const parseTurnstileBridgeMessage = (
  payload: string,
): TurnstileBridgeMessage | null => {
  try {
    const parsed = JSON.parse(payload) as unknown;
    if (!isObject(parsed) || typeof parsed.type !== 'string') {
      return null;
    }

    if (parsed.type === 'ready') {
      return { type: 'ready' };
    }

    if (parsed.type === 'token' && typeof parsed.token === 'string' && parsed.token.trim()) {
      return { type: 'token', token: parsed.token };
    }

    if (parsed.type === 'expired') {
      return {
        type: 'expired',
        message: typeof parsed.message === 'string' ? parsed.message : undefined,
      };
    }

    if (parsed.type === 'error') {
      return {
        type: 'error',
        message: typeof parsed.message === 'string' ? parsed.message : undefined,
      };
    }
  } catch {
    return null;
  }

  return null;
};
