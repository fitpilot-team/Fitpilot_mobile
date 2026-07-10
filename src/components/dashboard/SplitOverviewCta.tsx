import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';

interface SplitOverviewCtaProps {
  onPress: () => void;
  horizontalPadding: number;
}

export const SplitOverviewCta: React.FC<SplitOverviewCtaProps> = ({ onPress, horizontalPadding }) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.section, { paddingHorizontal: horizontalPadding }]}>
      <TouchableOpacity
        style={styles.cta}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Ver el split completo del microciclo"
      >
        <View style={styles.icon}>
          <Ionicons name="grid-outline" size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Ver split completo</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            Revisa todos los días y ejercicios de tu microciclo en una sola vista.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.iconMuted} />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    section: {
      marginTop: spacing.md,
    },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    icon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    title: {
      fontSize: fontSize.base,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      lineHeight: 16,
    },
  });
