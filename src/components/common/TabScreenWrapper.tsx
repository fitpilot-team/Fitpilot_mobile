import * as React from 'react';
import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';

interface TabScreenWrapperProps {
  children: React.ReactNode;
}

const FOCUS_ENTRY_START = 0.985;
const FOCUS_ENTRY_OPACITY = 0.96;

/**
 * Envuelve cada tab con una animacion ligera de entrada al ganar foco,
 * sin usar el foco como gate de visibilidad total.
 */
export const TabScreenWrapper = ({ children }: TabScreenWrapperProps) => {
  const isFocused = useIsFocused();
  const progress = useSharedValue(1);

  useEffect(() => {
    cancelAnimation(progress);

    if (!isFocused) {
      progress.value = 1;
      return;
    }

    progress.value = FOCUS_ENTRY_START;
    progress.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
      mass: 1,
    });
  }, [isFocused, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: interpolate(progress.value, [FOCUS_ENTRY_START, 1], [FOCUS_ENTRY_OPACITY, 1]),
    transform: [
      { scale: interpolate(progress.value, [FOCUS_ENTRY_START, 1], [0.992, 1]) },
      { translateY: interpolate(progress.value, [FOCUS_ENTRY_START, 1], [4, 0]) },
    ],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};
