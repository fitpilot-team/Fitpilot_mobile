import React from 'react';
import { MeasurementProgressScreen } from '../../src/components/measurements/MeasurementProgressScreen';

export default function WeightProgressRoute() {
  return <MeasurementProgressScreen metricKey="weight_kg" />;
}
