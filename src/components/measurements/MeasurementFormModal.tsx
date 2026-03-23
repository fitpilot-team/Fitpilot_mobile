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
  BASE_MEASUREMENT_FIELDS,
  BIOIMPEDANCE_SECTIONS,
  MEASUREMENT_FIELD_LABELS,
  MEASUREMENT_NUMERIC_FORM_KEYS,
  PERIMETER_SECTIONS,
  type MeasurementNumericFormKey,
} from '../../constants/measurements';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import type { CreateOwnMeasurementPayload } from '../../types';
import {
  formatMeasurementNumber,
  getTodayDateInput,
  isValidMeasurementDateInput,
  parseMeasurementNumber,
} from '../../utils/measurements';
import {
  convertMeasurementInputToMetricValue,
  convertMeasurementUnitValue,
  getMeasurementDisplayUnit,
} from '../../utils/measurementUnits';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import { useMeasurementPreferenceStore } from '../../store/measurementPreferenceStore';

type MeasurementFormState = Record<MeasurementNumericFormKey, string> & {
  date: string;
  notes: string;
};

interface MeasurementFormModalProps {
  visible: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateOwnMeasurementPayload) => Promise<void>;
}

const createInitialFormState = (): MeasurementFormState => {
  const numericFields = Object.fromEntries(
    MEASUREMENT_NUMERIC_FORM_KEYS.map((fieldKey) => [fieldKey, '']),
  ) as Record<MeasurementNumericFormKey, string>;

  return {
    ...numericFields,
    date: getTodayDateInput(),
    notes: '',
  };
};

const isIntegerField = (fieldKey: MeasurementNumericFormKey) =>
  fieldKey === 'metabolic_age';

const FIELD_CONFIG_BY_KEY = Object.fromEntries(
  [
    ...BASE_MEASUREMENT_FIELDS,
    ...BIOIMPEDANCE_SECTIONS.flatMap((section) => section.fields),
    ...PERIMETER_SECTIONS.flatMap((section) => section.fields),
  ].map((field) => [field.key, field]),
) as Record<
  MeasurementNumericFormKey,
  {
    key: MeasurementNumericFormKey;
    label: string;
    placeholder?: string;
    unit?: string;
  }
>;

export const MeasurementFormModal: React.FC<MeasurementFormModalProps> = ({
  visible,
  isSubmitting,
  onClose,
  onSubmit,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const measurementPreference = useMeasurementPreferenceStore((state) => state.preference);
  const initializeMeasurementPreference = useMeasurementPreferenceStore((state) => state.initialize);
  const [formState, setFormState] = useState<MeasurementFormState>(
    createInitialFormState(),
  );

  useEffect(() => {
    void initializeMeasurementPreference();
  }, [initializeMeasurementPreference]);

  useEffect(() => {
    if (!visible) {
      setFormState(createInitialFormState());
    }
  }, [visible]);

  const handleChangeField = (fieldKey: keyof MeasurementFormState, value: string) => {
    setFormState((currentState) => ({
      ...currentState,
      [fieldKey]: value,
    }));
  };

  const payload = useMemo(() => {
    const nextPayload: CreateOwnMeasurementPayload = {
      date: formState.date.trim(),
    };

    if (formState.notes.trim()) {
      nextPayload.notes = formState.notes.trim();
    }

    MEASUREMENT_NUMERIC_FORM_KEYS.forEach((fieldKey) => {
      const parsedValue = parseMeasurementNumber(formState[fieldKey]);
      const fieldUnit = FIELD_CONFIG_BY_KEY[fieldKey]?.unit;

      if (parsedValue !== null) {
        const normalizedValue = convertMeasurementInputToMetricValue(
          parsedValue,
          fieldUnit,
          measurementPreference,
        );

        nextPayload[fieldKey] = isIntegerField(fieldKey)
          ? Math.round(normalizedValue)
          : normalizedValue;
      }
    });

    return nextPayload;
  }, [formState, measurementPreference]);

  const handleSubmit = async () => {
    if (!isValidMeasurementDateInput(formState.date.trim())) {
      Alert.alert('Fecha invalida', 'Captura la fecha en formato YYYY-MM-DD.');
      return;
    }

    const invalidField = MEASUREMENT_NUMERIC_FORM_KEYS.find((fieldKey) => {
      const rawValue = formState[fieldKey].trim();
      return rawValue.length > 0 && parseMeasurementNumber(rawValue) === null;
    });

    if (invalidField) {
      Alert.alert(
        'Dato invalido',
        `Verifica el valor del campo ${MEASUREMENT_FIELD_LABELS[invalidField]}.`,
      );
      return;
    }

    const hasAnyMeasurementValue = MEASUREMENT_NUMERIC_FORM_KEYS.some(
      (fieldKey) => payload[fieldKey] !== undefined,
    );

    if (!hasAnyMeasurementValue) {
      Alert.alert(
        'Faltan datos',
        'Captura al menos una medida ademas de la fecha para guardar el registro.',
      );
      return;
    }

    await onSubmit(payload);
  };

  const getFieldLabel = (field: { label: string; unit?: string }) => {
    const displayUnit = getMeasurementDisplayUnit(field.unit, measurementPreference);
    return `${field.label}${displayUnit ? ` (${displayUnit})` : ''}`;
  };

  const getFieldPlaceholder = (field: { placeholder?: string; unit?: string }) => {
    if (!field.placeholder) {
      return undefined;
    }

    const numericPlaceholder = parseMeasurementNumber(field.placeholder);

    if (numericPlaceholder === null) {
      return field.placeholder;
    }

    const convertedValue = convertMeasurementUnitValue(
      numericPlaceholder,
      field.unit,
      measurementPreference,
    );

    return formatMeasurementNumber(
      convertedValue.value,
      convertedValue.unit === '%' ? 1 : 1,
      field.placeholder,
    );
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
              <Text style={styles.title}>Registrar medidas</Text>
              <Text style={styles.subtitle}>
                Bioimpedancia y perimetros corporales.
              </Text>
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
              <Text style={styles.sectionTitle}>Datos base</Text>
              <Text style={styles.sectionDescription}>
                La fecha es obligatoria. Los demas campos son opcionales.
              </Text>
              <Input
                label="Fecha"
                value={formState.date}
                onChangeText={(value) => handleChangeField('date', value)}
                placeholder="2026-03-14"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {BASE_MEASUREMENT_FIELDS.map((field) => (
                <Input
                  key={field.key}
                  label={getFieldLabel(field)}
                  value={formState[field.key]}
                  onChangeText={(value) => handleChangeField(field.key, value)}
                  placeholder={getFieldPlaceholder(field)}
                  keyboardType="numeric"
                />
              ))}
            </View>

            {BIOIMPEDANCE_SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionDescription}>{section.description}</Text>
                {section.fields.map((field) => (
                  <Input
                    key={field.key}
                    label={getFieldLabel(field)}
                    value={formState[field.key]}
                    onChangeText={(value) => handleChangeField(field.key, value)}
                    placeholder={getFieldPlaceholder(field)}
                    keyboardType="numeric"
                  />
                ))}
              </View>
            ))}

            {PERIMETER_SECTIONS.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.sectionDescription}>{section.description}</Text>
                {section.fields.map((field) => (
                  <Input
                    key={field.key}
                    label={getFieldLabel(field)}
                    value={formState[field.key]}
                    onChangeText={(value) => handleChangeField(field.key, value)}
                    placeholder={getFieldPlaceholder(field)}
                    keyboardType="numeric"
                  />
                ))}
              </View>
            ))}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notas</Text>
              <Text style={styles.sectionDescription}>
                Observaciones opcionales sobre la medicion.
              </Text>
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={4}
                value={formState.notes}
                onChangeText={(value) => handleChangeField('notes', value)}
                placeholder="Ej. medicion en ayuno, misma bascula, despues del entrenamiento..."
                placeholderTextColor={theme.colors.textMuted}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Button title="Cancelar" variant="secondary" onPress={onClose} />
            <Button
              title="Guardar medicion"
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
      paddingBottom: spacing.xxl,
    },
    section: {
      marginBottom: spacing.lg,
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
    notesInput: {
      minHeight: 96,
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
