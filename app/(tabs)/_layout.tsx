import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { BottomTabBar, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, brandColors } from '../../src/constants/colors';
import { isTabletLayout } from '../../src/utils/layout';

const TABLET_EXPANDED_WIDTH = 164;
const TABLET_COLLAPSED_WIDTH = 84;
const TABLET_TOP_PADDING = 72;
const TABLET_BOTTOM_PADDING = 18;
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
}

const TabletTabBar: React.FC<TabletTabBarProps> = ({
  props,
  isExpanded,
  onHoverIn,
  onHoverOut,
  onToggle,
}) => (
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
          color={brandColors.navy}
        />
      </Pressable>
      <BottomTabBar {...props} />
    </View>
  </Pressable>
);

const PhoneTabBar: React.FC<PhoneTabBarProps> = ({ props }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.phoneTabBarWrapper,
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
    </View>
  );
};

export default function TabLayout() {
  const { width, height } = useWindowDimensions();
  const isTablet = isTabletLayout(width, height);
  const isHoverEnabled = Platform.OS === 'web';
  const isIPhone = Platform.OS === 'ios';
  const [isRailPinnedExpanded, setIsRailPinnedExpanded] = useState(false);
  const [isRailHovered, setIsRailHovered] = useState(false);

  const isRailExpanded = useMemo(
    () => (isHoverEnabled ? isRailPinnedExpanded || isRailHovered : isRailPinnedExpanded),
    [isHoverEnabled, isRailHovered, isRailPinnedExpanded]
  );

  useEffect(() => {
    if (!isTablet) {
      setIsRailPinnedExpanded(false);
      setIsRailHovered(false);
    }
  }, [isTablet]);

  return (
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
        ) : isIPhone ? (
          <PhoneTabBar props={props} />
        ) : (
          <BottomTabBar {...props} />
        )
      }
      screenOptions={{
        tabBarPosition: isTablet ? 'left' : 'bottom',
        tabBarVariant: isTablet ? 'material' : 'uikit',
        tabBarActiveTintColor: brandColors.navy,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarActiveBackgroundColor: isTablet ? '#E8F0F8' : colors.white,
        tabBarInactiveBackgroundColor: colors.white,
        tabBarShowLabel: !isTablet || isRailExpanded,
        tabBarHideOnKeyboard: !isTablet,
        tabBarStyle: isTablet
          ? [
              styles.tabletTabBar,
              isRailExpanded ? styles.tabletTabBarExpanded : styles.tabletTabBarCollapsed,
            ]
          : isIPhone
            ? styles.iphonePhoneTabBar
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
  );
}

const styles = StyleSheet.create({
  phoneTabBarWrapper: {
    backgroundColor: 'transparent',
  },
  phoneTabBar: {
    backgroundColor: colors.white,
    borderTopColor: colors.gray[200],
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
    height: 60,
  },
  iphonePhoneTabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderWidth: 0,
    borderRadius: 0,
    height: 60,
    paddingTop: 8,
    paddingBottom: 8,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  iphonePhoneTabBarShadow: {
    backgroundColor: colors.white,
    borderRadius: 30,
    borderCurve: 'continuous',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 10,
  },
  iphonePhoneTabBarClip: {
    backgroundColor: colors.white,
    borderColor: colors.gray[200],
    borderWidth: 1,
    borderRadius: 30,
    borderCurve: 'continuous',
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
    backgroundColor: colors.white,
    borderTopWidth: 0,
    borderRightColor: colors.gray[200],
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
    backgroundColor: '#E8F0F8',
    borderWidth: 1,
    borderColor: '#D8E7F4',
  },
  tabletRailTogglePressed: {
    backgroundColor: '#D8E7F4',
  },
});
