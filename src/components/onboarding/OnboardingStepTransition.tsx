import React from 'react';
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';

const TRANSITION_DURATION = 280;

interface OnboardingStepTransitionProps {
  stepKey: number;
  direction: 1 | -1;
  children: React.ReactNode;
}

export const OnboardingStepTransition: React.FC<OnboardingStepTransitionProps> = ({
  stepKey,
  direction,
  children,
}) => {
  const entering =
    direction === 1
      ? SlideInRight.duration(TRANSITION_DURATION)
      : SlideInLeft.duration(TRANSITION_DURATION);

  const exiting =
    direction === 1
      ? SlideOutLeft.duration(TRANSITION_DURATION)
      : SlideOutRight.duration(TRANSITION_DURATION);

  return (
    <Animated.View key={stepKey} entering={entering} exiting={exiting}>
      {children}
    </Animated.View>
  );
};
