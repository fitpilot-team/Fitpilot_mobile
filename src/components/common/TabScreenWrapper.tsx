import * as React from 'react';
import { useEffect } from 'react';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming,
  interpolate
} from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';

interface TabScreenWrapperProps {
  children: React.ReactNode;
}

/**
 * Componente que envuelve el contenido de cada pestaña para proporcionar
 * animaciones de transición (zoom + fade) cuando la pestaña se enfoca.
 * Refinado con efectos de muelle (spring) para una sensación más premium.
 */
export const TabScreenWrapper = ({ children }: TabScreenWrapperProps) => {
  const isFocused = useIsFocused();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 100,
      mass: 1,
    });
  }, [isFocused, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      opacity: interpolate(progress.value, [0, 0.2, 1], [0, 0, 1]),
      transform: [
        { scale: interpolate(progress.value, [0, 1], [0.97, 1]) },
        { translateY: interpolate(progress.value, [0, 1], [10, 0]) }
      ],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};
