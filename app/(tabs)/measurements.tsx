import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Button, Card, LoadingSpinner } from '../../src/components/common';
import {
  MeasurementDetailModal,
  MeasurementFormModal,
} from '../../src/components/measurements';
import {
  CALCULATION_METADATA,
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
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [measurements, setMeasurements] = useState<MeasurementHistoryItem[]>([]);
  const [pagination, setPagination] = useState<MeasurementPagination | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, MeasurementDetail>>({});
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Medidas</Text>
          <Text style={styles.subtitle}>Control antropometrico con datos reales</Text>
        </View>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => setIsFormVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add-outline" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
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
                const appearance = getChangeAppearance(
                  metric.change,
                  metric.emphasizeDecrease ?? false,
                  theme,
                );

                return (
                  <View
                    key={metric.key}
                    style={[
                      styles.summaryCard,
                      index === 0 ? styles.summaryCardLarge : null,
                    ]}
                  >
                    <View style={styles.summaryIcon}>
                      <Ionicons
                        name={metric.icon as keyof typeof Ionicons.glyphMap}
                        size={20}
                        color={theme.colors.primary}
                      />
                    </View>
                    <Text style={styles.summaryLabel}>{metric.label}</Text>
                    <Text style={styles.summaryValue}>
                      {metric.value === null
                        ? '--'
                        : formatMeasurementNumber(metric.value, metric.unit === '%' ? 1 : 1)}
                      {metric.value !== null ? (
                        <Text style={styles.summaryUnit}> {metric.unit}</Text>
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
                          {formatMeasurementNumber(Math.abs(metric.change), 2)} {metric.unit}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.noChangeText}>Sin comparativo previo</Text>
                    )}
                  </View>
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
              {recentCalculations.map((calculation) => (
                <View key={calculation.code} style={styles.calculationChip}>
                      <Text style={styles.calculationChipLabel}>{calculation.label}</Text>
                      <Text style={styles.calculationChipValue}>
                        {formatMeasurementNumber(
                          calculation.value,
                          calculation.unit ? 2 : 3,
                        )}
                        {calculation.unit ? (
                          <Text style={styles.calculationChipUnit}> {calculation.unit}</Text>
                        ) : null}
                      </Text>
                    </View>
                  ))}
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
                {perimeterCards.map((field) => (
                  <View key={field.key} style={styles.perimeterCard}>
                    <Ionicons
                      name={(field.icon ?? 'body-outline') as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={theme.colors.iconMuted}
                    />
                    <Text style={styles.perimeterLabel}>{field.label}</Text>
                    <Text style={styles.perimeterValue}>
                      {formatMeasurementNumber(field.value, 1)}
                      <Text style={styles.perimeterUnit}> {field.unit}</Text>
                    </Text>
                  </View>
                ))}
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

                        return (
                          <View key={`${measurement.id}-${metric.key}`} style={styles.historyMetric}>
                            <Text style={styles.historyMetricLabel}>{metric.label}</Text>
                            <Text style={styles.historyMetricValue}>
                              {formatMeasurementNumber(value, metric.unit === '%' ? 1 : 1)}
                              <Text style={styles.historyMetricUnit}> {metric.unit}</Text>
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

      <MeasurementDetailModal
        visible={isDetailVisible}
        detail={selectedMeasurementDetail}
        isLoading={isDetailLoading}
        onClose={handleCloseDetail}
      />

      <MeasurementFormModal
        visible={isFormVisible}
        isSubmitting={isSubmitting}
        onClose={() => setIsFormVisible(false)}
        onSubmit={handleCreateMeasurement}
      />
    </SafeAreaView>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      backgroundColor: theme.colors.background,
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
    headerAction: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      ...shadows.md,
    },
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl + 60,
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
    summaryIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
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
