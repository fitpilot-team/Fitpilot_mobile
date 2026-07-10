import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { borderRadius, colors, fontSize, spacing } from '../../constants/colors';
import {
  formatLocalDate,
  parseLocalDate,
  toLocalDateKey,
} from '../../utils/date';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import { BirthdateWheelPicker } from './BirthdateWheelPicker';

type CalendarDateInput = Date | string | null | undefined;

export type CalendarPickerFlow = 'default' | 'birthdate';

export interface CalendarDatePickerPanelProps {
  selectedDate?: CalendarDateInput;
  initialVisibleDate?: CalendarDateInput;
  minDate?: CalendarDateInput;
  maxDate?: CalendarDateInput;
  disabledDateKeys?: string[];
  isActive?: boolean;
  requireConfirmation?: boolean;
  onPendingDateChange?: (date: Date | null) => void;
  onSelect: (date: Date) => void;
}

interface CalendarDatePickerModalProps extends Omit<CalendarDatePickerPanelProps, 'isActive' | 'onPendingDateChange'> {
  visible: boolean;
  title: string;
  subtitle?: string | null;
  pickerFlow?: CalendarPickerFlow;
  onClose: () => void;
}

type CalendarDay = {
  key: string;
  date: Date;
  label: string;
  inCurrentMonth: boolean;
  disabled: boolean;
};

type CalendarSelectorMode = 'month' | 'year' | null;

const WEEKDAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const YEAR_GRID_COLUMNS = 4;
const YEAR_ROW_HEIGHT = 40;
const DEFAULT_YEAR_RANGE = 120;
const DEFAULT_BIRTH_YEAR_OFFSET = 30;

const getDefaultBirthdate = (
  parsedSelectedDate: Date | null,
  parsedInitialVisibleDate: Date | null,
  parsedMaxDate: Date | null,
) => {
  if (parsedSelectedDate) {
    return parsedSelectedDate;
  }

  if (parsedInitialVisibleDate) {
    return parsedInitialVisibleDate;
  }

  const anchorYear = parsedMaxDate?.getFullYear() ?? new Date().getFullYear();
  return new Date(anchorYear - DEFAULT_BIRTH_YEAR_OFFSET, 0, 1, 12, 0, 0, 0);
};

const useParsedDate = (dateKey: string | null) =>
  useMemo(() => (dateKey ? parseLocalDate(dateKey) : null), [dateKey]);

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, monthIndex) => ({
  label: formatLocalDate(new Date(2020, monthIndex, 1, 12, 0, 0, 0), {
    month: 'short',
  }).replace('.', ''),
  value: monthIndex,
}));

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

export const CalendarDatePickerPanel: React.FC<CalendarDatePickerPanelProps> = ({
  selectedDate,
  initialVisibleDate,
  minDate,
  maxDate,
  disabledDateKeys,
  isActive = true,
  requireConfirmation = false,
  onPendingDateChange,
  onSelect,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const selectedDateKey = toLocalDateKey(selectedDate);
  const initialVisibleDateKey = toLocalDateKey(initialVisibleDate);
  const minDateKey = toLocalDateKey(minDate);
  const maxDateKey = toLocalDateKey(maxDate);
  const parsedSelectedDate = useParsedDate(selectedDateKey);
  const parsedInitialVisibleDate = useParsedDate(initialVisibleDateKey);
  const parsedMinDate = useParsedDate(minDateKey);
  const parsedMaxDate = useParsedDate(maxDateKey);
  const disabledDateKeySet = useMemo(
    () => new Set(disabledDateKeys ?? []),
    [disabledDateKeys],
  );
  const onPendingDateChangeRef = useRef(onPendingDateChange);
  onPendingDateChangeRef.current = onPendingDateChange;
  const yearScrollRef = React.useRef<ScrollView>(null);
  const [calendarMonth, setCalendarMonth] = useState(() =>
    startOfMonth(parsedSelectedDate ?? parsedInitialVisibleDate ?? new Date()),
  );
  const [selectorMode, setSelectorMode] = useState<CalendarSelectorMode>(null);
  const [pendingDateKey, setPendingDateKey] = useState<string | null>(selectedDateKey);

  const clampMonthToBounds = (value: Date) => {
    const nextMonth = startOfMonth(value);

    if (parsedMinDate && compareMonths(nextMonth, startOfMonth(parsedMinDate)) < 0) {
      return startOfMonth(parsedMinDate);
    }

    if (parsedMaxDate && compareMonths(nextMonth, startOfMonth(parsedMaxDate)) > 0) {
      return startOfMonth(parsedMaxDate);
    }

    return nextMonth;
  };

  useEffect(() => {
    if (!isActive) {
      setSelectorMode(null);
      return;
    }

    const nextSelectedDate = selectedDateKey
      ? parseLocalDate(selectedDateKey)
      : null;
    const nextInitialVisibleDate = parseLocalDate(initialVisibleDateKey) ?? null;
    const nextMonth = startOfMonth(nextSelectedDate ?? nextInitialVisibleDate ?? new Date());

    setCalendarMonth((currentMonth) => (
      compareMonths(currentMonth, nextMonth) === 0
        ? currentMonth
        : nextMonth
    ));
    setPendingDateKey(selectedDateKey);
  }, [initialVisibleDateKey, isActive, selectedDateKey]);

  useEffect(() => {
    if (!isActive || !requireConfirmation) {
      return;
    }

    const nextPendingDate = pendingDateKey ? parseLocalDate(pendingDateKey) : null;
    onPendingDateChangeRef.current?.(nextPendingDate);
  }, [isActive, pendingDateKey, requireConfirmation]);

  const yearOptions = useMemo(() => {
    const currentYear = calendarMonth.getFullYear();
    const minYear = parsedMinDate?.getFullYear();
    const maxYear = parsedMaxDate?.getFullYear();
    const startYear = minYear ?? (
      maxYear !== undefined ? maxYear - DEFAULT_YEAR_RANGE : currentYear - 10
    );
    const endYear = maxYear ?? (
      minYear !== undefined ? minYear + DEFAULT_YEAR_RANGE : currentYear + 10
    );

    return Array.from(
      { length: Math.max(0, endYear - startYear + 1) },
      (_, index) => endYear - index,
    );
  }, [calendarMonth, parsedMaxDate, parsedMinDate]);

  useEffect(() => {
    if (selectorMode !== 'year') {
      return undefined;
    }

    const selectedYearIndex = yearOptions.indexOf(calendarMonth.getFullYear());
    if (selectedYearIndex < 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      const rowIndex = Math.floor(selectedYearIndex / YEAR_GRID_COLUMNS);
      yearScrollRef.current?.scrollTo({
        y: Math.max(0, (rowIndex - 2) * YEAR_ROW_HEIGHT),
        animated: false,
      });
    }, 80);

    return () => clearTimeout(timer);
  }, [calendarMonth, selectorMode, yearOptions]);

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
      const dateKey = toLocalDateKey(date) ?? `${date.getTime()}`;

      const disabled = Boolean(
        (parsedMinDate && compareDays(date, parsedMinDate) < 0) ||
        (parsedMaxDate && compareDays(date, parsedMaxDate) > 0) ||
        disabledDateKeySet.has(dateKey),
      );

      return {
        key: dateKey,
        date,
        label: `${date.getDate()}`,
        inCurrentMonth: date.getMonth() === monthStart.getMonth(),
        disabled,
      };
    });
  }, [calendarMonth, disabledDateKeySet, parsedMaxDate, parsedMinDate]);

  const canGoToPreviousMonth = !parsedMinDate ||
    compareMonths(calendarMonth, startOfMonth(parsedMinDate)) > 0;
  const canGoToNextMonth = !parsedMaxDate ||
    compareMonths(calendarMonth, startOfMonth(parsedMaxDate)) < 0;
  const currentMonthLabel = formatLocalDate(calendarMonth, { month: 'long' });
  const currentYearLabel = `${calendarMonth.getFullYear()}`;

  const toggleSelectorMode = (nextMode: Exclude<CalendarSelectorMode, null>) => {
    setSelectorMode((currentMode) => currentMode === nextMode ? null : nextMode);
  };

  const isMonthDisabled = (monthIndex: number) => {
    const candidateMonth = startOfMonth(
      new Date(calendarMonth.getFullYear(), monthIndex, 1, 12, 0, 0, 0),
    );

    return Boolean(
      (parsedMinDate && compareMonths(candidateMonth, startOfMonth(parsedMinDate)) < 0) ||
      (parsedMaxDate && compareMonths(candidateMonth, startOfMonth(parsedMaxDate)) > 0),
    );
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCalendarMonth(clampMonthToBounds(
      new Date(calendarMonth.getFullYear(), monthIndex, 1, 12, 0, 0, 0),
    ));
    setSelectorMode(null);
  };

  const handleYearSelect = (year: number) => {
    setCalendarMonth(clampMonthToBounds(
      new Date(year, calendarMonth.getMonth(), 1, 12, 0, 0, 0),
    ));
    setSelectorMode('month');
  };

  const handleDayPress = (date: Date) => {
    const dateKey = toLocalDateKey(date);
    if (!dateKey) {
      return;
    }

    if (requireConfirmation) {
      setPendingDateKey(dateKey);
      return;
    }

    onSelect(date);
  };

  const activeDateKey = requireConfirmation ? pendingDateKey : selectedDateKey;

  return (
    <>
      <View style={styles.monthHeader}>
        <Pressable
          onPress={() => {
            setSelectorMode(null);
            setCalendarMonth((currentDate) => addMonths(currentDate, -1));
          }}
          disabled={!canGoToPreviousMonth}
          style={[
            styles.monthNav,
            !canGoToPreviousMonth ? styles.monthNavDisabled : null,
          ]}
        >
          <Ionicons name="chevron-back-outline" size={20} color={theme.colors.textSecondary} />
        </Pressable>

        <View style={styles.monthSelectorGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Seleccionar mes"
            onPress={() => toggleSelectorMode('month')}
            style={[
              styles.monthSelectorButton,
              selectorMode === 'month' ? styles.monthSelectorButtonActive : null,
            ]}
          >
            <Text
              style={[
                styles.monthSelectorText,
                selectorMode === 'month' ? styles.monthSelectorTextActive : null,
              ]}
            >
              {currentMonthLabel}
            </Text>
            <Ionicons
              name={selectorMode === 'month' ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={16}
              color={selectorMode === 'month' ? colors.white : theme.colors.textSecondary}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Seleccionar año"
            onPress={() => toggleSelectorMode('year')}
            style={[
              styles.yearSelectorButton,
              selectorMode === 'year' ? styles.monthSelectorButtonActive : null,
            ]}
          >
            <Text
              style={[
                styles.yearSelectorText,
                selectorMode === 'year' ? styles.monthSelectorTextActive : null,
              ]}
            >
              {currentYearLabel}
            </Text>
            <Ionicons
              name={selectorMode === 'year' ? 'chevron-up-outline' : 'chevron-down-outline'}
              size={16}
              color={selectorMode === 'year' ? colors.white : theme.colors.textSecondary}
            />
          </Pressable>
        </View>

        <Pressable
          onPress={() => {
            setSelectorMode(null);
            setCalendarMonth((currentDate) => addMonths(currentDate, 1));
          }}
          disabled={!canGoToNextMonth}
          style={[
            styles.monthNav,
            !canGoToNextMonth ? styles.monthNavDisabled : null,
          ]}
        >
          <Ionicons name="chevron-forward-outline" size={20} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      {selectorMode ? (
        <View style={styles.selectorPanel}>
          {selectorMode === 'month' ? (
            <View style={styles.monthGrid}>
              {MONTH_OPTIONS.map((month) => {
                const isSelected = month.value === calendarMonth.getMonth();
                const disabled = isMonthDisabled(month.value);

                return (
                  <Pressable
                    key={month.value}
                    disabled={disabled}
                    onPress={() => handleMonthSelect(month.value)}
                    style={[
                      styles.monthOption,
                      isSelected ? styles.selectorOptionActive : null,
                      disabled ? styles.selectorOptionDisabled : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthOptionText,
                        isSelected ? styles.selectorOptionTextActive : null,
                        disabled ? styles.selectorOptionTextDisabled : null,
                      ]}
                    >
                      {month.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <ScrollView
              ref={yearScrollRef}
              style={styles.yearScroll}
              contentContainerStyle={styles.yearGrid}
              showsVerticalScrollIndicator
            >
              {yearOptions.map((year) => {
                const isSelected = year === calendarMonth.getFullYear();

                return (
                  <Pressable
                    key={year}
                    onPress={() => handleYearSelect(year)}
                    style={[
                      styles.yearOption,
                      isSelected ? styles.selectorOptionActive : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.yearOptionText,
                        isSelected ? styles.selectorOptionTextActive : null,
                      ]}
                    >
                      {year}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      ) : (
        <>
          <View style={styles.weekdaysRow}>
            {WEEKDAY_LABELS.map((weekday) => (
              <Text key={weekday} style={styles.weekday}>
                {weekday}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {calendarDays.map((day) => {
              const isSelected = activeDateKey === toLocalDateKey(day.date);

              return (
                <Pressable
                  key={day.key}
                  disabled={day.disabled}
                  onPress={() => handleDayPress(day.date)}
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
        </>
      )}
    </>
  );
};

interface BirthdateWizardPanelProps {
  selectedDate?: CalendarDateInput;
  initialVisibleDate?: CalendarDateInput;
  minDate?: CalendarDateInput;
  maxDate?: CalendarDateInput;
  isActive?: boolean;
  onPendingDateChange: (date: Date | null) => void;
}

const BirthdateWizardPanel: React.FC<BirthdateWizardPanelProps> = ({
  selectedDate,
  initialVisibleDate,
  minDate,
  maxDate,
  isActive = true,
  onPendingDateChange,
}) => {
  const { theme } = useAppTheme();
  const selectedDateKey = toLocalDateKey(selectedDate);
  const initialVisibleDateKey = toLocalDateKey(initialVisibleDate);
  const minDateKey = toLocalDateKey(minDate);
  const maxDateKey = toLocalDateKey(maxDate);
  const parsedSelectedDate = useParsedDate(selectedDateKey);
  const parsedInitialVisibleDate = useParsedDate(initialVisibleDateKey);
  const parsedMinDate = useParsedDate(minDateKey);
  const parsedMaxDate = useParsedDate(maxDateKey);
  const onPendingDateChangeRef = useRef(onPendingDateChange);
  onPendingDateChangeRef.current = onPendingDateChange;

  const defaultBirthdate = useMemo(
    () => getDefaultBirthdate(parsedSelectedDate, parsedInitialVisibleDate, parsedMaxDate),
    [parsedInitialVisibleDate, parsedMaxDate, parsedSelectedDate],
  );

  const [draftYear, setDraftYear] = useState(defaultBirthdate.getFullYear());
  const [draftMonth, setDraftMonth] = useState(defaultBirthdate.getMonth());
  const [draftDay, setDraftDay] = useState(defaultBirthdate.getDate());

  const resetDraft = useCallback(() => {
    const nextDate = getDefaultBirthdate(
      selectedDateKey ? parseLocalDate(selectedDateKey) : null,
      parsedInitialVisibleDate,
      parsedMaxDate,
    );

    setDraftYear(nextDate.getFullYear());
    setDraftMonth(nextDate.getMonth());
    setDraftDay(nextDate.getDate());
  }, [parsedInitialVisibleDate, parsedMaxDate, selectedDateKey]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    resetDraft();
  }, [isActive, initialVisibleDateKey, resetDraft, selectedDateKey]);

  const lastPendingDateKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (lastPendingDateKeyRef.current !== null) {
        lastPendingDateKeyRef.current = null;
        onPendingDateChangeRef.current(null);
      }
      return;
    }

    const pendingDate = new Date(draftYear, draftMonth, draftDay, 12, 0, 0, 0);
    const pendingDateKey = toLocalDateKey(pendingDate);
    const isDisabled = Boolean(
      !pendingDateKey ||
      (parsedMinDate && compareDays(pendingDate, parsedMinDate) < 0) ||
      (parsedMaxDate && compareDays(pendingDate, parsedMaxDate) > 0),
    );
    const nextPendingDateKey = isDisabled ? null : pendingDateKey;

    if (lastPendingDateKeyRef.current === nextPendingDateKey) {
      return;
    }

    lastPendingDateKeyRef.current = nextPendingDateKey;
    onPendingDateChangeRef.current(
      nextPendingDateKey ? parseLocalDate(nextPendingDateKey) : null,
    );
  }, [
    draftDay,
    draftMonth,
    draftYear,
    isActive,
    maxDateKey,
    minDateKey,
    parsedMaxDate,
    parsedMinDate,
  ]);

  return (
    <BirthdateWheelPicker
      year={draftYear}
      month={draftMonth}
      day={draftDay}
      minDateKey={minDateKey}
      maxDateKey={maxDateKey}
      onChange={({ year, month, day }) => {
        setDraftYear(year);
        setDraftMonth(month);
        setDraftDay(day);
      }}
      theme={theme}
    />
  );
};

export const CalendarDatePickerModal: React.FC<CalendarDatePickerModalProps> = ({
  visible,
  title,
  subtitle,
  pickerFlow = 'default',
  requireConfirmation = false,
  onClose,
  onSelect,
  ...panelProps
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);
  const usesBirthdateFlow = pickerFlow === 'birthdate';
  const needsConfirmation = usesBirthdateFlow || requireConfirmation;

  const handlePendingDateChange = useCallback((date: Date | null) => {
    setPendingDate((current) => {
      const nextKey = date ? toLocalDateKey(date) : null;
      const currentKey = current ? toLocalDateKey(current) : null;

      if (nextKey === currentKey) {
        return current;
      }

      return date;
    });
  }, []);

  useEffect(() => {
    if (!visible) {
      setPendingDate(null);
    }
  }, [visible]);

  const handleConfirm = () => {
    if (!pendingDate) {
      return;
    }

    onSelect(pendingDate);
  };

  const resolvedSubtitle = subtitle ?? (
    usesBirthdateFlow
      ? 'Desliza día, mes y año para elegir tu fecha de nacimiento.'
      : requireConfirmation
        ? 'Selecciona un día y confirma para guardar la fecha.'
        : null
  );

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
              {resolvedSubtitle ? <Text style={styles.subtitle}>{resolvedSubtitle}</Text> : null}
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-outline" size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {usesBirthdateFlow ? (
            <BirthdateWizardPanel
              {...panelProps}
              isActive={visible}
              onPendingDateChange={handlePendingDateChange}
            />
          ) : (
            <CalendarDatePickerPanel
              {...panelProps}
              isActive={visible}
              requireConfirmation={requireConfirmation}
              onPendingDateChange={handlePendingDateChange}
              onSelect={onSelect}
            />
          )}

          <View style={styles.footer}>
            {needsConfirmation ? (
              <>
                <Pressable onPress={onClose} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirm}
                  disabled={!pendingDate}
                  style={[
                    styles.doneButton,
                    !pendingDate ? styles.doneButtonDisabled : null,
                  ]}
                >
                  <Text style={styles.doneButtonText}>Confirmar fecha</Text>
                </Pressable>
              </>
            ) : (
              <Pressable onPress={onClose} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Cerrar</Text>
              </Pressable>
            )}
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
    monthSelectorGroup: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    monthSelectorButton: {
      flex: 1,
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    yearSelectorButton: {
      minWidth: 86,
      minHeight: 38,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    monthSelectorButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    monthSelectorText: {
      flexShrink: 1,
      fontSize: fontSize.sm,
      lineHeight: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textTransform: 'capitalize',
    },
    yearSelectorText: {
      fontSize: fontSize.sm,
      lineHeight: 18,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    monthSelectorTextActive: {
      color: colors.white,
    },
    selectorPanel: {
      minHeight: 294,
      justifyContent: 'center',
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.inputBackground,
      padding: spacing.sm,
    },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    monthOption: {
      width: '30.9%',
      minHeight: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    monthOptionText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      textTransform: 'capitalize',
    },
    yearScroll: {
      maxHeight: 240,
    },
    yearGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      width: '100%',
    },
    yearOption: {
      width: '22.5%',
      height: YEAR_ROW_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    decadeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    decadeChip: {
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    decadeChipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    decadeChipText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    decadeChipTextActive: {
      color: colors.white,
    },
    decadeSection: {
      marginBottom: spacing.sm,
    },
    decadeTitle: {
      marginBottom: spacing.sm,
      fontSize: fontSize.xs,
      fontWeight: '600',
      textAlign: 'center',
    },
    yearOptionText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    selectorOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    selectorOptionDisabled: {
      opacity: 0.35,
    },
    selectorOptionTextActive: {
      color: colors.white,
    },
    selectorOptionTextDisabled: {
      color: theme.colors.iconMuted,
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
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    dayOutsideMonth: {
      backgroundColor: theme.colors.surfaceAlt,
    },
    daySelected: {
      backgroundColor: theme.colors.primary,
      borderRadius: borderRadius.full,
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
      color: colors.white,
    },
    footer: {
      marginTop: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
    cancelButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    cancelButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    doneButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primary,
    },
    doneButtonDisabled: {
      opacity: 0.45,
    },
    doneButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.white,
    },
    birthdateWizard: {
      gap: spacing.md,
    },
    wizardStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    wizardStepConnector: {
      width: 18,
      height: 2,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.border,
    },
    wizardStepConnectorCompleted: {
      backgroundColor: theme.colors.primary,
    },
    wizardStepPill: {
      minWidth: 72,
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    wizardStepPillActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    wizardStepPillCompleted: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
    },
    wizardStepNumber: {
      width: 22,
      height: 22,
      borderRadius: 11,
      overflow: 'hidden',
      textAlign: 'center',
      lineHeight: 22,
      fontSize: fontSize.xs,
      fontWeight: '800',
      color: theme.colors.textMuted,
      backgroundColor: theme.colors.surface,
    },
    wizardStepNumberActive: {
      color: colors.white,
      backgroundColor: 'rgba(255, 255, 255, 0.24)',
    },
    wizardStepLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textMuted,
    },
    wizardStepLabelActive: {
      color: colors.white,
    },
    wizardHint: {
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    wizardBackButton: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    wizardBackButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    wizardMonthContext: {
      marginBottom: spacing.sm,
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textAlign: 'center',
      textTransform: 'capitalize',
    },
    birthdateDayGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    birthdateDay: {
      width: '14.2857%',
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wizardPreview: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      gap: spacing.xs,
    },
    wizardPreviewLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    wizardPreviewValue: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textTransform: 'capitalize',
    },
  });

export default CalendarDatePickerModal;
