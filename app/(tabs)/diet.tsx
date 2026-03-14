import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Card, LoadingSpinner } from '../../src/components/common';
import { DietDaySelector, DietHero, DietMealCard } from '../../src/components/diet';
import { borderRadius, brandColors, colors, fontSize, spacing } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';
import { getClientDietCalendar, getTodayDietDateKey } from '../../src/services/diet';
import type { ClientDietDay } from '../../src/types';

const formatLongDate = (value: string) =>
  new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${value}T12:00:00`));

export default function DietScreen() {
  const { user } = useAuthStore();
  const [dietDays, setDietDays] = useState<ClientDietDay[]>([]);
  const [selectedDate, setSelectedDate] = useState(getTodayDietDateKey());
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
        setError(null);
        setRenderVersion((currentValue) => currentValue + 1);
        setSelectedDate((currentDate) => {
          if (days.some((day) => day.assignedDate === currentDate)) {
            return currentDate;
          }

          return days.find((day) => day.assignedDate === today)?.assignedDate || days[0]?.assignedDate || today;
        });
      } catch (loadError: any) {
        setDietDays([]);
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

  useEffect(() => {
    loadDiet();
  }, [loadDiet]);

  const selectedDay = useMemo(
    () => dietDays.find((day) => day.assignedDate === selectedDate) || null,
    [dietDays, selectedDate],
  );

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
          <Text style={styles.eyebrow}>Nutrición</Text>
          <Text style={styles.title}>Dieta</Text>
          <Text style={styles.subtitle}>
            Consulta tu plan alimenticio del día y las recetas asignadas.
          </Text>
        </Animated.View>

        {selectedDay ? (
          <>
            <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.heroSection}>
              <DietHero day={selectedDay} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(140).duration(350)} style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Calendario</Text>
                <Text style={styles.sectionSubtitle}>
                  {formatLongDate(selectedDay.assignedDate)}
                </Text>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(180).duration(350)}>
              <DietDaySelector
                days={dietDays}
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(240).duration(350)} style={styles.mealsSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Comidas del día</Text>
                  <Text style={styles.sectionSubtitle}>
                    {selectedDay.totalMeals} {selectedDay.totalMeals === 1 ? 'bloque' : 'bloques'} organizados para ti
                  </Text>
                </View>
              </View>

              <View style={styles.mealList}>
                {selectedDay.meals.length > 0 ? (
                  selectedDay.meals.map((meal, index) => (
                    <Animated.View
                      key={`${selectedDay.assignedDate}-${renderVersion}-${meal.id}`}
                      entering={FadeInDown.delay(280 + index * 60).duration(320)}
                    >
                      <DietMealCard meal={meal} />
                    </Animated.View>
                  ))
                ) : (
                  <Card style={styles.noMealsCard}>
                    <Text style={styles.noMealsTitle}>Sin comidas cargadas</Text>
                    <Text style={styles.noMealsText}>
                      Tu dieta fue encontrada, pero este día todavía no contiene bloques de comida visibles.
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
                <Ionicons name={error ? 'alert-circle-outline' : 'restaurant-outline'} size={30} color={brandColors.navy} />
              </View>
              <Text style={styles.emptyTitle}>
                {error ? 'No pudimos cargar tu dieta' : 'Todavía no tienes una dieta asignada'}
              </Text>
              <Text style={styles.emptyText}>
                {error
                  ? error
                  : 'Cuando tu nutriólogo publique un plan, aparecerá aquí con sus comidas y recetas.'}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl + 64,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  eyebrow: {
    color: brandColors.navy,
    fontSize: fontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    marginTop: spacing.xs,
    color: colors.gray[900],
    fontSize: 32,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.gray[500],
    fontSize: fontSize.base,
    lineHeight: 22,
  },
  heroSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.gray[900],
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  sectionSubtitle: {
    marginTop: spacing.xs,
    color: colors.gray[500],
    fontSize: fontSize.sm,
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
    backgroundColor: `${brandColors.sky}22`,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    color: colors.gray[900],
    fontSize: fontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.gray[500],
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
    color: colors.gray[900],
    fontSize: fontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
  },
  noMealsText: {
    marginTop: spacing.sm,
    color: colors.gray[500],
    fontSize: fontSize.base,
    lineHeight: 22,
    textAlign: 'center',
  },
});
