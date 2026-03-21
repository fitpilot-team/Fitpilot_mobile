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
  colors,
  fontSize,
  shadows,
  spacing,
} from '../../src/constants/colors';

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
          <Ionicons name="chatbubbles-outline" size={24} color={colors.primary[600]} />
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
            <Ionicons name="mail-outline" size={20} color={colors.primary[600]} />
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
            <Ionicons name="logo-whatsapp" size={20} color={colors.primary[600]} />
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

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  summaryContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  summaryTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
  },
  summaryDescription: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: colors.gray[600],
  },
  channelCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
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
    backgroundColor: colors.primary[50],
  },
  channelContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  channelTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.gray[800],
  },
  channelValue: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  channelDescription: {
    marginTop: spacing.md,
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: colors.gray[600],
  },
  channelButton: {
    marginTop: spacing.lg,
  },
});
