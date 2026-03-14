import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, brandColors, spacing, fontSize, borderRadius } from '../../constants/colors';
import { Logo } from '../common/Logo';
import type { User, Macrocycle } from '../../types';

interface UserHeaderProps {
  user: User;
  macrocycle?: Macrocycle | null;
  onMenuPress?: () => void;
  contentWidth?: number;
}

// Mapeo de objetivos a textos en español
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
  macrocycle,
  onMenuPress,
  contentWidth,
}) => {
  // Get initials for avatar
  const initials = user.displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Get readable objective label
  const objectiveLabel = macrocycle?.objective
    ? objectiveLabels[macrocycle.objective] || macrocycle.objective
    : null;

  return (
    <View style={[styles.container, contentWidth && contentWidth >= 720 ? styles.containerTablet : null]}>
      {/* User Info - Avatar + Name + Goal */}
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
          {objectiveLabel && (
            <Text style={styles.goal} numberOfLines={1}>
              meta: {objectiveLabel}
            </Text>
          )}
        </View>
      </View>

      {/* Right side - Logo + Menu */}
      <View style={styles.rightSection}>
        <View style={styles.logoContainer}>
          <Logo size="sm" showText={false} />
        </View>
        {onMenuPress && (
          <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.gray[600]} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
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
    backgroundColor: `${brandColors.navy}15`,
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
    color: brandColors.navy,
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  userName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  goal: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
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
