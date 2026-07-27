import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  borderRadius,
  colors,
  fontSize,
  nutritionTheme,
  shadows,
  spacing,
} from '../../constants/colors';
import type { ClientDietMenu } from '../../types';
import { formatLocalDate } from '../../utils/date';
import { useAppTheme } from '../../theme';

interface DietHeroProps {
  menu: ClientDietMenu | null;
  menuLabel: string;
  assignedDate: string;
  isToday: boolean;
  isPreview?: boolean;
  supportingText?: string | null;
  canChangeMenu: boolean;
  isLoadingMenuOptions?: boolean;
  onChangeMenu: () => void;
  onOpenWeeklyPlan: () => void;
}

export const DietHero: React.FC<DietHeroProps> = ({
  menu,
  menuLabel,
  assignedDate,
  isToday,
  isPreview = false,
  supportingText,
  canChangeMenu,
  isLoadingMenuOptions = false,
  onChangeMenu,
  onOpenWeeklyPlan,
}) => {
  const { theme } = useAppTheme();
  const fallbackDateLabel = formatLocalDate(assignedDate, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const subtitle = supportingText || menu?.description || fallbackDateLabel;
  const badgeLabel = isPreview ? 'Vista previa' : isToday ? 'Hoy' : 'Plan del día';
  const badgeIcon = isPreview ? 'eye-outline' : isToday ? 'sparkles' : 'calendar-outline';
  const totalCalories = menu?.totalCalories;
  const stats: {
    label: string;
    value: string | number;
    icon: React.ComponentProps<typeof Ionicons>['name'];
  }[] = [
    { label: 'Comidas', value: menu?.totalMeals ?? 0, icon: 'restaurant-outline' },
    {
      label: 'Kcal',
      value: typeof totalCalories === 'number' ? Math.round(totalCalories) : 'ND',
      icon: 'flame-outline',
    },
    { label: 'Recetas', value: menu?.totalRecipes ?? 0, icon: 'book-outline' },
  ];

  const gradientColors = theme.isDark
    ? (['rgba(20, 83, 45, 0.32)', 'rgba(21, 128, 61, 0.15)'] as const)
    : (['#F7FEFB', '#ECFDF5'] as const);
  const accentColor = theme.isDark ? nutritionTheme.accentLight : nutritionTheme.accentStrong;
  const textPrimary = theme.isDark ? colors.white : theme.colors.textPrimary;
  const textSecondary = theme.isDark ? 'rgba(255,255,255,0.72)' : theme.colors.textMuted;
  const borderColor = theme.isDark ? 'rgba(110, 231, 183, 0.18)' : '#BBF7D0';
  const chipBackground = theme.isDark ? 'rgba(255,255,255,0.07)' : colors.white;
  const chipBorder = theme.isDark ? 'rgba(110, 231, 183, 0.14)' : '#D1FAE5';
  const badgeBackground = theme.isDark ? 'rgba(110, 231, 183, 0.12)' : '#D1FAE5';

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { borderColor }]}
    >
      <View style={styles.headerRow}>
        <View style={[styles.iconBubble, { borderColor: chipBorder, backgroundColor: badgeBackground }]}>
          <Ionicons name="nutrition-outline" size={18} color={accentColor} />
        </View>

        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={[styles.title, { color: textPrimary }]}>
              {menuLabel}
            </Text>
            <View style={[styles.badge, { backgroundColor: badgeBackground, borderColor: chipBorder }]}>
              <Ionicons name={badgeIcon} size={11} color={accentColor} />
              <Text style={[styles.badgeText, { color: accentColor }]}>{badgeLabel}</Text>
            </View>
          </View>
          <Text numberOfLines={1} style={[styles.subtitle, { color: textSecondary }]}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View
            key={stat.label}
            style={[styles.statChip, { backgroundColor: chipBackground, borderColor: chipBorder }]}
          >
            <Ionicons name={stat.icon} size={14} color={accentColor} />
            <View style={styles.statCopy}>
              <Text style={[styles.statValue, { color: textPrimary }]}>{stat.value}</Text>
              <Text numberOfLines={1} style={[styles.statLabel, { color: textSecondary }]}>
                {stat.label}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actionRow}>
        <Pressable
          onPress={onChangeMenu}
          disabled={!canChangeMenu}
          accessibilityRole="button"
          accessibilityLabel="Cambiar menú visible"
          accessibilityState={{ disabled: !canChangeMenu, busy: isLoadingMenuOptions }}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: chipBackground, borderColor: chipBorder },
            !canChangeMenu ? styles.actionButtonDisabled : null,
            pressed && canChangeMenu ? styles.actionButtonPressed : null,
          ]}
        >
          {isLoadingMenuOptions ? (
            <ActivityIndicator size="small" color={accentColor} />
          ) : (
            <Ionicons
              name={canChangeMenu ? 'swap-horizontal-outline' : 'remove-outline'}
              size={18}
              color={canChangeMenu ? accentColor : theme.colors.iconMuted}
            />
          )}
          <Text
            numberOfLines={1}
            style={[
              styles.actionText,
              { color: canChangeMenu ? textPrimary : theme.colors.textMuted },
            ]}
          >
            Cambiar menú
          </Text>
        </Pressable>

        <Pressable
          onPress={onOpenWeeklyPlan}
          accessibilityRole="button"
          accessibilityLabel="Abrir plan semanal y lista del súper"
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: chipBackground, borderColor: chipBorder },
            pressed ? styles.actionButtonPressed : null,
          ]}
        >
          <Ionicons name="list-outline" size={18} color={accentColor} />
          <Text numberOfLines={1} style={[styles.actionText, { color: textPrimary }]}>
            Plan y súper
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: fontSize.base,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  statChip: {
    flex: 1,
    minWidth: 0,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 6,
  },
  statCopy: {
    flex: 1,
    minWidth: 0,
  },
  statValue: {
    fontSize: fontSize.sm,
    fontWeight: '900',
    lineHeight: 16,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    lineHeight: 11,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
  },
  actionButtonDisabled: {
    opacity: 0.58,
  },
  actionButtonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  actionText: {
    flexShrink: 1,
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
});

export default DietHero;
