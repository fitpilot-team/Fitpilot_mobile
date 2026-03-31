import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Input } from '../common';
import {
  GLUCOSE_CONTEXT_LABELS,
  GLUCOSE_CONTEXT_OPTIONS,
} from '../../constants/healthMetrics';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type {
  CreateOwnGlucosePayload,
  GlucoseContext,
  GlucoseRecord,
} from '../../types';
import {
  isValidMeasurementDateInput,
  parseMeasurementNumber,
} from '../../utils/measurements';
import {
  buildRecordedAtFromInputs,
  getCurrentTimeInput,
  isValidTimeInput,
  splitRecordedAtToLocalInputs,
} from '../../utils/healthMetrics';
import { getTodayDateInput } from '../../utils/measurements';

type GlucoseFormState = {
  date: string;
  time: string;
  glucose: string;
  context: GlucoseContext;
  notes: string;
};

interface GlucoseFormModalProps {
  visible: boolean;
  isSubmitting: boolean;
  initialRecord?: GlucoseRecord | null;
  onClose: () => void;
  onSubmit: (payload: CreateOwnGlucosePayload) => Promise<void>;
}

const createInitialFormState = (
  record?: GlucoseRecord | null,
): GlucoseFormState => {
  const { dateInput, timeInput } = splitRecordedAtToLocalInputs(
    record?.recorded_at,
  );

  return {
    date: dateInput || getTodayDateInput(),
    time: timeInput || getCurrentTimeInput(),
    glucose:
      record?.glucose_mg_dl !== null && record?.glucose_mg_dl !== undefined
        ? `${record.glucose_mg_dl}`
        : '',
    context: record?.glucose_context ?? 'ayuno',
    notes: record?.notes ?? '',
  };
};

export const GlucoseFormModal: React.FC<GlucoseFormModalProps> = ({
  visible,
  isSubmitting,
  initialRecord = null,
  onClose,
  onSubmit,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [formState, setFormState] = useState<GlucoseFormState>(
    createInitialFormState(initialRecord),
  );

  useEffect(() => {
    if (!visible) {
      setFormState(createInitialFormState(null));
      return;
    }

    setFormState(createInitialFormState(initialRecord));
  }, [initialRecord, visible]);

  const title = initialRecord ? 'Editar glucosa' : 'Registrar glucosa';
  const subtitle = initialRecord
    ? 'Actualiza la lectura para mantener el seguimiento al dia.'
    : 'Comparte tu lectura para que tu nutriologo vea la tendencia real.';

  const payload = useMemo(() => {
    const recordedAt = buildRecordedAtFromInputs(formState.date, formState.time);
    const parsedGlucose = parseMeasurementNumber(formState.glucose);

    if (
      !recordedAt ||
      parsedGlucose === null ||
      !Number.isInteger(parsedGlucose) ||
      parsedGlucose <= 0
    ) {
      return null;
    }

    return {
      recorded_at: recordedAt,
      glucose_mg_dl: parsedGlucose,
      glucose_context: formState.context,
      notes: formState.notes.trim() ? formState.notes.trim() : null,
    } satisfies CreateOwnGlucosePayload;
  }, [formState]);

  const handleChangeField = (field: keyof GlucoseFormState, value: string) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!isValidMeasurementDateInput(formState.date.trim())) {
      Alert.alert('Fecha invalida', 'Captura la fecha en formato YYYY-MM-DD.');
      return;
    }

    if (!isValidTimeInput(formState.time.trim())) {
      Alert.alert('Hora invalida', 'Captura la hora en formato HH:mm.');
      return;
    }

    const parsedGlucose = parseMeasurementNumber(formState.glucose);

    if (
      parsedGlucose === null ||
      !Number.isInteger(parsedGlucose) ||
      parsedGlucose <= 0
    ) {
      Alert.alert(
        'Dato invalido',
        'La glucosa debe ser un entero positivo en mg/dL.',
      );
      return;
    }

    if (!payload) {
      Alert.alert(
        'Dato invalido',
        'No fue posible construir la fecha y hora del registro.',
      );
      return;
    }

    await onSubmit(payload);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close-outline" size={24} color={theme.colors.icon} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lectura</Text>
              <Text style={styles.sectionDescription}>
                Registra la fecha, hora y valor exacto en mg/dL.
              </Text>
              <Input
                label="Fecha"
                value={formState.date}
                onChangeText={(value) => handleChangeField('date', value)}
                placeholder="2026-03-30"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Input
                label="Hora"
                value={formState.time}
                onChangeText={(value) => handleChangeField('time', value)}
                placeholder="08:30"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Input
                label="Glucosa (mg/dL)"
                value={formState.glucose}
                onChangeText={(value) => handleChangeField('glucose', value)}
                placeholder="95"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contexto</Text>
              <Text style={styles.sectionDescription}>
                Elige el momento clinico de la lectura.
              </Text>
              <View style={styles.contextGrid}>
                {GLUCOSE_CONTEXT_OPTIONS.map((option) => {
                  const isSelected = option.value === formState.context;

                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.contextChip,
                        isSelected ? styles.contextChipSelected : null,
                      ]}
                      activeOpacity={0.88}
                      onPress={() => handleChangeField('context', option.value)}
                    >
                      <Text
                        style={[
                          styles.contextChipText,
                          isSelected ? styles.contextChipTextSelected : null,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notas</Text>
              <Text style={styles.sectionDescription}>
                Sintomas, comida reciente o cualquier detalle util.
              </Text>
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={4}
                value={formState.notes}
                onChangeText={(value) => handleChangeField('notes', value)}
                placeholder={`Ej. ${GLUCOSE_CONTEXT_LABELS[formState.context].toLowerCase()}, sin sintomas, despues de caminar.`}
                placeholderTextColor={theme.colors.textMuted}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button title="Cancelar" variant="secondary" onPress={onClose} />
            <Button
              title={initialRecord ? 'Guardar cambios' : 'Guardar glucosa'}
              onPress={() => void handleSubmit()}
              isLoading={isSubmitting}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
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
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },
    section: {
      padding: spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    sectionDescription: {
      marginTop: spacing.xs,
      marginBottom: spacing.md,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    contextGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    contextChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    contextChipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    contextChipText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    contextChipTextSelected: {
      color: theme.colors.surface,
    },
    notesInput: {
      minHeight: 104,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      borderRadius: borderRadius.md,
      backgroundColor: theme.colors.inputBackground,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: fontSize.base,
      color: theme.colors.textPrimary,
    },
    footer: {
      flexDirection: 'row',
      gap: spacing.md,
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  });
