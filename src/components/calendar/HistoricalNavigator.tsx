import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { borderRadius, fontSize, shadows, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import {
  SharedWeeklyCalendar,
  type SharedWeeklyCalendarDay,
} from './SharedWeeklyCalendar';

interface HistoricalNavigatorProps {
  days: SharedWeeklyCalendarDay[];
  title: string;
  subtitle?: string | null;
  eyebrow?: string | null;
  weekLabel?: string | null;
  contentWidth?: number;
  isTabletPortrait?: boolean;
  canGoToPreviousWeek?: boolean;
  canGoToNextWeek?: boolean;
  showWeekButtons?: boolean;
  datePickerLabel?: string;
  accentColor?: string;
  onShiftWeek: (direction: -1 | 1) => void;
  onOpenDatePicker?: () => void;
}

const SWIPE_ACTIVATION_THRESHOLD = 10;
const SWIPE_THRESHOLD = 28;

export const HistoricalNavigator: React.FC<HistoricalNavigatorProps> = ({
  days,
  title,
  subtitle,
  eyebrow,
  weekLabel,
  contentWidth = 390,
  isTabletPortrait = false,
  canGoToPreviousWeek = true,
  canGoToNextWeek = true,
  showWeekButtons = true,
  datePickerLabel = 'Ir a fecha',
  accentColor,
  onShiftWeek,
  onOpenDatePicker,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const showEyebrow = Boolean(eyebrow);
  const resolvedAccentColor = accentColor ?? theme.colors.primary;
  const showDateButtonText = contentWidth >= 420;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          Math.abs(gestureState.dx) > SWIPE_ACTIVATION_THRESHOLD &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > SWIPE_ACTIVATION_THRESHOLD &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderTerminationRequest: () => false,
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

  if (!days.length) {
    return null;
  }

  return (
    <View style={styles.containerShell}>
      <View style={styles.containerSurface}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            {showEyebrow ? (
              <Text style={[styles.eyebrow, { color: resolvedAccentColor }]}>{eyebrow}</Text>
            ) : null}
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                showEyebrow ? styles.titleWithEyebrow : null,
              ]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text numberOfLines={1} style={styles.subtitle}>
                {subtitle}
              </Text>
            ) : null}
          </View>

          <View style={styles.actionRow}>
            {weekLabel ? (
              <View
                style={[
                  styles.weekPill,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.weekPillText, { color: resolvedAccentColor }]}
                >
                  {weekLabel}
                </Text>
              </View>
            ) : null}

            {showWeekButtons ? (
              <>
                <Pressable
                  onPress={() => onShiftWeek(-1)}
                  disabled={!canGoToPreviousWeek}
                  accessibilityRole="button"
                  accessibilityLabel="Semana anterior"
                  style={[
                    styles.navButton,
                    !canGoToPreviousWeek ? styles.navButtonDisabled : null,
                  ]}
                >
                  <Ionicons
                    name="chevron-back"
                    size={16}
                    color={canGoToPreviousWeek ? theme.colors.textPrimary : theme.colors.textMuted}
                  />
                </Pressable>

                <Pressable
                  onPress={() => onShiftWeek(1)}
                  disabled={!canGoToNextWeek}
                  accessibilityRole="button"
                  accessibilityLabel="Semana siguiente"
                  style={[
                    styles.navButton,
                    !canGoToNextWeek ? styles.navButtonDisabled : null,
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={canGoToNextWeek ? theme.colors.textPrimary : theme.colors.textMuted}
                  />
                </Pressable>
              </>
            ) : null}

            {onOpenDatePicker ? (
              <Pressable
                onPress={onOpenDatePicker}
                accessibilityRole="button"
                accessibilityLabel={datePickerLabel}
                style={[
                  styles.dateButton,
                  !showDateButtonText ? styles.dateButtonIconOnly : null,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Ionicons name="calendar-clear-outline" size={18} color={resolvedAccentColor} />
                {showDateButtonText ? (
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.dateButtonText,
                      { color: resolvedAccentColor },
                    ]}
                  >
                    {datePickerLabel}
                  </Text>
                ) : null}
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.calendarWrap} {...panResponder.panHandlers}>
          <SharedWeeklyCalendar
            days={days}
            heroSelectionMode="selected-only"
            density="compact"
            contentWidth={contentWidth}
            isTabletPortrait={isTabletPortrait}
          />
        </View>
      </View>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    containerShell: {
      borderRadius: borderRadius.lg,
      ...(Platform.OS === 'android' && theme.isDark
        ? {
            shadowColor: 'transparent',
            shadowOpacity: 0,
            shadowRadius: 0,
            shadowOffset: { width: 0, height: 0 },
            elevation: 0,
          }
        : shadows.sm),
    },
    containerSurface: {
      borderRadius: borderRadius.lg,
      backgroundColor: theme.isDark ? theme.colors.primarySoft : theme.colors.surface,
      borderWidth: Platform.OS === 'android' && theme.isDark ? 0 : 1,
      borderColor:
        Platform.OS === 'android' && theme.isDark
          ? 'transparent'
          : theme.isDark
            ? theme.colors.primaryBorder
            : theme.colors.border,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xs,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      minHeight: 48,
      paddingHorizontal: spacing.sm,
    },
    headerCopy: {
      flex: 1,
      minWidth: 0,
    },
    eyebrow: {
      fontSize: fontSize.xs,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 1,
      lineHeight: 12,
    },
    title: {
      fontSize: fontSize.sm,
      fontWeight: '800',
      color: theme.colors.textPrimary,
      lineHeight: 18,
    },
    titleWithEyebrow: {
      marginTop: 1,
    },
    subtitle: {
      marginTop: 1,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      lineHeight: 15,
    },
    weekPill: {
      minHeight: 32,
      maxWidth: 108,
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: Platform.OS === 'android' && theme.isDark ? 0 : 1,
    },
    weekPillText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'capitalize',
      textAlign: 'center',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.xs,
      flexShrink: 0,
    },
    navButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: Platform.OS === 'android' && theme.isDark ? 0 : 1,
      borderColor: theme.colors.border,
    },
    navButtonDisabled: {
      opacity: 0.5,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: borderRadius.full,
      borderWidth: Platform.OS === 'android' && theme.isDark ? 0 : 1,
      minHeight: 44,
      paddingHorizontal: spacing.sm,
    },
    dateButtonIconOnly: {
      width: 44,
      paddingHorizontal: 0,
      justifyContent: 'center',
    },
    dateButtonText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
    },
    calendarWrap: {
      marginTop: -4,
    },
  });

export default HistoricalNavigator;
