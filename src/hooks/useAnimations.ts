import { useCallback, useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

/**
 * Hook para animación de entrada con fade y slide
 * Útil para animar elementos de una lista escalonadamente
 */
export const useEntryAnimation = (index: number = 0, delay: number = 100) => {
  const progress = useSharedValue(0);

  const startAnimation = useCallback(() => {
    progress.value = withDelay(
      index * delay,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, [index, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 1],
          [20, 0],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  return { animatedStyle, startAnimation, progress };
};

/**
 * Hook para animación de pulsación (press feedback)
 * Da feedback táctil suave al presionar elementos
 */
export const usePressAnimation = (scaleValue: number = 0.96) => {
  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    scale.value = withSpring(scaleValue, { damping: 15, stiffness: 400 });
  }, [scaleValue]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, onPressIn, onPressOut };
};

/**
 * Hook para animación de contador numérico
 * Anima un número desde 0 hasta el valor objetivo
 */
export const useCountAnimation = (targetValue: number, duration: number = 1000) => {
  const animatedValue = useSharedValue(0);

  const startCounting = useCallback(() => {
    animatedValue.value = withTiming(targetValue, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [targetValue, duration]);

  const reset = useCallback(() => {
    animatedValue.value = 0;
  }, []);

  return { animatedValue, startCounting, reset };
};

/**
 * Hook para animación de bounce suave
 * Útil para selección de elementos
 */
export const useBounceAnimation = () => {
  const scale = useSharedValue(1);

  const bounce = useCallback(() => {
    scale.value = withSpring(1.1, { damping: 10, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, bounce };
};

/**
 * Hook para animación de fade in/out
 */
export const useFadeAnimation = (initialVisible: boolean = false) => {
  const opacity = useSharedValue(initialVisible ? 1 : 0);

  const fadeIn = useCallback((duration: number = 300) => {
    opacity.value = withTiming(1, { duration, easing: Easing.out(Easing.ease) });
  }, []);

  const fadeOut = useCallback((duration: number = 300) => {
    opacity.value = withTiming(0, { duration, easing: Easing.out(Easing.ease) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { animatedStyle, fadeIn, fadeOut, opacity };
};

/**
 * Hook para animación de slide desde dirección específica
 */
export const useSlideAnimation = (
  direction: 'left' | 'right' | 'up' | 'down' = 'up',
  distance: number = 50
) => {
  const progress = useSharedValue(0);

  const slideIn = useCallback((duration: number = 400) => {
    progress.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
  }, []);

  const slideOut = useCallback((duration: number = 400) => {
    progress.value = withTiming(0, { duration, easing: Easing.in(Easing.cubic) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateValue = interpolate(
      progress.value,
      [0, 1],
      [direction === 'left' || direction === 'up' ? -distance : distance, 0],
      Extrapolate.CLAMP
    );

    const isHorizontal = direction === 'left' || direction === 'right';

    return {
      opacity: interpolate(progress.value, [0, 1], [0, 1]),
      transform: isHorizontal
        ? [{ translateX: translateValue }]
        : [{ translateY: translateValue }],
    };
  });

  return { animatedStyle, slideIn, slideOut, progress };
};

/**
 * Hook para animar entrada de múltiples elementos escalonadamente
 * Usa con FlatList o map de componentes
 */
export const useStaggeredEntrance = (itemCount: number, staggerDelay: number = 80) => {
  const progress = useSharedValue(0);

  const startAnimation = useCallback(() => {
    progress.value = withTiming(1, {
      duration: 300 + itemCount * staggerDelay,
      easing: Easing.out(Easing.cubic),
    });
  }, [itemCount, staggerDelay]);

  const getItemStyle = useCallback(
    (index: number) => {
      'worklet';
      const itemStart = (index * staggerDelay) / (300 + itemCount * staggerDelay);
      const itemEnd = itemStart + 300 / (300 + itemCount * staggerDelay);

      const itemProgress = interpolate(
        progress.value,
        [itemStart, itemEnd],
        [0, 1],
        Extrapolate.CLAMP
      );

      return {
        opacity: itemProgress,
        transform: [
          { translateY: interpolate(itemProgress, [0, 1], [20, 0], Extrapolate.CLAMP) },
        ],
      };
    },
    [itemCount, staggerDelay]
  );

  return { startAnimation, getItemStyle, progress };
};

export default {
  useEntryAnimation,
  usePressAnimation,
  useCountAnimation,
  useBounceAnimation,
  useFadeAnimation,
  useSlideAnimation,
  useStaggeredEntrance,
};
