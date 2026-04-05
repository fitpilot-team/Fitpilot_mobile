import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { spacing, fontSize, borderRadius, shadows } from '../../constants/colors';
import { categoryColors, categoryLabels, type ScienceTip } from '../../constants/scienceTips';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import { getContextualTips, type TipContext } from '../../utils/contextualTips';

interface ScienceTipsProps {
  context?: TipContext;
  tipsCount?: number;
  autoScroll?: boolean;
  autoScrollInterval?: number;
  contentWidth?: number;
  horizontalPadding?: number;
  onTipPress?: (tip: ScienceTip) => void;
}

export const ScienceTips: React.FC<ScienceTipsProps> = ({
  context,
  tipsCount = 5,
  autoScroll = false,
  autoScrollInterval = 5000,
  contentWidth = 390,
  horizontalPadding = spacing.md,
  onTipPress,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const tips = useMemo(() => {
    if (!context) {
      return getContextualTips(
        {
          nextSession: null,
          microcycleProgress: null,
          muscleVolume: null,
          allCompleted: false,
          workoutPosition: null,
          workoutTotal: null,
          currentHour: new Date().getHours(),
        },
        tipsCount,
      );
    }

    return getContextualTips(context, tipsCount);
  }, [context, tipsCount]);

  const cardMetrics = useMemo(() => {
    const availableWidth = Math.max(320, contentWidth - horizontalPadding * 2);
    const cardWidth = Math.min(availableWidth - spacing.md * 2, 420);
    const snapInterval = cardWidth + spacing.sm * 2;

    return { cardWidth, snapInterval };
  }, [contentWidth, horizontalPadding]);

  useEffect(() => {
    if (!autoScroll || tips.length === 0) {
      return;
    }

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
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <View style={styles.headerLeft}>
          <Ionicons name="bulb" size={20} color={theme.colors.primary} />
          <Text style={styles.title}>Recomendaciones</Text>
        </View>
        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>Ver todos</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        snapToInterval={cardMetrics.snapInterval}
        decelerationRate="fast"
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {tips.map((tip, index) => (
          <TipCard
            key={tip.id}
            tip={tip}
            index={index}
            cardWidth={cardMetrics.cardWidth}
            onPress={onTipPress ? () => onTipPress(tip) : undefined}
          />
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {tips.map((_, index) => (
          <View
            key={index}
            style={[styles.paginationDot, index === activeIndex ? styles.paginationDotActive : null]}
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
  onPress?: () => void;
}

const TipCard: React.FC<TipCardProps> = ({ tip, index, cardWidth, onPress }) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const categoryColor = categoryColors[tip.category];

  const cardContent = (
    <>
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
              {categoryLabels[tip.category] || tip.category}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {tip.title}
        </Text>

        <Text style={styles.cardDescription} numberOfLines={3}>
          {tip.content}
        </Text>

        {tip.source ? (
          <View style={styles.sourceContainer}>
            <Ionicons name="document-text-outline" size={12} color={theme.colors.iconMuted} />
            <Text style={styles.sourceText} numberOfLines={1}>
              {tip.source}
            </Text>
          </View>
        ) : null}
      </View>
    </>
  );

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 100).duration(400)}
      style={[styles.cardWrapper, { width: cardWidth }]}
    >
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [
            styles.card,
            shadows.md,
            pressed ? styles.cardPressed : null,
          ]}
        >
          {cardContent}
        </Pressable>
      ) : (
        <View style={[styles.card, shadows.md]}>{cardContent}</View>
      )}
    </Animated.View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginVertical: spacing.md,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
      color: theme.colors.textPrimary,
    },
    seeAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    seeAllText: {
      fontSize: fontSize.sm,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    scrollContent: {},
    cardWrapper: {
      marginHorizontal: spacing.sm,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.xl,
      overflow: 'hidden',
      minHeight: 160,
    },
    cardPressed: {
      opacity: 0.92,
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
      color: theme.colors.textPrimary,
      marginBottom: spacing.xs,
    },
    cardDescription: {
      fontSize: fontSize.sm,
      color: theme.colors.textSecondary,
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
      borderTopColor: theme.colors.border,
    },
    sourceText: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
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
      backgroundColor: theme.colors.borderStrong,
    },
    paginationDotActive: {
      width: 20,
      backgroundColor: theme.colors.primary,
    },
  });

export default ScienceTips;
