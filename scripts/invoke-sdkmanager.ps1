$ErrorActionPreference = 'Stop'

$defaultSdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$sdkRoot = if ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { $defaultSdkRoot }
$javaHome = if ($env:JAVA_HOME) { $env:JAVA_HOME } else { 'C:\Program Files\Android\Android Studio\jbr' }

$libRoot = Join-Path $sdkRoot 'cmdline-tools\latest\lib'
$javaExe = Join-Path $javaHome 'bin\java.exe'

if (-not (Test-Path $javaExe)) {
  throw "java.exe no existe en $javaExe"
}

if (-not (Test-Path $libRoot)) {
  throw "cmdline-tools lib no existe en $libRoot"
}

$classpath = (Get-ChildItem -Path $libRoot -Recurse -Filter *.jar | ForEach-Object {
  $_.FullName
}) -join ';'

if (-not $classpath) {
  throw "No se encontraron jars de cmdline-tools bajo $libRoot"
}

& $javaExe "-Dcom.android.sdklib.toolsdir=$sdkRoot\cmdline-tools\latest" -classpath $classpath com.android.sdklib.tool.sdkmanager.SdkManagerCli @args
