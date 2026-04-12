import React, { useEffect, useMemo, useState } from 'react';
import { InteractionManager, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useAppTheme, useThemedStyles } from '../../src/theme';
import {
  BottomTabBarVisibilityProvider,
  useBottomTabBarVisibility,
} from '../../src/hooks/useBottomTabBarVisibility';
import { isTabletLayout } from '../../src/utils/layout';
import { ProtectedRoute } from '../../src/components/common';
import { useAuthStore } from '../../src/store/authStore';
import { registerDevicePushTokenForUser } from '../../src/services/notifications';

const TABLET_EXPANDED_WIDTH = 164;
const TABLET_COLLAPSED_WIDTH = 84;
const TABLET_TOP_PADDING = 72;
const TABLET_BOTTOM_PADDING = 18;
const PHONE_TAB_BAR_HEIGHT = 60;
const PHONE_TAB_BAR_VERTICAL_PADDING = 8;
const HIDDEN_CONTENT_BOTTOM_INSET = 12;

interface TabletTabBarProps {
  props: BottomTabBarProps;
  isExpanded: boolean;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
  onToggle: () => void;
}

interface PhoneTabBarProps {
  props: BottomTabBarProps;
}

type TabBarIconRenderer = (props: {
  focused: boolean;
  color: string;
  size: number;
}) => React.ReactNode;

type TabLayoutStyles = ReturnType<typeof createStyles>;

const TabletTabBar: React.FC<TabletTabBarProps> = ({
  props,
  isExpanded,
  onHoverIn,
  onHoverOut,
  onToggle,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Pressable
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={styles.tabletRailContainer}
    >
      <View
        style={[
          styles.tabletRailInner,
          isExpanded ? styles.tabletRailInnerExpanded : styles.tabletRailInnerCollapsed,
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Contraer navegacion' : 'Expandir navegacion'}
          onPress={onToggle}
          style={({ pressed }) => [
            styles.tabletRailToggle,
            pressed ? styles.tabletRailTogglePressed : null,
          ]}
        >
          <Ionicons
            name={isExpanded ? 'chevron-back' : 'chevron-forward'}
            size={18}
            color={theme.colors.tabBarActiveTint}
          />
        </Pressable>
        <BottomTabBar {...props} />
      </View>
    </Pressable>
  );
};

const PhoneTabBar: React.FC<PhoneTabBarProps> = ({ props }) => {
  const { state, descriptors, navigation } = props;
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isVisible, setContentInsetBottom } = useBottomTabBarVisibility();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const tabWidth = (width - 32) / state.routes.length;
  const indicatorX = useSharedValue(state.index * tabWidth);
  const visiblePaddingBottom = Math.max(insets.bottom, 16);
  const hiddenOffset = PHONE_TAB_BAR_HEIGHT + visiblePaddingBottom + 24;
  const visibleContentInset = PHONE_TAB_BAR_HEIGHT + visiblePaddingBottom + 16;

  useEffect(() => {
    indicatorX.value = withSpring(state.index * tabWidth, {
      damping: 20,
      stiffness: 150,
      mass: 0.8,
    });
    translateY.value = withSpring(isVisible ? 0 : hiddenOffset, {
      damping: 20,
      stiffness: 120,
    });
    opacity.value = withTiming(isVisible ? 1 : 0, { duration: 250 });
    setContentInsetBottom(
      isVisible ? visibleContentInset : insets.bottom + HIDDEN_CONTENT_BOTTOM_INSET,
    );
  }, [
    hiddenOffset,
    indicatorX,
    insets.bottom,
    isVisible,
    opacity,
    setContentInsetBottom,
    state.index,
    tabWidth,
    translateY,
    visibleContentInset,
  ]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value + (tabWidth - 48) / 2 }],
  }));

  return (
    <Animated.View
      pointerEvents={isVisible ? 'auto' : 'none'}
      style={[
        styles.phoneFloatingTabBarWrapper,
        animatedStyle,
        {
          paddingBottom: visiblePaddingBottom,
          paddingHorizontal: 16,
        },
      ]}
    >
      <BlurView
        intensity={Platform.OS === 'ios' ? (theme.isDark ? 45 : 60) : 90}
        tint={theme.colors.phoneNavShellBlurTint}
        style={styles.customTabBarBlur}
      >
        <View style={styles.customTabBarContainer}>
          <Animated.View
            style={[styles.customTabIconWrapperActive, styles.slidingIndicator, indicatorStyle]}
          />
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const label = options.title || route.name;

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={styles.customTabItem}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
              >
                <AnimatedTabIcon
                  focused={isFocused}
                  icon={options.tabBarIcon as TabBarIconRenderer | undefined}
                  activeColor={theme.colors.phoneNavIconActive}
                  inactiveColor={theme.colors.phoneNavIconInactive}
                  styles={styles}
                />
                <AnimatedLabel
                  focused={isFocused}
                  label={label === 'index' ? 'Inicio' : label}
                  activeColor={theme.colors.phoneNavLabelActive}
                  inactiveColor={theme.colors.phoneNavLabelInactive}
                  styles={styles}
                />
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </Animated.View>
  );
};

type AnimatedTabIconProps = {
  focused: boolean;
  icon?: TabBarIconRenderer;
  activeColor: string;
  inactiveColor: string;
  styles: TabLayoutStyles;
};

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({
  focused,
  icon,
  activeColor,
  inactiveColor,
  styles,
}) => {
  const scale = useSharedValue(focused ? 1.15 : 1);
  const opacity = useSharedValue(focused ? 1 : 0.7);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, {
      damping: 12,
      stiffness: 200,
    });
    opacity.value = withTiming(focused ? 1 : 0.7, { duration: 250 });
  }, [focused, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.customTabIconWrapper, animatedStyle]}>
      {icon?.({
        focused,
        color: focused ? activeColor : inactiveColor,
        size: 24,
      })}
    </Animated.View>
  );
};

type AnimatedLabelProps = {
  focused: boolean;
  label: string;
  activeColor: string;
  inactiveColor: string;
  styles: TabLayoutStyles;
};

const AnimatedLabel: React.FC<AnimatedLabelProps> = ({
  focused,
  label,
  activeColor,
  inactiveColor,
  styles,
}) => {
  const scale = useSharedValue(focused ? 1 : 0.92);
  const opacity = useSharedValue(focused ? 1 : 0.7);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.92, {
      damping: 15,
      stiffness: 150,
    });
    opacity.value = withTiming(focused ? 1 : 0.7, { duration: 250 });
  }, [focused, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.Text
      numberOfLines={1}
      style={[
        styles.customTabText,
        focused && styles.customTabTextActive,
        { color: focused ? activeColor : inactiveColor },
        animatedStyle,
      ]}
    >
      {label}
    </Animated.Text>
  );
};

export default function TabLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = isTabletLayout(width, height);
  const isHoverEnabled = Platform.OS === 'web';
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useAuthStore();
  const [isRailPinnedExpanded, setIsRailPinnedExpanded] = useState(false);
  const [isRailHovered, setIsRailHovered] = useState(false);

  const isRailExpanded = useMemo(
    () => (isHoverEnabled ? isRailPinnedExpanded || isRailHovered : isRailPinnedExpanded),
    [isHoverEnabled, isRailHovered, isRailPinnedExpanded],
  );

  useEffect(() => {
    if (!isTablet) {
      setIsRailPinnedExpanded(false);
      setIsRailHovered(false);
    }
  }, [isTablet]);

  useEffect(() => {
    if (Platform.OS === 'web' || !user?.id) {
      return;
    }

    const task = InteractionManager.runAfterInteractions(() => {
      void registerDevicePushTokenForUser(user.id);
    });

    return () => {
      task.cancel();
    };
  }, [user?.id]);

  return (
    <ProtectedRoute>
      <BottomTabBarVisibilityProvider>
        <Tabs
          tabBar={(props) =>
            isTablet ? (
              <TabletTabBar
                props={props}
                isExpanded={isRailExpanded}
                onHoverIn={isHoverEnabled ? () => setIsRailHovered(true) : undefined}
                onHoverOut={isHoverEnabled ? () => setIsRailHovered(false) : undefined}
                onToggle={() => setIsRailPinnedExpanded((currentValue) => !currentValue)}
              />
            ) : (
              <PhoneTabBar props={props} />
            )
          }
          screenOptions={{
            animation: 'none',
            sceneStyle: {
              backgroundColor: theme.colors.background,
            },
            tabBarPosition: isTablet ? 'left' : 'bottom',
            tabBarVariant: isTablet ? 'material' : 'uikit',
            tabBarActiveTintColor: theme.colors.tabBarActiveTint,
            tabBarInactiveTintColor: theme.colors.tabBarInactiveTint,
            tabBarActiveBackgroundColor: isTablet
              ? theme.colors.tabBarActiveBg
              : theme.colors.tabBarBackground,
            tabBarInactiveBackgroundColor: theme.colors.tabBarBackground,
            tabBarShowLabel: !isTablet || isRailExpanded,
            tabBarHideOnKeyboard: !isTablet,
            tabBarStyle: isTablet
              ? [
                  styles.tabletTabBar,
                  isRailExpanded ? styles.tabletTabBarExpanded : styles.tabletTabBarCollapsed,
                ]
              : styles.phoneTabBar,
            tabBarItemStyle: isTablet
              ? [
                  styles.tabletTabBarItem,
                  isRailExpanded ? styles.tabletTabBarItemExpanded : styles.tabletTabBarItemCollapsed,
                ]
              : styles.phoneTabBarItem,
            tabBarLabelStyle: isTablet ? styles.tabletTabBarLabel : styles.phoneTabBarLabel,
            tabBarIconStyle: isTablet ? styles.tabletTabBarIcon : undefined,
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Inicio',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'home' : 'home-outline'}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="diet"
            options={{
              title: 'Dieta',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'restaurant' : 'restaurant-outline'}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="workouts"
            options={{
              title: isTablet ? 'Entreno' : 'Entrenamientos',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'barbell' : 'barbell-outline'}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="measurements"
            options={{
              title: 'Medidas',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'body' : 'body-outline'}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Perfil',
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons
                  name={focused ? 'person' : 'person-outline'}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        </Tabs>
      </BottomTabBarVisibilityProvider>
    </ProtectedRoute>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    phoneFloatingTabBarWrapper: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
      backgroundColor: 'transparent',
    },
    phoneTabBar: {
      backgroundColor: theme.colors.tabBarBackground,
      borderTopColor: theme.colors.tabBarBorder,
      borderTopWidth: 1,
      paddingTop: PHONE_TAB_BAR_VERTICAL_PADDING,
      paddingBottom: PHONE_TAB_BAR_VERTICAL_PADDING,
      height: PHONE_TAB_BAR_HEIGHT,
    },
    phoneTabBarItem: {
      borderRadius: 0,
    },
    customTabBarBlur: {
      borderRadius: 35,
      overflow: 'hidden',
      backgroundColor: theme.colors.phoneNavShellBackground,
      borderWidth: 1,
      borderColor: theme.colors.phoneNavShellBorder,
      shadowColor: theme.colors.phoneNavIconActive,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: theme.isDark ? 0.18 : 0.12,
      shadowRadius: theme.isDark ? 20 : 18,
      elevation: theme.isDark ? 12 : 10,
    },
    customTabBarContainer: {
      flexDirection: 'row',
      height: 72,
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: 8,
    },
    customTabItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
    },
    customTabIconWrapper: {
      width: 48,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    customTabIconWrapperActive: {
      backgroundColor: theme.colors.phoneNavIndicatorBackground,
    },
    slidingIndicator: {
      position: 'absolute',
      top: 20,
    },
    customTabText: {
      fontSize: 10,
      fontWeight: '500',
    },
    customTabTextActive: {
      fontWeight: '600',
    },
    phoneTabBarLabel: {
      fontSize: 11,
      fontWeight: '500',
    },
    tabletRailContainer: {
      alignSelf: 'stretch',
    },
    tabletRailInner: {
      position: 'relative',
    },
    tabletRailInnerExpanded: {
      width: TABLET_EXPANDED_WIDTH,
    },
    tabletRailInnerCollapsed: {
      width: TABLET_COLLAPSED_WIDTH,
    },
    tabletTabBar: {
      backgroundColor: theme.colors.tabBarBackground,
      borderTopWidth: 0,
      borderRightColor: theme.colors.tabBarBorder,
      borderRightWidth: 1,
      paddingTop: TABLET_TOP_PADDING,
      paddingBottom: TABLET_BOTTOM_PADDING,
      width: '100%',
    },
    tabletTabBarExpanded: {
      width: TABLET_EXPANDED_WIDTH,
    },
    tabletTabBarCollapsed: {
      width: TABLET_COLLAPSED_WIDTH,
    },
    tabletTabBarItem: {
      borderRadius: 18,
      marginHorizontal: 10,
      marginVertical: 4,
      minHeight: 64,
    },
    tabletTabBarItemExpanded: {
      paddingHorizontal: 10,
    },
    tabletTabBarItemCollapsed: {
      paddingHorizontal: 0,
      justifyContent: 'center',
    },
    tabletTabBarLabel: {
      fontSize: 12,
      fontWeight: '600',
    },
    tabletTabBarIcon: {
      marginTop: 2,
    },
    tabletRailToggle: {
      position: 'absolute',
      top: 18,
      right: 12,
      zIndex: 2,
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.tabBarActiveBg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    tabletRailTogglePressed: {
      backgroundColor: theme.colors.surfaceAlt,
    },
  });
