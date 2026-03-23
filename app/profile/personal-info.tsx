import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Input, LoadingSpinner, PhoneInput } from '../../src/components/common';
import { ProfileDetailScreen } from '../../src/components/profile/ProfileDetailScreen';
import {
  borderRadius,
  fontSize,
  shadows,
  spacing,
} from '../../src/constants/colors';
import { useAppTheme, useThemedStyles } from '../../src/theme';
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
  const styles = useThemedStyles(createStyles);
  const { theme } = useAppTheme();
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
      nextErrors.phoneNumber = 'El telefono es obligatorio.';
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
        'Exito',
        'Tu informacion personal se actualizo correctamente.',
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
        title="Informacion personal"
        subtitle="Actualiza tus datos basicos de perfil."
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
      title="Informacion personal"
      subtitle="Actualiza tu nombre, apellidos y telefono de contacto."
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
          <Text style={styles.readOnlyLabel}>Correo electronico</Text>
          <Text style={styles.readOnlyValue}>{user.email}</Text>
        </View>

        <PhoneInput
          label="Telefono"
          value={formState.phoneNumber}
          onChangeValue={(value) => {
            setFormState((current) => ({ ...current, phoneNumber: value }));
            setErrors((current) => ({ ...current, phoneNumber: undefined }));
          }}
          error={errors.phoneNumber}
          helperText="Si cambias tu numero, quedara pendiente de verificacion."
        />

        <View style={styles.statusRow}>
          <Text
            style={[
              styles.statusBadge,
              user.isPhoneVerified ? styles.statusBadgeSuccess : styles.statusBadgeMuted,
            ]}
          >
            {user.isPhoneVerified ? 'Numero verificado' : 'Numero pendiente de verificacion'}
          </Text>
        </View>
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
    readOnlyField: {
      marginBottom: spacing.md,
    },
    readOnlyLabel: {
      fontSize: fontSize.sm,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      marginBottom: spacing.xs,
    },
    readOnlyValue: {
      fontSize: fontSize.base,
      color: theme.colors.textPrimary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: theme.colors.inputBackground,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.inputBorder,
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
      backgroundColor: `${theme.colors.success}18`,
      color: theme.colors.success,
    },
    statusBadgeMuted: {
      backgroundColor: theme.colors.surfaceAlt,
      color: theme.colors.textSecondary,
    },
    footerActions: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    footerButton: {
      flex: 1,
    },
  });
