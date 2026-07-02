import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, fontSize, borderRadius } from '../../constants/colors';
import { useAppTheme, useThemedStyles } from '../../theme';
import { useToastStore, AppToastVariant } from '../../store/toastStore';

const SUCCESS_INFO_DURATION = 2200;
const ERROR_DURATION = 3200;

const variantIcons: Record<AppToastVariant, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

export const AppToast: React.FC = () => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const visible = useToastStore((state) => state.visible);
  const config = useToastStore((state) => state.config);
  const hide = useToastStore((state) => state.hide);

  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (visible && config) {
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 200,
      });

      const duration = config.variant === 'error' ? ERROR_DURATION : SUCCESS_INFO_DURATION;
      const timer = setTimeout(() => {
        translateY.value = withTiming(-120, {
          duration: 300,
          easing: Easing.in(Easing.ease),
        });
        opacity.value = withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(hide)();
          }
        });
        scale.value = withTiming(0.8, { duration: 300 });
      }, duration);

      return () => clearTimeout(timer);
    }

    translateY.value = -120;
    opacity.value = 0;
    scale.value = 0.8;
    return undefined;
  }, [config, hide, opacity, scale, translateY, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!config) return null;

  const iconColor =
    config.variant === 'success'
      ? theme.colors.success
      : config.variant === 'error'
        ? theme.colors.error
        : theme.colors.primary;

  return (
    <Animated.View
      style={[styles.container, { top: insets.top + spacing.md }, animatedStyle]}
      pointerEvents="none"
    >
      <View
        style={styles.toast}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <View style={[styles.iconCircle, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name={variantIcons[config.variant]} size={26} color={iconColor} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.message}>{config.message}</Text>
          {config.subtitle ? <Text style={styles.subtitle}>{config.subtitle}</Text> : null}
        </View>
      </View>
    </Animated.View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 9999,
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.xl,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
      minWidth: 220,
      maxWidth: '85%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: theme.isDark ? 0.4 : 0.15,
      shadowRadius: 16,
      elevation: 10,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textContainer: {
      flex: 1,
      flexShrink: 1,
    },
    message: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
  });
