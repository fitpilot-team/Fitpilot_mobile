import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, brandColors, colors, fontSize, spacing, shadows } from '../../constants/colors';
import type { ClientDietMenu } from '../../types';
import { formatLocalDate } from '../../utils/date';

interface DietHeroProps {
  menu: ClientDietMenu;
  assignedDate: string;
  isToday: boolean;
  isPreview?: boolean;
}

export const DietHero: React.FC<DietHeroProps> = ({
  menu,
  assignedDate,
  isToday,
  isPreview = false,
}) => {
  const dateLabel = formatLocalDate(assignedDate, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const subtitle = menu.description || `Plan activo para ${dateLabel}`;
  const badgeLabel = isPreview ? 'Vista previa' : isToday ? 'Hoy' : 'Plan del dia';
  const badgeIcon = isPreview ? 'eye-outline' : isToday ? 'sparkles' : 'calendar-outline';

  return (
    <LinearGradient
      colors={[brandColors.navy, '#27466D', brandColors.sky]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Ionicons name={badgeIcon} size={14} color={colors.white} />
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      </View>

      <Text style={styles.title}>{menu.title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{menu.totalMeals}</Text>
          <Text style={styles.statLabel}>Comidas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{menu.totalItems}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{menu.totalRecipes}</Text>
          <Text style={styles.statLabel}>Recetas</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  badgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    marginTop: spacing.sm,
    color: colors.white,
    fontSize: fontSize['2xl'],
    fontWeight: '800',
  },
  subtitle: {
    marginTop: spacing.sm,
    color: 'rgba(255,255,255,0.84)',
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  statValue: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: spacing.xs,
    color: 'rgba(255,255,255,0.72)',
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default DietHero;
