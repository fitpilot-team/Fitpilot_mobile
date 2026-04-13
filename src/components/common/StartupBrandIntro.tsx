import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { brandColors } from '../../constants/colors';
import { LogoMark } from './LogoMark';
import WordmarkDark from '../../../assets/logo-wordmark-dark.svg';

type StartupBrandIntroProps = {
  onComplete: () => void;
};

const AnimatedView = Animated.createAnimatedComponent(View);

export const StartupBrandIntro: React.FC<StartupBrandIntroProps> = ({ onComplete }) => {
  const overlayOpacity = useSharedValue(1);
  const dotOpacity = useSharedValue(0);
  const dotScale = useSharedValue(0.5);
  const wingsOpacity = useSharedValue(0);
  const wingsTranslateX = useSharedValue(-18);
  const pOpacity = useSharedValue(0);
  const pTranslateY = useSharedValue(14);
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkTranslateY = useSharedValue(12);

  useEffect(() => {
    dotOpacity.value = withTiming(1, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
    dotScale.value = withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.back(1.1)),
    });
    wingsOpacity.value = withDelay(180, withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    }));
    wingsTranslateX.value = withDelay(180, withTiming(0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    }));
    pOpacity.value = withDelay(360, withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    }));
    pTranslateY.value = withDelay(360, withTiming(0, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    }));
    wordmarkOpacity.value = withDelay(560, withTiming(1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    }));
    wordmarkTranslateY.value = withDelay(560, withTiming(0, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    }));
    overlayOpacity.value = withDelay(980, withTiming(0, {
      duration: 200,
      easing: Easing.inOut(Easing.quad),
    }, (finished) => {
      if (finished) {
        runOnJS(onComplete)();
      }
    }));
  }, [dotOpacity, dotScale, onComplete, overlayOpacity, pOpacity, pTranslateY, wingsOpacity, wingsTranslateX, wordmarkOpacity, wordmarkTranslateY]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotScale.value }],
  }));

  const wingsStyle = useAnimatedStyle(() => ({
    opacity: wingsOpacity.value,
    transform: [{ translateX: wingsTranslateX.value }],
  }));

  const pStyle = useAnimatedStyle(() => ({
    opacity: pOpacity.value,
    transform: [{ translateY: pTranslateY.value }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkTranslateY.value }],
  }));

  return (
    <AnimatedView
      style={[styles.overlay, overlayStyle]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.glowLarge} />
      <View style={styles.glowSmall} />
      <View style={styles.content}>
        <View style={styles.markStage}>
          <AnimatedView style={[styles.markLayer, dotStyle]}>
            <LogoMark size={164} wingColor="transparent" pColor="transparent" showP={false} showWings={false} />
          </AnimatedView>
          <AnimatedView style={[styles.markLayer, wingsStyle]}>
            <LogoMark size={164} wingColor="#ffffff" pColor="transparent" showDot={false} showP={false} />
          </AnimatedView>
          <AnimatedView style={[styles.markLayer, pStyle]}>
            <LogoMark size={164} wingColor="transparent" showDot={false} showWings={false} />
          </AnimatedView>
        </View>
        <AnimatedView style={[styles.wordmarkWrap, wordmarkStyle]}>
          <WordmarkDark width={200} height={44} />
        </AnimatedView>
      </View>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: brandColors.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowLarge: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(103, 182, 223, 0.12)',
    top: 120,
    right: -48,
  },
  glowSmall: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(107, 183, 225, 0.12)',
    bottom: 110,
    left: -40,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markStage: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLayer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkWrap: {
    marginTop: 18,
  },
});

export default StartupBrandIntro;
