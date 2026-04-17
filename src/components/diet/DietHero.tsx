import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, nutritionTheme, colors, fontSize, spacing, shadows } from '../../constants/colors';
import type { ClientDietMenu } from '../../types';
import { formatLocalDate } from '../../utils/date';
import { useAppTheme } from '../../theme';

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
  const { theme } = useAppTheme();
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

  // Lighter green gradient for Light Mode, original nutrition green for Dark Mode
  const gradientColors = theme.isDark
    ? ([nutritionTheme.heroGradientStart, nutritionTheme.heroGradientMiddle, nutritionTheme.heroGradientEnd] as const)
    : (['#10B98122', '#10B9810A'] as const);
  const textPrimary = theme.isDark ? colors.white : '#15803D'; // Darker green for readability in light mode
  const textSecondary = theme.isDark ? 'rgba(255,255,255,0.8)' : '#15803DCC';
  const surfaceColor = theme.isDark ? 'rgba(255,255,255,0.12)' : '#10B98118';
  const surfaceBorder = theme.isDark ? 'rgba(255,255,255,0.12)' : '#10B98122';
  const badgeBg = theme.isDark ? 'rgba(255,255,255,0.14)' : '#10B98122';

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { borderWidth: theme.isDark ? 0 : 1, borderColor: '#10B98133' }]}
    >
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Ionicons name={badgeIcon} size={11} color={textPrimary} />
          <Text style={[styles.badgeText, { color: textPrimary }]}>{badgeLabel}</Text>
        </View>
      </View>

      <Text numberOfLines={1} style={[styles.title, { color: textPrimary }]}>{menuLabel}</Text>
      <Text numberOfLines={2} style={[styles.subtitle, { color: textSecondary }]}>{subtitle}</Text>

      <View style={[styles.statsRail, { backgroundColor: surfaceColor, borderColor: surfaceBorder }]}>
        {stats.map((stat, index) => (
          <React.Fragment key={stat.label}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: textPrimary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: textSecondary }]}>{stat.label}</Text>
            </View>
            {index < stats.length - 1 ? <View style={[styles.statDivider, { backgroundColor: surfaceBorder }]} /> : null}
          </React.Fragment>
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 18,
    ...shadows.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    marginTop: spacing.xs + 2,
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  statsRail: {
    flexDirection: 'row',
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  statValue: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 1,
    color: 'rgba(255,255,255,0.68)',
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default DietHero;
