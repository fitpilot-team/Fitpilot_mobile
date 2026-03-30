import React from 'react';
import { Slot } from 'expo-router';
import { ProtectedRoute } from '../../src/components/common';

export default function ProtectedProfileLayout() {
  return (
    <ProtectedRoute>
      <Slot />
    </ProtectedRoute>
  );
}
