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
import { colors, brandColors, spacing, fontSize, borderRadius, shadows } from '../../constants/colors';
import { WorkoutCardSkeleton } from '../common/Skeleton';
import type { NextWorkoutReason, TrainingDay } from '../../types';

const workoutImage = require('../../../assets/mock-image-workout.jpg');

const CARD_MARGIN = spacing.lg;
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
  cr: number
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
          CHAMFER_RADIUS
        )}
        fill="black"
      />
    </Svg>
  );
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TodayWorkoutCardProps {
  trainingDay: TrainingDay | null;
  position?: number | null;
  total?: number | null;
  allCompleted?: boolean;
  nextWorkoutReason?: NextWorkoutReason | null;
  onStartPress: () => void;
  isLoading?: boolean;
  contentWidth?: number;
}

const getEmptyStateCopy = (reason?: NextWorkoutReason | null) => {
  switch (reason) {
    case 'no_active_macrocycle':
      return {
        title: 'No tienes un programa activo',
        subtitle: 'Tu entrenador aún no te asigna un programa vigente.',
      };
    case 'no_training_days':
      return {
        title: 'Tu programa no tiene sesiones visibles',
        subtitle: 'Revisa con tu entrenador la programacion del microciclo activo.',
      };
    default:
      return {
        title: 'No pudimos encontrar tu próximo entrenamiento',
        subtitle: 'Intenta refrescar o revisa con tu entrenador tu programación.',
      };
  }
};

export const TodayWorkoutCard: React.FC<TodayWorkoutCardProps> = ({
  trainingDay,
  position,
  total,
  allCompleted,
  nextWorkoutReason,
  onStartPress,
  isLoading,
  contentWidth,
}) => {
  const scale = useSharedValue(1);
  const availableWidth = Math.max(320, (contentWidth ?? 0) - CARD_MARGIN * 2);
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
      <View style={styles.skeletonWrapper}>
        <WorkoutCardSkeleton />
      </View>
    );
  }

  if (allCompleted) {
    return (
      <View style={styles.completedContainer}>
        <View style={styles.completedIconContainer}>
          <Ionicons name="trophy" size={40} color={colors.white} />
        </View>
        <Text style={styles.completedTitle}>Programa completado</Text>
        <Text style={styles.completedSubtitle}>
          Felicitaciones, completaste {total} entrenamientos
        </Text>
      </View>
    );
  }

  if (!trainingDay) {
    const emptyStateCopy = getEmptyStateCopy(nextWorkoutReason);

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={48} color={colors.gray[300]} />
        <Text style={styles.emptyTitle}>{emptyStateCopy.title}</Text>
        <Text style={styles.emptySubtitle}>{emptyStateCopy.subtitle}</Text>
      </View>
    );
  }

  const totalSets = trainingDay.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const estimatedMinutes = Math.round(totalSets * 3);
  const hours = Math.floor(estimatedMinutes / 60);
  const minutes = estimatedMinutes % 60;
  const durationText = hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
  const sessionCaption = trainingDay.session_label?.trim()
    ? `Sesion ${trainingDay.session_index} · ${trainingDay.session_label.trim()}`
    : `Sesion ${trainingDay.session_index}`;

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
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
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)']}
            style={styles.overlay}
          />

          <View style={styles.glassBorder} pointerEvents="none" />

          <View style={styles.content}>
            {position && total && (
              <View style={styles.positionBadge}>
                <BlurView intensity={40} tint="light" style={styles.positionBlur}>
                  <Text style={styles.positionText}>
                    Sesion {position} de {total}
                  </Text>
                </BlurView>
              </View>
            )}

            <View style={[styles.titleArea, { maxWidth: cardWidth - chamferHorizontal - spacing.lg }]}>
              <View style={styles.sessionPill}>
                <Text style={styles.sessionPillText}>{sessionCaption}</Text>
              </View>
              <Text style={styles.title}>{trainingDay.name}</Text>
              {trainingDay.focus && (
                <Text style={styles.focusText}>{trainingDay.focus}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={onStartPress}
              activeOpacity={0.9}
            >
              <BlurView intensity={80} tint="light" style={styles.startButtonBlur}>
                <Text style={styles.startButtonText}>empezar</Text>
                <View style={styles.arrowCircle}>
                  <Ionicons name="arrow-forward" size={18} color={brandColors.navy} />
                </View>
              </BlurView>
            </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: {
    marginHorizontal: CARD_MARGIN,
    marginVertical: spacing.md,
    position: 'relative',
    height: CARD_HEIGHT,
  },
  skeletonWrapper: {
    marginHorizontal: CARD_MARGIN,
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
    color: colors.gray[500],
    fontWeight: '500',
  },
  durationValue: {
    fontSize: fontSize.sm,
    color: colors.gray[800],
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
  positionBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  positionBlur: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  positionText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.gray[800],
  },
  titleArea: {
    marginTop: spacing.xl,
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
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  startButtonText: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.gray[800],
    marginRight: spacing.md,
  },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${brandColors.sky}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    marginHorizontal: CARD_MARGIN,
    marginVertical: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[700],
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  completedContainer: {
    marginHorizontal: CARD_MARGIN,
    marginVertical: spacing.md,
    padding: spacing.xl,
    backgroundColor: brandColors.navy,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    ...shadows.lg,
  },
  completedIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${brandColors.sky}30`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.white,
    marginTop: spacing.md,
  },
  completedSubtitle: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default TodayWorkoutCard;
