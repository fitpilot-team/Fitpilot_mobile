import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../constants/colors';

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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  step: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
  },
  stepWithGap: {
    marginRight: spacing.xs,
  },
  stepCompleted: {
    backgroundColor: colors.primary[500],
  },
  stepCurrent: {
    backgroundColor: colors.primary[300],
  },
});
