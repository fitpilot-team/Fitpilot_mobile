import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { colors, brandColors, spacing, fontSize, borderRadius, shadows } from '../../constants/colors';
import { ListItemSkeleton } from '../common/Skeleton';
import type { DayProgress } from '../../types';

interface UpcomingWorkoutsProps {
  days: DayProgress[];
  isLoading?: boolean;
  onDayPress?: (day: DayProgress) => void;
}

export const UpcomingWorkouts: React.FC<UpcomingWorkoutsProps> = ({
  days,
  isLoading = false,
  onDayPress,
}) => {
  // Filtrar solo días futuros con entrenamiento
  const today = new Date().toISOString().split('T')[0];
  const upcomingDays = days.filter(
    d => d.date > today && d.has_workout && !d.is_rest_day
  );

  // Si está cargando, mostrar skeletons
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Próximos entrenamientos</Text>
        </View>
        <View style={styles.content}>
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </View>
      </View>
    );
  }

  // Si no hay próximos entrenamientos, no mostrar nada
  if (upcomingDays.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar" size={20} color={brandColors.navy} />
          <Text style={styles.title}>Próximos entrenamientos</Text>
        </View>
      </View>

      {/* Lista de días */}
      <View style={styles.content}>
        {upcomingDays.slice(0, 3).map((day, index) => (
          <WorkoutDayRow
            key={day.date}
            day={day}
            index={index}
            onPress={() => onDayPress?.(day)}
          />
        ))}
      </View>
    </View>
  );
};

interface WorkoutDayRowProps {
  day: DayProgress;
  index: number;
  onPress?: () => void;
}

const WorkoutDayRow: React.FC<WorkoutDayRowProps> = ({ day, index, onPress }) => {
  const date = new Date(day.date);
  const dayNumber = date.getDate();
  const monthName = date.toLocaleDateString('es-ES', { month: 'short' });

  // Determinar si es mañana
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = day.date === tomorrow.toISOString().split('T')[0];

  return (
    <Animated.View entering={FadeInRight.delay(index * 100).duration(400)}>
      <TouchableOpacity
        style={[styles.dayRow, shadows.sm]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Fecha */}
        <View style={styles.dateContainer}>
          <View style={[styles.dateCircle, isTomorrow && styles.dateCircleTomorrow]}>
            <Text style={[styles.dateNumber, isTomorrow && styles.dateNumberTomorrow]}>
              {dayNumber}
            </Text>
          </View>
          <Text style={styles.monthText}>{monthName}</Text>
        </View>

        {/* Info del día */}
        <View style={styles.dayInfo}>
          <View style={styles.dayNameRow}>
            <Text style={styles.dayName}>
              {day.training_day_name || `Día ${day.day_number}`}
            </Text>
            {isTomorrow && (
              <View style={styles.tomorrowBadge}>
                <Text style={styles.tomorrowText}>Mañana</Text>
              </View>
            )}
          </View>
          <Text style={styles.dayDescription}>
            {day.day_name} • {day.total_sets} series
          </Text>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  content: {
    gap: spacing.sm,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  dateContainer: {
    alignItems: 'center',
    marginRight: spacing.md,
    minWidth: 50,
  },
  dateCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCircleTomorrow: {
    backgroundColor: brandColors.sky,
  },
  dateNumber: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[700],
  },
  dateNumberTomorrow: {
    color: colors.white,
  },
  monthText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
    textTransform: 'capitalize',
  },
  dayInfo: {
    flex: 1,
  },
  dayNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  tomorrowBadge: {
    backgroundColor: `${brandColors.sky}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  tomorrowText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: brandColors.sky,
  },
  dayDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
});

export default UpcomingWorkouts;
