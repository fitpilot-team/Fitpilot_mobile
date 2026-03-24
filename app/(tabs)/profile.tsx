import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Linking } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/store/authStore';
import { useBottomTabBarContentInset, useBottomTabBarScroll } from '../../src/hooks/useBottomTabBarVisibility';
import { useAppTheme, useThemedStyles, getThemePreferenceLabel } from '../../src/theme';
import {
  MEASUREMENT_PREFERENCE_LABELS,
  type MeasurementPreference,
  useMeasurementPreferenceStore,
} from '../../src/store/measurementPreferenceStore';
import { borderRadius, brandColors, fontSize, shadows, spacing } from '../../src/constants/colors';
import { TabScreenWrapper } from '../../src/components/common';

type MenuItemProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
};

const MenuItem = ({ icon, label, value, onPress, showChevron = true, danger = false }: MenuItemProps) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={[styles.menuIconContainer, danger ? styles.menuIconContainerDanger : null]}>
        <Ionicons name={icon} size={20} color={danger ? theme.colors.error : theme.colors.icon} />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, danger ? styles.menuLabelDanger : null]}>{label}</Text>
        {value ? <Text style={styles.menuValue}>{value}</Text> : null}
      </View>
      {showChevron ? (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.iconMuted} />
      ) : null}
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const { user, logout, uploadAvatar, isLoading } = useAuthStore();
  const { preference, theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const tabBarScroll = useBottomTabBarScroll();
  const contentInsetBottom = useBottomTabBarContentInset();
  const measurementPreference = useMeasurementPreferenceStore((state) => state.preference);
  const initializeMeasurementPreference = useMeasurementPreferenceStore((state) => state.initialize);
  const setMeasurementPreference = useMeasurementPreferenceStore((state) => state.setPreference);

  useEffect(() => {
    void initializeMeasurementPreference();
  }, [initializeMeasurementPreference]);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos permiso para acceder a tu galeria para cambiar tu foto de perfil.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        try {
          await uploadAvatar(result.assets[0].uri);
          Alert.alert('Exito', 'Foto de perfil actualizada correctamente');
        } catch {
          Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
        }
      }
    } catch {
      Alert.alert('Error', 'Ocurrio un error al seleccionar la imagen');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesion',
      'Estas seguro que deseas cerrar sesion?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ],
    );
  };

  const handleMeasurementPreferenceSelect = async (
    nextPreference: MeasurementPreference,
  ) => {
    try {
      await setMeasurementPreference(nextPreference);
    } catch {
      Alert.alert('Error', 'No se pudo guardar tu preferencia de unidades.');
    }
  };

  const handleMeasurementPreferencePress = () => {
    Alert.alert(
      'Unidades de medida',
      'Selecciona el sistema que quieres usar para mostrar tus medidas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Estados Unidos (USA)',
          onPress: () => {
            void handleMeasurementPreferenceSelect('us');
          },
        },
        {
          text: 'Mexico',
          onPress: () => {
            void handleMeasurementPreferenceSelect('mx');
          },
        },
      ],
    );
  };

  return (
    <TabScreenWrapper>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: contentInsetBottom }]}
          onScroll={tabBarScroll.onScroll}
          scrollEventThrottle={tabBarScroll.scrollEventThrottle}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                {user?.profilePictureUrl ? (
                  <Image source={{ uri: user.profilePictureUrl }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={40} color={theme.colors.primary} />
                )}
              </View>
              <TouchableOpacity
                style={styles.editAvatarButton}
                activeOpacity={0.7}
                onPress={handlePickImage}
                disabled={isLoading}
              >
                <Ionicons name="camera" size={14} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{user?.displayName || 'Usuario'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Cliente</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Cuenta</Text>
          <View style={styles.menuSection}>
            <MenuItem
              icon="person-outline"
              label="Informacion personal"
              onPress={() => router.push('/profile/personal-info')}
            />
            <MenuItem
              icon="lock-closed-outline"
              label="Cambiar contrasena"
              onPress={() => router.push('/profile/change-password')}
            />
            <MenuItem
              icon="notifications-outline"
              label="Notificaciones"
              onPress={() => router.push('/profile/notifications-settings')}
            />
          </View>

          <Text style={styles.sectionTitle}>Preferencias</Text>
          <View style={styles.menuSection}>
            <MenuItem
              icon="moon-outline"
              label="Tema"
              value={getThemePreferenceLabel(preference)}
              onPress={() => router.push('/profile/theme-settings')}
            />
            <MenuItem
              icon="fitness-outline"
              label="Unidades de medida"
              value={MEASUREMENT_PREFERENCE_LABELS[measurementPreference]}
              onPress={handleMeasurementPreferencePress}
            />
          </View>

          <Text style={styles.sectionTitle}>Soporte</Text>
          <View style={styles.menuSection}>
            <MenuItem
              icon="help-circle-outline"
              label="Ayuda"
              onPress={() => router.push('/profile/help')}
            />
            <MenuItem
              icon="chatbubble-outline"
              label="Contactar soporte"
              onPress={() => router.push('/profile/contact-support')}
            />
            <MenuItem
              icon="document-text-outline"
              label="Términos y condiciones"
              onPress={() => {
                const url = process.env.EXPO_PUBLIC_TERMS_URL || 'https://pro.fitpilot.fit/es/terms';
                if (url) {
                  Linking.openURL(url);
                } else {
                  Alert.alert('No configurado', 'Enlace no disponible.');
                }
              }}
            />
            <MenuItem
              icon="shield-checkmark-outline"
              label="Política de privacidad"
              onPress={() => {
                const url = process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://pro.fitpilot.fit/es/privacy';
                if (url) {
                  Linking.openURL(url);
                } else {
                  Alert.alert('No configurado', 'Enlace no disponible.');
                }
              }}
            />
          </View>

          <View style={styles.menuSection}>
            <MenuItem
              icon="log-out-outline"
              label="Cerrar sesion"
              onPress={handleLogout}
              showChevron={false}
              danger
            />
          </View>

          <Text style={styles.versionText}>FitPilot v1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </TabScreenWrapper>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    title: {
      fontSize: fontSize['2xl'],
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    userCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...shadows.md,
    },
    avatarContainer: {
      position: 'relative',
      marginBottom: spacing.md,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    editAvatarButton: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: brandColors.navy,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.surface,
    },
    userName: {
      fontSize: fontSize.xl,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    userEmail: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      marginTop: spacing.xs,
    },
    roleBadge: {
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
    },
    roleText: {
      fontSize: fontSize.xs,
      fontWeight: '500',
      color: theme.colors.primary,
    },
    sectionTitle: {
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    menuSection: {
      backgroundColor: theme.colors.surface,
      borderRadius: borderRadius.lg,
      marginBottom: spacing.lg,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      ...shadows.sm,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    menuIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
    },
    menuIconContainerDanger: {
      backgroundColor: `${theme.colors.error}18`,
    },
    menuContent: {
      flex: 1,
      marginLeft: spacing.md,
    },
    menuLabel: {
      fontSize: fontSize.base,
      color: theme.colors.textPrimary,
      fontWeight: '500',
    },
    menuLabelDanger: {
      color: theme.colors.error,
    },
    menuValue: {
      marginTop: 2,
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
    },
    versionText: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
  });
