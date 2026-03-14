export const TABLET_MIN_DIMENSION = 600;
export const DASHBOARD_MAX_WIDTH = 980;

export function isTabletLayout(width: number, height: number): boolean {
  return Math.min(width, height) >= TABLET_MIN_DIMENSION;
}

export function getDashboardContentWidth(width: number): number {
  return Math.min(width, DASHBOARD_MAX_WIDTH);
}
