import type { ClientDietMenu, ClientDietWeekDay } from '../types';
import { getCalendarDayDiff, getStartOfLocalWeekDateKey } from './date';

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

const getDietMenuOriginId = (menu: ClientDietMenu) =>
  menu.sourceTemplateId ?? menu.menuId;

const hasDietMenuOrigin = (
  menus: ClientDietMenu[],
  targetMenu: ClientDietMenu,
) => {
  const targetOriginId = getDietMenuOriginId(targetMenu);
  return menus.some((menu) => getDietMenuOriginId(menu) === targetOriginId);
};

export const dedupeDietMenus = (menus: ClientDietMenu[]) =>
  Array.from(
    menus.reduce((menuMap, menu) => {
      const menuOriginId = getDietMenuOriginId(menu);
      const currentMenu = menuMap.get(menuOriginId);
      if (!currentMenu) {
        menuMap.set(menuOriginId, menu);
        return menuMap;
      }

      menuMap.set(menuOriginId, selectPreferredDietMenu(currentMenu, menu));
      return menuMap;
    }, new Map<number, ClientDietMenu>()).values(),
  );

export const mergeDietMenuOptions = (
  currentMenus: ClientDietMenu[],
  incomingMenus: ClientDietMenu[],
) => dedupeDietMenus([...currentMenus, ...incomingMenus]);

export const applyDietRotationMenuOptions = (
  days: ClientDietWeekDay[],
  rotationMenus: ClientDietMenu[],
) => {
  const nextRotationMenus = dedupeDietMenus(rotationMenus);

  return days.map((day) => {
    const dayMenuOptions = dedupeDietMenus(day.menuOptions);
    const currentRotationMenus = dedupeDietMenus(day.rotationMenuOptions);
    const hasAssignedMenuOptions =
      day.backendPrimaryMenuId !== null ||
      dayMenuOptions.some((menu) => !hasDietMenuOrigin(currentRotationMenus, menu));
    const nextDayRotationMenus = hasAssignedMenuOptions ? [] : nextRotationMenus;
    const nextMenuOptions = hasAssignedMenuOptions
      ? dayMenuOptions
      : nextRotationMenus;
    const didChange =
      nextMenuOptions.length !== day.menuOptions.length ||
      nextMenuOptions.some((menu, index) => menu !== day.menuOptions[index]) ||
      nextDayRotationMenus.length !== day.rotationMenuOptions.length ||
      nextDayRotationMenus.some((menu, index) => menu !== day.rotationMenuOptions[index]);

    return !didChange
      ? day
      : {
          ...day,
          rotationMenuOptions: nextDayRotationMenus,
          menuOptions: nextMenuOptions,
        };
  });
};

export const mergeDietMenuOptionsByDate = (
  days: ClientDietWeekDay[],
  menusByDate: Record<string, ClientDietMenu[]>,
) =>
  days.map((day) => {
    const incomingMenus = menusByDate[day.assignedDate];
    if (!incomingMenus || incomingMenus.length === 0) {
      return day;
    }

    const nextMenuOptions = mergeDietMenuOptions(day.menuOptions, incomingMenus);
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

export const getDietSelectableMenus = (
  day: ClientDietWeekDay | null | undefined,
): ClientDietMenu[] => {
  if (!day || day.menuOptions.length === 0) {
    return [];
  }

  return dedupeDietMenus(day.menuOptions);
};

export const getDietMenuRotationOrder = (
  day: ClientDietWeekDay | null | undefined,
): ClientDietMenu[] => {
  if (!day) {
    return [];
  }

  const rotationMenus = dedupeDietMenus(day.rotationMenuOptions);
  return rotationMenus.length > 0 ? rotationMenus : getDietSelectableMenus(day);
};

export const resolveRotatedDietMenu = (
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

export const resolveRotatedDietMenuId = (day: ClientDietWeekDay | null | undefined) =>
  resolveRotatedDietMenu(day)?.menuId ?? null;

export const resolveDietSelectableMenuById = (
  day: ClientDietWeekDay | null | undefined,
  menuId: number | null,
) => {
  if (!day || menuId === null) {
    return null;
  }

  return getDietSelectableMenus(day).find((menu) => menu.menuId === menuId) ?? null;
};

export const resolveVisibleDietMenu = (
  day: ClientDietWeekDay | null | undefined,
  previewMenuId: number | null = null,
) => {
  if (!day) {
    return null;
  }

  const previewMenu = resolveDietSelectableMenuById(day, previewMenuId);
  if (previewMenu) {
    return previewMenu;
  }

  const rotatedMenu = resolveRotatedDietMenu(day);
  const persistedMenu = resolveDietSelectableMenuById(day, day.backendPrimaryMenuId);

  if (persistedMenu && (!rotatedMenu || persistedMenu.menuId !== rotatedMenu.menuId)) {
    return persistedMenu;
  }

  return rotatedMenu ?? persistedMenu ?? getDietSelectableMenus(day)[0] ?? null;
};
