import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize } from '../../constants/colors';
import type { ExercisePhase } from '../../types';

interface PhaseSeparatorProps {
  phase: ExercisePhase;
  isCollapsed?: boolean;
  isCompleted?: boolean;
  onToggle?: () => void;
}

const phaseConfig: Record<ExercisePhase, { emoji: string; label: string; color: string }> = {
  warmup: { emoji: '🟢', label: 'CALENTAMIENTO', color: '#22c55e' },
  main: { emoji: '🔵', label: 'ENTRENAMIENTO', color: '#3b82f6' },
  cooldown: { emoji: '🟡', label: 'ENFRIAMIENTO', color: '#eab308' },
};

export const PhaseSeparator: React.FC<PhaseSeparatorProps> = ({
  phase,
  isCollapsed = false,
  isCompleted = false,
  onToggle,
}) => {
  const config = phaseConfig[phase];

  const content = (
    <>
      <View style={[styles.line, { backgroundColor: config.color }]} />
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: config.color }]}>
          {config.emoji} {config.label}
        </Text>
        {isCompleted && (
          <Ionicons
            name="checkmark-circle"
            size={18}
            color={config.color}
            style={styles.checkIcon}
          />
        )}
        {onToggle && (
          <Ionicons
            name={isCollapsed ? 'chevron-down' : 'chevron-up'}
            size={18}
            color={config.color}
            style={styles.chevronIcon}
          />
        )}
      </View>
      <View style={[styles.line, { backgroundColor: config.color }]} />
    </>
  );

  if (onToggle) {
    return (
      <TouchableOpacity style={styles.container} onPress={onToggle} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.container}>{content}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  line: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    letterSpacing: 1,
  },
  checkIcon: {
    marginLeft: spacing.xs,
  },
  chevronIcon: {
    marginLeft: spacing.xs,
  },
});
