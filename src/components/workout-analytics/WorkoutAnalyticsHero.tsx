import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, brandColors, fontSize, shadows, spacing } from '../../constants/colors';
import { useThemedStyles, type AppTheme } from '../../theme';

export type WorkoutAnalyticsHeroMetric = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
};

interface WorkoutAnalyticsHeroProps {
  title: string;
  subtitle: string;
  rangeLabel: string;
  anchorLabel?: string | null;
  actionLabel: string;
  actionHint: string;
  actionIcon: keyof typeof Ionicons.glyphMap;
  metrics: WorkoutAnalyticsHeroMetric[];
  onActionPress: () => void;
}

export const WorkoutAnalyticsHero: React.FC<WorkoutAnalyticsHeroProps> = ({
  title,
  subtitle,
  rangeLabel,
  anchorLabel,
  actionLabel,
  actionHint,
  actionIcon,
  metrics,
  onActionPress,
}) => {
  const styles = useThemedStyles(createStyles);
  const primaryMetrics = metrics.slice(0, 2);
  const secondaryMetrics = metrics.slice(2);

  return (
    <LinearGradient
      colors={['#10203b', brandColors.navy, brandColors.sky]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>Entrenamientos</Text>
        <Text numberOfLines={2} style={styles.title}>{title}</Text>
        <Text numberOfLines={2} style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaPills}>
          <View style={styles.rangePill}>
            <Ionicons name="pulse-outline" size={14} color="#ffffff" />
            <Text style={styles.rangeText}>{rangeLabel}</Text>
          </View>
          {anchorLabel ? (
            <View style={styles.rangePill}>
              <Ionicons name="calendar-outline" size={14} color="#ffffff" />
              <Text style={styles.rangeText}>{anchorLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.primaryMetricsGrid}>
        {primaryMetrics.map((metric) => (
          <View key={metric.label} style={styles.primaryMetricCard}>
            <View style={styles.primaryMetricIcon}>
              <Ionicons name={metric.icon} size={16} color="#ffffff" />
            </View>
            <Text numberOfLines={1} style={styles.primaryMetricValue}>{metric.value}</Text>
            <Text style={styles.primaryMetricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>

      {secondaryMetrics.length > 0 ? (
        <View style={styles.secondaryMetricsRow}>
          {secondaryMetrics.map((metric) => (
            <View key={metric.label} style={styles.secondaryMetricPill}>
              <Ionicons name={metric.icon} size={14} color="rgba(255,255,255,0.86)" />
              <Text style={styles.secondaryMetricValue}>{metric.value}</Text>
              <Text style={styles.secondaryMetricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <TouchableOpacity style={styles.actionButton} activeOpacity={0.88} onPress={onActionPress}>
        <View style={styles.actionCopy}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
          <Text numberOfLines={1} style={styles.actionHint}>{actionHint}</Text>
        </View>

        <View style={styles.actionIconWrap}>
          <Ionicons name={actionIcon} size={16} color="#ffffff" />
        </View>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const createStyles = (_theme: AppTheme) =>
  StyleSheet.create({
    container: {
      borderRadius: borderRadius.xl,
      padding: spacing.lg,
      gap: spacing.md,
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
      color: 'rgba(255,255,255,0.74)',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    title: {
      fontSize: fontSize['3xl'],
      fontWeight: '800',
      color: '#ffffff',
    },
    subtitle: {
      fontSize: fontSize.sm,
      lineHeight: 21,
      color: 'rgba(255,255,255,0.74)',
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
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    rangeText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: '#ffffff',
    },
    primaryMetricsGrid: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    primaryMetricCard: {
      width: '48%',
      minHeight: 86,
      borderRadius: borderRadius.lg,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      padding: spacing.md,
      gap: spacing.xs,
    },
    primaryMetricIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryMetricValue: {
      fontSize: fontSize.xl,
      fontWeight: '800',
      color: '#ffffff',
    },
    primaryMetricLabel: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.68)',
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
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 7,
    },
    secondaryMetricValue: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: '#ffffff',
    },
    secondaryMetricLabel: {
      fontSize: fontSize.xs,
      color: 'rgba(255,255,255,0.7)',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    actionCopy: {
      flex: 1,
      gap: 2,
    },
    actionLabel: {
      fontSize: fontSize.sm,
      fontWeight: '800',
      color: '#ffffff',
    },
    actionHint: {
      fontSize: fontSize.xs,
      color: 'rgba(255,255,255,0.72)',
    },
    actionIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: 'rgba(255,255,255,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default WorkoutAnalyticsHero;
