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

type ChallengeViewState = 'loading' | 'ready' | 'error';

const CONFIGURATION_ERROR_MESSAGE =
  'No fue posible abrir la verificacion de seguridad. Revisa la configuracion publica del bridge.';
const LOAD_ERROR_MESSAGE =
  'No se pudo cargar la verificacion de seguridad. Intenta de nuevo.';

export const TurnstileChallengeModal: React.FC<TurnstileChallengeModalProps> = ({
  visible,
  onClose,
  onToken,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [reloadKey, setReloadKey] = useState(0);
  const [viewState, setViewState] = useState<ChallengeViewState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const tokenHandledRef = useRef(false);

  const bridgeUrl = useMemo(
    () => buildTurnstileBridgeUrl(reloadKey, Platform.OS),
    [reloadKey],
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    tokenHandledRef.current = false;
    if (!bridgeUrl) {
      setViewState('error');
      setErrorMessage(CONFIGURATION_ERROR_MESSAGE);
      return;
    }

    setViewState('loading');
    setErrorMessage(null);
  }, [bridgeUrl, visible]);

  const handleRetry = useCallback(() => {
    tokenHandledRef.current = false;
    setViewState('loading');
    setErrorMessage(null);
    setReloadKey((current) => current + 1);
  }, []);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const message = parseTurnstileBridgeMessage(event.nativeEvent.data);
      if (!message) {
        return;
      }

      if (message.type === 'ready') {
        setViewState('ready');
        setErrorMessage(null);
        return;
      }

      if (message.type === 'token') {
        if (tokenHandledRef.current) {
          return;
        }

        tokenHandledRef.current = true;
        void Promise.resolve(onToken(message.token));
        return;
      }

      tokenHandledRef.current = false;
      setViewState('error');
      setErrorMessage(
        message.message ||
          (message.type === 'expired'
            ? 'La verificacion expiro. Intenta de nuevo.'
            : LOAD_ERROR_MESSAGE),
      );
    },
    [onToken],
  );

  const handleLoadFailure = useCallback(() => {
    tokenHandledRef.current = false;
    setViewState('error');
    setErrorMessage(LOAD_ERROR_MESSAGE);
  }, []);

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
              <Text style={styles.title}>Verificacion de seguridad</Text>
              <Text style={styles.subtitle}>
                Completa el challenge para continuar con el inicio de sesion.
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
                originWhitelist={['https://*', 'about:blank', 'about:srcdoc']}
                onMessage={handleMessage}
                onError={handleLoadFailure}
                onHttpError={handleLoadFailure}
                onLoadStart={() => {
                  tokenHandledRef.current = false;
                  setViewState('loading');
                  setErrorMessage(null);
                }}
              />
            ) : null}

            {viewState === 'loading' ? (
              <View style={styles.overlayState}>
                <LoadingSpinner text="Preparando verificacion..." />
              </View>
            ) : null}

            {viewState === 'error' ? (
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

          <Text style={styles.footerText}>
            Si cierras este modal, tu sesion no se iniciara hasta completar la verificacion.
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
      padding: spacing.lg,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.overlay,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.md,
    },
    headerCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textSecondary,
    },
    closeButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    webViewWrapper: {
      height: 340,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
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
      padding: spacing.lg,
    },
    errorCard: {
      width: '100%',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: spacing.sm,
    },
    errorTitle: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    errorText: {
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    retryButton: {
      alignSelf: 'stretch',
      marginTop: spacing.sm,
    },
    footerText: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      color: theme.colors.textMuted,
      fontSize: fontSize.xs,
      lineHeight: 18,
      textAlign: 'center',
    },
  });

export default TurnstileChallengeModal;
