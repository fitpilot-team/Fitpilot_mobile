import { ConfigContext, ExpoConfig } from '@expo/config';

type PublicExtra = {
  nutritionApiUrl?: string;
  trainingApiUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
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

const resolveOptionalValue = (
  envValue: string | undefined,
  configValue: string | undefined,
) => {
  const resolved = envValue?.trim() || configValue?.trim();
  return resolved || undefined;
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
  const termsUrl = resolveOptionalValue(
    process.env.EXPO_PUBLIC_TERMS_URL,
    extra.termsUrl,
  );
  const privacyUrl = resolveOptionalValue(
    process.env.EXPO_PUBLIC_PRIVACY_URL,
    extra.privacyUrl,
  );
  const isProd = appEnv === 'production';

  return {
    ...config,
    name: 'FitPilot',
    slug: 'fitpilot-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/AppIcon.png',
    scheme: 'fitpilot',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#182f50',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'com.fitpilot.mobile',
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
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
    plugins: [
      'expo-router',
      'expo-secure-store',
      'expo-asset',
      'expo-font',
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow $(PRODUCT_NAME) to access your photos to let you set your profile picture.',
          cameraPermission:
            'Allow $(PRODUCT_NAME) to access your camera to let you set your profile picture.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      ...config.extra,
      nutritionApiUrl,
      trainingApiUrl,
      termsUrl,
      privacyUrl,
      appEnv,
    },
  };
};
