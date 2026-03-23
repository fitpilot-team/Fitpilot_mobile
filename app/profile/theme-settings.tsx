import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileDetailScreen } from '../../src/components/profile/ProfileDetailScreen';
import { borderRadius, fontSize, shadows, spacing } from '../../src/constants/colors';
import { useAppTheme, useThemedStyles } from '../../src/theme';
import type { ThemePreference } from '../../src/store/themeStore';

const THEME_OPTIONS: Array<{
  value: ThemePreference;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}> = [
  {
    value: 'system',
    title: 'Sistema',
    description: 'Usa automaticamente el tema del dispositivo.',
    icon: 'phone-portrait-outline',
  },
  {
    value: 'light',
    title: 'Claro',
    description: 'Mantiene una interfaz luminosa y limpia.',
    icon: 'sunny-outline',
  },
  {
    value: 'dark',
    title: 'Oscuro',
    description: 'Reduce el brillo con superficies oscuras.',
    icon: 'moon-outline',
  },
];

export default function ThemeSettingsScreen() {
  const { preference, setPreference, theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <ProfileDetailScreen
      title="Tema"
      subtitle="El cambio se aplica al instante en toda la app."
    >
      <View style={styles.stack}>
        {THEME_OPTIONS.map((option) => {
          const isSelected = option.value === preference;

          return (
            <Pressable
              key={option.value}
              onPress={() => {
                void setPreference(option.value);
              }}
              style={({ pressed }) => [
                styles.optionCard,
                isSelected ? styles.optionCardSelected : null,
                pressed ? styles.optionCardPressed : null,
              ]}
            >
              <View style={[styles.optionIcon, isSelected ? styles.optionIconSelected : null]}>
                <Ionicons
                  name={option.icon}
                  size={22}
                  color={isSelected ? theme.colors.primary : theme.colors.icon}
                />
              </View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
              <View style={[styles.radio, isSelected ? styles.radioSelected : null]}>
                {isSelected ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </ProfileDetailScreen>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    stack: {
      gap: spacing.md,
    },
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...shadows.sm,
    },
    optionCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    optionCardPressed: {
      opacity: 0.92,
    },
    optionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
    },
    optionIconSelected: {
      backgroundColor: `${theme.colors.primary}18`,
    },
    optionCopy: {
      flex: 1,
      marginLeft: spacing.md,
      marginRight: spacing.md,
    },
    optionTitle: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    optionDescription: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textMuted,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
    },
    radioSelected: {
      borderColor: theme.colors.primary,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: theme.colors.primary,
    },
  });
