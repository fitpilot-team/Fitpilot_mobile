import React from 'react';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { borderRadius, brandColors, fontSize, spacing } from '../../constants/colors';
import type { AppTheme } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface OnboardingChoiceChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  compact?: boolean;
  theme: AppTheme;
}

export const OnboardingChoiceChip: React.FC<OnboardingChoiceChipProps> = ({
  label,
  isSelected,
  onPress,
  compact = false,
  theme,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.96, { duration: 80 }),
      withTiming(1, { duration: 120 }),
    );
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const chipStyle: ViewStyle = compact
    ? {
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
      }
    : {
        borderRadius: borderRadius.full,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceAlt,
        minHeight: 44,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
      };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        chipStyle,
        isSelected
          ? { borderColor: brandColors.sky, backgroundColor: brandColors.sky }
          : null,
        animatedStyle,
      ]}
    >
      {isSelected && !compact ? (
        <Ionicons name="checkmark" size={14} color="#ffffff" />
      ) : null}
      <Text
        style={[
          styles.chipText,
          { color: theme.colors.textSecondary },
          isSelected ? styles.chipTextSelected : null,
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
});
