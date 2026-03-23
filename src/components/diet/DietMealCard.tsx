import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Card } from '../common';
import {
  borderRadius,
  brandColors,
  colors,
  dietTheme,
  fontSize,
  spacing,
} from '../../constants/colors';
import type {
  ClientDietFoodRow,
  ClientDietIngredientRow,
  ClientDietMeal,
  ClientDietRecipeCard,
} from '../../types';
import { getSmaeGroupVisual } from '../../constants/smaeIcons';
import { SmaeGroupIcon } from './SmaeGroupIcon';

interface DietMealCardProps {
  meal: ClientDietMeal;
}

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
  const foodGroupVisual = getSmaeGroupVisual(ingredient.exchangeGroupName);

  return (
    <View
      style={[
        styles.foodRow,
        { borderColor: accent === 'recipe' ? '#D8E7F4' : foodGroupVisual.borderColor },
      ]}
    >
      <View style={[styles.foodIcon, { backgroundColor: foodGroupVisual.backgroundColor }]}>
        <SmaeGroupIcon
          groupName={ingredient.exchangeGroupName}
          size={18}
          strokeWidth={2}
          withContainer={false}
        />
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
  onPress: () => void;
}> = ({ recipe, onPress }) => (
  <Pressable style={styles.recipeCard} onPress={onPress}>
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

      <View style={styles.recipeToggle}>
        <Text style={styles.recipeToggleText}>Abrir receta</Text>
        <Ionicons
          name="chevron-forward-outline"
          size={18}
          color={brandColors.navy}
        />
      </View>
    </View>
  </Pressable>
);

export const DietMealCard: React.FC<DietMealCardProps> = ({ meal }) => {
  const caloriesLabel = formatCalories(meal.totalCalories);

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
                  onPress={() => router.push({
                    pathname: '/recipes/[recipeId]',
                    params: {
                      recipeId: String(recipe.recipeId),
                    },
                  })}
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
    borderWidth: 1,
    borderColor: dietTheme.activeDayBorder,
    shadowColor: dietTheme.label,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
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
