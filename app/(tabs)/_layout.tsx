import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useAppTheme, useThemedStyles } from '../../src/theme';
import {
  BottomTabBarVisibilityProvider,
  useBottomTabBarVisibility,
} from '../../src/hooks/useBottomTabBarVisibility';
import { isTabletLayout } from '../../src/utils/layout';

const TABLET_EXPANDED_WIDTH = 164;
const TABLET_COLLAPSED_WIDTH = 84;
const TABLET_TOP_PADDING = 72;
const TABLET_BOTTOM_PADDING = 18;
const PHONE_TAB_BAR_HEIGHT = 60;
const PHONE_TAB_BAR_VERTICAL_PADDING = 8;
const IPHONE_TAB_BAR_HORIZONTAL_PADDING = 12;
const IPHONE_TAB_BAR_TOP_PADDING = 4;
const IPHONE_TAB_BAR_BOTTOM_OFFSET = 8;

interface TabletTabBarProps {
  props: BottomTabBarProps;
  isExpanded: boolean;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
  onToggle: () => void;
}

interface PhoneTabBarProps {
  props: BottomTabBarProps;
  isFloating: boolean;
}

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

const PhoneTabBar: React.FC<PhoneTabBarProps> = ({ props, isFloating }) => {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { isVisible } = useBottomTabBarVisibility();
  const translateY = useSharedValue(0);
  const hiddenOffset = useMemo(
    () =>
      isFloating
        ? PHONE_TAB_BAR_HEIGHT +
          insets.bottom +
          IPHONE_TAB_BAR_TOP_PADDING +
          IPHONE_TAB_BAR_BOTTOM_OFFSET +
          24
        : PHONE_TAB_BAR_HEIGHT + insets.bottom + PHONE_TAB_BAR_VERTICAL_PADDING + 24,
    [insets.bottom, isFloating],
  );

  useEffect(() => {
    translateY.value = withTiming(isVisible ? 0 : hiddenOffset, { duration: 220 });
  }, [hiddenOffset, isVisible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!isFloating) {
    return (
      <Animated.View pointerEvents={isVisible ? 'auto' : 'none'} style={animatedStyle}>
        <BottomTabBar {...props} />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      pointerEvents={isVisible ? 'auto' : 'none'}
      style={[
        styles.phoneFloatingTabBarWrapper,
        animatedStyle,
        {
          paddingTop: IPHONE_TAB_BAR_TOP_PADDING,
          paddingBottom: insets.bottom + IPHONE_TAB_BAR_BOTTOM_OFFSET,
          paddingHorizontal: IPHONE_TAB_BAR_HORIZONTAL_PADDING,
        },
      ]}
    >
      <View style={styles.iphonePhoneTabBarShadow}>
        <View style={styles.iphonePhoneTabBarClip}>
          <BottomTabBar {...props} />
        </View>
      </View>
    </Animated.View>
  );
};

export default function TabLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = isTabletLayout(width, height);
  const isHoverEnabled = Platform.OS === 'web';
  const isIPhone = Platform.OS === 'ios';
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [isRailPinnedExpanded, setIsRailPinnedExpanded] = useState(false);
  const [isRailHovered, setIsRailHovered] = useState(false);

  const isRailExpanded = useMemo(
    () => (isHoverEnabled ? isRailPinnedExpanded || isRailHovered : isRailPinnedExpanded),
    [isHoverEnabled, isRailHovered, isRailPinnedExpanded]
  );
  const androidPhoneTabBarStyle = useMemo(
    () => [
      styles.phoneTabBar,
      {
        height: PHONE_TAB_BAR_HEIGHT + insets.bottom,
        paddingBottom: PHONE_TAB_BAR_VERTICAL_PADDING + insets.bottom,
      },
    ],
    [insets.bottom, styles.phoneTabBar]
  );

  useEffect(() => {
    if (!isTablet) {
      setIsRailPinnedExpanded(false);
      setIsRailHovered(false);
    }
  }, [isTablet]);

  return (
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
            <PhoneTabBar props={props} isFloating={isIPhone} />
          )
        }
        screenOptions={{
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
            : isIPhone
              ? styles.iphonePhoneTabBar
              : androidPhoneTabBarStyle,
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
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    phoneFloatingTabBarWrapper: {
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
    iphonePhoneTabBar: {
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      borderWidth: 0,
      borderRadius: 0,
      height: PHONE_TAB_BAR_HEIGHT,
      paddingTop: PHONE_TAB_BAR_VERTICAL_PADDING,
      paddingBottom: PHONE_TAB_BAR_VERTICAL_PADDING,
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    iphonePhoneTabBarShadow: {
      backgroundColor: theme.colors.tabBarBackground,
      borderRadius: 30,
      shadowColor: theme.isDark ? '#020617' : '#0f172a',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: theme.isDark ? 0.28 : 0.08,
      shadowRadius: 18,
      elevation: 10,
    },
    iphonePhoneTabBarClip: {
      backgroundColor: theme.colors.tabBarBackground,
      borderColor: theme.colors.tabBarBorder,
      borderWidth: 1,
      borderRadius: 30,
      overflow: 'hidden',
    },
    phoneTabBarItem: {
      borderRadius: 0,
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
