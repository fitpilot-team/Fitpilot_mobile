# FitPilot Mobile

Aplicacion mobile en Expo Router con builds via EAS.

## Requisitos

- Node.js 20+
- Cuenta autenticada en Expo (`npx eas-cli login`)
- Variables de entorno configuradas en `.env`
- Para push notifications en Android: archivo `google-services.json`

## Variables locales

Parte de `.env.example` y ajusta:

```bash
EXPO_PUBLIC_NUTRITION_API_URL=http://TU_HOST:3000/v1
EXPO_PUBLIC_TRAINING_API_URL=http://TU_HOST:8010/api
EXPO_ANDROID_GOOGLE_SERVICES_FILE=./google-services.json
```

`EXPO_ANDROID_GOOGLE_SERVICES_FILE` es opcional para desarrollo general, pero necesario si el build Android debe registrar Firebase para push notifications.

En EAS Build conviene cargar ese archivo como secret file con el nombre `GOOGLE_SERVICES_JSON`.

## Desarrollo

```bash
npm install
npm run android
```

## Builds Android

APK interna para pruebas:

```bash
npx eas-cli build --platform android --profile preview
```

AAB para Google Play:

```bash
npx eas-cli build --platform android --profile production
```

## Submit a Google Play

Para automatizar el submit necesitas configurar en Expo una service account de Google Play con permisos de publicacion. Luego puedes correr:

```bash
npx eas-cli submit --platform android --profile production
```

El perfil `preview` queda dirigido al track `internal` y `production` al track `production`.
