import React from 'react';
import { View, StyleSheet } from 'react-native';
import { spacing } from '../../constants/colors';
import { useThemedStyles, type AppTheme } from '../../theme';

interface ProgressStepperProps {
  totalSteps: number;
  completedSteps: number;
  currentStep: number;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  totalSteps,
  completedSteps,
  currentStep,
}) => {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isCompleted = index < completedSteps;
        const isCurrent = index === currentStep;

        return (
          <View
            key={index}
            style={[
              styles.step,
              isCompleted && styles.stepCompleted,
              isCurrent && !isCompleted && styles.stepCurrent,
              index < totalSteps - 1 && styles.stepWithGap,
            ]}
          />
        );
      })}
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    step: {
      flex: 1,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
    },
    stepWithGap: {
      marginRight: spacing.xs,
    },
    stepCompleted: {
      backgroundColor: theme.colors.primary,
    },
    stepCurrent: {
      backgroundColor: theme.colors.primaryBorder,
    },
  });

export default ProgressStepper;
