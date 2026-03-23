import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, shadows } from '../../constants/colors';
import { useAppTheme, useThemedStyles } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderGradient?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING_VALUES = {
  none: 0,
  sm: 8,
  md: 16,
  lg: 24,
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 50,
  tint = 'default',
  borderGradient = true,
  padding = 'md',
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const resolvedTint = tint === 'default' ? theme.colors.blurTint : tint;

  return (
    <View style={[styles.container, shadows.lg, style]}>
      {borderGradient ? (
        <LinearGradient
          colors={
            theme.isDark
              ? ['rgba(148,163,184,0.24)', 'rgba(15,23,42,0.12)']
              : ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.2)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.borderGradient}
        />
      ) : null}
      <View style={styles.innerContainer}>
        <BlurView
          intensity={intensity}
          tint={resolvedTint}
          style={[styles.blurView, { padding: PADDING_VALUES[padding] }]}
        >
          {children}
        </BlurView>
      </View>
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    container: {
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
    },
    borderGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    innerContainer: {
      margin: 1,
      borderRadius: borderRadius.xl - 1,
      overflow: 'hidden',
      backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.1)',
    },
    blurView: {
      overflow: 'hidden',
    },
  });

export default GlassCard;
