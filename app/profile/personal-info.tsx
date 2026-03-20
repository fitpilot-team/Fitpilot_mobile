import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Input, LoadingSpinner, PhoneInput } from '../../src/components/common';
import { ProfileDetailScreen } from '../../src/components/profile/ProfileDetailScreen';
import {
  borderRadius,
  colors,
  fontSize,
  shadows,
  spacing,
} from '../../src/constants/colors';
import { updateCurrentUser } from '../../src/services/account';
import { useAuthStore } from '../../src/store/authStore';

type FormState = {
  name: string;
  lastname: string;
  phoneNumber: string;
};

type FormErrors = {
  name?: string;
  lastname?: string;
  phoneNumber?: string;
};

export default function PersonalInfoScreen() {
  const { user, refreshUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    name: '',
    lastname: '',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormState({
      name: user.firstName ?? '',
      lastname: user.lastName ?? '',
      phoneNumber: user.phoneNumber ?? '',
    });
  }, [user]);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!formState.name.trim()) {
      nextErrors.name = 'El nombre es obligatorio.';
    }

    if (!formState.lastname.trim()) {
      nextErrors.lastname = 'Los apellidos son obligatorios.';
    }

    if (!formState.phoneNumber.trim()) {
      nextErrors.phoneNumber = 'El teléfono es obligatorio.';
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
      await updateCurrentUser({
        name: formState.name.trim(),
        lastname: formState.lastname.trim(),
        phone_number: formState.phoneNumber.trim(),
      });

      await refreshUser();

      Alert.alert(
        'Éxito',
        'Tu información personal se actualizó correctamente.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No fue posible actualizar tu perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <ProfileDetailScreen
        title="Información personal"
        subtitle="Actualiza tus datos básicos de perfil."
      >
        <LoadingSpinner text="Cargando perfil..." />
      </ProfileDetailScreen>
    );
  }

  const footer = (
    <View style={styles.footerActions}>
      <Button
        title="Cancelar"
        variant="secondary"
        onPress={() => router.back()}
        style={styles.footerButton}
      />
      <Button
        title="Guardar cambios"
        onPress={handleSubmit}
        isLoading={isSubmitting}
        style={styles.footerButton}
      />
    </View>
  );

  return (
    <ProfileDetailScreen
      title="Información personal"
      subtitle="Actualiza tu nombre, apellidos y teléfono de contacto."
      footer={footer}
    >
      <View style={styles.card}>
        <Input
          label="Nombre"
          value={formState.name}
          onChangeText={(value) => {
            setFormState((current) => ({ ...current, name: value }));
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          error={errors.name}
          autoCapitalize="words"
          icon="person-outline"
        />

        <Input
          label="Apellidos"
          value={formState.lastname}
          onChangeText={(value) => {
            setFormState((current) => ({ ...current, lastname: value }));
            setErrors((current) => ({ ...current, lastname: undefined }));
          }}
          error={errors.lastname}
          autoCapitalize="words"
          icon="people-outline"
        />

        <View style={styles.readOnlyField}>
          <Text style={styles.readOnlyLabel}>Correo electrónico</Text>
          <Text style={styles.readOnlyValue}>{user.email}</Text>
        </View>

        <PhoneInput
          label="Teléfono"
          value={formState.phoneNumber}
          onChangeValue={(value) => {
            setFormState((current) => ({ ...current, phoneNumber: value }));
            setErrors((current) => ({ ...current, phoneNumber: undefined }));
          }}
          error={errors.phoneNumber}
          helperText="Si cambias tu número, quedará pendiente de verificación."
        />

        <View style={styles.statusRow}>
          <Text
            style={[
              styles.statusBadge,
              user.isPhoneVerified ? styles.statusBadgeSuccess : styles.statusBadgeMuted,
            ]}
          >
            {user.isPhoneVerified ? 'Número verificado' : 'Número pendiente de verificación'}
          </Text>
        </View>
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
  readOnlyField: {
    marginBottom: spacing.md,
  },
  readOnlyLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  readOnlyValue: {
    fontSize: fontSize.base,
    color: colors.gray[900],
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  statusRow: {
    marginTop: spacing.xs,
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  statusBadgeSuccess: {
    backgroundColor: `${colors.success}15`,
    color: colors.success,
  },
  statusBadgeMuted: {
    backgroundColor: colors.gray[100],
    color: colors.gray[600],
  },
  footerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
