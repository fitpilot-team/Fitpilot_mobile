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
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../src/store/authStore';
import { Button, Input, Logo } from '../src/components/common';
import { colors, brandColors, spacing, fontSize, borderRadius } from '../src/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmallScreen = SCREEN_WIDTH < 400; // iPhone SE, iPhone mini, etc.
const isVerySmallScreen = SCREEN_WIDTH < 375; // iPhone SE 1st gen

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Clear error when inputs change
    if (error) {
      clearError();
    }
  }, [email, password, error, clearError]);

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
          {/* Logo oficial animado - tamaño responsivo */}
          <View style={[
            styles.logoBackground,
            isSmallScreen && styles.logoBackgroundSmall,
            isVerySmallScreen && styles.logoBackgroundXSmall
          ]}>
            <Logo
              size={isVerySmallScreen ? 'xs' : isSmallScreen ? 'sm' : 'md'}
              showText={true}
              animated
            />
          </View>
          <Text style={styles.tagline}>Tu entrenamiento personalizado</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.welcomeTitle}>Bienvenido</Text>
        <Text style={styles.welcomeSubtitle}>
          Inicia sesión para acceder a tu programa de entrenamiento
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Input
          label="Correo electrónico"
          placeholder="tu@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          icon="mail-outline"
        />

        <Input
          label="Contraseña"
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          icon="lock-closed-outline"
        />

        <Button
          title="Iniciar Sesión"
          onPress={handleLogin}
          isLoading={isLoading}
          disabled={!email.trim() || !password.trim()}
          style={styles.loginButton}
        />

        <Text style={styles.clientNote}>
          Esta aplicación es exclusiva para clientes.{'\n'}
          Los entrenadores deben usar la aplicación web.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    padding: spacing.lg,
    marginBottom: spacing.md,
    // Sombra sutil
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
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: fontSize.base,
    color: colors.gray[500],
    marginBottom: spacing.xl,
  },
  errorContainer: {
    backgroundColor: `${colors.error}15`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
  },
  loginButton: {
    marginTop: spacing.md,
  },
  clientNote: {
    marginTop: spacing.xl,
    textAlign: 'center',
    fontSize: fontSize.xs,
    color: colors.gray[400],
    lineHeight: 18,
  },
});
