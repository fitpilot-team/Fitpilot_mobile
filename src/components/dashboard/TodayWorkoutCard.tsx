import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, fontSize, borderRadius, shadows } from '../../constants/colors';
import { WorkoutCardSkeleton } from '../common/Skeleton';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { ProgramTimelineCardState } from '../../utils/programTimeline';

const workoutImage = require('../../../assets/mock-image-workout.jpg');

const CARD_HEIGHT = 240;
const CORNER_RADIUS = borderRadius.xl;

const getChamferHorizontal = (cardWidth: number) => Math.max(84, Math.min(110, cardWidth * 0.16));
const getHorizontalSegment = (cardWidth: number) => Math.max(56, Math.min(88, cardWidth * 0.12));
const CHAMFER_VERTICAL = 45;
const CHAMFER_RADIUS = 12;

const getCardShapePath = (
  w: number,
  h: number,
  r: number,
  chamferH: number,
  chamferV: number,
  hSegment: number,
  cr: number,
) => {
  const x2 = w - chamferH;
  const x3 = w - hSegment;
  const y3 = chamferV;

  const dx = x3 - x2;
  const dy = y3;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;

  const diagStartX = x2 + cr * ux;
  const diagStartY = cr * uy;
  const diagEndX = x3 - cr * ux;
  const diagEndY = y3 - cr * uy;

  return `
    M ${r},0
    L ${x2 - cr},0
    Q ${x2},0 ${diagStartX},${diagStartY}
    L ${diagEndX},${diagEndY}
    Q ${x3},${y3} ${x3 + cr},${y3}
    L ${w - cr},${y3}
    Q ${w},${y3} ${w},${y3 + cr}
    L ${w},${h - r}
    Q ${w},${h} ${w - r},${h}
    L ${r},${h}
    Q 0,${h} 0,${h - r}
    L 0,${r}
    Q 0,0 ${r},0
    Z
  `;
};

const CardMask: React.FC<{ cardWidth: number; cardHeight: number }> = ({ cardWidth, cardHeight }) => {
  const chamferHorizontal = getChamferHorizontal(cardWidth);
  const horizontalSegment = getHorizontalSegment(cardWidth);

  return (
    <Svg width={cardWidth} height={cardHeight}>
      <Path
        d={getCardShapePath(
          cardWidth,
          cardHeight,
          CORNER_RADIUS,
          chamferHorizontal,
          CHAMFER_VERTICAL,
          horizontalSegment,
          CHAMFER_RADIUS,
        )}
        fill="black"
      />
    </Svg>
  );
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TodayWorkoutCardProps {
  cardState: ProgramTimelineCardState;
  onStartPress: () => void;
  onOpenSessions?: () => void;
  isLoading?: boolean;
  contentWidth?: number;
  horizontalPadding?: number;
}

const getEmptyIconName = (
  reason: 'no-program' | 'rest' | 'no-scheduled' | 'no-pending' | 'no-executed',
) => {
  if (reason === 'rest') {
    return 'leaf-outline';
  }

  if (reason === 'no-pending') {
    return 'checkmark-done-circle-outline';
  }

  if (reason === 'no-executed') {
    return 'time-outline';
  }

  return 'calendar-outline';
};

export const TodayWorkoutCard: React.FC<TodayWorkoutCardProps> = ({
  cardState,
  onStartPress,
  onOpenSessions,
  isLoading,
  contentWidth,
  horizontalPadding = spacing.md,
}) => {
  const scale = useSharedValue(1);
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const availableWidth = Math.max(320, (contentWidth ?? 0) - horizontalPadding * 2);
  const cardWidth = availableWidth;
  const chamferHorizontal = getChamferHorizontal(cardWidth);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  if (isLoading) {
    return (
      <View style={[styles.skeletonWrapper, { marginHorizontal: horizontalPadding }]}>
        <WorkoutCardSkeleton />
      </View>
    );
  }

  if (cardState.kind === 'empty') {
    return (
      <View style={[styles.emptyContainer, { marginHorizontal: horizontalPadding }]}>
        <Ionicons name={getEmptyIconName(cardState.reason)} size={48} color={colors.gray[300]} />
        {cardState.dateLabel ? (
          <View style={styles.emptyDatePill}>
            <Text style={styles.emptyDateText}>{cardState.dateLabel}</Text>
          </View>
        ) : null}
        <Text style={styles.emptyTitle}>{cardState.title}</Text>
        <Text style={styles.emptySubtitle}>{cardState.subtitle}</Text>
      </View>
    );
  }

  const { trainingDay, session } = cardState;
  const totalSets = trainingDay.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
  const estimatedMinutes = Math.round(totalSets * 3);
  const hours = Math.floor(estimatedMinutes / 60);
  const minutes = estimatedMinutes % 60;
  const durationText = hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
  const sessionCaption = `Sesion ${trainingDay.session_index}`;
  const isOverdueRecommendation = cardState.recommendation === 'overdue';

  return (
    <AnimatedPressable
      style={[styles.container, { marginHorizontal: horizontalPadding }, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onStartPress}
    >
      <MaskedView
        style={[styles.cardContainer, { width: cardWidth, height: CARD_HEIGHT }]}
        maskElement={<CardMask cardWidth={cardWidth} cardHeight={CARD_HEIGHT} />}
      >
        <ImageBackground
          source={workoutImage}
          style={[styles.maskedImage, { width: cardWidth, height: CARD_HEIGHT }]}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.56)']}
            style={styles.overlay}
          />

          <View style={styles.glassBorder} pointerEvents="none" />

          <View style={styles.content}>
            <View style={styles.headerMeta}>
              <View style={styles.dayBadge}>
                <BlurView intensity={50} tint={theme.colors.blurTint} style={styles.dayBadgeBlur}>
                  <Text style={styles.dayBadgeText}>{cardState.dateLabel}</Text>
                </BlurView>
              </View>
            </View>

            <View style={[styles.titleArea, { maxWidth: cardWidth - chamferHorizontal - spacing.lg }]}>
              {isOverdueRecommendation ? (
                <View style={styles.overduePill}>
                  <Text style={styles.overduePillText}>Entrenamiento atrasado</Text>
                </View>
              ) : null}
              <View style={styles.sessionPill}>
                <Text style={styles.sessionPillText}>{sessionCaption}</Text>
              </View>
              <Text style={styles.title}>{trainingDay.name}</Text>
              {trainingDay.focus ? <Text style={styles.focusText}>{trainingDay.focus}</Text> : null}
              {isOverdueRecommendation ? (
                <Text style={styles.recommendationText}>
                  Termina esta sesion antes de continuar con la siguiente.
                </Text>
              ) : null}
              <Text style={styles.complianceText}>
                Cumplimiento actual: {Math.round(session.completion_percentage)}%
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.startButton}
                onPress={onStartPress}
                activeOpacity={0.9}
              >
                <BlurView intensity={80} tint={theme.colors.blurTint} style={styles.startButtonBlur}>
                  <Text style={styles.startButtonText}>{cardState.actionLabel}</Text>
                  <View style={styles.arrowCircle}>
                    <Ionicons name="arrow-forward" size={18} color={theme.colors.primary} />
                  </View>
                </BlurView>
              </TouchableOpacity>

              {cardState.hasMultipleSessions ? (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onOpenSessions}
                  activeOpacity={0.86}
                >
                  <BlurView intensity={50} tint={theme.colors.blurTint} style={styles.secondaryButtonBlur}>
                    <Ionicons name="layers-outline" size={16} color={colors.white} />
                    <Text style={styles.secondaryButtonText}>ver sesiones</Text>
                  </BlurView>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </ImageBackground>
      </MaskedView>

      <View style={styles.durationContainer}>
        <Text style={styles.durationLabel}>Duracion:</Text>
        <Text style={styles.durationValue}>{durationText}</Text>
      </View>
    </AnimatedPressable>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginVertical: spacing.md,
      position: 'relative',
      height: CARD_HEIGHT,
    },
    skeletonWrapper: {
      marginVertical: spacing.md,
    },
    durationContainer: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.sm,
      zIndex: 20,
      alignItems: 'flex-end',
    },
    durationLabel: {
      fontSize: fontSize.xs,
      color: theme.colors.textMuted,
      fontWeight: '500',
    },
    durationValue: {
      fontSize: fontSize.sm,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      marginTop: 2,
    },
    cardContainer: {
      overflow: 'hidden',
      borderRadius: CORNER_RADIUS,
      ...shadows.lg,
    },
    maskedImage: {
      justifyContent: 'center',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: CORNER_RADIUS,
    },
    glassBorder: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: CORNER_RADIUS,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    content: {
      flex: 1,
      padding: spacing.lg,
      paddingTop: spacing.xl,
      justifyContent: 'space-between',
    },
    headerMeta: {
      alignItems: 'flex-start',
    },
    dayBadge: {
      alignSelf: 'flex-start',
      borderRadius: borderRadius.full,
      overflow: 'hidden',
    },
    dayBadgeBlur: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    dayBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: '600',
      color: colors.white,
    },
    titleArea: {
      marginTop: spacing.lg,
    },
    sessionPill: {
      alignSelf: 'flex-start',
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.24)',
    },
    sessionPillText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: colors.white,
      letterSpacing: 0.3,
    },
    overduePill: {
      alignSelf: 'flex-start',
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: borderRadius.full,
      backgroundColor: 'rgba(245, 158, 11, 0.18)',
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.4)',
    },
    overduePillText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: colors.white,
      letterSpacing: 0.3,
    },
    title: {
      fontSize: fontSize['2xl'],
      fontWeight: 'bold',
      color: colors.white,
      lineHeight: 32,
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },
    focusText: {
      fontSize: fontSize.sm,
      color: 'rgba(255,255,255,0.8)',
      marginTop: spacing.xs,
    },
    recommendationText: {
      marginTop: spacing.sm,
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.92)',
    },
    complianceText: {
      marginTop: spacing.sm,
      fontSize: fontSize.sm,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.9)',
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    startButton: {
      alignSelf: 'flex-start',
      borderRadius: borderRadius.full,
      overflow: 'hidden',
    },
    startButtonBlur: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: spacing.xl,
      paddingRight: spacing.sm,
      paddingVertical: spacing.sm,
      backgroundColor: theme.isDark ? 'rgba(8,17,31,0.84)' : 'rgba(255,255,255,0.9)',
    },
    startButtonText: {
      fontSize: fontSize.base,
      fontWeight: '500',
      color: theme.colors.textPrimary,
      marginRight: spacing.md,
      textTransform: 'lowercase',
    },
    arrowCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryButton: {
      alignSelf: 'flex-start',
      borderRadius: borderRadius.full,
      overflow: 'hidden',
    },
    secondaryButtonBlur: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.18)',
    },
    secondaryButtonText: {
      fontSize: fontSize.sm,
      fontWeight: '700',
      color: colors.white,
      textTransform: 'lowercase',
    },
    emptyContainer: {
      marginVertical: spacing.md,
      padding: spacing.xl,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: borderRadius.xl,
      alignItems: 'center',
      ...shadows.sm,
    },
    emptyDatePill: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.surfaceAlt,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyDateText: {
      fontSize: fontSize.xs,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    emptyTitle: {
      fontSize: fontSize.lg,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginTop: spacing.md,
    },
    emptySubtitle: {
      fontSize: fontSize.sm,
      color: theme.colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.xs,
    },
  });

export default TodayWorkoutCard;
