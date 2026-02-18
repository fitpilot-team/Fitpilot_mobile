import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { colors, brandColors, spacing, fontSize, borderRadius, shadows } from '../../constants/colors';
import { scienceTips, categoryColors, type ScienceTip } from '../../constants/scienceTips';

interface ScienceTipsProps {
  tips?: ScienceTip[];
  autoScroll?: boolean;
  autoScrollInterval?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2 - spacing.md;
const CARD_MARGIN = spacing.sm;

export const ScienceTips: React.FC<ScienceTipsProps> = ({
  tips = scienceTips.slice(0, 5), // Mostrar 5 tips por defecto
  autoScroll = false,
  autoScrollInterval = 5000,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-scroll opcional
  useEffect(() => {
    if (!autoScroll) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % tips.length;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * (CARD_WIDTH + CARD_MARGIN * 2),
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [autoScroll, activeIndex, tips.length, autoScrollInterval]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (CARD_WIDTH + CARD_MARGIN * 2));
    if (index !== activeIndex && index >= 0 && index < tips.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb" size={20} color={brandColors.sky} />
          <Text style={styles.title}>Tips Científicos</Text>
        </View>
        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>Ver todos</Text>
          <Ionicons name="chevron-forward" size={16} color={brandColors.sky} />
        </TouchableOpacity>
      </View>

      {/* Carrusel horizontal */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {tips.map((tip, index) => (
          <TipCard key={tip.id} tip={tip} index={index} />
        ))}
      </ScrollView>

      {/* Indicadores de página */}
      <View style={styles.pagination}>
        {tips.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === activeIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

// Componente de tarjeta individual
interface TipCardProps {
  tip: ScienceTip;
  index: number;
}

const TipCard: React.FC<TipCardProps> = ({ tip, index }) => {
  const categoryColor = categoryColors[tip.category];

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(400)}
      style={styles.cardWrapper}
    >
      <View style={[styles.card, shadows.md]}>
        {/* Fondo con gradiente sutil */}
        <LinearGradient
          colors={[`${categoryColor}15`, `${categoryColor}05`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Contenido */}
        <View style={styles.cardContent}>
          {/* Header de la tarjeta */}
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}20` }]}>
              <Ionicons
                name={tip.icon as any}
                size={20}
                color={categoryColor}
              />
            </View>
            <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>
                {getCategoryLabel(tip.category)}
              </Text>
            </View>
          </View>

          {/* Título */}
          <Text style={styles.cardTitle} numberOfLines={1}>
            {tip.title}
          </Text>

          {/* Contenido */}
          <Text style={styles.cardDescription} numberOfLines={3}>
            {tip.content}
          </Text>

          {/* Fuente (si existe) */}
          {tip.source && (
            <View style={styles.sourceContainer}>
              <Ionicons name="document-text-outline" size={12} color={colors.gray[400]} />
              <Text style={styles.sourceText} numberOfLines={1}>
                {tip.source}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

// Helper para obtener label de categoría
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    recovery: 'Recuperación',
    nutrition: 'Nutrición',
    technique: 'Técnica',
    motivation: 'Motivación',
    science: 'Ciencia',
  };
  return labels[category] || category;
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  seeAllText: {
    fontSize: fontSize.sm,
    color: brandColors.sky,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    minHeight: 160,
  },
  cardContent: {
    padding: spacing.md,
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: spacing.xs,
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
    flex: 1,
  },
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  sourceText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    fontStyle: 'italic',
    flex: 1,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray[300],
  },
  paginationDotActive: {
    width: 20,
    backgroundColor: brandColors.sky,
  },
});

export default ScienceTips;
