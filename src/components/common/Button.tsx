import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, brandColors, spacing, fontSize } from '../../constants/colors';
import { useAppTheme, useThemedStyles } from '../../theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  style,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const isDisabled = disabled || isLoading;

  const content = isLoading ? (
    <ActivityIndicator
      color={variant === 'primary' || variant === 'danger' ? '#ffffff' : theme.colors.primary}
      size="small"
    />
  ) : (
    <>
      {icon}
      <Text
        style={[
          styles.text,
          styles[`text_${variant}`],
          styles[`text_${size}`],
          icon ? { marginLeft: spacing.sm } : undefined,
        ]}
      >
        {title}
      </Text>
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[isDisabled ? styles.disabled : null, style]}
      >
        <LinearGradient
          colors={[brandColors.navy, brandColors.sky]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.base,
            styles[`size_${size}`],
            styles.gradientContainer,
          ]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled ? styles.disabled : null,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
    },
    gradientContainer: {
      shadowColor: brandColors.navy,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
    primary: {
      // Unused now — gradient handles primary
      backgroundColor: theme.colors.primary,
    },
    secondary: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: theme.colors.error,
    },
    size_sm: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    size_md: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    size_lg: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
    },
    disabled: {
      opacity: 0.5,
    },
    text: {
      fontWeight: '600',
    },
    text_primary: {
      color: '#ffffff',
    },
    text_secondary: {
      color: theme.colors.textSecondary,
    },
    text_ghost: {
      color: theme.colors.primary,
    },
    text_danger: {
      color: '#ffffff',
    },
    text_sm: {
      fontSize: fontSize.sm,
    },
    text_md: {
      fontSize: fontSize.base,
    },
    text_lg: {
      fontSize: fontSize.lg,
    },
  });
