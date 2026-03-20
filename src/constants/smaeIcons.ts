import type { ReactNode } from 'react';
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
} from '../vendor/lucide';
import type { LucideIcon, LucideIconProps } from '../vendor/lucide';
import { brandColors } from './colors';

export type SmaeGroupKey =
  | 'verduras'
  | 'frutas'
  | 'cereales_tuberculos'
  | 'leguminosas'
  | 'alimentos_origen_animal'
  | 'leche'
  | 'grasas'
  | 'azucares'
  | 'unknown';

type SmaeGroupVisualDefinition = {
  label: string;
  aliases: readonly string[];
  icon: LucideIcon;
  renderIcon?: (props: LucideIconProps) => ReactNode;
  iconColor: string;
  backgroundColor: string;
  borderColor: string;
};

export type SmaeGroupVisual = SmaeGroupVisualDefinition & {
  key: SmaeGroupKey;
};

const normalizeSmaeGroupName = (value: string | null | undefined) =>
  (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const SMAE_GROUP_VISUALS = {
  verduras: {
    label: 'Verduras',
    aliases: ['verdura', 'verduras', 'vegetal', 'vegetales'],
    icon: Carrot,
    iconColor: '#15803D',
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  frutas: {
    label: 'Frutas',
    aliases: ['fruta', 'frutas'],
    icon: Apple,
    iconColor: '#EA580C',
    backgroundColor: '#FFEDD5',
    borderColor: '#FED7AA',
  },
  cereales_tuberculos: {
    label: 'Cereales y tuberculos',
    aliases: [
      'cereal',
      'cereales',
      'cereales y tuberculos',
      'cereales con grasa',
      'cereales sin grasa',
      'tuberculo',
      'tuberculos',
      'pan',
      'arroz',
    ],
    icon: Wheat,
    iconColor: '#92400E',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  leguminosas: {
    label: 'Leguminosas',
    aliases: ['leguminosa', 'leguminosas', 'frijol', 'frijoles'],
    icon: Bean,
    iconColor: '#7C3AED',
    backgroundColor: '#EDE9FE',
    borderColor: '#DDD6FE',
  },
  alimentos_origen_animal: {
    label: 'Alimentos de origen animal',
    aliases: [
      'aoa',
      'alimentos de origen animal',
      'alimento de origen animal',
      'animal',
      'carne',
      'pollo',
      'pescado',
      'proteina animal',
    ],
    icon: Beef,
    iconColor: '#1D4ED8',
    backgroundColor: '#DBEAFE',
    borderColor: '#BFDBFE',
  },
  leche: {
    label: 'Leche',
    aliases: [
      'leche',
      'lacteo',
      'lacteos',
      'leche descremada',
      'leche semidescremada',
      'leche entera',
      'leche con azucar',
    ],
    icon: Milk,
    iconColor: '#0891B2',
    backgroundColor: '#CFFAFE',
    borderColor: '#A5F3FC',
  },
  grasas: {
    label: 'Grasas',
    aliases: [
      'grasa',
      'grasas',
      'aceite',
      'aceites',
      'aceites y grasas',
      'grasas sin proteina',
      'grasas con proteina',
    ],
    icon: Droplets,
    iconColor: '#D97706',
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  azucares: {
    label: 'Azucares',
    aliases: ['azucar', 'azucares', 'azucares con grasa', 'azucares sin grasa', 'dulce', 'dulces'],
    icon: CandyCane,
    iconColor: '#DB2777',
    backgroundColor: '#FCE7F3',
    borderColor: '#FBCFE8',
  },
  unknown: {
    label: 'Grupo alimenticio',
    aliases: [],
    icon: CookingPot,
    iconColor: brandColors.navy,
    backgroundColor: '#E8F0F8',
    borderColor: '#D8E7F4',
  },
} as const satisfies Record<SmaeGroupKey, SmaeGroupVisualDefinition>;

const SMAE_GROUP_MATCH_ORDER: readonly SmaeGroupKey[] = [
  'verduras',
  'frutas',
  'cereales_tuberculos',
  'leguminosas',
  'alimentos_origen_animal',
  'leche',
  'grasas',
  'azucares',
];

const matchesAlias = (groupName: string, aliases: readonly string[]) =>
  aliases.some((alias) => groupName === alias || groupName.includes(alias));

export const getSmaeGroupKey = (groupName: string | null | undefined): SmaeGroupKey => {
  const normalizedGroupName = normalizeSmaeGroupName(groupName);

  if (!normalizedGroupName) {
    return 'unknown';
  }

  for (const key of SMAE_GROUP_MATCH_ORDER) {
    if (matchesAlias(normalizedGroupName, SMAE_GROUP_VISUALS[key].aliases)) {
      return key;
    }
  }

  return 'unknown';
};

export const getSmaeGroupVisual = (groupName: string | null | undefined): SmaeGroupVisual => {
  const key = getSmaeGroupKey(groupName);
  return {
    key,
    ...SMAE_GROUP_VISUALS[key],
  };
};
