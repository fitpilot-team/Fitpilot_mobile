import React from 'react';
import {
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type {
  HistoricalWorkoutAnalyticsScopeKind,
  WorkoutAnalyticsContextItem,
  WorkoutAnalyticsContextPickerSection,
} from '../../utils/workoutAnalyticsContext';
import { formatLocalDate } from '../../utils/date';

interface WorkoutAnalyticsContextPickerModalProps {
  visible: boolean;
  scopeKind: HistoricalWorkoutAnalyticsScopeKind;
  sections: WorkoutAnalyticsContextPickerSection[];
  selectedId: string | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onRetry?: () => void;
  onSelect: (item: WorkoutAnalyticsContextItem) => void;
}

const getScopeTitle = (scopeKind: HistoricalWorkoutAnalyticsScopeKind) => {
  if (scopeKind === 'program') {
    return 'Seleccionar programa';
  }

  if (scopeKind === 'mesocycle') {
    return 'Seleccionar bloque';
  }

  return 'Seleccionar microciclo';
};

const formatDateRange = (startDate?: string | null, endDate?: string | null) => {
  if (!startDate && !endDate) {
    return 'Sin rango disponible';
  }

  if (startDate && endDate) {
    return `${formatLocalDate(startDate, { day: 'numeric', month: 'short' })} - ${formatLocalDate(endDate, {
      day: 'numeric',
      month: 'short',
    })}`;
  }

  return formatLocalDate(startDate ?? endDate ?? '', { day: 'numeric', month: 'short' });
};

export const WorkoutAnalyticsContextPickerModal: React.FC<WorkoutAnalyticsContextPickerModalProps> = ({
  visible,
  scopeKind,
  sections,
  selectedId,
  isLoading = false,
  errorMessage,
  onClose,
  onRetry,
  onSelect,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{getScopeTitle(scopeKind)}</Text>
              <Text style={styles.subtitle}>
                Salta a cualquier contexto historico visible del cliente.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={theme.colors.icon} />
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
              {onRetry ? (
                <TouchableOpacity style={styles.retryButton} activeOpacity={0.86} onPress={onRetry}>
                  <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>
                  {isLoading ? 'Cargando historial...' : 'No hay contextos historicos disponibles.'}
                </Text>
              </View>
            }
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{section.title}</Text>
              </View>
            )}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedId;

              return (
                <TouchableOpacity
                  style={[styles.itemRow, isSelected ? styles.itemRowSelected : null]}
                  activeOpacity={0.86}
                  onPress={() => onSelect(item)}
                >
                  <View style={styles.itemCopy}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                    <Text style={styles.itemDate}>{formatDateRange(item.startDate, item.endDate)}</Text>
                  </View>

                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={theme.colors.iconMuted} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.overlay,
      justifyContent: 'flex-end',
    },
    card: {
      maxHeight: '86%',
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.lg,
      paddingBottom: spacing.xl,
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
      fontSize: fontSize.xl,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    subtitle: {
      marginTop: spacing.xs,
      fontSize: fontSize.sm,
      lineHeight: 20,
      color: theme.colors.textMuted,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceAlt,
    },
    errorBanner: {
      marginTop: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.isDark ? 'rgba(251, 191, 36, 0.12)' : '#fef3c7',
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(251, 191, 36, 0.24)' : '#fde68a',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    errorBannerText: {
      flex: 1,
      fontSize: fontSize.sm,
      color: theme.colors.textSecondary,
    },
    retryButton: {
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    retryButtonText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    list: {
      marginTop: spacing.md,
    },
    listContent: {
      gap: spacing.md,
      paddingBottom: spacing.md,
    },
    sectionHeader: {
      paddingBottom: spacing.xs,
      paddingTop: spacing.sm,
    },
    sectionHeaderText: {
      fontSize: fontSize.xs,
      fontWeight: '800',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    itemRowSelected: {
      borderColor: `${theme.colors.primary}30`,
      backgroundColor: `${theme.colors.primary}12`,
    },
    itemCopy: {
      flex: 1,
      gap: 2,
    },
    itemTitle: {
      fontSize: fontSize.base,
      fontWeight: '800',
      color: theme.colors.textPrimary,
    },
    itemSubtitle: {
      fontSize: fontSize.sm,
      color: theme.colors.textSecondary,
    },
    itemDate: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    emptyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
    },
    emptyText: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
  });

export default WorkoutAnalyticsContextPickerModal;
