import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Appearance, View, StyleSheet } from 'react-native';
import { ThemeProvider } from '@react-navigation/native';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { useAuthStore } from '../src/store/authStore';
import { LoadingSpinner } from '../src/components/common';
import { buildNavigationTheme, useAppTheme, useThemedStyles } from '../src/theme';

// Configurar Reanimated logger para suprimir mensajes de strict mode
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function RootLayout() {
  const { isInitialized, initialize } = useAuthStore();
  const { hydrateTheme, isHydrated, syncWithSystem, theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    void initialize();
    void hydrateTheme();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      syncWithSystem(colorScheme);
    });

    return () => {
      subscription.remove();
    };
  }, [hydrateTheme, initialize, syncWithSystem]);

  if (!isInitialized || !isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner text="Cargando..." />
        <StatusBar style={theme.statusBarStyle} />
      </View>
    );
  }

  const navigationTheme = buildNavigationTheme(theme);

  return (
    <ThemeProvider value={navigationTheme}>
      <>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'slide_from_right',
          }}
        >
          {/* Tab group - main navigation */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* Login screen outside of tabs */}
          <Stack.Screen name="login" />

          {/* Profile detail screens outside of tabs */}
          <Stack.Screen name="profile/personal-info" />
          <Stack.Screen name="profile/change-password" />
          <Stack.Screen name="profile/notifications-settings" />
          <Stack.Screen name="profile/help" />
          <Stack.Screen name="profile/contact-support" />
          <Stack.Screen name="profile/legal/[document]" />
          <Stack.Screen name="profile/theme-settings" />

          {/* Workout session as modal over tabs */}
          <Stack.Screen
            name="workout/[id]"
            options={{
              presentation: 'card',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="workouts/exercises/[exerciseId]"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
        </Stack>
        <StatusBar style={theme.statusBarStyle} />
      </>
    </ThemeProvider>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
  });
