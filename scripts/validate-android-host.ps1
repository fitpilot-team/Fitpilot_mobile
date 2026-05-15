$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$defaultSdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$sdkRoot = if ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { $defaultSdkRoot }

if (-not (Test-Path $sdkRoot)) {
  throw "ANDROID_SDK_ROOT no existe: $sdkRoot"
}

$env:ANDROID_SDK_ROOT = $sdkRoot
$env:ANDROID_HOME = $sdkRoot

if (-not $env:JAVA_HOME) {
  $androidStudioJbr = 'C:\Program Files\Android\Android Studio\jbr'
  if (Test-Path $androidStudioJbr) {
    $env:JAVA_HOME = $androidStudioJbr
  }
}

$adbPath = Join-Path $sdkRoot 'platform-tools\adb.exe'
$sdkManagerPath = Join-Path $PSScriptRoot 'invoke-sdkmanager.ps1'

Write-Host "Using ANDROID_SDK_ROOT=$sdkRoot"
Write-Host "Using JAVA_HOME=$($env:JAVA_HOME)"

if (-not (Test-Path $adbPath)) {
  throw "adb.exe no existe en $adbPath"
}

if (-not (Test-Path $sdkManagerPath)) {
  throw "invoke-sdkmanager.ps1 no existe en $sdkManagerPath"
}

Write-Host ''
Write-Host '== java -version =='
& (Join-Path $env:JAVA_HOME 'bin\java.exe') -version

Write-Host ''
Write-Host '== adb version =='
& $adbPath version

Write-Host ''
Write-Host '== sdkmanager --version =='
& powershell -ExecutionPolicy Bypass -File $sdkManagerPath --version

Write-Host ''
Write-Host '== expo config --type public =='
Push-Location $projectRoot
try {
  npx expo config --type public

  Write-Host ''
  Write-Host '== eas-cli whoami =='
  node .\node_modules\eas-cli\bin\run whoami
}
finally {
  Pop-Location
}
