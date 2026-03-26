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
import { Button, Card, LoadingSpinner, TabScreenWrapper } from '../../src/components/common';
import {
  DietHero,
  DietMealCard,
  DietMenuSelectorModal,
  RecipeIngredientSwapModal,
  DietWeekCalendar,
} from '../../src/components/diet';
import { borderRadius, brandColors, fontSize, spacing, nutritionTheme } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';
import { useBottomTabBarContentInset, useBottomTabBarScroll } from '../../src/hooks/useBottomTabBarVisibility';
import { useAppTheme, useThemedStyles } from '../../src/theme';
import {
  getClientDietCalendar,
  getClientDietMenuPool,
  getFoodsByExchangeGroup,
  resetDietRecipeIngredientSwap,
  resetDietStandaloneFoodSwap,
  swapDietRecipeIngredient,
  swapDietStandaloneFood,
  getTodayDietDateKey,
} from '../../src/services/diet';
import { getDashboardContentWidth } from '../../src/utils/layout';
import { formatLocalDate, getLocalWeekKey } from '../../src/utils/date';
import type {
  ApiError,
  ClientDietFoodRow,
  ClientDietIngredientRow,
  ClientDietMenu,
  ClientDietRecipeCard,
  ClientDietRecipeDetail,
  ClientDietWeekDay,
  ClientFoodSwapCandidate,
} from '../../src/types';

const formatLongDate = (value: string) =>
  formatLocalDate(value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

type SelectedSwapTarget = {
  type: 'recipe';
  recipeId: number;
  ingredient: ClientDietIngredientRow;
} | {
  type: 'standalone';
  menuId: number;
  ingredient: ClientDietFoodRow;
} | null;

const applyRecipeDetailToRecipeCard = (
  recipe: ClientDietRecipeCard,
  recipeDetail: ClientDietRecipeDetail,
): ClientDietRecipeCard => {
  if (recipe.recipeId !== recipeDetail.recipeId) {
    return recipe;
  }

  return {
    ...recipe,
    ingredientCount: recipeDetail.ingredientCount,
    ingredients: recipeDetail.ingredients,
  };
};

const applyRecipeDetailToMenu = (
  menu: ClientDietMenu,
  recipeDetail: ClientDietRecipeDetail,
): ClientDietMenu => {
  let hasChanges = false;

  const meals = menu.meals.map((meal) => {
    let mealChanged = false;
    const recipes = meal.recipes.map((recipe) => {
      const nextRecipe = applyRecipeDetailToRecipeCard(recipe, recipeDetail);
      if (nextRecipe !== recipe) {
        mealChanged = true;
      }
      return nextRecipe;
    });

    if (!mealChanged) {
      return meal;
    }

    hasChanges = true;
    return {
      ...meal,
      recipes,
    };
  });

  return hasChanges
    ? {
        ...menu,
        meals,
      }
    : menu;
};

const applyRecipeDetailToWeekDays = (
  days: ClientDietWeekDay[],
  recipeDetail: ClientDietRecipeDetail,
): ClientDietWeekDay[] =>
  days.map((day) => {
    if (!day.assignedMenu) {
      return day;
    }

    const nextAssignedMenu = applyRecipeDetailToMenu(day.assignedMenu, recipeDetail);
    return nextAssignedMenu === day.assignedMenu
      ? day
      : {
          ...day,
          assignedMenu: nextAssignedMenu,
        };
  });

const applyRecipeDetailToMenuPool = (
  poolByDate: Record<string, ClientDietMenu[]>,
  recipeDetail: ClientDietRecipeDetail,
): Record<string, ClientDietMenu[]> => {
  const nextEntries = Object.entries(poolByDate).map(([dateKey, menus]) => {
    let hasChanges = false;
    const nextMenus = menus.map((menu) => {
      const nextMenu = applyRecipeDetailToMenu(menu, recipeDetail);
      if (nextMenu !== menu) {
        hasChanges = true;
      }
      return nextMenu;
    });

    return [dateKey, hasChanges ? nextMenus : menus] as const;
  });

  return Object.fromEntries(nextEntries);
};

const mergeUpdatedMenu = (
  currentMenu: ClientDietMenu,
  updatedMenu: ClientDietMenu,
): ClientDietMenu => (
  currentMenu.menuId !== updatedMenu.menuId
    ? currentMenu
    : {
        ...updatedMenu,
        id: currentMenu.id,
        assignedDate: currentMenu.assignedDate,
      }
);

const applyUpdatedMenuToWeekDays = (
  days: ClientDietWeekDay[],
  updatedMenu: ClientDietMenu,
): ClientDietWeekDay[] =>
  days.map((day) => {
    if (!day.assignedMenu || day.assignedMenu.menuId !== updatedMenu.menuId) {
      return day;
    }

    return {
      ...day,
      assignedMenu: mergeUpdatedMenu(day.assignedMenu, updatedMenu),
    };
  });

const applyUpdatedMenuToMenuPool = (
  poolByDate: Record<string, ClientDietMenu[]>,
  updatedMenu: ClientDietMenu,
): Record<string, ClientDietMenu[]> =>
  Object.fromEntries(
    Object.entries(poolByDate).map(([dateKey, menus]) => [
      dateKey,
      menus.map((menu) => mergeUpdatedMenu(menu, updatedMenu)),
    ]),
  );

export default function DietScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = getDashboardContentWidth(width);
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const tabBarScroll = useBottomTabBarScroll();
  const contentInsetBottom = useBottomTabBarContentInset();
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
  const [hasPlayedEntryAnimation, setHasPlayedEntryAnimation] = useState(false);
  const [selectedSwapTarget, setSelectedSwapTarget] = useState<SelectedSwapTarget>(null);
  const [isSwapModalVisible, setIsSwapModalVisible] = useState(false);
  const [swapFoods, setSwapFoods] = useState<ClientFoodSwapCandidate[]>([]);
  const [swapFoodsLoading, setSwapFoodsLoading] = useState(false);
  const [swapFoodsError, setSwapFoodsError] = useState<string | null>(null);
  const [isSavingSwap, setIsSavingSwap] = useState(false);

  const selectedIngredient = selectedSwapTarget?.ingredient ?? null;

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
        setIsSwapModalVisible(false);
        setSelectedSwapTarget(null);
        setSwapFoods([]);
        setSwapFoodsError(null);
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
        setIsSwapModalVisible(false);
        setSelectedSwapTarget(null);
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

  const showInitialLoadingState = isLoading && !refreshing;
  const shouldAnimateEntry = !hasPlayedEntryAnimation && !showInitialLoadingState;
  const getEntryAnimation = useCallback(
    (delay: number) => (shouldAnimateEntry ? FadeInDown.delay(delay).duration(350) : undefined),
    [shouldAnimateEntry],
  );

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

  const loadSwapFoods = useCallback(async (ingredient: ClientDietIngredientRow | null) => {
    if (!ingredient?.exchangeGroupId) {
      setSwapFoods([]);
      setSwapFoodsError(
        ingredient?.recipeIngredientId
          ? 'Este ingrediente no tiene equivalentes disponibles.'
          : 'Este alimento no tiene equivalentes disponibles.',
      );
      return;
    }

    setSwapFoodsLoading(true);
    setSwapFoodsError(null);

    try {
      const response = await getFoodsByExchangeGroup(ingredient.exchangeGroupId);
      setSwapFoods(response);
    } catch (loadError) {
      const apiError = loadError as ApiError;
      setSwapFoods([]);
      setSwapFoodsError(apiError.message || 'No fue posible cargar los equivalentes.');
    } finally {
      setSwapFoodsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSwapModalVisible || !selectedIngredient) {
      return;
    }

    void loadSwapFoods(selectedIngredient);
  }, [isSwapModalVisible, loadSwapFoods, selectedIngredient]);

  const applyUpdatedRecipeDetail = useCallback((recipeDetail: ClientDietRecipeDetail) => {
    setDietDays((currentDays) => applyRecipeDetailToWeekDays(currentDays, recipeDetail));
    setMenuPoolByDate((currentPool) => applyRecipeDetailToMenuPool(currentPool, recipeDetail));
    setError(null);
  }, []);

  const applyUpdatedMenu = useCallback((menu: ClientDietMenu) => {
    setDietDays((currentDays) => applyUpdatedMenuToWeekDays(currentDays, menu));
    setMenuPoolByDate((currentPool) => applyUpdatedMenuToMenuPool(currentPool, menu));
    setError(null);
  }, []);

  const handleOpenRecipeIngredientSwap = useCallback(
    (recipe: ClientDietRecipeCard, ingredient: ClientDietIngredientRow) => {
      if (!ingredient.exchangeGroupId || !ingredient.recipeIngredientId) {
        return;
      }

      setSelectedSwapTarget({
        type: 'recipe',
        recipeId: recipe.recipeId,
        ingredient,
      });
      setSwapFoods([]);
      setSwapFoodsError(null);
      setIsSwapModalVisible(true);
    },
    [],
  );

  const handleOpenStandaloneFoodSwap = useCallback(
    (menu: ClientDietMenu, food: ClientDietFoodRow) => {
      if (!food.exchangeGroupId || !food.menuItemId) {
        return;
      }

      setSelectedSwapTarget({
        type: 'standalone',
        menuId: menu.menuId,
        ingredient: food,
      });
      setSwapFoods([]);
      setSwapFoodsError(null);
      setIsSwapModalVisible(true);
    },
    [],
  );

  const handleCloseSwapModal = useCallback(() => {
    if (isSavingSwap) {
      return;
    }

    setIsSwapModalVisible(false);
    setSelectedSwapTarget(null);
    setSwapFoodsError(null);
  }, [isSavingSwap]);

  const handleRetrySwapFoods = useCallback(() => {
    if (!selectedIngredient) {
      return;
    }

    void loadSwapFoods(selectedIngredient);
  }, [loadSwapFoods, selectedIngredient]);

  const handleSelectSwapFood = useCallback(async (food: ClientFoodSwapCandidate) => {
    if (!selectedSwapTarget || !selectedIngredient) {
      return;
    }

    setIsSavingSwap(true);
    setSwapFoodsError(null);

    try {
      if (selectedSwapTarget.type === 'recipe' && selectedIngredient.recipeIngredientId) {
        const response = await swapDietRecipeIngredient(
          selectedSwapTarget.recipeId,
          selectedIngredient.recipeIngredientId,
          food.id,
        );
        applyUpdatedRecipeDetail(response);
      } else if (selectedSwapTarget.type === 'standalone' && selectedIngredient.menuItemId) {
        const response = await swapDietStandaloneFood(
          selectedSwapTarget.menuId,
          selectedIngredient.menuItemId,
          food.id,
          selectedDate,
        );
        applyUpdatedMenu(response);
      } else {
        return;
      }

      setIsSwapModalVisible(false);
      setSelectedSwapTarget(null);
    } catch (saveError) {
      const apiError = saveError as ApiError;
      setSwapFoodsError(apiError.message || 'No fue posible guardar el cambio.');
    } finally {
      setIsSavingSwap(false);
    }
  }, [applyUpdatedMenu, applyUpdatedRecipeDetail, selectedDate, selectedIngredient, selectedSwapTarget]);

  const handleResetSwap = useCallback(async () => {
    if (!selectedSwapTarget || !selectedIngredient) {
      return;
    }

    setIsSavingSwap(true);
    setSwapFoodsError(null);

    try {
      if (selectedSwapTarget.type === 'recipe' && selectedIngredient.recipeIngredientId) {
        const response = await resetDietRecipeIngredientSwap(
          selectedSwapTarget.recipeId,
          selectedIngredient.recipeIngredientId,
        );
        applyUpdatedRecipeDetail(response);
      } else if (selectedSwapTarget.type === 'standalone' && selectedIngredient.menuItemId) {
        const response = await resetDietStandaloneFoodSwap(
          selectedSwapTarget.menuId,
          selectedIngredient.menuItemId,
          selectedDate,
        );
        applyUpdatedMenu(response);
      } else {
        return;
      }

      setIsSwapModalVisible(false);
      setSelectedSwapTarget(null);
    } catch (resetError) {
      const apiError = resetError as ApiError;
      setSwapFoodsError(
        apiError.message || (
          selectedSwapTarget.type === 'recipe'
            ? 'No fue posible restaurar el ingrediente original.'
            : 'No fue posible restaurar el alimento original.'
        ),
      );
    } finally {
      setIsSavingSwap(false);
    }
  }, [applyUpdatedMenu, applyUpdatedRecipeDetail, selectedDate, selectedIngredient, selectedSwapTarget]);

  if (!user) {
    router.replace('/login');
    return null;
  }

  if (showInitialLoadingState) {
    return <LoadingSpinner fullScreen text="Cargando tu dieta..." />;
  }

  return (
    <TabScreenWrapper>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          style={styles.scrollView}
          contentInsetAdjustmentBehavior="automatic"
          onScroll={tabBarScroll.onScroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentInsetBottom }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadDiet('refresh')}
              tintColor={brandColors.navy}
            />
          }
          scrollEventThrottle={tabBarScroll.scrollEventThrottle}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={getEntryAnimation(0)} style={styles.header}>
            <Text style={styles.eyebrow}>Nutricion</Text>
            <Text style={styles.title}>Dieta</Text>
            <Text style={styles.subtitle}>
              Consulta tu plan alimenticio del dia y las recetas asignadas.
            </Text>
          </Animated.View>

          {selectedDay ? (
            <>
              <Animated.View entering={getEntryAnimation(80)}>
                <DietWeekCalendar
                  days={dietDays}
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                  contentWidth={contentWidth}
                />
              </Animated.View>

              {visibleMenu ? (
                <Animated.View entering={getEntryAnimation(140)} style={styles.heroSection}>
                  <DietHero
                    menu={visibleMenu}
                    assignedDate={selectedDay.assignedDate}
                    isToday={selectedDay.isToday}
                    isPreview={isPreviewMenu}
                  />
                </Animated.View>
              ) : null}

              <Animated.View entering={getEntryAnimation(180)} style={styles.selectorSection}>
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

              <Animated.View entering={getEntryAnimation(220)} style={styles.mealsSection}>
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
                          <DietMealCard
                            meal={meal}
                            onRecipeIngredientPress={handleOpenRecipeIngredientSwap}
                            onStandaloneFoodPress={
                              visibleMenu
                                ? (food) => handleOpenStandaloneFoodSwap(visibleMenu, food)
                                : undefined
                            }
                          />
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
            <Animated.View entering={getEntryAnimation(80)} style={styles.emptyStateWrapper}>
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

        <RecipeIngredientSwapModal
          visible={isSwapModalVisible}
          ingredient={selectedIngredient}
          foods={swapFoods}
          isLoading={swapFoodsLoading}
          isSaving={isSavingSwap}
          error={swapFoodsError}
          onClose={handleCloseSwapModal}
          onRetry={handleRetrySwapFoods}
          onSelectFood={handleSelectSwapFood}
          onReset={handleResetSwap}
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
