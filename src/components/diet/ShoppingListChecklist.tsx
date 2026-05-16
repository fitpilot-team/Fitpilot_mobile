import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SegmentedControl } from '../common';
import { borderRadius, fontSize, nutritionTheme, spacing } from '../../constants/colors';
import type { ClientShoppingListItem, ClientShoppingListItemPayload } from '../../types';
import { useAppTheme, useThemedStyles } from '../../theme';
import { ShoppingListItemRow } from './ShoppingListItemRow';

export type ShoppingListFilter = 'pending' | 'checked';

interface ShoppingListChecklistProps {
  items: ClientShoppingListItem[];
  filter: ShoppingListFilter;
  pendingItemIds: Set<number>;
  onFilterChange: (filter: ShoppingListFilter) => void;
  onToggleItem: (item: ClientShoppingListItem) => void;
  onDeleteItem: (item: ClientShoppingListItem) => void;
  onSaveItem: (item: ClientShoppingListItem, payload: ClientShoppingListItemPayload) => void;
}

const filterOptions = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'checked', label: 'Comprados' },
] satisfies Array<{ key: ShoppingListFilter; label: string }>;

export const ShoppingListChecklist: React.FC<ShoppingListChecklistProps> = ({
  items,
  filter,
  pendingItemIds,
  onFilterChange,
  onToggleItem,
  onDeleteItem,
  onSaveItem,
}) => {
  const styles = useThemedStyles(createStyles);

  const filteredItems = useMemo(
    () => items.filter((item) => (filter === 'checked' ? item.checked : !item.checked)),
    [filter, items],
  );

  const groupedItems = useMemo(() => {
    const groups = new Map<string, ClientShoppingListItem[]>();
    for (const item of filteredItems) {
      const category = item.category?.trim() || 'General';
      groups.set(category, [...(groups.get(category) ?? []), item]);
    }
    return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));
  }, [filteredItems]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Checklist</Text>
          <Text style={styles.title}>Productos</Text>
        </View>
        <Text style={styles.totalText}>{filteredItems.length}</Text>
      </View>

      <SegmentedControl
        options={filterOptions}
        value={filter}
        onChange={onFilterChange}
      />

      {groupedItems.length > 0 ? (
        <View style={styles.groups}>
          {groupedItems.map(([category, categoryItems]) => (
            <View key={category} style={styles.group}>
              <Text style={styles.categoryTitle}>{category}</Text>
              <View style={styles.groupCard}>
                {categoryItems.map((item, index) => (
                  <View
                    key={item.id}
                    style={index > 0 ? styles.itemDivider : null}
                  >
                    <ShoppingListItemRow
                      item={item}
                      isBusy={pendingItemIds.has(item.id)}
                      onToggle={onToggleItem}
                      onDelete={onDeleteItem}
                      onSave={onSaveItem}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name={filter === 'checked' ? 'checkmark-done-outline' : 'basket-outline'}
              size={28}
              color={nutritionTheme.accentStrong}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {filter === 'checked' ? 'Nada comprado todavia' : 'Sin pendientes'}
          </Text>
          <Text style={styles.emptyText}>
            {filter === 'checked'
              ? 'Cuando marques productos, apareceran aqui.'
              : 'Todo lo visible esta comprado o la lista aun no tiene productos.'}
          </Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    container: {
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
      fontSize: fontSize.xl,
      fontWeight: '800',
    },
    totalText: {
      color: theme.colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: '800',
    },
    groups: {
      gap: spacing.md,
    },
    group: {
      gap: spacing.xs,
    },
    categoryTitle: {
      color: theme.colors.textMuted,
      fontSize: fontSize.xs,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    groupCard: {
      overflow: 'hidden',
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    itemDivider: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    emptyCard: {
      alignItems: 'center',
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      padding: spacing.xl,
    },
    emptyIcon: {
      width: 58,
      height: 58,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: nutritionTheme.accentSoft,
    },
    emptyTitle: {
      marginTop: spacing.md,
      color: theme.colors.textPrimary,
      fontSize: fontSize.base,
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

