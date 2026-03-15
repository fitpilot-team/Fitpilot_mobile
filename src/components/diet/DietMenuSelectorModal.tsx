import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, LoadingSpinner } from '../common';
import { borderRadius, brandColors, colors, fontSize, spacing } from '../../constants/colors';
import type { ClientDietMenu } from '../../types';

interface DietMenuSelectorModalProps {
  visible: boolean;
  dateLabel: string;
  menus: ClientDietMenu[];
  selectedMenuId: number | null;
  assignedMenuId: number | null;
  isLoading: boolean;
  error?: string | null;
  onClose: () => void;
  onRetry?: () => void;
  onSelect: (menu: ClientDietMenu) => void;
}

export const DietMenuSelectorModal: React.FC<DietMenuSelectorModalProps> = ({
  visible,
  dateLabel,
  menus,
  selectedMenuId,
  assignedMenuId,
  isLoading,
  error = null,
  onClose,
  onRetry,
  onSelect,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    statusBarTranslucent
    onRequestClose={onClose}
  >
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Menus del pool</Text>
            <Text style={styles.subtitle}>{dateLabel}</Text>
            <Text style={styles.supportingText}>
              Esta seleccion solo cambia la vista de esta pantalla.
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-outline" size={24} color={colors.gray[600]} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <LoadingSpinner text="Cargando menus..." />
          </View>
        ) : error && menus.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={36} color={colors.gray[400]} />
            <Text style={styles.emptyTitle}>No pudimos cargar el pool</Text>
            <Text style={styles.emptyText}>{error}</Text>
            {onRetry ? (
              <Button
                title="Reintentar"
                onPress={onRetry}
                variant="primary"
                style={styles.retryButton}
              />
            ) : null}
          </View>
        ) : menus.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={36} color={colors.gray[400]} />
            <Text style={styles.emptyTitle}>Sin menus disponibles</Text>
            <Text style={styles.emptyText}>
              Esta fecha no tiene alternativas visibles en el pool.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {menus.map((menu) => {
              const isSelected = menu.menuId === selectedMenuId;
              const isAssigned = menu.menuId === assignedMenuId;

              return (
                <TouchableOpacity
                  key={menu.id}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => onSelect(menu)}
                  activeOpacity={0.85}
                >
                  <View style={styles.optionHeader}>
                    <View style={styles.optionCopy}>
                      <Text style={styles.optionTitle}>{menu.title}</Text>
                      <Text style={styles.optionSubtitle} numberOfLines={2}>
                        {menu.description || 'Sin descripcion adicional.'}
                      </Text>
                    </View>
                    <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                      <Ionicons
                        name={isSelected ? 'checkmark' : 'ellipse-outline'}
                        size={18}
                        color={isSelected ? colors.white : colors.gray[400]}
                      />
                    </View>
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipText}>{menu.totalMeals} comidas</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipText}>{menu.totalItems} items</Text>
                    </View>
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipText}>{menu.totalRecipes} recetas</Text>
                    </View>
                  </View>

                  <View style={styles.badgeRow}>
                    {isAssigned ? (
                      <View style={[styles.badge, styles.assignedBadge]}>
                        <Text style={[styles.badgeText, styles.assignedBadgeText]}>Asignado</Text>
                      </View>
                    ) : null}
                    {isSelected && !isAssigned ? (
                      <View style={[styles.badge, styles.previewBadge]}>
                        <Text style={[styles.badgeText, styles.previewBadgeText]}>Vista previa</Text>
                      </View>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  container: {
    maxHeight: '82%',
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    color: colors.gray[900],
    fontSize: fontSize.xl,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: spacing.xs,
    color: colors.gray[700],
    fontSize: fontSize.base,
    fontWeight: '600',
  },
  supportingText: {
    marginTop: spacing.xs,
    color: colors.gray[500],
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
  },
  loadingState: {
    minHeight: 220,
    justifyContent: 'center',
  },
  emptyState: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.md,
    color: colors.gray[900],
    fontSize: fontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: spacing.sm,
    color: colors.gray[500],
    fontSize: fontSize.base,
    lineHeight: 22,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    minWidth: 160,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  optionCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  optionCardSelected: {
    borderColor: `${brandColors.sky}80`,
    backgroundColor: `${brandColors.sky}10`,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  optionCopy: {
    flex: 1,
  },
  optionTitle: {
    color: colors.gray[900],
    fontSize: fontSize.base,
    fontWeight: '800',
  },
  optionSubtitle: {
    marginTop: spacing.xs,
    color: colors.gray[500],
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
  },
  checkCircleSelected: {
    backgroundColor: brandColors.navy,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metaChip: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.gray[100],
  },
  metaChipText: {
    color: colors.gray[600],
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  badge: {
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  assignedBadge: {
    backgroundColor: `${brandColors.navy}12`,
  },
  previewBadge: {
    backgroundColor: `${brandColors.sky}16`,
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  assignedBadgeText: {
    color: brandColors.navy,
  },
  previewBadgeText: {
    color: brandColors.sky,
  },
});

export default DietMenuSelectorModal;
