import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WebViewMessageEvent } from 'react-native-webview';
import { WebView } from 'react-native-webview';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { buildTurnstileBridgeUrl, parseTurnstileBridgeMessage } from '../../services/turnstile';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface TurnstileChallengeModalProps {
  visible: boolean;
  onClose: () => void;
  onToken: (token: string) => void | Promise<void>;
}

type WebViewLoadState = 'idle' | 'loading' | 'loaded' | 'error';
type BridgeState = 'waiting' | 'ready' | 'token' | 'expired' | 'error';

const CONFIGURATION_ERROR_MESSAGE =
  'No fue posible abrir la verificacion de seguridad. Revisa la configuracion publica del bridge.';
const LOAD_ERROR_MESSAGE =
  'No se pudo cargar la verificacion de seguridad. Intenta de nuevo.';
const WAITING_HELP_MESSAGE =
  'Si el challenge tarda en mostrarse, espera unos segundos o recarga la verificacion.';

export const TurnstileChallengeModal: React.FC<TurnstileChallengeModalProps> = ({
  visible,
  onClose,
  onToken,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [reloadKey, setReloadKey] = useState(0);
  const [webViewState, setWebViewState] = useState<WebViewLoadState>('idle');
  const [bridgeState, setBridgeState] = useState<BridgeState>('waiting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const tokenHandledRef = useRef(false);

  const bridgeUrl = useMemo(
    () => buildTurnstileBridgeUrl(reloadKey, Platform.OS),
    [reloadKey],
  );

  const logDebug = useCallback((event: string, details?: Record<string, unknown>) => {
    if (!__DEV__) {
      return;
    }

    if (details) {
      console.log('[Turnstile]', event, details);
      return;
    }

    console.log('[Turnstile]', event);
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    tokenHandledRef.current = false;

    if (!bridgeUrl) {
      setWebViewState('error');
      setBridgeState('error');
      setErrorMessage(CONFIGURATION_ERROR_MESSAGE);
      logDebug('bridge-url-missing');
      return;
    }

    setWebViewState('loading');
    setBridgeState('waiting');
    setErrorMessage(null);
    logDebug('modal-open', { bridgeUrl });
  }, [bridgeUrl, logDebug, visible]);

  const handleRetry = useCallback(() => {
    tokenHandledRef.current = false;
    setWebViewState('loading');
    setBridgeState('waiting');
    setErrorMessage(null);
    setReloadKey((current) => current + 1);
    logDebug('retry');
  }, [logDebug]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      logDebug('message-received', { payload: event.nativeEvent.data });

      const message = parseTurnstileBridgeMessage(event.nativeEvent.data);
      if (!message) {
        logDebug('message-ignored');
        return;
      }

      if (message.type === 'ready') {
        setBridgeState('ready');
        setErrorMessage(null);
        return;
      }

      if (message.type === 'token') {
        if (tokenHandledRef.current) {
          return;
        }

        tokenHandledRef.current = true;
        setBridgeState('token');
        void Promise.resolve(onToken(message.token));
        return;
      }

      tokenHandledRef.current = false;
      setBridgeState(message.type === 'expired' ? 'expired' : 'error');
      setErrorMessage(
        message.message ||
          (message.type === 'expired'
            ? 'La verificacion expiro. Intenta de nuevo.'
            : LOAD_ERROR_MESSAGE),
      );
    },
    [logDebug, onToken],
  );

  const handleLoadFailure = useCallback(
    (source: 'error' | 'http-error', details?: Record<string, unknown>) => {
      logDebug('load-failure', {
        source,
        ...(details ?? {}),
      });

      tokenHandledRef.current = false;
      setWebViewState('error');
      setBridgeState('error');
      setErrorMessage(LOAD_ERROR_MESSAGE);
    },
    [logDebug],
  );

  const showLoadingOverlay = webViewState === 'loading';
  const showErrorOverlay =
    webViewState === 'error' || bridgeState === 'error' || bridgeState === 'expired';
  const showWaitingHelp = webViewState === 'loaded' && bridgeState === 'waiting';

  // Injected JS: zoom-out the entire bridge page so it fits without horizontal clipping
  const injectedJS = `
    (function() {
      // Force a viewport meta that scales the page down to fit
      var existingMeta = document.querySelector('meta[name="viewport"]');
      if (existingMeta) {
        existingMeta.setAttribute('content', 'width=device-width, initial-scale=0.88, maximum-scale=1, user-scalable=no');
      } else {
        var meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=0.88, maximum-scale=1, user-scalable=no';
        document.head.appendChild(meta);
      }

      // Prevent any scrolling
      var style = document.createElement('style');
      style.textContent =
        'html, body { overflow: hidden !important; max-width: 100vw !important; }';
      document.head.appendChild(style);
    })();
    true;
  `;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Verificación de seguridad</Text>
              <Text style={styles.subtitle}>
                Completa el challenge para continuar con el inicio de sesión.
              </Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Cerrar verificacion de seguridad"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.webViewWrapper}>
            {bridgeUrl ? (
              <WebView
                key={bridgeUrl}
                source={{ uri: bridgeUrl }}
                style={styles.webView}
                javaScriptEnabled
                domStorageEnabled
                sharedCookiesEnabled
                thirdPartyCookiesEnabled
                cacheEnabled={false}
                setSupportMultipleWindows={false}
                scrollEnabled={false}
                overScrollMode="never"
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                scalesPageToFit={Platform.OS === 'android'}
                injectedJavaScript={injectedJS}
                originWhitelist={['https://*', 'about:blank', 'about:srcdoc']}
                onMessage={handleMessage}
                onError={(event) => {
                  handleLoadFailure('error', {
                    code: event.nativeEvent.code,
                    description: event.nativeEvent.description,
                    url: event.nativeEvent.url,
                  });
                }}
                onHttpError={(event) => {
                  handleLoadFailure('http-error', {
                    description: event.nativeEvent.description,
                    statusCode: event.nativeEvent.statusCode,
                    url: event.nativeEvent.url,
                  });
                }}
                onLoadStart={(event) => {
                  tokenHandledRef.current = false;
                  setWebViewState('loading');
                  setBridgeState('waiting');
                  setErrorMessage(null);
                  logDebug('load-start', { url: event.nativeEvent.url });
                }}
                onLoadEnd={(event) => {
                  setWebViewState((current) => (current === 'error' ? current : 'loaded'));
                  logDebug('load-end', { url: event.nativeEvent.url });
                }}
              />
            ) : null}

            {showLoadingOverlay ? (
              <View style={styles.overlayState}>
                <LoadingSpinner text="Preparando verificación..." />
              </View>
            ) : null}

            {showErrorOverlay ? (
              <View style={styles.overlayState}>
                <View style={styles.errorCard}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={28}
                    color={theme.colors.error}
                  />
                  <Text style={styles.errorTitle}>No se pudo completar el challenge</Text>
                  <Text style={styles.errorText}>{errorMessage || LOAD_ERROR_MESSAGE}</Text>
                  <Button title="Reintentar" onPress={handleRetry} style={styles.retryButton} />
                </View>
              </View>
            ) : null}
          </View>

          {showWaitingHelp ? (
            <View style={styles.waitingHelpCard}>
              <View style={styles.waitingHelpCopy}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={styles.waitingHelpText}>{WAITING_HELP_MESSAGE}</Text>
              </View>
              <Button title="Reintentar" onPress={handleRetry} style={styles.waitingHelpButton} />
            </View>
          ) : null}

          <Text style={styles.footerText}>
            Si cierras este modal, tu sesión no se iniciará hasta completar la verificación.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.sm,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay,
    },
    card: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      maxWidth: 420,
      alignSelf: 'center',
      width: '100%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    headerCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: fontSize.xs,
      lineHeight: 18,
      color: theme.colors.textSecondary,
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    webViewWrapper: {
      flex: 1,
      minHeight: 300,
      marginHorizontal: spacing.sm,
      marginBottom: spacing.sm,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      backgroundColor: theme.isDark ? '#0b1423' : '#f8fafc',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    webView: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    overlayState: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.isDark ? 'rgba(8, 17, 31, 0.92)' : 'rgba(248, 250, 252, 0.96)',
      padding: spacing.md,
    },
    waitingHelpCard: {
      marginHorizontal: spacing.sm,
      marginBottom: spacing.sm,
      padding: spacing.sm,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      gap: spacing.xs,
    },
    waitingHelpCopy: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    waitingHelpText: {
      flex: 1,
      fontSize: fontSize.xs,
      lineHeight: 18,
      color: theme.colors.textSecondary,
    },
    waitingHelpButton: {
      alignSelf: 'stretch',
    },
    errorCard: {
      width: '100%',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: spacing.sm,
    },
    errorTitle: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    errorText: {
      fontSize: fontSize.xs,
      lineHeight: 18,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    retryButton: {
      alignSelf: 'stretch',
      marginTop: spacing.xs,
    },
    footerText: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      color: theme.colors.textMuted,
      fontSize: fontSize.xs,
      lineHeight: 16,
      textAlign: 'center',
    },
  });

export default TurnstileChallengeModal;
