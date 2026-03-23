import React, { useEffect, useMemo, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { ClientDietWeekDay } from '../../types';
import {
  addDaysToDateKey,
  formatLocalShortWeekday,
  getLocalDayNumber,
  getStartOfLocalWeekDateKey,
  getTodayDateKey,
} from '../../utils/date';
import { borderRadius, colors, dietTheme, fontSize, spacing } from '../../constants/colors';

interface DietWeekCalendarProps {
  days: ClientDietWeekDay[];
  selectedDate: string;
  onSelect: (date: string) => void;
  onWeekChange: (date: string) => void;
  contentWidth?: number;
}

type WeekPage = {
  id: string;
  days: {
    id: string;
    dateKey: string;
    dayLabel: string;
    dateNumber: string;
    isSelected: boolean;
    onPress: () => void;
  }[];
};

const buildWeekDateKeys = (weekStart: string) => (
  Array.from({ length: 7 }, (_, index) => addDaysToDateKey(weekStart, index) ?? weekStart)
);

export const DietWeekCalendar: React.FC<DietWeekCalendarProps> = ({
  days,
  selectedDate,
  onSelect,
  onWeekChange,
  contentWidth = 390,
}) => {
  const scrollRef = useRef<ScrollView | null>(null);
  const isResettingRef = useRef(false);
  const todayDateKey = getTodayDateKey();
  const pageWidth = Math.max(320, contentWidth);
  const currentWeekStart = useMemo(
    () => days[0]?.assignedDate || getStartOfLocalWeekDateKey(selectedDate) || todayDateKey,
    [days, selectedDate, todayDateKey],
  );

  const weekPages = useMemo<WeekPage[]>(() => {
    const previousWeekStart = addDaysToDateKey(currentWeekStart, -7) ?? currentWeekStart;
    const nextWeekStart = addDaysToDateKey(currentWeekStart, 7) ?? currentWeekStart;
    const weekStarts = [previousWeekStart, currentWeekStart, nextWeekStart];

    return weekStarts.map((weekStart, pageIndex) => ({
      id: `${weekStart}-${pageIndex}`,
      days: buildWeekDateKeys(weekStart).map((dateKey) => {
        const isCurrentPage = pageIndex === 1;

        return {
          id: `${pageIndex}-${dateKey}`,
          dateKey,
          dayLabel: formatLocalShortWeekday(dateKey),
          dateNumber: getLocalDayNumber(dateKey),
          isSelected: isCurrentPage && dateKey === selectedDate,
          onPress: () => (isCurrentPage ? onSelect(dateKey) : onWeekChange(dateKey)),
        };
      }),
    }));
  }, [currentWeekStart, onSelect, onWeekChange, selectedDate]);

  const layoutMetrics = useMemo(() => {
    const horizontalPadding = pageWidth < 360 ? spacing.md : spacing.lg;
    const maxRowWidth = 560;
    const rowWidth = Math.min(pageWidth - horizontalPadding * 2, maxRowWidth);
    const isCompact = rowWidth < 330;
    const isTablet = rowWidth >= 500;
    const dayGap = isTablet ? 12 : isCompact ? 4 : 8;
    const daySlotWidth = (rowWidth - dayGap * 6) / 7;
    const daySlotHeight = isTablet ? 92 : isCompact ? 78 : 84;
    const navButtonSize = isTablet ? 34 : isCompact ? 24 : 28;
    const sideGutter = Math.max(0, (pageWidth - rowWidth) / 2);
    const navInset = Math.max(0, (sideGutter - navButtonSize) / 2);
    const activeCapsuleWidth = Math.min(
      Math.max(daySlotWidth - 2, 35),
      isTablet ? 58 : 52,
    );

    return {
      dayGap,
      daySlotHeight,
      daySlotWidth,
      activeCapsuleWidth,
      navButtonSize,
      navInset,
      rowWidth,
    };
  }, [pageWidth]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) {
      return;
    }

    isResettingRef.current = true;
    scroller.scrollTo({ x: pageWidth, animated: false });

    const resetTimeout = setTimeout(() => {
      isResettingRef.current = false;
    }, 60);

    return () => {
      clearTimeout(resetTimeout);
    };
  }, [currentWeekStart, pageWidth]);

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isResettingRef.current) {
      return;
    }

    const nextPageIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    if (nextPageIndex === 1) {
      return;
    }

    const nextSelectedDate = addDaysToDateKey(selectedDate, nextPageIndex > 1 ? 7 : -7);
    if (!nextSelectedDate) {
      return;
    }

    onWeekChange(nextSelectedDate);
  };

  const handleArrowPress = (direction: -1 | 1) => {
    const nextSelectedDate = addDaysToDateKey(selectedDate, direction * 7);
    if (!nextSelectedDate) {
      return;
    }

    onWeekChange(nextSelectedDate);
  };

  if (weekPages.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { width: pageWidth }]}>
      <View style={styles.viewportWrapper}>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.navButtonLeft,
            {
              width: layoutMetrics.navButtonSize,
              height: layoutMetrics.navButtonSize,
              borderRadius: layoutMetrics.navButtonSize / 2,
              marginTop: -(layoutMetrics.navButtonSize / 2),
              left: layoutMetrics.navInset,
            },
          ]}
          onPress={() => handleArrowPress(-1)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Semana anterior"
        >
          <Ionicons
            name="chevron-back"
            size={layoutMetrics.navButtonSize - 8}
            color={dietTheme.label}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.navButtonRight,
            {
              width: layoutMetrics.navButtonSize,
              height: layoutMetrics.navButtonSize,
              borderRadius: layoutMetrics.navButtonSize / 2,
              marginTop: -(layoutMetrics.navButtonSize / 2),
              right: layoutMetrics.navInset,
            },
          ]}
          onPress={() => handleArrowPress(1)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Semana siguiente"
        >
          <Ionicons
            name="chevron-forward"
            size={layoutMetrics.navButtonSize - 8}
            color={dietTheme.label}
          />
        </TouchableOpacity>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          onMomentumScrollEnd={handleMomentumScrollEnd}
          contentOffset={{ x: pageWidth, y: 0 }}
        >
          {weekPages.map((page) => (
            <View key={page.id} style={{ width: pageWidth }}>
              <View style={styles.pageContent}>
                <View
                  style={[
                    styles.daysRow,
                    {
                      width: layoutMetrics.rowWidth,
                      gap: layoutMetrics.dayGap,
                    },
                  ]}
                >
                  {page.days.map((day) => (
                    <View
                      key={day.id}
                      style={[
                        styles.daySlot,
                        {
                          width: layoutMetrics.daySlotWidth,
                          height: layoutMetrics.daySlotHeight,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.dayButton}
                        onPress={day.onPress}
                        activeOpacity={0.82}
                        accessibilityRole="button"
                        accessibilityState={{ selected: day.isSelected }}
                        accessibilityLabel={`${day.dayLabel} ${day.dateNumber}`}
                      >
                        {day.isSelected ? (
                          <View
                            style={[
                              styles.activeDay,
                              {
                                width: layoutMetrics.activeCapsuleWidth,
                                height: layoutMetrics.daySlotHeight,
                              },
                            ]}
                          >
                            <Text style={[styles.dayLabel, styles.activeDayLabel]}>{day.dayLabel}</Text>
                            <Text style={[styles.dayNumber, styles.activeDayNumber]}>{day.dateNumber}</Text>
                            <View style={styles.activeDayDot} />
                          </View>
                        ) : (
                          <View style={styles.inactiveDay}>
                            <Text style={[styles.dayLabel, styles.inactiveDayLabel]}>{day.dayLabel}</Text>
                            <Text style={[styles.dayNumber, styles.inactiveDayNumber]}>{day.dateNumber}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  viewportWrapper: {
    position: 'relative',
  },
  pageContent: {
    width: '100%',
    alignItems: 'center',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: dietTheme.activeDayBorder,
    backgroundColor: colors.white,
  },
  navButtonLeft: {
    left: 0,
  },
  navButtonRight: {
    right: 0,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  daySlot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDay: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: dietTheme.activeDayBorder,
    backgroundColor: dietTheme.activeDayBackground,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  inactiveDay: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeDayLabel: {
    color: dietTheme.label,
  },
  inactiveDayLabel: {
    color: colors.gray[500],
  },
  dayNumber: {
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  activeDayNumber: {
    color: dietTheme.label,
  },
  inactiveDayNumber: {
    color: colors.gray[900],
  },
  activeDayDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: dietTheme.label,
  },
});

export default DietWeekCalendar;
