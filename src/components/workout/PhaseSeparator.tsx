import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, fontSize, borderRadius } from '../../constants/colors';
import type { ExercisePhase } from '../../types';

interface PhaseSeparatorProps {
  phase: ExercisePhase;
  isCollapsed?: boolean;
  isCompleted?: boolean;
  onToggle?: () => void;
  completedCount?: number;
  totalCount?: number;
}

const phaseConfig: Record<
  ExercisePhase,
  {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    gradientColors: [string, string];
    accentColor: string;
    lightBg: string;
  }
> = {
  warmup: {
    icon: 'flame-outline',
    label: 'Calentamiento',
    gradientColors: ['#059669', '#10B981'],
    accentColor: '#10B981',
    lightBg: 'rgba(16, 185, 129, 0.08)',
  },
  main: {
    icon: 'barbell-outline',
    label: 'Entrenamiento',
    gradientColors: ['#2563EB', '#3B82F6'],
    accentColor: '#3B82F6',
    lightBg: 'rgba(59, 130, 246, 0.08)',
  },
  cooldown: {
    icon: 'snow-outline',
    label: 'Enfriamiento',
    gradientColors: ['#D97706', '#F59E0B'],
    accentColor: '#F59E0B',
    lightBg: 'rgba(245, 158, 11, 0.08)',
  },
};

export const PhaseSeparator: React.FC<PhaseSeparatorProps> = ({
  phase,
  isCollapsed = false,
  isCompleted = false,
  onToggle,
  completedCount,
  totalCount,
}) => {
  const config = phaseConfig[phase];

  // Animated chevron rotation
  const rotation = useSharedValue(isCollapsed ? 0 : 180);

  React.useEffect(() => {
    rotation.value = withTiming(isCollapsed ? 0 : 180, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [isCollapsed]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const hasProgress = completedCount !== undefined && totalCount !== undefined;

  const content = (
    <View style={[styles.chip, { backgroundColor: config.lightBg }]}>
      {/* Left accent bar */}
      <LinearGradient
        colors={config.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.accentBar}
      />

      {/* Icon */}
      <View style={[styles.iconCircle, { backgroundColor: config.accentColor + '18' }]}>
        <Ionicons name={config.icon} size={18} color={config.accentColor} />
      </View>

      {/* Label */}
      <Text style={[styles.label, { color: config.accentColor }]}>
        {config.label}
      </Text>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Completed badge */}
      {isCompleted && (
        <View style={[styles.completedBadge, { backgroundColor: config.accentColor + '18' }]}>
          <Ionicons name="checkmark-circle" size={14} color={config.accentColor} />
          <Text style={[styles.completedBadgeText, { color: config.accentColor }]}>
            Listo
          </Text>
        </View>
      )}

      {/* Progress badge */}
      {hasProgress && !isCompleted && (
        <View style={[styles.progressBadge, { backgroundColor: config.accentColor + '15' }]}>
          <Text style={[styles.progressBadgeText, { color: config.accentColor }]}>
            {completedCount}/{totalCount}
          </Text>
        </View>
      )}

      {/* Animated chevron */}
      {onToggle && (
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={18} color={config.accentColor} />
        </Animated.View>
      )}
    </View>
  );

  if (onToggle) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.container}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.lg,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  spacer: {
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  completedBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  progressBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  progressBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
});
