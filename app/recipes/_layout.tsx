import React from 'react';
import { Stack } from 'expo-router';
import { ProtectedRoute } from '../../src/components/common';

export default function ProtectedRecipesLayout() {
  return (
    <ProtectedRoute>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="[recipeId]" />
      </Stack>
    </ProtectedRoute>
  );
}
