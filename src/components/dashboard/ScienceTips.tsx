import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { colors, brandColors, spacing, fontSize, borderRadius, shadows } from '../../constants/colors';
import { scienceTips, categoryColors, type ScienceTip } from '../../constants/scienceTips';

interface ScienceTipsProps {
  tips?: ScienceTip[];
  autoScroll?: boolean;
  autoScrollInterval?: number;
  contentWidth?: number;
}

export const ScienceTips: React.FC<ScienceTipsProps> = ({
  tips = scienceTips.slice(0, 5),
  autoScroll = false,
  autoScrollInterval = 5000,
  contentWidth = 390,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const cardMetrics = useMemo(() => {
    const availableWidth = Math.max(320, contentWidth - spacing.lg * 2);
    const cardWidth = Math.min(availableWidth - spacing.md * 2, 420);
    const snapInterval = cardWidth + spacing.sm * 2;

    return { cardWidth, snapInterval };
  }, [contentWidth]);

  useEffect(() => {
    if (!autoScroll || tips.length === 0) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % tips.length;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * cardMetrics.snapInterval,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [activeIndex, autoScroll, autoScrollInterval, cardMetrics.snapInterval, tips.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / cardMetrics.snapInterval);
    if (index !== activeIndex && index >= 0 && index < tips.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb" size={20} color={brandColors.sky} />
          <Text style={styles.title}>Tips Cientificos</Text>
        </View>
        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>Ver todos</Text>
          <Ionicons name="chevron-forward" size={16} color={brandColors.sky} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        snapToInterval={cardMetrics.snapInterval}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {tips.map((tip, index) => (
          <TipCard key={tip.id} tip={tip} index={index} cardWidth={cardMetrics.cardWidth} />
        ))}
      </ScrollView>

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

interface TipCardProps {
  tip: ScienceTip;
  index: number;
  cardWidth: number;
}

const TipCard: React.FC<TipCardProps> = ({ tip, index, cardWidth }) => {
  const categoryColor = categoryColors[tip.category];

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(400)}
      style={[styles.cardWrapper, { width: cardWidth }]}
    >
      <View style={[styles.card, shadows.md]}>
        <LinearGradient
          colors={[`${categoryColor}15`, `${categoryColor}05`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${categoryColor}20` }]}>
              <Ionicons
                name={tip.icon as React.ComponentProps<typeof Ionicons>['name']}
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

          <Text style={styles.cardTitle} numberOfLines={1}>
            {tip.title}
          </Text>

          <Text style={styles.cardDescription} numberOfLines={3}>
            {tip.content}
          </Text>

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

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    recovery: 'Recuperacion',
    nutrition: 'Nutricion',
    technique: 'Tecnica',
    motivation: 'Motivacion',
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
    marginHorizontal: spacing.sm,
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
    gap: spacing.sm,
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
