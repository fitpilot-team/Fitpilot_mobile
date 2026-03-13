import { ConfigContext, ExpoConfig } from '@expo/config';

type PublicExtra = {
  nutritionApiUrl?: string;
  trainingApiUrl?: string;
};

const resolveRequiredUrl = (
  envValue: string | undefined,
  configValue: string | undefined,
  envKey: 'EXPO_PUBLIC_NUTRITION_API_URL' | 'EXPO_PUBLIC_TRAINING_API_URL',
) => {
  const resolved = envValue?.trim() || configValue?.trim();

  if (!resolved) {
    throw new Error(
      `[Fitpilot-mobile] Missing ${envKey}. Configure both EXPO_PUBLIC_NUTRITION_API_URL and EXPO_PUBLIC_TRAINING_API_URL.`,
    );
  }

  return resolved.replace(/\/+$/, '');
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = process.env.APP_ENV || 'development';
  const extra = (config.extra ?? {}) as PublicExtra;
  const nutritionApiUrl = resolveRequiredUrl(
    process.env.EXPO_PUBLIC_NUTRITION_API_URL,
    extra.nutritionApiUrl,
    'EXPO_PUBLIC_NUTRITION_API_URL',
  );
  const trainingApiUrl = resolveRequiredUrl(
    process.env.EXPO_PUBLIC_TRAINING_API_URL,
    extra.trainingApiUrl,
    'EXPO_PUBLIC_TRAINING_API_URL',
  );
  const isProd = appEnv === 'production';

  return {
    ...config,
    name: 'FitPilot',
    slug: 'fitpilot-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'fitpilot',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#3b82f6',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.fitpilot.mobile',
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: !isProd,
          NSAllowsLocalNetworking: !isProd,
        },
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#3b82f6',
      },
      package: 'com.fitpilot.mobile',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-router', 'expo-secure-store', 'expo-asset', 'expo-font'],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      ...config.extra,
      nutritionApiUrl,
      trainingApiUrl,
      appEnv,
    },
  };
};
