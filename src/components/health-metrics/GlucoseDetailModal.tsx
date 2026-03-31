import React, { useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, LoadingSpinner } from '../common';
import { GLUCOSE_CONTEXT_LABELS } from '../../constants/healthMetrics';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { GlucoseRecord } from '../../types';
import {
  formatMeasurementNumber,
  parseMeasurementNumber,
} from '../../utils/measurements';
import {
  formatGlucoseRecordedAt,
  hasAdditionalHealthMetrics,
} from '../../utils/healthMetrics';

interface GlucoseDetailModalProps {
  visible: boolean;
  record: GlucoseRecord | null;
  isLoading: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const GlucoseDetailModal: React.FC<GlucoseDetailModalProps> = ({
  visible,
  record,
  isLoading,
  isDeleting,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const mixedRecord = hasAdditionalHealthMetrics(record);
  const oxygenValue = parseMeasurementNumber(record?.oxygen_saturation_pct);
  const additionalMetrics = useMemo(() => {
    if (!record) {
      return [];
    }

    const metrics: Array<{ label: string; value: string }> = [];

    if (record.systolic_mmhg !== null || record.diastolic_mmhg !== null) {
      metrics.push({
        label: 'Presion arterial',
        value:
          record.systolic_mmhg !== null && record.diastolic_mmhg !== null
            ? `${record.systolic_mmhg}/${record.diastolic_mmhg} mmHg`
            : 'Registro parcial',
      });
    }

    if (record.heart_rate_bpm !== null) {
      metrics.push({
        label: 'Frecuencia cardiaca',
        value: `${record.heart_rate_bpm} bpm`,
      });
    }

    if (oxygenValue !== null) {
      metrics.push({
        label: 'Saturacion de oxigeno',
        value: `${formatMeasurementNumber(oxygenValue, 1)} %`,
      });
    }

    return metrics;
  }, [oxygenValue, record]);

  const displayValue = record?.glucose_mg_dl
    ? formatMeasurementNumber(record.glucose_mg_dl, 0)
    : '--';
  const displayContext = record?.glucose_context
    ? GLUCOSE_CONTEXT_LABELS[record.glucose_context]
    : 'Sin contexto';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Detalle de glucosa</Text>
              <Text style={styles.subtitle}>
                {record
                  ? formatGlucoseRecordedAt(record.recorded_at, 'long')
                  : 'Detalle del registro'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={theme.colors.icon} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <LoadingSpinner text="Cargando detalle..." />
          ) : !record ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={theme.colors.iconMuted}
              />
              <Text style={styles.emptyStateText}>
                No fue posible cargar el detalle de este registro.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              <Card style={styles.heroCard}>
                <Text style={styles.heroEyebrow}>Ultima lectura</Text>
                <Text style={styles.heroValue}>
                  {displayValue}
                  <Text style={styles.heroUnit}> mg/dL</Text>
                </Text>
                <Text style={styles.heroMeta}>{displayContext}</Text>
                <Text style={styles.heroDate}>
                  {formatGlucoseRecordedAt(record.recorded_at, 'short')}
                </Text>
              </Card>

              {record.notes ? (
                <Card style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Notas</Text>
                  <Text style={styles.notesText}>{record.notes}</Text>
                </Card>
              ) : null}

              {additionalMetrics.length > 0 ? (
                <Card style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Otras metricas del registro</Text>
                  <Text style={styles.sectionDescription}>
                    Este registro tambien incluye otros datos clinicos.
                  </Text>
                  <View style={styles.metricList}>
                    {additionalMetrics.map((metric) => (
                      <View key={metric.label} style={styles.metricRow}>
                        <Text style={styles.metricLabel}>{metric.label}</Text>
                        <Text style={styles.metricValue}>{metric.value}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              ) : null}

              {mixedRecord ? (
                <Card style={styles.warningCard}>
                  <View style={styles.warningHeader}>
                    <Ionicons
                      name="warning-outline"
                      size={18}
                      color={theme.colors.warning}
                    />
                    <Text style={styles.warningTitle}>Eliminacion bloqueada</Text>
                  </View>
                  <Text style={styles.warningText}>
                    No puedes eliminar este registro desde la app porque tambien
                    incluye otras metricas clinicas.
                  </Text>
                </Card>
              ) : null}
            </ScrollView>
          )}

          <View style={styles.footer}>
            <Button title="Cerrar" variant="secondary" onPress={onClose} />
            <Button
              title="Editar"
              variant="ghost"
              onPress={onEdit}
              disabled={!record || isLoading}
            />
            <Button
              title="Eliminar"
              variant="danger"
              onPress={onDelete}
              isLoading={isDeleting}
              disabled={!record || isLoading || mixedRecord}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.md,
    },
    container: {
      width: '100%',
      height: '82%',
      maxWidth: 440,
      maxHeight: 720,
      minHeight: 500,
      backgroundColor: theme.colors.background,
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerText: {
      flex: 1,
      paddingRight: spacing.md,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    heroCard: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primaryBorder,
    },
    heroEyebrow: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    heroValue: {
      marginTop: spacing.sm,
      fontSize: 34,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    heroUnit: {
      fontSize: fontSize.lg,
      fontWeight: '500',
      color: theme.colors.textMuted,
    },
    heroMeta: {
      marginTop: spacing.sm,
      fontSize: fontSize.base,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    heroDate: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    sectionCard: {
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    sectionDescription: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    notesText: {
      marginTop: spacing.md,
      fontSize: fontSize.base,
      lineHeight: 22,
      color: theme.colors.textSecondary,
    },
    metricList: {
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    metricRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    metricLabel: {
      flex: 1,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    metricValue: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    warningCard: {
      backgroundColor: `${theme.colors.warning}10`,
      borderColor: `${theme.colors.warning}55`,
    },
    warningHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    warningTitle: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.warning,
    },
    warningText: {
      marginTop: spacing.sm,
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      gap: spacing.md,
    },
    emptyStateText: {
      fontSize: fontSize.base,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      gap: spacing.sm,
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  });
