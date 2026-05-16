import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, fontSize, nutritionTheme, spacing } from '../../constants/colors';
import type { ClientDietMenu, ClientDietWeekDay } from '../../types';
import { formatLocalDate } from '../../utils/date';
import { getDietSelectableMenus, resolveVisibleDietMenu } from '../../utils/dietMenuSelection';
import { useAppTheme, useThemedStyles } from '../../theme';

interface ShoppingListDayMenuSelectorProps {
  days: ClientDietWeekDay[];
  selectedMenuByDate: Record<string, number>;
  disabled?: boolean;
  onSelectMenu: (date: string, menuId: number) => void;
  onPreviewMenu?: (date: string, menu: ClientDietMenu, index: number) => void;
}

const formatDayLabel = (date: string) =>
  formatLocalDate(date, { weekday: 'short', day: 'numeric', month: 'short' });

export const ShoppingListDayMenuSelector: React.FC<ShoppingListDayMenuSelectorProps> = ({
  days,
  selectedMenuByDate,
  disabled = false,
  onSelectMenu,
  onPreviewMenu,
}) => {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Menus para comprar</Text>
          <Text style={styles.title}>
            Elige {days.length} dia{days.length === 1 ? '' : 's'}
          </Text>
          <Text style={styles.helperText}>
            Manten presionado un menu para ver sus comidas.
          </Text>
        </View>
        <Ionicons name="calendar-outline" size={22} color={nutritionTheme.accentStrong} />
      </View>

      <View style={styles.days}>
        {days.map((day) => {
          const menus = getDietSelectableMenus(day);
          const fallbackMenuId = resolveVisibleDietMenu(day)?.menuId ?? 0;
          const selectedMenuId = selectedMenuByDate[day.assignedDate] ?? fallbackMenuId;

          return (
            <View key={day.assignedDate} style={styles.dayBlock}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayLabel}>{formatDayLabel(day.assignedDate)}</Text>
                {menus.length === 0 ? (
                  <Text style={styles.emptyText}>Sin menus</Text>
                ) : null}
              </View>

              {menus.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.menuRail}
                >
                  {menus.map((menu, index) => {
                    const isSelected = menu.menuId === selectedMenuId;

                    return (
                      <TouchableOpacity
                        key={`${day.assignedDate}-${menu.menuId}`}
                        style={[styles.menuChip, isSelected ? styles.menuChipActive : null]}
                        onPress={() => onSelectMenu(day.assignedDate, menu.menuId)}
                        onLongPress={
                          disabled || !onPreviewMenu
                            ? undefined
                            : () => onPreviewMenu(day.assignedDate, menu, index)
                        }
                        disabled={disabled}
                        activeOpacity={0.84}
                        delayLongPress={420}
                        accessibilityRole="button"
                        accessibilityLabel={`Seleccionar Menu ${index + 1}, ${menu.title}`}
                        accessibilityHint="Manten presionado para ver el menu completo."
                      >
                        <Text style={[styles.menuChipLabel, isSelected ? styles.menuChipLabelActive : null]}>
                          Menu {index + 1}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[styles.menuChipTitle, isSelected ? styles.menuChipTitleActive : null]}
                        >
                          {menu.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.emptyMenuBox}>
                  <Ionicons name="restaurant-outline" size={18} color={theme.colors.iconMuted} />
                  <Text style={styles.emptyMenuText}>No hay opciones visibles para este dia.</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    card: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      padding: spacing.md,
      gap: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
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
      fontSize: fontSize.base,
      fontWeight: '800',
    },
    helperText: {
      marginTop: spacing.xs,
      color: theme.colors.textMuted,
      fontSize: fontSize.xs,
      lineHeight: 17,
      fontWeight: '700',
    },
    days: {
      gap: spacing.md,
    },
    dayBlock: {
      gap: spacing.xs,
    },
    dayHeader: {
      minHeight: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    dayLabel: {
      color: theme.colors.textSecondary,
      fontSize: fontSize.sm,
      fontWeight: '800',
      textTransform: 'capitalize',
    },
    emptyText: {
      color: theme.colors.textMuted,
      fontSize: fontSize.xs,
      fontWeight: '700',
    },
    menuRail: {
      gap: spacing.xs,
      paddingRight: spacing.sm,
    },
    menuChip: {
      width: 142,
      minHeight: 58,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      justifyContent: 'center',
    },
    menuChipActive: {
      borderColor: nutritionTheme.accentStrong,
      backgroundColor: nutritionTheme.accentSurface,
    },
    menuChipLabel: {
      color: theme.colors.textMuted,
      fontSize: fontSize.xs,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    menuChipLabelActive: {
      color: nutritionTheme.accentStrong,
    },
    menuChipTitle: {
      marginTop: 3,
      color: theme.colors.textPrimary,
      fontSize: fontSize.xs,
      fontWeight: '700',
    },
    menuChipTitleActive: {
      color: theme.colors.textPrimary,
    },
    emptyMenuBox: {
      minHeight: 50,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    emptyMenuText: {
      flex: 1,
      color: theme.colors.textMuted,
      fontSize: fontSize.xs,
      lineHeight: 17,
    },
  });
