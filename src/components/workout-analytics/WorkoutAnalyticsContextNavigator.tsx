import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import { formatLocalDate } from '../../utils/date';

interface WorkoutAnalyticsContextNavigatorProps {
  scopeLabel: string;
  title: string;
  subtitle: string;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent: boolean;
  isLoading?: boolean;
  errorMessage?: string | null;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onResetToCurrent: () => void;
  onOpenPicker: () => void;
}

const formatDateRange = (startDate?: string | null, endDate?: string | null) => {
  if (!startDate && !endDate) {
    return 'Sin rango disponible';
  }

  if (startDate && endDate) {
    return `${formatLocalDate(startDate, { day: 'numeric', month: 'short' })} - ${formatLocalDate(endDate, {
      day: 'numeric',
      month: 'short',
    })}`;
  }

  return formatLocalDate(startDate ?? endDate ?? '', { day: 'numeric', month: 'short' });
};

export const WorkoutAnalyticsContextNavigator: React.FC<WorkoutAnalyticsContextNavigatorProps> = ({
  scopeLabel,
  title,
  subtitle,
  startDate,
  endDate,
  isCurrent,
  isLoading = false,
  errorMessage,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onResetToCurrent,
  onOpenPicker,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{scopeLabel}</Text>
          <Text style={styles.helperText}>
            {isLoading ? 'Cargando historico...' : 'Navega entre contextos historicos del cliente.'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.currentButton, isCurrent ? styles.currentButtonActive : null]}
          activeOpacity={0.86}
          onPress={onResetToCurrent}
          disabled={isCurrent}
        >
          <Text style={[styles.currentButtonText, isCurrent ? styles.currentButtonTextActive : null]}>
            Actual
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navigationRow}>
        <TouchableOpacity
          style={[styles.arrowButton, !canGoPrevious ? styles.arrowButtonDisabled : null]}
          activeOpacity={0.86}
          onPress={onPrevious}
          disabled={!canGoPrevious}
        >
          <Ionicons name="chevron-back" size={18} color={canGoPrevious ? theme.colors.primary : theme.colors.iconMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.selectionCard} activeOpacity={0.86} onPress={onOpenPicker}>
          <View style={styles.selectionCopy}>
            <Text style={styles.selectionTitle} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.selectionSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
            <Text style={styles.selectionDate}>{formatDateRange(startDate, endDate)}</Text>
            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </View>

          <Ionicons name="chevron-down" size={18} color={theme.colors.iconMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.arrowButton, !canGoNext ? styles.arrowButtonDisabled : null]}
          activeOpacity={0.86}
          onPress={onNext}
          disabled={!canGoNext}
        >
          <Ionicons name="chevron-forward" size={18} color={canGoNext ? theme.colors.primary : theme.colors.iconMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      gap: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    headerCopy: {
      flex: 1,
      gap: 2,
    },
    eyebrow: {
      fontSize: fontSize.xs,
      fontWeight: '800',
      color: theme.colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    helperText: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
    currentButton: {
      alignSelf: 'flex-start',
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    currentButtonActive: {
      borderColor: `${theme.colors.primary}25`,
      backgroundColor: `${theme.colors.primary}12`,
    },
    currentButtonText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    currentButtonTextActive: {
      color: theme.colors.primary,
    },
    navigationRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: spacing.sm,
    },
    arrowButton: {
      width: 44,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    arrowButtonDisabled: {
      opacity: 0.45,
    },
    selectionCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    selectionCopy: {
      flex: 1,
      gap: 2,
    },
    selectionTitle: {
      fontSize: fontSize.base,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    selectionSubtitle: {
      fontSize: fontSize.sm,
      color: theme.colors.textSecondary,
    },
    selectionDate: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    errorText: {
      fontSize: fontSize.xs,
      color: theme.colors.warning,
      lineHeight: 16,
    },
  });

export default WorkoutAnalyticsContextNavigator;
