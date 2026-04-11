import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize } from '../../constants/colors';
import { Logo } from '../common/Logo';
import type { DashboardProgramSummary, User } from '../../types';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';

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
  const initials = user.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const objectiveLabel = program?.objective
    ? objectiveLabels[program.objective] || program.objective
    : null;

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: horizontalPadding },
        contentWidth && contentWidth >= 720 ? styles.containerTablet : null,
      ]}
    >
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          {user.profilePictureUrl ? (
            <Image source={{ uri: user.profilePictureUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initials}</Text>
          )}
        </View>
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
            <Ionicons name="ellipsis-vertical" size={20} color={theme.colors.icon} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
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
