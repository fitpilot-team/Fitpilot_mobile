import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  borderRadius,
  fontSize,
  shadows,
  spacing,
} from '../../constants/colors';
import { Skeleton } from '../common';
import { useAppTheme, useThemedStyles } from '../../theme';
import type {
  AssignedProfessionalDomain,
  AssignedProfessionalSummary,
} from '../../types';

type AssignedProfessionalCardState =
  | 'loading'
  | 'assigned'
  | 'unassigned'
  | 'error';

type AssignedProfessionalCardProps = {
  domains: AssignedProfessionalDomain[];
  state: AssignedProfessionalCardState;
  summary?: AssignedProfessionalSummary | null;
  errorMessage?: string | null;
  compact?: boolean;
  embedded?: boolean;
  showDomainBadges?: boolean;
};

const DOMAIN_LABELS: Record<AssignedProfessionalDomain, string> = {
  training: 'Entrenamiento',
  nutrition: 'Nutrici\u00f3n',
};

const EMPTY_MESSAGES: Record<AssignedProfessionalDomain, string> = {
  training: 'A\u00fan no tienes entrenador asignado para entrenamiento.',
  nutrition: 'A\u00fan no tienes nutri\u00f3logo asignado para nutrici\u00f3n.',
};

const joinDomainLabels = (domains: AssignedProfessionalDomain[]) =>
  domains.map((domain) => DOMAIN_LABELS[domain]).join(' y ');

export const AssignedProfessionalCard: React.FC<AssignedProfessionalCardProps> = ({
  domains,
  state,
  summary,
  errorMessage,
  compact = false,
  embedded = false,
  showDomainBadges = true,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [summary?.avatarUrl]);

  const initials = useMemo(() => {
    const sourceLabel = summary?.fullName ?? joinDomainLabels(domains);
    return sourceLabel
      .split(' ')
      .map((token) => token[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [domains, summary?.fullName]);

  const emptyMessage =
    domains.length === 1
      ? EMPTY_MESSAGES[domains[0]]
      : 'A\u00fan no tienes profesionales asignados para tus planes actuales.';

  const canRenderAvatarImage =
    state === 'assigned' && Boolean(summary?.avatarUrl) && !hasImageError;

  if (state === 'loading') {
    return (
      <View
        style={[
          embedded ? styles.cardEmbedded : styles.card,
          !embedded && (compact ? styles.cardCompact : styles.cardExpanded),
        ]}
      >
        {showDomainBadges ? (
          <View style={styles.badgeRow}>
            {domains.map((domain) => (
              <DomainBadge key={domain} domain={domain} />
            ))}
          </View>
        ) : null}
        <View
          style={[
            styles.loadingRow,
            showDomainBadges ? styles.bodyRowWithBadges : null,
          ]}
        >
          <View
            style={[
              styles.avatarBase,
              compact ? styles.avatarCompact : styles.avatarExpanded,
            ]}
          />
          <View style={styles.loadingTextGroup}>
            <Skeleton width="62%" height={18} />
            <Skeleton width="44%" height={14} style={styles.loadingLine} />
            <Skeleton width="78%" height={14} style={styles.loadingLine} />
          </View>
        </View>
      </View>
    );
  }

  const headline =
    state === 'assigned'
      ? summary?.fullName ?? joinDomainLabels(domains)
      : joinDomainLabels(domains);
  const roleLabel =
    state === 'assigned'
      ? summary?.roleLabel
      : state === 'error'
        ? 'No disponible'
        : 'Sin asignaci\u00f3n';
  const contextLabel =
    state === 'assigned'
      ? summary?.contextLabel
      : state === 'error'
        ? errorMessage ?? 'No fue posible cargar esta asignaci\u00f3n.'
        : emptyMessage;

  return (
    <View
      style={[
        embedded ? styles.cardEmbedded : styles.card,
        !embedded && (compact ? styles.cardCompact : styles.cardExpanded),
      ]}
    >
      {showDomainBadges ? (
        <View style={styles.badgeRow}>
          {domains.map((domain) => (
            <DomainBadge key={domain} domain={domain} />
          ))}
        </View>
      ) : null}

      <View style={[styles.bodyRow, showDomainBadges ? styles.bodyRowWithBadges : null]}>
        <View
          style={[
            styles.avatarBase,
            compact ? styles.avatarCompact : styles.avatarExpanded,
            state === 'error'
              ? styles.avatarError
              : state === 'unassigned'
                ? styles.avatarUnassigned
                : null,
          ]}
        >
          {canRenderAvatarImage ? (
            <Image
              source={{ uri: summary?.avatarUrl ?? '' }}
              style={styles.avatarImage}
              onError={() => setHasImageError(true)}
            />
          ) : state === 'error' ? (
            <Ionicons
              name="alert-circle-outline"
              size={compact ? 22 : 24}
              color={theme.colors.error}
            />
          ) : state === 'unassigned' ? (
            <Ionicons
              name="person-outline"
              size={compact ? 20 : 22}
              color={theme.colors.icon}
            />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>

        <View style={styles.copyColumn}>
          <Text style={styles.headline}>{headline}</Text>
          {roleLabel ? <Text style={styles.roleLabel}>{roleLabel}</Text> : null}
          {contextLabel ? <Text style={styles.contextLabel}>{contextLabel}</Text> : null}
        </View>
      </View>
    </View>
  );
};

const DomainBadge: React.FC<{ domain: AssignedProfessionalDomain }> = ({
  domain,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const palette =
    domain === 'training'
      ? {
          backgroundColor: theme.colors.primarySoft,
          borderColor: theme.colors.primaryBorder,
          color: theme.colors.primary,
          icon: 'fitness-outline' as const,
        }
      : {
          backgroundColor: `${theme.colors.success}18`,
          borderColor: `${theme.colors.success}36`,
          color: theme.colors.success,
          icon: 'restaurant-outline' as const,
        };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
        },
      ]}
    >
      <Ionicons name={palette.icon} size={12} color={palette.color} />
      <Text style={[styles.badgeText, { color: palette.color }]}>
        {DOMAIN_LABELS[domain]}
      </Text>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...shadows.sm,
    },
    cardEmbedded: {
      backgroundColor: 'transparent',
    },
    cardCompact: {
      padding: spacing.md,
    },
    cardExpanded: {
      padding: spacing.lg,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      borderWidth: 1,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    badgeText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
    },
    bodyRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bodyRowWithBadges: {
      marginTop: spacing.md,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarBase: {
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    avatarCompact: {
      width: 52,
      height: 52,
    },
    avatarExpanded: {
      width: 64,
      height: 64,
    },
    avatarUnassigned: {
      backgroundColor: theme.colors.surfaceAlt,
      borderColor: theme.colors.border,
    },
    avatarError: {
      backgroundColor: `${theme.colors.error}12`,
      borderColor: `${theme.colors.error}30`,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    copyColumn: {
      flex: 1,
      marginLeft: spacing.md,
    },
    headline: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    roleLabel: {
      marginTop: 2,
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    contextLabel: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    loadingTextGroup: {
      flex: 1,
      marginLeft: spacing.md,
    },
    loadingLine: {
      marginTop: spacing.xs,
    },
  });

export default AssignedProfessionalCard;
