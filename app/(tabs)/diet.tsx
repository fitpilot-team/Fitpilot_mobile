import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Card, LoadingSpinner } from '../../src/components/common';
import {
  DietHero,
  DietMealCard,
  DietMenuSelectorModal,
  DietWeekCalendar,
} from '../../src/components/diet';
import { borderRadius, brandColors, fontSize, spacing, nutritionTheme } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';
import { useAppTheme, useThemedStyles } from '../../src/theme';
import {
  getClientDietCalendar,
  getClientDietMenuPool,
  getTodayDietDateKey,
} from '../../src/services/diet';
import { getDashboardContentWidth } from '../../src/utils/layout';
import { formatLocalDate, getLocalWeekKey } from '../../src/utils/date';
import type { ClientDietMenu, ClientDietWeekDay } from '../../src/types';

const formatLongDate = (value: string) =>
  formatLocalDate(value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

export default function DietScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = getDashboardContentWidth(width);
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuthStore();
  const [dietDays, setDietDays] = useState<ClientDietWeekDay[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDietDateKey());
  const [previewMenuIdByDate, setPreviewMenuIdByDate] = useState<Record<string, number>>({});
  const [menuPoolByDate, setMenuPoolByDate] = useState<Record<string, ClientDietMenu[]>>({});
  const [menuPoolLoadingByDate, setMenuPoolLoadingByDate] = useState<Record<string, boolean>>({});
  const [menuPoolErrorByDate, setMenuPoolErrorByDate] = useState<Record<string, string | null>>({});
  const [isMenuSelectorVisible, setIsMenuSelectorVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renderVersion, setRenderVersion] = useState(0);

  const loadDiet = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!user) {
        return;
      }

      if (mode === 'refresh') {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const days = await getClientDietCalendar(user.id);
        const today = getTodayDietDateKey();

        setDietDays(days);
        setMenuPoolByDate({});
        setMenuPoolLoadingByDate({});
        setMenuPoolErrorByDate({});
        setPreviewMenuIdByDate({});
        setError(null);
        setIsMenuSelectorVisible(false);
        setRenderVersion((currentValue) => currentValue + 1);
        setSelectedDate((currentDate) => {
          if (
            getLocalWeekKey(currentDate) === getLocalWeekKey(today) &&
            days.some((day) => day.assignedDate === currentDate)
          ) {
            return currentDate;
          }

          return days.find((day) => day.assignedDate === today)?.assignedDate || today;
        });
      } catch (loadError: any) {
        setDietDays([]);
        setMenuPoolByDate({});
        setMenuPoolLoadingByDate({});
        setMenuPoolErrorByDate({});
        setPreviewMenuIdByDate({});
        setError(loadError?.message || 'No se pudo cargar tu dieta.');
      } finally {
        if (mode === 'refresh') {
          setRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [user],
  );

  const loadMenuPool = useCallback(
    async (dateKey: string) => {
      if (!user) {
        return [];
      }

      if (menuPoolByDate[dateKey]) {
        return menuPoolByDate[dateKey];
      }

      if (menuPoolLoadingByDate[dateKey]) {
        return [];
      }

      setMenuPoolLoadingByDate((currentState) => ({
        ...currentState,
        [dateKey]: true,
      }));

      try {
        const poolMenus = await getClientDietMenuPool(user.id, dateKey);
        setMenuPoolByDate((currentState) => ({
          ...currentState,
          [dateKey]: poolMenus,
        }));
        setMenuPoolErrorByDate((currentState) => ({
          ...currentState,
          [dateKey]: null,
        }));
        return poolMenus;
      } catch (loadError: any) {
        const message = loadError?.message || 'No se pudo cargar el pool de menus.';
        setMenuPoolErrorByDate((currentState) => ({
          ...currentState,
          [dateKey]: message,
        }));
        return [];
      } finally {
        setMenuPoolLoadingByDate((currentState) => ({
          ...currentState,
          [dateKey]: false,
        }));
      }
    },
    [menuPoolByDate, menuPoolLoadingByDate, user],
  );

  useEffect(() => {
    loadDiet();
  }, [loadDiet]);

  const selectedDay = useMemo(
    () => dietDays.find((day) => day.assignedDate === selectedDate) || null,
    [dietDays, selectedDate],
  );

  const selectedPoolMenus = useMemo(
    () => menuPoolByDate[selectedDate] ?? [],
    [menuPoolByDate, selectedDate],
  );

  const selectedPreviewMenuId = previewMenuIdByDate[selectedDate] ?? null;

  const visibleMenu = useMemo(() => {
    if (!selectedDay) {
      return null;
    }

    if (selectedPreviewMenuId !== null) {
      return (
        selectedPoolMenus.find((menu) => menu.menuId === selectedPreviewMenuId) ??
        selectedDay.assignedMenu
      );
    }

    return selectedDay.assignedMenu;
  }, [selectedDay, selectedPoolMenus, selectedPreviewMenuId]);

  const isPreviewMenu = Boolean(
    visibleMenu &&
    selectedDay?.assignedMenuId &&
    visibleMenu.menuId !== selectedDay.assignedMenuId,
  );

  const hasLoadedPoolForSelectedDate = Object.prototype.hasOwnProperty.call(menuPoolByDate, selectedDate);
  const hasAvailablePool = Boolean(selectedDay?.assignedMenuId) && (
    !hasLoadedPoolForSelectedDate || selectedPoolMenus.length > 0
  );
  const selectorSubtitle = !selectedDay?.assignedMenuId
    ? 'No hay menus disponibles para esta fecha.'
    : isPreviewMenu
      ? 'Vista previa local activa. No guarda cambios.'
      : menuPoolErrorByDate[selectedDate]
        ? menuPoolErrorByDate[selectedDate] || 'No se pudo cargar el pool.'
        : hasLoadedPoolForSelectedDate
          ? `${selectedPoolMenus.length} menu${selectedPoolMenus.length === 1 ? '' : 's'} disponibles en el pool.`
          : 'Explora los menus disponibles para esta fecha.';

  const handleOpenMenuSelector = useCallback(async () => {
    if (!selectedDay?.assignedMenuId) {
      return;
    }

    setIsMenuSelectorVisible(true);
    if (!menuPoolByDate[selectedDate] && !menuPoolLoadingByDate[selectedDate]) {
      await loadMenuPool(selectedDate);
    }
  }, [loadMenuPool, menuPoolByDate, menuPoolLoadingByDate, selectedDate, selectedDay?.assignedMenuId]);

  const handleCloseMenuSelector = useCallback(() => {
    setIsMenuSelectorVisible(false);
  }, []);

  const handleRetryMenuPool = useCallback(async () => {
    await loadMenuPool(selectedDate);
  }, [loadMenuPool, selectedDate]);

  const handleSelectPreviewMenu = useCallback((menu: ClientDietMenu) => {
    if (!selectedDay) {
      return;
    }

    setPreviewMenuIdByDate((currentState) => {
      const nextState = { ...currentState };

      if (menu.menuId === selectedDay.assignedMenuId) {
        delete nextState[selectedDay.assignedDate];
      } else {
        nextState[selectedDay.assignedDate] = menu.menuId;
      }

      return nextState;
    });
    setIsMenuSelectorVisible(false);
    setRenderVersion((currentValue) => currentValue + 1);
  }, [selectedDay]);

  if (!user) {
    router.replace('/login');
    return null;
  }

  if (isLoading && !refreshing) {
    return <LoadingSpinner fullScreen text="Cargando tu dieta..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDiet('refresh')}
            tintColor={brandColors.navy}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
          <Text style={styles.eyebrow}>Nutricion</Text>
          <Text style={styles.title}>Dieta</Text>
          <Text style={styles.subtitle}>
            Consulta tu plan alimenticio del dia y las recetas asignadas.
          </Text>
        </Animated.View>

        {selectedDay ? (
          <>
            <Animated.View entering={FadeInDown.delay(80).duration(350)}>
              <DietWeekCalendar
                days={dietDays}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                contentWidth={contentWidth}
              />
            </Animated.View>

            {visibleMenu ? (
              <Animated.View entering={FadeInDown.delay(140).duration(350)} style={styles.heroSection}>
                <DietHero
                  menu={visibleMenu}
                  assignedDate={selectedDay.assignedDate}
                  isToday={selectedDay.isToday}
                  isPreview={isPreviewMenu}
                />
              </Animated.View>
            ) : null}

            <Animated.View entering={FadeInDown.delay(180).duration(350)} style={styles.selectorSection}>
              <TouchableOpacity
                style={[
                  styles.selectorCard,
                  !hasAvailablePool && styles.selectorCardDisabled,
                ]}
                onPress={handleOpenMenuSelector}
                disabled={!hasAvailablePool}
                activeOpacity={0.85}
              >
                <View style={styles.selectorCopy}>
                  <Text style={styles.selectorEyebrow}>Menu visible</Text>
                  <Text style={styles.selectorTitle}>
                    {visibleMenu?.title || 'Sin menu asignado'}
                  </Text>
                  <Text style={styles.selectorSubtitle}>{selectorSubtitle}</Text>
                </View>

                <View style={styles.selectorAction}>
                  {menuPoolLoadingByDate[selectedDate] ? (
                    <ActivityIndicator size="small" color={nutritionTheme.accentStrong} />
                  ) : (
                    <Ionicons
                      name={hasAvailablePool ? 'chevron-forward-outline' : 'remove-outline'}
                      size={20}
                      color={hasAvailablePool ? nutritionTheme.accentStrong : theme.colors.iconMuted}
                    />
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(220).duration(350)} style={styles.mealsSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Comidas del dia</Text>
                  <Text style={styles.sectionSubtitle}>
                    {visibleMenu
                      ? `${visibleMenu.totalMeals} ${visibleMenu.totalMeals === 1 ? 'bloque' : 'bloques'} organizados para ti`
                      : 'No hay comidas programadas para esta fecha'}
                  </Text>
                </View>
              </View>

              <View style={styles.mealList}>
                {visibleMenu ? (
                  visibleMenu.meals.length > 0 ? (
                    visibleMenu.meals.map((meal, index) => (
                      <Animated.View
                        key={`${selectedDay.assignedDate}-${visibleMenu.menuId}-${renderVersion}-${meal.id}`}
                        entering={FadeInDown.delay(300 + index * 60).duration(320)}
                      >
                        <DietMealCard meal={meal} />
                      </Animated.View>
                    ))
                  ) : (
                    <Card style={styles.noMealsCard}>
                      <Text style={styles.noMealsTitle}>Sin comidas cargadas</Text>
                      <Text style={styles.noMealsText}>
                        Tu menu fue encontrado, pero este dia todavia no contiene bloques de comida visibles.
                      </Text>
                    </Card>
                  )
                ) : (
                  <Card style={styles.noMealsCard}>
                    <Text style={styles.noMealsTitle}>Sin menu asignado</Text>
                    <Text style={styles.noMealsText}>
                      No tienes un menu cargado para {formatLongDate(selectedDay.assignedDate)}.
                    </Text>
                  </Card>
                )}
              </View>
            </Animated.View>
          </>
        ) : (
          <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.emptyStateWrapper}>
            <Card style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name={error ? 'alert-circle-outline' : 'restaurant-outline'} size={30} color={nutritionTheme.accentStrong} />
              </View>
              <Text style={styles.emptyTitle}>
                {error ? 'No pudimos cargar tu dieta' : 'Todavia no tienes una dieta asignada'}
              </Text>
              <Text style={styles.emptyText}>
                {error
                  ? error
                  : 'Cuando tu nutriologo publique un plan, aparecera aqui con sus comidas y recetas.'}
              </Text>
              <Button
                title="Reintentar"
                onPress={() => loadDiet()}
                variant="primary"
                style={styles.retryButton}
              />
            </Card>
          </Animated.View>
        )}
      </ScrollView>

      <DietMenuSelectorModal
        visible={isMenuSelectorVisible && Boolean(selectedDay?.assignedMenuId)}
        dateLabel={selectedDay ? formatLongDate(selectedDay.assignedDate) : ''}
        menus={selectedPoolMenus}
        selectedMenuId={visibleMenu?.menuId ?? selectedDay?.assignedMenuId ?? null}
        assignedMenuId={selectedDay?.assignedMenuId ?? null}
        isLoading={Boolean(menuPoolLoadingByDate[selectedDate])}
        error={menuPoolErrorByDate[selectedDate]}
        onClose={handleCloseMenuSelector}
        onRetry={handleRetryMenuPool}
        onSelect={handleSelectPreviewMenu}
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
      paddingBottom: spacing.xxl + 64,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    eyebrow: {
      color: nutritionTheme.accentStrong,
      fontSize: fontSize.xs,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    title: {
      marginTop: spacing.xs,
      color: theme.colors.textPrimary,
      fontSize: 32,
      fontWeight: '800',
    },
    subtitle: {
      marginTop: spacing.sm,
      color: theme.colors.textMuted,
      fontSize: fontSize.base,
      lineHeight: 22,
    },
    heroSection: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    sectionHeader: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      color: theme.colors.textPrimary,
      fontSize: fontSize.xl,
      fontWeight: '800',
    },
    sectionSubtitle: {
      marginTop: spacing.xs,
      color: theme.colors.textMuted,
      fontSize: fontSize.sm,
    },
    selectorSection: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.sm,
    },
    selectorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      padding: spacing.md,
    },
    selectorCardDisabled: {
      opacity: 0.65,
    },
    selectorCopy: {
      flex: 1,
      paddingRight: spacing.md,
    },
    selectorEyebrow: {
      color: nutritionTheme.accentStrong,
      fontSize: fontSize.xs,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    selectorTitle: {
      marginTop: spacing.xs,
      color: theme.colors.textPrimary,
      fontSize: fontSize.base,
      fontWeight: '800',
    },
    selectorSubtitle: {
      marginTop: spacing.xs,
      color: theme.colors.textMuted,
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
    selectorAction: {
      width: 34,
      height: 34,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: nutritionTheme.accentSoft,
    },
    mealsSection: {
      marginTop: spacing.lg,
    },
    mealList: {
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    emptyStateWrapper: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
    },
    emptyCard: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.lg,
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
      marginTop: spacing.lg,
      color: theme.colors.textPrimary,
      fontSize: fontSize.xl,
      fontWeight: '800',
      textAlign: 'center',
    },
    emptyText: {
      marginTop: spacing.sm,
      color: theme.colors.textMuted,
      fontSize: fontSize.base,
      lineHeight: 22,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: spacing.lg,
      minWidth: 180,
    },
    noMealsCard: {
      paddingVertical: spacing.xl,
    },
    noMealsTitle: {
      color: theme.colors.textPrimary,
      fontSize: fontSize.lg,
      fontWeight: '800',
      textAlign: 'center',
    },
    noMealsText: {
      marginTop: spacing.sm,
      color: theme.colors.textMuted,
      fontSize: fontSize.base,
      lineHeight: 22,
      textAlign: 'center',
    },
  });
