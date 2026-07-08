import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../common';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { SplitDay, SplitDayStatus } from '../../utils/trainingSplit';

interface SplitDayCardProps {
  day: SplitDay;
  expanded: boolean;
  onToggle: () => void;
  onAction: () => void;
  isBusy?: boolean;
}

interface StatusMeta {
  label: string;
  color: string;
  background: string;
  border: string;
}

const getStatusMeta = (status: SplitDayStatus, theme: AppTheme): StatusMeta => {
  switch (status) {
    case 'completed':
      return {
        label: 'Completado',
        color: theme.colors.success,
        background: `${theme.colors.success}18`,
        border: `${theme.colors.success}44`,
      };
    case 'in_progress':
      return {
        label: 'En progreso',
        color: theme.colors.primary,
        background: theme.colors.primarySoft,
        border: theme.colors.primaryBorder,
      };
    case 'abandoned':
      return {
        label: 'Abandonado',
        color: theme.colors.warning,
        background: `${theme.colors.warning}1A`,
        border: `${theme.colors.warning}44`,
      };
    case 'rest':
      return {
        label: 'Descanso',
        color: theme.colors.textMuted,
        background: theme.colors.surfaceAlt,
        border: theme.colors.border,
      };
    default:
      return {
        label: 'Pendiente',
        color: theme.colors.textMuted,
        background: theme.colors.surfaceAlt,
        border: theme.colors.border,
      };
  }
};

export const SplitDayCard: React.FC<SplitDayCardProps> = ({
  day,
  expanded,
  onToggle,
  onAction,
  isBusy = false,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const statusMeta = useMemo(() => getStatusMeta(day.status, theme), [day.status, theme]);

  const dayEyebrow = `Día ${day.dayNumber}${day.sessionLabel ? ` · ${day.sessionLabel}` : ''}`;
  const isExpandable = !day.isRestDay;
  const showBody = expanded && isExpandable;

  return (
    <View style={[styles.card, day.isToday ? styles.cardToday : null]}>
      <Pressable
        onPress={isExpandable ? onToggle : undefined}
        disabled={!isExpandable}
        accessibilityRole={isExpandable ? 'button' : undefined}
        accessibilityLabel={`${day.name}, ${statusMeta.label}`}
        accessibilityState={{ expanded: showBody }}
        style={({ pressed }) => [styles.header, pressed && isExpandable ? styles.headerPressed : null]}
      >
        <View style={styles.headerCopy}>
          <View style={styles.eyebrowRow}>
            <Text style={styles.eyebrow}>{dayEyebrow}</Text>
            {day.isToday ? (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Hoy</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.dayName}>{day.name}</Text>
          {day.focus ? (
            <Text style={styles.dayFocus} numberOfLines={1}>
              {day.focus}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusMeta.background, borderColor: statusMeta.border }]}>
              <Text style={[styles.statusBadgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
            </View>
            {isExpandable ? (
              <Text style={styles.metaText}>
                {day.exerciseCount} {day.exerciseCount === 1 ? 'ejercicio' : 'ejercicios'} · {day.totalSets} series
              </Text>
            ) : null}
          </View>
        </View>

        {isExpandable ? (
          <Ionicons
            name={showBody ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.iconMuted}
          />
        ) : null}
      </Pressable>

      {showBody ? (
        <View style={styles.body}>
          {day.exercises.length > 0 ? (
            <View style={styles.exerciseList}>
              {day.exercises.map((exercise, index) => (
                <View key={exercise.id} style={styles.exerciseRow}>
                  <View style={styles.exerciseIndex}>
                    <Text style={styles.exerciseIndexText}>{index + 1}</Text>
                  </View>
                  <View style={styles.exerciseCopy}>
                    <Text style={styles.exerciseName} numberOfLines={2}>
                      {exercise.name}
                    </Text>
                    <Text style={styles.exercisePrescription}>{exercise.prescription}</Text>
                  </View>
                  {exercise.setTypeShortLabel ? (
                    <View style={styles.setTypeChip}>
                      <Text style={styles.setTypeChipText}>{exercise.setTypeShortLabel}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyExercises}>Sin ejercicios planificados para este día.</Text>
          )}

          <Button
            title={day.actionLabel}
            onPress={onAction}
            isLoading={isBusy}
            disabled={day.locked}
            variant={day.status === 'completed' ? 'secondary' : 'primary'}
            fullWidth
          />
          {day.locked ? (
            <View style={styles.lockedHint}>
              <Ionicons name="lock-closed" size={13} color={theme.colors.textMuted} />
              <Text style={styles.lockedHintText}>
                Completa antes tus entrenamientos pendientes.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    card: {
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    cardToday: {
      borderColor: theme.colors.primaryBorder,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
    },
    headerPressed: {
      opacity: 0.85,
    },
    headerCopy: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0,
    },
    eyebrowRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    eyebrow: {
      fontSize: fontSize.xs,
      fontWeight: '800',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    todayBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primary,
    },
    todayBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#ffffff',
      textTransform: 'uppercase',
    },
    dayName: {
      fontSize: fontSize.lg,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    dayFocus: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: borderRadius.full,
      borderWidth: 1,
    },
    statusBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    metaText: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      fontWeight: '600',
    },
    body: {
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.colors.border,
    },
    exerciseList: {
      gap: spacing.sm,
    },
    exerciseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    exerciseIndex: {
      width: 26,
      height: 26,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    exerciseIndexText: {
      fontSize: fontSize.xs,
      fontWeight: '800',
      color: theme.colors.textSecondary,
      fontVariant: ['tabular-nums'],
    },
    exerciseCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    exerciseName: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    exercisePrescription: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      fontVariant: ['tabular-nums'],
    },
    setTypeChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: borderRadius.sm,
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    setTypeChipText: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.primary,
      textTransform: 'uppercase',
    },
    emptyExercises: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      fontStyle: 'italic',
    },
    lockedHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    lockedHintText: {
      flex: 1,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      fontWeight: '600',
    },
  });
