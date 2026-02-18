import React, { useEffect, useCallback, useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../src/store/authStore';
import { useWorkoutStore } from '../../src/store/workoutStore';
import { LoadingSpinner } from '../../src/components/common';
import {
  UserHeader,
  WeekCalendar,
  TodayWorkoutCard,
  ActivityChart,
  QuickStats,
  ScienceTips,
  UpcomingWorkouts,
  MetricsSummary,
} from '../../src/components/dashboard';
import { colors, spacing } from '../../src/constants/colors';
import { getMuscleVolume } from '../../src/services/api';
import type { MuscleVolumeResponse } from '../../src/types';

export default function HomeScreen() {
  const { user } = useAuthStore();
  const {
    activeMacrocycle,
    todayTrainingDay,
    weeklyProgress,
    workoutPosition,
    workoutTotal,
    allCompleted,
    isLoading,
    isStartingWorkout,
    error,
    loadDashboardData,
    loadNextWorkout,
    startWorkout,
    clearError,
  } = useWorkoutStore();

  const [refreshing, setRefreshing] = useState(false);
  const [muscleVolume, setMuscleVolume] = useState<MuscleVolumeResponse | null>(null);
  const [isLoadingVolume, setIsLoadingVolume] = useState(false);
  const [countSecondaryMuscles, setCountSecondaryMuscles] = useState(true);

  useEffect(() => {
    loadDashboardData();
    loadNextWorkout();
  }, []);

  // Cargar volumen muscular cuando hay un entrenamiento disponible
  useEffect(() => {
    const loadMuscleVolume = async () => {
      if (todayTrainingDay?.id && !todayTrainingDay.rest_day) {
        setIsLoadingVolume(true);
        try {
          const data = await getMuscleVolume(todayTrainingDay.id, countSecondaryMuscles);
          setMuscleVolume(data);
        } catch (err) {
          console.error('Error loading muscle volume:', err);
          setMuscleVolume(null);
        } finally {
          setIsLoadingVolume(false);
        }
      } else {
        setMuscleVolume(null);
      }
    };

    loadMuscleVolume();
  }, [todayTrainingDay?.id, countSecondaryMuscles]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    await loadNextWorkout();
    // Recargar volumen muscular si hay entrenamiento
    if (todayTrainingDay?.id && !todayTrainingDay.rest_day) {
      try {
        const data = await getMuscleVolume(todayTrainingDay.id, countSecondaryMuscles);
        setMuscleVolume(data);
      } catch (err) {
        console.error('Error refreshing muscle volume:', err);
      }
    }
    setRefreshing(false);
  }, [todayTrainingDay?.id, countSecondaryMuscles]);

  const handleStartWorkout = async () => {
    if (!todayTrainingDay) return;

    const workoutLogId = await startWorkout(todayTrainingDay.id);
    if (workoutLogId) {
      router.push({
        pathname: '/workout/[id]',
        params: { id: workoutLogId },
      });
    }
  };

  const handleToggleSecondary = (value: boolean) => {
    setCountSecondaryMuscles(value);
  };

  if (!user) {
    router.replace('/login');
    return null;
  }

  if (isLoading && !refreshing) {
    return <LoadingSpinner fullScreen text="Cargando tu programa..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* User Header con Logo */}
        <Animated.View entering={FadeInDown.duration(400)}>
          <UserHeader
            user={user}
            macrocycle={activeMacrocycle}
          />
        </Animated.View>

        {/* Week Calendar */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <WeekCalendar weeklyProgress={weeklyProgress} />
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <QuickStats
            weeklyProgress={weeklyProgress}
            workoutPosition={workoutPosition}
            workoutTotal={workoutTotal}
            isLoading={isLoading && !refreshing}
          />
        </Animated.View>

        {/* Next Workout Card */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <TodayWorkoutCard
            trainingDay={todayTrainingDay}
            position={workoutPosition}
            total={workoutTotal}
            allCompleted={allCompleted}
            onStartPress={handleStartWorkout}
            isLoading={isStartingWorkout}
          />
        </Animated.View>

        {/* Activity Chart - Volumen por Músculo */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <ActivityChart
            muscleVolume={muscleVolume}
            isLoading={isLoadingVolume || (isLoading && !refreshing)}
            countSecondaryMuscles={countSecondaryMuscles}
            onToggleSecondary={handleToggleSecondary}
          />
        </Animated.View>

        {/* Science Tips */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <ScienceTips />
        </Animated.View>

        {/* Metrics Summary */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <MetricsSummary />
        </Animated.View>

        {/* Upcoming Workouts */}
        {weeklyProgress?.days && (
          <Animated.View entering={FadeInDown.delay(700).duration(400)}>
            <UpcomingWorkouts
              days={weeklyProgress.days}
              isLoading={isLoading && !refreshing}
            />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl + 60, // Extra padding for tab bar
  },
});
