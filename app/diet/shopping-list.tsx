import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  LoadingSpinner,
} from '../../src/components/common';
import { CalendarDatePickerModal } from '../../src/components/calendar';
import {
  ShoppingListChecklist,
  ShoppingListDayMenuSelector,
  ShoppingListManualItemForm,
  ShoppingListMenuPreviewModal,
  ShoppingListRangeSummary,
  type ShoppingListFilter,
} from '../../src/components/diet';
import { borderRadius, fontSize, nutritionTheme, spacing } from '../../src/constants/colors';
import {
  addDaysToDateKey,
  formatLocalDate,
  getCalendarDayDiff,
  getStartOfLocalWeekDateKey,
  getTodayDateKey,
  toLocalDateKey,
} from '../../src/utils/date';
import {
  getDietSelectableMenus,
  mergeDietMenuOptionsByDate,
  resolveVisibleDietMenu,
} from '../../src/utils/dietMenuSelection';
import { getPrimaryScreenHorizontalPadding } from '../../src/utils/layout';
import { useAuthStore } from '../../src/store/authStore';
import { useAppTheme, useThemedStyles } from '../../src/theme';
import {
  addClientShoppingListItem,
  deleteClientShoppingListItem,
  generateClientShoppingList,
  getClientDietMenuCalendar,
  getClientEffectiveDietRange,
  getClientShoppingListCurrent,
  MAX_CLIENT_SHOPPING_LIST_DAYS,
  updateClientShoppingListItem,
} from '../../src/services/diet';
import type {
  ApiError,
  ClientDietMenu,
  ClientDietWeekDay,
  ClientShoppingList,
  ClientShoppingListDaySelection,
  ClientShoppingListItem,
  ClientShoppingListItemPayload,
} from '../../src/types';

type LoadMode = 'initial' | 'refresh';
type DatePickerTarget = 'start' | 'end';
type MenuPreviewState = {
  assignedDate: string;
  menu: ClientDietMenu;
  menuLabel: string;
};

const resolveParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const resolveInitialStartDate = (value: string | string[] | undefined) => {
  const requestedDate = toLocalDateKey(resolveParamValue(value));
  const today = getTodayDateKey();
  return getStartOfLocalWeekDateKey(requestedDate || today) || today;
};

const resolveInitialEndDate = (
  startDate: string,
  value: string | string[] | undefined,
) => {
  const requestedDate = toLocalDateKey(resolveParamValue(value));
  const fallbackEndDate = addDaysToDateKey(startDate, 6) ?? startDate;
  if (!requestedDate) {
    return fallbackEndDate;
  }

  const requestedDayCount = getCalendarDayDiff(startDate, requestedDate) + 1;
  if (requestedDayCount < 1 || requestedDayCount > MAX_CLIENT_SHOPPING_LIST_DAYS) {
    return fallbackEndDate;
  }

  return requestedDate;
};

const getInclusiveRangeDayCount = (startDate: string, endDate: string) =>
  Math.max(1, getCalendarDayDiff(startDate, endDate) + 1);

const getMaxEndDate = (startDate: string) =>
  addDaysToDateKey(startDate, MAX_CLIENT_SHOPPING_LIST_DAYS - 1) ?? startDate;

const buildSelectionByDate = (
  days: ClientDietWeekDay[],
  list: ClientShoppingList | null,
) => {
  const savedMenuByDate = new Map(list?.days.map((day) => [day.date, day.menuId]) ?? []);
  const shouldUseSavedMenus = Boolean(list && !list.needsRegeneration);

  return days.reduce<Record<string, number>>((selection, day) => {
    const savedMenuId = savedMenuByDate.get(day.assignedDate);
    const visibleMenu = resolveVisibleDietMenu(day);
    const firstMenu = getDietSelectableMenus(day)[0] ?? null;

    selection[day.assignedDate] =
      (shouldUseSavedMenus ? savedMenuId : undefined) ??
      day.backendPrimaryMenuId ??
      visibleMenu?.menuId ??
      firstMenu?.menuId ??
      0;

    return selection;
  }, {});
};

const loadCalendarMenusForDays = async (
  clientId: string,
  days: ClientDietWeekDay[],
) => {
  const menuResults = await Promise.allSettled(
    days.map((day) => getClientDietMenuCalendar(clientId, day.assignedDate)),
  );

  return menuResults.reduce<Record<string, ClientDietMenu[]>>(
    (menusByDate, result) => (
      result.status === 'fulfilled'
        ? { ...menusByDate, ...result.value }
        : menusByDate
    ),
    {},
  );
};

const loadWeekDays = async (
  clientId: string,
  startDate: string,
  rangeDayCount: number,
) => {
  const days = await getClientEffectiveDietRange(clientId, startDate, {
    selectedDate: startDate,
    days: rangeDayCount,
  });

  try {
    const calendarMenus = await loadCalendarMenusForDays(clientId, days);
    return mergeDietMenuOptionsByDate(days, calendarMenus);
  } catch {
    return days;
  }
};

export default function ShoppingListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ startDate?: string; endDate?: string }>();
  const { width, height } = useWindowDimensions();
  const { user } = useAuthStore();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const horizontalPadding = getPrimaryScreenHorizontalPadding(width, height);
  const initialStartDate = resolveInitialStartDate(params.startDate);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(() => resolveInitialEndDate(initialStartDate, params.endDate));
  const [dietDays, setDietDays] = useState<ClientDietWeekDay[]>([]);
  const [shoppingList, setShoppingList] = useState<ClientShoppingList | null>(null);
  const [selectedMenuByDate, setSelectedMenuByDate] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<ShoppingListFilter>('pending');
  const [pendingItemIds, setPendingItemIds] = useState<Set<number>>(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget | null>(null);
  const [menuPreview, setMenuPreview] = useState<MenuPreviewState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rangeDayCount = getInclusiveRangeDayCount(startDate, endDate);
  const completedCount = shoppingList?.items.filter((item) => item.checked).length ?? 0;
  const totalCount = shoppingList?.items.length ?? 0;
  const canGenerate =
    dietDays.length === rangeDayCount &&
    dietDays.every((day) => (selectedMenuByDate[day.assignedDate] ?? 0) > 0);

  const hasPendingItem = pendingItemIds.size > 0 || isAddingManual;
  const isRangeNavigationDisabled = isGenerating || hasPendingItem;

  const selectedDaysPayload = useMemo<ClientShoppingListDaySelection[]>(
    () => dietDays.map((day) => ({
      date: day.assignedDate,
      menuId: selectedMenuByDate[day.assignedDate] ?? 0,
    })),
    [dietDays, selectedMenuByDate],
  );

  const loadData = useCallback(
    async (mode: LoadMode = 'initial') => {
      if (!user) {
        return;
      }

      if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const [days, list] = await Promise.all([
          loadWeekDays(user.id, startDate, rangeDayCount),
          getClientShoppingListCurrent(user.id, startDate, endDate),
        ]);

        setDietDays(days);
        setShoppingList(list);
        setSelectedMenuByDate(buildSelectionByDate(days, list));
        setError(null);
      } catch (loadError) {
        const apiError = loadError as ApiError;
        setError(apiError.message || 'No se pudo cargar la lista del mandado.');
      } finally {
        if (mode === 'refresh') {
          setRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [endDate, rangeDayCount, startDate, user],
  );

  useEffect(() => {
    void loadData('initial');
  }, [loadData]);

  const updateLocalItem = useCallback((updatedItem: ClientShoppingListItem) => {
    setShoppingList((currentList) => (
      currentList
        ? {
            ...currentList,
            items: currentList.items.map((item) => (
              item.id === updatedItem.id ? updatedItem : item
            )),
          }
        : currentList
    ));
  }, []);

  const removePendingItemId = (itemId: number) => {
    setPendingItemIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(itemId);
      return nextIds;
    });
  };

  const addPendingItemId = (itemId: number) => {
    setPendingItemIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(itemId);
      return nextIds;
    });
  };

  const handleChangeRange = useCallback((nextStartDate: string, nextEndDate: string) => {
    if (nextStartDate === startDate && nextEndDate === endDate) {
      return;
    }

    setError(null);
    setIsLoading(true);
    setDietDays([]);
    setShoppingList(null);
    setSelectedMenuByDate({});
    setPendingItemIds(new Set());
    setMenuPreview(null);
    setFilter('pending');
    setStartDate(nextStartDate);
    setEndDate(nextEndDate);
  }, [endDate, startDate]);

  const handleShiftRange = useCallback((direction: -1 | 1) => {
    const shiftDays = direction * rangeDayCount;
    const nextStartDate = addDaysToDateKey(startDate, shiftDays);
    const nextEndDate = addDaysToDateKey(endDate, shiftDays);
    if (nextStartDate && nextEndDate) {
      handleChangeRange(nextStartDate, nextEndDate);
    }
  }, [endDate, handleChangeRange, rangeDayCount, startDate]);

  const handleOpenDatePicker = useCallback((target: DatePickerTarget) => {
    setDatePickerTarget(target);
  }, []);

  const handleCloseDatePicker = useCallback(() => {
    setDatePickerTarget(null);
  }, []);

  const handleSelectRangeDate = useCallback((date: Date) => {
    const selectedDate = toLocalDateKey(date);

    if (!selectedDate) {
      return;
    }

    setDatePickerTarget(null);

    if (datePickerTarget === 'end') {
      handleChangeRange(startDate, selectedDate);
      return;
    }

    const maxEndDate = getMaxEndDate(selectedDate);
    const nextEndDate =
      getCalendarDayDiff(selectedDate, endDate) < 0
        ? selectedDate
        : getCalendarDayDiff(selectedDate, endDate) + 1 > MAX_CLIENT_SHOPPING_LIST_DAYS
          ? maxEndDate
          : endDate;

    handleChangeRange(selectedDate, nextEndDate);
  }, [datePickerTarget, endDate, handleChangeRange, startDate]);

  const handleGenerate = useCallback(async () => {
    if (!user || !canGenerate) {
      const missingMenuCount = dietDays.filter((day) => (
        (selectedMenuByDate[day.assignedDate] ?? 0) <= 0
      )).length;
      const message = dietDays.length !== rangeDayCount
        ? 'Espera a que se carguen todos los dias del rango antes de generar la lista.'
        : `Elige un menu para cada dia del rango.${missingMenuCount > 0 ? ` Faltan ${missingMenuCount}.` : ''}`;

      Alert.alert('Seleccion incompleta', message);
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await generateClientShoppingList(
        user.id,
        startDate,
        selectedDaysPayload,
      );
      setShoppingList(generated);
      setDietDays((currentDays) => currentDays.map((day) => ({
        ...day,
        backendPrimaryMenuId: selectedMenuByDate[day.assignedDate] ?? day.backendPrimaryMenuId,
      })));
      setError(null);
    } catch (generateError) {
      const apiError = generateError as ApiError;
      Alert.alert('No se pudo generar', apiError.message || 'Intenta de nuevo en unos momentos.');
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, dietDays, rangeDayCount, selectedDaysPayload, selectedMenuByDate, startDate, user]);

  const handleToggleItem = useCallback(async (item: ClientShoppingListItem) => {
    if (!shoppingList) {
      return;
    }

    addPendingItemId(item.id);
    try {
      const updatedItem = await updateClientShoppingListItem(shoppingList.id, item.id, {
        checked: !item.checked,
      });
      updateLocalItem(updatedItem);
    } catch (toggleError) {
      const apiError = toggleError as ApiError;
      Alert.alert('No se pudo guardar', apiError.message || 'Intenta marcarlo otra vez.');
    } finally {
      removePendingItemId(item.id);
    }
  }, [shoppingList, updateLocalItem]);

  const handleSaveItem = useCallback(async (
    item: ClientShoppingListItem,
    payload: ClientShoppingListItemPayload,
  ) => {
    if (!shoppingList) {
      return;
    }

    addPendingItemId(item.id);
    try {
      const updatedItem = await updateClientShoppingListItem(shoppingList.id, item.id, payload);
      updateLocalItem(updatedItem);
    } catch (saveError) {
      const apiError = saveError as ApiError;
      Alert.alert('No se pudo editar', apiError.message || 'Intenta guardar de nuevo.');
    } finally {
      removePendingItemId(item.id);
    }
  }, [shoppingList, updateLocalItem]);

  const handleDeleteItem = useCallback((item: ClientShoppingListItem) => {
    if (!shoppingList) {
      return;
    }

    Alert.alert(
      'Eliminar producto',
      `Quieres quitar "${item.name}" de la lista?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            addPendingItemId(item.id);
            void deleteClientShoppingListItem(shoppingList.id, item.id)
              .then(() => {
                setShoppingList((currentList) => (
                  currentList
                    ? {
                        ...currentList,
                        items: currentList.items.filter((currentItem) => currentItem.id !== item.id),
                      }
                    : currentList
                ));
              })
              .catch((deleteError) => {
                const apiError = deleteError as ApiError;
                Alert.alert('No se pudo eliminar', apiError.message || 'Intenta de nuevo.');
              })
              .finally(() => removePendingItemId(item.id));
          },
        },
      ],
    );
  }, [shoppingList]);

  const handleAddManualItem = useCallback(async (payload: ClientShoppingListItemPayload) => {
    if (!shoppingList) {
      return;
    }

    setIsAddingManual(true);
    try {
      const createdItem = await addClientShoppingListItem(shoppingList.id, payload);
      setShoppingList({
        ...shoppingList,
        items: [...shoppingList.items, createdItem],
      });
      setFilter('pending');
    } catch (addError) {
      const apiError = addError as ApiError;
      Alert.alert('No se pudo agregar', apiError.message || 'Intenta de nuevo.');
    } finally {
      setIsAddingManual(false);
    }
  }, [shoppingList]);

  const handlePreviewMenu = useCallback((
    assignedDate: string,
    menu: ClientDietMenu,
    index: number,
  ) => {
    setMenuPreview({
      assignedDate,
      menu,
      menuLabel: `Menu ${index + 1}`,
    });
  }, []);

  const handleCloseMenuPreview = useCallback(() => {
    setMenuPreview(null);
  }, []);

  if (!user) {
    return null;
  }

  if (isLoading && !refreshing) {
    return <LoadingSpinner fullScreen text="Cargando lista del mandado..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadData('refresh')}
            tintColor={nutritionTheme.accentStrong}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.84}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>Nutricion</Text>
            <Text style={styles.title}>Lista del mandado</Text>
            <Text style={styles.subtitle}>
              {formatLocalDate(startDate, { day: 'numeric', month: 'long' })} - {formatLocalDate(endDate, { day: 'numeric', month: 'long' })}
            </Text>
          </View>
        </View>

        <View style={styles.weekControls}>
          <TouchableOpacity
            style={[styles.weekButton, isRangeNavigationDisabled ? styles.controlDisabled : null]}
            onPress={() => handleShiftRange(-1)}
            disabled={isRangeNavigationDisabled}
          >
            <Ionicons name="chevron-back-outline" size={18} color={nutritionTheme.accentStrong} />
            <Text style={styles.weekButtonText}>Rango anterior</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.weekButton, isRangeNavigationDisabled ? styles.controlDisabled : null]}
            onPress={() => handleShiftRange(1)}
            disabled={isRangeNavigationDisabled}
          >
            <Text style={styles.weekButtonText}>Siguiente rango</Text>
            <Ionicons name="chevron-forward-outline" size={18} color={nutritionTheme.accentStrong} />
          </TouchableOpacity>
        </View>

        <View style={[
          styles.dateRangeControls,
          width < 380 ? styles.dateRangeControlsStacked : null,
        ]}>
          <TouchableOpacity
            style={[styles.datePickerButton, isRangeNavigationDisabled ? styles.controlDisabled : null]}
            onPress={() => handleOpenDatePicker('start')}
            disabled={isRangeNavigationDisabled}
            activeOpacity={0.86}
            accessibilityRole="button"
            accessibilityLabel="Elegir fecha desde"
          >
            <View style={styles.datePickerIcon}>
              <Ionicons name="calendar-outline" size={19} color={nutritionTheme.accentStrong} />
            </View>
            <View style={styles.datePickerCopy}>
              <Text style={styles.datePickerLabel}>Desde</Text>
              <Text numberOfLines={1} style={styles.datePickerValue}>
                {formatLocalDate(startDate, { day: 'numeric', month: 'long' })}
              </Text>
            </View>
            <Ionicons name="chevron-down-outline" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.datePickerButton, isRangeNavigationDisabled ? styles.controlDisabled : null]}
            onPress={() => handleOpenDatePicker('end')}
            disabled={isRangeNavigationDisabled}
            activeOpacity={0.86}
            accessibilityRole="button"
            accessibilityLabel="Elegir fecha hasta"
          >
            <View style={styles.datePickerIcon}>
              <Ionicons name="calendar-outline" size={19} color={nutritionTheme.accentStrong} />
            </View>
            <View style={styles.datePickerCopy}>
              <Text style={styles.datePickerLabel}>Hasta</Text>
              <Text numberOfLines={1} style={styles.datePickerValue}>
                {formatLocalDate(endDate, { day: 'numeric', month: 'long' })}
              </Text>
            </View>
            <Ionicons name="chevron-down-outline" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={18} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <ShoppingListDayMenuSelector
          days={dietDays}
          selectedMenuByDate={selectedMenuByDate}
          disabled={isGenerating || hasPendingItem}
          onSelectMenu={(date, menuId) => {
            setSelectedMenuByDate((currentSelection) => ({
              ...currentSelection,
              [date]: menuId,
            }));
          }}
          onPreviewMenu={handlePreviewMenu}
        />

        <ShoppingListRangeSummary
          startDate={startDate}
          endDate={endDate}
          completedCount={completedCount}
          totalCount={totalCount}
          needsRegeneration={Boolean(shoppingList?.needsRegeneration)}
          isGenerating={isGenerating}
          canGenerate={canGenerate}
          hasList={Boolean(shoppingList)}
          onGenerate={handleGenerate}
        />

        {shoppingList ? (
          <>
            <ShoppingListManualItemForm
              disabled={isGenerating}
              isSaving={isAddingManual}
              onSubmit={handleAddManualItem}
            />

            <ShoppingListChecklist
              items={shoppingList.items}
              filter={filter}
              pendingItemIds={pendingItemIds}
              onFilterChange={setFilter}
              onToggleItem={handleToggleItem}
              onDeleteItem={handleDeleteItem}
              onSaveItem={handleSaveItem}
            />
          </>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cart-outline" size={30} color={nutritionTheme.accentStrong} />
            </View>
            <Text style={styles.emptyTitle}>Genera tu lista</Text>
            <Text style={styles.emptyText}>
              Confirma los menus del rango y se guardara una lista editable para ir marcando tu compra.
            </Text>
          </View>
        )}
      </ScrollView>

      <CalendarDatePickerModal
        visible={datePickerTarget !== null}
        title={datePickerTarget === 'end' ? 'Elegir hasta' : 'Elegir desde'}
        subtitle={`Puedes armar listas de hasta ${MAX_CLIENT_SHOPPING_LIST_DAYS} dias.`}
        selectedDate={datePickerTarget === 'end' ? endDate : startDate}
        minDate={datePickerTarget === 'end' ? startDate : undefined}
        maxDate={datePickerTarget === 'end' ? getMaxEndDate(startDate) : undefined}
        onClose={handleCloseDatePicker}
        onSelect={handleSelectRangeDate}
      />

      <ShoppingListMenuPreviewModal
        visible={Boolean(menuPreview)}
        menu={menuPreview?.menu ?? null}
        menuLabel={menuPreview?.menuLabel ?? 'Menu'}
        assignedDate={menuPreview?.assignedDate ?? null}
        onClose={handleCloseMenuPreview}
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
      gap: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    backButton: {
      width: 42,
      height: 42,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    eyebrow: {
      color: nutritionTheme.accentStrong,
      fontSize: fontSize.xs,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.1,
    },
    title: {
      marginTop: spacing.xs,
      color: theme.colors.textPrimary,
      fontSize: 30,
      fontWeight: '800',
    },
    subtitle: {
      marginTop: spacing.xs,
      color: theme.colors.textMuted,
      fontSize: fontSize.sm,
      fontWeight: '600',
    },
    weekControls: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    weekButton: {
      flex: 1,
      minHeight: 42,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    weekButtonText: {
      color: nutritionTheme.accentStrong,
      fontSize: fontSize.xs,
      fontWeight: '800',
    },
    controlDisabled: {
      opacity: 0.55,
    },
    dateRangeControls: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    dateRangeControlsStacked: {
      flexDirection: 'column',
    },
    datePickerButton: {
      flex: 1,
      minHeight: 58,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    datePickerIcon: {
      width: 38,
      height: 38,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: nutritionTheme.accentSurface,
    },
    datePickerCopy: {
      flex: 1,
      minWidth: 0,
    },
    datePickerLabel: {
      color: nutritionTheme.accentStrong,
      fontSize: fontSize.xs,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.7,
    },
    datePickerValue: {
      marginTop: 2,
      color: theme.colors.textPrimary,
      fontSize: fontSize.sm,
      fontWeight: '800',
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.24)',
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
      padding: spacing.sm,
    },
    errorText: {
      flex: 1,
      color: theme.colors.error,
      fontSize: fontSize.sm,
      lineHeight: 20,
      fontWeight: '700',
    },
    emptyCard: {
      alignItems: 'center',
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: nutritionTheme.accentSoft,
    },
    emptyTitle: {
      marginTop: spacing.md,
      color: theme.colors.textPrimary,
      fontSize: fontSize.lg,
      fontWeight: '800',
      textAlign: 'center',
    },
    emptyText: {
      marginTop: spacing.xs,
      color: theme.colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 20,
      textAlign: 'center',
    },
  });
