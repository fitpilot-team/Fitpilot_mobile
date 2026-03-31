import Constants from 'expo-constants';

type PublicExtra = {
  turnstileBridgeUrl?: string;
};

export type TurnstileBridgeMessage =
  | { type: 'ready' }
  | { type: 'token'; token: string }
  | { type: 'expired'; message?: string }
  | { type: 'error'; message?: string };

const DEFAULT_TURNSTILE_BRIDGE_URL = 'https://app.fitpilot.fit/turnstile/mobile';

const extra = (Constants.expoConfig?.extra ?? {}) as PublicExtra;

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

export const resolveTurnstileBridgeUrl = (): string | null =>
  normalizeBridgeUrl(
    process.env.EXPO_PUBLIC_TURNSTILE_BRIDGE_URL ||
      extra.turnstileBridgeUrl ||
      DEFAULT_TURNSTILE_BRIDGE_URL,
  );

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
