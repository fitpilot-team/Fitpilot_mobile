import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  borderRadius,
  fontSize,
  shadows,
  spacing,
} from '../../constants/colors';
import { useThemedStyles, type AppTheme } from '../../theme';
import type {
  AssignedProfessionalDomain,
  AssignedProfessionalSummary,
} from '../../types';
import { SegmentedControl } from '../common';
import {
  areSameAssignedProfessionals,
  mergeAssignedProfessionalSummaries,
} from '../../utils/careTeam';
import { AssignedProfessionalCard } from './AssignedProfessionalCard';

type CareTeamSectionProps = {
  summaries: Record<
    AssignedProfessionalDomain,
    AssignedProfessionalSummary | null
  >;
  errors: Record<AssignedProfessionalDomain, string | null>;
  isLoading: boolean;
  compact?: boolean;
  title?: string;
  subtitle?: string;
  horizontalPadding?: number;
  presentation?: 'cards' | 'segmented';
};

type CareTeamCardState = 'loading' | 'assigned' | 'unassigned' | 'error';

type CareTeamCardModel = {
  key: string;
  domains: AssignedProfessionalDomain[];
  domain: AssignedProfessionalDomain;
  state: CareTeamCardState;
  summary: AssignedProfessionalSummary | null;
  errorMessage: string | null;
};

const DOMAIN_OPTIONS: {
  key: AssignedProfessionalDomain;
  label: string;
}[] = [
  { key: 'training', label: 'Entrenamiento' },
  { key: 'nutrition', label: 'Nutrici\u00f3n' },
];

const buildCareTeamCardModel = (
  domain: AssignedProfessionalDomain,
  summaries: Record<
    AssignedProfessionalDomain,
    AssignedProfessionalSummary | null
  >,
  errors: Record<AssignedProfessionalDomain, string | null>,
  isLoading: boolean,
): CareTeamCardModel => {
  const summary = summaries[domain];
  const errorMessage = errors[domain];
  const isInitialLoading = isLoading && !summary && !errorMessage;

  if (isInitialLoading) {
    return {
      key: `${domain}-loading`,
      domains: [domain],
      domain,
      state: 'loading',
      summary: null,
      errorMessage: null,
    };
  }

  if (errorMessage) {
    return {
      key: `${domain}-error`,
      domains: [domain],
      domain,
      state: 'error',
      summary: null,
      errorMessage,
    };
  }

  return {
    key: `${domain}-${summary?.status ?? 'unassigned'}`,
    domains: [domain],
    domain,
    state: summary?.status === 'assigned' ? 'assigned' : 'unassigned',
    summary,
    errorMessage: null,
  };
};

const getCardPriority = (card: CareTeamCardModel) => {
  switch (card.state) {
    case 'assigned':
      return 3;
    case 'error':
      return 2;
    case 'unassigned':
      return 1;
    case 'loading':
    default:
      return 0;
  }
};

const getPreferredSegmentedDomain = (
  cards: Record<AssignedProfessionalDomain, CareTeamCardModel>,
) => {
  const cardEntries = [cards.training, cards.nutrition];

  return cardEntries.reduce((preferredDomain, candidateCard) => {
    const preferredCard = cards[preferredDomain];

    if (getCardPriority(candidateCard) > getCardPriority(preferredCard)) {
      return candidateCard.domain;
    }

    return preferredDomain;
  }, 'training' as AssignedProfessionalDomain);
};

export const CareTeamSection: React.FC<CareTeamSectionProps> = ({
  summaries,
  errors,
  isLoading,
  compact = false,
  title = 'Tus profesionales',
  subtitle,
  horizontalPadding = 0,
  presentation = 'cards',
}) => {
  const styles = useThemedStyles(createStyles);
  const trainingCard = useMemo(
    () => buildCareTeamCardModel('training', summaries, errors, isLoading),
    [errors, isLoading, summaries],
  );
  const nutritionCard = useMemo(
    () => buildCareTeamCardModel('nutrition', summaries, errors, isLoading),
    [errors, isLoading, summaries],
  );
  const cardsByDomain = useMemo(
    () => ({
      training: trainingCard,
      nutrition: nutritionCard,
    }),
    [nutritionCard, trainingCard],
  );

  const mergedAssignedSummary = useMemo(() => {
    if (
      areSameAssignedProfessionals(summaries.training, summaries.nutrition) &&
      summaries.training &&
      summaries.nutrition
    ) {
      return mergeAssignedProfessionalSummaries(
        summaries.training,
        summaries.nutrition,
      );
    }

    return null;
  }, [summaries.nutrition, summaries.training]);

  const preferredSegmentedDomain = useMemo(
    () => getPreferredSegmentedDomain(cardsByDomain),
    [cardsByDomain],
  );
  const [selectedDomain, setSelectedDomain] = useState<AssignedProfessionalDomain>(
    preferredSegmentedDomain,
  );
  const [hasManualSelection, setHasManualSelection] = useState(false);

  useEffect(() => {
    if (!hasManualSelection) {
      setSelectedDomain(preferredSegmentedDomain);
    }
  }, [hasManualSelection, preferredSegmentedDomain]);

  const shouldRenderSegmentedShell =
    presentation === 'segmented' && !mergedAssignedSummary;
  const activeSegmentedCard = cardsByDomain[selectedDomain];
  const stackedCards = useMemo(() => {
    if (mergedAssignedSummary) {
      return [
        {
          key: `merged-${mergedAssignedSummary.id ?? 'professional'}`,
          domains: ['training', 'nutrition'] as AssignedProfessionalDomain[],
          state: 'assigned' as const,
          summary: mergedAssignedSummary,
          errorMessage: null,
        },
      ];
    }

    return [trainingCard, nutritionCard];
  }, [mergedAssignedSummary, nutritionCard, trainingCard]);

  return (
    <View style={[styles.container, { paddingHorizontal: horizontalPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {shouldRenderSegmentedShell ? (
        <View style={styles.segmentedShell}>
          <SegmentedControl
            options={DOMAIN_OPTIONS}
            value={selectedDomain}
            onChange={(domain) => {
              setHasManualSelection(true);
              setSelectedDomain(domain);
            }}
          />
          <View style={styles.segmentedCardContent}>
            <AssignedProfessionalCard
              key={activeSegmentedCard.key}
              domains={activeSegmentedCard.domains}
              state={activeSegmentedCard.state}
              summary={activeSegmentedCard.summary}
              errorMessage={activeSegmentedCard.errorMessage}
              compact={compact}
              embedded
              showDomainBadges={false}
            />
          </View>
        </View>
      ) : (
        <View style={styles.cardsColumn}>
          {stackedCards.map((card) => (
            <AssignedProfessionalCard
              key={card.key}
              domains={card.domains}
              state={card.state}
              summary={card.summary}
              errorMessage={card.errorMessage}
              compact={compact}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      width: '100%',
    },
    header: {
      marginBottom: spacing.md,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    cardsColumn: {
      gap: spacing.sm,
      padding: spacing.xs,
      borderRadius: borderRadius.xl,
    },
    segmentedShell: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      ...shadows.sm,
    },
    segmentedCardContent: {
      minHeight: 112,
      justifyContent: 'center',
    },
  });

export default CareTeamSection;
