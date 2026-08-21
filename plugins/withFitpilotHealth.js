const {
  withAndroidManifest,
  withAppBuildGradle,
  withEntitlementsPlist,
  withInfoPlist,
} = require('expo/config-plugins');

const HEALTH_CONNECT_PACKAGE = 'com.google.android.apps.healthdata';
const HEALTH_CONNECT_SETTINGS_ACTION = 'androidx.health.ACTION_HEALTH_CONNECT_SETTINGS';

const HEALTH_CONNECT_READ_PERMISSIONS = [
  'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
  'android.permission.health.READ_BASAL_METABOLIC_RATE',
  'android.permission.health.READ_BLOOD_GLUCOSE',
  'android.permission.health.READ_BLOOD_PRESSURE',
  'android.permission.health.READ_BODY_FAT',
  'android.permission.health.READ_DISTANCE',
  'android.permission.health.READ_EXERCISE',
  'android.permission.health.READ_HEART_RATE',
  'android.permission.health.READ_HEART_RATE_VARIABILITY',
  'android.permission.health.READ_LEAN_BODY_MASS',
  'android.permission.health.READ_RESTING_HEART_RATE',
  'android.permission.health.READ_SLEEP',
  'android.permission.health.READ_STEPS',
  'android.permission.health.READ_TOTAL_CALORIES_BURNED',
  'android.permission.health.READ_WEIGHT',
  // Sin este permiso Health Connect limita cada lectura a los 30 días posteriores a la
  // concesión, y el sync pide exactamente 30: los días más antiguos volvían vacíos.
  // Denegarlo no bloquea nada, solo recorta el histórico.
  'android.permission.health.READ_HEALTH_DATA_HISTORY',
];

const addUniqueManifestNode = (nodes, node) => {
  const name = node.$?.['android:name'];
  if (!name) {
    return nodes;
  }

  if (nodes.some((item) => item.$?.['android:name'] === name)) {
    return nodes;
  }

  return [...nodes, node];
};

const ensureHealthConnectQueries = (manifest) => {
  const queries = manifest.queries?.[0] ?? {};
  const packages = queries.package ?? [];

  queries.package = addUniqueManifestNode(packages, {
    $: { 'android:name': HEALTH_CONNECT_PACKAGE },
  });

  // En Android 14+ los ajustes de Health Connect los sirve el modulo del sistema
  // (com.google.android.healthconnect.controller), que no esta en <package>. Sin declarar
  // tambien el intent, "Abrir Health Connect" no resolvia y caia al fallback de Play Store,
  // que en Android 14+ es un callejon sin salida.
  const intents = queries.intent ?? [];
  const hasSettingsIntent = intents.some((intent) =>
    intent?.action?.some(
      (action) => action?.$?.['android:name'] === HEALTH_CONNECT_SETTINGS_ACTION,
    ),
  );
  queries.intent = hasSettingsIntent
    ? intents
    : [
        ...intents,
        { action: [{ $: { 'android:name': HEALTH_CONNECT_SETTINGS_ACTION } }] },
      ];

  manifest.queries = [queries];
};

const ensureHealthConnectPermissions = (manifest) => {
  const permissions = manifest['uses-permission'] ?? [];
  manifest['uses-permission'] = HEALTH_CONNECT_READ_PERMISSIONS.reduce(
    (current, permission) =>
      addUniqueManifestNode(current, { $: { 'android:name': permission } }),
    permissions,
  );
};

const ensureHealthConnectRationaleAliases = (application) => {
  const aliases = application['activity-alias'] ?? [];
  const nextAliases = [
    {
      $: {
        'android:name': '.HealthPermissionsRationaleActivity',
        'android:exported': 'true',
        'android:targetActivity': '.MainActivity',
      },
      'intent-filter': [
        {
          action: [
            {
              $: {
                'android:name': 'androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE',
              },
            },
          ],
        },
      ],
    },
    {
      $: {
        'android:name': '.ViewPermissionUsageActivity',
        'android:exported': 'true',
        'android:permission': 'android.permission.START_VIEW_PERMISSION_USAGE',
        'android:targetActivity': '.MainActivity',
      },
      'intent-filter': [
        {
          action: [
            {
              $: { 'android:name': 'android.intent.action.VIEW_PERMISSION_USAGE' },
            },
          ],
          category: [
            {
              $: {
                'android:name': 'android.intent.category.HEALTH_PERMISSIONS',
              },
            },
          ],
        },
      ],
    },
  ];

  application['activity-alias'] = nextAliases.reduce(
    (current, alias) => addUniqueManifestNode(current, alias),
    aliases,
  );
};

function withFitpilotHealth(config) {
  config = withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = mod.modResults.contents.replace(
      'minSdkVersion rootProject.ext.minSdkVersion',
      'minSdkVersion Math.max(rootProject.ext.minSdkVersion as int, 28)',
    );
    return mod;
  });

  config = withEntitlementsPlist(config, (mod) => {
    mod.modResults['com.apple.developer.healthkit'] = true;
    delete mod.modResults['com.apple.developer.healthkit.access'];
    return mod;
  });

  config = withInfoPlist(config, (mod) => {
    mod.modResults.NSHealthShareUsageDescription =
      mod.modResults.NSHealthShareUsageDescription ||
      'FitPilot lee datos de Salud y actividad para mostrar tu progreso de entrenamiento, nutrición y recuperación.';
    mod.modResults.NSHealthUpdateUsageDescription =
      mod.modResults.NSHealthUpdateUsageDescription ||
      'FitPilot puede guardar en Salud los datos de actividad que elijas sincronizar para mantener actualizado tu historial de entrenamiento y progreso.';
    return mod;
  });

  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const application = manifest.application?.[0];

    ensureHealthConnectQueries(manifest);
    ensureHealthConnectPermissions(manifest);
    if (application) {
      ensureHealthConnectRationaleAliases(application);
    }

    return mod;
  });
}

module.exports = withFitpilotHealth;
