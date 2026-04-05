import { useCallback, useMemo, useState } from 'react';
import {
  createMyGlucoseRecord,
  deleteMyGlucoseRecord,
  getMyGlucoseRecord,
  listMyGlucoseRecords,
  updateMyGlucoseRecord,
} from '../services/healthMetrics';
import type {
  ApiError,
  CreateOwnGlucosePayload,
  GlucosePagination,
  GlucoseRecord,
} from '../types';

const DEFAULT_PAGE_SIZE = 20;

const toRecordMap = (records: GlucoseRecord[]) =>
  Object.fromEntries(records.map((record) => [record.id, record]));

const getRecordedAtTimestamp = (record: GlucoseRecord) => {
  if (!record.recorded_at) {
    return 0;
  }

  const timestamp = new Date(record.recorded_at).getTime();

  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortGlucoseRecords = (records: GlucoseRecord[]) =>
  [...records].sort((left, right) => {
    const timestampDifference =
      getRecordedAtTimestamp(right) - getRecordedAtTimestamp(left);

    if (timestampDifference !== 0) {
      return timestampDifference;
    }

    return String(right.id).localeCompare(String(left.id));
  });

const upsertGlucoseRecord = (
  records: GlucoseRecord[],
  nextRecord: GlucoseRecord,
) =>
  sortGlucoseRecords([
    nextRecord,
    ...records.filter((record) => record.id !== nextRecord.id),
  ]);

interface LoadHistoryOptions {
  page?: number;
  append?: boolean;
  refresh?: boolean;
  throwOnError?: boolean;
}

export function useGlucoseRecords(pageSize: number = DEFAULT_PAGE_SIZE) {
  const [records, setRecords] = useState<GlucoseRecord[]>([]);
  const [pagination, setPagination] = useState<GlucosePagination | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, GlucoseRecord>>(
    {},
  );
  const [latestPreview, setLatestPreview] = useState<GlucoseRecord | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const [isLoadingLatest, setIsLoadingLatest] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [latestError, setLatestError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const latestRecord = records[0] ?? latestPreview;
  const selectedRecord = selectedRecordId
    ? detailCache[selectedRecordId] ??
      records.find((record) => record.id === selectedRecordId) ??
      (latestPreview?.id === selectedRecordId ? latestPreview : null)
    : null;
  const editingRecord = editingRecordId
    ? detailCache[editingRecordId] ??
      records.find((record) => record.id === editingRecordId) ??
      (latestPreview?.id === editingRecordId ? latestPreview : null)
    : null;

  const syncLatestPreview = useCallback((nextRecords: GlucoseRecord[]) => {
    setLatestPreview(nextRecords[0] ?? null);
  }, []);

  const loadLatestPreview = useCallback(
    async (options: { silent?: boolean } = {}) => {
      const { silent = false } = options;

      if (!silent) {
        setIsLoadingLatest(true);
      }

      try {
        const response = await listMyGlucoseRecords(1, 1);
        const nextLatestRecord = response.data[0] ?? null;

        setLatestPreview(nextLatestRecord);
        setLatestError(null);
        setDetailCache((currentCache) =>
          nextLatestRecord
            ? {
                ...currentCache,
                [nextLatestRecord.id]:
                  currentCache[nextLatestRecord.id] ?? nextLatestRecord,
              }
            : currentCache,
        );
        return nextLatestRecord;
      } catch (error) {
        const apiError = error as ApiError;
        setLatestError(
          apiError.message || 'No fue posible cargar la glucosa mas reciente.',
        );
        return null;
      } finally {
        if (!silent) {
          setIsLoadingLatest(false);
        }
      }
    },
    [],
  );

  const loadHistory = useCallback(
    async (options: LoadHistoryOptions = {}) => {
      const {
        page = 1,
        append = false,
        refresh = false,
        throwOnError = false,
      } = options;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoadingHistory(true);
      }

      try {
        const response = await listMyGlucoseRecords(page, pageSize);
        const nextRecords = append
          ? [...records, ...response.data]
          : response.data;

        setRecords(nextRecords);
        setPagination(response.pagination);
        setDetailCache((currentCache) =>
          append
            ? {
                ...currentCache,
                ...toRecordMap(response.data),
              }
            : {
                ...currentCache,
                ...toRecordMap(response.data),
              },
        );
        syncLatestPreview(nextRecords);
        setHasLoadedHistory(true);
        setHistoryError(null);

        return response.data;
      } catch (error) {
        const apiError = error as ApiError;
        setHistoryError(
          apiError.message || 'No fue posible cargar tus glucosas.',
        );

        if (refresh || throwOnError) {
          throw error;
        }

        return null;
      } finally {
        setIsLoadingHistory(false);
        setIsLoadingMore(false);
      }
    },
    [pageSize, records, syncLatestPreview],
  );

  const ensureHistoryLoaded = useCallback(async () => {
    if (hasLoadedHistory || isLoadingHistory) {
      return;
    }

    await loadHistory();
  }, [hasLoadedHistory, isLoadingHistory, loadHistory]);

  const refreshData = useCallback(async () => {
    await loadLatestPreview({ silent: false });

    if (hasLoadedHistory) {
      await loadHistory({ refresh: true });
    }
  }, [hasLoadedHistory, loadHistory, loadLatestPreview]);

  const loadMore = useCallback(async () => {
    if (!pagination || records.length >= pagination.total || isLoadingMore) {
      return;
    }

    await loadHistory({
      page: pagination.page + 1,
      append: true,
    });
  }, [isLoadingMore, loadHistory, pagination, records.length]);

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
      } catch (error) {
        const apiError = error as ApiError;
        setIsDetailVisible(false);
        setSelectedRecordId(null);
        throw new Error(apiError.message || 'No fue posible cargar el detalle.');
      } finally {
        setIsDetailLoading(false);
      }
    },
    [detailCache],
  );

  const closeDetail = useCallback(() => {
    setIsDetailVisible(false);
    setSelectedRecordId(null);
    setIsDetailLoading(false);
  }, []);

  const openCreateForm = useCallback(() => {
    setEditingRecordId(null);
    setIsFormVisible(true);
  }, []);

  const openEditForm = useCallback(() => {
    if (!selectedRecord) {
      return;
    }

    setEditingRecordId(selectedRecord.id);
    setIsDetailVisible(false);
    setIsFormVisible(true);
  }, [selectedRecord]);

  const closeForm = useCallback(() => {
    setIsFormVisible(false);
    setEditingRecordId(null);
  }, []);

  const submitRecord = useCallback(
    async (payload: CreateOwnGlucosePayload) => {
      setIsSubmitting(true);

      try {
        const savedRecord = editingRecordId
          ? await updateMyGlucoseRecord(editingRecordId, payload)
          : await createMyGlucoseRecord(payload);

        setRecords((currentRecords) =>
          upsertGlucoseRecord(currentRecords, savedRecord),
        );
        setDetailCache((currentCache) => ({
          ...currentCache,
          [savedRecord.id]: savedRecord,
        }));
        setLatestPreview((currentRecord) => {
          if (!currentRecord) {
            return savedRecord;
          }

          return sortGlucoseRecords([currentRecord, savedRecord])[0] ?? savedRecord;
        });
        setIsFormVisible(false);
        setEditingRecordId(null);
        setSelectedRecordId(savedRecord.id);

        try {
          await loadHistory({ throwOnError: true });
        } catch {
          await loadLatestPreview({ silent: true });
        }

        return { savedRecord, mode: editingRecordId ? 'updated' : 'created' } as const;
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingRecordId, loadHistory, loadLatestPreview],
  );

  const deleteSelectedRecord = useCallback(async () => {
    if (!selectedRecordId) {
      return false;
    }

    setIsDeleting(true);

    try {
      await deleteMyGlucoseRecord(selectedRecordId);
      setRecords((currentRecords) =>
        currentRecords.filter((record) => record.id !== selectedRecordId),
      );
      setDetailCache((currentCache) => {
        const nextCache = { ...currentCache };
        delete nextCache[selectedRecordId];
        return nextCache;
      });
      setLatestPreview((currentRecord) =>
        currentRecord?.id === selectedRecordId ? null : currentRecord,
      );
      setIsDetailVisible(false);
      setSelectedRecordId(null);

      try {
        await loadHistory({ throwOnError: true });
      } catch {
        await loadLatestPreview({ silent: true });
      }

      return true;
    } finally {
      setIsDeleting(false);
    }
  }, [loadHistory, loadLatestPreview, selectedRecordId]);

  const resetUi = useCallback(() => {
    setIsDetailVisible(false);
    setSelectedRecordId(null);
    setIsDetailLoading(false);
    setIsFormVisible(false);
    setEditingRecordId(null);
  }, []);

  return useMemo(
    () => ({
      records,
      pagination,
      latestRecord,
      latestError,
      historyError,
      hasLoadedHistory,
      isLoadingLatest,
      isLoadingHistory,
      isLoadingMore,
      isDetailVisible,
      selectedRecord,
      isDetailLoading,
      isFormVisible,
      editingRecord,
      isSubmitting,
      isDeleting,
      loadLatestPreview,
      ensureHistoryLoaded,
      refreshData,
      loadMore,
      openDetail,
      closeDetail,
      openCreateForm,
      openEditForm,
      closeForm,
      submitRecord,
      deleteSelectedRecord,
      resetUi,
    }),
    [
      closeDetail,
      closeForm,
      deleteSelectedRecord,
      editingRecord,
      ensureHistoryLoaded,
      hasLoadedHistory,
      historyError,
      isDeleting,
      isDetailLoading,
      isDetailVisible,
      isFormVisible,
      isLoadingHistory,
      isLoadingLatest,
      isLoadingMore,
      isSubmitting,
      latestError,
      latestRecord,
      loadLatestPreview,
      loadMore,
      openCreateForm,
      openDetail,
      openEditForm,
      pagination,
      records,
      refreshData,
      resetUi,
      selectedRecord,
      submitRecord,
    ],
  );
}
