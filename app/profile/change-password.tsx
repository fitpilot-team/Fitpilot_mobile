import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Input } from '../../src/components/common';
import { ProfileDetailScreen } from '../../src/components/profile/ProfileDetailScreen';
import {
  borderRadius,
  colors,
  fontSize,
  shadows,
  spacing,
} from '../../src/constants/colors';
import { changePassword } from '../../src/services/account';

type FormErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!currentPassword.trim()) {
      nextErrors.currentPassword = 'La contraseña actual es obligatoria.';
    }

    if (!newPassword.trim()) {
      nextErrors.newPassword = 'La nueva contraseña es obligatoria.';
    } else if (newPassword.trim().length < 6) {
      nextErrors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres.';
    } else if (newPassword === currentPassword) {
      nextErrors.newPassword = 'La nueva contraseña debe ser distinta a la actual.';
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Confirma tu nueva contraseña.';
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'La confirmación no coincide con la nueva contraseña.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert(
        'Éxito',
        result.sessions_closed
          ? 'Tu contraseña se actualizó y cerramos las demás sesiones activas.'
          : 'Tu contraseña se actualizó correctamente.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No fue posible actualizar tu contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <View style={styles.footerActions}>
      <Button
        title="Cancelar"
        variant="secondary"
        onPress={() => router.back()}
        style={styles.footerButton}
      />
      <Button
        title="Actualizar contraseña"
        onPress={handleSubmit}
        isLoading={isSubmitting}
        style={styles.footerButton}
      />
    </View>
  );

  return (
    <ProfileDetailScreen
      title="Cambiar contraseña"
      subtitle="Mantendremos esta sesión activa y cerraremos las demás al guardar el cambio."
      footer={footer}
    >
      <View style={styles.card}>
        <Input
          label="Contraseña actual"
          value={currentPassword}
          onChangeText={(value) => {
            setCurrentPassword(value);
            setErrors((current) => ({ ...current, currentPassword: undefined }));
          }}
          error={errors.currentPassword}
          secureTextEntry
          icon="lock-closed-outline"
        />

        <Input
          label="Nueva contraseña"
          value={newPassword}
          onChangeText={(value) => {
            setNewPassword(value);
            setErrors((current) => ({ ...current, newPassword: undefined }));
          }}
          error={errors.newPassword}
          secureTextEntry
          icon="shield-outline"
        />

        <Input
          label="Confirmar nueva contraseña"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            setErrors((current) => ({ ...current, confirmPassword: undefined }));
          }}
          error={errors.confirmPassword}
          secureTextEntry
          icon="checkmark-circle-outline"
        />

        <Text style={styles.helperText}>
          La nueva contraseña debe tener al menos 6 caracteres.
        </Text>
      </View>
    </ProfileDetailScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  helperText: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.gray[500],
    lineHeight: 20,
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
