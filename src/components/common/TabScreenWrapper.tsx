import * as React from 'react';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useIsFocused } from '@react-navigation/native';

interface TabScreenWrapperProps {
  children: React.ReactNode;
}

/**
 * Componente que envuelve el contenido de cada pestaña para proporcionar
 * animaciones de transición (zoom + fade) cuando la pestaña se enfoca.
 */
export const TabScreenWrapper = ({ children }: TabScreenWrapperProps) => {
  const isFocused = useIsFocused();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.98);
  const translateY = useSharedValue(8);

  useEffect(() => {
    if (isFocused) {
      opacity.value = withTiming(1, { duration: 400 });
      scale.value = withTiming(1, { duration: 450 });
      translateY.value = withTiming(0, { duration: 400 });
    } else {
      // Reiniciar valores para la próxima vez que se enfoque
      opacity.value = 0;
      scale.value = 0.98;
      translateY.value = 8;
    }
  }, [isFocused, opacity, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
