import React, { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import { Button } from './Button';

interface ProfileImagePreviewModalProps {
  visible: boolean;
  imageUrl?: string | null;
  title?: string | null;
  onClose: () => void;
  onChangeImage?: (uri: string) => Promise<void> | void;
  isUploading?: boolean;
}

export const ProfileImagePreviewModal: React.FC<ProfileImagePreviewModalProps> = ({
  visible,
  imageUrl,
  title,
  onClose,
  onChangeImage,
  isUploading,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [hasImageError, setHasImageError] = useState(false);
  const resolvedImageUrl = imageUrl ?? undefined;

  const handlePickImage = async () => {
    if (!onChangeImage || isUploading) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await onChangeImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image', err);
    }
  };

  useEffect(() => {
    setHasImageError(false);
  }, [imageUrl, visible]);

  const canRenderImage = Boolean(resolvedImageUrl) && !hasImageError;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.header}>
            <Text numberOfLines={1} style={styles.title}>
              {title || 'Foto de perfil'}
            </Text>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.imageFrame}>
            {canRenderImage ? (
              <Image
                source={{ uri: resolvedImageUrl }}
                style={styles.image}
                resizeMode="contain"
                onError={() => setHasImageError(true)}
              />
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="image-outline" size={30} color={theme.colors.iconMuted} />
                <Text style={styles.emptyText}>No se pudo cargar la imagen.</Text>
              </View>
            )}
          </View>

          {onChangeImage ? (
            <View style={styles.footer}>
              <Button
                variant="secondary"
                title="Cambiar foto de perfil"
                onPress={handlePickImage}
                isLoading={isUploading}
                disabled={isUploading}
                icon={<Ionicons name="camera-outline" size={20} color={theme.colors.textPrimary} />}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xl,
      backgroundColor: theme.isDark ? 'rgba(2, 6, 23, 0.88)' : 'rgba(15, 23, 42, 0.74)',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    card: {
      width: '100%',
      maxWidth: 560,
      maxHeight: '88%',
      alignSelf: 'center',
      borderRadius: borderRadius.xl,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: fontSize.base,
      fontWeight: '700',
      color: theme.colors.textPrimary,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    imageFrame: {
      width: '100%',
      minHeight: 320,
      maxHeight: 680,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.lg,
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    footer: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      paddingTop: spacing.sm,
    },
  });

export default ProfileImagePreviewModal;
