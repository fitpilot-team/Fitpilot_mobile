import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, shadows, colors } from '../../constants/colors';

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
  tint = 'light',
  borderGradient = true,
  padding = 'md',
}) => {
  return (
    <View style={[styles.container, shadows.lg, style]}>
      {borderGradient && (
        <LinearGradient
          colors={['rgba(255,255,255,0.6)', 'rgba(255,255,255,0.2)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.borderGradient}
        />
      )}
      <View style={styles.innerContainer}>
        <BlurView
          intensity={intensity}
          tint={tint}
          style={[styles.blurView, { padding: PADDING_VALUES[padding] }]}
        >
          {children}
        </BlurView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  borderGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  innerContainer: {
    margin: 1, // Espacio para el borde gradiente
    borderRadius: borderRadius.xl - 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  blurView: {
    overflow: 'hidden',
  },
});

export default GlassCard;
