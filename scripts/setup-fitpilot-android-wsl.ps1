[CmdletBinding()]
param(
  [string]$DistroName = 'FitBite-Android',
  [string]$ArtifactsLocation = 'F:\FitPilot-Builds\android'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Fitpilot-mobile reutiliza la distro Android que ya provisiona FitBite
# (scripts/setup-android-wsl.ps1 en ese repo): JDK 17, Node 20, SDK 36, NDK
# 27.1.12297006 y CMake 3.22.1. Este instalador solo añade el entrypoint de FitPilot,
# así que es rápido e idempotente. Si la distro no existe, provisiónala primero desde
# FitBite en lugar de duplicar toolchain.

$repoRoot = Split-Path -Parent $PSScriptRoot

function Write-Step([string]$Message) {
  Write-Host "`n==> $Message" -ForegroundColor Green
}

function Get-WslDistroNames {
  @(
    wsl.exe --list --quiet |
      ForEach-Object { ($_ -replace "`0", '').Trim() } |
      Where-Object { $_ }
  )
}

function Convert-ToWslPath([string]$WindowsPath) {
  $fullPath = [System.IO.Path]::GetFullPath($WindowsPath)
  if ($fullPath -notmatch '^([A-Za-z]):\\(.*)$') {
    throw "La ruta debe pertenecer a una unidad de Windows: $WindowsPath"
  }

  $drive = $Matches[1].ToLowerInvariant()
  $tail = $Matches[2] -replace '\\', '/'
  "/mnt/$drive/$tail"
}

function Invoke-Wsl([string]$Command, [switch]$AsRoot) {
  if ($AsRoot) {
    & wsl.exe --distribution $DistroName --user root -- bash -lc $Command
  } else {
    & wsl.exe --distribution $DistroName -- bash -lc $Command
  }
  if ($LASTEXITCODE -ne 0) {
    throw "Falló dentro de WSL: $Command"
  }
}

Write-Step "Verificando la distro $DistroName"
if ((Get-WslDistroNames) -notcontains $DistroName) {
  throw "La distro $DistroName no está registrada. Provisiónala primero con scripts/setup-android-wsl.ps1 del repo FitBite."
}

$linuxRepoRoot = Convert-ToWslPath -WindowsPath $repoRoot
$linuxArtifactsRoot = Convert-ToWslPath -WindowsPath $ArtifactsLocation

Write-Step 'Garantizando pnpm nativo en la distro'
# Sin esto, `pnpm` resuelve al shim de npm de Windows bajo /mnt/c y EAS arrastra rutas
# de Windows al build. corepack lee el campo packageManager de package.json.
Invoke-Wsl 'corepack enable pnpm >/dev/null 2>&1 || npm install --global pnpm@10.33.1' -AsRoot
Invoke-Wsl "cd '$linuxRepoRoot' && pnpm --version"

Write-Step 'Escribiendo /etc/fitpilot-android.env'
$envContents = @(
  "FITPILOT_REPO_ROOT=$linuxRepoRoot",
  "FITPILOT_ARTIFACTS_ROOT=$linuxArtifactsRoot"
) -join "`n"
Invoke-Wsl "printf '%s\n' '$envContents' > /etc/fitpilot-android.env && chmod 0644 /etc/fitpilot-android.env" -AsRoot

Write-Step 'Instalando fitpilot-android-build'
Invoke-Wsl "install -m 0755 '$linuxRepoRoot/scripts/fitpilot-android-build.sh' /usr/local/bin/fitpilot-android-build" -AsRoot

Write-Step "Preparando $ArtifactsLocation"
if (-not (Test-Path -LiteralPath $ArtifactsLocation)) {
  New-Item -ItemType Directory -Path $ArtifactsLocation -Force | Out-Null
}

Write-Step 'Verificando el entorno'
Invoke-Wsl 'fitpilot-android-build --check'

Write-Host "`nEntorno listo. Si Expo no está autenticado en la distro:" -ForegroundColor Cyan
Write-Host "  wsl -d $DistroName"
Write-Host '  eas login'
Write-Host "`nDespués ejecuta:"
Write-Host '  pnpm build:android:production:wsl'
Write-Host "`nLos artefactos quedan en:"
Write-Host "  $ArtifactsLocation\<perfil>"
