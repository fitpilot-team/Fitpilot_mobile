import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Input } from '../../src/components/common';
import { ProfileDetailScreen } from '../../src/components/profile/ProfileDetailScreen';
import {
  borderRadius,
  fontSize,
  shadows,
  spacing,
} from '../../src/constants/colors';
import { useAppTheme, useThemedStyles } from '../../src/theme';
import { changePassword } from '../../src/services/account';

type FormErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export default function ChangePasswordScreen() {
  const styles = useThemedStyles(createStyles);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!currentPassword.trim()) {
      nextErrors.currentPassword = 'La contrasena actual es obligatoria.';
    }

    if (!newPassword.trim()) {
      nextErrors.newPassword = 'La nueva contrasena es obligatoria.';
    } else if (newPassword.trim().length < 6) {
      nextErrors.newPassword = 'La nueva contrasena debe tener al menos 6 caracteres.';
    } else if (newPassword === currentPassword) {
      nextErrors.newPassword = 'La nueva contrasena debe ser distinta a la actual.';
    }

    if (!confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Confirma tu nueva contrasena.';
    } else if (confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'La confirmacion no coincide con la nueva contrasena.';
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
        'Exito',
        result.sessions_closed
          ? 'Tu contrasena se actualizo y cerramos las demas sesiones activas.'
          : 'Tu contrasena se actualizo correctamente.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No fue posible actualizar tu contrasena.');
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
        title="Actualizar contrasena"
        onPress={handleSubmit}
        isLoading={isSubmitting}
        style={styles.footerButton}
      />
    </View>
  );

  return (
    <ProfileDetailScreen
      title="Cambiar contrasena"
      subtitle="Mantendremos esta sesion activa y cerraremos las demas al guardar el cambio."
      footer={footer}
    >
      <View style={styles.card}>
        <Input
          label="Contrasena actual"
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
          label="Nueva contrasena"
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
          label="Confirmar nueva contrasena"
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
          La nueva contrasena debe tener al menos 6 caracteres.
        </Text>
      </View>
    </ProfileDetailScreen>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...shadows.sm,
    },
    helperText: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
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
