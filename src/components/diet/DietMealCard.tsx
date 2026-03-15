import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '../common';
import {
  borderRadius,
  brandColors,
  colors,
  fontSize,
  spacing,
} from '../../constants/colors';
import type {
  ClientDietFoodRow,
  ClientDietIngredientRow,
  ClientDietMeal,
  ClientDietRecipeCard,
} from '../../types';

interface DietMealCardProps {
  meal: ClientDietMeal;
}

type FoodGroupVisual = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  backgroundColor: string;
  borderColor: string;
};

const formatCalories = (value: number | null) => {
  if (value === null || value <= 0) {
    return null;
  }

  return `${Math.round(value)} kcal`;
};

const formatMeasureValue = (value: number | null, suffix: string) => {
  if (value === null) {
    return '—';
  }

  return `${Number.isInteger(value) ? value : Number(value.toFixed(2))} ${suffix}`;
};

const normalizeGroupName = (value: string | null | undefined) =>
  (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getFoodGroupVisual = (groupName: string | null): FoodGroupVisual => {
  const normalizedGroup = normalizeGroupName(groupName);

  if (normalizedGroup.includes('verdura') || normalizedGroup.includes('vegetal')) {
    return {
      icon: 'leaf-outline',
      iconColor: '#15803D',
      backgroundColor: '#DCFCE7',
      borderColor: '#BBF7D0',
    };
  }

  if (normalizedGroup.includes('fruta')) {
    return {
      icon: 'flower-outline',
      iconColor: '#EA580C',
      backgroundColor: '#FFEDD5',
      borderColor: '#FED7AA',
    };
  }

  if (
    normalizedGroup.includes('cereal') ||
    normalizedGroup.includes('tuberculo') ||
    normalizedGroup.includes('pan') ||
    normalizedGroup.includes('arroz')
  ) {
    return {
      icon: 'cafe-outline',
      iconColor: '#92400E',
      backgroundColor: '#FEF3C7',
      borderColor: '#FDE68A',
    };
  }

  if (normalizedGroup.includes('leguminosa') || normalizedGroup.includes('frijol')) {
    return {
      icon: 'ellipse-outline',
      iconColor: '#7C3AED',
      backgroundColor: '#EDE9FE',
      borderColor: '#DDD6FE',
    };
  }

  if (
    normalizedGroup.includes('animal') ||
    normalizedGroup.includes('prote') ||
    normalizedGroup.includes('carne') ||
    normalizedGroup.includes('pollo') ||
    normalizedGroup.includes('pescado')
  ) {
    return {
      icon: 'fish-outline',
      iconColor: '#1D4ED8',
      backgroundColor: '#DBEAFE',
      borderColor: '#BFDBFE',
    };
  }

  if (normalizedGroup.includes('leche') || normalizedGroup.includes('lacteo')) {
    return {
      icon: 'water-outline',
      iconColor: '#0891B2',
      backgroundColor: '#CFFAFE',
      borderColor: '#A5F3FC',
    };
  }

  if (normalizedGroup.includes('grasa') || normalizedGroup.includes('aceite')) {
    return {
      icon: 'water',
      iconColor: '#D97706',
      backgroundColor: '#FEF3C7',
      borderColor: '#FCD34D',
    };
  }

  if (normalizedGroup.includes('azucar') || normalizedGroup.includes('dulce')) {
    return {
      icon: 'ice-cream-outline',
      iconColor: '#DB2777',
      backgroundColor: '#FCE7F3',
      borderColor: '#FBCFE8',
    };
  }

  return {
    icon: 'restaurant-outline',
    iconColor: brandColors.navy,
    backgroundColor: '#E8F0F8',
    borderColor: '#D8E7F4',
  };
};

const PortionChips: React.FC<{ ingredient: ClientDietIngredientRow | ClientDietFoodRow }> = ({ ingredient }) => (
  <View style={styles.portionGrid}>
    <View style={styles.portionChip}>
      <Text style={styles.portionChipLabel}>Unidad casera</Text>
      <Text style={styles.portionChipValue}>{ingredient.portion.householdLabel || '—'}</Text>
    </View>
    <View style={styles.portionChip}>
      <Text style={styles.portionChipLabel}>Equivalentes</Text>
      <Text style={styles.portionChipValue}>
        {formatMeasureValue(ingredient.portion.equivalents, 'eq')}
      </Text>
    </View>
    <View style={styles.portionChip}>
      <Text style={styles.portionChipLabel}>Gramos</Text>
      <Text style={styles.portionChipValue}>
        {formatMeasureValue(ingredient.portion.grams, 'g')}
      </Text>
    </View>
  </View>
);

const IngredientRow: React.FC<{
  ingredient: ClientDietIngredientRow | ClientDietFoodRow;
  accent?: 'recipe' | 'food';
}> = ({ ingredient, accent = 'food' }) => {
  const foodGroupVisual = getFoodGroupVisual(ingredient.exchangeGroupName);

  return (
    <View
      style={[
        styles.foodRow,
        { borderColor: accent === 'recipe' ? '#D8E7F4' : foodGroupVisual.borderColor },
      ]}
    >
      <View style={[styles.foodIcon, { backgroundColor: foodGroupVisual.backgroundColor }]}>
        <Ionicons name={foodGroupVisual.icon} size={18} color={foodGroupVisual.iconColor} />
      </View>

      <View style={styles.foodBody}>
        <View style={styles.foodHeader}>
          <View style={styles.foodText}>
            <Text style={styles.foodLabel}>{ingredient.label}</Text>
            {ingredient.exchangeGroupName ? (
              <Text style={styles.foodSubtitle}>{ingredient.exchangeGroupName}</Text>
            ) : null}
          </View>
        </View>

        <PortionChips ingredient={ingredient} />
      </View>
    </View>
  );
};

const SectionHeader: React.FC<{
  title: string;
  count: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = ({ title, count, icon }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={15} color={brandColors.navy} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <Text style={styles.sectionCount}>{count}</Text>
  </View>
);

const RecipeCard: React.FC<{
  recipe: ClientDietRecipeCard;
  expanded: boolean;
  onToggle: () => void;
}> = ({ recipe, expanded, onToggle }) => (
  <View style={styles.recipeCard}>
    {recipe.imageUrl ? (
      <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} resizeMode="cover" />
    ) : (
      <LinearGradient
        colors={['#E8EFF7', '#D8E7F4', '#C5DCF0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.recipePlaceholder}
      >
        <Ionicons name="restaurant-outline" size={28} color={brandColors.navy} />
      </LinearGradient>
    )}

    <View style={styles.recipeContent}>
      <View style={styles.recipeTopRow}>
        <View style={styles.recipeBadge}>
          <Text style={styles.recipeBadgeText}>Receta</Text>
        </View>
        <Text style={styles.recipeCount}>
          {recipe.ingredientCount} ingrediente{recipe.ingredientCount === 1 ? '' : 's'}
        </Text>
      </View>

      <Text style={styles.recipeTitle}>{recipe.title}</Text>
      <Text style={styles.recipeSubtitle}>
        Ingredientes y porciones de esta preparación dentro de tu plan.
      </Text>

      <Pressable style={styles.recipeToggle} onPress={onToggle}>
        <Text style={styles.recipeToggleText}>
          {expanded ? 'Ocultar ingredientes' : 'Ver ingredientes'}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={18}
          color={brandColors.navy}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.recipeIngredients}>
          {recipe.ingredients.map((ingredient) => (
            <IngredientRow
              key={ingredient.id}
              ingredient={ingredient}
              accent="recipe"
            />
          ))}
        </View>
      ) : null}
    </View>
  </View>
);

export const DietMealCard: React.FC<DietMealCardProps> = ({ meal }) => {
  const caloriesLabel = formatCalories(meal.totalCalories);
  const [expandedRecipeIds, setExpandedRecipeIds] = useState<Record<string, boolean>>({});

  const recipeKey = useMemo(
    () => meal.recipes.map((recipe) => recipe.id).join('|'),
    [meal.recipes],
  );

  useEffect(() => {
    setExpandedRecipeIds({});
  }, [meal.id, meal.totalEntries, recipeKey]);

  const toggleRecipe = (recipeId: string) => {
    setExpandedRecipeIds((currentState) => ({
      ...currentState,
      [recipeId]: !currentState[recipeId],
    }));
  };

  return (
    <Card style={styles.card} padding="none">
      <View style={styles.header}>
        <View>
          <Text style={styles.mealName}>{meal.name}</Text>
          <Text style={styles.mealCount}>
            {meal.totalEntries} {meal.totalEntries === 1 ? 'item' : 'items'}
          </Text>
        </View>
        {caloriesLabel ? (
          <View style={styles.calorieBadge}>
            <Text style={styles.calorieBadgeText}>{caloriesLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        {meal.recipes.length > 0 ? (
          <View style={styles.sectionBlock}>
            <SectionHeader title="Recetas" count={meal.recipes.length} icon="restaurant-outline" />
            <View style={styles.sectionStack}>
              {meal.recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  expanded={Boolean(expandedRecipeIds[recipe.id])}
                  onToggle={() => toggleRecipe(recipe.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {meal.standaloneFoods.length > 0 ? (
          <View style={styles.sectionBlock}>
            <SectionHeader
              title="Alimentos sueltos"
              count={meal.standaloneFoods.length}
              icon="nutrition-outline"
            />
            <View style={styles.sectionStack}>
              {meal.standaloneFoods.map((food) => (
                <IngredientRow key={food.id} ingredient={food} />
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  mealName: {
    color: colors.gray[900],
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  mealCount: {
    marginTop: spacing.xs,
    color: colors.gray[500],
    fontSize: fontSize.sm,
  },
  calorieBadge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: `${brandColors.sky}25`,
  },
  calorieBadgeText: {
    color: brandColors.navy,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  sectionBlock: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${brandColors.sky}20`,
  },
  sectionTitle: {
    color: colors.gray[900],
    fontSize: fontSize.base,
    fontWeight: '800',
  },
  sectionCount: {
    color: colors.gray[500],
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  sectionStack: {
    gap: spacing.md,
  },
  recipeCard: {
    borderRadius: borderRadius.lg,
    backgroundColor: '#F5F8FC',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DDE8F2',
  },
  recipeImage: {
    width: '100%',
    height: 152,
  },
  recipePlaceholder: {
    width: '100%',
    height: 152,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeContent: {
    padding: spacing.md,
  },
  recipeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  recipeBadge: {
    alignSelf: 'flex-start',
    borderRadius: borderRadius.full,
    backgroundColor: brandColors.navy,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  recipeBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  recipeCount: {
    color: colors.gray[500],
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  recipeTitle: {
    marginTop: spacing.md,
    color: colors.gray[900],
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  recipeSubtitle: {
    marginTop: spacing.xs,
    color: colors.gray[500],
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  recipeToggle: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#D8E7F4',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  recipeToggleText: {
    color: brandColors.navy,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  recipeIngredients: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  foodRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: '#FAFBFD',
    borderWidth: 1,
  },
  foodIcon: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  foodBody: {
    flex: 1,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  foodText: {
    flex: 1,
  },
  foodLabel: {
    color: colors.gray[900],
    fontSize: fontSize.base,
    fontWeight: '700',
  },
  foodSubtitle: {
    marginTop: 2,
    color: colors.gray[500],
    fontSize: fontSize.sm,
  },
  portionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  portionChip: {
    minWidth: 88,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E5EDF5',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  portionChipLabel: {
    color: colors.gray[500],
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  portionChipValue: {
    marginTop: 4,
    color: colors.gray[900],
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});

export default DietMealCard;
