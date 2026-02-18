import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../src/constants/colors';

// Datos mock para historial de entrenamientos
const mockWorkoutHistory = [
  {
    id: '1',
    name: 'Día 1 - Empuje',
    date: '2024-12-03',
    duration: '58 min',
    exercises: 6,
    volume: '12,450 kg',
    completed: true,
  },
  {
    id: '2',
    name: 'Día 2 - Tirón',
    date: '2024-12-01',
    duration: '52 min',
    exercises: 5,
    volume: '10,200 kg',
    completed: true,
  },
  {
    id: '3',
    name: 'Día 3 - Piernas',
    date: '2024-11-29',
    duration: '65 min',
    exercises: 7,
    volume: '18,300 kg',
    completed: true,
  },
  {
    id: '4',
    name: 'Día 1 - Empuje',
    date: '2024-11-27',
    duration: '55 min',
    exercises: 6,
    volume: '11,800 kg',
    completed: true,
  },
];

export default function WorkoutsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Entrenamientos</Text>
        <Text style={styles.subtitle}>Historial de sesiones completadas</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>24</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Este mes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>52h</Text>
            <Text style={styles.statLabel}>Tiempo</Text>
          </View>
        </View>

        {/* Workout History */}
        <Text style={styles.sectionTitle}>Historial reciente</Text>

        {mockWorkoutHistory.map((workout) => (
          <View key={workout.id} style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <View style={styles.workoutIcon}>
                <Ionicons name="barbell" size={20} color={colors.primary[500]} />
              </View>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutName}>{workout.name}</Text>
                <Text style={styles.workoutDate}>
                  {new Date(workout.date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              </View>
            </View>

            <View style={styles.workoutStats}>
              <View style={styles.workoutStat}>
                <Ionicons name="time-outline" size={14} color={colors.gray[400]} />
                <Text style={styles.workoutStatText}>{workout.duration}</Text>
              </View>
              <View style={styles.workoutStat}>
                <Ionicons name="fitness-outline" size={14} color={colors.gray[400]} />
                <Text style={styles.workoutStatText}>{workout.exercises} ejercicios</Text>
              </View>
              <View style={styles.workoutStat}>
                <Ionicons name="trending-up-outline" size={14} color={colors.gray[400]} />
                <Text style={styles.workoutStatText}>{workout.volume}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Placeholder message */}
        <View style={styles.placeholderContainer}>
          <Ionicons name="construct-outline" size={40} color={colors.gray[300]} />
          <Text style={styles.placeholderText}>
            Más funcionalidades próximamente
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 60,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.sm,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.primary[600],
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: spacing.md,
  },
  workoutCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  workoutName: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[800],
  },
  workoutDate: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
    textTransform: 'capitalize',
  },
  completedBadge: {
    padding: spacing.xs,
  },
  workoutStats: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    gap: spacing.md,
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutStatText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  placeholderContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginTop: spacing.md,
  },
  placeholderText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginTop: spacing.sm,
  },
});
