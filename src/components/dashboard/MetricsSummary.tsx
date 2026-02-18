import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, brandColors, spacing, fontSize, borderRadius, shadows } from '../../constants/colors';
import { StatCardSkeleton } from '../common/Skeleton';
import api from '../../services/api';

interface MetricSummary {
  metric_type: string;
  latest_value: number;
  latest_date: string;
  unit: string;
  change_from_previous: number | null;
}

interface MetricsSummaryProps {
  onPress?: () => void;
}

// Mapeo de tipos de métrica a iconos y labels
const metricConfig: Record<string, { icon: string; label: string; color: string }> = {
  weight: { icon: 'scale', label: 'Peso', color: '#3B82F6' },
  body_fat: { icon: 'body', label: 'Grasa', color: '#EF4444' },
  chest: { icon: 'fitness', label: 'Pecho', color: '#10B981' },
  waist: { icon: 'resize', label: 'Cintura', color: '#F59E0B' },
  hips: { icon: 'ellipse', label: 'Cadera', color: '#8B5CF6' },
  arms: { icon: 'barbell', label: 'Brazos', color: '#EC4899' },
  thighs: { icon: 'walk', label: 'Piernas', color: '#06B6D4' },
};

export const MetricsSummary: React.FC<MetricsSummaryProps> = ({ onPress }) => {
  const [metrics, setMetrics] = useState<MetricSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<MetricSummary[]>('/client-metrics/me/summary');
      setMetrics(response.data);
    } catch (err: any) {
      // Si es 403, el usuario no tiene permisos (no es cliente)
      // Si es 404, no hay métricas
      if (err.response?.status !== 403) {
        setError('Error al cargar métricas');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Si está cargando, mostrar skeleton
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mis métricas</Text>
        </View>
        <View style={styles.metricsGrid}>
          <StatCardSkeleton />
          <View style={styles.metricGap} />
          <StatCardSkeleton />
        </View>
      </View>
    );
  }

  // Si hay error o no hay métricas, no mostrar nada
  if (error || metrics.length === 0) {
    return null;
  }

  // Mostrar solo las primeras 4 métricas más relevantes
  const displayMetrics = metrics.slice(0, 4);

  return (
    <Animated.View entering={FadeInUp.duration(500)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="analytics" size={20} color={brandColors.navy} />
          <Text style={styles.title}>Mis métricas</Text>
        </View>
        <TouchableOpacity style={styles.seeAllButton} onPress={onPress}>
          <Text style={styles.seeAllText}>Ver todo</Text>
          <Ionicons name="chevron-forward" size={16} color={brandColors.sky} />
        </TouchableOpacity>
      </View>

      {/* Grid de métricas */}
      <View style={styles.metricsGrid}>
        {displayMetrics.map((metric, index) => (
          <MetricCard key={metric.metric_type} metric={metric} index={index} />
        ))}
      </View>
    </Animated.View>
  );
};

interface MetricCardProps {
  metric: MetricSummary;
  index: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, index }) => {
  const config = metricConfig[metric.metric_type] || {
    icon: 'analytics',
    label: metric.metric_type,
    color: brandColors.sky,
  };

  const hasChange = metric.change_from_previous !== null;
  const isPositive = metric.change_from_previous && metric.change_from_previous > 0;
  const isNegative = metric.change_from_previous && metric.change_from_previous < 0;

  // Para peso y grasa, negativo es bueno. Para medidas, depende del objetivo
  const isWeightOrFat = ['weight', 'body_fat'].includes(metric.metric_type);
  const changeColor = isWeightOrFat
    ? isNegative ? colors.success : isPositive ? colors.error : colors.gray[500]
    : isPositive ? colors.success : isNegative ? colors.error : colors.gray[500];

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 100).duration(400)}
      style={[styles.metricCard, shadows.sm]}
    >
      <LinearGradient
        colors={[`${config.color}10`, `${config.color}05`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Icono */}
      <View style={[styles.metricIcon, { backgroundColor: `${config.color}15` }]}>
        <Ionicons name={config.icon as any} size={16} color={config.color} />
      </View>

      {/* Valor */}
      <View style={styles.metricValueRow}>
        <Text style={styles.metricValue}>
          {metric.latest_value}
        </Text>
        <Text style={styles.metricUnit}>{metric.unit}</Text>
      </View>

      {/* Label */}
      <Text style={styles.metricLabel}>{config.label}</Text>

      {/* Cambio */}
      {hasChange && metric.change_from_previous !== 0 && (
        <View style={[styles.changeBadge, { backgroundColor: `${changeColor}15` }]}>
          <Ionicons
            name={isPositive ? 'arrow-up' : 'arrow-down'}
            size={10}
            color={changeColor}
          />
          <Text style={[styles.changeText, { color: changeColor }]}>
            {Math.abs(metric.change_from_previous!)}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seeAllText: {
    fontSize: fontSize.sm,
    color: brandColors.sky,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricGap: {
    width: spacing.sm,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    overflow: 'hidden',
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  metricValue: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.gray[900],
  },
  metricUnit: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  metricLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  changeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});

export default MetricsSummary;
