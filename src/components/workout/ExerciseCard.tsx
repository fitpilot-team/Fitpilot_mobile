import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Path } from 'react-native-svg';
import { colors, brandColors, spacing, fontSize, borderRadius, shadows } from '../../constants/colors';
import { getAssetUrl, getVideoThumbnailUrl } from '../../services/api';
import { VideoPlayerModal } from '../video';
import type { DayExercise, ExerciseProgress } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const CARD_HEIGHT = 260;

// Dimensiones para la imagen con diagonal
const IMAGE_WIDTH = CARD_WIDTH * 0.55;
const IMAGE_HEIGHT = CARD_HEIGHT;
const DIAGONAL_WIDTH = 80;  // Aumentado para diagonal más pronunciada (~17°)
const IMAGE_CORNER_RADIUS = borderRadius.xl;
const INFO_WIDTH = CARD_WIDTH - IMAGE_WIDTH + DIAGONAL_WIDTH;

// Path SVG para imagen con diagonal en el lado izquierdo
// La diagonal va desde (dw, 0) arriba hasta (0, height) abajo
const getImageShapePath = (
  width: number,
  height: number,
  diagonalWidth: number,
  cornerRadius: number
) => {
  const r = cornerRadius;
  const dw = diagonalWidth;

  return `
    M ${dw},0
    L ${width - r},0
    Q ${width},0 ${width},${r}
    L ${width},${height - r}
    Q ${width},${height} ${width - r},${height}
    L 0,${height}
    Z
  `;
};

// Componente máscara para la imagen
const ImageMask = () => (
  <Svg width={IMAGE_WIDTH} height={IMAGE_HEIGHT}>
    <Path
      d={getImageShapePath(IMAGE_WIDTH, IMAGE_HEIGHT, DIAGONAL_WIDTH, IMAGE_CORNER_RADIUS)}
      fill="black"
    />
  </Svg>
);

// Path SVG para infoArea con diagonal en el lado derecho
// La diagonal va desde (width, 0) arriba hasta (width - dw, height) abajo
// Esto coincide con la dirección de la diagonal de la imagen
const getInfoShapePath = (
  width: number,
  height: number,
  diagonalWidth: number,
  cornerRadius: number
) => {
  const r = cornerRadius;
  const dw = diagonalWidth;

  return `
    M 0,${r}
    Q 0,0 ${r},0
    L ${width},0
    L ${width - dw},${height}
    L ${r},${height}
    Q 0,${height} 0,${height - r}
    Z
  `;
};

// Componente máscara para el infoArea
const InfoMask = () => (
  <Svg width={INFO_WIDTH} height={CARD_HEIGHT}>
    <Path
      d={getInfoShapePath(INFO_WIDTH, CARD_HEIGHT, DIAGONAL_WIDTH, IMAGE_CORNER_RADIUS)}
      fill="black"
    />
  </Svg>
);

interface ExerciseCardProps {
  dayExercise: DayExercise;
  progress: ExerciseProgress;
  currentSetNumber: number;
  currentReps: number;
  currentWeight: number;
  isActive: boolean;
  exerciseNumber: number;
  totalExercises: number;
  setInProgress: boolean;
  isSavingSet?: boolean;
  onRepsChange: (delta: number) => void;
  onWeightChange: (delta: number) => void;
  onNextSet: () => void;
  onVideoPress?: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  dayExercise,
  progress,
  currentSetNumber,
  currentReps,
  currentWeight,
  exerciseNumber,
  totalExercises,
  setInProgress,
  isSavingSet = false,
  onRepsChange,
  onWeightChange,
  onNextSet,
  onVideoPress,
}) => {
  const isCompleted = progress.is_completed;
  const [isEditing, setIsEditing] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const exercise = dayExercise.exercise;
  const exerciseName = exercise?.name_es || exercise?.name_en || 'Ejercicio';

  // Get media URLs - thumbnail generado desde el video de Cloudinary
  const videoUrl = getAssetUrl(exercise?.video_url);
  const thumbnailUrl = getVideoThumbnailUrl(videoUrl);
  const hasVideo = !!videoUrl;
  const hasThumbnail = !!thumbnailUrl;

  // Show edit mode if completed but user tapped to edit
  const showControls = !isCompleted || isEditing;
  const controlsDisabled = !showControls || isSavingSet;

  const handleVideoPress = () => {
    if (hasVideo) {
      setShowVideoModal(true);
    } else if (onVideoPress) {
      onVideoPress();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardBase}>
        {/* Media area - imagen con diagonal usando MaskedView */}
        <View style={styles.mediaArea}>
          <MaskedView
            style={styles.imageMaskContainer}
            maskElement={<ImageMask />}
          >
            {hasThumbnail ? (
              <Image
                source={{ uri: thumbnailUrl }}
                style={styles.exerciseImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="fitness-outline" size={40} color={colors.gray[300]} />
              </View>
            )}
          </MaskedView>
        </View>

        {/* Play button - positioned above everything, only shown if has video */}
        {hasVideo && (
          <TouchableOpacity
            style={styles.playButton}
            onPress={handleVideoPress}
            activeOpacity={0.8}
          >
            <Ionicons
              name="play"
              size={18}
              color={colors.white}
            />
          </TouchableOpacity>
        )}

        {/* Info area background with diagonal - usando MaskedView */}
        <View style={styles.infoAreaContainer}>
          <MaskedView
            style={styles.infoMaskContainer}
            maskElement={<InfoMask />}
          >
            <View style={styles.infoBackground} />
          </MaskedView>
        </View>

        {/* Info area content (left side) */}
        <View style={styles.infoArea}>
          {/* Content */}
          <View style={styles.infoContent}>
            {/* Exercise order badge */}
            <View style={styles.orderBadge}>
              <Text style={styles.orderBadgeText}>{exerciseNumber}/{totalExercises}</Text>
            </View>

            {/* Exercise name */}
            <Text style={styles.exerciseName} numberOfLines={2}>
              {exerciseName}
            </Text>

            {/* Reps control */}
            <View style={styles.controlRow}>
              <TouchableOpacity
                onPress={() => onRepsChange(-1)}
                style={styles.controlButton}
                disabled={controlsDisabled}
              >
                <Ionicons
                  name="chevron-down"
                  size={22}
                  color={controlsDisabled ? colors.gray[300] : colors.gray[600]}
                />
              </TouchableOpacity>
              <View style={styles.valueContainer}>
                <Text style={[styles.valueNumber, !showControls && styles.valueDimmed]}>
                  {currentReps}
                </Text>
                <Text style={styles.valueLabel}>
                  Rep {dayExercise.reps_min} a {dayExercise.reps_max}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => onRepsChange(1)}
                style={styles.controlButton}
                disabled={controlsDisabled}
              >
                <Ionicons
                  name="chevron-up"
                  size={22}
                  color={controlsDisabled ? colors.gray[300] : colors.gray[600]}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* Weight control */}
            <View style={styles.controlRow}>
              <TouchableOpacity
                onPress={() => onWeightChange(-2.5)}
                style={styles.controlButton}
                disabled={controlsDisabled}
              >
                <Ionicons
                  name="chevron-down"
                  size={22}
                  color={controlsDisabled ? colors.gray[300] : colors.gray[600]}
                />
              </TouchableOpacity>
              <View style={styles.valueContainer}>
                <Text style={[styles.valueNumber, !showControls && styles.valueDimmed]}>
                  {currentWeight} kg
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => onWeightChange(2.5)}
                style={styles.controlButton}
                disabled={controlsDisabled}
              >
                <Ionicons
                  name="chevron-up"
                  size={22}
                  color={controlsDisabled ? colors.gray[300] : colors.gray[600]}
                />
              </TouchableOpacity>
            </View>

            {/* Next button */}
            {showControls && (
              <TouchableOpacity onPress={onNextSet} activeOpacity={0.8} disabled={controlsDisabled}>
                <LinearGradient
                  colors={[brandColors.navy, brandColors.sky]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.nextButton, controlsDisabled && styles.nextButtonDisabled]}
                >
                  <Text style={styles.nextButtonText}>
                    {(() => {
                      const isFirstSet = currentSetNumber === 1 && progress.completed_sets === 0;
                      const isLastSet = currentSetNumber >= dayExercise.sets;

                      if (!setInProgress) {
                        // Serie no iniciada
                        return isFirstSet ? 'Iniciar ejercicio' : `Iniciar serie ${currentSetNumber}`;
                      } else {
                        // Serie en progreso
                        return isLastSet ? 'Finalizar ejercicio' : `Finalizar serie ${currentSetNumber}`;
                      }
                    })()}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* Completed overlay with blur - only over info area */}
          {isCompleted && !isEditing && (
            <TouchableOpacity
              style={styles.completedOverlayTouchable}
              activeOpacity={0.9}
              onPress={() => setIsEditing(true)}
            >
              <BlurView intensity={25} tint="light" style={styles.blurView}>
                <View style={styles.completedOverlayContent}>
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={32} color={colors.primary[500]} />
                  </View>
                  <Text style={styles.completedText}>Completado</Text>
                  <Text style={styles.tapToEditText}>Toca para editar</Text>
                </View>
              </BlurView>
            </TouchableOpacity>
          )}

          {/* Editing badge when completed but editing */}
          {isCompleted && isEditing && (
            <TouchableOpacity
              style={styles.editingBadge}
              onPress={() => setIsEditing(false)}
            >
              <Ionicons name="close-circle" size={20} color={colors.white} />
              <Text style={styles.editingBadgeText}>Cerrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Set progress bars - BELOW the card */}
      <View style={styles.setBarContainer}>
        <View style={styles.setBars}>
          {Array.from({ length: dayExercise.sets }, (_, i) => {
            const setNum = i + 1;
            const isSetCompleted = setNum <= progress.completed_sets;

            return (
              <View
                key={setNum}
                style={[
                  styles.setBar,
                  isSetCompleted && styles.setBarCompleted,
                ]}
              />
            );
          })}
        </View>
        <Text style={styles.setIndicatorText}>
          Serie {currentSetNumber}/{dayExercise.sets}
        </Text>
      </View>

      {/* Video Player Modal */}
      {hasVideo && videoUrl && (
        <VideoPlayerModal
          visible={showVideoModal}
          videoUri={videoUrl}
          exerciseName={exerciseName}
          onClose={() => setShowVideoModal(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  cardBase: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.gray[100],
    ...shadows.md,
    position: 'relative',
  },
  // Media area - positioned on the right side
  mediaArea: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: IMAGE_WIDTH,
    zIndex: 1,
  },
  imageMaskContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  exerciseImage: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
  },
  imagePlaceholder: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md + 50, // Above the set bar container
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100, // Above everything
    elevation: 5, // Android shadow
  },
  // Info area background container with diagonal mask
  infoAreaContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: INFO_WIDTH,
    zIndex: 2,
  },
  infoMaskContainer: {
    width: INFO_WIDTH,
    height: CARD_HEIGHT,
  },
  infoBackground: {
    width: INFO_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.white,
  },
  // Info area content - transparent, above the masked background
  infoArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: INFO_WIDTH,
    zIndex: 3,
  },
  infoContent: {
    flex: 1,
    padding: spacing.md,
    paddingRight: spacing.xl,
  },
  orderBadge: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  orderBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.gray[500],
  },
  exerciseName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.xs,
    maxWidth: '85%',
  },
  setIndicator: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  // Set progress bars - below card
  setBarContainer: {
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
  },
  setBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  setBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray[200],
  },
  setBarCompleted: {
    backgroundColor: colors.primary[500],
  },
  setIndicatorText: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
    fontWeight: '500',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: spacing.xs,
  },
  controlButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContainer: {
    alignItems: 'center',
    minWidth: 70,
  },
  valueNumber: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.gray[900],
  },
  valueDimmed: {
    color: colors.gray[400],
  },
  valueLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing.xs,
    width: '70%',
  },
  nextButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  // Completed overlay styles
  completedOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    borderTopLeftRadius: borderRadius.xl,
    borderBottomLeftRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  blurView: {
    flex: 1,
    backgroundColor: 'rgba(59, 130, 246, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedOverlayContent: {
    alignItems: 'center',
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  completedText: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  tapToEditText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  // Editing badge
  editingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    zIndex: 15,
  },
  editingBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: '500',
    marginLeft: 4,
  },
});
