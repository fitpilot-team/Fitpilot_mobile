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
import { brandColors } from '../../constants/colors';
import { LogoMark } from './LogoMark';

import FullDarkLogo from '../../../assets/logo-full-dark.svg';
import FullLightLogo from '../../../assets/logo-full-light.svg';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showText?: boolean;
  animated?: boolean;
  color?: string;
  variant?: 'fullLight' | 'fullDark' | 'mark';
}

const SIZES = {
  xs: { width: 28, height: 28 },
  sm: { width: 55, height: 55 },
  md: { width: 80, height: 80 },
  lg: { width: 160, height: 160 },
};

const AnimatedView = Animated.createAnimatedComponent(View);

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = false,
  animated = false,
  color,
  variant,
}) => {
  const { theme } = useAppTheme();
  const progress = useSharedValue(animated ? 0 : 1);
  const resolvedVariant = variant ?? (theme.isDark ? 'fullDark' : 'fullLight');

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
  const isMark = resolvedVariant === 'mark';
  const width = showText && !isMark ? dimensions.width * 2.5 : dimensions.width;
  const height = showText && !isMark ? dimensions.height * 2.5 : dimensions.height;
  const markColor = color ?? (theme.isDark ? '#ffffff' : brandColors.navy);

  const content = isMark ? (
    <LogoMark size={width} wingColor={markColor} />
  ) : resolvedVariant === 'fullDark' ? (
    <FullDarkLogo width={width} height={height} />
  ) : (
    <FullLightLogo width={width} height={height} />
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
