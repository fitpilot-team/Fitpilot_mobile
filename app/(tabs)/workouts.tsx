import React, { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Card,
  LoadingSpinner,
  SegmentedControl,
  TabScreenWrapper,
} from '../../src/components/common';
import { AnalyticsRangeSelector } from '../../src/components/workout-analytics/AnalyticsRangeSelector';
import { ExerciseSparkline } from '../../src/components/workout-analytics/ExerciseSparkline';
import { RepRangeEditorModal } from '../../src/components/workout-analytics/RepRangeEditorModal';
import { RepRangeVolumeChart } from '../../src/components/workout-analytics/RepRangeVolumeChart';
import { WorkoutAnalyticsHero } from '../../src/components/workout-analytics/WorkoutAnalyticsHero';
import { WorkoutAnalyticsPillSelector } from '../../src/components/workout-analytics/WorkoutAnalyticsPillSelector';
import { DEFAULT_WORKOUT_ANALYTICS_RANGE, WORKOUT_ANALYTICS_RANGE_OPTIONS } from '../../src/constants/workoutAnalytics';
import { borderRadius, fontSize, spacing } from '../../src/constants/colors';
import {
  getWorkoutAnalyticsDashboard,
  getWorkoutAnalyticsHistory,
  updateWorkoutAnalyticsPreferences,
} from '../../src/services/workoutAnalytics';
import { useBottomTabBarContentInset, useBottomTabBarScroll } from '../../src/hooks/useBottomTabBarVisibility';
import { useWorkoutStore } from '../../src/store/workoutStore';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../src/theme';
import type {
  ApiError,
  ExerciseTrendSummary,
  RecentWorkoutHistoryItem,
  RepRangeBucket,
  WorkoutAnalyticsDashboard,
  WorkoutAnalyticsHistoryPage,
  WorkoutAnalyticsHistoryStatusFilter,
  WorkoutAnalyticsRange,
} from '../../src/types';
import { formatLocalDate } from '../../src/utils/date';
import { formatDuration } from '../../src/utils/formatters';
import {
  getDashboardContentWidth,
  getPrimaryScreenHorizontalPadding,
  isTabletLayout,
} from '../../src/utils/layout';
import { formatDeltaKg, formatVolumeKg, formatWeightKg } from '../../src/utils/workoutAnalytics';

type WorkoutAnalyticsTab = 'overview' | 'exercises' | 'history';
type ExerciseSortOption = 'recent' | 'progress' | 'frequency';
type OverviewModule = 'chart' | 'exercises' | 'history';
type HistorySection = {
  title: string;
  data: RecentWorkoutHistoryItem[];
};

const HISTORY_PAGE_SIZE = 20;
const OVERVIEW_MODULES: OverviewModule[] = ['chart', 'exercises', 'history'];
const TAB_OPTIONS = [
  { value: 'overview', label: 'Resumen' },
  { value: 'exercises', label: 'Ejercicios' },
  { value: 'history', label: 'Historial' },
] as const;
const EXERCISE_SORT_OPTIONS = [
  { value: 'recent', label: 'Recientes' },
  { value: 'progress', label: 'Mayor progreso' },
  { value: 'frequency', label: 'Mas frecuentes' },
] as const;
const HISTORY_STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'completed', label: 'Completados' },
  { value: 'abandoned', label: 'Abandonados' },
] as const;

const getHistoryStatusMeta = (
  status: RecentWorkoutHistoryItem['status'],
  theme: AppTheme,
) => {
  switch (status) {
    case 'completed':
      return { icon: 'checkmark-circle', color: theme.colors.success, label: 'Completado' };
    case 'in_progress':
      return { icon: 'play-circle', color: theme.colors.primary, label: 'En progreso' };
    case 'abandoned':
      return { icon: 'warning', color: theme.colors.warning, label: 'Abandonado' };
    default:
      return { icon: 'barbell', color: theme.colors.iconMuted, label: status };
  }
};

const getDeltaColor = (delta: number | null | undefined, theme: AppTheme) => {
  if (delta == null || delta === 0) {
    return theme.colors.textMuted;
  }

  return delta > 0 ? theme.colors.success : theme.colors.warning;
};

const normalizeSearchValue = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase('es-MX')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getRangeLabel = (range: WorkoutAnalyticsRange) =>
  WORKOUT_ANALYTICS_RANGE_OPTIONS.find((option) => option.value === range)?.label ?? range;

const compareExercisesBySort = (
  left: ExerciseTrendSummary,
  right: ExerciseTrendSummary,
  sort: ExerciseSortOption,
) => {
  if (sort === 'progress') {
    const deltaDiff =
      (right.best_weight_delta_kg ?? Number.NEGATIVE_INFINITY) -
      (left.best_weight_delta_kg ?? Number.NEGATIVE_INFINITY);
    if (deltaDiff !== 0) {
      return deltaDiff;
    }
  }

  if (sort === 'frequency') {
    const sessionsDiff = right.sessions_count - left.sessions_count;
    if (sessionsDiff !== 0) {
      return sessionsDiff;
    }
  }

  const leftDate = left.last_performed_on ?? '';
  const rightDate = right.last_performed_on ?? '';
  const dateDiff = rightDate.localeCompare(leftDate);
  if (dateDiff !== 0) {
    return dateDiff;
  }

  if (sort !== 'frequency') {
    const sessionsDiff = right.sessions_count - left.sessions_count;
    if (sessionsDiff !== 0) {
      return sessionsDiff;
    }
  }

  if (sort !== 'progress') {
    const deltaDiff =
      (right.best_weight_delta_kg ?? Number.NEGATIVE_INFINITY) -
      (left.best_weight_delta_kg ?? Number.NEGATIVE_INFINITY);
    if (deltaDiff !== 0) {
      return deltaDiff;
    }
  }

  return left.exercise_name.localeCompare(right.exercise_name, 'es-MX');
};

const buildHistorySections = (items: RecentWorkoutHistoryItem[]): HistorySection[] => {
  const sections = new Map<string, HistorySection>();

  items.forEach((item) => {
    const key = item.performed_on_date.slice(0, 7);
    const currentSection = sections.get(key);

    if (currentSection) {
      currentSection.data.push(item);
      return;
    }

    sections.set(key, {
      title: formatLocalDate(item.performed_on_date, { month: 'long', year: 'numeric' }, 'es-MX'),
      data: [item],
    });
  });

  return Array.from(sections.values());
};

const mergeHistoryPages = (
  previousPage: WorkoutAnalyticsHistoryPage | null,
  nextPage: WorkoutAnalyticsHistoryPage,
) => {
  if (!previousPage) {
    return nextPage;
  }

  const seenIds = new Set(previousPage.items.map((item) => item.workout_log_id));
  const mergedItems = [...previousPage.items];

  nextPage.items.forEach((item) => {
    if (seenIds.has(item.workout_log_id)) {
      return;
    }

    seenIds.add(item.workout_log_id);
    mergedItems.push(item);
  });

  return {
    total: nextPage.total,
    items: mergedItems,
  };
};

const SearchField = ({
  value,
  placeholder,
  onChangeText,
  onClear,
}: {
  value: string;
  placeholder: string;
  onChangeText: (nextValue: string) => void;
  onClear: () => void;
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.searchField}>
      <Ionicons name="search-outline" size={18} color={theme.colors.iconMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={styles.searchInput}
      />
      {value ? (
        <TouchableOpacity activeOpacity={0.85} onPress={onClear} style={styles.clearButton}>
          <Ionicons name="close" size={16} color={theme.colors.iconMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const SectionHeading = ({
  title,
  subtitle,
  actionLabel,
  onActionPress,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onActionPress?: () => void;
}) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderCopy}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>

      {actionLabel && onActionPress ? (
        <TouchableOpacity style={styles.sectionAction} activeOpacity={0.86} onPress={onActionPress}>
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
          <Ionicons name="arrow-forward" size={14} color="#ffffff" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const EmptyStateCard = ({
  icon,
  title,
  description,
  actionLabel,
  onActionPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Card style={styles.emptyCard}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={icon} size={26} color={theme.colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{description}</Text>
      {actionLabel && onActionPress ? (
        <Button title={actionLabel} onPress={onActionPress} variant="secondary" />
      ) : null}
    </Card>
  );
};

const ExerciseCard = ({
  exercise,
  onPress,
}: {
  exercise: ExerciseTrendSummary;
  onPress: () => void;
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const deltaColor = getDeltaColor(exercise.best_weight_delta_kg, theme);

  return (
    <TouchableOpacity style={styles.exerciseCard} activeOpacity={0.88} onPress={onPress}>
      <View style={styles.exerciseTopRow}>
        <View style={styles.exerciseCopy}>
          <Text style={styles.exerciseName} numberOfLines={2}>
            {exercise.exercise_name}
          </Text>
          <Text style={styles.exerciseMeta}>
            {exercise.last_performed_on
              ? `Ultima sesion ${formatLocalDate(exercise.last_performed_on, {
                  day: 'numeric',
                  month: 'short',
                })}`
              : 'Sin fecha reciente'}
          </Text>
        </View>

        <View style={styles.exerciseSparklineWrap}>
          <ExerciseSparkline values={exercise.sparkline_points} width={120} />
        </View>
      </View>

      <View style={styles.exerciseFooter}>
        <View style={styles.exerciseMetricPill}>
          <Text style={styles.exerciseMetricLabel}>Mejor carga</Text>
          <Text style={styles.exerciseMetricValue}>{formatWeightKg(exercise.latest_best_weight_kg ?? null)}</Text>
        </View>

        <View style={styles.exerciseMetricPill}>
          <Text style={styles.exerciseMetricLabel}>Sesiones</Text>
          <Text style={styles.exerciseMetricValue}>{exercise.sessions_count}</Text>
        </View>

        <View style={[styles.deltaPill, { backgroundColor: `${deltaColor}14` }]}>
          <Text style={[styles.deltaText, { color: deltaColor }]}>{formatDeltaKg(exercise.best_weight_delta_kg)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HistoryCard = ({
  workout,
  onPress,
}: {
  workout: RecentWorkoutHistoryItem;
  onPress: () => void;
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const statusMeta = getHistoryStatusMeta(workout.status, theme);

  return (
    <TouchableOpacity style={styles.historyCard} activeOpacity={0.88} onPress={onPress}>
      <View style={styles.historyTopRow}>
        <View style={styles.historyTitleRow}>
          <View style={[styles.historyIcon, { backgroundColor: `${statusMeta.color}14` }]}>
            <Ionicons name={statusMeta.icon as keyof typeof Ionicons.glyphMap} size={18} color={statusMeta.color} />
          </View>

          <View style={styles.historyCopy}>
            <Text style={styles.historyName}>{workout.training_day_name}</Text>
            <Text style={styles.historyDate}>
              {formatLocalDate(
                workout.performed_on_date,
                { weekday: 'long', day: 'numeric', month: 'short' },
                'es-MX',
              )}
            </Text>
          </View>
        </View>

        <Text style={[styles.historyStatus, { color: statusMeta.color }]}>{statusMeta.label}</Text>
      </View>

      <View style={styles.historyStatsRow}>
        <View style={styles.historyStat}>
          <Ionicons name="time-outline" size={14} color={theme.colors.iconMuted} />
          <Text style={styles.historyStatText}>
            {workout.duration_minutes != null
              ? formatDuration(Math.max(1, Math.round(workout.duration_minutes)))
              : 'Sin duracion'}
          </Text>
        </View>

        <View style={styles.historyStat}>
          <Ionicons name="fitness-outline" size={14} color={theme.colors.iconMuted} />
          <Text style={styles.historyStatText}>{workout.exercises_count} ejercicios</Text>
        </View>

        <View style={styles.historyStat}>
          <Ionicons name="trending-up-outline" size={14} color={theme.colors.iconMuted} />
          <Text style={styles.historyStatText}>{formatVolumeKg(workout.volume_kg)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function WorkoutsScreen() {
  const { width, height } = useWindowDimensions();
  const contentWidth = getDashboardContentWidth(width);
  const horizontalPadding = getPrimaryScreenHorizontalPadding(width, height);
  const chartWidth = Math.max(contentWidth - horizontalPadding * 2, 280);
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const tabBarScroll = useBottomTabBarScroll();
  const contentInsetBottom = useBottomTabBarContentInset();
  const isFocused = useIsFocused();
  const { workoutLogsVersion } = useWorkoutStore();
  const [range, setRange] = useState<WorkoutAnalyticsRange>(DEFAULT_WORKOUT_ANALYTICS_RANGE);
  const [dashboard, setDashboard] = useState<WorkoutAnalyticsDashboard | null>(null);
  const [activeTab, setActiveTab] = useState<WorkoutAnalyticsTab>('overview');
  const [exerciseSort, setExerciseSort] = useState<ExerciseSortOption>('recent');
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [historyStatus, setHistoryStatus] = useState<WorkoutAnalyticsHistoryStatusFilter>('all');
  const [historyPage, setHistoryPage] = useState<WorkoutAnalyticsHistoryPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isHistoryRefreshing, setIsHistoryRefreshing] = useState(false);
  const [isHistoryLoadingMore, setIsHistoryLoadingMore] = useState(false);
  const [isSavingRanges, setIsSavingRanges] = useState(false);
  const [isRangeEditorVisible, setIsRangeEditorVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const deferredExerciseSearch = useDeferredValue(exerciseSearchQuery);

  const hasAnyHistory = (dashboard?.summary.total_sessions ?? 0) > 0;
  const hasRangeData = (dashboard?.summary.sessions_in_range ?? 0) > 0;
  const isTablet = isTabletLayout(width, height);

  const loadDashboard = useCallback(
    async (options?: { refresh?: boolean }) => {
      const isRefresh = options?.refresh ?? false;

      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const nextDashboard = await getWorkoutAnalyticsDashboard(range);
        setDashboard(nextDashboard);
        setError(null);
      } catch (loadError) {
        const apiError = loadError as ApiError;
        setError(apiError.message || 'No fue posible cargar tus entrenamientos.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [range],
  );

  const loadHistoryPage = useCallback(
    async ({
      reset = false,
      refresh = false,
      skip = 0,
    }: {
      reset?: boolean;
      refresh?: boolean;
      skip?: number;
    } = {}) => {
      if (refresh) {
        setIsHistoryRefreshing(true);
      } else if (reset) {
        setIsHistoryLoading(true);
      } else {
        setIsHistoryLoadingMore(true);
      }

      try {
        const nextPage = await getWorkoutAnalyticsHistory({
          range,
          status: historyStatus,
          skip,
          limit: HISTORY_PAGE_SIZE,
        });
        setHistoryPage((currentPage) => (reset ? nextPage : mergeHistoryPages(currentPage, nextPage)));
        setHistoryError(null);
      } catch (loadError) {
        const apiError = loadError as ApiError;
        setHistoryError(apiError.message || 'No fue posible cargar el historial completo.');
      } finally {
        setIsHistoryLoading(false);
        setIsHistoryRefreshing(false);
        setIsHistoryLoadingMore(false);
      }
    },
    [historyStatus, range],
  );

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    void loadDashboard();
  }, [isFocused, loadDashboard, workoutLogsVersion]);

  useEffect(() => {
    if (!isFocused || activeTab !== 'history') {
      return;
    }

    void loadHistoryPage({ reset: true });
  }, [activeTab, isFocused, loadHistoryPage, workoutLogsVersion]);

  const handleRefresh = useCallback(async () => {
    if (activeTab === 'history') {
      await Promise.all([
        loadDashboard({ refresh: true }),
        loadHistoryPage({ reset: true, refresh: true }),
      ]);
      return;
    }

    await loadDashboard({ refresh: true });
  }, [activeTab, loadDashboard, loadHistoryPage]);

  const handleSaveRepRanges = useCallback(async (nextRepRanges: RepRangeBucket[]) => {
    setIsSavingRanges(true);

    try {
      await updateWorkoutAnalyticsPreferences({ rep_ranges: nextRepRanges });
      setIsRangeEditorVisible(false);
      await loadDashboard();
    } catch (saveError) {
      const apiError = saveError as ApiError;
      Alert.alert('Error', apiError.message || 'No fue posible guardar tus rangos.');
    } finally {
      setIsSavingRanges(false);
    }
  }, [loadDashboard]);

  const heroMetrics = useMemo(() => {
    const summary = dashboard?.summary;

    return [
      { label: 'Sesiones', value: `${summary?.total_sessions ?? 0}`, icon: 'barbell-outline' as const },
      { label: 'Volumen', value: formatVolumeKg(summary?.total_volume_kg ?? 0), icon: 'trending-up-outline' as const },
      { label: 'En rango', value: `${summary?.sessions_in_range ?? 0}`, icon: 'calendar-outline' as const },
      { label: 'Dias activos', value: `${summary?.active_days ?? 0}`, icon: 'flash-outline' as const },
    ];
  }, [dashboard?.summary]);

  const quickAction = useMemo(() => {
    const inProgressWorkout = dashboard?.recent_history.find((workout) => workout.status === 'in_progress');
    if (inProgressWorkout) {
      return {
        label: 'Continuar',
        hint: inProgressWorkout.training_day_name,
        icon: 'play' as const,
        onPress: () => router.push(`/workout/${inProgressWorkout.workout_log_id}`),
      };
    }

    const latestWorkout = dashboard?.recent_history[0];
    if (latestWorkout) {
      return {
        label: 'Ultimo registro',
        hint: `${latestWorkout.training_day_name} - ${formatLocalDate(latestWorkout.performed_on_date, {
          day: 'numeric',
          month: 'short',
        })}`,
        icon: 'arrow-forward' as const,
        onPress: () => router.push(`/workout/${latestWorkout.workout_log_id}`),
      };
    }

    return {
      label: 'Abrir programa',
      hint: 'Revisa tu semana activa desde Inicio',
      icon: 'home-outline' as const,
      onPress: () => router.push('/(tabs)'),
    };
  }, [dashboard?.recent_history]);

  const featuredExercises = useMemo(() => {
    const exercises = dashboard?.exercise_summaries ?? [];
    if (!exercises.length) {
      return [];
    }

    const topProgress = [...exercises]
      .sort((left, right) => compareExercisesBySort(left, right, 'progress'))
      .slice(0, 3);

    if (topProgress.some((exercise) => (exercise.best_weight_delta_kg ?? 0) > 0)) {
      return topProgress;
    }

    return [...exercises]
      .sort((left, right) => compareExercisesBySort(left, right, 'recent'))
      .slice(0, 3);
  }, [dashboard?.exercise_summaries]);

  const recentHistoryPreview = useMemo(
    () => (dashboard?.recent_history ?? []).slice(0, 3),
    [dashboard?.recent_history],
  );

  const filteredExercises = useMemo(() => {
    const exercises = dashboard?.exercise_summaries ?? [];
    const searchValue = normalizeSearchValue(deferredExerciseSearch);

    return exercises
      .filter((exercise) => {
        if (!searchValue) {
          return true;
        }

        return normalizeSearchValue(exercise.exercise_name).includes(searchValue);
      })
      .sort((left, right) => compareExercisesBySort(left, right, exerciseSort));
  }, [dashboard?.exercise_summaries, deferredExerciseSearch, exerciseSort]);

  const historySections = useMemo(
    () => buildHistorySections(historyPage?.items ?? []),
    [historyPage?.items],
  );

  const hasMoreHistory = (historyPage?.items.length ?? 0) < (historyPage?.total ?? 0);
  const showFullHistorySpinner = activeTab === 'history' && isHistoryLoading && !historyPage?.items.length;

  const handleHistoryLoadMore = useCallback(() => {
    if (
      isHistoryLoading ||
      isHistoryRefreshing ||
      isHistoryLoadingMore ||
      !historyPage ||
      !hasMoreHistory
    ) {
      return;
    }

    void loadHistoryPage({ skip: historyPage.items.length });
  }, [
    hasMoreHistory,
    historyPage,
    isHistoryLoading,
    isHistoryLoadingMore,
    isHistoryRefreshing,
    loadHistoryPage,
  ]);

  const handleTabChange = useCallback((nextValue: string) => {
    startTransition(() => {
      setActiveTab(nextValue as WorkoutAnalyticsTab);
    });
  }, []);

  const handleExerciseSortChange = useCallback((nextValue: string) => {
    setExerciseSort(nextValue as ExerciseSortOption);
  }, []);

  const handleHistoryStatusChange = useCallback((nextValue: string) => {
    setHistoryStatus(nextValue as WorkoutAnalyticsHistoryStatusFilter);
  }, []);

  if (isLoading && !dashboard) {
    return <LoadingSpinner fullScreen text="Cargando tus entrenamientos..." />;
  }

  if (!dashboard) {
    return (
      <TabScreenWrapper>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={[styles.fullStateShell, { paddingHorizontal: horizontalPadding }]}>
            <EmptyStateCard
              icon="cloud-offline-outline"
              title="No fue posible cargar los datos"
              description={error || 'Intenta de nuevo para recuperar tu resumen de entrenamientos.'}
              actionLabel="Reintentar"
              onActionPress={() => void loadDashboard()}
            />
          </View>
        </SafeAreaView>
      </TabScreenWrapper>
    );
  }

  const pageHeader = (
    <View style={styles.pageHeaderShell}>
      <View
        style={[
          styles.pageHeader,
          { maxWidth: contentWidth, paddingHorizontal: horizontalPadding },
          isTablet ? styles.pageHeaderTablet : null,
        ]}
      >
        <View style={styles.screenIntro}>
          <Text style={styles.screenEyebrow}>Entrenamientos</Text>
          <Text style={styles.screenTitle}>Progreso</Text>
          <Text style={styles.screenSubtitle}>
            Cambia la ventana de analisis y organiza el contenido por vista
            para revisar tu progreso con menos ruido.
          </Text>
        </View>

        <SegmentedControl
          options={TAB_OPTIONS.map((option) => ({
            key: option.value,
            label: option.label,
          }))}
          value={activeTab}
          onChange={(value) => handleTabChange(value)}
        />

        {activeTab === 'overview' ? (
          <>
            <WorkoutAnalyticsHero
              eyebrow="Resumen"
              title="Resumen del periodo"
              subtitle="Volumen, sesiones clave y acceso rapido segun la ventana que elijas."
              rangeLabel={getRangeLabel(range)}
              actionLabel={quickAction.label}
              actionHint={quickAction.hint}
              actionIcon={quickAction.icon}
              metrics={heroMetrics}
              onActionPress={quickAction.onPress}
            />

            <Card padding="sm" style={styles.utilityCard}>
              <View style={styles.utilityGroup}>
                <Text style={styles.utilityLabel}>Ventana de analisis</Text>
                <AnalyticsRangeSelector value={range} onChange={setRange} />
              </View>
            </Card>
          </>
        ) : null}

        {activeTab === 'exercises' ? (
          <>
            <Card style={styles.tabContextCard}>
              <Text style={styles.tabContextEyebrow}>Ejercicios</Text>
              <Text style={styles.tabContextTitle}>Lista completa del progreso</Text>
              <Text style={styles.tabContextSubtitle}>
                Busca y ordena tus movimientos para detectar avances recientes.
              </Text>
            </Card>

            <Card padding="sm" style={styles.utilityCard}>
              <View style={styles.utilityStack}>
                <View style={styles.utilityGroup}>
                  <Text style={styles.utilityLabel}>Ventana de analisis</Text>
                  <AnalyticsRangeSelector value={range} onChange={setRange} />
                </View>

                <SearchField
                  value={exerciseSearchQuery}
                  placeholder="Buscar ejercicio"
                  onChangeText={setExerciseSearchQuery}
                  onClear={() => setExerciseSearchQuery('')}
                />

                <View style={styles.utilityGroup}>
                  <Text style={styles.utilityLabel}>Orden</Text>
                  <WorkoutAnalyticsPillSelector
                    items={EXERCISE_SORT_OPTIONS.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    value={exerciseSort}
                    onChange={handleExerciseSortChange}
                  />
                </View>
              </View>
            </Card>
          </>
        ) : null}

        {activeTab === 'history' ? (
          <>
            <Card style={styles.tabContextCard}>
              <Text style={styles.tabContextEyebrow}>Historial</Text>
              <Text style={styles.tabContextTitle}>Sesiones registradas</Text>
              <Text style={styles.tabContextSubtitle}>
                Filtra el historial completo por ventana y estado sin salir de esta vista.
              </Text>
            </Card>

            <Card padding="sm" style={styles.utilityCard}>
              <View style={styles.utilityStack}>
                <View style={styles.utilityGroup}>
                  <Text style={styles.utilityLabel}>Ventana de analisis</Text>
                  <AnalyticsRangeSelector value={range} onChange={setRange} />
                </View>

                <View style={styles.utilityGroup}>
                  <Text style={styles.utilityLabel}>Estado</Text>
                  <WorkoutAnalyticsPillSelector
                    items={HISTORY_STATUS_OPTIONS.map((option) => ({
                      value: option.value,
                      label: option.label,
                    }))}
                    value={historyStatus}
                    onChange={handleHistoryStatusChange}
                  />
                </View>
              </View>
            </Card>
          </>
        ) : null}

        {error ? (
          <View style={styles.inlineBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={theme.colors.warning} />
            <Text style={styles.inlineBannerText}>{error}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <TabScreenWrapper>
      <SafeAreaView style={styles.container} edges={['top']}>
        {activeTab === 'overview' ? (
          <FlatList
            data={OVERVIEW_MODULES}
            keyExtractor={(item) => item}
            style={styles.list}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: contentInsetBottom + spacing.lg },
            ]}
            ListHeaderComponent={pageHeader}
            showsVerticalScrollIndicator={false}
            onScroll={tabBarScroll.onScroll}
            scrollEventThrottle={tabBarScroll.scrollEventThrottle}
            refreshControl={(
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary}
              />
            )}
            renderItem={({ item }) => {
              const shellStyle = [
                styles.sectionShell,
                { maxWidth: contentWidth, paddingHorizontal: horizontalPadding },
              ];

                  if (item === 'chart') {
                    return (
                      <View style={shellStyle}>
                        <Card style={styles.featureCard} padding="lg">
                        <View style={styles.featureCardHeader}>
                          <View style={styles.sectionHeaderCopy}>
                            <Text style={styles.sectionTitle}>Kg movidos por rango</Text>
                            <Text style={styles.sectionSubtitle}>
                              {dashboard.summary.total_volume_kg
                                ? `${formatVolumeKg(dashboard.summary.total_volume_kg)} acumulados en la ventana`
                                : 'Sin carga registrada en esta ventana'}
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={styles.editButton}
                            activeOpacity={0.86}
                            onPress={() => setIsRangeEditorVisible(true)}
                          >
                            <Ionicons name="options-outline" size={16} color={theme.colors.primary} />
                            <Text style={styles.editButtonText}>Editar</Text>
                          </TouchableOpacity>
                        </View>

                        <RepRangeVolumeChart
                          points={dashboard.rep_range_chart}
                          repRanges={dashboard.preferences.rep_ranges}
                          contentWidth={chartWidth}
                        />
                        </Card>
                      </View>
                    );
                  }

                  if (item === 'exercises') {
                    return (
                      <View style={[styles.sectionBlock, shellStyle]}>
                        <SectionHeading
                          title="Ejercicios clave"
                          subtitle={
                            hasRangeData
                              ? 'Los movimientos con mas señal en la ventana actual.'
                              : 'No hay progresos visibles en la ventana actual.'
                          }
                          actionLabel={hasRangeData ? 'Ver todos' : undefined}
                          onActionPress={hasRangeData ? () => handleTabChange('exercises') : undefined}
                        />

                        {hasAnyHistory && hasRangeData ? (
                          <View style={styles.cardsStack}>
                            {featuredExercises.map((exercise) => (
                              <ExerciseCard
                                key={exercise.exercise_id}
                                exercise={exercise}
                                onPress={() =>
                                  router.push({
                                    pathname: '/workouts/exercises/[exerciseId]',
                                    params: { exerciseId: exercise.exercise_id, range },
                                  })
                                }
                              />
                            ))}
                          </View>
                        ) : (
                          <EmptyStateCard
                            icon={hasAnyHistory ? 'filter-outline' : 'analytics-outline'}
                            title={hasAnyHistory ? 'Sin datos en este rango' : 'Todavia no tienes historial'}
                            description={
                              hasAnyHistory
                                ? 'Cambia la ventana temporal para recuperar el progreso de tus ejercicios.'
                                : 'Cuando completes tus primeras sesiones veras aqui tus ejercicios destacados.'
                            }
                            actionLabel={hasAnyHistory ? 'Ver todo' : 'Ir a inicio'}
                            onActionPress={hasAnyHistory ? () => setRange('all') : () => router.push('/(tabs)')}
                          />
                        )}
                      </View>
                    );
                  }

                  return (
                    <View style={[styles.sectionBlock, shellStyle]}>
                      <SectionHeading
                        title="Sesiones recientes"
                        subtitle="Abre cualquier log para revisar el registro y corregirlo desde detalle si hace falta."
                        actionLabel={recentHistoryPreview.length ? 'Abrir historial' : undefined}
                        onActionPress={recentHistoryPreview.length ? () => handleTabChange('history') : undefined}
                      />

                      {recentHistoryPreview.length ? (
                        <View style={styles.cardsStack}>
                          {recentHistoryPreview.map((workout) => (
                            <HistoryCard
                              key={workout.workout_log_id}
                              workout={workout}
                              onPress={() => router.push(`/workout/${workout.workout_log_id}`)}
                            />
                          ))}
                        </View>
                      ) : (
                        <EmptyStateCard
                          icon="barbell-outline"
                          title="Sin sesiones recientes"
                          description="Tu historial aparecera aqui en cuanto registres entrenamientos."
                        />
                      )}
                    </View>
                  );
                }}
          />
        ) : null}

        {activeTab === 'exercises' ? (
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.exercise_id}
            style={styles.list}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: contentInsetBottom + spacing.lg },
            ]}
            ListHeaderComponent={(
              <>
                {pageHeader}
                <View
                  style={[
                    styles.listMetaRow,
                    styles.sectionShell,
                    { maxWidth: contentWidth, paddingHorizontal: horizontalPadding },
                  ]}
                >
                    <Text style={styles.listMetaTitle}>Lista completa</Text>
                    <Text style={styles.listMetaText}>
                      {filteredExercises.length} de {dashboard.exercise_summaries.length} ejercicios visibles
                    </Text>
                  </View>
              </>
            )}
            showsVerticalScrollIndicator={false}
            onScroll={tabBarScroll.onScroll}
            scrollEventThrottle={tabBarScroll.scrollEventThrottle}
            refreshControl={(
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary}
              />
            )}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.sectionShell,
                  { maxWidth: contentWidth, paddingHorizontal: horizontalPadding },
                ]}
              >
                <ExerciseCard
                  exercise={item}
                  onPress={() =>
                    router.push({
                      pathname: '/workouts/exercises/[exerciseId]',
                      params: { exerciseId: item.exercise_id, range },
                    })
                  }
                />
              </View>
            )}
            ListEmptyComponent={(
              <View
                style={[
                  styles.emptyListWrap,
                  styles.sectionShell,
                  { maxWidth: contentWidth, paddingHorizontal: horizontalPadding },
                ]}
              >
                    {!hasAnyHistory ? (
                      <EmptyStateCard
                        icon="analytics-outline"
                        title="Todavia no tienes historial"
                        description="Completa tus primeras sesiones para desbloquear esta vista."
                      />
                    ) : !hasRangeData ? (
                      <EmptyStateCard
                        icon="filter-outline"
                        title="Sin datos en este rango"
                        description="Prueba con una ventana mas amplia para recuperar progreso."
                        actionLabel="Ver todo"
                        onActionPress={() => setRange('all')}
                      />
                    ) : (
                      <EmptyStateCard
                        icon="search-outline"
                        title="Sin coincidencias"
                        description="Ajusta tu busqueda o cambia el criterio de orden."
                        actionLabel="Limpiar"
                        onActionPress={() => setExerciseSearchQuery('')}
                      />
                    )}
              </View>
            )}
          />
        ) : null}

        {activeTab === 'history' ? (
          <SectionList
            sections={historySections}
            keyExtractor={(item) => item.workout_log_id}
            style={styles.list}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: contentInsetBottom + spacing.lg },
            ]}
            ListHeaderComponent={(
              <>
                {pageHeader}
                <View
                  style={[
                    styles.listMetaRow,
                    styles.sectionShell,
                    { maxWidth: contentWidth, paddingHorizontal: horizontalPadding },
                  ]}
                >
                  <Text style={styles.listMetaTitle}>Historial completo</Text>
                  <Text style={styles.listMetaText}>
                    {historyPage?.total ?? 0} sesiones en la consulta actual
                  </Text>
                </View>
              </>
            )}
            showsVerticalScrollIndicator={false}
            onScroll={tabBarScroll.onScroll}
            scrollEventThrottle={tabBarScroll.scrollEventThrottle}
            stickySectionHeadersEnabled={false}
            refreshControl={(
              <RefreshControl
                refreshing={isRefreshing || isHistoryRefreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary}
              />
            )}
            onEndReached={handleHistoryLoadMore}
            onEndReachedThreshold={0.35}
            renderSectionHeader={({ section }) => (
              <View
                style={[
                  styles.monthHeader,
                  styles.sectionShell,
                  { maxWidth: contentWidth, paddingHorizontal: horizontalPadding },
                ]}
              >
                    <Text style={styles.monthHeaderText}>{section.title}</Text>
                  </View>
            )}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.sectionShell,
                  { maxWidth: contentWidth, paddingHorizontal: horizontalPadding },
                ]}
              >
                <HistoryCard
                  workout={item}
                  onPress={() => router.push(`/workout/${item.workout_log_id}`)}
                />
              </View>
            )}
            ListEmptyComponent={(
              <View
                style={[
                  styles.emptyListWrap,
                  styles.sectionShell,
                  { maxWidth: contentWidth, paddingHorizontal: horizontalPadding },
                ]}
              >
                    {showFullHistorySpinner ? (
                      <View style={styles.loadingHistoryWrap}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                        <Text style={styles.loadingHistoryText}>Cargando historial...</Text>
                      </View>
                    ) : historyError ? (
                      <EmptyStateCard
                        icon="cloud-offline-outline"
                        title="No fue posible cargar el historial"
                        description={historyError}
                        actionLabel="Reintentar"
                        onActionPress={() => void loadHistoryPage({ reset: true })}
                      />
                    ) : (
                      <EmptyStateCard
                        icon="calendar-clear-outline"
                        title="Sin sesiones para este filtro"
                        description="Prueba otro estado o amplía la ventana temporal."
                        actionLabel="Ver todos"
                        onActionPress={() => setHistoryStatus('all')}
                      />
                    )}
              </View>
            )}
            ListFooterComponent={(
              <View
                style={[
                  styles.historyFooter,
                  styles.sectionShell,
                  { maxWidth: contentWidth, paddingHorizontal: horizontalPadding },
                ]}
              >
                    {isHistoryLoadingMore ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : null}
                    {historyError && (historyPage?.items.length ?? 0) > 0 ? (
                      <TouchableOpacity
                        style={styles.retryFooterButton}
                        activeOpacity={0.86}
                        onPress={() => void loadHistoryPage({ skip: historyPage?.items.length ?? 0 })}
                      >
                        <Text style={styles.retryFooterText}>Reintentar carga</Text>
                      </TouchableOpacity>
                    ) : null}
              </View>
            )}
          />
        ) : null}

        <RepRangeEditorModal
          visible={isRangeEditorVisible}
          repRanges={dashboard.preferences.rep_ranges}
          isSaving={isSavingRanges}
          onClose={() => setIsRangeEditorVisible(false)}
          onSave={handleSaveRepRanges}
        />
      </SafeAreaView>
    </TabScreenWrapper>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    pageHeaderShell: {
      width: '100%',
      alignItems: 'center',
    },
    pageHeader: {
      width: '100%',
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    pageHeaderTablet: {
      paddingTop: spacing.lg,
    },
    screenIntro: {
      gap: spacing.xs,
    },
    screenEyebrow: {
      fontSize: fontSize.xs,
      fontWeight: '800',
      color: theme.colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    screenTitle: {
      fontSize: fontSize['2xl'],
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    screenSubtitle: {
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textMuted,
    },
    utilityCard: {
      gap: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderColor: theme.colors.border,
      shadowColor: 'transparent',
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
    utilityStack: {
      gap: spacing.md,
    },
    utilityGroup: {
      gap: spacing.sm,
    },
    utilityLabel: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
    },
    tabContextCard: {
      gap: spacing.xs,
      shadowColor: 'transparent',
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
    tabContextEyebrow: {
      fontSize: fontSize.xs,
      fontWeight: '800',
      color: theme.colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    tabContextTitle: {
      fontSize: fontSize.xl,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    tabContextSubtitle: {
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textMuted,
    },
    searchField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: spacing.md,
    },
    searchInput: {
      flex: 1,
      paddingVertical: spacing.md,
      fontSize: fontSize.base,
      color: theme.colors.textPrimary,
    },
    clearButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },
    inlineBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.isDark ? 'rgba(251, 191, 36, 0.12)' : '#fef3c7',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(251, 191, 36, 0.24)' : '#fde68a',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    inlineBannerText: {
      flex: 1,
      fontSize: fontSize.sm,
      color: theme.colors.textSecondary,
    },
    list: {
      flex: 1,
    },
    listContent: {
      gap: spacing.lg,
      paddingTop: spacing.xs,
    },
    sectionShell: {
      width: '100%',
      alignSelf: 'center',
    },
    sectionBlock: {
      gap: spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.md,
    },
    sectionHeaderCopy: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    sectionSubtitle: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    sectionAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    sectionActionText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: '#ffffff',
    },
    cardsStack: {
      gap: spacing.md,
    },
    featureCard: {
      gap: spacing.md,
      shadowColor: 'transparent',
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: { width: 0, height: 0 },
      elevation: 0,
    },
    featureCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.md,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    editButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    exerciseCard: {
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.md,
      gap: spacing.md,
    },
    exerciseTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    exerciseCopy: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    exerciseName: {
      fontSize: fontSize.base,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    exerciseMeta: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    exerciseSparklineWrap: {
      flexShrink: 0,
    },
    exerciseFooter: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      alignItems: 'center',
    },
    exerciseMetricPill: {
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: 2,
    },
    exerciseMetricLabel: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    exerciseMetricValue: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    deltaPill: {
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    deltaText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
    },
    historyCard: {
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.md,
      gap: spacing.md,
    },
    historyTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    historyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      flex: 1,
    },
    historyIcon: {
      width: 42,
      height: 42,
      borderRadius: borderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    historyCopy: {
      flex: 1,
      minWidth: 0,
    },
    historyName: {
      fontSize: fontSize.base,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    historyDate: {
      marginTop: 2,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      textTransform: 'capitalize',
    },
    historyStatus: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    historyStatsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    historyStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    historyStatText: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
    emptyCard: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    emptyIconWrap: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: {
      fontSize: fontSize.base,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    listMetaRow: {
      paddingTop: spacing.xs,
      gap: 2,
    },
    listMetaTitle: {
      fontSize: fontSize.lg,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    listMetaText: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    emptyListWrap: {
      paddingTop: spacing.sm,
    },
    loadingHistoryWrap: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xl,
    },
    loadingHistoryText: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    monthHeader: {
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
    },
    monthHeaderText: {
      fontSize: fontSize.sm,
      fontWeight: '800',
      color: theme.colors.textSecondary,
      textTransform: 'capitalize',
    },
    historyFooter: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    retryFooterButton: {
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    retryFooterText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    fullStateShell: {
      flex: 1,
      justifyContent: 'center',
    },
  });
