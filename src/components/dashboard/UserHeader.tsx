import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize } from '../../constants/colors';
import { Logo, ProfileImagePreviewModal } from '../common';
import type { DashboardProgramSummary, User } from '../../types';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import { useAuthStore } from '../../store/authStore';

interface UserHeaderProps {
  user: User;
  program?: DashboardProgramSummary | null;
  onMenuPress?: () => void;
  contentWidth?: number;
  horizontalPadding?: number;
}

const objectiveLabels: Record<string, string> = {
  hypertrophy: 'aumentar masa muscular',
  strength: 'fuerza máxima',
  endurance: 'resistencia',
  fat_loss: 'pérdida de grasa',
  general_fitness: 'fitness general',
  athletic_performance: 'rendimiento atlético',
};

export const UserHeader: React.FC<UserHeaderProps> = ({
  user,
  program,
  onMenuPress,
  contentWidth,
  horizontalPadding = spacing.md,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [hasAvatarError, setHasAvatarError] = useState(false);
  const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const uploadAvatar = useAuthStore((s) => s.uploadAvatar);

  const initials = user.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleAvatarChange = async (uri: string) => {
    setIsUploading(true);
    try {
      await uploadAvatar(uri);
    } catch {
      // Errors are handled by the store
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    setHasAvatarError(false);
    setIsImagePreviewVisible(false);
  }, [user.profilePictureUrl]);

  const objectiveLabel = program?.objective
    ? objectiveLabels[program.objective] || program.objective
    : null;
  const avatarImageUrl = user.profilePictureUrl ?? undefined;
  const canPreviewAvatar = Boolean(avatarImageUrl && !hasAvatarError);
  const avatarContent = (
    <View style={styles.avatar}>
      {canPreviewAvatar ? (
        <Image
          source={{ uri: avatarImageUrl }}
          style={styles.avatarImage}
          onError={() => setHasAvatarError(true)}
        />
      ) : (
        <Text style={styles.avatarText}>{initials}</Text>
      )}
    </View>
  );

  return (
    <>
      <View
        style={[
          styles.container,
          { paddingHorizontal: horizontalPadding },
          contentWidth && contentWidth >= 720 ? styles.containerTablet : null,
        ]}
      >
        <View style={styles.userInfo}>
          {canPreviewAvatar ? (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => setIsImagePreviewVisible(true)}
              style={styles.avatarPressable}
            >
              {avatarContent}
            </TouchableOpacity>
          ) : avatarContent}
          <View style={styles.textContainer}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.displayName}
            </Text>
            {objectiveLabel ? (
              <Text style={styles.goal} numberOfLines={1}>
                meta: {objectiveLabel}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.rightSection}>
          <View style={styles.logoContainer}>
            <Logo size="sm" variant="mark" showText={false} />
          </View>
          {onMenuPress ? (
            <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
              <Ionicons
                name="ellipsis-vertical"
                size={20}
                color={theme.colors.icon}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ProfileImagePreviewModal
        visible={isImagePreviewVisible && canPreviewAvatar}
        imageUrl={avatarImageUrl}
        title={user.displayName}
        onClose={() => setIsImagePreviewVisible(false)}
        onChangeImage={handleAvatarChange}
        isUploading={isUploading}
      />
    </>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
    },
    containerTablet: {
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
      overflow: 'hidden',
    },
    avatarPressable: {
      borderRadius: 25,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
    },
    avatarText: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    textContainer: {
      flex: 1,
      marginRight: spacing.sm,
    },
    userName: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: theme.colors.textPrimary,
    },
    goal: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    logoContainer: {
      opacity: 0.8,
    },
    menuButton: {
      padding: spacing.sm,
    },
  });

export default UserHeader;
