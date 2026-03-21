import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, fontSize, borderRadius } from '../../constants/colors';

export interface ToastConfig {
  message: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

interface WorkoutToastProps {
  visible: boolean;
  config: ToastConfig | null;
  onHide: () => void;
  /** Duration in ms before auto-dismiss. Default: 1500 */
  duration?: number;
}

const TOAST_DURATION = 1500;

export const WorkoutToast: React.FC<WorkoutToastProps> = ({
  visible,
  config,
  onHide,
  duration = TOAST_DURATION,
}) => {
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible && config) {
      // Animate IN
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 200,
      });

      // Animate OUT after duration
      const timer = setTimeout(() => {
        translateY.value = withTiming(-120, {
          duration: 300,
          easing: Easing.in(Easing.ease),
        });
        opacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(onHide)();
          }
        });
        scale.value = withTiming(0.8, { duration: 300 });
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Reset values when hidden
      translateY.value = -120;
      opacity.value = 0;
      scale.value = 0.8;
    }
  }, [visible, config]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!config) return null;

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      pointerEvents="none"
    >
      <View style={styles.toast}>
        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: config.iconColor + '20' }]}>
          <Ionicons
            name={config.icon}
            size={28}
            color={config.iconColor}
          />
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={styles.message}>{config.message}</Text>
          {config.subtitle && (
            <Text style={styles.subtitle}>{config.subtitle}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.92)',
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    minWidth: 220,
    maxWidth: '85%',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
});
