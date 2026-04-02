import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, fontSize, shadows, spacing } from '../../src/constants/colors';
import {
  categoryColors,
  categoryLabels,
  getScienceTipById,
} from '../../src/constants/scienceTips';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../src/theme';

export default function RecommendationDetailScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const params = useLocalSearchParams<{ tipId?: string | string[] }>();
  const tipId = Array.isArray(params.tipId) ? params.tipId[0] : params.tipId;
  const tip = useMemo(() => (tipId ? getScienceTipById(tipId) : null), [tipId]);
  const categoryColor = tip ? categoryColors[tip.category] : theme.colors.primary;
  const iconName = (tip?.icon ?? 'bulb-outline') as React.ComponentProps<typeof Ionicons>['name'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Recomendacion</Text>
          <Text style={styles.subtitle}>
            {tip ? 'Detalle completo del consejo seleccionado.' : 'No encontramos esta recomendacion.'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tip ? (
          <View style={styles.heroCard}>
            <LinearGradient
              colors={[`${categoryColor}18`, `${categoryColor}05`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.heroHeader}>
              <View style={[styles.heroIconContainer, { backgroundColor: `${categoryColor}20` }]}>
                <Ionicons name={iconName} size={28} color={categoryColor} />
              </View>
              <View style={[styles.categoryBadge, { borderColor: `${categoryColor}35` }]}>
                <Text style={[styles.categoryText, { color: categoryColor }]}>
                  {categoryLabels[tip.category] || tip.category}
                </Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>{tip.title}</Text>
            <Text style={styles.heroBody}>{tip.content}</Text>

            {tip.source ? (
              <View style={styles.sourceCard}>
                <Ionicons name="document-text-outline" size={16} color={theme.colors.iconMuted} />
                <View style={styles.sourceCopy}>
                  <Text style={styles.sourceLabel}>Fuente</Text>
                  <Text style={styles.sourceValue}>{tip.source}</Text>
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="bulb-outline" size={28} color={theme.colors.iconMuted} />
            </View>
            <Text style={styles.emptyTitle}>Recomendacion no disponible</Text>
            <Text style={styles.emptyText}>
              Esta recomendacion no existe o ya no esta disponible en la app.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.88}
              onPress={() => router.back()}
            >
              <Text style={styles.primaryButtonText}>Volver</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    headerCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    backButton: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xxl,
    },
    heroCard: {
      position: 'relative',
      overflow: 'hidden',
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      padding: spacing.lg,
      gap: spacing.md,
      ...shadows.md,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    heroIconContainer: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      backgroundColor: theme.colors.surface,
    },
    categoryText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
    },
    heroTitle: {
      fontSize: fontSize['2xl'],
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    heroBody: {
      fontSize: fontSize.base,
      lineHeight: 26,
      color: theme.colors.textSecondary,
    },
    sourceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    sourceCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    sourceLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    sourceValue: {
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textPrimary,
    },
    emptyCard: {
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.xl,
      gap: spacing.md,
      ...shadows.md,
    },
    emptyIconContainer: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
    },
    emptyTitle: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    emptyText: {
      fontSize: fontSize.sm,
      lineHeight: 22,
      textAlign: 'center',
      color: theme.colors.textSecondary,
    },
    primaryButton: {
      minWidth: 132,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: theme.colors.surface,
    },
  });
