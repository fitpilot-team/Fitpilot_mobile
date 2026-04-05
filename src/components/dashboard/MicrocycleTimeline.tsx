import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  SharedWeeklyCalendar,
  type SharedWeeklyCalendarDay,
} from '../calendar/SharedWeeklyCalendar';
import { borderRadius, fontSize, shadows, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { MicrocycleMode } from '../../types';
import type { ProgramTimelineDay } from '../../utils/programTimeline';
import { getProgramTimelineCalendarDayLabel } from '../../utils/programTimeline';

interface MicrocycleTimelineProps {
  title: string;
  subtitle?: string | null;
  days: ProgramTimelineDay[];
  mode: MicrocycleMode;
  canGoToPreviousWeek: boolean;
  canGoToNextWeek: boolean;
  onFocusDate: (dateKey: string) => void;
  onShiftWeek: (direction: -1 | 1) => void;
  contentWidth?: number;
}

const SWIPE_THRESHOLD = 40;

export const MicrocycleTimeline: React.FC<MicrocycleTimelineProps> = ({
  title,
  subtitle,
  days,
  mode,
  canGoToPreviousWeek,
  canGoToNextWeek,
  onFocusDate,
  onShiftWeek,
  contentWidth = 390,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const calendarDays = useMemo<SharedWeeklyCalendarDay[]>(
    () =>
      days.map((day) => {
        const { dayLabel, dateNumber } = getProgramTimelineCalendarDayLabel(day.dateKey);

        return {
          id: `${day.dateKey}-${mode}`,
          dateKey: day.dateKey,
          dayLabel,
          dateNumber,
          isSelected: day.isSelected,
          isToday: day.isToday,
          isDisabled: false,
          statusText: day.statusText,
          variant: day.variant,
          showHero: day.showHero,
          onPress: () => onFocusDate(day.dateKey),
        };
      }),
    [days, mode, onFocusDate],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderRelease: (_, gestureState) => {
          if (Math.abs(gestureState.dx) < SWIPE_THRESHOLD || days.length === 0) {
            return;
          }

          if (gestureState.dx < 0 && canGoToNextWeek) {
            onShiftWeek(1);
            return;
          }

          if (gestureState.dx > 0 && canGoToPreviousWeek) {
            onShiftWeek(-1);
          }
        },
      }),
    [canGoToNextWeek, canGoToPreviousWeek, days.length, onShiftWeek],
  );

  if (!calendarDays.length) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
        <View style={styles.emptyCopy}>
          <Text style={styles.emptyTitle}>Sin programa activo</Text>
          <Text style={styles.emptySubtitle}>
            Cuando exista una programacion vigente, aparecera aqui.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <View style={styles.headerActions}>
          <View style={styles.modePill}>
            <Text style={styles.modePillText}>
              {mode === 'planned' ? 'Vista plan' : 'Vista real'}
            </Text>
          </View>

          <View style={styles.weekControls}>
            <Pressable
              onPress={() => onShiftWeek(-1)}
              disabled={!canGoToPreviousWeek}
              style={[
                styles.navButton,
                !canGoToPreviousWeek && styles.navButtonDisabled,
              ]}
            >
              <Ionicons
                name="chevron-back"
                size={16}
                color={canGoToPreviousWeek ? theme.colors.primary : theme.colors.textMuted}
              />
            </Pressable>

            <Pressable
              onPress={() => onShiftWeek(1)}
              disabled={!canGoToNextWeek}
              style={[
                styles.navButton,
                !canGoToNextWeek && styles.navButtonDisabled,
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={16}
                color={canGoToNextWeek ? theme.colors.primary : theme.colors.textMuted}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <View {...panResponder.panHandlers}>
        <SharedWeeklyCalendar
          days={calendarDays}
          heroSelectionMode="selected-only"
          density="tight-top"
          contentWidth={contentWidth}
        />
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...shadows.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    headerCopy: {
      flex: 1,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      marginTop: 2,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
    headerActions: {
      alignItems: 'flex-end',
      gap: 2,
    },
    modePill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    modePillText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    weekControls: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    navButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    navButtonDisabled: {
      opacity: 0.55,
    },
    emptyState: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      padding: spacing.lg,
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      gap: spacing.md,
      ...shadows.sm,
    },
    emptyCopy: {
      flex: 1,
    },
    emptyTitle: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    emptySubtitle: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
  });

export default MicrocycleTimeline;
