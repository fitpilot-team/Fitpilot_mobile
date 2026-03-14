import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, brandColors, spacing, fontSize } from '../../constants/colors';
import type { WeeklyProgress, DayProgress } from '../../types';

const SVG_ORIGINAL_WIDTH = 100;
const SVG_ORIGINAL_HEIGHT = 100;
const SVG_RECT_X = 28.97;
const SVG_RECT_Y = 15.48;
const SVG_RECT_WIDTH = 29.93;
const SVG_RECT_HEIGHT = 24.41;
const SVG_CIRCLE_CX = 64.81;
const SVG_CIRCLE_CY = 71.54;

interface WeekCalendarProps {
  weeklyProgress: WeeklyProgress | null;
  selectedDate?: string;
  onDayPress?: (day: DayProgress) => void;
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
  const shapePath = 'M79.35,64.86L55.23,14.24l-.82-1.73H19.1l30.13,63.22,1.46,2.58c2.51,5.42,8.01,9.18,14.38,9.18,8.75,0,15.84-7.07,15.84-15.8,0-1.88-.33-3.69-.94-5.37l-.61-1.45Z';

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

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  weeklyProgress,
  selectedDate,
  onDayPress,
  contentWidth = 390,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const days: DayProgress[] = weeklyProgress?.days ?? [];

  const metrics = useMemo<CalendarMetrics>(() => {
    const usableWidth = Math.max(320, contentWidth - spacing.lg * 2);
    const isCompact = usableWidth < 390;
    const isTablet = usableWidth >= 720;
    const dayGap = isTablet ? 8 : isCompact ? 4 : 6;
    const maxDayWidth = isTablet ? 74 : isCompact ? 44 : 56;
    const dayColumnWidth = Math.max(42, Math.min(maxDayWidth, (usableWidth - dayGap * 6) / 7));
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

  if (days.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <Ionicons name="barbell-outline" size={22} color={brandColors.navy} />
        </View>
        <View style={styles.emptyCopy}>
          <Text style={styles.emptyTitle}>Sin entrenamientos programados</Text>
          <Text style={styles.emptyDescription}>
            Cuando training publique tu semana, el calendario aparecerá aquí.
          </Text>
        </View>
      </View>
    );
  }

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
          const isToday = day.date === today;
          const isSelected = day.date === selectedDate;
          const hasCompletion = day.completion_percentage > 0;
          const isComplete = day.completion_percentage >= 100;
          const showSpecialShape = isToday || isSelected;
          const isPastDay = day.date < today;
          const isMissed = isPastDay && day.has_workout && !day.is_rest_day && day.completion_percentage < 100;

          const getStatusContent = () => {
            if (day.is_rest_day) return 'Desc';
            if (!day.has_workout) return '-';
            if (isMissed && day.completion_percentage === 0) return '!';
            return `${Math.round(day.completion_percentage)}%`;
          };

          const getStatusStyle = () => {
            if (day.is_rest_day) return styles.percentageRest;
            if (isMissed) return styles.percentageMissed;
            if (isComplete) return styles.percentageComplete;
            if (hasCompletion) return styles.percentagePartial;
            return styles.percentage;
          };

          return (
            <TouchableOpacity
              key={day.date}
              style={[
                styles.dayColumn,
                { width: metrics.dayColumnWidth, height: metrics.shapeSize },
              ]}
              onPress={() => onDayPress?.(day)}
              disabled={!day.has_workout && !day.is_rest_day}
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
                    <Text style={styles.percentageHighlighted}>
                      {getStatusContent()}
                    </Text>
                    <Text style={styles.dayNameHighlighted}>
                      {day.day_name}
                    </Text>
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
                      <Text style={styles.dateNumberHighlighted}>
                        {new Date(day.date).getDate()}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    styles.dayContent,
                    day.is_rest_day && styles.dayContentRest,
                    { paddingTop: metrics.textContainerTop },
                  ]}
                >
                  <Text style={getStatusStyle()}>
                    {getStatusContent()}
                  </Text>
                  <Text style={[styles.dayName, day.is_rest_day && styles.dayNameRest]}>
                    {day.day_name}
                  </Text>
                  <View
                    style={[
                      styles.dateCircleContainer,
                      { top: metrics.circleCenterY - metrics.circleRadius },
                    ]}
                  >
                    <View
                      style={[
                        styles.dateCircle,
                        {
                          width: metrics.circleRadius * 2,
                          height: metrics.circleRadius * 2,
                          borderRadius: metrics.circleRadius,
                        },
                        day.is_rest_day && styles.dateCircleRest,
                        isMissed && styles.dateCircleMissed,
                        isComplete && styles.dateCircleComplete,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dateNumber,
                          day.is_rest_day && styles.dateNumberRest,
                          isMissed && styles.dateNumberMissed,
                          isComplete && styles.dateNumberComplete,
                        ]}
                      >
                        {new Date(day.date).getDate()}
                      </Text>
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
    paddingVertical: spacing.md,
    overflow: 'visible',
  },
  emptyState: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    padding: spacing.lg,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[100],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${brandColors.sky}24`,
  },
  emptyCopy: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.gray[800],
  },
  emptyDescription: {
    marginTop: 2,
    fontSize: fontSize.sm,
    color: colors.gray[500],
    lineHeight: 20,
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
  percentage: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  percentageHighlighted: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '600',
  },
  percentageComplete: {
    color: colors.primary[500],
    fontWeight: '600',
  },
  percentagePartial: {
    color: colors.gray[600],
  },
  dayName: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  dayNameHighlighted: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: '600',
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
  dayContentRest: {
    opacity: 0.9,
  },
  percentageRest: {
    fontSize: fontSize.sm,
    color: '#10B981',
    marginBottom: spacing.xs,
  },
  dayNameRest: {
    color: '#10B981',
  },
  dateCircleRest: {
    backgroundColor: '#D1FAE5',
  },
  dateNumberRest: {
    color: '#059669',
  },
  percentageMissed: {
    fontSize: fontSize.xs,
    color: '#F59E0B',
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  dateCircleMissed: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  dateNumberMissed: {
    color: '#D97706',
  },
  dateCircleComplete: {
    backgroundColor: '#DCFCE7',
  },
  dateNumberComplete: {
    color: '#16A34A',
  },
});

export default WeekCalendar;
