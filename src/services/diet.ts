import { nutritionClient } from './api';
import type {
  ClientDietDay,
  ClientDietItem,
  ClientDietMeal,
  ClientRecipeSummary,
} from '../types';

type NutritionRecipeSummaryResponse = {
  id: number;
  title: string;
  image_url: string | null;
};

type NutritionRecipeDetailResponse = {
  id: number;
  name: string;
  image_url: string | null;
};

type NutritionMenuItemResponse = {
  id: number;
  quantity?: number | string | null;
  equivalent_quantity?: number | string | null;
  recipe_id?: number | null;
  foods?: {
    name?: string | null;
  } | null;
  exchange_groups?: {
    name?: string | null;
  } | null;
  serving_units?: {
    unit_name?: string | null;
  } | null;
  recipe_summary?: NutritionRecipeSummaryResponse | null;
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

const getTodayDateKey = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const normalizeDateKey = (value: string | null | undefined) => value?.slice(0, 10) ?? null;

const formatDisplayNumber = (value: number | null) => {
  if (value === null) {
    return '';
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
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
            .filter((item) => item.recipe_id && !item.recipe_summary)
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

        return [
          recipeId,
          {
            id: recipe.id,
            title: recipe.name,
            imageUrl: recipe.image_url,
          },
        ] as const;
      } catch {
        return null;
      }
    }),
  );

  return new Map(
    summaries.filter(
      (entry): entry is readonly [number, ClientRecipeSummary] => entry !== null,
    ),
  );
};

const formatQuantityLabel = (item: NutritionMenuItemResponse) => {
  const quantity = toNumber(item.quantity);
  const equivalentQuantity = toNumber(item.equivalent_quantity);
  const unitName = item.serving_units?.unit_name?.trim();

  if (quantity !== null && unitName) {
    return `${formatDisplayNumber(quantity)} ${unitName}`;
  }

  if (equivalentQuantity !== null) {
    return `${formatDisplayNumber(equivalentQuantity)} equivalentes`;
  }

  if (quantity !== null) {
    return `${formatDisplayNumber(quantity)} porciones`;
  }

  return '';
};

const resolveRecipeForItem = (
  item: NutritionMenuItemResponse,
  recipeSummaryMap: Map<number, ClientRecipeSummary>,
): ClientRecipeSummary | null =>
  mapRecipeSummary(item.recipe_summary) ||
  (item.recipe_id ? recipeSummaryMap.get(item.recipe_id) ?? null : null);

const mapFoodDietItem = (
  item: NutritionMenuItemResponse,
  recipeSummaryMap: Map<number, ClientRecipeSummary>,
): ClientDietItem => {
  const recipe = resolveRecipeForItem(item, recipeSummaryMap);
  const foodName = item.foods?.name?.trim();
  const exchangeGroupName = item.exchange_groups?.name?.trim() || null;

  return {
    id: String(item.id),
    kind: 'food',
    label: recipe?.title || foodName || exchangeGroupName || 'Item de dieta',
    quantityLabel: formatQuantityLabel(item),
    exchangeGroupName,
    recipe,
  };
};

const mapDietItems = (
  items: NutritionMenuItemResponse[],
  recipeSummaryMap: Map<number, ClientRecipeSummary>,
): ClientDietItem[] => {
  const recipeGroupCounts = new Map<number, number>();

  items.forEach((item) => {
    const recipe = resolveRecipeForItem(item, recipeSummaryMap);

    if (!recipe) {
      return;
    }

    recipeGroupCounts.set(recipe.id, (recipeGroupCounts.get(recipe.id) ?? 0) + 1);
  });

  const renderedRecipeIds = new Set<number>();

  return items.flatMap((item) => {
    const recipe = resolveRecipeForItem(item, recipeSummaryMap);

    if (!recipe) {
      return [mapFoodDietItem(item, recipeSummaryMap)];
    }

    if (renderedRecipeIds.has(recipe.id)) {
      return [];
    }

    renderedRecipeIds.add(recipe.id);
    const ingredientCount = recipeGroupCounts.get(recipe.id) ?? 0;

    return [
      {
        id: `recipe-${recipe.id}-${item.id}`,
        kind: 'recipe',
        label: recipe.title,
        quantityLabel: ingredientCount > 0
          ? `${ingredientCount} ingrediente${ingredientCount === 1 ? '' : 's'}`
          : '',
        exchangeGroupName: null,
        recipe: {
          ...recipe,
          ingredientCount,
        },
      },
    ];
  });
};

const mapDietMeal = (
  meal: NutritionMenuMealResponse,
  recipeSummaryMap: Map<number, ClientRecipeSummary>,
): ClientDietMeal => ({
  id: String(meal.id),
  name: meal.name?.trim() || 'Comida',
  totalCalories: toNumber(meal.total_calories),
  items: mapDietItems(meal.menu_items_menu_items_menu_meal_idTomenu_meals ?? [], recipeSummaryMap),
});

const mapDietDay = (
  menu: NutritionMenuResponse,
  assignedDate: string,
  todayDate: string,
  recipeSummaryMap: Map<number, ClientRecipeSummary>,
): ClientDietDay => {
  const meals = (menu.menu_meals ?? []).map((meal) => mapDietMeal(meal, recipeSummaryMap));
  const totalItems = meals.reduce((count, meal) => count + meal.items.length, 0);
  const totalRecipes = meals.reduce(
    (count, meal) => count + meal.items.filter(item => item.recipe).length,
    0,
  );

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
