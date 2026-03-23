import React from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/common';
import { ProfileDetailScreen } from '../../src/components/profile/ProfileDetailScreen';
import {
  buildSupportMailtoUrl,
  buildSupportWhatsAppUrl,
  supportEmail,
  supportWhatsApp,
} from '../../src/constants/support';
import {
  borderRadius,
  fontSize,
  shadows,
  spacing,
} from '../../src/constants/colors';
import { useAppTheme, useThemedStyles } from '../../src/theme';

const openExternalUrl = async (url: string, fallbackTitle: string, fallbackMessage: string) => {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert(fallbackTitle, fallbackMessage);
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert(fallbackTitle, fallbackMessage);
  }
};

export default function ContactSupportScreen() {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  const handleEmailPress = async () => {
    await openExternalUrl(
      buildSupportMailtoUrl(),
      'Correo no disponible',
      'No pudimos abrir la aplicacion de correo en este dispositivo.',
    );
  };

  const handleWhatsAppPress = async () => {
    await openExternalUrl(
      buildSupportWhatsAppUrl(),
      'WhatsApp no disponible',
      'No pudimos abrir WhatsApp o el navegador para este canal.',
    );
  };

  return (
    <ProfileDetailScreen
      title="Contactar soporte"
      subtitle="Elige el canal que prefieras para hablar con el equipo de FitPilot."
    >
      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.primary} />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryTitle}>Estamos listos para ayudarte</Text>
          <Text style={styles.summaryDescription}>
            Comparte el mayor detalle posible sobre tu problema para darte una respuesta
            mas rapida.
          </Text>
        </View>
      </View>

      <View style={styles.channelCard}>
        <View style={styles.channelHeader}>
          <View style={styles.channelIcon}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.channelContent}>
            <Text style={styles.channelTitle}>Correo</Text>
            <Text style={styles.channelValue}>{supportEmail}</Text>
          </View>
        </View>
        <Text style={styles.channelDescription}>
          Ideal para consultas con contexto, capturas o seguimiento detallado.
        </Text>
        <Button
          title="Enviar correo"
          onPress={handleEmailPress}
          style={styles.channelButton}
        />
      </View>

      <View style={styles.channelCard}>
        <View style={styles.channelHeader}>
          <View style={styles.channelIcon}>
            <Ionicons name="logo-whatsapp" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.channelContent}>
            <Text style={styles.channelTitle}>WhatsApp</Text>
            <Text style={styles.channelValue}>{supportWhatsApp}</Text>
          </View>
        </View>
        <Text style={styles.channelDescription}>
          Recomendado para resolver dudas rapidas o compartir tu problema en tiempo real.
        </Text>
        <Button
          title="Abrir WhatsApp"
          variant="secondary"
          onPress={handleWhatsAppPress}
          style={styles.channelButton}
        />
      </View>
    </ProfileDetailScreen>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    summaryCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...shadows.sm,
    },
    summaryIcon: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },
    summaryContent: {
      flex: 1,
      marginLeft: spacing.md,
    },
    summaryTitle: {
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    summaryDescription: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textSecondary,
    },
    channelCard: {
      marginTop: spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...shadows.sm,
    },
    channelHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    channelIcon: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primarySoft,
    },
    channelContent: {
      flex: 1,
      marginLeft: spacing.md,
    },
    channelTitle: {
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    channelValue: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    channelDescription: {
      marginTop: spacing.md,
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textSecondary,
    },
    channelButton: {
      marginTop: spacing.lg,
    },
  });
