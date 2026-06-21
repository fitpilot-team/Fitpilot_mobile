import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { borderRadius, brandColors, fontSize, spacing } from '../../constants/colors';
import type { AppTheme } from '../../theme';

interface OnboardingProgressHeaderProps {
  stepIndex: number;
  totalSteps: number;
  title: string;
  theme: AppTheme;
}

export const OnboardingProgressHeader: React.FC<OnboardingProgressHeaderProps> = ({
  stepIndex,
  totalSteps,
  title,
  theme,
}) => {
  return (
    <>
      <Animated.Text
        key={title}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={[styles.title, { color: theme.colors.textPrimary }]}
      >
        {title}
      </Animated.Text>

      <View style={styles.segmentsRow}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              {
                backgroundColor:
                  index <= stepIndex ? brandColors.sky : theme.colors.primarySoft,
              },
            ]}
          />
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  title: {
    marginTop: 2,
    fontSize: fontSize['2xl'],
    fontWeight: '800',
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  segment: {
    flex: 1,
    height: 7,
    borderRadius: borderRadius.full,
  },
});
