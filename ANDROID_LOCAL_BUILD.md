# Android Local Build

`Fitpilot-mobile` compila Android localmente con **EAS Build local dentro de WSL 2**,
reutilizando la distro `FitBite-Android` que ya provisiona el repo FitBite. Es el mismo
flujo que se usa allí: un único script que fija el toolchain, valida el entorno, compila y
deja el artefacto con su SHA-256.

Existe además un camino Windows nativo (`npm run build:android:production:local` +
`npm run validate:android:host`), que se mantiene como alternativa pero **no es el flujo
vigente**.

## Requisitos

- Distro WSL 2 `FitBite-Android` registrada. Si no existe, provisiónala desde el repo
  FitBite con `scripts/setup-android-wsl.ps1`; instala JDK 17, Node 20, Android SDK 36,
  NDK 27.1.12297006 y CMake 3.22.1.
- `.env.local` en la raíz de este proyecto (cópialo de `.env.example`).
- Sesión de Expo iniciada dentro de la distro con acceso a `@fitpilot/fitpilot-mobile`.

## Instalación (una sola vez)

```powershell
pnpm setup:android:wsl
```

Verifica la distro, garantiza un `pnpm` **nativo** en Linux vía `corepack`, escribe
`/etc/fitpilot-android.env`, instala `scripts/fitpilot-android-build.sh` como
`/usr/local/bin/fitpilot-android-build`, crea `F:\FitPilot-Builds\android` y termina
ejecutando la validación del toolchain.

Si Expo no está autenticado en la distro:

```powershell
wsl -d FitBite-Android
```

```bash
eas login
```

## Validar el entorno

```powershell
wsl -d FitBite-Android -- bash -lc "fitpilot-android-build --check"
```

Comprueba Java, Node, `pnpm` nativo, EAS CLI, `sdkmanager` y la presencia de SDK 36,
Build Tools 36.0.0, NDK 27.1.12297006 y CMake 3.22.1.

## Compilar

```powershell
pnpm build:android:production:wsl
```

```powershell
pnpm build:android:preview:wsl
```

O directamente dentro de la distro:

```bash
fitpilot-android-build <development|preview|production>
```

El script:

1. Exporta el toolchain Android y `NODE_ENV` según el perfil.
2. Exporta las claves de `.env.local` al entorno. Es **necesario**: eas-cli fuerza
   `EXPO_NO_DOTENV=1`, así que `app.config.ts` no vería las URLs de API y lanzaría
   excepción al evaluar la configuración.
3. **Aborta si hay cambios sin commitear**, porque EAS empaqueta el estado commiteado de
   git y esos cambios se quedarían fuera del artefacto sin aviso. Los archivos sin
   trackear solo generan un aviso.
4. Fuerza `core.autocrlf=true` por entorno (`GIT_CONFIG_*`). El checkout vive en NTFS con
   finales CRLF porque el git de Windows tiene ese ajuste en su config de sistema; el git
   de Linux no lo hereda y, sin esto, ve **todo** el repo como modificado —lo que dispara
   el guard anterior y confunde a eas-cli.
5. Compila en `~/.cache/eas-build/...` (ext4). No usar `/mnt/f` como working dir: el
   `node_modules` de pnpm sobre DrvFs es lento y frágil.
6. Copia el artefacto a `F:\FitPilot-Builds\android\<perfil>\` e imprime tamaño y SHA-256.

## Versionado

El proyecto es **bare** en ambas plataformas (`android/` e `ios/` están commiteados), así
que EAS ignora `android.package` y `expo.version` del config y usa el código nativo:

- `versionName` sale de `android/app/build.gradle`.
- `versionCode` lo inyecta EAS: `eas.json` usa `appVersionSource: remote` con
  `autoIncrement` en el perfil `production`, de modo que cada build de producción consume
  el siguiente número del contador remoto, **aunque el build falle después**.

Consultar y corregir el contador:

```bash
eas build:version:get --platform android
```

```bash
eas build:version:set --platform android
```

## Variables de app requeridas

- `APP_ENV`
- `EXPO_PUBLIC_NUTRITION_API_URL`
- `EXPO_PUBLIC_TRAINING_API_URL`
- `EXPO_PUBLIC_TURNSTILE_BRIDGE_URL`
- `EXPO_PUBLIC_TERMS_URL`
- `EXPO_PUBLIC_PRIVACY_URL`
- `EXPO_PUBLIC_CLIENT_FORGOT_PASSWORD_URL`
- `EXPO_PUBLIC_ACCOUNT_DELETION_URL`

Los perfiles de `eas.json` ya las declaran en su bloque `env`; `.env.local` las mantiene
como única fuente de verdad para el flujo local.

## Notas

- El package Android es `com.fitpilot.mobile`.
- La firma de release usa el keystore remoto de EAS. El `signingConfig release` de
  `android/app/build.gradle` apunta al debug keystore; EAS lo sustituye durante el build.
- El toolchain de la distro trae `eas-cli` global (21.x). El script npm
  `build:android:production:local` fija 19.1.0 vía `pnpm dlx` para el camino Windows; ambas
  versiones cumplen el `>= 14.1.0` que pide `eas.json`.
- Un build de producción en frío tarda ~30-60 min: Gradle + NDK con `newArchEnabled=true`
  y cuatro ABIs.
