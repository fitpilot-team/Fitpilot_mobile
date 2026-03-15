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
import {
  CALCULATION_METADATA,
  DETAIL_MEASUREMENT_SECTIONS,
} from '../../constants/measurements';
import { borderRadius, colors, fontSize, spacing } from '../../constants/colors';
import type {
  MeasurementCalculationValue,
  MeasurementDetail,
} from '../../types';
import {
  formatMeasurementDate,
  formatMeasurementNumber,
  getCalculationStatusLabel,
  getMeasurementDisplayDate,
  parseMeasurementNumber,
} from '../../utils/measurements';

interface MeasurementDetailModalProps {
  visible: boolean;
  detail: MeasurementDetail | null;
  isLoading: boolean;
  onClose: () => void;
}

const formatCalculationValue = (calculation: MeasurementCalculationValue) => {
  if (calculation.value === null) {
    return '--';
  }

  const decimals = calculation.unit ? 2 : 3;
  const formattedValue = formatMeasurementNumber(calculation.value, decimals);

  return calculation.unit ? `${formattedValue} ${calculation.unit}` : formattedValue;
};

const getCalculationAccent = (status: MeasurementCalculationValue['status']) => {
  if (status === 'computed') {
    return {
      badgeBackground: '#DCFCE7',
      badgeText: '#166534',
      borderColor: '#BBF7D0',
    };
  }

  if (status === 'error') {
    return {
      badgeBackground: '#FEE2E2',
      badgeText: '#991B1B',
      borderColor: '#FECACA',
    };
  }

  return {
    badgeBackground: '#FEF3C7',
    badgeText: '#92400E',
    borderColor: '#FDE68A',
  };
};

export const MeasurementDetailModal: React.FC<MeasurementDetailModalProps> = ({
  visible,
  detail,
  isLoading,
  onClose,
}) => {
  const sortedCalculations = useMemo(() => {
    if (!detail) {
      return [];
    }

    return Object.entries(detail.calculations).sort(([leftCode], [rightCode]) => {
      const leftOrder = CALCULATION_METADATA[leftCode]?.order ?? 999;
      const rightOrder = CALCULATION_METADATA[rightCode]?.order ?? 999;
      return leftOrder - rightOrder;
    });
  }, [detail]);

  const measurementDate = detail
    ? formatMeasurementDate(getMeasurementDisplayDate(detail.measurement), 'long')
    : 'Detalle de medicion';

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
              <Text style={styles.title}>Detalle de medicion</Text>
              <Text style={styles.subtitle}>{measurementDate}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <LoadingSpinner text="Cargando detalle..." />
          ) : !detail ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={40} color={colors.gray[400]} />
              <Text style={styles.emptyStateText}>
                No fue posible cargar el detalle de esta medicion.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Card style={styles.sectionCard}>
                <View style={styles.runHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Estado del analisis</Text>
                    <Text style={styles.supportingText}>
                      Motor {detail.calculationRun?.engineVersion ?? '--'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          detail.calculationRun?.status === 'failed'
                            ? '#FEE2E2'
                            : detail.calculationRun?.status === 'partial'
                              ? '#FEF3C7'
                              : '#DCFCE7',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color:
                            detail.calculationRun?.status === 'failed'
                              ? '#991B1B'
                              : detail.calculationRun?.status === 'partial'
                                ? '#92400E'
                                : '#166534',
                        },
                      ]}
                    >
                      {detail.calculationRun?.status ?? 'sin estado'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.runMeta}>Advertencias: {detail.warnings.length}</Text>
                {detail.calculationRun?.finishedAt ? (
                  <Text style={styles.runMeta}>
                    Finalizado: {formatMeasurementDate(detail.calculationRun.finishedAt, 'short')}
                  </Text>
                ) : null}
              </Card>

              {DETAIL_MEASUREMENT_SECTIONS.map((section) => {
                const rows = section.fields
                  .map((field) => {
                    const value = detail.measurement[field.key];
                    const numericValue = parseMeasurementNumber(value);

                    if (numericValue === null) {
                      return null;
                    }

                    return {
                      key: field.key,
                      label: field.label,
                      value: formatMeasurementNumber(value, field.unit === '%' ? 1 : 1),
                      unit: field.unit,
                    };
                  })
                  .filter(Boolean) as Array<{
                  key: string;
                  label: string;
                  value: string;
                  unit?: string;
                }>;

                if (rows.length === 0) {
                  return null;
                }

                return (
                  <Card key={section.title} style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <Text style={styles.sectionDescription}>{section.description}</Text>
                    <View style={styles.rowsContainer}>
                      {rows.map((row) => (
                        <View key={row.key} style={styles.detailRow}>
                          <Text style={styles.detailLabel}>{row.label}</Text>
                          <Text style={styles.detailValue}>
                            {row.value}
                            {row.unit ? (
                              <Text style={styles.detailUnit}> {row.unit}</Text>
                            ) : null}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                );
              })}

              <Card style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Calculos disponibles</Text>
                <Text style={styles.sectionDescription}>
                  Resultados derivados por el backend para este registro.
                </Text>
                <View style={styles.calculationList}>
                  {sortedCalculations.map(([code, calculation]) => {
                    const accent = getCalculationAccent(calculation.status);
                    const missingFields =
                      detail.missingFieldsByCalculation[code]?.join(', ') ?? null;

                    return (
                      <View
                        key={code}
                        style={[styles.calculationCard, { borderColor: accent.borderColor }]}
                      >
                        <View style={styles.calculationHeader}>
                          <View style={styles.calculationHeaderText}>
                            <Text style={styles.calculationLabel}>
                              {CALCULATION_METADATA[code]?.label ?? code.replace(/_/g, ' ')}
                            </Text>
                            <Text style={styles.calculationMethod}>{calculation.method}</Text>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: accent.badgeBackground },
                            ]}
                          >
                            <Text style={[styles.statusBadgeText, { color: accent.badgeText }]}>
                              {getCalculationStatusLabel(calculation.status)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.calculationValue}>
                          {formatCalculationValue(calculation)}
                        </Text>
                        {missingFields ? (
                          <Text style={styles.calculationHint}>
                            Faltan datos: {missingFields}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              </Card>

              {detail.warnings.length > 0 ? (
                <Card style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Advertencias</Text>
                  <View style={styles.warningList}>
                    {detail.warnings.map((warning) => (
                      <View key={`${warning.calculation}-${warning.code}`} style={styles.warningCard}>
                        <Ionicons
                          name="warning-outline"
                          size={18}
                          color={colors.warning}
                          style={styles.warningIcon}
                        />
                        <View style={styles.warningContent}>
                          <Text style={styles.warningTitle}>
                            {CALCULATION_METADATA[warning.calculation]?.label ??
                              warning.calculation.replace(/_/g, ' ')}
                          </Text>
                          <Text style={styles.warningText}>{warning.message}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </Card>
              ) : null}
            </ScrollView>
          )}

          <View style={styles.footer}>
            <Button title="Cerrar" onPress={onClose} variant="secondary" />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  container: {
    width: '100%',
    height: '88%',
    maxWidth: 440,
    maxHeight: 760,
    minHeight: 520,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.gray[900],
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  sectionDescription: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  supportingText: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  runMeta: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  rowsContainer: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  detailLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  detailValue: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  detailUnit: {
    fontSize: fontSize.sm,
    fontWeight: '400',
    color: colors.gray[500],
  },
  calculationList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  calculationCard: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  calculationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  calculationHeaderText: {
    flex: 1,
  },
  calculationLabel: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[900],
  },
  calculationMethod: {
    marginTop: 2,
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  calculationValue: {
    marginTop: spacing.sm,
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
  },
  calculationHint: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  warningList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[800],
  },
  warningText: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.gray[600],
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emptyStateText: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
  },
});
