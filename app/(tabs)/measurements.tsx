import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, FloatingButton, LoadingSpinner, TabScreenWrapper } from '../../src/components/common';
import {
  MeasurementDetailModal,
  MeasurementFormModal,
} from '../../src/components/measurements';
import {
  CALCULATION_METADATA,
  getMeasurementProgressMetricConfig,
  type MeasurementProgressMetricKey,
  PERIMETER_CARD_FIELDS,
  RECENT_CALCULATION_CODES,
  SUMMARY_METRICS,
} from '../../src/constants/measurements';
import {
  borderRadius,
  fontSize,
  shadows,
  spacing,
} from '../../src/constants/colors';
import {
  createMyMeasurement,
  getMyMeasurementDetail,
  listMyMeasurements,
} from '../../src/services/measurements';
import { useBottomTabBarContentInset, useBottomTabBarScroll } from '../../src/hooks/useBottomTabBarVisibility';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../src/theme';
import type {
  ApiError,
  CreateOwnMeasurementPayload,
  MeasurementDetail,
  MeasurementHistoryItem,
  MeasurementPagination,
} from '../../src/types';
import {
  calculateMeasurementChange,
  formatMeasurementDate,
  formatMeasurementNumber,
  getMeasurementDisplayDate,
  parseMeasurementNumber,
} from '../../src/utils/measurements';
import { convertMeasurementUnitValue } from '../../src/utils/measurementUnits';
import {
  MEASUREMENT_PREFERENCE_LABELS,
  useMeasurementPreferenceStore,
} from '../../src/store/measurementPreferenceStore';

const HISTORY_PAGE_SIZE = 20;

const getChangeAppearance = (
  change: number | null,
  emphasizeDecrease: boolean,
  theme: AppTheme,
) => {
  if (change === null || change === 0) {
    return {
      icon: 'remove-outline' as const,
      color: theme.colors.iconMuted,
    };
  }

  const isPositive = change > 0;
  const isGoodChange = emphasizeDecrease ? !isPositive : isPositive;

  return {
    icon: isPositive ? ('arrow-up-outline' as const) : ('arrow-down-outline' as const),
    color: isGoodChange ? theme.colors.success : theme.colors.warning,
  };
};

export default function MeasurementsScreen() {
  const isFocused = useIsFocused();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const tabBarScroll = useBottomTabBarScroll();
  const contentInsetBottom = useBottomTabBarContentInset(72);
  const measurementPreference = useMeasurementPreferenceStore((state) => state.preference);
  const initializeMeasurementPreference = useMeasurementPreferenceStore((state) => state.initialize);
  const wasFocusedRef = useRef(false);
  const [measurements, setMeasurements] = useState<MeasurementHistoryItem[]>([]);
  const [pagination, setPagination] = useState<MeasurementPagination | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, MeasurementDetail>>({});
  const [hasLoadedMeasurements, setHasLoadedMeasurements] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestMeasurement = measurements[0] ?? null;
  const latestMeasurementDetail = latestMeasurement
    ? detailCache[latestMeasurement.id] ?? null
    : null;
  const selectedMeasurementDetail = selectedMeasurementId
    ? detailCache[selectedMeasurementId] ?? null
    : null;

  const loadMeasurements = useCallback(
    async ({ page = 1, append = false }: { page?: number; append?: boolean } = {}) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setError(null);
      }

      try {
        const response = await listMyMeasurements(page, HISTORY_PAGE_SIZE);

        setMeasurements((currentMeasurements) =>
          append ? [...currentMeasurements, ...response.data] : response.data,
        );
        setPagination(response.pagination);

        if (!append) {
          const latest = response.data[0];
          setDetailCache({});

          if (latest) {
            const detail = await getMyMeasurementDetail(latest.id);
            setDetailCache({ [latest.id]: detail });
          }
        }
      } catch (loadError) {
        const apiError = loadError as ApiError;
        setError(apiError.message || 'No fue posible cargar tus medidas.');
      } finally {
        setHasLoadedMeasurements(true);
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadMeasurements();
  }, [loadMeasurements]);

  useEffect(() => {
    void initializeMeasurementPreference();
  }, [initializeMeasurementPreference]);

  useEffect(() => {
    if (!isFocused) {
      wasFocusedRef.current = false;
      setIsDetailVisible(false);
      setSelectedMeasurementId(null);
      setIsDetailLoading(false);
      setIsFormVisible(false);
      return;
    }

    const didRegainFocus = !wasFocusedRef.current;
    wasFocusedRef.current = true;

    if (didRegainFocus && ((!hasLoadedMeasurements && !isLoading) || error)) {
      setIsLoading(true);
      void loadMeasurements();
    }
  }, [error, hasLoadedMeasurements, isFocused, isLoading, loadMeasurements]);

  const summaryMetrics = useMemo(() => {
    if (!latestMeasurement) {
      return [];
    }

    return SUMMARY_METRICS.map((metric) => ({
      ...metric,
      value: parseMeasurementNumber(latestMeasurement[metric.key]),
      change: calculateMeasurementChange(measurements, metric.key),
    }));
  }, [latestMeasurement, measurements]);

  const perimeterCards = useMemo(() => {
    if (!latestMeasurement) {
      return [];
    }

    return PERIMETER_CARD_FIELDS.map((field) => ({
      ...field,
      value: parseMeasurementNumber(latestMeasurement[field.key]),
    })).filter((field) => field.value !== null);
  }, [latestMeasurement]);

  const recentCalculations = useMemo(() => {
    if (!latestMeasurementDetail) {
      return [];
    }

    return RECENT_CALCULATION_CODES.map((code) => {
      const calculation = latestMeasurementDetail.calculations[code];

      if (!calculation || calculation.status !== 'computed' || calculation.value === null) {
        return null;
      }

      return {
        code,
        label: CALCULATION_METADATA[code]?.label ?? code,
        value: calculation.value,
        unit: calculation.unit,
      };
    }).filter(Boolean) as Array<{
      code: string;
      label: string;
      value: number;
      unit: string | null;
    }>;
  }, [latestMeasurementDetail]);

  const getDisplayMeasurement = useCallback(
    (value: unknown, unit?: string | null, decimals = 1) => {
      const numericValue = parseMeasurementNumber(value);

      if (numericValue === null) {
        return {
          value: '--',
          unit: unit?.trim() ?? null,
        };
      }

      const convertedValue = convertMeasurementUnitValue(
        numericValue,
        unit,
        measurementPreference,
      );

      return {
        value: formatMeasurementNumber(
          convertedValue.value,
          convertedValue.unit === '%' ? 1 : decimals,
        ),
        unit: convertedValue.unit,
      };
    },
    [measurementPreference],
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadMeasurements();
  }, [loadMeasurements]);

  const handleLoadMore = useCallback(async () => {
    if (!pagination || measurements.length >= pagination.total || isLoadingMore) {
      return;
    }

    await loadMeasurements({
      page: pagination.page + 1,
      append: true,
    });
  }, [isLoadingMore, loadMeasurements, measurements.length, pagination]);

  const handleOpenMeasurementProgress = useCallback((metricKey: MeasurementProgressMetricKey) => {
    router.push({
      pathname: '/measurements/progress/[metric]',
      params: { metric: metricKey },
    });
  }, []);

  const openMeasurementDetail = useCallback(async (measurementId: string) => {
    setSelectedMeasurementId(measurementId);
    setIsDetailVisible(true);

    if (detailCache[measurementId]) {
      return;
    }

    setIsDetailLoading(true);

    try {
      const detail = await getMyMeasurementDetail(measurementId);
      setDetailCache((currentCache) => ({
        ...currentCache,
        [measurementId]: detail,
      }));
    } catch (detailError) {
      const apiError = detailError as ApiError;
      setIsDetailVisible(false);
      Alert.alert('Error', apiError.message || 'No fue posible cargar el detalle.');
    } finally {
      setIsDetailLoading(false);
    }
  }, [detailCache]);

  const handleCloseDetail = useCallback(() => {
    setIsDetailVisible(false);
    setSelectedMeasurementId(null);
    setIsDetailLoading(false);
  }, []);

  const handleCreateMeasurement = useCallback(
    async (payload: CreateOwnMeasurementPayload) => {
      setIsSubmitting(true);

      try {
        await createMyMeasurement(payload);
        setIsFormVisible(false);
        await loadMeasurements();
        Alert.alert('Medicion registrada', 'Tus medidas se actualizaron correctamente.');
      } catch (saveError) {
        const apiError = saveError as ApiError;
        Alert.alert('Error', apiError.message || 'No fue posible guardar la medicion.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadMeasurements],
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Cargando tus medidas..." />;
  }

  return (
    <TabScreenWrapper>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Medidas</Text>
            <Text style={styles.subtitle}>Control antropometrico con datos reales</Text>
            <Text style={styles.preferenceText}>
              Unidades: {MEASUREMENT_PREFERENCE_LABELS[measurementPreference]}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentInsetBottom }]}
          onScroll={tabBarScroll.onScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          scrollEventThrottle={tabBarScroll.scrollEventThrottle}
        >
          {error ? (
            <Card style={styles.errorCard}>
              <Text style={styles.errorTitle}>No fue posible cargar tus medidas</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Button title="Reintentar" onPress={() => void loadMeasurements()} />
            </Card>
          ) : null}

          {!error && !latestMeasurement ? (
            <Card style={styles.emptyCard}>
              <Ionicons name="analytics-outline" size={44} color={theme.colors.iconMuted} />
              <Text style={styles.emptyTitle}>Todavia no tienes mediciones registradas</Text>
              <Text style={styles.emptyText}>
                Captura tu primer registro para empezar a ver peso, composicion y perimetros.
              </Text>
              <Button
                title="Registrar mi primera medicion"
                onPress={() => setIsFormVisible(true)}
                icon={<Ionicons name="add-outline" size={18} color="#ffffff" />}
              />
            </Card>
          ) : null}

          {latestMeasurement ? (
            <>
            <View style={styles.mainStatsContainer}>
              {summaryMetrics.map((metric, index) => {
                const progressConfig = getMeasurementProgressMetricConfig(metric.key);
                const appearance = getChangeAppearance(
                  metric.change,
                  metric.emphasizeDecrease ?? false,
                  theme,
                );
                const displayValue = getDisplayMeasurement(
                  metric.value,
                  metric.unit,
                  metric.unit === '%' ? 1 : 1,
                );
                const displayChange = metric.change === null
                  ? null
                  : getDisplayMeasurement(Math.abs(metric.change), metric.unit, 2);

                const content = (
                  <>
                    <View style={styles.summaryCardHeader}>
                      <View style={styles.summaryIcon}>
                        <Ionicons
                          name={metric.icon as keyof typeof Ionicons.glyphMap}
                          size={20}
                          color={theme.colors.primary}
                        />
                      </View>
                      {progressConfig ? (
                        <View style={styles.metricActionPill}>
                          <Ionicons
                            name="analytics-outline"
                            size={12}
                            color={theme.colors.primary}
                          />
                          <Text style={styles.metricActionText}>Ver grafica</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.summaryLabel}>{metric.label}</Text>
                    <Text style={styles.summaryValue}>
                      {displayValue.value}
                      {metric.value !== null && displayValue.unit ? (
                        <Text style={styles.summaryUnit}> {displayValue.unit}</Text>
                      ) : null}
                    </Text>
                    {metric.change !== null ? (
                      <View
                        style={[
                          styles.changeBadge,
                          { backgroundColor: `${appearance.color}15` },
                        ]}
                      >
                        <Ionicons
                          name={appearance.icon}
                          size={12}
                          color={appearance.color}
                        />
                        <Text style={[styles.changeText, { color: appearance.color }]}>
                          {displayChange?.value} {displayChange?.unit}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.noChangeText}>Sin comparativo previo</Text>
                    )}
                    {progressConfig ? (
                      <Text style={styles.summaryHelperText}>
                        Toca para ver el progreso completo.
                      </Text>
                    ) : null}
                  </>
                );

                if (!progressConfig) {
                  return (
                    <View
                      key={metric.key}
                      style={[
                        styles.summaryCard,
                        index === 0 ? styles.summaryCardLarge : null,
                      ]}
                    >
                      {content}
                    </View>
                  );
                }

                return (
                  <TouchableOpacity
                    key={metric.key}
                    style={[
                      styles.summaryCard,
                      index === 0 ? styles.summaryCardLarge : null,
                      styles.metricCardInteractive,
                    ]}
                    activeOpacity={0.92}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver progreso de ${metric.label.toLowerCase()}`}
                    onPress={() => handleOpenMeasurementProgress(progressConfig.key)}
                  >
                    {content}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.lastUpdate}>
              Ultima actualizacion: {formatMeasurementDate(
                getMeasurementDisplayDate(latestMeasurement),
                'long',
              )}
            </Text>

            {latestMeasurementDetail ? (
              <Card style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderContent}>
                    <Text style={styles.sectionTitle}>Indicadores calculados</Text>
                    <Text style={styles.sectionDescription}>
                      Resumen derivado del registro mas reciente.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.sectionHeaderAction}
                    onPress={() => void openMeasurementDetail(latestMeasurement.id)}
                  >
                    <Text style={styles.sectionLink}>Ver detalle</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.calculationGrid}>
                  {recentCalculations.map((calculation) => {
                    const progressConfig = getMeasurementProgressMetricConfig(calculation.code);
                    const displayValue = getDisplayMeasurement(
                      calculation.value,
                      calculation.unit,
                      calculation.unit ? 2 : 3,
                    );

                    const content = (
                      <>
                        <View style={styles.metricChipHeader}>
                          <Text style={styles.calculationChipLabel}>{calculation.label}</Text>
                          {progressConfig ? (
                            <View style={styles.metricActionPill}>
                              <Ionicons
                                name="analytics-outline"
                                size={12}
                                color={theme.colors.primary}
                              />
                              <Text style={styles.metricActionText}>Ver grafica</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.calculationChipValue}>
                          {displayValue.value}
                          {displayValue.unit ? (
                            <Text style={styles.calculationChipUnit}> {displayValue.unit}</Text>
                          ) : null}
                        </Text>
                      </>
                    );

                    if (!progressConfig) {
                      return (
                        <View key={calculation.code} style={styles.calculationChip}>
                          {content}
                        </View>
                      );
                    }

                    return (
                      <TouchableOpacity
                        key={calculation.code}
                        style={[styles.calculationChip, styles.metricCardInteractive]}
                        activeOpacity={0.9}
                        accessibilityRole="button"
                        accessibilityLabel={`Ver progreso de ${calculation.label.toLowerCase()}`}
                        onPress={() => handleOpenMeasurementProgress(progressConfig.key)}
                      >
                        {content}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.analysisMeta}>
                  <Text style={styles.analysisMetaText}>
                    Estado: {latestMeasurementDetail.calculationRun?.status ?? 'sin calculo'}
                  </Text>
                  <Text style={styles.analysisMetaText}>
                    Advertencias: {latestMeasurementDetail.warnings.length}
                  </Text>
                </View>
              </Card>
            ) : null}

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Perimetros corporales</Text>
              <Text style={styles.sectionDescription}>
                Se muestran unicamente las medidas disponibles del ultimo registro.
              </Text>
              <View style={styles.perimeterGrid}>
                {perimeterCards.map((field) => {
                  const progressConfig = getMeasurementProgressMetricConfig(field.key);
                  const displayValue = getDisplayMeasurement(field.value, field.unit, 1);

                  return (
                    <TouchableOpacity
                      key={field.key}
                      style={[styles.perimeterCard, styles.metricCardInteractive]}
                      activeOpacity={0.9}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver progreso de ${field.label.toLowerCase()}`}
                      onPress={() => progressConfig && handleOpenMeasurementProgress(progressConfig.key)}
                    >
                      <View style={styles.metricChipHeader}>
                        <Ionicons
                          name={(field.icon ?? 'body-outline') as keyof typeof Ionicons.glyphMap}
                          size={18}
                          color={theme.colors.iconMuted}
                        />
                        <View style={styles.metricActionPill}>
                          <Ionicons
                            name="analytics-outline"
                            size={12}
                            color={theme.colors.primary}
                          />
                          <Text style={styles.metricActionText}>Ver grafica</Text>
                        </View>
                      </View>
                      <Text style={styles.perimeterLabel}>{field.label}</Text>
                      <Text style={styles.perimeterValue}>
                        {displayValue.value}
                        {displayValue.unit ? (
                          <Text style={styles.perimeterUnit}> {displayValue.unit}</Text>
                        ) : null}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>

            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderContent}>
                  <Text style={styles.sectionTitle}>Historial</Text>
                  <Text style={styles.sectionDescription}>
                    {pagination?.total ?? measurements.length} registros disponibles.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.sectionHeaderAction}
                  onPress={() => setIsFormVisible(true)}
                >
                  <Text style={styles.sectionLink}>Registrar nueva</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.historyList}>
                {measurements.map((measurement) => (
                  <TouchableOpacity
                    key={measurement.id}
                    style={styles.historyCard}
                    activeOpacity={0.8}
                    onPress={() => void openMeasurementDetail(measurement.id)}
                  >
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyDate}>
                        {formatMeasurementDate(
                          getMeasurementDisplayDate(measurement),
                          'short',
                        )}
                      </Text>
                      <Ionicons
                        name="chevron-forward-outline"
                        size={18}
                        color={theme.colors.iconMuted}
                      />
                    </View>

                    <View style={styles.historyMetricsRow}>
                      {SUMMARY_METRICS.map((metric) => {
                        const value = parseMeasurementNumber(measurement[metric.key]);

                        if (value === null) {
                          return null;
                        }

                        const displayValue = getDisplayMeasurement(
                          value,
                          metric.unit,
                          metric.unit === '%' ? 1 : 1,
                        );

                        return (
                          <View key={`${measurement.id}-${metric.key}`} style={styles.historyMetric}>
                            <Text style={styles.historyMetricLabel}>{metric.label}</Text>
                            <Text style={styles.historyMetricValue}>
                              {displayValue.value}
                              {displayValue.unit ? (
                                <Text style={styles.historyMetricUnit}> {displayValue.unit}</Text>
                              ) : null}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    {measurement.notes ? (
                      <Text style={styles.historyNote} numberOfLines={2}>
                        {measurement.notes}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>

              {pagination && measurements.length < pagination.total ? (
                <Button
                  title="Cargar mas"
                  onPress={() => void handleLoadMore()}
                  variant="secondary"
                  isLoading={isLoadingMore}
                />
              ) : null}
            </Card>
            </>
          ) : null}
        </ScrollView>

        <FloatingButton
          accessibilityLabel="Registrar nueva medicion"
          icon={<Ionicons name="add-outline" size={28} color="#ffffff" />}
          onPress={() => setIsFormVisible(true)}
        />

        <MeasurementDetailModal
          visible={isFocused && isDetailVisible}
          detail={selectedMeasurementDetail}
          isLoading={isDetailLoading}
          onClose={handleCloseDetail}
        />

        <MeasurementFormModal
          visible={isFocused && isFormVisible}
          isSubmitting={isSubmitting}
          onClose={() => setIsFormVisible(false)}
          onSubmit={handleCreateMeasurement}
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
    header: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      backgroundColor: theme.colors.background,
    },
    headerCopy: {
      flex: 1,
    },
    title: {
      fontSize: fontSize['2xl'],
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    preferenceText: {
      marginTop: spacing.xs,
      fontSize: fontSize.xs,
      color: theme.colors.iconMuted,
    },
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    errorCard: {
      marginBottom: spacing.md,
    },
    errorTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    errorText: {
      marginTop: spacing.sm,
      marginBottom: spacing.md,
      fontSize: fontSize.sm,
      color: theme.colors.textSecondary,
    },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.md,
    },
    emptyTitle: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    mainStatsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    summaryCard: {
      width: '48%',
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.md,
      ...shadows.md,
    },
    summaryCardLarge: {
      width: '100%',
    },
    summaryCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    summaryIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },
    metricCardInteractive: {
      borderColor: theme.colors.primaryBorder,
    },
    metricChipHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    metricActionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primarySoft,
    },
    metricActionText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    summaryLabel: {
      marginTop: spacing.sm,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    summaryValue: {
      marginTop: spacing.xs,
      fontSize: 30,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    summaryUnit: {
      fontSize: fontSize.base,
      fontWeight: '400',
      color: theme.colors.textMuted,
    },
    changeBadge: {
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.full,
    },
    changeText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
    },
    noChangeText: {
      marginTop: spacing.sm,
      fontSize: fontSize.xs,
      color: theme.colors.iconMuted,
    },
    summaryHelperText: {
      marginTop: spacing.sm,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
    lastUpdate: {
      marginTop: spacing.md,
      marginBottom: spacing.lg,
      textAlign: 'center',
      fontSize: fontSize.xs,
      color: theme.colors.iconMuted,
    },
    sectionCard: {
      marginBottom: spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    sectionHeaderContent: {
      flex: 1,
      paddingRight: spacing.sm,
    },
    sectionHeaderAction: {
      flexShrink: 0,
      alignSelf: 'flex-start',
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    sectionDescription: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    sectionLink: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    calculationGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    calculationChip: {
      width: '48%',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    calculationChipLabel: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
    calculationChipValue: {
      marginTop: spacing.xs,
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    calculationChipUnit: {
      fontSize: fontSize.sm,
      fontWeight: '400',
      color: theme.colors.textMuted,
    },
    analysisMeta: {
      marginTop: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    analysisMetaText: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
    perimeterGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    perimeterCard: {
      width: '48%',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    perimeterLabel: {
      marginTop: spacing.xs,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
    perimeterValue: {
      marginTop: 2,
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    perimeterUnit: {
      fontSize: fontSize.xs,
      fontWeight: '400',
      color: theme.colors.iconMuted,
    },
    historyList: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    historyCard: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    historyDate: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    historyMetricsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    historyMetric: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    historyMetricLabel: {
      fontSize: 10,
      color: theme.colors.textMuted,
    },
    historyMetricValue: {
      marginTop: 2,
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    historyMetricUnit: {
      fontSize: fontSize.xs,
      fontWeight: '400',
      color: theme.colors.textMuted,
    },
    historyNote: {
      marginTop: spacing.sm,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
  });
