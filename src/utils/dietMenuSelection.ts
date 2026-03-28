import type { ClientDietMenu, ClientDietWeekDay } from '../types';
import { getCalendarDayDiff, getStartOfLocalWeekDateKey } from './date';

const sortDietMenus = (menus: ClientDietMenu[]) =>
  [...menus].sort((left, right) => left.menuId - right.menuId);

export const dedupeDietMenus = (menus: ClientDietMenu[]) =>
  Array.from(new Map(menus.map((menu) => [menu.menuId, menu])).values());

export const mergeDietMenuOptions = (
  currentMenus: ClientDietMenu[],
  incomingMenus: ClientDietMenu[],
  assignedMenuId: number | null,
) => {
  const mergedMenus = dedupeDietMenus([...currentMenus, ...incomingMenus]);

  return mergedMenus.sort((left, right) => {
    if (assignedMenuId !== null) {
      if (left.menuId === assignedMenuId) {
        return -1;
      }

      if (right.menuId === assignedMenuId) {
        return 1;
      }
    }

    return left.menuId - right.menuId;
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
  if (!day || day.menuOptions.length === 0) {
    return null;
  }

  if (day.assignedMenuId !== null) {
    const assignedMenu = day.menuOptions.find((menu) => menu.menuId === day.assignedMenuId);
    if (assignedMenu) {
      return assignedMenu;
    }
  }

  const orderedMenus = sortDietMenus(day.menuOptions);
  const weekStartDate = getStartOfLocalWeekDateKey(day.assignedDate);
  const dayOffset = weekStartDate ? getCalendarDayDiff(weekStartDate, day.assignedDate) : 0;
  const normalizedOffset = Math.max(0, dayOffset) % orderedMenus.length;

  return orderedMenus[normalizedOffset] ?? orderedMenus[0] ?? null;
};

export const resolvePrimaryDietMenuId = (day: ClientDietWeekDay | null | undefined) =>
  resolvePrimaryDietMenu(day)?.menuId ?? null;

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
