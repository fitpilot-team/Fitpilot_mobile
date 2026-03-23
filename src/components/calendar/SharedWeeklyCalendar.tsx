import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { brandColors, fontSize, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';

const SVG_ORIGINAL_WIDTH = 100;
const SVG_ORIGINAL_HEIGHT = 100;
const SVG_RECT_X = 28.97;
const SVG_RECT_Y = 15.48;
const SVG_RECT_WIDTH = 29.93;
const SVG_RECT_HEIGHT = 24.41;
const SVG_CIRCLE_CX = 64.81;
const SVG_CIRCLE_CY = 71.54;

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
  onPress?: () => void;
}

export const sharedWeeklyCalendarHeroLayoutPreset = Object.freeze({
  edgeInset: 8,
  rowOffsetX: -4,
  heroOffsetX: -6,
});

interface SharedWeeklyCalendarProps {
  days: SharedWeeklyCalendarDay[];
  heroSelectionMode?: SharedWeeklyCalendarHeroSelectionMode;
  contentWidth?: number;
  edgeInset?: number;
  rowOffsetX?: number;
  heroOffsetX?: number;
}

interface CalendarMetrics {
  dayColumnWidth: number;
  dayGap: number;
  shapeSize: number;
  circleRadius: number;
  textContainerLeft: number;
  textContainerTop: number;
  textContainerWidth: number;
  textContainerHeight: number;
  circleCenterX: number;
  circleCenterY: number;
  baseHorizontalPadding: number;
  horizontalPadding: number;
}

const DayShapeBackground: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const shapePath =
    'M79.35,64.86L55.23,14.24l-.82-1.73H19.1l30.13,63.22,1.46,2.58c2.51,5.42,8.01,9.18,14.38,9.18,8.75,0,15.84-7.07,15.84-15.8,0-1.88-.33-3.69-.94-5.37l-.61-1.45Z';

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${SVG_ORIGINAL_WIDTH} ${SVG_ORIGINAL_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      style={StyleSheet.absoluteFillObject}
    >
      <Defs>
        <LinearGradient id="shapeGradient" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={brandColors.navy} />
          <Stop offset="1" stopColor={brandColors.sky} />
        </LinearGradient>
      </Defs>
      <Path d={shapePath} fill="url(#shapeGradient)" />
    </Svg>
  );
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getShowSpecialShape = (
  day: SharedWeeklyCalendarDay,
  heroSelectionMode: SharedWeeklyCalendarHeroSelectionMode,
) => {
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
  if (day.variant === 'rest') {
    return [styles.dayLabel, styles.dayLabelRest];
  }

  return styles.dayLabel;
};

const getDateCircleStyle = (
  day: SharedWeeklyCalendarDay,
  styles: ReturnType<typeof createStyles>,
) => {
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
  edgeInset = 0,
  rowOffsetX = 0,
  heroOffsetX = 0,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const metrics = useMemo<CalendarMetrics>(() => {
    const usableWidth = Math.max(320, contentWidth - spacing.lg * 2);
    const isCompact = usableWidth < 390;
    const isTablet = usableWidth >= 720;
    const dayGap = isTablet ? 9 : isCompact ? 5 : 7;
    const minDayWidth = isCompact ? 41 : 42;
    const maxDayWidth = isTablet ? 74 : isCompact ? 44 : 56;
    const dayColumnWidth = Math.max(minDayWidth, Math.min(maxDayWidth, (usableWidth - dayGap * 6) / 7));
    const shapeSize = Math.max(dayColumnWidth + 54, Math.min(isTablet ? 144 : 136, dayColumnWidth + 92));
    const circleRadius = Math.max(16, Math.min(20, shapeSize * 0.125));
    const scale = shapeSize / SVG_ORIGINAL_WIDTH;
    const baseHorizontalPadding = Math.max(0, (shapeSize - dayColumnWidth) / 2);

    return {
      dayColumnWidth,
      dayGap,
      shapeSize,
      circleRadius,
      textContainerLeft: SVG_RECT_X * scale,
      textContainerTop: SVG_RECT_Y * scale,
      textContainerWidth: SVG_RECT_WIDTH * scale,
      textContainerHeight: SVG_RECT_HEIGHT * scale,
      circleCenterX: SVG_CIRCLE_CX * scale,
      circleCenterY: SVG_CIRCLE_CY * scale,
      baseHorizontalPadding,
      horizontalPadding: baseHorizontalPadding + edgeInset,
    };
  }, [contentWidth, edgeInset]);

  const heroLeft = useMemo(() => {
    const minLeft = -(metrics.baseHorizontalPadding + edgeInset);
    const maxLeft = -(metrics.baseHorizontalPadding - edgeInset);
    return clamp(-metrics.baseHorizontalPadding + heroOffsetX, minLeft, maxLeft);
  }, [edgeInset, heroOffsetX, metrics.baseHorizontalPadding]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: metrics.horizontalPadding,
        },
      ]}
    >
      <View
        style={[
          styles.daysRow,
          {
            gap: metrics.dayGap,
            transform: [{ translateX: rowOffsetX }],
          },
        ]}
      >
        {days.map((day) => {
          const showSpecialShape = getShowSpecialShape(day, heroSelectionMode);
          const statusText = day.statusText || ' ';

          return (
            <TouchableOpacity
              key={day.id}
              style={[
                styles.dayColumn,
                { width: metrics.dayColumnWidth, height: metrics.shapeSize },
              ]}
              onPress={day.onPress}
              disabled={day.isDisabled}
              activeOpacity={0.85}
            >
              {showSpecialShape ? (
                <View
                  style={[
                    styles.shapeContainer,
                    {
                      left: heroLeft,
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
