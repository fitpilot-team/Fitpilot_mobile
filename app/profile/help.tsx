import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../src/components/common';
import { ProfileDetailScreen } from '../../src/components/profile/ProfileDetailScreen';
import { supportFaqItems } from '../../src/constants/support';
import {
  borderRadius,
  colors,
  fontSize,
  shadows,
  spacing,
} from '../../src/constants/colors';

export default function HelpScreen() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <ProfileDetailScreen
      title="Ayuda"
      subtitle="Resuelve dudas frecuentes y encuentra el canal correcto para contactar al equipo."
    >
      <View style={styles.introCard}>
        <View style={styles.introIcon}>
          <Ionicons name="help-buoy-outline" size={24} color={colors.primary[600]} />
        </View>
        <View style={styles.introContent}>
          <Text style={styles.introTitle}>Centro de ayuda</Text>
          <Text style={styles.introDescription}>
            Aqui reunimos respuestas rapidas a los problemas mas comunes dentro de FitPilot.
          </Text>
        </View>
      </View>

      <View style={styles.faqSection}>
        {supportFaqItems.map((item, index) => {
          const isExpanded = expandedIndex === index;

          return (
            <View key={item.question} style={styles.faqCard}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.faqHeader}
                onPress={() =>
                  setExpandedIndex((current) => (current === index ? null : index))
                }
              >
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.gray[500]}
                />
              </TouchableOpacity>

              {isExpanded ? <Text style={styles.faqAnswer}>{item.answer}</Text> : null}
            </View>
          );
        })}
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>Necesitas ayuda adicional?</Text>
        <Text style={styles.contactDescription}>
          Si tu caso no aparece aqui, abre la pantalla de soporte y contactanos por el
          canal que prefieras.
        </Text>
        <Button
          title="Contactar soporte"
          onPress={() => router.push('/profile/contact-support')}
          style={styles.contactButton}
        />
      </View>
    </ProfileDetailScreen>
  );
}

const styles = StyleSheet.create({
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  introIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  introContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  introTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
  },
  introDescription: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: colors.gray[600],
  },
  faqSection: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    paddingRight: spacing.md,
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.gray[800],
    lineHeight: 22,
  },
  faqAnswer: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    lineHeight: 21,
    color: colors.gray[600],
  },
  contactCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  contactTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
  },
  contactDescription: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: colors.gray[600],
  },
  contactButton: {
    marginTop: spacing.lg,
  },
});
