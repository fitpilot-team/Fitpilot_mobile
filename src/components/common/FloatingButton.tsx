import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows } from '../../constants/colors';
import { useAppTheme } from '../../theme';

interface FloatingButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  accessibilityLabel: string;
  disabled?: boolean;
  isLoading?: boolean;
  size?: number;
  bottomOffset?: number;
  rightOffset?: number;
  style?: StyleProp<ViewStyle>;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  onPress,
  icon,
  accessibilityLabel,
  disabled = false,
  isLoading = false,
  size = 56,
  bottomOffset = -10,
  rightOffset = 25,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      activeOpacity={0.85}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          bottom: Math.max(insets.bottom, 0) + bottomOffset,
          right: rightOffset,
          backgroundColor: theme.colors.primary,
        },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {isLoading ? <ActivityIndicator color={colors.white} size="small" /> : icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
    elevation: 8,
  },
  disabled: {
    opacity: 0.6,
  },
});
