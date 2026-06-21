import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { Button, Input, Logo } from '../src/components/common';
import { TurnstileChallengeModal } from '../src/components/auth/TurnstileChallengeModal';
import { brandColors, spacing, fontSize, scaledFontSize, borderRadius } from '../src/constants/colors';
import { clientForgotPasswordUrl } from '../src/constants/support';
import { useThemedStyles, type AppTheme } from '../src/theme';
import { isSmallScreen, isVerySmallScreen } from '../src/utils/responsive';
import type { LoginCredentials } from '../src/types';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isCaptchaVisible, setIsCaptchaVisible] = useState(false);
  const [captchaSessionKey, setCaptchaSessionKey] = useState(0);
  const [pendingCredentials, setPendingCredentials] = useState<LoginCredentials | null>(null);
  const { login, isLoading, error, clearError, isAuthenticated, user } = useAuthStore();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const smallScreen = isSmallScreen(width);
  const verySmallScreen = isVerySmallScreen(width);

  const scaledText = useMemo(
    () => ({
      tagline: { fontSize: scaledFontSize('sm', width) },
      welcomeTitle: { fontSize: scaledFontSize('2xl', width) },
      welcomeSubtitle: { fontSize: scaledFontSize('base', width) },
      errorText: { fontSize: scaledFontSize('sm', width) },
      forgotPasswordText: { fontSize: scaledFontSize('sm', width) },
      createAccountText: { fontSize: scaledFontSize('sm', width) },
      infoCardTitle: { fontSize: scaledFontSize('sm', width) },
      infoCardText: { fontSize: scaledFontSize('xs', width) },
      infoCardTextSecondary: { fontSize: scaledFontSize('xs', width) },
    }),
    [width],
  );

  const headerPaddingBottom = verySmallScreen ? 14 : smallScreen ? 18 : 36;

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.onboardingStatus !== 'completed') {
        router.replace('/onboarding');
        return;
      }

      router.replace('/(tabs)');
    }
  }, [isAuthenticated, user?.onboardingStatus]);

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

  const submitLogin = async (credentials: LoginCredentials) => {
    const normalizedCredentials = {
      email: credentials.email.trim(),
      password: credentials.password,
      captchaToken: credentials.captchaToken,
    };
    const result = await login(normalizedCredentials);

    if (result.status === 'success') {
      setPendingCredentials(null);
      setIsCaptchaVisible(false);
      router.replace('/(tabs)');
      return;
    }

    if (result.status === 'captcha_required') {
      setPendingCredentials({
        email: normalizedCredentials.email,
        password: normalizedCredentials.password,
      });
      setCaptchaSessionKey((current) => current + 1);
      setIsCaptchaVisible(true);
      return;
    }

    setPendingCredentials(null);
    setIsCaptchaVisible(false);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }

    await submitLogin({ email, password });
  };

  const handleCaptchaToken = async (token: string) => {
    if (!pendingCredentials) {
      setIsCaptchaVisible(false);
      return;
    }

    setIsCaptchaVisible(false);
    await submitLogin({
      ...pendingCredentials,
      captchaToken: token,
    });
  };

  const handleForgotPassword = async () => {
    if (!clientForgotPasswordUrl) {
      Alert.alert(
        'Enlace no disponible',
        'Todavía no hay una URL configurada para restablecer la contraseña.',
      );
      return;
    }

    try {
      await Linking.openURL(clientForgotPasswordUrl);
    } catch (forgotPasswordError) {
      if (__DEV__) {
        console.warn('[Auth] forgot password link error', forgotPasswordError);
      }

      Alert.alert(
        'No se pudo abrir el enlace',
        'Intenta de nuevo en unos minutos o contacta a soporte.',
      );
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
        style={[
          styles.headerGradient,
          {
            paddingTop: insets.top + spacing.md,
            paddingBottom: headerPaddingBottom,
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <View
            style={[
              styles.logoBackground,
              smallScreen ? styles.logoBackgroundSmall : null,
              verySmallScreen ? styles.logoBackgroundXSmall : null,
            ]}
          >
            <Logo
              size={verySmallScreen ? 'xs' : smallScreen ? 'sm' : 'md'}
              showText
              animated
            />
          </View>
          <Text style={[styles.tagline, scaledText.tagline]}>
            Tu entrenamiento y dieta personalizados
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.formContainer}
        contentContainerStyle={[
          styles.formContent,
          {
            flexGrow: 1,
            paddingBottom: Math.max(insets.bottom + spacing.lg, spacing.lg),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.welcomeTitle, scaledText.welcomeTitle]}>Bienvenido</Text>
        <Text style={[styles.welcomeSubtitle, scaledText.welcomeSubtitle]}>
          Inicia sesión o crea tu cuenta para comenzar tu programa
        </Text>

        {error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorHeader}>
              <Ionicons name="alert-circle" size={20} color={styles.errorIcon.color} />
              <Text style={styles.errorTitle}>No se pudo iniciar sesión</Text>
            </View>
            <Text style={[styles.errorText, scaledText.errorText]}>{error}</Text>
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
          placeholder="********"
          value={password}
          onChangeText={handleChangePassword}
          secureTextEntry
          autoComplete="password"
          icon="lock-closed-outline"
        />

        <Pressable onPress={handleForgotPassword} style={styles.forgotPasswordLink}>
          <Text style={[styles.forgotPasswordText, scaledText.forgotPasswordText]}>
            Olvide mi contraseña
          </Text>
        </Pressable>

        <Button
          title="Iniciar sesión"
          onPress={handleLogin}
          isLoading={isLoading}
          disabled={!email.trim() || !password.trim()}
          style={styles.loginButton}
        />

        <Pressable onPress={() => router.push('/register')} style={styles.createAccountButton}>
          <Text style={[styles.createAccountText, scaledText.createAccountText]}>
            Crear cuenta nueva
          </Text>
        </Pressable>

        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Ionicons name="information-circle-outline" size={20} color={brandColors.sky} />
            <Text style={[styles.infoCardTitle, scaledText.infoCardTitle]}>Empieza en FitPilot</Text>
          </View>
          <Text style={[styles.infoCardText, scaledText.infoCardText]}>
            Crea tu cuenta desde la app y completa el onboarding para que podamos
            personalizar tu experiencia.
          </Text>
          <Text style={[styles.infoCardTextSecondary, scaledText.infoCardTextSecondary]}>
            Si ya trabajas con un profesional, usa el mismo correo que compartiste con el.
          </Text>
        </View>
      </ScrollView>

      <TurnstileChallengeModal
        key={captchaSessionKey}
        visible={isCaptchaVisible}
        onClose={() => setIsCaptchaVisible(false)}
        onToken={handleCaptchaToken}
      />
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
    createAccountButton: {
      alignItems: 'center',
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
    },
    createAccountText: {
      color: brandColors.sky,
      fontSize: fontSize.sm,
      fontWeight: '700',
    },
    forgotPasswordLink: {
      alignSelf: 'flex-end',
      marginTop: spacing.xs,
    },
    forgotPasswordText: {
      color: brandColors.sky,
      fontSize: fontSize.sm,
      fontWeight: '600',
    },
    infoCard: {
      marginTop: spacing.xl,
      backgroundColor: 'rgba(103, 181, 222, 0.08)',
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
