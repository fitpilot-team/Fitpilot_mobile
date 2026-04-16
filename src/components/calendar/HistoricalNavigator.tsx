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
  const shouldStackHeaderActions = isTabletPortrait;

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
      <View style={[styles.header, shouldStackHeaderActions ? styles.headerStacked : null]}>
        <View style={styles.headerCopy}>
          {showEyebrow ? (
            <Text style={[styles.eyebrow, { color: resolvedAccentColor }]}>{eyebrow}</Text>
          ) : null}
          <Text
            numberOfLines={shouldStackHeaderActions ? 2 : 1}
            style={[
              styles.title,
              showEyebrow ? styles.titleWithEyebrow : null,
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={2} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.headerActions,
            shouldStackHeaderActions ? styles.headerActionsStacked : null,
          ]}
        >
          {weekLabel ? (
            <View
              style={[
                styles.weekPill,
                shouldStackHeaderActions ? styles.weekPillStacked : null,
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

          <View
            style={[
              styles.actionRow,
              shouldStackHeaderActions ? styles.actionRowStacked : null,
            ]}
          >
            {showWeekButtons ? (
              <>
                <Pressable
                  onPress={() => onShiftWeek(-1)}
                  disabled={!canGoToPreviousWeek}
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
                style={[
                  styles.dateButton,
                  {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Ionicons name="calendar-clear-outline" size={14} color={resolvedAccentColor} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.dateButtonText,
                    { color: resolvedAccentColor },
                  ]}
                >
                  {datePickerLabel}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <View
        style={[
          styles.calendarWrap,
          shouldStackHeaderActions ? styles.calendarWrapStacked : null,
        ]}
        {...panResponder.panHandlers}
      >
        <SharedWeeklyCalendar
          days={days}
          heroSelectionMode="selected-only"
          density="tight-top"
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
      paddingTop: spacing.sm,
      paddingBottom: 2,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    headerStacked: {
      alignItems: 'stretch',
      flexWrap: 'wrap',
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
    },
    title: {
      fontSize: fontSize.base,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    titleWithEyebrow: {
      marginTop: 6,
    },
    subtitle: {
      marginTop: 2,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
    headerActions: {
      alignItems: 'flex-end',
      gap: 6,
      maxWidth: '52%',
    },
    headerActionsStacked: {
      width: '100%',
      maxWidth: '100%',
      alignItems: 'flex-start',
    },
    weekPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
      borderWidth: Platform.OS === 'android' && theme.isDark ? 0 : 1,
      alignSelf: 'flex-end',
    },
    weekPillStacked: {
      alignSelf: 'flex-start',
    },
    weekPillText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      textTransform: 'capitalize',
      textAlign: 'right',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      flexWrap: 'wrap',
    },
    actionRowStacked: {
      justifyContent: 'flex-start',
      width: '100%',
    },
    navButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
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
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    dateButtonText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
    },
    calendarWrap: {
      marginTop: -8,
    },
    calendarWrapStacked: {
      marginTop: spacing.xs,
    },
  });

export default HistoricalNavigator;
