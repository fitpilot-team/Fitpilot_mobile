import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useConnectivityStore } from '../../store/connectivityStore';
import { useAppTheme, useThemedStyles } from '../../theme';

export const OFFLINE_BANNER_HEIGHT = 64;

export const OfflineBanner: React.FC = () => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const isInitialized = useConnectivityStore((state) => state.isInitialized);
  const isOffline = useConnectivityStore((state) => state.isOffline);

  if (!isInitialized || !isOffline) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { top: insets.top + spacing.sm }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.banner}>
        <View style={styles.iconWrap}>
          <Ionicons name="cloud-offline-outline" size={20} color={theme.colors.warning} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Sin conexión</Text>
          <Text style={styles.subtitle}>
            Puedes revisar datos guardados; algunas acciones podrían fallar.
          </Text>
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
