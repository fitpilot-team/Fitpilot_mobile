import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MeasurementProgressScreen } from '../weight-progress';

export default function MeasurementProgressRoute() {
  const params = useLocalSearchParams<{ metric?: string | string[] }>();
  const metricParam = Array.isArray(params.metric) ? params.metric[0] : params.metric;

  return <MeasurementProgressScreen metricKey={metricParam} />;
}
