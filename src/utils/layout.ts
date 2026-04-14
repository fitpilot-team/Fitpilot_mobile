import { spacing } from '../constants/colors';

export const TABLET_MIN_DIMENSION = 600;
export const DASHBOARD_MAX_WIDTH = 980;

export function isTabletLayout(width: number, height: number): boolean {
  return Math.min(width, height) >= TABLET_MIN_DIMENSION;
}

export function isPortraitLayout(width: number, height: number): boolean {
  return height >= width;
}

export function isTabletPortraitLayout(width: number, height: number): boolean {
  return isTabletLayout(width, height) && isPortraitLayout(width, height);
}

export function getDashboardContentWidth(width: number): number {
  return Math.min(width, DASHBOARD_MAX_WIDTH);
}

export function getAvailableContentWidth(
  measuredWidth: number | null | undefined,
  fallbackWidth: number,
): number {
  const resolvedWidth =
    measuredWidth && measuredWidth > 0 ? measuredWidth : fallbackWidth;

  return getDashboardContentWidth(resolvedWidth);
}

export function getPrimaryScreenHorizontalPadding(width: number, height: number): number {
  return isTabletLayout(width, height) ? spacing.lg : spacing.md;
}
