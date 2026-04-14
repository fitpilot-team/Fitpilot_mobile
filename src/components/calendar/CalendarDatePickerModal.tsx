import React, { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import {
  formatLocalDate,
  parseLocalDate,
  toLocalDateKey,
} from '../../utils/date';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';

type CalendarDateInput = Date | string | null | undefined;

interface CalendarDatePickerModalProps {
  visible: boolean;
  title: string;
  subtitle?: string | null;
  selectedDate?: CalendarDateInput;
  minDate?: CalendarDateInput;
  maxDate?: CalendarDateInput;
  onClose: () => void;
  onSelect: (date: Date) => void;
}

type CalendarDay = {
  key: string;
  date: Date;
  label: string;
  inCurrentMonth: boolean;
  disabled: boolean;
};

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

const startOfMonth = (value: Date) => {
  const nextDate = new Date(value);
  nextDate.setDate(1);
  nextDate.setHours(12, 0, 0, 0);
  return nextDate;
};

const endOfMonth = (value: Date) => {
  const nextDate = new Date(value);
  nextDate.setMonth(nextDate.getMonth() + 1, 0);
  nextDate.setHours(12, 0, 0, 0);
  return nextDate;
};

const addMonths = (value: Date, months: number) => {
  const nextDate = new Date(value);
  nextDate.setMonth(nextDate.getMonth() + months, 1);
  nextDate.setHours(12, 0, 0, 0);
  return nextDate;
};

const compareDays = (left: Date, right: Date) => {
  const leftKey = toLocalDateKey(left);
  const rightKey = toLocalDateKey(right);

  if (!leftKey || !rightKey) {
    return 0;
  }

  return leftKey.localeCompare(rightKey);
};

const compareMonths = (left: Date, right: Date) => (
  left.getFullYear() - right.getFullYear() ||
  left.getMonth() - right.getMonth()
);

export const CalendarDatePickerModal: React.FC<CalendarDatePickerModalProps> = ({
  visible,
  title,
  subtitle,
  selectedDate,
  minDate,
  maxDate,
  onClose,
  onSelect,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const selectedDateKey = toLocalDateKey(selectedDate);
  const minDateKey = toLocalDateKey(minDate);
  const maxDateKey = toLocalDateKey(maxDate);
  const parsedSelectedDate = useMemo(
    () => (selectedDateKey ? parseLocalDate(selectedDateKey) : null),
    [selectedDateKey],
  );
  const parsedMinDate = useMemo(
    () => (minDateKey ? parseLocalDate(minDateKey) : null),
    [minDateKey],
  );
  const parsedMaxDate = useMemo(
    () => (maxDateKey ? parseLocalDate(maxDateKey) : null),
    [maxDateKey],
  );
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(parsedSelectedDate ?? new Date()),
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    const nextCalendarMonth = startOfMonth(parsedSelectedDate ?? new Date());
    setCalendarMonth((currentMonth) => (
      compareMonths(currentMonth, nextCalendarMonth) === 0
        ? currentMonth
        : nextCalendarMonth
    ));
  }, [parsedSelectedDate, visible]);

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const gridStart = new Date(monthStart);
    gridStart.setDate(monthStart.getDate() - monthStart.getDay());
    const gridEnd = new Date(monthEnd);
    gridEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));
    const totalDays = Math.round(
      (gridEnd.getTime() - gridStart.getTime()) / (24 * 60 * 60 * 1000),
    ) + 1;

    return Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      date.setHours(12, 0, 0, 0);

      const disabled = Boolean(
        (parsedMinDate && compareDays(date, parsedMinDate) < 0) ||
        (parsedMaxDate && compareDays(date, parsedMaxDate) > 0),
      );

      return {
        key: toLocalDateKey(date) ?? `${date.getTime()}`,
        date,
        label: `${date.getDate()}`,
        inCurrentMonth: date.getMonth() === monthStart.getMonth(),
        disabled,
      };
    });
  }, [calendarMonth, parsedMaxDate, parsedMinDate]);

  const canGoToPreviousMonth = !parsedMinDate ||
    compareMonths(calendarMonth, startOfMonth(parsedMinDate)) > 0;
  const canGoToNextMonth = !parsedMaxDate ||
    compareMonths(calendarMonth, startOfMonth(parsedMaxDate)) < 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-outline" size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.monthHeader}>
            <Pressable
              onPress={() => setCalendarMonth((currentDate) => addMonths(currentDate, -1))}
              disabled={!canGoToPreviousMonth}
              style={[
                styles.monthNav,
                !canGoToPreviousMonth ? styles.monthNavDisabled : null,
              ]}
            >
              <Ionicons name="chevron-back-outline" size={20} color={theme.colors.textSecondary} />
            </Pressable>

            <Text style={styles.monthTitle}>
              {formatLocalDate(calendarMonth, { month: 'long', year: 'numeric' })}
            </Text>

            <Pressable
              onPress={() => setCalendarMonth((currentDate) => addMonths(currentDate, 1))}
              disabled={!canGoToNextMonth}
              style={[
                styles.monthNav,
                !canGoToNextMonth ? styles.monthNavDisabled : null,
              ]}
            >
              <Ionicons name="chevron-forward-outline" size={20} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.weekdaysRow}>
            {WEEKDAY_LABELS.map((weekday) => (
              <Text key={weekday} style={styles.weekday}>
                {weekday}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {calendarDays.map((day) => {
              const isSelected = selectedDateKey === toLocalDateKey(day.date);

              return (
                <Pressable
                  key={day.key}
                  disabled={day.disabled}
                  onPress={() => onSelect(day.date)}
                  style={[
                    styles.day,
                    day.disabled ? styles.dayDisabled : null,
                  ]}
                >
                  <View
                    style={[
                      styles.dayInner,
                      !day.inCurrentMonth ? styles.dayOutsideMonth : null,
                      isSelected ? styles.daySelected : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !day.inCurrentMonth ? styles.dayTextOutsideMonth : null,
                        day.disabled ? styles.dayTextDisabled : null,
                        isSelected ? styles.dayTextSelected : null,
                      ]}
                    >
                      {day.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      backgroundColor: theme.colors.overlay,
      zIndex: 30,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      minHeight: 500,
      maxHeight: '82%',
      alignSelf: 'center',
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    headerCopy: {
      flex: 1,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
    },
    monthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    monthNav: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
    },
    monthNavDisabled: {
      opacity: 0.35,
    },
    monthTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textTransform: 'capitalize',
    },
    weekdaysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    weekday: {
      width: '14.2857%',
      textAlign: 'center',
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.iconMuted,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      flexGrow: 1,
      alignContent: 'space-between',
    },
    day: {
      width: '14.2857%',
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayDisabled: {
      opacity: 0.32,
    },
    dayInner: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayOutsideMonth: {
      backgroundColor: theme.colors.surfaceAlt,
    },
    daySelected: {
      backgroundColor: theme.colors.primary,
    },
    dayText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    dayTextOutsideMonth: {
      color: theme.colors.iconMuted,
    },
    dayTextDisabled: {
      color: theme.colors.iconMuted,
    },
    dayTextSelected: {
      color: theme.colors.surface,
    },
    footer: {
      marginTop: spacing.md,
      alignItems: 'flex-end',
    },
    doneButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primary,
    },
    doneButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: theme.colors.surface,
    },
  });

export default CalendarDatePickerModal;
