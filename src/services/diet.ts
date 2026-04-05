import { nutritionClient } from './api';
import type {
  ClientDietFoodRow,
  ClientDietIngredientRow,
  ClientDietMenu,
  ClientDietMeal,
  ClientDietPortion,
  ClientDietRecipeCard,
  ClientDietRecipeDetail,
  ClientDietWeekDay,
  ClientFoodSwapCandidate,
  ClientRecipeSummary,
} from '../types';
import {
  compareDateKeys,
  getLocalWeekDateKeys,
  getStartOfLocalWeekDateKey,
  getTodayDateKey,
  toLocalDateKey,
} from '../utils/date';

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
  id?: number | null;
  name?: string | null;
  brand?: string | null;
  exchange_group_id?: number | null;
  base_serving_size?: number | string | null;
  base_unit?: string | null;
  calories_kcal?: number | string | null;
  food_nutrition_values?: {
    base_serving_size?: number | string | null;
    base_unit?: string | null;
  }[];
  serving_units?: {
    id?: number | null;
    food_id?: number | null;
    unit_name?: string | null;
    gram_equivalent?: number | string | null;
    is_exchange_unit?: boolean | null;
  }[];
};

type NutritionEmbeddedRecipeDetailResponse = {
  id: number;
  title?: string | null;
  image_url?: string | null;
  ingredient_count?: number | string | null;
  ingredients?: NutritionRecipeDetailIngredientResponse[] | null;
};

type NutritionRecipeDetailResponse = {
  id: number;
  name: string;
  description?: string | null;
  description_rich?: unknown | null;
  image_url: string | null;
  ingredient_count?: number | string | null;
  ingredients?: NutritionRecipeDetailIngredientResponse[] | null;
};

type NutritionRecipeDetailIngredientResponse = {
  id: number | string;
  food_id?: number | null;
  serving_unit_id?: number | null;
  quantity?: number | string | null;
  exchange_group_id?: number | null;
  exchange_group_name?: string | null;
  is_client_swap?: boolean | null;
  original_food_id?: number | null;
  original_food_name?: string | null;
  food?: NutritionFoodResponse | null;
  serving_unit?: {
    id?: number | null;
    food_id?: number | null;
    unit_name?: string | null;
    gram_equivalent?: number | string | null;
    is_exchange_unit?: boolean | null;
  } | null;
};

type NutritionFoodSwapCandidateResponse = {
  id: number;
  name?: string | null;
  brand?: string | null;
  exchange_group_id?: number | null;
  base_serving_size?: number | string | null;
  base_unit?: string | null;
  calories_kcal?: number | string | null;
  serving_units?: {
    id?: number | null;
  }[] | null;
};

type NutritionMenuItemResponse = {
  id: number;
  food_id?: number | null;
  exchange_group_id?: number | null;
  quantity?: number | string | null;
  equivalent_quantity?: number | string | null;
  recipe_id?: number | null;
  serving_unit_id?: number | null;
  is_client_swap?: boolean | null;
  original_food_id?: number | null;
  original_food_name?: string | null;
  foods?: NutritionFoodResponse | null;
  exchange_groups?: {
    name?: string | null;
  } | null;
  serving_units?: {
    id?: number | null;
    food_id?: number | null;
    unit_name?: string | null;
    gram_equivalent?: number | string | null;
    is_exchange_unit?: boolean | null;
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

type NutritionDailyBatchResponseItem = NutritionMenuResponse & {
  assigned_date?: string | null;
  menu_id_selected_client?: number | null;
};

type NutritionMenuCalendarResponseItem = NutritionMenuResponse & {
  assigned_date?: string | null;
  assignment_start_date?: string | null;
  assignment_end_date?: string | null;
  menu_id_selected_client?: number | null;
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

const normalizeDateKey = (value: string | null | undefined) => toLocalDateKey(value);

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

const isGramBasedRecipeIngredient = (ingredient: NutritionRecipeDetailIngredientResponse) => {
  if (ingredient.serving_unit_id === null || ingredient.serving_unit_id === undefined) {
    return true;
  }

  const normalizedUnit = normalizeUnit(ingredient.serving_unit?.unit_name);
  if (
    normalizedUnit === 'g' ||
    normalizedUnit === 'gr' ||
    normalizedUnit === 'gramo' ||
    normalizedUnit === 'gramos'
  ) {
    return true;
  }

  const normalizedBaseUnit = normalizeUnit(resolveFoodBaseUnit(ingredient.food));
  return (
    normalizedBaseUnit === 'g' ||
    normalizedBaseUnit === 'gr' ||
    normalizedBaseUnit === 'gramo' ||
    normalizedBaseUnit === 'gramos'
  );
};

const isHouseholdUnit = (unitName: string | null | undefined): boolean => {
  const normalized = normalizeUnit(unitName);
  if (!normalized) return false;
  if (['g', 'gr', 'gramo', 'gramos'].includes(normalized)) return false;
  if (normalized.includes('equivalente') || normalized.includes('smae')) return false;
  return true;
};

const deriveFallbackHouseholdLabel = (
  grams: number | null,
  servingUnits: { unit_name?: string | null; gram_equivalent?: number | string | null }[] | null | undefined
): string | null => {
  if (grams === null || grams <= 0 || !servingUnits?.length) {
    return null;
  }

  let bestCandidate: { unitName: string; quantity: number; relativeError: number; distanceToOne: number } | null = null;

  for (const servingUnit of servingUnits) {
    const unitName = servingUnit.unit_name?.trim() || null;
    const gramEquivalent = toNumber(servingUnit.gram_equivalent);

    if (!unitName || !isHouseholdUnit(unitName) || gramEquivalent === null || gramEquivalent <= 0) {
      continue;
    }

    const rawQuantity = grams / gramEquivalent;
    if (!Number.isFinite(rawQuantity) || rawQuantity <= 0) {
      continue;
    }

    const roundedQuantity = Math.round(rawQuantity * 4) / 4;
    if (roundedQuantity < 0.25 || roundedQuantity > 6) {
      continue;
    }

    const relativeError = Math.abs(rawQuantity - roundedQuantity) / rawQuantity;
    if (relativeError > 0.15) {
      continue;
    }

    const distanceToOne = Math.abs(roundedQuantity - 1);
    const candidate = { unitName, quantity: roundedQuantity, relativeError, distanceToOne };

    if (!bestCandidate) {
      bestCandidate = candidate;
    } else if (candidate.relativeError < bestCandidate.relativeError) {
      bestCandidate = candidate;
    } else if (candidate.relativeError === bestCandidate.relativeError && candidate.distanceToOne < bestCandidate.distanceToOne) {
      bestCandidate = candidate;
    }
  }

  return bestCandidate ? `${formatDisplayNumber(bestCandidate.quantity)} ${bestCandidate.unitName}` : null;
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

  let householdLabel: string | null = null;

  if (unitName && isHouseholdUnit(unitName) && quantity !== null) {
    householdLabel = `${formatDisplayNumber(quantity)} ${unitName}`;
  }

  if (!householdLabel) {
    householdLabel = deriveFallbackHouseholdLabel(grams, item.foods?.serving_units);
  }

  if (!householdLabel && grams !== null) {
    householdLabel = `${formatDisplayNumber(grams)} g`;
  }

  return buildPortion(householdLabel, equivalents, grams);
};

const derivePortionFromRecipeIngredient = (
  ingredient: NutritionRecipeDetailIngredientResponse,
): ClientDietPortion => {
  const quantity = toNumber(ingredient.quantity);
  const gramEquivalent = toNumber(ingredient.serving_unit?.gram_equivalent);
  const baseServingSize = resolveFoodBaseServingSize(ingredient.food);
  const unitName = ingredient.serving_unit?.unit_name?.trim() || null;

  const grams =
    quantity !== null
      ? gramEquivalent !== null && gramEquivalent > 0
        ? quantity * gramEquivalent
        : isGramBasedRecipeIngredient(ingredient)
          ? quantity
          : null
      : null;

  const equivalents =
    grams !== null && baseServingSize !== null && baseServingSize > 0
      ? grams / baseServingSize
      : null;

  let householdLabel: string | null = null;

  if (unitName && isHouseholdUnit(unitName) && quantity !== null) {
    householdLabel = `${formatDisplayNumber(quantity)} ${unitName}`;
  }

  if (!householdLabel) {
    householdLabel = deriveFallbackHouseholdLabel(grams, ingredient.food?.serving_units);
  }

  if (!householdLabel && grams !== null) {
    householdLabel = `${formatDisplayNumber(grams)} g`;
  }

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
  menuItemId: item.id,
  foodId: item.food_id ?? item.foods?.id ?? null,
  exchangeGroupId: item.exchange_group_id ?? item.foods?.exchange_group_id ?? null,
  label:
    item.foods?.name?.trim() ||
    item.exchange_groups?.name?.trim() ||
    'Alimento',
  exchangeGroupName: item.exchange_groups?.name?.trim() || null,
  isClientSwap: Boolean(item.is_client_swap),
  originalFoodId: item.original_food_id ?? null,
  originalLabel: item.original_food_name?.trim() || null,
  portion: derivePortionFromMenuItem(item),
});

const mapRecipeIngredientRow = (
  ingredient: NutritionRecipeDetailIngredientResponse,
): ClientDietIngredientRow => ({
  id: String(ingredient.id),
  recipeIngredientId: toNumber(ingredient.id) ?? undefined,
  foodId: ingredient.food_id ?? null,
  exchangeGroupId: ingredient.exchange_group_id ?? ingredient.food?.exchange_group_id ?? null,
  label: ingredient.food?.name?.trim() || 'Ingrediente',
  exchangeGroupName: ingredient.exchange_group_name?.trim() || null,
  isClientSwap: Boolean(ingredient.is_client_swap),
  originalFoodId: ingredient.original_food_id ?? null,
  originalLabel: ingredient.original_food_name?.trim() || null,
  portion: derivePortionFromRecipeIngredient(ingredient),
});

const buildRecipeCardFromGroup = (
  group: RecipeGroupAccumulator,
): ClientDietRecipeCard => {
  const detailSummary = mapRecipeSummaryFromDetail(group.detail);
  const recipeSummary = detailSummary || group.summary;

  const ingredients =
    group.detail?.ingredients?.length
      ? group.detail.ingredients.map(mapRecipeIngredientRow)
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

const mapDietMenu = (
  menu: NutritionMenuResponse,
  assignedDate: string,
  recipeSummaryMap: Map<number, ClientRecipeSummary>,
): ClientDietMenu => {
  const meals = (menu.menu_meals ?? []).map((meal) => mapDietMeal(meal, recipeSummaryMap));
  const totalItems = meals.reduce((count, meal) => count + meal.totalEntries, 0);
  const totalRecipes = meals.reduce((count, meal) => count + meal.recipes.length, 0);
  const mealsWithEntries = meals.filter((meal) => meal.totalEntries > 0);
  const totalCalories = mealsWithEntries.every((meal) => meal.totalCalories !== null)
    ? mealsWithEntries.reduce((sum, meal) => sum + (meal.totalCalories ?? 0), 0)
    : null;

  return {
    id: `${menu.id}-${assignedDate}`,
    menuId: menu.id,
    assignedDate,
    title: menu.title?.trim() || 'Tu dieta',
    description: menu.description_?.trim() || null,
    meals,
    totalMeals: meals.length,
    totalCalories,
    totalItems,
    totalRecipes,
  };
};

export const mapDietMenuResponse = (
  menu: NutritionMenuResponse,
  assignedDate: string,
): ClientDietMenu => mapDietMenu(menu, assignedDate, new Map());

const mapDietRecipeDetailResponse = (
  recipe: NutritionRecipeDetailResponse,
): ClientDietRecipeDetail => {
  const ingredients = (recipe.ingredients ?? []).map(mapRecipeIngredientRow);

  return {
    id: `recipe-${recipe.id}`,
    recipeId: recipe.id,
    title: recipe.name?.trim() || 'Receta',
    imageUrl: recipe.image_url ?? null,
    description: recipe.description?.trim() || null,
    descriptionRich: recipe.description_rich ?? null,
    ingredientCount: toNumber(recipe.ingredient_count) ?? ingredients.length,
    ingredients,
  };
};

export const getDietRecipeDetail = async (
  recipeId: number,
): Promise<ClientDietRecipeDetail> => {
  const recipe = await nutritionClient.get<NutritionRecipeDetailResponse>(`/recipes/${recipeId}`);
  return mapDietRecipeDetailResponse(recipe);
};

export const getFoodsByExchangeGroup = async (
  groupId: number,
): Promise<ClientFoodSwapCandidate[]> => {
  const foods = await nutritionClient.get<NutritionFoodSwapCandidateResponse[]>(
    `/foods/exchange-group/${groupId}`,
    { skipErrorLogging: true },
  );

  return (foods ?? []).map((food) => ({
    id: food.id,
    name: food.name?.trim() || 'Alimento',
    brand: food.brand?.trim() || null,
    exchangeGroupId: food.exchange_group_id ?? null,
    baseServingSize: toNumber(food.base_serving_size),
    baseUnit: food.base_unit?.trim() || null,
    caloriesKcal: toNumber(food.calories_kcal),
    servingUnitsCount: Array.isArray(food.serving_units) ? food.serving_units.length : 0,
  }));
};

export const swapDietRecipeIngredient = async (
  recipeId: number,
  recipeIngredientId: number,
  foodId: number,
): Promise<ClientDietRecipeDetail> => {
  const recipe = await nutritionClient.put<NutritionRecipeDetailResponse>(
    `/recipes/${recipeId}/ingredients/${recipeIngredientId}/client-swap`,
    { food_id: foodId },
  );

  return mapDietRecipeDetailResponse(recipe);
};

export const resetDietRecipeIngredientSwap = async (
  recipeId: number,
  recipeIngredientId: number,
): Promise<ClientDietRecipeDetail> => {
  const recipe = await nutritionClient.delete<NutritionRecipeDetailResponse>(
    `/recipes/${recipeId}/ingredients/${recipeIngredientId}/client-swap`,
  );

  return mapDietRecipeDetailResponse(recipe);
};

export const swapDietStandaloneFood = async (
  menuId: number,
  menuItemId: number,
  foodId: number,
  assignedDate: string,
): Promise<ClientDietMenu> => {
  const menu = await nutritionClient.put<NutritionMenuResponse>(
    `/menus/${menuId}/items/${menuItemId}/client-swap`,
    { food_id: foodId },
  );

  return mapDietMenuResponse(menu, assignedDate);
};

export const resetDietStandaloneFoodSwap = async (
  menuId: number,
  menuItemId: number,
  assignedDate: string,
): Promise<ClientDietMenu> => {
  const menu = await nutritionClient.delete<NutritionMenuResponse>(
    `/menus/${menuId}/items/${menuItemId}/client-swap`,
  );

  return mapDietMenuResponse(menu, assignedDate);
};

export const getTodayDietDateKey = getTodayDateKey;

export const getClientDietCalendar = async (
  clientId: string,
  date: string = getTodayDateKey(),
): Promise<ClientDietWeekDay[]> => {
  const numericClientId = Number(clientId);

  if (!Number.isInteger(numericClientId)) {
    throw new Error('No se pudo resolver el cliente autenticado para cargar la dieta.');
  }

  const todayDate = getTodayDateKey();
  const anchorDate = normalizeDateKey(date) || todayDate;
  const weekStartDate = getStartOfLocalWeekDateKey(anchorDate) || todayDate;
  const weekDateKeys = getLocalWeekDateKeys(anchorDate);
  const dailyMenus = await nutritionClient.get<NutritionDailyBatchResponseItem[]>(
    `/menus/daily/batch?client_id=${numericClientId}&date=${weekStartDate}&days=${DIET_LOOKAHEAD_DAYS}`,
    { skipErrorLogging: true },
  );

  const recipeSummaryMap = await buildRecipeSummaryMap(dailyMenus);
  const menusByDate = new Map<string, ClientDietMenu>();

  for (const menu of dailyMenus) {
    const assignedDate = normalizeDateKey(menu.assigned_date);
    if (!assignedDate) {
      continue;
    }

    if (!weekDateKeys.includes(assignedDate) || menusByDate.has(assignedDate)) {
      continue;
    }

    menusByDate.set(
      assignedDate,
      mapDietMenu(menu, assignedDate, recipeSummaryMap),
    );
  }

  return weekDateKeys.map((assignedDate) => {
    const assignedMenu = menusByDate.get(assignedDate) ?? null;

    return {
      id: assignedDate,
      assignedDate,
      isToday: assignedDate === todayDate,
      assignedMenuId: assignedMenu?.menuId ?? null,
      menuOptions: assignedMenu ? [assignedMenu] : [],
    };
  });
};

export const getClientDietMenuCalendar = async (
  clientId: string,
  date: string,
): Promise<Record<string, ClientDietMenu[]>> => {
  const numericClientId = Number(clientId);
  const targetDate = normalizeDateKey(date);

  if (!Number.isInteger(numericClientId) || !targetDate) {
    throw new Error('No se pudo resolver el cliente autenticado para cargar los menus del calendario.');
  }

  const calendarMenus = await nutritionClient.get<NutritionMenuCalendarResponseItem[]>(
    `/menus/pool/calendar?client_id=${numericClientId}&date=${targetDate}`,
    { skipErrorLogging: true },
  );

  if (!Array.isArray(calendarMenus) || calendarMenus.length === 0) {
    return {};
  }

  const recipeSummaryMap = await buildRecipeSummaryMap(calendarMenus);
  const menusByDate = new Map<string, Map<number, ClientDietMenu>>();

  for (const menu of calendarMenus) {
    const assignedDate = normalizeDateKey(menu.assigned_date);
    if (!assignedDate) {
      continue;
    }

    const mappedMenu = mapDietMenu(menu, assignedDate, recipeSummaryMap);
    const existingMenus = menusByDate.get(assignedDate) ?? new Map<number, ClientDietMenu>();
    existingMenus.set(mappedMenu.menuId, mappedMenu);
    menusByDate.set(assignedDate, existingMenus);
  }

  return Object.fromEntries(
    Array.from(menusByDate.entries()).map(([assignedDate, menus]) => [
      assignedDate,
      Array.from(menus.values()).sort((left, right) => compareDateKeys(left.assignedDate, right.assignedDate) || left.menuId - right.menuId),
    ]),
  );
};

export const getClientDietMenuPool = async (
  clientId: string,
  date: string,
): Promise<ClientDietMenu[]> => {
  const numericClientId = Number(clientId);
  const targetDate = normalizeDateKey(date);

  if (!Number.isInteger(numericClientId) || !targetDate) {
    throw new Error('No se pudo resolver el cliente autenticado para cargar el pool de menus.');
  }

  const poolMenus = await nutritionClient.get<NutritionDailyBatchResponseItem[]>(
    `/menus/pool?client_id=${numericClientId}&date=${targetDate}`,
    { skipErrorLogging: true },
  );

  const dedupedPoolMenus = Array.from(
    new Map(poolMenus.map((menu) => [menu.id, menu])).values(),
  ).sort((left, right) => compareDateKeys(left.assigned_date ?? targetDate, right.assigned_date ?? targetDate));

  const recipeSummaryMap = await buildRecipeSummaryMap(dedupedPoolMenus);

  return dedupedPoolMenus.map((menu) => mapDietMenu(menu, targetDate, recipeSummaryMap));
};
