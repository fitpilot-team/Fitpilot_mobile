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
import { colors, spacing, fontSize, borderRadius } from '../../constants/colors';
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
    label: 'Lesión o dolor',
    icon: 'bandage-outline',
    description: 'Sentí molestia o riesgo de lesión',
  },
  {
    value: 'fatigue',
    label: 'Fatiga extrema',
    icon: 'battery-dead-outline',
    description: 'Mi cuerpo necesitaba descanso',
  },
  {
    value: 'motivation',
    label: 'Sin motivación',
    icon: 'sad-outline',
    description: 'No me sentía con ganas hoy',
  },
  {
    value: 'schedule',
    label: 'Conflicto de agenda',
    icon: 'calendar-outline',
    description: 'Surgió algo importante',
  },
  {
    value: 'other',
    label: 'Otra razón',
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
  const [selectedReason, setSelectedReason] = useState<AbandonReason | null>(null);
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (selectedReason) {
      onConfirm(selectedReason, notes.trim() || undefined);
      // Reset state
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="pause-circle-outline" size={40} color={colors.warning} />
            </View>
            <Text style={styles.title}>Abandonar entrenamiento</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {workoutName}
            </Text>
          </View>

          {/* Reasons list */}
          <ScrollView style={styles.reasonsList} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>¿Por qué abandonas el entrenamiento?</Text>

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
                      color={isSelected ? colors.white : colors.gray[500]}
                    />
                  </View>
                  <View style={styles.reasonContent}>
                    <Text style={[styles.reasonLabel, isSelected && styles.reasonLabelSelected]}>
                      {reason.label}
                    </Text>
                    <Text style={styles.reasonDescription}>{reason.description}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Notes input */}
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notas adicionales (opcional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Describe más detalles si lo deseas..."
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Continuar entrenando</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, !selectedReason && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              disabled={!selectedReason}
            >
              <Ionicons name="exit-outline" size={20} color={colors.white} />
              <Text style={styles.confirmButtonText}>Abandonar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
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
    borderBottomColor: colors.gray[100],
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7', // amber-100
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
  },
  reasonsList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
    marginBottom: spacing.md,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonItemSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  reasonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reasonIconSelected: {
    backgroundColor: colors.primary[500],
  },
  reasonContent: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[800],
    marginBottom: 2,
  },
  reasonLabelSelected: {
    color: colors.primary[700],
  },
  reasonDescription: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  notesContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  notesLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray[600],
    marginBottom: spacing.sm,
  },
  notesInput: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.base,
    color: colors.gray[900],
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  actions: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
  },
  cancelButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[700],
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  confirmButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  confirmButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
});
