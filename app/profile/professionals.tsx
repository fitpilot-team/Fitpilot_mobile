import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ProfileDetailScreen } from '../../src/components/profile/ProfileDetailScreen';
import { CareTeamSection } from '../../src/components/care-team';
import { useCareTeam } from '../../src/hooks/useCareTeam';
import { useAuthStore } from '../../src/store/authStore';
import { borderRadius, fontSize, spacing } from '../../src/constants/colors';
import { useAppTheme, useThemedStyles } from '../../src/theme';

export default function ProfessionalsScreen() {
  const styles = useThemedStyles(createStyles);
  const user = useAuthStore((state) => state.user);
  const { summaries, errors, isLoading } = useCareTeam(user?.id ?? null);

  return (
    <ProfileDetailScreen
      title="Tus profesionales"
      subtitle="Ellos elaboran tus planes actuales."
    >
      <View style={styles.callout}>
        <Text style={styles.calloutTitle}>Planes activos</Text>
        <Text style={styles.calloutText}>
          Aquí puedes revisar quién lleva tu entrenamiento y tu nutrición dentro
          de tu plan actual.
        </Text>
      </View>

      <CareTeamSection
        summaries={summaries}
        errors={errors}
        isLoading={isLoading}
        title="Asignaciones actuales"
        presentation="segmented"
      />
    </ProfileDetailScreen>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    callout: {
      marginBottom: spacing.lg,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    calloutTitle: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    calloutText: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textMuted,
    },
  });
