import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, fontSize, borderRadius } from '../../constants/colors';

interface RestTimerProps {
  visible: boolean;
  initialSeconds: number;
  onComplete: () => void;
  onSkip: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  visible,
  initialSeconds,
  onComplete,
  onSkip,
}) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const progress = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      setSeconds(initialSeconds);
      progress.value = 1;
      progress.value = withTiming(0, {
        duration: initialSeconds * 1000,
        easing: Easing.linear,
      });
    }
  }, [visible, initialSeconds]);

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  // Handle completion in a separate effect to avoid setState during render
  useEffect(() => {
    if (visible && seconds === 0) {
      onComplete();
    }
  }, [visible, seconds, onComplete]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="time-outline" size={48} color={colors.primary[500]} />
          </View>

          <Text style={styles.title}>Descanso</Text>

          <Text style={styles.timer}>{formatTime(seconds)}</Text>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <Animated.View style={[styles.progressBar, progressStyle]} />
          </View>

          <Text style={styles.subtitle}>
            Tiempo recomendado: {formatTime(initialSeconds)}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Ionicons name="play-skip-forward" size={20} color={colors.gray[600]} />
              <Text style={styles.skipButtonText}>Saltar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.addButton} onPress={() => setSeconds((s) => s + 30)}>
              <Ionicons name="add" size={20} color={colors.primary[600]} />
              <Text style={styles.addButtonText}>+30s</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.sm,
  },
  timer: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.primary[600],
    marginBottom: spacing.lg,
    fontVariant: ['tabular-nums'],
  },
  progressContainer: {
    width: '100%',
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginBottom: spacing.xl,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  skipButtonText: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.gray[600],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  addButtonText: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.primary[600],
  },
});
