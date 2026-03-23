import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { LoadingSpinner } from '../../../src/components/common';
import { ProfileDetailScreen } from '../../../src/components/profile/ProfileDetailScreen';
import {
  isSupportLegalDocumentKey,
  supportLegalDocuments,
} from '../../../src/constants/support';
import {
  borderRadius,
  fontSize,
  shadows,
  spacing,
} from '../../../src/constants/colors';
import { useAppTheme, useThemedStyles } from '../../../src/theme';

const resolveDocumentKey = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};

export default function LegalDocumentScreen() {
  const { document } = useLocalSearchParams<{ document?: string | string[] }>();
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const documentKey = resolveDocumentKey(document);

  if (!documentKey || !isSupportLegalDocumentKey(documentKey)) {
    return (
      <ProfileDetailScreen
        title="Documento legal"
        subtitle="No encontramos el documento que intentas abrir."
      >
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="alert-circle-outline" size={24} color={theme.colors.warning} />
          </View>
          <Text style={styles.emptyTitle}>Documento no disponible</Text>
          <Text style={styles.emptyDescription}>
            Revisa el enlace desde Perfil o vuelve a intentarlo mas tarde.
          </Text>
        </View>
      </ProfileDetailScreen>
    );
  }

  const documentConfig = supportLegalDocuments[documentKey];

  if (!documentConfig.url) {
    return (
      <ProfileDetailScreen
        title={documentConfig.title}
        subtitle={documentConfig.subtitle}
      >
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>{documentConfig.emptyStateTitle}</Text>
          <Text style={styles.emptyDescription}>
            {documentConfig.emptyStateDescription}
          </Text>
        </View>
      </ProfileDetailScreen>
    );
  }

  return (
    <ProfileDetailScreen
      title={documentConfig.title}
      subtitle={documentConfig.subtitle}
      scrollEnabled={false}
      contentStyle={styles.screenContent}
    >
      <View style={styles.webViewCard}>
        <WebView
          source={{ uri: documentConfig.url }}
          style={styles.webView}
          startInLoadingState
          renderLoading={() => <LoadingSpinner text="Cargando documento..." />}
        />
      </View>
    </ProfileDetailScreen>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    screenContent: {
      flex: 1,
      paddingBottom: spacing.lg,
    },
    webViewCard: {
      flex: 1,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...shadows.sm,
    },
    webView: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    emptyCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...shadows.sm,
    },
    emptyIcon: {
      width: 52,
      height: 52,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
    },
    emptyTitle: {
      marginTop: spacing.md,
      fontSize: fontSize.lg,
      fontWeight: '700',
      color: theme.colors.textPrimary,
      textAlign: 'center',
    },
    emptyDescription: {
      marginTop: spacing.sm,
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
