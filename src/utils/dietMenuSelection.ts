import type { ClientDietMenu, ClientDietWeekDay } from '../types';
import { getCalendarDayDiff, getStartOfLocalWeekDateKey } from './date';

const sortDietMenus = (menus: ClientDietMenu[]) =>
  [...menus].sort((left, right) => left.menuId - right.menuId);

const hasSwappableRecipeIngredients = (menu: ClientDietMenu) =>
  menu.meals.some((meal) =>
    meal.recipes.some((recipe) =>
      recipe.ingredients.some((ingredient) => (
        Boolean(ingredient.recipeIngredientId && ingredient.exchangeGroupId)
      )),
    ),
  );

const selectPreferredDietMenu = (
  currentMenu: ClientDietMenu,
  incomingMenu: ClientDietMenu,
) => {
  const currentHasSwappableRecipeIngredients = hasSwappableRecipeIngredients(currentMenu);
  const incomingHasSwappableRecipeIngredients = hasSwappableRecipeIngredients(incomingMenu);

  if (currentHasSwappableRecipeIngredients && !incomingHasSwappableRecipeIngredients) {
    return currentMenu;
  }

  return incomingMenu;
};

const orderDietMenusForRotation = (
  menus: ClientDietMenu[],
  assignedMenuId: number | null,
) => {
  const orderedMenus = sortDietMenus(dedupeDietMenus(menus));
  if (assignedMenuId === null) {
    return orderedMenus;
  }

  const assignedMenu = orderedMenus.find((menu) => menu.menuId === assignedMenuId);
  if (!assignedMenu) {
    return orderedMenus;
  }

  return [
    assignedMenu,
    ...orderedMenus.filter((menu) => menu.menuId !== assignedMenuId),
  ];
};

export const dedupeDietMenus = (menus: ClientDietMenu[]) =>
  Array.from(
    menus.reduce((menuMap, menu) => {
      const currentMenu = menuMap.get(menu.menuId);
      if (!currentMenu) {
        menuMap.set(menu.menuId, menu);
        return menuMap;
      }

      menuMap.set(menu.menuId, selectPreferredDietMenu(currentMenu, menu));
      return menuMap;
    }, new Map<number, ClientDietMenu>()).values(),
  );

export const mergeDietMenuOptions = (
  currentMenus: ClientDietMenu[],
  incomingMenus: ClientDietMenu[],
  assignedMenuId: number | null,
) => orderDietMenusForRotation([...currentMenus, ...incomingMenus], assignedMenuId);

export const mergeDietMenuOptionsByDate = (
  days: ClientDietWeekDay[],
  menusByDate: Record<string, ClientDietMenu[]>,
) =>
  days.map((day) => {
    const incomingMenus = menusByDate[day.assignedDate];
    if (!incomingMenus || incomingMenus.length === 0) {
      return day;
    }

    const nextMenuOptions = mergeDietMenuOptions(
      day.menuOptions,
      incomingMenus,
      day.assignedMenuId,
    );
    const didChange =
      nextMenuOptions.length !== day.menuOptions.length ||
      nextMenuOptions.some((menu, index) => menu !== day.menuOptions[index]);

    return !didChange
      ? day
      : {
          ...day,
          menuOptions: nextMenuOptions,
        };
  });

export const resolvePrimaryDietMenu = (
  day: ClientDietWeekDay | null | undefined,
): ClientDietMenu | null => {
  const rotationOrder = getDietMenuRotationOrder(day);
  if (rotationOrder.length === 0 || !day) {
    return null;
  }

  const weekStartDate = getStartOfLocalWeekDateKey(day.assignedDate);
  const dayOffset = weekStartDate ? getCalendarDayDiff(weekStartDate, day.assignedDate) : 0;
  const normalizedOffset = Math.max(0, dayOffset) % rotationOrder.length;

  return rotationOrder[normalizedOffset] ?? rotationOrder[0] ?? null;
};

export const resolvePrimaryDietMenuId = (day: ClientDietWeekDay | null | undefined) =>
  resolvePrimaryDietMenu(day)?.menuId ?? null;

export const getDietMenuRotationOrder = (
  day: ClientDietWeekDay | null | undefined,
): ClientDietMenu[] => {
  if (!day || day.menuOptions.length === 0) {
    return [];
  }

  return orderDietMenusForRotation(day.menuOptions, day.assignedMenuId);
};

export const resolveVisibleDietMenu = (
  day: ClientDietWeekDay | null | undefined,
  previewMenuId: number | null,
) => {
  if (!day) {
    return null;
  }

  if (previewMenuId !== null) {
    const previewMenu = day.menuOptions.find((menu) => menu.menuId === previewMenuId);
    if (previewMenu) {
      return previewMenu;
    }
  }

  return resolvePrimaryDietMenu(day);
};
