import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { spacing, fontSize } from '../../constants/colors';
import { useAppTheme, useThemedStyles } from '../../theme';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color,
  text,
  fullScreen = false,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const spinnerColor = color ?? theme.colors.primary;

  const content = (
    <>
      <ActivityIndicator size={size} color={spinnerColor} />
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return <View style={styles.container}>{content}</View>;
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    container: {
      padding: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fullScreen: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
    },
    text: {
      marginTop: spacing.md,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
  });
