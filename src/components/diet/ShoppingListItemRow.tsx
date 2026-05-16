import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, fontSize, nutritionTheme, spacing } from '../../constants/colors';
import type { ClientShoppingListItem, ClientShoppingListItemPayload } from '../../types';
import { useAppTheme, useThemedStyles } from '../../theme';

interface ShoppingListItemRowProps {
  item: ClientShoppingListItem;
  isBusy: boolean;
  onToggle: (item: ClientShoppingListItem) => void;
  onDelete: (item: ClientShoppingListItem) => void;
  onSave: (item: ClientShoppingListItem, payload: ClientShoppingListItemPayload) => void;
}

export const ShoppingListItemRow: React.FC<ShoppingListItemRowProps> = ({
  item,
  isBusy,
  onToggle,
  onDelete,
  onSave,
}) => {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState(item.name);
  const [draftQuantity, setDraftQuantity] = useState(item.quantityLabel ?? '');
  const [draftCategory, setDraftCategory] = useState(item.category ?? '');

  useEffect(() => {
    if (isEditing) {
      return;
    }

    setDraftName(item.name);
    setDraftQuantity(item.quantityLabel ?? '');
    setDraftCategory(item.category ?? '');
  }, [isEditing, item.category, item.name, item.quantityLabel]);

  const saveDisabled = isBusy || !draftName.trim();

  if (isEditing) {
    return (
      <View style={styles.editShell}>
        <TextInput
          value={draftName}
          onChangeText={setDraftName}
          placeholder="Producto"
          placeholderTextColor={theme.colors.textMuted}
          style={styles.input}
          editable={!isBusy}
        />
        <View style={styles.editRow}>
          <TextInput
            value={draftQuantity}
            onChangeText={setDraftQuantity}
            placeholder="Cantidad"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.input, styles.halfInput]}
            editable={!isBusy}
          />
          <TextInput
            value={draftCategory}
            onChangeText={setDraftCategory}
            placeholder="Categoria"
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.input, styles.halfInput]}
            editable={!isBusy}
          />
        </View>
        <View style={styles.editActions}>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => setIsEditing(false)}
            disabled={isBusy}
            activeOpacity={0.84}
          >
            <Text style={styles.secondaryActionText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryAction, saveDisabled ? styles.disabledAction : null]}
            onPress={() => {
              onSave(item, {
                name: draftName.trim(),
                quantityLabel: draftQuantity.trim() || null,
                category: draftCategory.trim() || null,
              });
              setIsEditing(false);
            }}
            disabled={saveDisabled}
            activeOpacity={0.84}
          >
            <Text style={styles.primaryActionText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.checkbox, item.checked ? styles.checkboxChecked : null]}
        onPress={() => onToggle(item)}
        disabled={isBusy}
        activeOpacity={0.82}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: item.checked, disabled: isBusy }}
      >
        {isBusy ? (
          <ActivityIndicator size="small" color={item.checked ? '#FFFFFF' : nutritionTheme.accentStrong} />
        ) : (
          <Ionicons
            name="checkmark"
            size={17}
            color={item.checked ? '#FFFFFF' : 'transparent'}
          />
        )}
      </TouchableOpacity>

      <View style={styles.copy}>
        <Text
          numberOfLines={2}
          style={[styles.name, item.checked ? styles.nameChecked : null]}
        >
          {item.name}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {item.quantityLabel || 'Sin cantidad'}{item.sourceType === 'manual' ? ' · Manual' : ''}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => setIsEditing(true)}
        disabled={isBusy}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={`Editar ${item.name}`}
      >
        <Ionicons name="create-outline" size={19} color={theme.colors.icon} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => onDelete(item)}
        disabled={isBusy}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={`Eliminar ${item.name}`}
      >
        <Ionicons name="trash-outline" size={19} color={theme.colors.error} />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    row: {
      minHeight: 70,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: theme.colors.card,
    },
    checkbox: {
      width: 30,
      height: 30,
      borderRadius: borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: theme.colors.borderStrong,
      backgroundColor: theme.colors.surface,
    },
    checkboxChecked: {
      borderColor: nutritionTheme.accentStrong,
      backgroundColor: nutritionTheme.accentStrong,
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      color: theme.colors.textPrimary,
      fontSize: fontSize.sm,
      fontWeight: '800',
      lineHeight: 19,
    },
    nameChecked: {
      color: theme.colors.textMuted,
      textDecorationLine: 'line-through',
    },
    meta: {
      marginTop: 3,
      color: theme.colors.textMuted,
      fontSize: fontSize.xs,
      fontWeight: '600',
    },
    iconButton: {
      width: 34,
      height: 34,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
    },
    editShell: {
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: theme.colors.card,
    },
    input: {
      minHeight: 44,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      backgroundColor: theme.colors.inputBackground,
      paddingHorizontal: spacing.sm,
      color: theme.colors.textPrimary,
      fontSize: fontSize.sm,
      fontWeight: '700',
    },
    editRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    halfInput: {
      flex: 1,
    },
    editActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    secondaryAction: {
      flex: 1,
      minHeight: 42,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    secondaryActionText: {
      color: theme.colors.textSecondary,
      fontSize: fontSize.sm,
      fontWeight: '800',
    },
    primaryAction: {
      flex: 1,
      minHeight: 42,
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: nutritionTheme.accentStrong,
    },
    primaryActionText: {
      color: '#FFFFFF',
      fontSize: fontSize.sm,
      fontWeight: '800',
    },
    disabledAction: {
      opacity: 0.55,
    },
  });

