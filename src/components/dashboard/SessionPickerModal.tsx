import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, brandColors, colors, fontSize, spacing } from '../../constants/colors';
import type { MicrocycleSessionProgress } from '../../types';

interface SessionPickerModalProps {
  visible: boolean;
  title: string;
  subtitle?: string | null;
  sessions: MicrocycleSessionProgress[];
  onClose: () => void;
  onSelectSession: (session: MicrocycleSessionProgress) => void;
}

const getStatusLabel = (session: MicrocycleSessionProgress) => {
  if (session.actual_status === 'completed') {
    return 'Completado';
  }
  if (session.actual_status === 'in_progress') {
    return 'En progreso';
  }
  if (session.actual_status === 'abandoned') {
    return 'Abandonado';
  }
  if (session.planned_status === 'pending') {
    return 'Pendiente';
  }
  return 'Parcial';
};

export const SessionPickerModal: React.FC<SessionPickerModalProps> = ({
  visible,
  title,
  subtitle,
  sessions,
  onClose,
  onSelectSession,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={colors.gray[700]} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {sessions.map((session) => (
            <TouchableOpacity
              key={`${session.training_day_id}-${session.workout_log_id ?? 'new'}-${session.session_index}`}
              style={styles.sessionRow}
              activeOpacity={0.85}
              onPress={() => onSelectSession(session)}
            >
              <View style={styles.sessionMeta}>
                <View style={styles.sessionIndexPill}>
                  <Text style={styles.sessionIndexText}>
                    Sesión {session.session_index}
                  </Text>
                </View>
                {session.session_label ? (
                  <Text style={styles.sessionLabel}>{session.session_label}</Text>
                ) : null}
              </View>

              <Text style={styles.sessionName}>{session.name}</Text>
              {session.focus ? <Text style={styles.sessionFocus}>{session.focus}</Text> : null}

              <View style={styles.footerRow}>
                <Text style={styles.statusText}>{getStatusLabel(session)}</Text>
                <Text style={styles.percentageText}>
                  {Math.round(session.completion_percentage)}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.32)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    maxHeight: '78%',
    borderRadius: borderRadius.xl,
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.gray[900],
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
  },
  list: {
    marginTop: spacing.md,
  },
  listContent: {
    gap: spacing.sm,
  },
  sessionRow: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionIndexPill: {
    borderRadius: borderRadius.full,
    backgroundColor: `${brandColors.sky}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  sessionIndexText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: brandColors.navy,
  },
  sessionLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    fontWeight: '600',
  },
  sessionName: {
    marginTop: spacing.sm,
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.gray[900],
  },
  sessionFocus: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  footerRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.gray[600],
  },
  percentageText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: brandColors.navy,
  },
});

export default SessionPickerModal;
