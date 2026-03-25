import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../common';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { ClientDietIngredientRow, ClientFoodSwapCandidate } from '../../types';

interface RecipeIngredientSwapModalProps {
  visible: boolean;
  ingredient: ClientDietIngredientRow | null;
  foods: ClientFoodSwapCandidate[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onRetry: () => void;
  onSelectFood: (food: ClientFoodSwapCandidate) => Promise<void>;
  onReset: () => Promise<void>;
}

const normalizeSearchValue = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const formatBaseServing = (food: ClientFoodSwapCandidate) => {
  if (food.baseServingSize === null) {
    return 'Porcion base no disponible';
  }

  const value = Number.isInteger(food.baseServingSize)
    ? `${food.baseServingSize}`
    : `${Number(food.baseServingSize.toFixed(1))}`;

  return `${value} ${food.baseUnit || 'g'}`;
};

export const RecipeIngredientSwapModal: React.FC<RecipeIngredientSwapModalProps> = ({
  visible,
  ingredient,
  foods,
  isLoading,
  isSaving,
  error,
  onClose,
  onRetry,
  onSelectFood,
  onReset,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) {
      setQuery('');
      return;
    }

    setQuery('');
  }, [ingredient?.id, visible]);

  const filteredFoods = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query);
    if (!normalizedQuery) {
      return foods;
    }

    return foods.filter((food) => {
      const haystack = normalizeSearchValue(`${food.name} ${food.brand ?? ''}`);
      return haystack.includes(normalizedQuery);
    });
  }, [foods, query]);

  const handleClose = () => {
    if (isSaving) {
      return;
    }

    onClose();
  };

  const supportingText = ingredient?.exchangeGroupName
    ? `Elige un equivalente dentro de ${ingredient.exchangeGroupName}.`
    : 'Elige un alimento equivalente para este ingrediente.';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Cambiar ingrediente</Text>
              <Text style={styles.subtitle}>{ingredient?.label || 'Ingrediente'}</Text>
              <Text style={styles.supportingText}>{supportingText}</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={20} color={theme.colors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchCard}>
            <View style={styles.searchInputRow}>
              <Ionicons name="search-outline" size={18} color={theme.colors.iconMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Busca por nombre o marca"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.searchInput}
                editable={!isLoading && !isSaving}
              />
            </View>

            {ingredient?.isClientSwap && ingredient.originalLabel ? (
              <View style={styles.swapNotice}>
                <Ionicons name="swap-horizontal-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.swapNoticeText}>
                  Cambio activo desde {ingredient.originalLabel}.
                </Text>
              </View>
            ) : null}

            {isSaving ? (
              <View style={styles.loadingChip}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingChipText}>Guardando cambio...</Text>
              </View>
            ) : null}
          </View>

          {isLoading ? (
            <View style={styles.stateBlock}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.stateTitle}>Cargando equivalentes...</Text>
              <Text style={styles.stateText}>
                Estamos buscando alimentos del mismo grupo para este ingrediente.
              </Text>
            </View>
          ) : error && foods.length === 0 ? (
            <View style={styles.stateBlock}>
              <Ionicons name="alert-circle-outline" size={28} color={theme.colors.error} />
              <Text style={styles.stateTitle}>No pudimos cargar equivalentes</Text>
              <Text style={styles.stateText}>{error}</Text>
              <Button title="Reintentar" variant="secondary" onPress={onRetry} />
            </View>
          ) : filteredFoods.length === 0 ? (
            <View style={styles.stateBlock}>
              <Ionicons name="restaurant-outline" size={28} color={theme.colors.iconMuted} />
              <Text style={styles.stateTitle}>Sin resultados</Text>
              <Text style={styles.stateText}>
                Prueba con otro texto para encontrar un alimento equivalente.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {error ? (
                <View style={styles.inlineError}>
                  <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
                  <Text style={styles.inlineErrorText}>{error}</Text>
                </View>
              ) : null}

              {filteredFoods.map((food) => {
                const isCurrent = food.id === ingredient?.foodId;

                return (
                  <TouchableOpacity
                    key={food.id}
                    style={[styles.foodCard, isCurrent ? styles.foodCardCurrent : null]}
                    activeOpacity={0.85}
                    onPress={() => void onSelectFood(food)}
                    disabled={isSaving || isCurrent}
                  >
                    <View style={styles.foodCardHeader}>
                      <View style={styles.foodCardCopy}>
                        <Text style={styles.foodName}>{food.name}</Text>
                        <Text style={styles.foodBrand}>{food.brand || 'Sin marca'}</Text>
                      </View>
                      {isCurrent ? (
                        <View style={styles.currentBadge}>
                          <Text style={styles.currentBadgeText}>Actual</Text>
                        </View>
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color={theme.colors.iconMuted} />
                      )}
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaChip}>
                        <Text style={styles.metaChipText}>{formatBaseServing(food)}</Text>
                      </View>
                      <View style={styles.metaChip}>
                        <Text style={styles.metaChipText}>
                          {food.caloriesKcal !== null
                            ? `${Math.round(food.caloriesKcal)} kcal`
                            : 'kcal ND'}
                        </Text>
                      </View>
                      <View style={styles.metaChip}>
                        <Text style={styles.metaChipText}>
                          {food.servingUnitsCount} unidad{food.servingUnitsCount === 1 ? '' : 'es'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {ingredient?.isClientSwap ? (
            <View style={styles.footer}>
              <Button
                title="Restaurar original"
                variant="secondary"
                onPress={() => void onReset()}
                isLoading={isSaving}
                disabled={isLoading}
              />
            </View>
          ) : null}
        </Pressable>
      </Pressable>
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
    card: {
      maxHeight: '88%',
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    headerCopy: {
      flex: 1,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: fontSize.xl,
      fontWeight: '800',
    },
    subtitle: {
      marginTop: spacing.xs,
      color: theme.colors.textPrimary,
      fontSize: fontSize.base,
      fontWeight: '700',
    },
    supportingText: {
      marginTop: spacing.xs,
      color: theme.colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
    },
    searchCard: {
      marginTop: spacing.lg,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      padding: spacing.md,
      gap: spacing.sm,
    },
    searchInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      backgroundColor: theme.colors.inputBackground,
      paddingHorizontal: spacing.md,
    },
    searchInput: {
      flex: 1,
      color: theme.colors.textPrimary,
      fontSize: fontSize.base,
      paddingVertical: spacing.md,
    },
    swapNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    swapNoticeText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
    loadingChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      alignSelf: 'flex-start',
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    loadingChipText: {
      color: theme.colors.primary,
      fontSize: fontSize.sm,
      fontWeight: '700',
    },
    stateBlock: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.md,
    },
    stateTitle: {
      color: theme.colors.textPrimary,
      fontSize: fontSize.base,
      fontWeight: '800',
      textAlign: 'center',
    },
    stateText: {
      color: theme.colors.textSecondary,
      fontSize: fontSize.sm,
      lineHeight: 20,
      textAlign: 'center',
    },
    list: {
      marginTop: spacing.lg,
    },
    listContent: {
      gap: spacing.sm,
    },
    inlineError: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: `${theme.colors.error}33`,
      backgroundColor: `${theme.colors.error}14`,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    inlineErrorText: {
      flex: 1,
      color: theme.colors.error,
      fontSize: fontSize.sm,
      fontWeight: '600',
    },
    foodCard: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      padding: spacing.md,
      gap: spacing.sm,
    },
    foodCardCurrent: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    foodCardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    foodCardCopy: {
      flex: 1,
    },
    foodName: {
      color: theme.colors.textPrimary,
      fontSize: fontSize.base,
      fontWeight: '700',
    },
    foodBrand: {
      marginTop: spacing.xs,
      color: theme.colors.textMuted,
      fontSize: fontSize.sm,
    },
    currentBadge: {
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    currentBadgeText: {
      color: theme.colors.primary,
      fontSize: fontSize.xs,
      fontWeight: '800',
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    metaChip: {
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    metaChipText: {
      color: theme.colors.textSecondary,
      fontSize: fontSize.xs,
      fontWeight: '700',
    },
    footer: {
      marginTop: spacing.lg,
    },
  });

export default RecipeIngredientSwapModal;
