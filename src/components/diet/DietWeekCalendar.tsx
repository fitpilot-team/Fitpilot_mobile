import React, { useMemo } from 'react';
import type { ClientDietWeekDay } from '../../types';
import {
  SharedWeeklyCalendar,
  type SharedWeeklyCalendarDay,
  sharedWeeklyCalendarHeroLayoutPreset,
} from '../calendar/SharedWeeklyCalendar';
import { formatLocalShortWeekday, getLocalDayNumber } from '../../utils/date';

interface DietWeekCalendarProps {
  days: ClientDietWeekDay[];
  selectedDate: string;
  onSelect: (date: string) => void;
  contentWidth?: number;
}

export const DietWeekCalendar: React.FC<DietWeekCalendarProps> = ({
  days,
  selectedDate,
  onSelect,
  contentWidth = 390,
}) => {
  const calendarDays = useMemo<SharedWeeklyCalendarDay[]>(
    () =>
      days.map((day) => ({
        id: day.id,
        dateKey: day.assignedDate,
        dayLabel: formatLocalShortWeekday(day.assignedDate),
        dateNumber: getLocalDayNumber(day.assignedDate),
        isSelected: day.assignedDate === selectedDate,
        isToday: day.isToday,
        isDisabled: false,
        statusText: day.isToday ? 'Hoy' : '',
        variant: 'diet',
        onPress: () => onSelect(day.assignedDate),
      })),
    [days, onSelect, selectedDate],
  );

  if (calendarDays.length === 0) {
    return null;
  }

  return (
    <SharedWeeklyCalendar
      days={calendarDays}
      heroSelectionMode="selected-only"
      contentWidth={contentWidth}
      edgeInset={sharedWeeklyCalendarHeroLayoutPreset.edgeInset}
      rowOffsetX={sharedWeeklyCalendarHeroLayoutPreset.rowOffsetX}
      heroOffsetX={sharedWeeklyCalendarHeroLayoutPreset.heroOffsetX}
    />
  );
};

export default DietWeekCalendar;
