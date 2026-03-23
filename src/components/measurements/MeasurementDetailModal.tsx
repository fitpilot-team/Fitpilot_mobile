import React, { useEffect, useMemo } from 'react';
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
import { borderRadius, fontSize, spacing } from '../../constants/colors';
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
import { convertMeasurementUnitValue } from '../../utils/measurementUnits';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import { useMeasurementPreferenceStore } from '../../store/measurementPreferenceStore';

interface MeasurementDetailModalProps {
  visible: boolean;
  detail: MeasurementDetail | null;
  isLoading: boolean;
  onClose: () => void;
}

const formatCalculationValue = (
  calculation: MeasurementCalculationValue,
  preference: ReturnType<typeof useMeasurementPreferenceStore.getState>['preference'],
) => {
  if (calculation.value === null) {
    return '--';
  }

  const convertedValue = convertMeasurementUnitValue(
    calculation.value,
    calculation.unit,
    preference,
  );
  const decimals = calculation.unit ? 2 : 3;
  const formattedValue = formatMeasurementNumber(convertedValue.value, decimals);

  return convertedValue.unit ? `${formattedValue} ${convertedValue.unit}` : formattedValue;
};

const getCalculationAccent = (
  status: MeasurementCalculationValue['status'],
  theme: AppTheme,
) => {
  if (status === 'computed') {
    return {
      badgeBackground: `${theme.colors.success}20`,
      badgeText: theme.colors.success,
      borderColor: `${theme.colors.success}45`,
    };
  }

  if (status === 'error') {
    return {
      badgeBackground: `${theme.colors.error}20`,
      badgeText: theme.colors.error,
      borderColor: `${theme.colors.error}45`,
    };
  }

  return {
    badgeBackground: `${theme.colors.warning}20`,
    badgeText: theme.colors.warning,
    borderColor: `${theme.colors.warning}45`,
  };
};

export const MeasurementDetailModal: React.FC<MeasurementDetailModalProps> = ({
  visible,
  detail,
  isLoading,
  onClose,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const measurementPreference = useMeasurementPreferenceStore((state) => state.preference);
  const initializeMeasurementPreference = useMeasurementPreferenceStore((state) => state.initialize);

  useEffect(() => {
    void initializeMeasurementPreference();
  }, [initializeMeasurementPreference]);

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
              <Ionicons name="close-outline" size={24} color={theme.colors.icon} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <LoadingSpinner text="Cargando detalle..." />
          ) : !detail ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={theme.colors.iconMuted}
              />
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
                            ? `${theme.colors.error}20`
                            : detail.calculationRun?.status === 'partial'
                              ? `${theme.colors.warning}20`
                              : `${theme.colors.success}20`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color:
                            detail.calculationRun?.status === 'failed'
                              ? theme.colors.error
                              : detail.calculationRun?.status === 'partial'
                                ? theme.colors.warning
                                : theme.colors.success,
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

                    const convertedValue = convertMeasurementUnitValue(
                      numericValue,
                      field.unit,
                      measurementPreference,
                    );

                    return {
                      key: field.key,
                      label: field.label,
                      value: formatMeasurementNumber(
                        convertedValue.value,
                        convertedValue.unit === '%' ? 1 : 1,
                      ),
                      unit: convertedValue.unit ?? undefined,
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
                    const accent = getCalculationAccent(calculation.status, theme);
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
                          {formatCalculationValue(calculation, measurementPreference)}
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
                          color={theme.colors.warning}
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
      height: '88%',
      maxWidth: 440,
      maxHeight: 760,
      minHeight: 520,
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
    sectionCard: {
      marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    sectionDescription: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    runHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    supportingText: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    runMeta: {
      marginTop: spacing.sm,
      fontSize: fontSize.sm,
      color: theme.colors.textSecondary,
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
      borderBottomColor: theme.colors.border,
    },
    detailLabel: {
      flex: 1,
      fontSize: fontSize.sm,
      color: theme.colors.textSecondary,
    },
    detailValue: {
      fontSize: fontSize.base,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    detailUnit: {
      fontSize: fontSize.sm,
      fontWeight: '400',
      color: theme.colors.textMuted,
    },
    calculationList: {
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    calculationCard: {
      borderWidth: 1,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      backgroundColor: theme.colors.surfaceAlt,
    },
    calculationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    calculationHeaderText: {
      flex: 1,
    },
    calculationLabel: {
      fontSize: fontSize.base,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    calculationMethod: {
      marginTop: spacing.xs,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
    calculationValue: {
      marginTop: spacing.sm,
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    calculationHint: {
      marginTop: spacing.sm,
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    statusBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
    },
    warningList: {
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    warningCard: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
      color: theme.colors.textPrimary,
    },
    warningText: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
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
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  });
