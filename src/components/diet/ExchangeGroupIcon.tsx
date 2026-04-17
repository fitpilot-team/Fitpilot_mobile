import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { borderRadius } from '../../constants/colors';
import { getExchangeGroupVisual } from '../../constants/exchangeGroupVisuals';
import type { LucideIconProps } from '../../vendor/lucide';

interface ExchangeGroupIconProps {
  groupName?: string | null;
  size?: number;
  color?: string;
  strokeWidth?: number;
  withContainer?: boolean;
  style?: StyleProp<ViewStyle>;
  iconStyle?: LucideIconProps['style'];
}

export const ExchangeGroupIcon: React.FC<ExchangeGroupIconProps> = ({
  groupName,
  size = 18,
  color,
  strokeWidth = 2,
  withContainer = true,
  style,
  iconStyle,
}) => {
  const visual = getExchangeGroupVisual(groupName);
  const Icon = visual.icon;
  const iconColor = color ?? visual.iconColor;
  const containerSize = Math.round(size + 24);
  const icon = visual.renderIcon ? (
    visual.renderIcon({
      color: iconColor,
      size,
      strokeWidth,
      style: iconStyle,
    })
  ) : (
    <Icon color={iconColor} size={size} strokeWidth={strokeWidth} style={iconStyle} />
  );

  if (!withContainer) {
    return <View style={style}>{icon}</View>;
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          backgroundColor: visual.backgroundColor,
          borderColor: visual.borderColor,
        },
        style,
      ]}
    >
      {icon}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
