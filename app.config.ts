import { ConfigContext, ExpoConfig } from '@expo/config';

const getApiUrl = (config: ExpoConfig) => {
  return (
    process.env.EXPO_PUBLIC_API_URL ||
    config.extra?.apiUrl ||
    // IP del host accesible desde el móvil (con sufijo /api)
    'http://192.168.100.12:8000/api'
  );
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnv = process.env.APP_ENV || 'development';
  const apiUrl = getApiUrl(config);
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
          // En producción se aplica ATS por defecto (HTTPS); en dev permitimos red local y cargas arbitrarias
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
      apiUrl,
      appEnv,
    },
  };
};
