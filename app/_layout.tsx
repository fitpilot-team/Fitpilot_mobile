import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { useAuthStore } from '../src/store/authStore';
import { LoadingSpinner } from '../src/components/common';
import { colors } from '../src/constants/colors';

// Configurar Reanimated logger para suprimir mensajes de strict mode
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function RootLayout() {
  const { isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner text="Cargando..." />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      >
        {/* Tab group - main navigation */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Login screen outside of tabs */}
        <Stack.Screen name="login" />

        {/* Workout session as modal over tabs */}
        <Stack.Screen
          name="workout/[id]"
          options={{
            presentation: 'card',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
