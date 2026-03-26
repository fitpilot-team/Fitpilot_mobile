import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../src/store/authStore';
import { useWorkoutStore } from '../../src/store/workoutStore';
import { LoadingSpinner, TabScreenWrapper } from '../../src/components/common';
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
import { useBottomTabBarContentInset, useBottomTabBarScroll } from '../../src/hooks/useBottomTabBarVisibility';
import { getMuscleVolume } from '../../src/services/api';
import type { TipContext } from '../../src/utils/contextualTips';
import { useAppTheme, useThemedStyles } from '../../src/theme';
import type {
  MicrocycleMode,
  MicrocycleSessionProgress,
  MuscleVolumeResponse,
} from '../../src/types';
import { formatLocalDate } from '../../src/utils/date';
import { getDashboardContentWidth, isTabletLayout } from '../../src/utils/layout';
import {
  buildProgramTimelineModel,
  buildProgramTimelineView,
  getProgramTimelineWeekLabel,
  shiftProgramTimelineFocusByWeek,
} from '../../src/utils/programTimeline';

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const isTablet = isTabletLayout(width, height);
  const contentWidth = getDashboardContentWidth(width);
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const tabBarScroll = useBottomTabBarScroll();
  const contentInsetBottom = useBottomTabBarContentInset();
  const isFocused = useIsFocused();
  const { user } = useAuthStore();
  const {
    activeMacrocycle,
    dashboardWorkoutLogs,
    microcycleProgress,
    dashboardDataVersion,
    workoutLogsVersion,
    isLoading,
    isStartingWorkout,
    error,
    loadDashboardData,
    startWorkout,
    clearError,
  } = useWorkoutStore();

  const [refreshing, setRefreshing] = useState(false);
  const [muscleVolume, setMuscleVolume] = useState<MuscleVolumeResponse | null>(null);
  const [isLoadingVolume, setIsLoadingVolume] = useState(false);
  const [countSecondaryMuscles, setCountSecondaryMuscles] = useState(true);
  const [microcycleMode, setMicrocycleMode] = useState<MicrocycleMode>('planned');
  const [focusedDateKey, setFocusedDateKey] = useState<string | null>(null);
  const [isSessionPickerVisible, setIsSessionPickerVisible] = useState(false);
  const [hasPlayedEntryAnimation, setHasPlayedEntryAnimation] = useState(false);
  const lastLoadedWorkoutLogsVersionRef = useRef<number | null>(null);

  const programTimelineModel = useMemo(
    () => buildProgramTimelineModel(activeMacrocycle, dashboardWorkoutLogs),
    [activeMacrocycle, dashboardWorkoutLogs],
  );
  const programTimelineView = useMemo(
    () => buildProgramTimelineView(programTimelineModel, focusedDateKey, microcycleMode),
    [focusedDateKey, microcycleMode, programTimelineModel],
  );
  const currentWeekLabel = useMemo(
    () => getProgramTimelineWeekLabel(programTimelineView.currentWeekStartDateKey),
    [programTimelineView.currentWeekStartDateKey],
  );
  const showInitialLoadingState = isLoading && !refreshing && dashboardDataVersion === 0;
  const shouldAnimateEntry = !hasPlayedEntryAnimation && !showInitialLoadingState;
  const getEntryAnimation = useCallback(
    (delay: number) => (shouldAnimateEntry ? FadeInDown.delay(delay).duration(400) : undefined),
    [shouldAnimateEntry],
  );

  const syncDashboardData = useCallback(
    async (version = workoutLogsVersion) => {
      if (!user?.id) {
        return;
      }

      await loadDashboardData(user.id);
      lastLoadedWorkoutLogsVersionRef.current = version;
    },
    [loadDashboardData, user?.id, workoutLogsVersion],
  );

  useEffect(() => {
    if (!isFocused || !user?.id) {
      return;
    }

    if (
      dashboardDataVersion !== 0 &&
      lastLoadedWorkoutLogsVersionRef.current === workoutLogsVersion
    ) {
      return;
    }

    void syncDashboardData(workoutLogsVersion);
  }, [dashboardDataVersion, isFocused, syncDashboardData, user?.id, workoutLogsVersion]);

  useEffect(() => {
    if (!shouldAnimateEntry) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setHasPlayedEntryAnimation(true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [shouldAnimateEntry]);

  useEffect(() => {
    setFocusedDateKey(programTimelineModel.initialFocusedDateKey);
    setIsSessionPickerVisible(false);
  }, [dashboardDataVersion, programTimelineModel.initialFocusedDateKey]);

  useEffect(() => {
    const loadMuscleVolume = async () => {
      if (programTimelineView.highlightedTrainingDay?.id && !programTimelineView.highlightedTrainingDay.rest_day) {
        setIsLoadingVolume(true);
        try {
          const data = await getMuscleVolume(
            programTimelineView.highlightedTrainingDay.id,
            countSecondaryMuscles,
          );
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
  }, [
    countSecondaryMuscles,
    programTimelineView.highlightedTrainingDay?.id,
    programTimelineView.highlightedTrainingDay?.rest_day,
  ]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [clearError, error]);

  const onRefresh = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setRefreshing(true);
    await loadDashboardData(user.id);
    lastLoadedWorkoutLogsVersionRef.current = workoutLogsVersion;
    setRefreshing(false);
  }, [loadDashboardData, user?.id, workoutLogsVersion]);

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

  const handleFocusDate = useCallback((dateKey: string) => {
    setFocusedDateKey(dateKey);
    setIsSessionPickerVisible(false);
  }, []);

  const handleShiftWeek = useCallback(
    (direction: -1 | 1) => {
      const nextDateKey = shiftProgramTimelineFocusByWeek(
        programTimelineModel,
        programTimelineView.effectiveFocusedDateKey,
        direction,
      );

      if (nextDateKey) {
        setFocusedDateKey(nextDateKey);
        setIsSessionPickerVisible(false);
      }
    },
    [programTimelineModel, programTimelineView.effectiveFocusedDateKey],
  );

  const handleStartHighlightedSession = useCallback(async () => {
    if (programTimelineView.cardState.kind !== 'session') {
      return;
    }

    await openWorkoutSession(programTimelineView.cardState.session);
  }, [openWorkoutSession, programTimelineView.cardState]);

  const handleOpenSessions = useCallback(() => {
    if ((programTimelineView.focusedDay?.sessions.length ?? 0) > 1) {
      setIsSessionPickerVisible(true);
    }
  }, [programTimelineView.focusedDay?.sessions.length]);

  const sessionPickerTitle = useMemo(() => {
    if (!programTimelineView.focusedDay) {
      return 'Sesiones del dia';
    }

    return formatLocalDate(programTimelineView.focusedDay.dateKey, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }, [programTimelineView.focusedDay]);

  const tipContext = useMemo<TipContext>(
    () => ({
      nextSession: programTimelineView.highlightedTrainingDay,
      microcycleProgress,
      muscleVolume,
      allCompleted: programTimelineView.allCompleted,
      workoutPosition: programTimelineView.workoutPosition,
      workoutTotal: programTimelineView.workoutTotal,
      currentHour: new Date().getHours(),
    }),
    [
      programTimelineView.highlightedTrainingDay,
      microcycleProgress,
      muscleVolume,
      programTimelineView.allCompleted,
      programTimelineView.workoutPosition,
      programTimelineView.workoutTotal,
    ],
  );

  if (!user) {
    router.replace('/login');
    return null;
  }

  if (showInitialLoadingState) {
    return <LoadingSpinner fullScreen text="Cargando tu programa..." />;
  }

  return (
    <TabScreenWrapper>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: contentInsetBottom },
            isTablet ? styles.scrollContentTablet : null,
          ]}
          onScroll={tabBarScroll.onScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          scrollEventThrottle={tabBarScroll.scrollEventThrottle}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.contentColumn, { maxWidth: contentWidth }]}>
            <Animated.View entering={getEntryAnimation(0)}>
              <UserHeader
                user={user}
                macrocycle={activeMacrocycle}
                contentWidth={contentWidth}
              />
            </Animated.View>

            <Animated.View entering={getEntryAnimation(100)}>
              <MicrocycleTimeline
                title={microcycleProgress?.microcycle_name || activeMacrocycle?.name || 'Programa activo'}
                subtitle={currentWeekLabel}
                days={programTimelineView.days}
                mode={microcycleMode}
                canGoToPreviousWeek={programTimelineView.canGoToPreviousWeek}
                canGoToNextWeek={programTimelineView.canGoToNextWeek}
                onFocusDate={handleFocusDate}
                onShiftWeek={handleShiftWeek}
                contentWidth={contentWidth}
              />
            </Animated.View>

            <Animated.View entering={getEntryAnimation(180)}>
              <MicrocycleStats
                microcycleProgress={microcycleProgress}
                actualAdherenceMetrics={programTimelineModel.actualAdherenceMetrics}
                mode={microcycleMode}
                onModeChange={setMicrocycleMode}
                isLoading={isLoading && !refreshing}
              />
            </Animated.View>

            <Animated.View entering={getEntryAnimation(260)}>
              <TodayWorkoutCard
                cardState={programTimelineView.cardState}
                onStartPress={handleStartHighlightedSession}
                onOpenSessions={handleOpenSessions}
                isLoading={isStartingWorkout || (isLoading && !refreshing)}
                contentWidth={contentWidth}
              />
            </Animated.View>

            <Animated.View entering={getEntryAnimation(340)}>
              <ActivityChart
                muscleVolume={muscleVolume}
                isLoading={isLoadingVolume || (isLoading && !refreshing)}
                countSecondaryMuscles={countSecondaryMuscles}
                onToggleSecondary={setCountSecondaryMuscles}
                contentWidth={contentWidth}
              />
            </Animated.View>

            <Animated.View entering={getEntryAnimation(420)}>
              <ScienceTips context={tipContext} contentWidth={contentWidth} />
            </Animated.View>

            <Animated.View entering={getEntryAnimation(500)}>
              <MetricsSummary contentWidth={contentWidth} />
            </Animated.View>
          </View>
        </ScrollView>

        <SessionPickerModal
          visible={isSessionPickerVisible}
          title={sessionPickerTitle}
          subtitle={
            programTimelineView.focusedDay
              ? `${programTimelineView.focusedDay.sessions.length} sesion${programTimelineView.focusedDay.sessions.length > 1 ? 'es' : ''} disponible${programTimelineView.focusedDay.sessions.length > 1 ? 's' : ''}`
              : null
          }
          sessions={programTimelineView.focusedDay?.sessions ?? []}
          onClose={() => {
            setIsSessionPickerVisible(false);
          }}
          onSelectSession={async (session) => {
            setIsSessionPickerVisible(false);
            await openWorkoutSession(session);
          }}
        />
      </SafeAreaView>
    </TabScreenWrapper>
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
      paddingBottom: spacing.xxl,
    },
    scrollContentTablet: {
      paddingBottom: spacing.xl,
    },
    contentColumn: {
      width: '100%',
      alignSelf: 'center',
    },
  });
