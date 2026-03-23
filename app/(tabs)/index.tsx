import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../src/store/authStore';
import { useWorkoutStore } from '../../src/store/workoutStore';
import { LoadingSpinner } from '../../src/components/common';
import {
  ActivityChart,
  MetricsSummary,
  MicrocycleStats,
  MicrocycleTimeline,
  ScienceTips,
  SessionPickerModal,
  TodayWorkoutCard,
  UserHeader,
} from '../../src/components/dashboard';
import { spacing } from '../../src/constants/colors';
import { getMuscleVolume } from '../../src/services/api';
import type { TipContext } from '../../src/utils/contextualTips';
import { useAppTheme, useThemedStyles } from '../../src/theme';
import type {
  MicrocycleDayProgress,
  MicrocycleMode,
  MicrocycleSessionProgress,
  MuscleVolumeResponse,
} from '../../src/types';
import { formatLocalDate } from '../../src/utils/date';
import { getDashboardContentWidth, isTabletLayout } from '../../src/utils/layout';

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const isTablet = isTabletLayout(width, height);
  const contentWidth = getDashboardContentWidth(width);
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuthStore();
  const {
    activeMacrocycle,
    nextPlannedSession,
    microcycleProgress,
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
  const [microcycleMode, setMicrocycleMode] = useState<MicrocycleMode>('planned');
  const [selectedDay, setSelectedDay] = useState<MicrocycleDayProgress | null>(null);
  const [isSessionPickerVisible, setIsSessionPickerVisible] = useState(false);

  useEffect(() => {
    const loadInitialDashboard = async () => {
      await loadDashboardData();
      await loadNextWorkout();
    };

    void loadInitialDashboard();
  }, [loadDashboardData, loadNextWorkout]);

  useEffect(() => {
    const loadMuscleVolume = async () => {
      if (nextPlannedSession?.id && !nextPlannedSession.rest_day) {
        setIsLoadingVolume(true);
        try {
          const data = await getMuscleVolume(nextPlannedSession.id, countSecondaryMuscles);
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
  }, [countSecondaryMuscles, nextPlannedSession?.id, nextPlannedSession?.rest_day]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [clearError, error]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    await loadNextWorkout();

    if (nextPlannedSession?.id && !nextPlannedSession.rest_day) {
      try {
        const data = await getMuscleVolume(nextPlannedSession.id, countSecondaryMuscles);
        setMuscleVolume(data);
      } catch (err) {
        console.error('Error refreshing muscle volume:', err);
      }
    }

    setRefreshing(false);
  }, [
    countSecondaryMuscles,
    loadDashboardData,
    loadNextWorkout,
    nextPlannedSession?.id,
    nextPlannedSession?.rest_day,
  ]);

  const openWorkoutSession = useCallback(
    async (session: MicrocycleSessionProgress) => {
      if (session.workout_log_id) {
        router.push({
          pathname: '/workout/[id]',
          params: { id: session.workout_log_id },
        });
        return;
      }

      const workoutLogId = await startWorkout(session.training_day_id);
      if (workoutLogId) {
        router.push({
          pathname: '/workout/[id]',
          params: { id: workoutLogId },
        });
      }
    },
    [startWorkout],
  );

  const handleDayPress = useCallback(
    async (day: MicrocycleDayProgress) => {
      if (!day.sessions.length) {
        return;
      }

      if (day.sessions.length === 1) {
        await openWorkoutSession(day.sessions[0]);
        return;
      }

      setSelectedDay(day);
      setIsSessionPickerVisible(true);
    },
    [openWorkoutSession],
  );

  const handleStartNextSession = useCallback(async () => {
    if (!nextPlannedSession) {
      return;
    }

    const workoutLogId = await startWorkout(nextPlannedSession.id);
    if (workoutLogId) {
      router.push({
        pathname: '/workout/[id]',
        params: { id: workoutLogId },
      });
    }
  }, [nextPlannedSession, startWorkout]);

  const sessionPickerTitle = useMemo(() => {
    if (!selectedDay) {
      return 'Sesiones del día';
    }

    return formatLocalDate(selectedDay.date, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, [selectedDay]);

  const tipContext = useMemo<TipContext>(() => ({
    nextSession: nextPlannedSession,
    microcycleProgress,
    muscleVolume,
    allCompleted,
    workoutPosition,
    workoutTotal,
    currentHour: new Date().getHours(),
  }), [
    nextPlannedSession,
    microcycleProgress,
    muscleVolume,
    allCompleted,
    workoutPosition,
    workoutTotal,
  ]);

  if (!user) {
    router.replace('/login');
    return null;
  }

  if (isLoading && !refreshing && !microcycleProgress && !nextPlannedSession) {
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
            tintColor={theme.colors.primary}
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
            <MicrocycleTimeline
              microcycleProgress={microcycleProgress}
              mode={microcycleMode}
              onDayPress={handleDayPress}
              contentWidth={contentWidth}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(180).duration(400)}>
            <MicrocycleStats
              microcycleProgress={microcycleProgress}
              mode={microcycleMode}
              onModeChange={setMicrocycleMode}
              isLoading={isLoading && !refreshing}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(260).duration(400)}>
            <TodayWorkoutCard
              trainingDay={nextPlannedSession}
              position={workoutPosition}
              total={workoutTotal}
              allCompleted={allCompleted}
              onStartPress={handleStartNextSession}
              isLoading={isStartingWorkout || (isLoading && !nextPlannedSession && !allCompleted)}
              contentWidth={contentWidth}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(340).duration(400)}>
            <ActivityChart
              muscleVolume={muscleVolume}
              isLoading={isLoadingVolume || (isLoading && !refreshing)}
              countSecondaryMuscles={countSecondaryMuscles}
              onToggleSecondary={setCountSecondaryMuscles}
              contentWidth={contentWidth}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(420).duration(400)}>
            <ScienceTips context={tipContext} contentWidth={contentWidth} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(500).duration(400)}>
            <MetricsSummary contentWidth={contentWidth} />
          </Animated.View>
        </View>
      </ScrollView>

      <SessionPickerModal
        visible={isSessionPickerVisible}
        title={sessionPickerTitle}
        subtitle={
          selectedDay
            ? `${selectedDay.sessions.length} sesión${selectedDay.sessions.length > 1 ? 'es' : ''} disponible${selectedDay.sessions.length > 1 ? 's' : ''}`
            : null
        }
        sessions={selectedDay?.sessions ?? []}
        onClose={() => {
          setIsSessionPickerVisible(false);
          setSelectedDay(null);
        }}
        onSelectSession={async (session) => {
          setIsSessionPickerVisible(false);
          setSelectedDay(null);
          await openWorkoutSession(session);
        }}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
