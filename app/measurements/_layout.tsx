import React from 'react';
import { Slot } from 'expo-router';
import { ProtectedRoute } from '../../src/components/common';

export default function ProtectedMeasurementsLayout() {
  return (
    <ProtectedRoute>
      <Slot />
    </ProtectedRoute>
  );
}
