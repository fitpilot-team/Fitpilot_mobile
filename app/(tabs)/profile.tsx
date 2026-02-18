import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, fontSize, borderRadius, shadows, brandColors } from '../../src/constants/colors';

type MenuItemProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
};

const MenuItem = ({ icon, label, value, onPress, showChevron = true, danger = false }: MenuItemProps) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={!onPress}
  >
    <View style={[styles.menuIconContainer, danger && styles.menuIconContainerDanger]}>
      <Ionicons name={icon} size={20} color={danger ? colors.error : colors.gray[600]} />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {value && <Text style={styles.menuValue}>{value}</Text>}
    </View>
    {showChevron && (
      <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { user, logout, uploadAvatar, isLoading } = useAuthStore();

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos permiso para acceder a tu galería para cambiar tu foto de perfil.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        try {
          await uploadAvatar(result.assets[0].uri);
          Alert.alert('Éxito', 'Foto de perfil actualizada correctamente');
        } catch (error) {
          Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error al seleccionar la imagen');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleNotImplemented = (feature: string) => {
    Alert.alert(
      'Próximamente',
      `La función "${feature}" estará disponible próximamente.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={colors.primary[500]} />
            </View>
            <TouchableOpacity
              style={styles.editAvatarButton}
              activeOpacity={0.7}
              onPress={handlePickImage}
              disabled={isLoading}
            >
              <Ionicons name="camera" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.full_name || 'Usuario'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Cliente</Text>
          </View>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <View style={styles.menuSection}>
          <MenuItem
            icon="person-outline"
            label="Información personal"
            onPress={() => handleNotImplemented('Información personal')}
          />
          <MenuItem
            icon="lock-closed-outline"
            label="Cambiar contraseña"
            onPress={() => handleNotImplemented('Cambiar contraseña')}
          />
          <MenuItem
            icon="notifications-outline"
            label="Notificaciones"
            onPress={() => handleNotImplemented('Notificaciones')}
          />
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferencias</Text>
        <View style={styles.menuSection}>
          <MenuItem
            icon="language-outline"
            label="Idioma"
            value="Español"
            onPress={() => handleNotImplemented('Idioma')}
          />
          <MenuItem
            icon="moon-outline"
            label="Tema"
            value="Claro"
            onPress={() => handleNotImplemented('Tema')}
          />
          <MenuItem
            icon="fitness-outline"
            label="Unidades de medida"
            value="Métrico"
            onPress={() => handleNotImplemented('Unidades de medida')}
          />
        </View>

        {/* Support Section */}
        <Text style={styles.sectionTitle}>Soporte</Text>
        <View style={styles.menuSection}>
          <MenuItem
            icon="help-circle-outline"
            label="Ayuda"
            onPress={() => handleNotImplemented('Ayuda')}
          />
          <MenuItem
            icon="chatbubble-outline"
            label="Contactar soporte"
            onPress={() => handleNotImplemented('Contactar soporte')}
          />
          <MenuItem
            icon="document-text-outline"
            label="Términos y condiciones"
            onPress={() => handleNotImplemented('Términos y condiciones')}
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="Política de privacidad"
            onPress={() => handleNotImplemented('Política de privacidad')}
          />
        </View>

        {/* Logout */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="log-out-outline"
            label="Cerrar sesión"
            onPress={handleLogout}
            showChevron={false}
            danger
          />
        </View>

        {/* App Version */}
        <Text style={styles.versionText}>FitPilot v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 60,
  },
  userCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
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
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: colors.white,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.gray[900],
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  roleBadge: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  roleText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.primary[600],
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  menuSection: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconContainerDanger: {
    backgroundColor: `${colors.error}10`,
  },
  menuContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuLabel: {
    fontSize: fontSize.base,
    color: colors.gray[800],
  },
  menuLabelDanger: {
    color: colors.error,
  },
  menuValue: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
  versionText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    textAlign: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});
