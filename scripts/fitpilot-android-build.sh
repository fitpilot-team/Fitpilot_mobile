#!/usr/bin/env bash
# Ejecuta una build EAS Android local de Fitpilot-mobile dentro de una distro WSL.
# Comparte toolchain con la distro FitBite-Android; ver ANDROID_LOCAL_BUILD.md.
set -euo pipefail

if [[ -r /etc/fitpilot-android.env ]]; then
  # Contiene únicamente rutas locales, nunca secretos.
  # shellcheck disable=SC1091
  source /etc/fitpilot-android.env
fi

REPO_ROOT="${FITPILOT_REPO_ROOT:-/mnt/f/ale_o/Repos/Fit_Pilot_1.0/Fitpilot_mobile}"
ARTIFACTS_ROOT="${FITPILOT_ARTIFACTS_ROOT:-/mnt/f/FitPilot-Builds/android}"
ANDROID_HOME="${ANDROID_HOME:-${HOME}/Android/Sdk}"
ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME}}"
ANDROID_NDK_HOME="${ANDROID_NDK_HOME:-${ANDROID_HOME}/ndk/27.1.12297006}"
ANDROID_NDK_ROOT="${ANDROID_NDK_ROOT:-${ANDROID_NDK_HOME}}"
JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}"
GRADLE_USER_HOME="${GRADLE_USER_HOME:-${HOME}/.gradle}"
EAS_LOCAL_BUILD_ROOT="${EAS_LOCAL_BUILD_WORKINGDIR:-${HOME}/.cache/eas-build}"
PATH="${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator"

export ANDROID_HOME ANDROID_SDK_ROOT ANDROID_NDK_HOME ANDROID_NDK_ROOT
export JAVA_HOME GRADLE_USER_HOME PATH

# El checkout vive en NTFS y el git de Windows lo materializa con CRLF (core.autocrlf=true
# en su config de sistema). El git de Linux no hereda ese ajuste, así que sin esto ve el
# repo entero como modificado. Se inyecta por entorno para que también lo apliquen los
# `git` que lanza eas-cli, y sin tocar la config del repo. Es inocuo en un checkout LF:
# autocrlf normaliza a LF antes de comparar en ambos casos.
export GIT_CONFIG_COUNT=1
export GIT_CONFIG_KEY_0=core.autocrlf
export GIT_CONFIG_VALUE_0=true

usage() {
  cat <<'EOF'
Uso:
  fitpilot-android-build <development|preview|production>
  fitpilot-android-build --check
EOF
}

check_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'Falta el comando requerido: %s\n' "$1" >&2
    exit 1
  }
}

# En WSL, `pnpm` suele resolver al shim de npm de Windows bajo /mnt/c. Ese binario
# funciona a medias y arrastra rutas de Windows al build; EAS necesita uno nativo.
check_native_pnpm() {
  local pnpm_path
  pnpm_path="$(command -v pnpm 2>/dev/null || true)"

  if [[ -z "${pnpm_path}" ]]; then
    cat >&2 <<'EOF'
Falta pnpm dentro de la distro. Instálalo con:

  corepack enable pnpm
EOF
    exit 1
  fi

  if [[ "${pnpm_path}" == /mnt/* ]]; then
    cat >&2 <<EOF
pnpm resuelve al binario de Windows (${pnpm_path}), que no sirve para el build local.
Instala uno nativo en la distro:

  corepack enable pnpm
EOF
    exit 1
  fi
}

check_toolchain() {
  check_command java
  check_command node
  check_command eas
  check_command sdkmanager
  check_native_pnpm

  [[ -d "${ANDROID_HOME}/platforms/android-36" ]] || {
    printf 'Falta Android SDK Platform 36.\n' >&2
    exit 1
  }
  [[ -d "${ANDROID_HOME}/build-tools/36.0.0" ]] || {
    printf 'Falta Android Build Tools 36.0.0.\n' >&2
    exit 1
  }
  [[ -d "${ANDROID_HOME}/ndk/27.1.12297006" ]] || {
    printf 'Falta Android NDK 27.1.12297006.\n' >&2
    exit 1
  }
  [[ -d "${ANDROID_HOME}/cmake/3.22.1" ]] || {
    printf 'Falta CMake 3.22.1.\n' >&2
    exit 1
  }

  printf 'Java: '; java -version 2>&1 | head -n 1
  printf 'Node: %s\n' "$(node --version)"
  printf 'pnpm: %s (%s)\n' "$(pnpm --version)" "$(command -v pnpm)"
  printf 'EAS: %s\n' "$(eas --version)"
  printf 'Android SDK: %s\n' "${ANDROID_HOME}"
  printf 'SDK/NDK/CMake: 36 / 27.1.12297006 / 3.22.1\n'
  printf 'Proyecto: %s\n' "${REPO_ROOT}"
}

# eas-cli fuerza EXPO_NO_DOTENV=1 al evaluar el config, así que .env.local no se lee
# solo. app.config.ts lanza excepción si faltan las URLs de API, de modo que las
# exportamos aquí y mantenemos .env.local como única fuente de verdad.
load_app_env() {
  local env_file="$1"
  local raw_line line key value

  while IFS= read -r raw_line || [[ -n "${raw_line}" ]]; do
    line="${raw_line%$'\r'}"
    [[ "${line}" =~ ^[[:space:]]*(#|$) ]] && continue
    [[ "${line}" == *=* ]] || continue

    key="${line%%=*}"
    key="${key//[[:space:]]/}"
    [[ "${key}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue

    value="${line#*=}"
    if [[ "${value}" == \"*\" || "${value}" == \'*\' ]]; then
      value="${value:1:${#value}-2}"
    fi

    export "${key}=${value}"
  done < "${env_file}"
}

if [[ "${1:-}" == "--check" ]]; then
  check_toolchain
  exit 0
fi

PROFILE="${1:-}"

case "${PROFILE}" in
  development|preview|production) ;;
  *) usage >&2; exit 2 ;;
esac

if [[ -z "${NODE_ENV:-}" ]]; then
  if [[ "${PROFILE}" == "development" ]]; then
    NODE_ENV=development
  else
    NODE_ENV=production
  fi
fi
export NODE_ENV

check_toolchain

APP_DIR="${REPO_ROOT}"
for required_file in package.json pnpm-lock.yaml eas.json app.json app.config.ts google-services.json; do
  [[ -f "${APP_DIR}/${required_file}" ]] || {
    printf 'Falta %s en %s.\n' "${required_file}" "${APP_DIR}" >&2
    exit 1
  }
done

if [[ ! -f "${APP_DIR}/.env.local" ]]; then
  printf 'Falta %s/.env.local; créalo desde .env.example antes de compilar.\n' "${APP_DIR}" >&2
  exit 1
fi

load_app_env "${APP_DIR}/.env.local"

for required_var in EXPO_PUBLIC_NUTRITION_API_URL EXPO_PUBLIC_TRAINING_API_URL; do
  [[ -n "${!required_var:-}" ]] || {
    printf '%s no está configurada en .env.local.\n' "${required_var}" >&2
    exit 1
  }
done

# EAS empaqueta el estado commiteado del repo: un cambio sin commitear se quedaría
# fuera del artefacto sin aviso alguno.
if [[ -n "$(git -C "${APP_DIR}" status --porcelain --untracked-files=no)" ]]; then
  printf 'El árbol de git tiene cambios sin commitear y no entrarían en el build:\n\n' >&2
  git -C "${APP_DIR}" status --short --untracked-files=no >&2
  printf '\nCommitéalos o descártalos antes de compilar.\n' >&2
  exit 1
fi

if [[ -n "$(git -C "${APP_DIR}" ls-files --others --exclude-standard)" ]]; then
  printf 'Aviso: hay archivos sin trackear que no entrarán en el build:\n' >&2
  git -C "${APP_DIR}" ls-files --others --exclude-standard >&2
  printf '\n' >&2
fi

if ! eas whoami >/dev/null 2>&1; then
  cat >&2 <<'EOF'
Expo no está autenticado dentro de WSL. Ejecuta:

  eas login

y vuelve a intentar la build.
EOF
  exit 1
fi

ARTIFACTS_DIR="${ARTIFACTS_ROOT}/${PROFILE}"
mkdir -p "${ARTIFACTS_DIR}" "${EAS_LOCAL_BUILD_ROOT}"
EAS_LOCAL_BUILD_WORKINGDIR="$(mktemp -d "${EAS_LOCAL_BUILD_ROOT}/android-${PROFILE}-XXXXXX")"
export EAS_LOCAL_BUILD_WORKINGDIR
export EAS_LOCAL_BUILD_ARTIFACTS_DIR="${ARTIFACTS_DIR}"

version_name="$(sed -n 's/.*versionName "\(.*\)".*/\1/p' "${APP_DIR}/android/app/build.gradle" | head -n 1)"

printf '\nBuild local Android: perfil %s\n' "${PROFILE}"
printf 'versionName: %s (el versionCode lo inyecta EAS desde el contador remoto)\n' "${version_name}"
printf 'Commit: %s\n' "$(git -C "${APP_DIR}" rev-parse --short HEAD)"
printf 'Artefactos: %s\n\n' "${ARTIFACTS_DIR}"

cd "${APP_DIR}"
eas build --platform android --profile "${PROFILE}" --local

artifact="$(find "${ARTIFACTS_DIR}" -maxdepth 1 -type f \( -name '*.apk' -o -name '*.aab' \) -printf '%T@ %p\n' \
  | sort -nr \
  | head -n 1 \
  | cut -d' ' -f2-)"

if [[ -z "${artifact}" ]]; then
  printf 'La build terminó, pero no se encontró un APK/AAB en %s.\n' "${ARTIFACTS_DIR}" >&2
  exit 1
fi

printf '\nArtefacto generado:\n  %s\n' "${artifact}"
printf 'Tamaño:\n  %s\n' "$(du -h "${artifact}" | cut -f1)"
printf 'SHA-256:\n  '
sha256sum "${artifact}" | awk '{ print $1 }'
