import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../constants/colors';
import type { MissedWorkout } from '../../types';
import { formatLocalDate, getCalendarDayDiff, getTodayDateKey } from '../../utils/date';

interface MissedWorkoutsBannerProps {
  missedWorkouts: MissedWorkout[];
  onWorkoutPress: (workout: MissedWorkout) => void;
  onDismiss?: () => void;
}

const getRelativeDateLabel = (dateString: string) => {
  const diffDays = getCalendarDayDiff(dateString, getTodayDateKey());

  if (diffDays === 0) {
    return 'Hoy';
  }

  if (diffDays === 1) {
    return 'Ayer';
  }

  if (diffDays < 7) {
    return `Hace ${diffDays} dias`;
  }

  return formatLocalDate(dateString, { day: 'numeric', month: 'short' }, 'es-ES');
};

const getUrgencyColor = (dateString: string) => {
  const diffDays = getCalendarDayDiff(dateString, getTodayDateKey());

  if (diffDays <= 2) return colors.warning;
  if (diffDays <= 5) return '#F97316';
  return colors.error;
};

export const MissedWorkoutsBanner: React.FC<MissedWorkoutsBannerProps> = ({
  missedWorkouts,
  onWorkoutPress,
  onDismiss,
}) => {
  if (missedWorkouts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
          </View>
          <View>
            <Text style={styles.title}>
              {missedWorkouts.length === 1
                ? 'Tienes un entrenamiento pendiente'
                : `Tienes ${missedWorkouts.length} entrenamientos pendientes`}
            </Text>
            <Text style={styles.subtitle}>
              No dejes que se acumulen. Ponte al dia.
            </Text>
          </View>
        </View>
        {onDismiss ? (
          <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
            <Ionicons name="close" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.workoutsList}
      >
        {missedWorkouts.slice(0, 5).map((workout) => {
          const urgencyColor = getUrgencyColor(workout.scheduled_date);

          return (
            <TouchableOpacity
              key={workout.training_day_id}
              style={styles.workoutCard}
              onPress={() => onWorkoutPress(workout)}
              activeOpacity={0.8}
            >
              <View style={[styles.urgencyIndicator, { backgroundColor: urgencyColor }]} />
              <View style={styles.workoutContent}>
                <Text style={styles.workoutDate}>{getRelativeDateLabel(workout.scheduled_date)}</Text>
                <Text style={styles.workoutName} numberOfLines={1}>
                  {workout.training_day_name}
                </Text>
                {workout.training_day_focus ? (
                  <Text style={styles.workoutFocus} numberOfLines={1}>
                    {workout.training_day_focus}
                  </Text>
                ) : null}
                <View style={styles.workoutMeta}>
                  <Ionicons name="barbell-outline" size={12} color={colors.gray[400]} />
                  <Text style={styles.workoutMetaText}>
                    {workout.exercises_count} ejercicios
                  </Text>
                </View>
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
              </View>
            </TouchableOpacity>
          );
        })}

        {missedWorkouts.length > 5 ? (
          <View style={styles.moreCard}>
            <Text style={styles.moreText}>+{missedWorkouts.length - 5}</Text>
            <Text style={styles.moreLabel}>mas</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.tipContainer}>
        <Ionicons name="bulb-outline" size={14} color={colors.primary[500]} />
        <Text style={styles.tipText}>
          Toca un entrenamiento para hacerlo ahora o reagendarlo
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFBEB',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: fontSize.xs,
    color: '#B45309',
  },
  dismissButton: {
    padding: spacing.xs,
  },
  workoutsList: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    width: 180,
    ...shadows.sm,
  },
  urgencyIndicator: {
    width: 4,
    alignSelf: 'stretch',
  },
  workoutContent: {
    flex: 1,
    padding: spacing.sm,
  },
  workoutDate: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.gray[500],
    marginBottom: 2,
  },
  workoutName: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
  },
  workoutFocus: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 1,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.xs,
  },
  workoutMetaText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
  },
  arrowContainer: {
    padding: spacing.sm,
  },
  moreCard: {
    width: 60,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  moreText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[600],
  },
  moreLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#FEF3C7',
  },
  tipText: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
  },
});

export default MissedWorkoutsBanner;
