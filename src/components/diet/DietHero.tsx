import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, nutritionTheme, colors, fontSize, spacing, shadows } from '../../constants/colors';
import type { ClientDietMenu } from '../../types';
import { formatLocalDate } from '../../utils/date';

interface DietHeroProps {
  menu: ClientDietMenu;
  menuLabel: string;
  assignedDate: string;
  isToday: boolean;
  isPreview?: boolean;
}

export const DietHero: React.FC<DietHeroProps> = ({
  menu,
  menuLabel,
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
  const badgeLabel = isPreview ? 'Previsualizando' : isToday ? 'Hoy' : 'Plan del dia';
  const badgeIcon = isPreview ? 'eye-outline' : isToday ? 'sparkles' : 'calendar-outline';
  const stats = [
    { label: 'Comidas', value: menu.totalMeals },
    { label: 'Kcal', value: menu.totalCalories !== null ? Math.round(menu.totalCalories) : 'ND' },
    { label: 'Recetas', value: menu.totalRecipes },
  ];

  return (
    <LinearGradient
      colors={[nutritionTheme.heroGradientStart, nutritionTheme.heroGradientMiddle, nutritionTheme.heroGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Ionicons name={badgeIcon} size={12} color={colors.white} />
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      </View>

      <Text numberOfLines={1} style={styles.title}>{menuLabel}</Text>
      <Text numberOfLines={2} style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.statsRail}>
        {stats.map((stat, index) => (
          <React.Fragment key={stat.label}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
            {index < stats.length - 1 ? <View style={styles.statDivider} /> : null}
          </React.Fragment>
        ))}
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
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    marginTop: spacing.sm,
    color: colors.white,
    fontSize: fontSize['2xl'],
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  statsRail: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  statValue: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.68)',
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default DietHero;
