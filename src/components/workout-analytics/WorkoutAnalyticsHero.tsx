import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, fontSize, shadows, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';

export type WorkoutAnalyticsHeroMetric = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
};

interface WorkoutAnalyticsHeroProps {
  eyebrow?: string | null;
  title: string;
  subtitle: string;
  rangeLabel: string;
  actionLabel: string;
  actionHint: string;
  actionIcon: keyof typeof Ionicons.glyphMap;
  metrics: WorkoutAnalyticsHeroMetric[];
  onActionPress: () => void;
}

export const WorkoutAnalyticsHero: React.FC<WorkoutAnalyticsHeroProps> = ({
  eyebrow,
  title,
  subtitle,
  rangeLabel,
  actionLabel,
  actionHint,
  actionIcon,
  metrics,
  onActionPress,
}) => {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  const primaryMetrics = metrics.slice(0, 2);
  const secondaryMetrics = metrics.slice(2);
  const showEyebrow = Boolean(eyebrow);

  const gradientColors = theme.isDark
    ? ([theme.colors.surfaceAlt, theme.colors.surface] as const)
    : ([theme.colors.primarySoft, '#f4f8ff'] as const);
  const shellBorder = theme.isDark ? theme.colors.border : theme.colors.primaryBorder;
  const surfaceColor = theme.colors.surface;
  const surfaceBorder = theme.isDark ? theme.colors.border : theme.colors.primaryBorder;
  const accentSurface = theme.colors.primarySoft;
  const accentColor = theme.colors.primary;
  const textPrimary = theme.colors.textPrimary;
  const textSecondary = theme.colors.textSecondary;

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { borderColor: shellBorder }]}
    >
      <View style={styles.copy}>
        {showEyebrow ? <Text style={[styles.eyebrow, { color: accentColor }]}>{eyebrow}</Text> : null}
        <Text numberOfLines={2} style={[styles.title, { color: textPrimary }]}>
          {title}
        </Text>
        <Text numberOfLines={2} style={[styles.subtitle, { color: textSecondary }]}>
          {subtitle}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPills}>
          <View style={[styles.rangePill, { backgroundColor: surfaceColor, borderColor: surfaceBorder }]}>
            <Ionicons name="pulse-outline" size={14} color={accentColor} />
            <Text style={[styles.rangeText, { color: textPrimary }]}>{rangeLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.primaryMetricsGrid}>
        {primaryMetrics.map((metric) => (
          <View
            key={metric.label}
            style={[styles.primaryMetricCard, { backgroundColor: surfaceColor, borderColor: surfaceBorder }]}
          >
            <View style={[styles.primaryMetricIcon, { backgroundColor: accentSurface }]}>
              <Ionicons name={metric.icon} size={16} color={accentColor} />
            </View>
            <Text numberOfLines={1} style={[styles.primaryMetricValue, { color: textPrimary }]}>
              {metric.value}
            </Text>
            <Text style={[styles.primaryMetricLabel, { color: textSecondary }]}>{metric.label}</Text>
          </View>
        ))}
      </View>

      {secondaryMetrics.length > 0 ? (
        <View style={styles.secondaryMetricsRow}>
          {secondaryMetrics.map((metric) => (
            <View
              key={metric.label}
              style={[styles.secondaryMetricPill, { backgroundColor: surfaceColor, borderColor: surfaceBorder }]}
            >
              <Ionicons name={metric.icon} size={14} color={accentColor} />
              <Text style={[styles.secondaryMetricValue, { color: textPrimary }]}>{metric.value}</Text>
              <Text style={[styles.secondaryMetricLabel, { color: textSecondary }]}>{metric.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: surfaceColor, borderColor: surfaceBorder }]}
        activeOpacity={0.88}
        onPress={onActionPress}
      >
        <View style={styles.actionCopy}>
          <Text style={[styles.actionLabel, { color: textPrimary }]}>{actionLabel}</Text>
          <Text numberOfLines={1} style={[styles.actionHint, { color: textSecondary }]}>
            {actionHint}
          </Text>
        </View>

        <View style={[styles.actionIconWrap, { backgroundColor: accentSurface }]}>
          <Ionicons name={actionIcon} size={16} color={accentColor} />
        </View>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const createStyles = (_theme: AppTheme) =>
  StyleSheet.create({
    container: {
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      padding: spacing.md,
      gap: spacing.sm,
      ...shadows.lg,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    copy: {
      gap: spacing.xs,
    },
    eyebrow: {
      fontSize: fontSize.xs,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    title: {
      fontSize: fontSize['2xl'],
      fontWeight: '800',
    },
    subtitle: {
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
    metaPills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    rangePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    rangeText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
    },
    primaryMetricsGrid: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    primaryMetricCard: {
      width: '48%',
      minHeight: 74,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      padding: spacing.sm,
      gap: spacing.xs,
    },
    primaryMetricIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryMetricValue: {
      fontSize: fontSize.lg,
      fontWeight: '800',
    },
    primaryMetricLabel: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    secondaryMetricsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    secondaryMetricPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
    },
    secondaryMetricValue: {
      fontSize: fontSize.sm,
      fontWeight: '700',
    },
    secondaryMetricLabel: {
      fontSize: fontSize.xs,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
    },
    actionCopy: {
      flex: 1,
      gap: 2,
    },
    actionLabel: {
      fontSize: fontSize.sm,
      fontWeight: '800',
    },
    actionHint: {
      fontSize: fontSize.xs,
    },
    actionIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default WorkoutAnalyticsHero;
