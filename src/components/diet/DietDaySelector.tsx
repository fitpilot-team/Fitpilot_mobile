import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { borderRadius, brandColors, colors, fontSize, spacing } from '../../constants/colors';
import type { ClientDietDay } from '../../types';

interface DietDaySelectorProps {
  days: ClientDietDay[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

const formatWeekday = (value: string) => {
  const formatted = new Intl.DateTimeFormat('es-MX', {
    weekday: 'short',
  }).format(new Date(`${value}T12:00:00`));

  return formatted.replace('.', '').slice(0, 3).toUpperCase();
};

const formatDayNumber = (value: string) =>
  new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
  }).format(new Date(`${value}T12:00:00`));

export const DietDaySelector: React.FC<DietDaySelectorProps> = ({
  days,
  selectedDate,
  onSelect,
}) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.contentContainer}
  >
    {days.map((day) => {
      const isSelected = day.assignedDate === selectedDate;

      return (
        <Pressable
          key={day.id}
          style={[styles.dayChip, isSelected && styles.dayChipSelected]}
          onPress={() => onSelect(day.assignedDate)}
        >
          <Text style={[styles.weekday, isSelected && styles.weekdaySelected]}>
            {formatWeekday(day.assignedDate)}
          </Text>
          <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
            {formatDayNumber(day.assignedDate)}
          </Text>
          <View style={[styles.dot, day.isToday && styles.dotToday, isSelected && styles.dotSelected]} />
        </Pressable>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dayChip: {
    width: 72,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  dayChipSelected: {
    backgroundColor: brandColors.navy,
    borderColor: brandColors.navy,
  },
  weekday: {
    color: colors.gray[500],
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  weekdaySelected: {
    color: 'rgba(255,255,255,0.72)',
  },
  dayNumber: {
    marginTop: spacing.xs,
    color: colors.gray[900],
    fontSize: fontSize.lg,
    fontWeight: '800',
  },
  dayNumberSelected: {
    color: colors.white,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    backgroundColor: 'transparent',
  },
  dotToday: {
    backgroundColor: brandColors.sky,
  },
  dotSelected: {
    backgroundColor: colors.white,
  },
});

export default DietDaySelector;
