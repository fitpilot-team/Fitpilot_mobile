import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, fontSize, nutritionTheme, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { ClientDietMenu } from '../../types';
import { formatLocalDate, getTodayDateKey } from '../../utils/date';
import { DietHero } from './DietHero';
import { DietMealCard } from './DietMealCard';

interface ShoppingListMenuPreviewModalProps {
  visible: boolean;
  menu: ClientDietMenu | null;
  menuLabel: string;
  assignedDate: string | null;
  onClose: () => void;
}

export const ShoppingListMenuPreviewModal: React.FC<ShoppingListMenuPreviewModalProps> = ({
  visible,
  menu,
  menuLabel,
  assignedDate,
  onClose,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { height } = useWindowDimensions();
  const availableHeight = Math.max(320, height - spacing.md);
  const sheetHeight = Math.min(availableHeight, Math.max(360, height * 0.86));

  if (!menu || !assignedDate) {
    return null;
  }

  const dateLabel = formatLocalDate(assignedDate, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const isToday = assignedDate === getTodayDateKey();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Cerrar vista del menu"
        />

        <View style={[styles.container, { height: sheetHeight }]}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Vista rapida</Text>
              <Text style={styles.title}>Menu del dia</Text>
              <Text numberOfLines={1} style={styles.subtitle}>{dateLabel}</Text>
              <Text numberOfLines={2} style={styles.menuTitle}>{menu.title}</Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.82}
              accessibilityRole="button"
              accessibilityLabel="Cerrar vista del menu"
            >
              <Ionicons name="close-outline" size={24} color={theme.colors.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <DietHero
              menu={menu}
              menuLabel={menuLabel}
              assignedDate={assignedDate}
              isToday={isToday}
            />

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Comidas del dia</Text>
                <Text style={styles.sectionSubtitle}>
                  {menu.meals.length > 0
                    ? `${menu.totalMeals} ${menu.totalMeals === 1 ? 'bloque' : 'bloques'} organizados para este menu`
                    : 'Este menu todavia no tiene bloques visibles.'}
                </Text>
              </View>
            </View>

            {menu.meals.length > 0 ? (
              <View style={styles.mealList}>
                {menu.meals.map((meal) => (
                  <DietMealCard
                    key={`${assignedDate}-${menu.menuId}-${meal.id}`}
                    meal={meal}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="restaurant-outline" size={28} color={nutritionTheme.accentStrong} />
                </View>
                <Text style={styles.emptyTitle}>Sin comidas cargadas</Text>
                <Text style={styles.emptyText}>
                  El menu fue encontrado, pero este dia todavia no contiene comidas visibles.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: theme.colors.overlay,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerCopy: {
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
      marginTop: spacing.xs,
      color: theme.colors.textPrimary,
      fontSize: fontSize.xl,
      fontWeight: '800',
    },
    subtitle: {
      marginTop: spacing.xs,
      color: theme.colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    menuTitle: {
      marginTop: spacing.xs,
      color: theme.colors.textPrimary,
      fontSize: fontSize.sm,
      fontWeight: '800',
      lineHeight: 20,
    },
    closeButton: {
      width: 38,
      height: 38,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    sectionTitle: {
      color: theme.colors.textPrimary,
      fontSize: fontSize.lg,
      fontWeight: '800',
    },
    sectionSubtitle: {
      marginTop: spacing.xs,
      color: theme.colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
    mealList: {
      gap: spacing.md,
    },
    emptyCard: {
      alignItems: 'center',
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    emptyIcon: {
      width: 60,
      height: 60,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: nutritionTheme.accentSoft,
    },
    emptyTitle: {
      marginTop: spacing.md,
      color: theme.colors.textPrimary,
      fontSize: fontSize.lg,
      fontWeight: '800',
      textAlign: 'center',
    },
    emptyText: {
      marginTop: spacing.xs,
      color: theme.colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 20,
      textAlign: 'center',
    },
  });

export default ShoppingListMenuPreviewModal;
