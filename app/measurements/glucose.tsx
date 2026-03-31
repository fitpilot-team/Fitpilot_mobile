import React, { useCallback, useEffect, useState } from 'react';
import { router } from 'expo-router';
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
import {
  Button,
  Card,
  FloatingButton,
  LoadingSpinner,
} from '../../src/components/common';
import {
  GlucoseDetailModal,
  GlucoseFormModal,
} from '../../src/components/health-metrics';
import { GLUCOSE_CONTEXT_LABELS } from '../../src/constants/healthMetrics';
import { borderRadius, fontSize, spacing } from '../../src/constants/colors';
import {
  createMyGlucoseRecord,
  deleteMyGlucoseRecord,
  getMyGlucoseRecord,
  listMyGlucoseRecords,
  updateMyGlucoseRecord,
} from '../../src/services/healthMetrics';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../src/theme';
import type {
  ApiError,
  CreateOwnGlucosePayload,
  GlucosePagination,
  GlucoseRecord,
} from '../../src/types';
import { formatMeasurementNumber } from '../../src/utils/measurements';
import {
  formatGlucoseRecordedAt,
  hasAdditionalHealthMetrics,
} from '../../src/utils/healthMetrics';

const HISTORY_PAGE_SIZE = 20;

const toRecordMap = (records: GlucoseRecord[]) =>
  Object.fromEntries(records.map((record) => [record.id, record]));

export default function GlucoseScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [records, setRecords] = useState<GlucoseRecord[]>([]);
  const [pagination, setPagination] = useState<GlucosePagination | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, GlucoseRecord>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestRecord = records[0] ?? null;
  const selectedRecord = selectedRecordId
    ? detailCache[selectedRecordId] ??
      records.find((record) => record.id === selectedRecordId) ??
      null
    : null;
  const editingRecord = editingRecordId
    ? detailCache[editingRecordId] ??
      records.find((record) => record.id === editingRecordId) ??
      null
    : null;

  const loadRecords = useCallback(
    async (
      options: { page?: number; append?: boolean; refresh?: boolean } = {},
    ) => {
      const { page = 1, append = false, refresh = false } = options;

      if (append) {
        setIsLoadingMore(true);
      } else if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await listMyGlucoseRecords(page, HISTORY_PAGE_SIZE);

        setRecords((currentRecords) =>
          append ? [...currentRecords, ...response.data] : response.data,
        );
        setPagination(response.pagination);
        setDetailCache((currentCache) =>
          append
            ? {
                ...currentCache,
                ...toRecordMap(response.data),
              }
            : toRecordMap(response.data),
        );
        setError(null);
      } catch (loadError) {
        const apiError = loadError as ApiError;
        setError(apiError.message || 'No fue posible cargar tus glucosas.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const handleRefresh = useCallback(async () => {
    await loadRecords({ refresh: true });
  }, [loadRecords]);

  const handleLoadMore = useCallback(async () => {
    if (!pagination || records.length >= pagination.total || isLoadingMore) {
      return;
    }

    await loadRecords({
      page: pagination.page + 1,
      append: true,
    });
  }, [isLoadingMore, loadRecords, pagination, records.length]);

  const openDetail = useCallback(
    async (recordId: string) => {
      setSelectedRecordId(recordId);
      setIsDetailVisible(true);

      if (detailCache[recordId]) {
        return;
      }

      setIsDetailLoading(true);

      try {
        const detail = await getMyGlucoseRecord(recordId);
        setDetailCache((currentCache) => ({
          ...currentCache,
          [recordId]: detail,
        }));
      } catch (detailError) {
        const apiError = detailError as ApiError;
        setIsDetailVisible(false);
        Alert.alert(
          'Error',
          apiError.message || 'No fue posible cargar el detalle.',
        );
      } finally {
        setIsDetailLoading(false);
      }
    },
    [detailCache],
  );

  const handleCloseDetail = useCallback(() => {
    setIsDetailVisible(false);
    setSelectedRecordId(null);
    setIsDetailLoading(false);
  }, []);

  const handleOpenCreateForm = useCallback(() => {
    setEditingRecordId(null);
    setIsFormVisible(true);
  }, []);

  const handleOpenEditForm = useCallback(() => {
    if (!selectedRecord) {
      return;
    }

    setEditingRecordId(selectedRecord.id);
    setIsDetailVisible(false);
    setIsFormVisible(true);
  }, [selectedRecord]);

  const handleCloseForm = useCallback(() => {
    setIsFormVisible(false);
    setEditingRecordId(null);
  }, []);

  const handleSubmit = useCallback(
    async (payload: CreateOwnGlucosePayload) => {
      setIsSubmitting(true);

      try {
        const savedRecord = editingRecordId
          ? await updateMyGlucoseRecord(editingRecordId, payload)
          : await createMyGlucoseRecord(payload);

        setDetailCache((currentCache) => ({
          ...currentCache,
          [savedRecord.id]: savedRecord,
        }));
        setIsFormVisible(false);
        setEditingRecordId(null);
        setSelectedRecordId(savedRecord.id);
        await loadRecords();
        Alert.alert(
          editingRecordId ? 'Glucosa actualizada' : 'Glucosa registrada',
          editingRecordId
            ? 'Tu lectura se actualizo correctamente.'
            : 'Tu lectura se guardo correctamente.',
        );
      } catch (saveError) {
        const apiError = saveError as ApiError;
        Alert.alert(
          'Error',
          apiError.message || 'No fue posible guardar la glucosa.',
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingRecordId, loadRecords],
  );

  const confirmDelete = useCallback(async () => {
    if (!selectedRecordId) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteMyGlucoseRecord(selectedRecordId);
      setDetailCache((currentCache) => {
        const nextCache = { ...currentCache };
        delete nextCache[selectedRecordId];
        return nextCache;
      });
      setIsDetailVisible(false);
      setSelectedRecordId(null);
      await loadRecords();
      Alert.alert(
        'Registro eliminado',
        'La lectura se elimino correctamente.',
      );
    } catch (deleteError) {
      const apiError = deleteError as ApiError;
      Alert.alert(
        'Error',
        apiError.message || 'No fue posible eliminar la lectura.',
      );
    } finally {
      setIsDeleting(false);
    }
  }, [loadRecords, selectedRecordId]);

  const handleDelete = useCallback(() => {
    if (!selectedRecord) {
      return;
    }

    if (hasAdditionalHealthMetrics(selectedRecord)) {
      Alert.alert(
        'Eliminacion no disponible',
        'Este registro tambien incluye otras metricas clinicas y no puede eliminarse desde la app.',
      );
      return;
    }

    Alert.alert(
      'Eliminar registro',
      'Esta accion eliminara tu lectura de glucosa.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void confirmDelete();
          },
        },
      ],
    );
  }, [confirmDelete, selectedRecord]);

  const latestRecordContext = latestRecord?.glucose_context
    ? GLUCOSE_CONTEXT_LABELS[latestRecord.glucose_context]
    : 'Sin contexto';
  const latestRecordMixed = hasAdditionalHealthMetrics(latestRecord);

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Cargando tus glucosas..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.88}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={theme.colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Glucosa</Text>
          <Text style={styles.subtitle}>
            Registra tus lecturas para que tu nutriologo vea tu tendencia real.
          </Text>
        </View>
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
            <Text style={styles.errorTitle}>
              No fue posible cargar tus glucosas
            </Text>
            <Text style={styles.errorText}>{error}</Text>
            <Button title="Reintentar" onPress={() => void loadRecords()} />
          </Card>
        ) : null}

        {latestRecord ? (
          <Card style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroIcon}>
                <Ionicons
                  name="water-outline"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              {latestRecordMixed ? (
                <View style={styles.mixedBadge}>
                  <Text style={styles.mixedBadgeText}>Registro mixto</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.heroEyebrow}>Ultimo registro</Text>
            <Text style={styles.heroValue}>
              {formatMeasurementNumber(latestRecord.glucose_mg_dl, 0)}
              <Text style={styles.heroUnit}> mg/dL</Text>
            </Text>
            <Text style={styles.heroContext}>{latestRecordContext}</Text>
            <Text style={styles.heroDate}>
              {formatGlucoseRecordedAt(latestRecord.recorded_at, 'short')}
            </Text>
            {latestRecord.notes ? (
              <Text style={styles.heroNote} numberOfLines={2}>
                {latestRecord.notes}
              </Text>
            ) : null}
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <Ionicons
              name="water-outline"
              size={42}
              color={theme.colors.iconMuted}
            />
            <Text style={styles.emptyTitle}>
              Todavia no tienes glucosas registradas
            </Text>
            <Text style={styles.emptyText}>
              Guarda tu primera lectura para compartir el seguimiento con tu
              nutriologo.
            </Text>
            <Button
              title="Registrar mi primera glucosa"
              onPress={handleOpenCreateForm}
              icon={<Ionicons name="add-outline" size={18} color="#ffffff" />}
            />
          </Card>
        )}

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.sectionTitle}>Historial</Text>
              <Text style={styles.sectionDescription}>
                {pagination?.total ?? records.length} registros disponibles.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.sectionAction}
              onPress={handleOpenCreateForm}
            >
              <Text style={styles.sectionActionText}>Registrar nueva</Text>
            </TouchableOpacity>
          </View>

          {records.length > 0 ? (
            <View style={styles.historyList}>
              {records.map((record) => {
                const mixedRecord = hasAdditionalHealthMetrics(record);

                return (
                  <TouchableOpacity
                    key={record.id}
                    style={styles.historyCard}
                    activeOpacity={0.86}
                    onPress={() => void openDetail(record.id)}
                  >
                    <View style={styles.historyHeader}>
                      <Text style={styles.historyValue}>
                        {formatMeasurementNumber(record.glucose_mg_dl, 0)} mg/dL
                      </Text>
                      <Ionicons
                        name="chevron-forward-outline"
                        size={18}
                        color={theme.colors.iconMuted}
                      />
                    </View>
                    <Text style={styles.historyMeta}>
                      {record.glucose_context
                        ? GLUCOSE_CONTEXT_LABELS[record.glucose_context]
                        : 'Sin contexto'}
                      {' - '}
                      {formatGlucoseRecordedAt(record.recorded_at, 'short')}
                    </Text>
                    {record.notes ? (
                      <Text style={styles.historyNote} numberOfLines={2}>
                        {record.notes}
                      </Text>
                    ) : null}
                    {mixedRecord ? (
                      <View style={styles.historyBadge}>
                        <Text style={styles.historyBadgeText}>
                          Incluye otras metricas clinicas
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.historyEmpty}>
              Cuando registres lecturas, aqui aparecera el historial completo.
            </Text>
          )}

          {pagination && records.length < pagination.total ? (
            <Button
              title="Cargar mas"
              onPress={() => void handleLoadMore()}
              variant="secondary"
              isLoading={isLoadingMore}
            />
          ) : null}
        </Card>
      </ScrollView>

      <FloatingButton
        accessibilityLabel="Registrar nueva glucosa"
        icon={<Ionicons name="add-outline" size={28} color="#ffffff" />}
        onPress={handleOpenCreateForm}
        bottomOffset={18}
      />

      <GlucoseDetailModal
        visible={isDetailVisible}
        record={selectedRecord}
        isLoading={isDetailLoading}
        isDeleting={isDeleting}
        onClose={handleCloseDetail}
        onEdit={handleOpenEditForm}
        onDelete={handleDelete}
      />

      <GlucoseFormModal
        visible={isFormVisible}
        isSubmitting={isSubmitting}
        initialRecord={editingRecord}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
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
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: 120,
      gap: spacing.md,
    },
    errorCard: {
      marginTop: spacing.sm,
    },
    errorTitle: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    errorText: {
      marginTop: spacing.sm,
      marginBottom: spacing.md,
      fontSize: fontSize.sm,
      color: theme.colors.textSecondary,
    },
    heroCard: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    heroIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    mixedBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
      backgroundColor: `${theme.colors.warning}15`,
    },
    mixedBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.warning,
    },
    heroEyebrow: {
      marginTop: spacing.md,
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    heroValue: {
      marginTop: spacing.sm,
      fontSize: 34,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    heroUnit: {
      fontSize: fontSize.lg,
      fontWeight: '500',
      color: theme.colors.textMuted,
    },
    heroContext: {
      marginTop: spacing.sm,
      fontSize: fontSize.base,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    heroDate: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    heroNote: {
      marginTop: spacing.md,
      fontSize: fontSize.sm,
      lineHeight: 20,
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
    sectionCard: {
      marginBottom: spacing.sm,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    sectionHeaderCopy: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    sectionDescription: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    sectionAction: {
      flexShrink: 0,
      alignSelf: 'flex-start',
    },
    sectionActionText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: theme.colors.primary,
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
    historyValue: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    historyMeta: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    historyNote: {
      marginTop: spacing.sm,
      fontSize: fontSize.xs,
      color: theme.colors.textSecondary,
    },
    historyBadge: {
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
      backgroundColor: `${theme.colors.warning}15`,
    },
    historyBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.warning,
    },
    historyEmpty: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
  });
