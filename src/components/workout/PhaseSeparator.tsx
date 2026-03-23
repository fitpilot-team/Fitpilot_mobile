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
import { spacing, fontSize, borderRadius } from '../../constants/colors';
import { useThemedStyles, type AppTheme } from '../../theme';
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
  }
> = {
  warmup: {
    icon: 'flame-outline',
    label: 'Calentamiento',
    gradientColors: ['#059669', '#10B981'],
    accentColor: '#10B981',
  },
  main: {
    icon: 'barbell-outline',
    label: 'Entrenamiento',
    gradientColors: ['#2563EB', '#3B82F6'],
    accentColor: '#3B82F6',
  },
  cooldown: {
    icon: 'snow-outline',
    label: 'Enfriamiento',
    gradientColors: ['#D97706', '#F59E0B'],
    accentColor: '#F59E0B',
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
  const styles = useThemedStyles(createStyles);
  const config = phaseConfig[phase];
  const backgroundTint = `rgba(${hexToRgb(config.accentColor)}, ${0.16})`;

  const rotation = useSharedValue(isCollapsed ? 0 : 180);

  React.useEffect(() => {
    rotation.value = withTiming(isCollapsed ? 0 : 180, {
      duration: 250,
      easing: Easing.out(Easing.ease),
    });
  }, [isCollapsed, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const hasProgress = completedCount !== undefined && totalCount !== undefined;

  const content = (
    <View style={[styles.chip, { backgroundColor: backgroundTint }]}>
      <LinearGradient
        colors={config.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.accentBar}
      />

      <View style={[styles.iconCircle, { backgroundColor: `${config.accentColor}22` }]}>
        <Ionicons name={config.icon} size={18} color={config.accentColor} />
      </View>

      <Text style={[styles.label, { color: config.accentColor }]}>
        {config.label}
      </Text>

      <View style={styles.spacer} />

      {isCompleted ? (
        <View style={[styles.completedBadge, { backgroundColor: `${config.accentColor}22` }]}>
          <Ionicons name="checkmark-circle" size={14} color={config.accentColor} />
          <Text style={[styles.completedBadgeText, { color: config.accentColor }]}>
            Listo
          </Text>
        </View>
      ) : null}

      {hasProgress && !isCompleted ? (
        <View style={[styles.progressBadge, { backgroundColor: `${config.accentColor}18` }]}>
          <Text style={[styles.progressBadgeText, { color: config.accentColor }]}>
            {completedCount}/{totalCount}
          </Text>
        </View>
      ) : null}

      {onToggle ? (
        <Animated.View style={chevronStyle}>
          <Ionicons name="chevron-down" size={18} color={config.accentColor} />
        </Animated.View>
      ) : null}
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

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;

  const intValue = Number.parseInt(value, 16);
  const r = (intValue >> 16) & 255;
  const g = (intValue >> 8) & 255;
  const b = intValue & 255;
  return `${r}, ${g}, ${b}`;
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
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

export default PhaseSeparator;
