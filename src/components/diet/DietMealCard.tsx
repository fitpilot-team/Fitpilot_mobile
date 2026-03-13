import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
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
import type { ClientDietItem, ClientDietMeal } from '../../types';

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

  const rounded = Math.round(value);
  return `${rounded} kcal`;
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

const RecipeItemCard: React.FC<{ item: ClientDietItem }> = ({ item }) => (
  <View style={styles.recipeCard}>
    {item.recipe?.imageUrl ? (
      <Image source={{ uri: item.recipe.imageUrl }} style={styles.recipeImage} resizeMode="cover" />
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
      <View style={styles.recipeBadge}>
        <Text style={styles.recipeBadgeText}>Receta</Text>
      </View>
      <Text style={styles.recipeTitle}>{item.label}</Text>
      {item.quantityLabel ? <Text style={styles.recipeSubtitle}>{item.quantityLabel}</Text> : null}
    </View>
  </View>
);

const FoodItemRow: React.FC<{ item: ClientDietItem }> = ({ item }) => {
  const foodGroupVisual = getFoodGroupVisual(item.exchangeGroupName);

  return (
  <View style={[styles.foodRow, { borderColor: foodGroupVisual.borderColor }]}>
    <View style={[styles.foodIcon, { backgroundColor: foodGroupVisual.backgroundColor }]}>
      <Ionicons name={foodGroupVisual.icon} size={18} color={foodGroupVisual.iconColor} />
    </View>

    <View style={styles.foodText}>
      <Text style={styles.foodLabel}>{item.label}</Text>
      {item.exchangeGroupName ? <Text style={styles.foodSubtitle}>{item.exchangeGroupName}</Text> : null}
    </View>

    {item.quantityLabel ? <Text style={styles.foodQuantity}>{item.quantityLabel}</Text> : null}
  </View>
  );
};

export const DietMealCard: React.FC<DietMealCardProps> = ({ meal }) => {
  const caloriesLabel = formatCalories(meal.totalCalories);

  return (
    <Card style={styles.card} padding="none">
      <View style={styles.header}>
        <View>
          <Text style={styles.mealName}>{meal.name}</Text>
          <Text style={styles.mealCount}>
            {meal.items.length} {meal.items.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        {caloriesLabel ? (
          <View style={styles.calorieBadge}>
            <Text style={styles.calorieBadgeText}>{caloriesLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        {meal.items.map((item) =>
          item.kind === 'recipe' && item.recipe ? (
            <RecipeItemCard key={item.id} item={item} />
          ) : (
            <FoodItemRow key={item.id} item={item} />
          ),
        )}
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
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: '#FAFBFD',
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  foodIcon: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
  foodQuantity: {
    color: brandColors.navy,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});

export default DietMealCard;
