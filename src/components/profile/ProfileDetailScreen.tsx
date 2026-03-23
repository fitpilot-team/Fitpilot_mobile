import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  borderRadius,
  fontSize,
  shadows,
  spacing,
} from '../../constants/colors';
import { useAppTheme, useThemedStyles } from '../../theme';

interface ProfileDetailScreenProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  scrollEnabled?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

export const ProfileDetailScreen: React.FC<ProfileDetailScreenProps> = ({
  title,
  subtitle,
  children,
  footer,
  scrollEnabled = true,
  contentStyle,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={theme.colors.icon} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>

        {scrollEnabled ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              footer ? styles.scrollContentWithFooter : null,
              contentStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.staticContent,
              footer ? styles.staticContentWithFooter : null,
              contentStyle,
            ]}
          >
            {children}
          </View>
        )}

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardContainer: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...shadows.sm,
    },
    headerContent: {
      flex: 1,
      marginLeft: spacing.md,
    },
    title: {
      fontSize: fontSize['2xl'],
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      lineHeight: 20,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    scrollContentWithFooter: {
      paddingBottom: spacing.xl,
    },
    staticContent: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    staticContentWithFooter: {
      paddingBottom: spacing.lg,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  });
