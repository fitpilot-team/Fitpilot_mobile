import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { brandColors, colors, fontSize, spacing } from '../../constants/colors';

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

interface SharedWeeklyCalendarProps {
  days: SharedWeeklyCalendarDay[];
  heroSelectionMode?: SharedWeeklyCalendarHeroSelectionMode;
  contentWidth?: number;
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

const getShowSpecialShape = (
  day: SharedWeeklyCalendarDay,
  heroSelectionMode: SharedWeeklyCalendarHeroSelectionMode,
) => {
  if (heroSelectionMode === 'selected-only') {
    return day.isSelected;
  }

  return day.isSelected || day.isToday;
};

const getStatusTextStyle = (day: SharedWeeklyCalendarDay) => {
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

const getDayLabelStyle = (day: SharedWeeklyCalendarDay) => {
  if (day.variant === 'rest') {
    return [styles.dayLabel, styles.dayLabelRest];
  }

  return styles.dayLabel;
};

const getDateCircleStyle = (day: SharedWeeklyCalendarDay) => {
  switch (day.variant) {
    case 'rest':
      return [styles.dateCircle, styles.dateCircleRest];
    case 'missed':
      return [styles.dateCircle, styles.dateCircleMissed];
    case 'complete':
      return [styles.dateCircle, styles.dateCircleComplete];
    case 'diet':
      return day.isToday ? [styles.dateCircle, styles.dateCircleDietToday] : styles.dateCircle;
    default:
      return styles.dateCircle;
  }
};

const getDateNumberStyle = (day: SharedWeeklyCalendarDay) => {
  switch (day.variant) {
    case 'rest':
      return [styles.dateNumber, styles.dateNumberRest];
    case 'missed':
      return [styles.dateNumber, styles.dateNumberMissed];
    case 'complete':
      return [styles.dateNumber, styles.dateNumberComplete];
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
    const horizontalPadding = Math.max(0, (shapeSize - dayColumnWidth) / 2);

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
      horizontalPadding,
    };
  }, [contentWidth]);

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: metrics.horizontalPadding,
        },
      ]}
    >
      <View style={[styles.daysRow, { gap: metrics.dayGap }]}>
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
                      left: (metrics.dayColumnWidth - metrics.shapeSize) / 2,
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
                  <Text style={getStatusTextStyle(day)}>{statusText}</Text>
                  <Text style={getDayLabelStyle(day)}>{day.dayLabel}</Text>
                  <View
                    style={[
                      styles.dateCircleContainer,
                      { top: metrics.circleCenterY - metrics.circleRadius },
                    ]}
                  >
                    <View
                      style={[
                        getDateCircleStyle(day),
                        {
                          width: metrics.circleRadius * 2,
                          height: metrics.circleRadius * 2,
                          borderRadius: metrics.circleRadius,
                        },
                      ]}
                    >
                      <Text style={getDateNumberStyle(day)}>{day.dateNumber}</Text>
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

const styles = StyleSheet.create({
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
    zIndex: 1,
  },
  dayContentRest: {
    opacity: 0.9,
  },
  textContainerHighlighted: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  circleContainerHighlighted: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  status: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  statusHighlighted: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '600',
  },
  statusComplete: {
    fontSize: fontSize.xs,
    color: colors.primary[500],
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  statusPartial: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  statusRest: {
    fontSize: fontSize.sm,
    color: '#10B981',
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  statusMissed: {
    fontSize: fontSize.xs,
    color: '#F59E0B',
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  statusDietToday: {
    fontSize: fontSize.xs,
    color: brandColors.sky,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  dayLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  dayLabelHighlighted: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '600',
  },
  dayLabelRest: {
    color: '#10B981',
  },
  dateCircleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dateCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dateCircleHighlighted: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  dateCircleRest: {
    backgroundColor: '#D1FAE5',
  },
  dateCircleMissed: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  dateCircleComplete: {
    backgroundColor: '#DCFCE7',
  },
  dateCircleDietToday: {
    backgroundColor: `${brandColors.sky}18`,
    borderWidth: 1,
    borderColor: `${brandColors.sky}60`,
  },
  dateNumber: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.gray[700],
  },
  dateNumberHighlighted: {
    fontSize: fontSize.base,
    color: colors.primary[600],
    fontWeight: '700',
  },
  dateNumberRest: {
    color: '#059669',
  },
  dateNumberMissed: {
    color: '#D97706',
  },
  dateNumberComplete: {
    color: '#16A34A',
  },
  dateNumberDietToday: {
    color: brandColors.navy,
    fontWeight: '700',
  },
});

export default SharedWeeklyCalendar;
