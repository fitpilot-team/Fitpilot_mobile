# CLAUDE.md - Fitpilot_mobile

App movil Fitpilot construida con Expo, React Native y Expo Router.

## Stack

- Expo 54, React Native 0.81, React 19.
- Expo Router.
- Zustand para estado.
- Axios para HTTP.
- lucide-react-native y Expo Vector Icons.
- Reanimated, Safe Area, Screens, Secure Store, Notifications, Video.
- Package manager: `pnpm`.

## Estructura importante

- `app`: rutas Expo Router.
- `app/(tabs)`: navegacion principal por tabs.
- `src/components`: componentes compartidos.
- `src/services`: clientes e integraciones.
- `src/store`: estado global.
- `src/theme`: tokens/estilos compartidos.
- `src/hooks`, `src/utils`, `src/types`: soporte reutilizable.
- `assets`: imagenes, fuentes y recursos.
- `modules/fitpilot-health`: modulo nativo/local relacionado con health.
- `scripts`: validaciones auxiliares.

## Comandos

```bash
pnpm start
pnpm android
pnpm ios
pnpm web
pnpm lint
pnpm typescript
pnpm check:text-encoding
pnpm build:android:production:local
```

## Reglas de trabajo

- Manten pantallas en `app` y logica reusable en `src`.
- Respeta convenciones de Expo Router antes de agregar navegacion manual.
- Usa componentes nativos/Expo existentes antes de agregar librerias.
- No edites `.expo` ni artefactos generados.
- Cuida encoding de textos; existe `pnpm check:text-encoding`.
- Para secretos o endpoints, usa `.env.example` como referencia y no escribas valores reales.

## Validacion recomendada

- Para cambios TypeScript: `pnpm typescript`.
- Para cambios de estilo/codigo: `pnpm lint`.
- Para cambios de copy o encoding: `pnpm check:text-encoding`.
- Para cambios de rutas/pantallas: probar con `pnpm start` o plataforma especifica.
