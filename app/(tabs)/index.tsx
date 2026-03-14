import React, { useEffect, useCallback, useState } from 'react';
import { StyleSheet, ScrollView, RefreshControl, Alert, useWindowDimensions, View } from 'react-native';
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
import { getDashboardContentWidth, isTabletLayout } from '../../src/utils/layout';

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const isTablet = isTabletLayout(width, height);
  const contentWidth = getDashboardContentWidth(width);
  const { user } = useAuthStore();
  const {
    activeMacrocycle,
    todayTrainingDay,
    weeklyProgress,
    workoutPosition,
    workoutTotal,
    allCompleted,
    nextWorkoutReason,
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
    const loadInitialDashboard = async () => {
      await loadDashboardData();
      await loadNextWorkout();
    };

    void loadInitialDashboard();
  }, [loadDashboardData, loadNextWorkout]);

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

    void loadMuscleVolume();
  }, [todayTrainingDay?.id, countSecondaryMuscles]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [clearError, error]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    await loadNextWorkout();

    if (todayTrainingDay?.id && !todayTrainingDay.rest_day) {
      try {
        const data = await getMuscleVolume(todayTrainingDay.id, countSecondaryMuscles);
        setMuscleVolume(data);
      } catch (err) {
        console.error('Error refreshing muscle volume:', err);
      }
    }

    setRefreshing(false);
  }, [countSecondaryMuscles, loadDashboardData, loadNextWorkout, todayTrainingDay?.id, todayTrainingDay?.rest_day]);

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
        contentContainerStyle={[
          styles.scrollContent,
          isTablet ? styles.scrollContentTablet : null,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentColumn, { maxWidth: contentWidth }]}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <UserHeader
              user={user}
              macrocycle={activeMacrocycle}
              contentWidth={contentWidth}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <WeekCalendar weeklyProgress={weeklyProgress} contentWidth={contentWidth} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <QuickStats
              weeklyProgress={weeklyProgress}
              workoutPosition={workoutPosition}
              workoutTotal={workoutTotal}
              isLoading={isLoading && !refreshing}
              contentWidth={contentWidth}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <TodayWorkoutCard
              trainingDay={todayTrainingDay}
              position={workoutPosition}
              total={workoutTotal}
              allCompleted={allCompleted}
              nextWorkoutReason={nextWorkoutReason}
              onStartPress={handleStartWorkout}
              isLoading={isStartingWorkout || (isLoading && !todayTrainingDay && !allCompleted)}
              contentWidth={contentWidth}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <ActivityChart
              muscleVolume={muscleVolume}
              isLoading={isLoadingVolume || (isLoading && !refreshing)}
              countSecondaryMuscles={countSecondaryMuscles}
              onToggleSecondary={handleToggleSecondary}
              contentWidth={contentWidth}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <ScienceTips contentWidth={contentWidth} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(400)}>
            <MetricsSummary contentWidth={contentWidth} />
          </Animated.View>

          {weeklyProgress?.days?.length ? (
            <Animated.View entering={FadeInDown.delay(700).duration(400)}>
              <UpcomingWorkouts
                days={weeklyProgress.days}
                isLoading={isLoading && !refreshing}
                contentWidth={contentWidth}
              />
            </Animated.View>
          ) : null}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl + 60,
  },
  scrollContentTablet: {
    paddingBottom: spacing.xxl,
  },
  contentColumn: {
    width: '100%',
    alignSelf: 'center',
  },
});
