import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, borderRadius } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { AbandonReason } from '../../types';

interface AbandonReasonOption {
  value: AbandonReason;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const ABANDON_REASONS: AbandonReasonOption[] = [
  {
    value: 'time',
    label: 'Falta de tiempo',
    icon: 'time-outline',
    description: 'No tuve suficiente tiempo para completar',
  },
  {
    value: 'injury',
    label: 'LesiÃ³n o dolor',
    icon: 'bandage-outline',
    description: 'SentÃ­ molestia o riesgo de lesiÃ³n',
  },
  {
    value: 'fatigue',
    label: 'Fatiga extrema',
    icon: 'battery-dead-outline',
    description: 'Mi cuerpo necesitaba descanso',
  },
  {
    value: 'motivation',
    label: 'Sin motivaciÃ³n',
    icon: 'sad-outline',
    description: 'No me sentÃ­a con ganas hoy',
  },
  {
    value: 'schedule',
    label: 'Conflicto de agenda',
    icon: 'calendar-outline',
    description: 'SurgiÃ³ algo importante',
  },
  {
    value: 'other',
    label: 'Otra razÃ³n',
    icon: 'ellipsis-horizontal-outline',
    description: 'Especificar en notas',
  },
];

interface AbandonModalProps {
  visible: boolean;
  workoutName: string;
  onConfirm: (reason: AbandonReason, notes?: string) => void;
  onCancel: () => void;
}

export const AbandonModal: React.FC<AbandonModalProps> = ({
  visible,
  workoutName,
  onConfirm,
  onCancel,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [selectedReason, setSelectedReason] = useState<AbandonReason | null>(null);
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason, notes.trim() || undefined);
      setSelectedReason(null);
      setNotes('');
    }
  };

  const handleCancel = () => {
    setSelectedReason(null);
    setNotes('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="pause-circle-outline" size={40} color={theme.colors.warning} />
            </View>
            <Text style={styles.title}>Abandonar entrenamiento</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {workoutName}
            </Text>
          </View>

          <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Â¿Por quÃ© abandonas el entrenamiento?</Text>

            {ABANDON_REASONS.map((reason) => {
              const isSelected = selectedReason === reason.value;
              return (
                <TouchableOpacity
                  key={reason.value}
                  style={[styles.reasonItem, isSelected && styles.reasonItemSelected]}
                  onPress={() => setSelectedReason(reason.value)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.reasonIcon, isSelected && styles.reasonIconSelected]}>
                    <Ionicons
                      name={reason.icon}
                      size={24}
                      color={isSelected ? theme.colors.surface : theme.colors.iconMuted}
                    />
                  </View>
                  <View style={styles.reasonContent}>
                    <Text style={[styles.reasonLabel, isSelected && styles.reasonLabelSelected]}>
                      {reason.label}
                    </Text>
                    <Text style={styles.reasonDescription}>{reason.description}</Text>
                  </View>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                  ) : null}
                </TouchableOpacity>
              );
            })}

            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notas adicionales (opcional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Describe mÃ¡s detalles si lo deseas..."
                placeholderTextColor={theme.colors.textMuted}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Continuar entrenando</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, !selectedReason && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={!selectedReason}
            >
              <Ionicons name="exit-outline" size={20} color={theme.colors.surface} />
              <Text style={styles.confirmButtonText}>Abandonar</Text>
            </TouchableOpacity>
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
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      width: '100%',
      maxWidth: 400,
      maxHeight: '85%',
      overflow: 'hidden',
    },
    header: {
      alignItems: 'center',
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    iconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.colors.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    reasonsList: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    sectionLabel: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: spacing.md,
    },
    reasonItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    reasonItemSelected: {
      borderColor: theme.colors.primaryBorder,
      backgroundColor: theme.colors.primarySoft,
    },
    reasonIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reasonIconSelected: {
      backgroundColor: theme.colors.primary,
    },
    reasonContent: {
      flex: 1,
    },
    reasonLabel: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    reasonLabelSelected: {
      color: theme.colors.primary,
    },
    reasonDescription: {
      marginTop: 2,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    notesContainer: {
      marginTop: spacing.md,
      marginBottom: spacing.lg,
    },
    notesLabel: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: spacing.sm,
    },
    notesInput: {
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
      backgroundColor: theme.colors.inputBackground,
      color: theme.colors.textPrimary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      minHeight: 100,
      fontSize: fontSize.sm,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.md,
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    cancelButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cancelButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    confirmButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.error,
    },
    confirmButtonDisabled: {
      opacity: 0.45,
    },
    confirmButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: theme.colors.surface,
    },
  });

export default AbandonModal;
