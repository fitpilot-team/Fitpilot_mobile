import { PixelRatio } from 'react-native';

export const DESIGN_WIDTH = 375;
export const SMALL_SCREEN_WIDTH = 400;
export const VERY_SMALL_SCREEN_WIDTH = 375;

const MAX_FONT_SCALE = 1.15;

export function getScaledFontSize(size: number, width = DESIGN_WIDTH): number {
  const scale = Math.min(width / DESIGN_WIDTH, MAX_FONT_SCALE);
  const scaled = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(scaled));
}

export function isSmallScreen(width: number): boolean {
  return width < SMALL_SCREEN_WIDTH;
}

export function isVerySmallScreen(width: number): boolean {
  return width < VERY_SMALL_SCREEN_WIDTH;
}

export function getResponsiveMaxWidth(
  max: number,
  horizontalPadding: number,
  width: number,
): number {
  return Math.min(max, width - horizontalPadding * 2);
}
