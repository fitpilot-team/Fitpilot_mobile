import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import DateFormShape from '../../../assets/date-form1.svg';
import { brandColors, fontSize, spacing } from '../../constants/colors';
import { useThemedStyles, type AppTheme } from '../../theme';

const HERO_GEOMETRY = Object.freeze({
  canvasWidth: 100,
  topBox: Object.freeze({
    x: 26.63,
    y: 15.48,
    width: 31.3,
    height: 24.41,
  }),
  circleAnchor: Object.freeze({
    x: 57.53,
    y: 71.54,
  }),
  footprint: Object.freeze({
    minX: 26.63,
    maxX: 73.37,
  }),
});
const HERO_CIRCLE_RADIUS_RATIO = 0.125;
const HERO_GRADIENT_COLORS = [brandColors.navy, brandColors.sky] as const;

export type SharedWeeklyCalendarVariant =
  | 'default'
  | 'partial'
  | 'complete'
  | 'rest'
  | 'missed'
  | 'diet';

export type SharedWeeklyCalendarHeroSelectionMode = 'selected-or-today' | 'selected-only';

export interface SharedWeeklyCalendarDay {
  id: string;
  dateKey: string;
  dayLabel: string;
  dateNumber: string | number;
  isSelected: boolean;
  isToday: boolean;
  isDisabled?: boolean;
  statusText: string;
  variant: SharedWeeklyCalendarVariant;
  showHero?: boolean;
  onPress?: () => void;
}

interface SharedWeeklyCalendarProps {
  days: SharedWeeklyCalendarDay[];
  heroSelectionMode?: SharedWeeklyCalendarHeroSelectionMode;
  contentWidth?: number;
}

interface CalendarMetrics {
  dayGap: number;
  shapeSize: number;
  circleRadius: number;
  defaultSlotWidth: number;
  baseSlotWidth: number;
  selectedSlotWidth: number;
  textContainerLeft: number;
  textContainerTop: number;
  textContainerWidth: number;
  textContainerHeight: number;
  circleCenterX: number;
  circleCenterY: number;
  footprintMinXScaled: number;
  footprintMaxXScaled: number;
  heroEdgeGutter: number;
}

const DayShapeBackground: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  return (
    <MaskedView
      style={{ width, height }}
      maskElement={
        <View
          style={[
            staticStyles.heroMask,
            {
              width,
              height,
            },
          ]}
        >
          <DateFormShape width={width} height={height} color="#ffffff" />
        </View>
      }
    >
      <LinearGradient
        colors={HERO_GRADIENT_COLORS}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ width, height }}
      />
    </MaskedView>
  );
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getShowSpecialShape = (
  day: SharedWeeklyCalendarDay,
  heroSelectionMode: SharedWeeklyCalendarHeroSelectionMode,
) => {
  if (day.showHero === false) {
    return false;
  }

  if (heroSelectionMode === 'selected-only') {
    return day.isSelected;
  }

  return day.isSelected || day.isToday;
};

const getStatusTextStyle = (
  day: SharedWeeklyCalendarDay,
  styles: ReturnType<typeof createStyles>,
) => {
  switch (day.variant) {
    case 'rest':
      return styles.statusRest;
    case 'missed':
      return styles.statusMissed;
    case 'complete':
      return styles.statusComplete;
    case 'partial':
      return styles.statusPartial;
    case 'diet':
      return day.isToday ? styles.statusDietToday : styles.status;
    default:
      return styles.status;
  }
};

const getDayLabelStyle = (
  day: SharedWeeklyCalendarDay,
  styles: ReturnType<typeof createStyles>,
) => {
  if (day.isSelected && day.showHero === false) {
    return [styles.dayLabel, styles.dayLabelSelected];
  }

  if (day.variant === 'rest') {
    return [styles.dayLabel, styles.dayLabelRest];
  }

  return styles.dayLabel;
};

const getDateCircleStyle = (
  day: SharedWeeklyCalendarDay,
  styles: ReturnType<typeof createStyles>,
) => {
  if (day.isSelected && day.showHero === false) {
    return [styles.dateCircle, styles.dateCircleSelectedGhost];
  }

  switch (day.variant) {
    case 'rest':
      return [styles.dateCircle, styles.dateCircleRest];
    case 'missed':
      return [styles.dateCircle, styles.dateCircleMissed];
    case 'complete':
      return [styles.dateCircle, styles.dateCircleComplete];
    case 'partial':
      return [styles.dateCircle, styles.dateCirclePartial];
    case 'diet':
      return day.isToday ? [styles.dateCircle, styles.dateCircleDietToday] : styles.dateCircle;
    default:
      return styles.dateCircle;
  }
};

const getDateNumberStyle = (
  day: SharedWeeklyCalendarDay,
  styles: ReturnType<typeof createStyles>,
) => {
  if (day.isSelected && day.showHero === false) {
    return [styles.dateNumber, styles.dateNumberSelectedGhost];
  }

  switch (day.variant) {
    case 'rest':
      return [styles.dateNumber, styles.dateNumberRest];
    case 'missed':
      return [styles.dateNumber, styles.dateNumberMissed];
    case 'complete':
      return [styles.dateNumber, styles.dateNumberComplete];
    case 'partial':
      return [styles.dateNumber, styles.dateNumberPartial];
    case 'diet':
      return day.isToday ? [styles.dateNumber, styles.dateNumberDietToday] : styles.dateNumber;
    default:
      return styles.dateNumber;
  }
};

export const SharedWeeklyCalendar: React.FC<SharedWeeklyCalendarProps> = ({
  days,
  heroSelectionMode = 'selected-or-today',
  contentWidth = 390,
}) => {
  const styles = useThemedStyles(createStyles);
  const heroDayIndex = useMemo(
    () => days.findIndex((day) => getShowSpecialShape(day, heroSelectionMode)),
    [days, heroSelectionMode],
  );
  const hasHero = heroDayIndex !== -1;

  const metrics = useMemo<CalendarMetrics>(() => {
    const usableWidth = Math.max(320, contentWidth - spacing.lg * 2);
    const isCompact = usableWidth < 390;
    const isTablet = usableWidth >= 720;
    const dayGap = isTablet ? 9 : isCompact ? 5 : 7;
    const minBaseSlotWidth = isTablet ? 52 : isCompact ? 34 : 36;
    const maxBaseSlotWidth = isTablet ? 74 : isCompact ? 44 : 56;
    const defaultSlotWidth = clamp(
      (usableWidth - dayGap * 6) / 7,
      minBaseSlotWidth,
      maxBaseSlotWidth,
    );
    const idealShapeSize = Math.max(
      defaultSlotWidth + 54,
      Math.min(isTablet ? 144 : 136, defaultSlotWidth + 92),
    );
    const heroSafePadding = isTablet ? 16 : isCompact ? 8 : 10;
    const heroFootprintWidthRatio =
      (HERO_GEOMETRY.footprint.maxX - HERO_GEOMETRY.footprint.minX) / HERO_GEOMETRY.canvasWidth;
    const maxSelectedSlotWidth = Math.max(
      defaultSlotWidth,
      usableWidth - dayGap * 6 - minBaseSlotWidth * 6,
    );
    const maxShapeSizeForLayout =
      (maxSelectedSlotWidth - heroSafePadding) / heroFootprintWidthRatio;
    const shapeSize = hasHero
      ? Math.min(idealShapeSize, maxShapeSizeForLayout)
      : idealShapeSize;
    const selectedSlotWidth = hasHero
      ? heroFootprintWidthRatio * shapeSize + heroSafePadding
      : defaultSlotWidth;
    const baseSlotWidth = hasHero
      ? (usableWidth - dayGap * 6 - selectedSlotWidth) / 6
      : defaultSlotWidth;
    const circleRadius = Math.max(16, Math.min(20, shapeSize * HERO_CIRCLE_RADIUS_RATIO));
    const scale = shapeSize / HERO_GEOMETRY.canvasWidth;
    const circleCenterX = HERO_GEOMETRY.circleAnchor.x * scale;
    const footprintMinXScaled = HERO_GEOMETRY.footprint.minX * scale;
    const footprintMaxXScaled = HERO_GEOMETRY.footprint.maxX * scale;

    return {
      dayGap,
      shapeSize,
      circleRadius,
      defaultSlotWidth,
      baseSlotWidth,
      selectedSlotWidth,
      textContainerLeft: HERO_GEOMETRY.topBox.x * scale,
      textContainerTop: HERO_GEOMETRY.topBox.y * scale,
      textContainerWidth: HERO_GEOMETRY.topBox.width * scale,
      textContainerHeight: HERO_GEOMETRY.topBox.height * scale,
      circleCenterX,
      circleCenterY: HERO_GEOMETRY.circleAnchor.y * scale,
      footprintMinXScaled,
      footprintMaxXScaled,
      heroEdgeGutter: isTablet ? 8 : isCompact ? 2 : 4,
    };
  }, [contentWidth, hasHero]);

  const slotLayouts = useMemo(() => {
    let startX = 0;

    return days.map((_, index) => {
      const showSpecialShape = index === heroDayIndex;
      const width = showSpecialShape
        ? metrics.selectedSlotWidth
        : hasHero
          ? metrics.baseSlotWidth
          : metrics.defaultSlotWidth;
      const layout = {
        width,
        startX,
        showSpecialShape,
      };

      startX += width + metrics.dayGap;
      return layout;
    });
  }, [
    days,
    hasHero,
    heroDayIndex,
    metrics.baseSlotWidth,
    metrics.dayGap,
    metrics.defaultSlotWidth,
    metrics.selectedSlotWidth,
  ]);

  const rowWidth = useMemo(() => {
    const lastSlot = slotLayouts[slotLayouts.length - 1];
    if (!lastSlot) {
      return 0;
    }

    return lastSlot.startX + lastSlot.width;
  }, [slotLayouts]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.daysRow,
          {
            gap: metrics.dayGap,
          },
        ]}
      >
        {days.map((day, index) => {
          const slotLayout = slotLayouts[index];
          const showSpecialShape = slotLayout?.showSpecialShape ?? false;
          const statusText = day.statusText || ' ';
          const slotWidth = slotLayout?.width ?? metrics.defaultSlotWidth;
          const preferredHeroLeft = slotWidth / 2 - metrics.circleCenterX;
          const minHeroLeft = slotLayout
            ? metrics.heroEdgeGutter - slotLayout.startX - metrics.footprintMinXScaled
            : preferredHeroLeft;
          const maxHeroLeft = slotLayout
            ? rowWidth -
              slotLayout.startX -
              metrics.footprintMaxXScaled -
              metrics.heroEdgeGutter
            : preferredHeroLeft;
          const clampedHeroLeft = clamp(preferredHeroLeft, minHeroLeft, maxHeroLeft);

          return (
            <TouchableOpacity
              key={day.id}
              style={[
                styles.dayColumn,
                { width: slotWidth, height: metrics.shapeSize },
              ]}
              onPress={day.onPress}
              disabled={day.isDisabled}
              activeOpacity={0.85}
            >
              {showSpecialShape ? (
                <View
                  pointerEvents="none"
                  style={[styles.heroSlot, { width: slotWidth, height: metrics.shapeSize }]}
                >
                  <View
                    style={[
                      styles.shapeContainer,
                      {
                        left: clampedHeroLeft,
                        width: metrics.shapeSize,
                        height: metrics.shapeSize,
                      },
                    ]}
                  >
                    <DayShapeBackground width={metrics.shapeSize} height={metrics.shapeSize} />

                    <View
                      style={[
                        styles.textContainerHighlighted,
                        {
                          left: metrics.textContainerLeft,
                          top: metrics.textContainerTop,
                          width: metrics.textContainerWidth,
                          height: metrics.textContainerHeight,
                        },
                      ]}
                    >
                      <Text style={styles.statusHighlighted}>{statusText}</Text>
                      <Text style={styles.dayLabelHighlighted}>{day.dayLabel}</Text>
                    </View>

                    <View
                      style={[
                        styles.circleContainerHighlighted,
                        {
                          left: metrics.circleCenterX - metrics.circleRadius,
                          top: metrics.circleCenterY - metrics.circleRadius,
                          width: metrics.circleRadius * 2,
                          height: metrics.circleRadius * 2,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.dateCircleHighlighted,
                          {
                            width: metrics.circleRadius * 2,
                            height: metrics.circleRadius * 2,
                            borderRadius: metrics.circleRadius,
                          },
                        ]}
                      >
                        <Text style={styles.dateNumberHighlighted}>{day.dateNumber}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    styles.dayContent,
                    day.variant === 'rest' && styles.dayContentRest,
                    { paddingTop: metrics.textContainerTop },
                  ]}
                >
                  <Text style={getStatusTextStyle(day, styles)}>{statusText}</Text>
                  <Text style={getDayLabelStyle(day, styles)}>{day.dayLabel}</Text>
                  <View
                    style={[
                      styles.dateCircleContainer,
                      { top: metrics.circleCenterY - metrics.circleRadius },
                    ]}
                  >
                    <View
                      style={[
                        getDateCircleStyle(day, styles),
                        {
                          width: metrics.circleRadius * 2,
                          height: metrics.circleRadius * 2,
                          borderRadius: metrics.circleRadius,
                        },
                      ]}
                    >
                      <Text style={getDateNumberStyle(day, styles)}>{day.dateNumber}</Text>
                    </View>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      paddingVertical: 12,
      overflow: 'visible',
    },
    daysRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'visible',
    },
    dayColumn: {
      alignItems: 'center',
      position: 'relative',
      overflow: 'visible',
    },
    heroSlot: {
      position: 'relative',
      overflow: 'visible',
    },
    shapeContainer: {
      position: 'absolute',
      top: 0,
      overflow: 'visible',
    },
    dayContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    dayContentRest: {
      opacity: theme.isDark ? 0.96 : 1,
    },
    textContainerHighlighted: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusHighlighted: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.surface,
      lineHeight: 16,
    },
    dayLabelHighlighted: {
      marginTop: 2,
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: theme.colors.surface,
      lineHeight: 16,
    },
    circleContainerHighlighted: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateCircleHighlighted: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },
    dateNumberHighlighted: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.primary,
      lineHeight: 22,
    },
    status: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      lineHeight: 16,
    },
    statusRest: {
      color: theme.colors.success,
    },
    statusMissed: {
      color: theme.colors.warning,
    },
    statusComplete: {
      color: theme.colors.primary,
    },
    statusPartial: {
      color: theme.colors.primary,
    },
    statusDietToday: {
      color: theme.colors.primary,
    },
    dayLabel: {
      marginTop: 2,
      fontSize: fontSize.xs,
      fontWeight: '500',
      color: theme.colors.textMuted,
      lineHeight: 16,
    },
    dayLabelSelected: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    dayLabelRest: {
      color: theme.colors.success,
    },
    dateCircleContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateCircle: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dateCircleSelectedGhost: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
    },
    dateCircleRest: {
      backgroundColor: theme.isDark ? 'rgba(52, 211, 153, 0.18)' : 'rgba(16, 185, 129, 0.14)',
      borderColor: theme.isDark ? 'rgba(52, 211, 153, 0.32)' : 'rgba(16, 185, 129, 0.22)',
    },
    dateCircleMissed: {
      backgroundColor: theme.isDark ? 'rgba(248, 113, 113, 0.16)' : 'rgba(239, 68, 68, 0.08)',
      borderColor: theme.isDark ? 'rgba(248, 113, 113, 0.3)' : 'rgba(239, 68, 68, 0.16)',
    },
    dateCircleComplete: {
      backgroundColor: theme.isDark ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.12)',
      borderColor: theme.isDark ? 'rgba(52, 211, 153, 0.34)' : 'rgba(16, 185, 129, 0.2)',
    },
    dateCirclePartial: {
      backgroundColor: theme.isDark ? 'rgba(96, 165, 250, 0.18)' : 'rgba(59, 130, 246, 0.1)',
      borderColor: theme.isDark ? 'rgba(96, 165, 250, 0.32)' : 'rgba(59, 130, 246, 0.18)',
    },
    dateCircleDietToday: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
    },
    dateNumber: {
      fontSize: fontSize.base,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      lineHeight: 22,
    },
    dateNumberSelectedGhost: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    dateNumberRest: {
      color: theme.colors.success,
    },
    dateNumberMissed: {
      color: theme.colors.error,
    },
    dateNumberComplete: {
      color: theme.colors.success,
    },
    dateNumberPartial: {
      color: theme.colors.primary,
    },
    dateNumberDietToday: {
      color: theme.colors.primary,
    },
  });

export default SharedWeeklyCalendar;

const staticStyles = StyleSheet.create({
  heroMask: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
