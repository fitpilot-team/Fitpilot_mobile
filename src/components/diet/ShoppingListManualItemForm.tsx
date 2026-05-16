import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, fontSize, nutritionTheme, spacing } from '../../constants/colors';
import type { ClientShoppingListItemPayload } from '../../types';
import { useAppTheme, useThemedStyles } from '../../theme';

interface ShoppingListManualItemFormProps {
  disabled?: boolean;
  isSaving: boolean;
  onSubmit: (payload: ClientShoppingListItemPayload) => void;
}

export const ShoppingListManualItemForm: React.FC<ShoppingListManualItemFormProps> = ({
  disabled = false,
  isSaving,
  onSubmit,
}) => {
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
  const [name, setName] = useState('');
  const [quantityLabel, setQuantityLabel] = useState('');
  const [category, setCategory] = useState('');
  const canSubmit = name.trim().length > 0 && !disabled && !isSaving;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }

    onSubmit({
      name: name.trim(),
      quantityLabel: quantityLabel.trim() || null,
      category: category.trim() || null,
    });
    setName('');
    setQuantityLabel('');
    setCategory('');
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>Manual</Text>
          <Text style={styles.title}>Agregar producto</Text>
        </View>
        <Ionicons name="add-circle-outline" size={22} color={nutritionTheme.accentStrong} />
      </View>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Producto"
        placeholderTextColor={theme.colors.textMuted}
        style={styles.input}
        editable={!disabled && !isSaving}
      />
      <View style={styles.inputRow}>
        <TextInput
          value={quantityLabel}
          onChangeText={setQuantityLabel}
          placeholder="Cantidad"
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, styles.halfInput]}
          editable={!disabled && !isSaving}
        />
        <TextInput
          value={category}
          onChangeText={setCategory}
          placeholder="Categoria"
          placeholderTextColor={theme.colors.textMuted}
          style={[styles.input, styles.halfInput]}
          editable={!disabled && !isSaving}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, !canSubmit ? styles.disabledButton : null]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        activeOpacity={0.84}
      >
        {isSaving ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Ionicons name="add-outline" size={18} color="#FFFFFF" />
        )}
        <Text style={styles.submitText}>Agregar</Text>
      </TouchableOpacity>
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
      gap: spacing.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.xs,
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
    input: {
      minHeight: 46,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      backgroundColor: theme.colors.inputBackground,
      paddingHorizontal: spacing.sm,
      color: theme.colors.textPrimary,
      fontSize: fontSize.sm,
      fontWeight: '700',
    },
    inputRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    halfInput: {
      flex: 1,
    },
    submitButton: {
      minHeight: 46,
      borderRadius: borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: nutritionTheme.accentStrong,
    },
    disabledButton: {
      opacity: 0.55,
    },
    submitText: {
      color: '#FFFFFF',
      fontSize: fontSize.sm,
      fontWeight: '800',
    },
  });

