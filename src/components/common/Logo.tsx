import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme';

// Import SVG files directly as components
import GradientLogo from '../../../assets/FitPilot- DarkLogo.svg';
import StandardLogo from '../../../assets/FitPilot-Logo.svg';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  animated?: boolean;
  forceGradient?: boolean;
}

const SIZES = {
  xs: { width: 28, height: 28 },
  sm: { width: 40, height: 40 },
  md: { width: 80, height: 80 },
  lg: { width: 160, height: 160 },
};

const AnimatedView = Animated.createAnimatedComponent(View);

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = false,
  animated = false,
  forceGradient = false,
}) => {
  const { theme } = useAppTheme();
  const progress = useSharedValue(animated ? 0 : 1);
  const useGradient = forceGradient || theme.isDark;

  useEffect(() => {
    if (animated) {
      progress.value = withDelay(
        200,
        withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [animated, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.8, 1]) },
    ],
  }));

  const dimensions = SIZES[size];

  // Use the imported SVG components
  // Note: FitPilot-GradientLogo.svg has the text integrated
  const LogoComponent = useGradient ? GradientLogo : StandardLogo;

  // Adjust size based on design intent
  const width = showText ? dimensions.width * 2.5 : dimensions.width;
  const height = showText ? dimensions.height * 2.5 : dimensions.height;

  const content = (
    <LogoComponent
      width={width}
      height={height}
    />
  );

  if (animated) {
    return (
      <AnimatedView style={[styles.container, animatedStyle]}>
        {content}
      </AnimatedView>
    );
  }

  return <View style={styles.container}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Logo;
