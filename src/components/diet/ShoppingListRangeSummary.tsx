import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, fontSize, nutritionTheme, spacing } from '../../constants/colors';
import { formatLocalDate } from '../../utils/date';
import { useAppTheme, useThemedStyles } from '../../theme';

interface ShoppingListRangeSummaryProps {
  startDate: string;
  endDate: string;
  completedCount: number;
  totalCount: number;
  needsRegeneration: boolean;
  isGenerating: boolean;
  canGenerate: boolean;
  hasList: boolean;
  onGenerate: () => void;
}

const formatRangeDate = (value: string) =>
  formatLocalDate(value, { day: 'numeric', month: 'short' });

export const ShoppingListRangeSummary: React.FC<ShoppingListRangeSummaryProps> = ({
  startDate,
  endDate,
  completedCount,
  totalCount,
  needsRegeneration,
  isGenerating,
  canGenerate,
  hasList,
  onGenerate,
}) => {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconBubble}>
          <Ionicons name="cart-outline" size={22} color={nutritionTheme.accentStrong} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Periodo de compra</Text>
          <Text style={styles.title}>
            {formatRangeDate(startDate)} - {formatRangeDate(endDate)}
          </Text>
        </View>
        <View style={styles.counterPill}>
          <Text style={styles.counterText}>
            {totalCount > 0 ? `${completedCount}/${totalCount}` : '0'}
          </Text>
        </View>
      </View>

      {needsRegeneration ? (
        <View style={styles.warningBox}>
          <Ionicons name="warning-outline" size={17} color={theme.colors.warning} />
          <Text style={styles.warningText}>
            La seleccion de menus cambio. Regenera cuando quieras actualizar la lista.
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.generateButton, isGenerating ? styles.disabledButton : null]}
        onPress={onGenerate}
        disabled={isGenerating}
        activeOpacity={0.86}
        accessibilityState={{ disabled: isGenerating }}
      >
        {isGenerating ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : !canGenerate ? (
          <Ionicons name="alert-circle-outline" size={18} color="#FFFFFF" />
        ) : (
          <Ionicons name={hasList ? 'refresh-outline' : 'sparkles-outline'} size={18} color="#FFFFFF" />
        )}
        <Text style={styles.generateText}>
          {!canGenerate ? 'Revisar seleccion' : hasList ? 'Regenerar lista' : 'Generar lista'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    card: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
      backgroundColor: theme.colors.primarySoft,
      padding: spacing.md,
      gap: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconBubble: {
      width: 46,
      height: 46,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    eyebrow: {
      color: nutritionTheme.accentStrong,
      fontSize: fontSize.xs,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    title: {
      marginTop: 2,
      color: theme.colors.textPrimary,
      fontSize: fontSize.lg,
      fontWeight: '800',
    },
    counterPill: {
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    counterText: {
      color: nutritionTheme.accentStrong,
      fontSize: fontSize.sm,
      fontWeight: '800',
    },
    warningBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.24)',
      backgroundColor: 'rgba(245, 158, 11, 0.10)',
      padding: spacing.sm,
    },
    warningText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: fontSize.xs,
      lineHeight: 17,
      fontWeight: '600',
    },
    generateButton: {
      minHeight: 48,
      borderRadius: borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: nutritionTheme.accentStrong,
    },
    disabledButton: {
      opacity: 0.55,
    },
    generateText: {
      color: '#FFFFFF',
      fontSize: fontSize.sm,
      fontWeight: '800',
    },
  });
