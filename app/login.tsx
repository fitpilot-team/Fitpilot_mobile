import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/authStore';
import { Button, Input, Logo } from '../src/components/common';
import { brandColors, spacing, fontSize, borderRadius } from '../src/constants/colors';
import { useThemedStyles, type AppTheme } from '../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 400;
const isVerySmallScreen = SCREEN_WIDTH < 375;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const styles = useThemedStyles(createStyles);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const handleChangeEmail = (value: string) => {
    if (error) {
      clearError();
    }

    setEmail(value);
  };

  const handleChangePassword = (value: string) => {
    if (error) {
      clearError();
    }

    setPassword(value);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }

    const success = await login({ email: email.trim(), password });
    if (success) {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[brandColors.navy, brandColors.sky]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.logoContainer}>
          <View
            style={[
              styles.logoBackground,
              isSmallScreen ? styles.logoBackgroundSmall : null,
              isVerySmallScreen ? styles.logoBackgroundXSmall : null,
            ]}
          >
            <Logo
              size={isVerySmallScreen ? 'xs' : isSmallScreen ? 'sm' : 'md'}
              showText
              animated
            />
          </View>
          <Text style={styles.tagline}>Tu entrenamiento y dieta personalizados</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.welcomeTitle}>Bienvenido</Text>
        <Text style={styles.welcomeSubtitle}>
          Inicia sesion para acceder a tu programa de entrenamiento
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorHeader}>
              <Ionicons name="alert-circle" size={20} color={styles.errorIcon.color} />
              <Text style={styles.errorTitle}>No se pudo iniciar sesión</Text>
            </View>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Input
          label="Correo electrónico"
          placeholder="tu@email.com"
          value={email}
          onChangeText={handleChangeEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          icon="mail-outline"
        />

        <Input
          label="Contraseña"
          placeholder="••••••••"
          value={password}
          onChangeText={handleChangePassword}
          secureTextEntry
          autoComplete="password"
          icon="lock-closed-outline"
        />

        <Button
          title="Iniciar sesión"
          onPress={handleLogin}
          isLoading={isLoading}
          disabled={!email.trim() || !password.trim()}
          style={styles.loginButton}
        />

        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="information-circle-outline" size={20} color={brandColors.sky} />
            <Text style={styles.infoCardTitle}>¿No tienes cuenta?</Text>
          </View>
          <Text style={styles.infoCardText}>
            Esta aplicación es exclusiva para clientes. Tu entrenador o nutriólogo debe
            darte de alta para que puedas acceder.
          </Text>
          <Text style={styles.infoCardTextSecondary}>
            Los profesionales deben usar la aplicación web.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerGradient: {
      paddingTop: isVerySmallScreen ? 26 : isSmallScreen ? 32 : 54,
      paddingBottom: isVerySmallScreen ? 14 : isSmallScreen ? 18 : 36,
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    logoContainer: {
      alignItems: 'center',
    },
    logoBackground: {
      backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.86)' : 'rgba(255, 255, 255, 0.85)',
      borderRadius: 20,
      padding: spacing.lg,
      marginBottom: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    logoBackgroundSmall: {
      padding: spacing.sm,
      borderRadius: 14,
    },
    logoBackgroundXSmall: {
      padding: spacing.xs,
      borderRadius: 12,
    },
    tagline: {
      fontSize: fontSize.sm,
      color: 'rgba(255, 255, 255, 0.9)',
      fontWeight: '500',
    },
    formContainer: {
      flex: 1,
    },
    formContent: {
      padding: spacing.lg,
      paddingTop: spacing.xl,
    },
    welcomeTitle: {
      fontSize: fontSize['2xl'],
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
      marginBottom: spacing.xs,
    },
    welcomeSubtitle: {
      fontSize: fontSize.base,
      color: theme.colors.textMuted,
      marginBottom: spacing.xl,
    },
    errorContainer: {
      backgroundColor: `${theme.colors.error}12`,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.error,
    },
    errorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    errorIcon: {
      color: theme.colors.error,
    },
    errorTitle: {
      color: theme.colors.error,
      fontSize: fontSize.sm,
      fontWeight: '700',
    },
    errorText: {
      color: theme.colors.error,
      fontSize: fontSize.sm,
      lineHeight: 20,
    },
    loginButton: {
      marginTop: spacing.md,
    },
    infoCard: {
      marginTop: spacing.xl,
      backgroundColor: theme.isDark ? 'rgba(103, 181, 222, 0.08)' : 'rgba(103, 181, 222, 0.08)',
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(103, 181, 222, 0.2)' : 'rgba(103, 181, 222, 0.15)',
    },
    infoCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
    },
    infoCardTitle: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: brandColors.sky,
    },
    infoCardText: {
      fontSize: fontSize.xs,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    infoCardTextSecondary: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      lineHeight: 18,
      marginTop: 4,
      fontStyle: 'italic',
    },
  });
