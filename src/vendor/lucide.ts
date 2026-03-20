import type { ComponentProps, ComponentType } from 'react';
import {
  Apple,
  Bean,
  Beef,
  CandyCane,
  Carrot,
  CookingPot,
  Droplets,
  Milk,
  Wheat,
} from 'lucide-react-native/icons';

export {
  Apple,
  Bean,
  Beef,
  CandyCane,
  Carrot,
  CookingPot,
  Droplets,
  Milk,
  Wheat,
};

export type LucideIconProps = ComponentProps<typeof Apple>;
export type LucideIcon = ComponentType<LucideIconProps>;
