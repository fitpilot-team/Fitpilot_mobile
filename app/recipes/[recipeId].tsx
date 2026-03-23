import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, LoadingSpinner } from '../../src/components/common';
import { borderRadius, brandColors, colors, dietTheme, fontSize, spacing } from '../../src/constants/colors';
import { getDietRecipeDetail } from '../../src/services/diet';
import type { ApiError, ClientDietIngredientRow, ClientDietRecipeDetail } from '../../src/types';

type RecipeTab = 'description' | 'ingredients';

const tabOptions: Array<{ key: RecipeTab; label: string }> = [
  { key: 'description', label: 'Descripcion' },
  { key: 'ingredients', label: 'Ingredientes' },
];

const formatMeasureValue = (value: number | null, suffix: string) => {
  if (value === null) {
    return null;
  }

  return `${Number.isInteger(value) ? value : Number(value.toFixed(2))} ${suffix}`;
};

const buildIngredientMeta = (ingredient: ClientDietIngredientRow) => (
  [
    ingredient.portion.householdLabel,
    formatMeasureValue(ingredient.portion.equivalents, 'eq'),
    formatMeasureValue(ingredient.portion.grams, 'g'),
  ].filter(Boolean) as string[]
);

const IngredientCard = ({
  ingredient,
  index,
}: {
  ingredient: ClientDietIngredientRow;
  index: number;
}) => {
  const meta = useMemo(() => buildIngredientMeta(ingredient), [ingredient]);

  return (
    <View style={styles.ingredientCard}>
      <View style={styles.ingredientHeader}>
        <View style={styles.ingredientIndex}>
          <Text style={styles.ingredientIndexText}>{index + 1}</Text>
        </View>
        <Text style={styles.ingredientLabel}>{ingredient.label}</Text>
      </View>

      {meta.length ? (
        <View style={styles.ingredientMetaRow}>
          {meta.map((item) => (
            <View key={`${ingredient.id}-${item}`} style={styles.ingredientMetaPill}>
              <Text style={styles.ingredientMetaText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.ingredientEmptyMeta}>Sin porcion detallada.</Text>
      )}
    </View>
  );
};

export default function RecipeDetailScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId?: string | string[] }>();
  const parsedRecipeId = useMemo(() => {
    const rawRecipeId = Array.isArray(recipeId) ? recipeId[0] : recipeId;
    const nextValue = Number.parseInt(rawRecipeId ?? '', 10);
    return Number.isFinite(nextValue) ? nextValue : null;
  }, [recipeId]);
  const [activeTab, setActiveTab] = useState<RecipeTab>('description');
  const [detail, setDetail] = useState<ClientDietRecipeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(
    async (options?: { refresh?: boolean }) => {
      if (!parsedRecipeId) {
        setError('No encontramos esta receta.');
        setIsLoading(false);
        return;
      }

      const isRefresh = options?.refresh ?? false;
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await getDietRecipeDetail(parsedRecipeId);
        setDetail(response);
        setError(null);
      } catch (loadError) {
        const apiError = loadError as ApiError;
        setError(apiError.message || 'No fue posible cargar esta receta.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [parsedRecipeId],
  );

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (isLoading && !detail) {
    return <LoadingSpinner fullScreen text="Cargando receta..." />;
  }

  const description = detail?.description || 'Esta receta no tiene descripcion disponible.';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.gray[900]} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>Receta</Text>
          <Text style={styles.title}>{detail?.title || 'Detalle de receta'}</Text>
          <Text style={styles.subtitle}>
            {detail
              ? `${detail.ingredientCount} ingrediente${detail.ingredientCount === 1 ? '' : 's'}`
              : 'Consulta descripcion e ingredientes'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadDetail({ refresh: true })}
            tintColor={dietTheme.label}
          />
        }
      >
        {detail?.imageUrl ? (
          <Image source={{ uri: detail.imageUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={[dietTheme.activeDayBackground, '#D8F0DF', '#F5FBF7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroPlaceholder}
          >
            <Ionicons name="restaurant-outline" size={34} color={dietTheme.label} />
            <Text style={styles.heroPlaceholderText}>Sin imagen disponible</Text>
          </LinearGradient>
        )}

        <View style={styles.tabsRow}>
          {tabOptions.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                activeOpacity={0.85}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorTitle}>No fue posible cargar la receta</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Reintentar" onPress={() => void loadDetail()} />
          </Card>
        ) : null}

        {!error && activeTab === 'description' ? (
          <Card style={styles.contentCard}>
            <Text style={styles.sectionTitle}>Descripcion</Text>
            <Text style={styles.descriptionText}>{description}</Text>
          </Card>
        ) : null}

        {!error && activeTab === 'ingredients' ? (
          <View style={styles.ingredientsSection}>
            {detail?.ingredients.length ? (
              detail.ingredients.map((ingredient, index) => (
                <IngredientCard key={ingredient.id} ingredient={ingredient} index={index} />
              ))
            ) : (
              <Card style={styles.contentCard}>
                <Text style={styles.emptyTitle}>Sin ingredientes visibles</Text>
                <Text style={styles.emptyText}>
                  Esta receta no trae ingredientes detallados para mostrar aqui.
                </Text>
              </Card>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    color: dietTheme.label,
    fontSize: fontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    marginTop: spacing.xs,
    color: colors.gray[900],
    fontSize: fontSize['2xl'],
    fontWeight: '800',
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.gray[500],
    fontSize: fontSize.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heroImage: {
    width: '100%',
    height: 240,
    borderRadius: borderRadius.xl,
  },
  heroPlaceholder: {
    width: '100%',
    height: 240,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  heroPlaceholderText: {
    color: dietTheme.label,
    fontSize: fontSize.base,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: dietTheme.activeDayBorder,
    backgroundColor: colors.white,
    paddingVertical: spacing.sm + 2,
  },
  tabButtonActive: {
    borderColor: dietTheme.label,
    backgroundColor: dietTheme.activeDayBackground,
  },
  tabLabel: {
    color: colors.gray[600],
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: dietTheme.label,
  },
  errorCard: {
    marginTop: spacing.xs,
  },
  errorTitle: {
    color: colors.gray[900],
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  errorText: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    color: colors.gray[500],
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  contentCard: {
    borderWidth: 1,
    borderColor: dietTheme.activeDayBorder,
  },
  sectionTitle: {
    color: colors.gray[900],
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  descriptionText: {
    marginTop: spacing.md,
    color: colors.gray[700],
    fontSize: fontSize.base,
    lineHeight: 24,
  },
  ingredientsSection: {
    gap: spacing.md,
  },
  ingredientCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: dietTheme.activeDayBorder,
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  ingredientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ingredientIndex: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dietTheme.activeDayBackground,
  },
  ingredientIndexText: {
    color: dietTheme.label,
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
  ingredientLabel: {
    flex: 1,
    color: colors.gray[900],
    fontSize: fontSize.base,
    fontWeight: '700',
  },
  ingredientMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  ingredientMetaPill: {
    borderRadius: borderRadius.full,
    backgroundColor: `${brandColors.sky}18`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  ingredientMetaText: {
    color: colors.gray[700],
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  ingredientEmptyMeta: {
    marginTop: spacing.sm,
    color: colors.gray[500],
    fontSize: fontSize.sm,
  },
  emptyTitle: {
    color: colors.gray[900],
    fontSize: fontSize.base,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.gray[500],
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
