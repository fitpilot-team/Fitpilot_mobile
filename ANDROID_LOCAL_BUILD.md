# Android Local Build on Windows

`Fitpilot-mobile` compila Android localmente desde Windows. WSL 2 queda instalado como apoyo general, pero no es el host recomendado para `EAS local build`.

## Host prerequisites

- WSL 2 con Ubuntu 24.04 instalado
- Android Studio en Windows
- Android SDK en `%LOCALAPPDATA%\Android\Sdk`
- `ANDROID_SDK_ROOT` y `ANDROID_HOME` apuntando al SDK
- `JAVA_HOME` apuntando al JBR de Android Studio o a un JDK 17+

## Required SDK paths

- `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`
- `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\lib\...`

## Validate the host

Desde PowerShell en este directorio:

```powershell
npm run validate:android:host
```

Esto valida:

- Java
- `adb`
- `sdkmanager` mediante `scripts/invoke-sdkmanager.ps1`
- resolución de `expo config`
- sesión activa en Expo/EAS

## Build command

Carga las variables requeridas de la app y ejecuta:

```powershell
$env:APP_ENV = 'production'
npm run build:android:production:local
```

`expo` ya toma `EXPO_PUBLIC_*` desde `.env.local` cuando están definidos allí.

## Required app env vars

- `APP_ENV=production`
- `EXPO_PUBLIC_NUTRITION_API_URL`
- `EXPO_PUBLIC_TRAINING_API_URL`
- `EXPO_PUBLIC_TURNSTILE_BRIDGE_URL`
- `EXPO_PUBLIC_TERMS_URL`
- `EXPO_PUBLIC_PRIVACY_URL`
- `EXPO_PUBLIC_CLIENT_FORGOT_PASSWORD_URL`

## Notes

- El package Android configurado es `com.fitpilot.mobile`.
- La build de release local usa `node ./node_modules/eas-cli/bin/run build --platform android --profile production --local`.
- Si `node ./node_modules/eas-cli/bin/run whoami` falla, inicia sesión antes de compilar:

```powershell
node .\node_modules\eas-cli\bin\run login
```
