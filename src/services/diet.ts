import { nutritionClient } from './api';
import type {
  ClientDietDay,
  ClientDietFoodRow,
  ClientDietIngredientRow,
  ClientDietMeal,
  ClientDietPortion,
  ClientDietRecipeCard,
  ClientRecipeSummary,
} from '../types';

type NutritionPortionResponse = {
  household_label?: string | null;
  equivalents?: number | string | null;
  grams?: number | string | null;
};

type NutritionRecipeSummaryResponse = {
  id: number;
  title: string;
  image_url: string | null;
  ingredient_count?: number | string | null;
};

type NutritionFoodResponse = {
  name?: string | null;
  base_serving_size?: number | string | null;
  base_unit?: string | null;
  food_nutrition_values?: Array<{
    base_serving_size?: number | string | null;
    base_unit?: string | null;
  }>;
};

type NutritionRecipeIngredientResponse = {
  id: number | string;
  food_id?: number | null;
  name?: string | null;
  exchange_group_name?: string | null;
  household_label?: string | null;
  equivalents?: number | string | null;
  grams?: number | string | null;
};

type NutritionEmbeddedRecipeDetailResponse = {
  id: number;
  title?: string | null;
  image_url?: string | null;
  ingredient_count?: number | string | null;
  ingredients?: NutritionRecipeIngredientResponse[] | null;
};

type NutritionRecipeDetailResponse = {
  id: number;
  name: string;
  image_url: string | null;
  ingredient_count?: number | string | null;
};

type NutritionMenuItemResponse = {
  id: number;
  quantity?: number | string | null;
  equivalent_quantity?: number | string | null;
  recipe_id?: number | null;
  serving_unit_id?: number | null;
  foods?: NutritionFoodResponse | null;
  exchange_groups?: {
    name?: string | null;
  } | null;
  serving_units?: {
    unit_name?: string | null;
    gram_equivalent?: number | string | null;
  } | null;
  recipe_summary?: NutritionRecipeSummaryResponse | null;
  recipe_detail?: NutritionEmbeddedRecipeDetailResponse | null;
  portion_detail?: NutritionPortionResponse | null;
};

type NutritionMenuMealResponse = {
  id: number;
  name?: string | null;
  total_calories?: number | string | null;
  menu_items_menu_items_menu_meal_idTomenu_meals?: NutritionMenuItemResponse[];
};

type NutritionMenuResponse = {
  id: number;
  title?: string | null;
  description_?: string | null;
  menu_meals?: NutritionMenuMealResponse[];
};

type RecipeGroupAccumulator = {
  summary: ClientRecipeSummary;
  detail: NutritionEmbeddedRecipeDetailResponse | null;
  items: NutritionMenuItemResponse[];
  firstIndex: number;
};

const DIET_LOOKAHEAD_DAYS = 7;

const toNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const roundValue = (value: number | null) => {
  if (value === null) {
    return null;
  }

  return Math.round(value * 100) / 100;
};

const getTodayDateKey = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const normalizeDateKey = (value: string | null | undefined) => value?.slice(0, 10) ?? null;

const normalizeUnit = (value: string | null | undefined) =>
  (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const formatDisplayNumber = (value: number | null) => {
  if (value === null) {
    return '';
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
};

const resolveFoodBaseServingSize = (food?: NutritionFoodResponse | null) =>
  toNumber(food?.food_nutrition_values?.[0]?.base_serving_size) ??
  toNumber(food?.base_serving_size);

const resolveFoodBaseUnit = (food?: NutritionFoodResponse | null) =>
  food?.food_nutrition_values?.[0]?.base_unit?.trim() ||
  food?.base_unit?.trim() ||
  null;

const isGramBasedQuantity = (item: NutritionMenuItemResponse) => {
  if (item.serving_unit_id === null || item.serving_unit_id === undefined) {
    return true;
  }

  const normalizedUnit = normalizeUnit(item.serving_units?.unit_name);
  if (
    normalizedUnit === 'g' ||
    normalizedUnit === 'gr' ||
    normalizedUnit === 'gramo' ||
    normalizedUnit === 'gramos'
  ) {
    return true;
  }

  const normalizedBaseUnit = normalizeUnit(resolveFoodBaseUnit(item.foods));
  return (
    normalizedBaseUnit === 'g' ||
    normalizedBaseUnit === 'gr' ||
    normalizedBaseUnit === 'gramo' ||
    normalizedBaseUnit === 'gramos'
  );
};

const buildPortion = (
  householdLabel: string | null,
  equivalents: number | null,
  grams: number | null,
): ClientDietPortion => ({
  householdLabel,
  equivalents: roundValue(equivalents),
  grams: roundValue(grams),
});

const derivePortionFromMenuItem = (item: NutritionMenuItemResponse): ClientDietPortion => {
  if (item.portion_detail) {
    return buildPortion(
      item.portion_detail.household_label?.trim() || null,
      toNumber(item.portion_detail.equivalents),
      toNumber(item.portion_detail.grams),
    );
  }

  const quantity = toNumber(item.quantity);
  const gramEquivalent = toNumber(item.serving_units?.gram_equivalent);
  const explicitEquivalent = toNumber(item.equivalent_quantity);
  const baseServingSize = resolveFoodBaseServingSize(item.foods);
  const unitName = item.serving_units?.unit_name?.trim() || null;

  const grams =
    quantity !== null
      ? gramEquivalent !== null && gramEquivalent > 0
        ? quantity * gramEquivalent
        : isGramBasedQuantity(item)
          ? quantity
          : null
      : null;

  const equivalents =
    grams !== null && baseServingSize !== null && baseServingSize > 0
      ? grams / baseServingSize
      : explicitEquivalent;

  const householdLabel = unitName
    ? quantity !== null
      ? `${formatDisplayNumber(quantity)} ${unitName}`
      : null
    : grams !== null
      ? `${formatDisplayNumber(grams)} g`
      : null;

  return buildPortion(householdLabel, equivalents, grams);
};

const mapRecipeSummary = (
  recipeSummary?: NutritionRecipeSummaryResponse | null,
): ClientRecipeSummary | null => {
  if (!recipeSummary) {
    return null;
  }

  return {
    id: recipeSummary.id,
    title: recipeSummary.title,
    imageUrl: recipeSummary.image_url,
    ingredientCount: toNumber(recipeSummary.ingredient_count) ?? undefined,
  };
};

const mapRecipeSummaryFromDetail = (
  recipeDetail?: NutritionEmbeddedRecipeDetailResponse | null,
): ClientRecipeSummary | null => {
  if (!recipeDetail) {
    return null;
  }

  return {
    id: recipeDetail.id,
    title: recipeDetail.title?.trim() || 'Receta',
    imageUrl: recipeDetail.image_url ?? null,
    ingredientCount: toNumber(recipeDetail.ingredient_count) ?? undefined,
  };
};

const buildRecipeSummaryMap = async (
  menus: NutritionMenuResponse[],
): Promise<Map<number, ClientRecipeSummary>> => {
  const missingRecipeIds = Array.from(
    new Set(
      menus.flatMap((menu) =>
        (menu.menu_meals ?? []).flatMap((meal) =>
          (meal.menu_items_menu_items_menu_meal_idTomenu_meals ?? [])
            .filter((item) => item.recipe_id && !item.recipe_summary && !item.recipe_detail)
            .map((item) => item.recipe_id as number),
        ),
      ),
    ),
  );

  if (missingRecipeIds.length === 0) {
    return new Map();
  }

  const summaries = await Promise.all(
    missingRecipeIds.map(async (recipeId) => {
      try {
        const recipe = await nutritionClient.get<NutritionRecipeDetailResponse>(
          `/recipes/${recipeId}`,
          { skipErrorLogging: true },
        );

        const summary: ClientRecipeSummary = {
          id: recipe.id,
          title: recipe.name,
          imageUrl: recipe.image_url,
          ingredientCount: toNumber(recipe.ingredient_count) ?? undefined,
        };

        return [recipeId, summary] as const;
      } catch {
        return null;
      }
    }),
  );

  const validSummaries = summaries.filter(
    (entry): entry is readonly [number, ClientRecipeSummary] => entry !== null,
  );

  return new Map<number, ClientRecipeSummary>(validSummaries);
};

const resolveRecipeForItem = (
  item: NutritionMenuItemResponse,
  recipeSummaryMap: Map<number, ClientRecipeSummary>,
): ClientRecipeSummary | null =>
  mapRecipeSummary(item.recipe_summary) ||
  mapRecipeSummaryFromDetail(item.recipe_detail) ||
  (item.recipe_id ? recipeSummaryMap.get(item.recipe_id) ?? null : null);

const mapStandaloneFoodRow = (item: NutritionMenuItemResponse): ClientDietFoodRow => ({
  id: String(item.id),
  label:
    item.foods?.name?.trim() ||
    item.exchange_groups?.name?.trim() ||
    'Alimento',
  exchangeGroupName: item.exchange_groups?.name?.trim() || null,
  portion: derivePortionFromMenuItem(item),
});

const mapEmbeddedRecipeIngredient = (
  ingredient: NutritionRecipeIngredientResponse,
): ClientDietIngredientRow => ({
  id: String(ingredient.id),
  label: ingredient.name?.trim() || 'Ingrediente',
  exchangeGroupName: ingredient.exchange_group_name?.trim() || null,
  portion: buildPortion(
    ingredient.household_label?.trim() || null,
    toNumber(ingredient.equivalents),
    toNumber(ingredient.grams),
  ),
});

const buildRecipeCardFromGroup = (
  group: RecipeGroupAccumulator,
): ClientDietRecipeCard => {
  const detailSummary = mapRecipeSummaryFromDetail(group.detail);
  const recipeSummary = detailSummary || group.summary;

  const ingredients =
    group.detail?.ingredients?.length
      ? group.detail.ingredients.map(mapEmbeddedRecipeIngredient)
      : group.items.map((item) => ({
          id: String(item.id),
          label:
            item.foods?.name?.trim() ||
            item.exchange_groups?.name?.trim() ||
            'Ingrediente',
          exchangeGroupName: item.exchange_groups?.name?.trim() || null,
          portion: derivePortionFromMenuItem(item),
        }));

  return {
    id: `recipe-${recipeSummary.id}-${group.items[0]?.id ?? recipeSummary.id}`,
    recipeId: recipeSummary.id,
    title: recipeSummary.title,
    imageUrl: recipeSummary.imageUrl,
    ingredientCount: ingredients.length,
    ingredients,
  };
};

const mapDietMeal = (
  meal: NutritionMenuMealResponse,
  recipeSummaryMap: Map<number, ClientRecipeSummary>,
): ClientDietMeal => {
  const items = meal.menu_items_menu_items_menu_meal_idTomenu_meals ?? [];
  const recipeGroups = new Map<number, RecipeGroupAccumulator>();
  const standaloneFoods: ClientDietFoodRow[] = [];

  items.forEach((item, index) => {
    const recipeSummary = resolveRecipeForItem(item, recipeSummaryMap);

    if (!recipeSummary) {
      standaloneFoods.push(mapStandaloneFoodRow(item));
      return;
    }

    const existingGroup = recipeGroups.get(recipeSummary.id);
    if (existingGroup) {
      existingGroup.items.push(item);
      if (!existingGroup.detail && item.recipe_detail) {
        existingGroup.detail = item.recipe_detail;
      }
      return;
    }

    recipeGroups.set(recipeSummary.id, {
      summary: recipeSummary,
      detail: item.recipe_detail ?? null,
      items: [item],
      firstIndex: index,
    });
  });

  const recipes = Array.from(recipeGroups.values())
    .sort((left, right) => left.firstIndex - right.firstIndex)
    .map(buildRecipeCardFromGroup);

  return {
    id: String(meal.id),
    name: meal.name?.trim() || 'Comida',
    totalCalories: toNumber(meal.total_calories),
    recipes,
    standaloneFoods,
    totalEntries: recipes.length + standaloneFoods.length,
  };
};

const mapDietDay = (
  menu: NutritionMenuResponse,
  assignedDate: string,
  todayDate: string,
  recipeSummaryMap: Map<number, ClientRecipeSummary>,
): ClientDietDay => {
  const meals = (menu.menu_meals ?? []).map((meal) => mapDietMeal(meal, recipeSummaryMap));
  const totalItems = meals.reduce((count, meal) => count + meal.totalEntries, 0);
  const totalRecipes = meals.reduce((count, meal) => count + meal.recipes.length, 0);

  return {
    id: `${menu.id}-${assignedDate}`,
    assignedDate,
    title: menu.title?.trim() || 'Tu dieta',
    description: menu.description_?.trim() || null,
    meals,
    isToday: assignedDate === todayDate,
    totalMeals: meals.length,
    totalItems,
    totalRecipes,
  };
};

export const getTodayDietDateKey = getTodayDateKey;

export const getClientDietCalendar = async (
  clientId: string,
  date: string = getTodayDateKey(),
): Promise<ClientDietDay[]> => {
  const numericClientId = Number(clientId);

  if (!Number.isInteger(numericClientId)) {
    throw new Error('No se pudo resolver el cliente autenticado para cargar la dieta.');
  }

  const todayDate = getTodayDateKey();
  const anchorDate = normalizeDateKey(date) || todayDate;
  const requestedDates = Array.from({ length: DIET_LOOKAHEAD_DAYS }, (_, offset) => {
    const currentDate = new Date(`${anchorDate}T12:00:00`);
    currentDate.setDate(currentDate.getDate() + offset);
    return normalizeDateKey(currentDate.toISOString()) as string;
  });

  const dailyMenus = await Promise.all(
    requestedDates.map(async (requestedDate) => {
      const menu = await nutritionClient.get<NutritionMenuResponse | null>(
        `/menus/daily?client_id=${numericClientId}&date=${requestedDate}`,
        { skipErrorLogging: true },
      );

      return {
        requestedDate,
        menu,
      };
    }),
  );

  const recipeSummaryMap = await buildRecipeSummaryMap(
    dailyMenus.flatMap(({ menu }) => (menu ? [menu] : [])),
  );
  const daysByDate = new Map<string, ClientDietDay>();

  for (const { requestedDate, menu } of dailyMenus) {
    if (!menu) {
      continue;
    }

    daysByDate.set(
      requestedDate,
      mapDietDay(menu, requestedDate, todayDate, recipeSummaryMap),
    );
  }

  return Array.from(daysByDate.values()).sort((left, right) =>
    left.assignedDate.localeCompare(right.assignedDate),
  );
};
