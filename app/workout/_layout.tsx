import React from 'react';
import { Slot } from 'expo-router';
import { ProtectedRoute } from '../../src/components/common';

export default function ProtectedWorkoutLayout() {
  return (
    <ProtectedRoute>
      <Slot />
    </ProtectedRoute>
  );
}
