import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
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
const PHONE_TAB_BAR_HEIGHT = 66;
const PHONE_TAB_BAR_VERTICAL_PADDING = 9;
const PHONE_TAB_BAR_HORIZONTAL_PADDING = 14;
const PHONE_TAB_BAR_TOP_PADDING = 6;
const PHONE_TAB_BAR_BOTTOM_OFFSET = 10;
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
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { isVisible } = useBottomTabBarVisibility();

  if (!isVisible) {
    return null;
  }

  return (
    <View
      style={[
        styles.phoneFloatingTabBarWrapper,
        {
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <BottomTabBar {...props} />
    </View>
  );
};

export default function TabLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = isTabletLayout(width, height);
  const isHoverEnabled = Platform.OS === 'web';
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [isRailPinnedExpanded, setIsRailPinnedExpanded] = useState(false);
  const [isRailHovered, setIsRailHovered] = useState(false);

  const isRailExpanded = useMemo(
    () => (isHoverEnabled ? isRailPinnedExpanded || isRailHovered : isRailPinnedExpanded),
    [isHoverEnabled, isRailHovered, isRailPinnedExpanded]
  );
  const renderTabIcon = useMemo(
    () =>
      (
        activeIcon: React.ComponentProps<typeof Ionicons>['name'],
        inactiveIcon: React.ComponentProps<typeof Ionicons>['name'],
      ) =>
      ({
        color,
        size,
        focused,
      }: {
        color: string;
        size: number;
        focused: boolean;
      }) => (
        <Ionicons
          name={focused ? activeIcon : inactiveIcon}
          size={size}
          color={color}
        />
      ),
    []
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
            <PhoneTabBar props={props} />
          )
        }
        screenOptions={{
          animation: 'shift',
          sceneStyle: {
            backgroundColor: theme.colors.background,
          },
          tabBarPosition: isTablet ? 'left' : 'bottom',
          tabBarVariant: isTablet ? 'material' : 'uikit',
          tabBarActiveTintColor: isTablet
            ? theme.colors.tabBarActiveTint
            : theme.isDark
              ? '#F8FAFC'
              : theme.colors.tabBarActiveTint,
          tabBarInactiveTintColor: isTablet
            ? theme.colors.tabBarInactiveTint
            : theme.isDark
              ? 'rgba(255,255,255,0.72)'
              : theme.colors.textMuted,
          tabBarActiveBackgroundColor: isTablet ? theme.colors.tabBarActiveBg : 'transparent',
          tabBarInactiveBackgroundColor: isTablet ? theme.colors.tabBarBackground : 'transparent',
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
          tabBarIconStyle: isTablet ? styles.tabletTabBarIcon : styles.phoneTabBarIcon,
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: renderTabIcon('home', 'home-outline'),
          }}
        />
        <Tabs.Screen
          name="diet"
          options={{
            title: 'Dieta',
            tabBarIcon: renderTabIcon('restaurant', 'restaurant-outline'),
          }}
        />
        <Tabs.Screen
          name="workouts"
          options={{
            title: isTablet ? 'Entreno' : 'Entrenamientos',
            tabBarIcon: renderTabIcon('barbell', 'barbell-outline'),
          }}
        />
        <Tabs.Screen
          name="measurements"
          options={{
            title: 'Medidas',
            tabBarIcon: renderTabIcon('body', 'body-outline'),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: renderTabIcon('person', 'person-outline'),
          }}
        />
      </Tabs>
    </BottomTabBarVisibilityProvider>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    phoneFloatingTabBarWrapper: {
      backgroundColor: theme.colors.tabBarBackground,
      borderTopWidth: 1,
      borderTopColor: theme.colors.tabBarBorder,
    },
    phoneTabBar: {
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      borderWidth: 0,
      borderRadius: 0,
      paddingTop: PHONE_TAB_BAR_VERTICAL_PADDING,
      paddingBottom: PHONE_TAB_BAR_VERTICAL_PADDING,
      height: PHONE_TAB_BAR_HEIGHT,
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    phoneTabBarItem: {
      marginHorizontal: 0,
      marginVertical: 2,
      minHeight: 54,
      borderRadius: 0,
      backgroundColor: 'transparent',
    },
    phoneTabBarLabel: {
      fontSize: 11,
      fontWeight: '600',
      marginBottom: 2,
    },
    phoneTabBarIcon: {
      marginTop: 3,
    },
    phoneTabBarIconShell: {
      width: 40,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    phoneTabBarIconGlow: {
      position: 'absolute',
      width: 34,
      height: 34,
      borderRadius: 999,
      backgroundColor: theme.isDark ? 'rgba(125,211,252,0.12)' : 'rgba(96,165,250,0.10)',
      shadowColor: theme.isDark ? '#7dd3fc' : '#93c5fd',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: theme.isDark ? 0.26 : 0.12,
      shadowRadius: 16,
      elevation: 0,
    },
    phoneTabBarIconGlyphFocused: {
      textShadowColor: theme.isDark ? 'rgba(186,230,253,0.42)' : 'rgba(147,197,253,0.26)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 12,
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
