import React, { useCallback, useEffect } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useConnectivityStore } from '../../store/connectivityStore';
import { useAppTheme, useThemedStyles } from '../../theme';

// Fallback height used only until the banner reports its measured height.
export const OFFLINE_BANNER_HEIGHT = 64;

export const OfflineBanner: React.FC = () => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const isInitialized = useConnectivityStore((state) => state.isInitialized);
  const isOffline = useConnectivityStore((state) => state.isOffline);
  const isBackendUnreachable = useConnectivityStore(
    (state) => state.isBackendUnreachable,
  );
  const setBannerHeight = useConnectivityStore((state) => state.setBannerHeight);

  const showOffline = isInitialized && isOffline;
  const isVisible = showOffline || isBackendUnreachable;

  useEffect(() => {
    if (!isVisible) {
      setBannerHeight(0);
    }
    return () => {
      setBannerHeight(0);
    };
  }, [isVisible, setBannerHeight]);

  const handleBannerLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      if (Math.abs(height - useConnectivityStore.getState().bannerHeight) > 1) {
        setBannerHeight(height);
      }
    },
    [setBannerHeight],
  );

  if (!isVisible) {
    return null;
  }

  const title = showOffline ? 'Sin conexión' : 'Sin conexión con el servidor';
  const subtitle = showOffline
    ? 'Puedes revisar datos guardados; algunas acciones podrían fallar.'
    : 'Mostrando datos guardados; algunas acciones podrían fallar.';

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { top: insets.top + spacing.sm }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.banner} onLayout={handleBannerLayout}>
        <View style={styles.iconWrap}>
          <Ionicons name="cloud-offline-outline" size={20} color={theme.colors.warning} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 9998,
      alignItems: 'center',
      paddingHorizontal: spacing.md,
    },
    banner: {
      width: '100%',
      maxWidth: 520,
      minHeight: OFFLINE_BANNER_HEIGHT,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.warning,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.isDark ? '#2a2210' : '#fffbeb',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: theme.isDark ? 0.32 : 0.12,
      shadowRadius: 14,
      elevation: 8,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.isDark ? 'rgba(251, 191, 36, 0.14)' : '#fef3c7',
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: fontSize.sm,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      marginTop: 2,
      fontSize: fontSize.xs,
      lineHeight: 16,
      color: theme.colors.textSecondary,
    },
  });
