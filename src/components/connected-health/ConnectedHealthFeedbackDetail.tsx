import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Card, SegmentedControl } from '../common';
import { useConnectedHealthFeedback } from '../../hooks/useConnectedHealthFeedback';
import { getConnectedHealthStateCopy } from '../../utils/connectedHealthFeedback';
import {
  borderRadius,
  fontSize,
  spacing,
} from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { ConnectedHealthFeedbackRange } from '../../types/connectedHealthFeedback';
import {
  ConnectedHealthCardSkeleton,
  ConnectedHealthEmptyState,
  ConnectedHealthErrorText,
  ConnectedHealthFreshnessBadge,
  ConnectedHealthInsightList,
  ConnectedHealthMetricTile,
} from './ConnectedHealthFeedbackParts';
import { ConnectedHealthHistoryCard } from './ConnectedHealthHistoryCard';

type RangeKey = '7' | '14' | '30';

const RANGE_OPTIONS = [
  { key: '7', label: '7 días' },
  { key: '14', label: '14 días' },
  { key: '30', label: '30 días' },
] satisfies { key: RangeKey; label: string }[];

const toRange = (value: RangeKey): ConnectedHealthFeedbackRange =>
  Number(value) as ConnectedHealthFeedbackRange;

export const ConnectedHealthFeedbackDetail: React.FC = () => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [rangeKey, setRangeKey] = useState<RangeKey>('14');
  const range = toRange(rangeKey);
  const {
    feedback,
    history,
    isLoading,
    isRefreshing,
    isSyncing,
    needsPermissionUpgradeCta,
    missingPermissionsLabel,
    connectionState,
    syncError,
    error,
    sync,
    requestPermissions,
    openSettings,
    refresh,
  } = useConnectedHealthFeedback({
    days: range,
    autoSync: true,
  });
  const stateCopy = getConnectedHealthStateCopy(connectionState, feedback.sourceLabel);
  const statusColor = useMemo(() => {
    if (feedback.readiness.status === 'good') {
      return theme.colors.success;
    }

    if (feedback.readiness.status === 'low' || feedback.readiness.status === 'watch') {
      return theme.colors.warning;
    }

    return theme.colors.primary;
  }, [feedback.readiness.status, theme.colors.primary, theme.colors.success, theme.colors.warning]);
  const showLoading = isLoading && !feedback.hasRealData;

  return (
    <View style={styles.container}>
      <Card style={styles.heroCard} padding="lg">
        <View style={styles.heroHeader}>
          <View style={styles.heroTitleWrap}>
            <View style={styles.heroIcon}>
              <Ionicons name="pulse-outline" size={22} color={theme.colors.primary} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>Salud</Text>
              <Text style={styles.title}>Recuperación y energía</Text>
              <Text style={styles.subtitle}>
                Fuente: {feedback.sourceLabel} - {feedback.latestDateLabel}
              </Text>
            </View>
          </View>
          <ConnectedHealthFreshnessBadge feedback={feedback} isSyncing={isSyncing} />
        </View>

        <SegmentedControl
          options={RANGE_OPTIONS}
          value={rangeKey}
          onChange={setRangeKey}
        />

        {showLoading ? (
          <ConnectedHealthCardSkeleton />
        ) : feedback.hasRealData ? (
          <View style={styles.readinessPanel}>
            <View style={[styles.readinessScore, { borderColor: `${statusColor}44` }]}>
              <Text style={[styles.readinessScoreText, { color: statusColor }]}>
                {feedback.readiness.score == null
                  ? '--'
                  : Math.round(feedback.readiness.score)}
              </Text>
              <Text style={styles.readinessScoreLabel}>score</Text>
            </View>
            <View style={styles.readinessCopy}>
              <Text style={styles.readinessTitle}>{feedback.readiness.title}</Text>
              <Text style={styles.readinessMessage}>{feedback.readiness.message}</Text>
            </View>
          </View>
        ) : (
          <ConnectedHealthEmptyState
            title={stateCopy.title}
            message={stateCopy.message}
            action={{
              label:
                stateCopy.action === 'permissions'
                  ? 'Conceder permisos'
                  : stateCopy.action === 'settings'
                    ? `Abrir ${feedback.sourceLabel}`
                    : 'Sincronizar ahora',
              icon:
                stateCopy.action === 'permissions'
                  ? 'key-outline'
                  : stateCopy.action === 'settings'
                    ? 'open-outline'
                    : 'sync-outline',
              onPress: () => {
                if (stateCopy.action === 'permissions') {
                  void requestPermissions();
                  return;
                }
                if (stateCopy.action === 'settings') {
                  void openSettings();
                  return;
                }

                void sync();
              },
              loading: isSyncing,
            }}
          />
        )}

        {needsPermissionUpgradeCta && feedback.hasRealData ? (
          <Text style={styles.partialPermissionsText}>
            Permisos incompletos
            {missingPermissionsLabel ? `: faltan ${missingPermissionsLabel}` : ''}. Actívalos
            desde el botón de permisos para completar tu recuperación.
          </Text>
        ) : null}

        <ConnectedHealthErrorText
          message={syncError ?? error ?? feedback.lastSyncErrorMessage}
        />
      </Card>

      {feedback.hasRealData ? (
        <>
          <View style={styles.actionsRow}>
            <Button
              title="Sincronizar"
              onPress={() => {
                void sync();
              }}
              isLoading={isSyncing}
              disabled={isRefreshing}
              icon={<Ionicons name="sync-outline" size={17} color="#ffffff" />}
              style={styles.actionButton}
            />
            <Button
              title="Ajustes"
              variant="secondary"
              onPress={() => router.push('/profile/connected-health' as never)}
              icon={<Ionicons name="settings-outline" size={17} color={theme.colors.primary} />}
              style={styles.actionButton}
            />
          </View>

          <Card style={styles.sectionCard} padding="md">
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Métricas relevantes</Text>
              <Button
                title="Refrescar"
                size="sm"
                variant="ghost"
                onPress={() => {
                  void refresh();
                }}
                disabled={isSyncing}
                isLoading={isRefreshing}
              />
            </View>
            <View style={styles.metricsGrid}>
              {feedback.metrics.map((metric) => (
                <ConnectedHealthMetricTile key={metric.key} metric={metric} compact />
              ))}
            </View>
          </Card>

          <ConnectedHealthHistoryCard history={history} isRefreshing={isRefreshing} />

          <Card style={styles.sectionCard} padding="md">
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Señales accionables</Text>
              <Text style={styles.sectionMeta}>{range} días</Text>
            </View>
            <ConnectedHealthInsightList insights={feedback.insights} />
          </Card>
        </>
      ) : null}
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      gap: spacing.md,
      paddingBottom: spacing.lg,
    },
    heroCard: {
      gap: spacing.md,
    },
    heroHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    heroTitleWrap: {
      flex: 1,
      minWidth: 220,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    heroIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    heroCopy: {
      flex: 1,
      gap: 3,
    },
    eyebrow: {
      fontSize: fontSize.xs,
      fontWeight: '800',
      color: theme.colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      lineHeight: 19,
    },
    readinessPanel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    readinessScore: {
      width: 78,
      height: 78,
      borderRadius: 39,
      borderWidth: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },
    readinessScoreText: {
      fontSize: fontSize['2xl'],
      fontWeight: '900',
      fontVariant: ['tabular-nums'],
    },
    readinessScoreLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    readinessCopy: {
      flex: 1,
      gap: spacing.xs,
    },
    readinessTitle: {
      fontSize: fontSize.lg,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    readinessMessage: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    actionButton: {
      flex: 1,
      minWidth: 150,
    },
    sectionCard: {
      gap: spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    sectionTitle: {
      fontSize: fontSize.base,
      fontWeight: '900',
      color: theme.colors.textPrimary,
    },
    sectionMeta: {
      fontSize: fontSize.xs,
      fontWeight: '800',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    partialPermissionsText: {
      fontSize: fontSize.xs,
      color: theme.colors.warning,
      lineHeight: 16,
    },
  });
