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
  actionLabel,
  actionHint,
  actionIcon,
  metrics,
  onActionPress,
}) => {
  const styles = useThemedStyles(createStyles);

  return (
    <LinearGradient
      colors={['#10203b', brandColors.navy, brandColors.sky]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.heroTopRow}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Entrenamientos</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.rangePill}>
          <Ionicons name="pulse-outline" size={14} color="#ffffff" />
          <Text style={styles.rangeText}>{rangeLabel}</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        {metrics.map((metric) => (
          <View key={metric.label} style={styles.metricCard}>
            <View style={styles.metricIcon}>
              <Ionicons name={metric.icon} size={16} color="#ffffff" />
            </View>
            <Text style={styles.metricValue}>{metric.value}</Text>
            <Text style={styles.metricLabel}>{metric.label}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.actionButton} activeOpacity={0.88} onPress={onActionPress}>
        <View style={styles.actionCopy}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
          <Text style={styles.actionHint}>{actionHint}</Text>
        </View>

        <View style={styles.actionIconWrap}>
          <Ionicons name={actionIcon} size={18} color={brandColors.navy} />
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
      gap: spacing.lg,
      ...shadows.lg,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    copy: {
      flex: 1,
      gap: spacing.xs,
    },
    eyebrow: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: 'rgba(255,255,255,0.74)',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    title: {
      fontSize: fontSize['2xl'],
      fontWeight: '800',
      color: '#ffffff',
    },
    subtitle: {
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: 'rgba(255,255,255,0.78)',
    },
    rangePill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      borderRadius: borderRadius.full,
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    rangeText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: '#ffffff',
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    metricCard: {
      width: '48%',
      minHeight: 92,
      borderRadius: borderRadius.lg,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      padding: spacing.md,
      gap: spacing.sm,
    },
    metricIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricValue: {
      fontSize: fontSize.lg,
      fontWeight: '800',
      color: '#ffffff',
    },
    metricLabel: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.72)',
      textTransform: 'uppercase',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      borderRadius: borderRadius.xl,
      backgroundColor: '#ffffff',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    actionCopy: {
      flex: 1,
      gap: 2,
    },
    actionLabel: {
      fontSize: fontSize.base,
      fontWeight: '800',
      color: brandColors.navy,
    },
    actionHint: {
      fontSize: fontSize.sm,
      color: '#4b5563',
    },
    actionIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#e8f0f8',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default WorkoutAnalyticsHero;
