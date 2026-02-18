import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Pressable, ImageBackground } from 'react-native';
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
import type { TrainingDay } from '../../types';

// Imagen local de workout
const workoutImage = require('../../../assets/mock-image-workout.jpg');

// Dimensiones de la tarjeta
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_MARGIN = spacing.lg;
const CARD_WIDTH = SCREEN_WIDTH - (CARD_MARGIN * 2);
const CARD_HEIGHT = 240;
const CORNER_RADIUS = borderRadius.xl;

// Dimensiones del corte diagonal (chamfer)
const CHAMFER_HORIZONTAL = 95;  // Donde empieza la diagonal desde la derecha
const CHAMFER_VERTICAL = 45;    // Altura donde termina la diagonal
const HORIZONTAL_SEGMENT = 70;  // Longitud del segmento horizontal después de la diagonal
const CHAMFER_RADIUS = 12;      // Radio de las esquinas del corte

// Función helper para generar el path SVG de la tarjeta con 6 esquinas redondeadas
const getCardShapePath = (
  w: number,      // width total
  h: number,      // height total
  r: number,      // corner radius (esquinas principales)
  chamferH: number,  // donde empieza la diagonal desde la derecha
  chamferV: number,  // altura del corte
  hSegment: number,  // longitud del segmento horizontal
  cr: number         // chamfer corner radius
) => {
  // Puntos (sentido horario):
  // (1) Superior izquierda
  // (2) Inicio de la diagonal
  // (3) Fin de la diagonal
  // (4) Esquina derecha del corte (antes de bajar)
  // (5) Inferior derecha
  // (6) Inferior izquierda

  const x2 = w - chamferH;           // donde empieza la diagonal (punto 2)
  const x3 = w - hSegment;           // donde termina la diagonal (punto 3)
  const y3 = chamferV;               // altura del corte

  // Calcular vector unitario de la diagonal para posicionar curvas correctamente
  const dx = x3 - x2;
  const dy = y3;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;  // componente x del vector unitario
  const uy = dy / len;  // componente y del vector unitario

  // Puntos donde la diagonal conecta con las curvas
  const diag_start_x = x2 + cr * ux;
  const diag_start_y = cr * uy;
  const diag_end_x = x3 - cr * ux;
  const diag_end_y = y3 - cr * uy;

  return `
    M ${r},0
    L ${x2 - cr},0
    Q ${x2},0 ${diag_start_x},${diag_start_y}
    L ${diag_end_x},${diag_end_y}
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

// Componente máscara para la tarjeta
const CardMask = () => (
  <Svg width={CARD_WIDTH} height={CARD_HEIGHT}>
    <Path
      d={getCardShapePath(CARD_WIDTH, CARD_HEIGHT, CORNER_RADIUS, CHAMFER_HORIZONTAL, CHAMFER_VERTICAL, HORIZONTAL_SEGMENT, CHAMFER_RADIUS)}
      fill="black"
    />
  </Svg>
);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TodayWorkoutCardProps {
  trainingDay: TrainingDay | null;
  position?: number | null;
  total?: number | null;
  allCompleted?: boolean;
  onStartPress: () => void;
  isLoading?: boolean;
}

export const TodayWorkoutCard: React.FC<TodayWorkoutCardProps> = ({
  trainingDay,
  position,
  total,
  allCompleted,
  onStartPress,
  isLoading,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  // Estado: Cargando
  if (isLoading) {
    return (
      <View style={styles.skeletonWrapper}>
        <WorkoutCardSkeleton />
      </View>
    );
  }

  // Estado: Programa completado
  if (allCompleted) {
    return (
      <View style={styles.completedContainer}>
        <View style={styles.completedIconContainer}>
          <Ionicons name="trophy" size={40} color={colors.white} />
        </View>
        <Text style={styles.completedTitle}>¡Programa completado!</Text>
        <Text style={styles.completedSubtitle}>
          Felicitaciones, completaste {total} entrenamientos
        </Text>
      </View>
    );
  }

  // Estado: Sin entrenamiento disponible
  if (!trainingDay) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={48} color={colors.gray[300]} />
        <Text style={styles.emptyTitle}>Sin programa activo</Text>
        <Text style={styles.emptySubtitle}>
          Contacta a tu entrenador para asignarte un programa
        </Text>
      </View>
    );
  }

  // Calcular duración estimada (3 min por serie)
  const totalSets = trainingDay.exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const estimatedMinutes = Math.round(totalSets * 3);
  const hours = Math.floor(estimatedMinutes / 60);
  const minutes = estimatedMinutes % 60;
  const durationText = hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onStartPress}
    >
      {/* Tarjeta con MaskedView para recorte de 6 lados */}
      <MaskedView
        style={styles.cardContainer}
        maskElement={<CardMask />}
      >
        <ImageBackground
          source={workoutImage}
          style={styles.maskedImage}
          resizeMode="cover"
        >
          {/* Overlay oscuro con gradiente */}
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)']}
            style={styles.overlay}
          />

          {/* Borde de vidrio sutil */}
          <View style={styles.glassBorder} pointerEvents="none" />

          {/* Contenido superpuesto */}
          <View style={styles.content}>
            {/* Header con posición */}
            {position && total && (
              <View style={styles.positionBadge}>
                <BlurView intensity={40} tint="light" style={styles.positionBlur}>
                  <Text style={styles.positionText}>
                    Día {position} de {total}
                  </Text>
                </BlurView>
              </View>
            )}

            {/* Título en la esquina superior izquierda */}
            <View style={styles.titleArea}>
              <Text style={styles.title}>{trainingDay.name}</Text>
              {trainingDay.focus && (
                <Text style={styles.focusText}>{trainingDay.focus}</Text>
              )}
            </View>

            {/* Botón empezar con glassmorphism */}
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

      {/* Contenido de duración en el área del corte */}
      <View style={styles.durationContainer}>
        <Text style={styles.durationLabel}>Duración:</Text>
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
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    borderRadius: CORNER_RADIUS,
    ...shadows.lg,
  },
  maskedImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
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
    maxWidth: CARD_WIDTH - CHAMFER_HORIZONTAL - spacing.lg,
    marginTop: spacing.xl,
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