import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Path } from 'react-native-svg';
import { borderRadius, brandColors, colors, fontSize, shadows, spacing } from '../../constants/colors';
import { getWorkoutSetTypeDefinition, usesSegmentedWorkoutCapture } from '../../constants/workoutSetTypes';
import { getAssetUrl, getVideoThumbnailUrl } from '../../services/api';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { DayExercise, ExerciseProgress, WorkoutScreenMode } from '../../types';
import {
  formatDurationSeconds,
  formatEffortValue,
  getCardioEffectiveSets,
  getCardioIntensityLabel,
  getCardioSummaryLabel,
  isCardioExercise,
  isEditableEffortType,
  shouldShowStrengthEffort,
} from '../../utils/formatters';
import {
  adjustWorkoutMetricValue,
  formatWorkoutMetricValue,
  normalizeWorkoutMetricValue,
  sanitizeWorkoutMetricDraft,
  type WorkoutMetricField,
} from '../../utils/workoutMetricInputs';
import type { WorkoutSetSegmentDraft } from '../../utils/workoutSession';
import { VideoPlayerModal, YouTubePlayerModal } from '../video';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const CARD_HEIGHT = 312;
const INTERACTIVE_CARD_HEIGHT = 356;
const IMAGE_WIDTH_RATIO = 0.50;
const DIAGONAL_WIDTH = 80;
const YOUTUBE_RED = '#FF0000';
const EXERCISE_PLACEHOLDER = require('../../../assets/exercise-placeholder.png');

type CardVariant = 'compact' | 'interactive';

type CardLayout = {
  cardHeight: number;
  imageWidth: number;
  infoWidth: number;
  metricsWidth: number;
  actionDockWidth: number;
};

type ResolvedExerciseMedia = {
  gifUrl: string | null;
  posterUrl: string | null;
};

interface ExerciseCardProps {
  mode: WorkoutScreenMode;
  dayExercise: DayExercise;
  progress: ExerciseProgress;
  currentSetNumber: number;
  currentReps: number;
  currentWeight: number;
  currentEffortValue: number | null;
  currentSegments: WorkoutSetSegmentDraft[];
  isActive: boolean;
  exerciseNumber: number;
  totalExercises: number;
  setInProgress: boolean;
  isSavingSet?: boolean;
  onActivateExercise?: () => void;
  onRepsChange: (delta: number) => void;
  onRepsCommit?: (value: number) => void;
  onWeightChange: (delta: number) => void;
  onWeightCommit?: (value: number) => void;
  onEffortChange?: (delta: number) => void;
  onEffortCommit?: (value: number) => void;
  onSegmentRepsChange?: (segmentIndex: number, delta: number) => void;
  onSegmentRepsCommit?: (segmentIndex: number, value: number) => void;
  onSegmentWeightChange?: (segmentIndex: number, delta: number) => void;
  onSegmentWeightCommit?: (segmentIndex: number, value: number) => void;
  onSegmentEffortChange?: (segmentIndex: number, delta: number) => void;
  onSegmentEffortCommit?: (segmentIndex: number, value: number) => void;
  onAddSegment?: () => void;
  onRemoveSegment?: (segmentIndex: number) => void;
  onAdvanceSet?: () => void;
  onSaveSet?: () => void;
  onSelectSet?: (setNumber: number) => void;
  onDeleteSet?: (setNumber: number) => void;
  shouldAutoplayPreview?: boolean;
}

const createCardLayout = (variant: CardVariant): CardLayout => {
  const cardHeight = variant === 'interactive' ? INTERACTIVE_CARD_HEIGHT : CARD_HEIGHT;
  const imageWidth = CARD_WIDTH * IMAGE_WIDTH_RATIO;
  const infoWidth = CARD_WIDTH - imageWidth + DIAGONAL_WIDTH;
  const innerPadding = spacing.md + spacing.sm;
  const getAvailableInfoWidth = (verticalFraction: number) =>
    Math.max(infoWidth - DIAGONAL_WIDTH * verticalFraction, 0);

  return {
    cardHeight,
    imageWidth,
    infoWidth,
    metricsWidth: getAvailableInfoWidth(0.72) - innerPadding,
    actionDockWidth: getAvailableInfoWidth(0.88) - innerPadding,
  };
};

const getImageShapePath = (width: number, height: number, diagonalWidth: number, radius: number) => `
  M ${diagonalWidth},0
  L ${width - radius},0
  Q ${width},0 ${width},${radius}
  L ${width},${height - radius}
  Q ${width},${height} ${width - radius},${height}
  L 0,${height}
  Z
`;

const getInfoShapePath = (width: number, height: number, diagonalWidth: number, radius: number) => `
  M 0,${radius}
  Q 0,0 ${radius},0
  L ${width},0
  L ${width - diagonalWidth},${height}
  L ${radius},${height}
  Q 0,${height} 0,${height - radius}
  Z
`;

const ImageMask = ({ layout }: { layout: CardLayout }) => (
  <Svg width={layout.imageWidth} height={layout.cardHeight}>
    <Path d={getImageShapePath(layout.imageWidth, layout.cardHeight, DIAGONAL_WIDTH, borderRadius.xl)} fill="black" />
  </Svg>
);

const InfoMask = ({ layout }: { layout: CardLayout }) => (
  <Svg width={layout.infoWidth} height={layout.cardHeight}>
    <Path d={getInfoShapePath(layout.infoWidth, layout.cardHeight, DIAGONAL_WIDTH, borderRadius.xl)} fill="black" />
  </Svg>
);

const EditableStepperMetric = ({
  field,
  metricId,
  label,
  value,
  onAdjust,
  onCommitValue,
  step,
  disabled,
  styles,
  accentColor,
  placeholderColor,
}: {
  field: WorkoutMetricField;
  metricId: string;
  label: string;
  value: number | null | undefined;
  onAdjust?: (delta: number) => void;
  onCommitValue?: (value: number) => void;
  step: number;
  disabled: boolean;
  styles: ReturnType<typeof createStyles>;
  accentColor: string;
  placeholderColor: string;
}) => {
  const [draftValue, setDraftValue] = useState(() =>
    formatWorkoutMetricValue(field, value),
  );
  const [isFocused, setIsFocused] = useState(false);
  const metricIdRef = useRef(metricId);

  useEffect(() => {
    if (metricIdRef.current !== metricId) {
      metricIdRef.current = metricId;
      setDraftValue(formatWorkoutMetricValue(field, value));
      setIsFocused(false);
      return;
    }

    if (!isFocused) {
      setDraftValue(formatWorkoutMetricValue(field, value));
    }
  }, [field, isFocused, metricId, value]);

  const handleCommit = useCallback(
    (rawValue?: string) => {
      const normalizedValue = normalizeWorkoutMetricValue(
        field,
        rawValue ?? draftValue,
      );

      if (normalizedValue == null) {
        setDraftValue(formatWorkoutMetricValue(field, value));
        return;
      }

      onCommitValue?.(normalizedValue);
      setDraftValue(formatWorkoutMetricValue(field, normalizedValue));
    },
    [draftValue, field, onCommitValue, value],
  );

  const handleAdjust = useCallback(
    (delta: number) => {
      const baseValue =
        normalizeWorkoutMetricValue(field, isFocused ? draftValue : value) ??
        normalizeWorkoutMetricValue(field, value);

      if (baseValue == null) {
        return;
      }

      const nextValue = adjustWorkoutMetricValue(field, baseValue, delta);
      if (nextValue == null) {
        return;
      }

      if (!isFocused && onAdjust) {
        onAdjust(delta);
      } else {
        onCommitValue?.(nextValue);
      }

      setDraftValue(formatWorkoutMetricValue(field, nextValue));
    },
    [draftValue, field, isFocused, onAdjust, onCommitValue, value],
  );

  return (
    <View style={styles.metricRow}>
      <TouchableOpacity
        style={styles.metricButton}
        disabled={disabled}
        onPress={() => handleAdjust(-step)}
      >
        <Ionicons name="chevron-down" size={20} color={accentColor} />
      </TouchableOpacity>
      <View style={styles.metricValue}>
        <View
          style={[
            styles.metricValueInputShell,
            isFocused && styles.metricValueInputShellFocused,
          ]}
        >
          <TextInput
            value={draftValue}
            onChangeText={(nextValue) =>
              setDraftValue(sanitizeWorkoutMetricDraft(field, nextValue))
            }
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              handleCommit();
              setIsFocused(false);
            }}
            onSubmitEditing={() => {
              handleCommit();
              setIsFocused(false);
            }}
            keyboardType={field === 'reps' ? 'number-pad' : 'decimal-pad'}
            returnKeyType="done"
            editable={!disabled}
            selectTextOnFocus
            style={styles.metricValueInput}
            placeholderTextColor={placeholderColor}
          />
        </View>
        <Text style={styles.metricValueLabel}>{label}</Text>
      </View>
      <TouchableOpacity
        style={styles.metricButton}
        disabled={disabled}
        onPress={() => handleAdjust(step)}
      >
        <Ionicons name="chevron-up" size={20} color={accentColor} />
      </TouchableOpacity>
    </View>
  );
};

const StaticMetric = ({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) => (
  <View style={styles.metricValue}>
    <Text style={styles.metricValueNumber}>{value}</Text>
    <Text style={styles.metricValueLabel}>{label}</Text>
  </View>
);

const formatCompact = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) {
    return '--';
  }
  return Number.isInteger(value) ? `${value}` : value.toFixed(1).replace(/\.0$/, '');
};

const isYouTubeUrl = (value: string | null | undefined) => !!value && /youtube\.com|youtu\.be/i.test(value);

const isGifUrl = (value: string | null | undefined) => {
  if (!value) {
    return false;
  }

  const [withoutQuery] = value.split(/[?#]/);
  return /\.gif$/i.test(withoutQuery ?? value);
};

const getExerciseDescription = (dayExercise: DayExercise) => {
  const descriptionEs = dayExercise.exercise?.description_es?.trim();
  if (descriptionEs) {
    return descriptionEs;
  }

  const descriptionEn = dayExercise.exercise?.description_en?.trim();
  return descriptionEn || null;
};

const resolveExerciseMedia = (
  dayExercise: DayExercise,
  videoUrl: string | null,
  useYouTubeModal: boolean,
): ResolvedExerciseMedia => {
  const thumbnailUrl = getAssetUrl(dayExercise.exercise?.thumbnail_url);
  const imageUrl = getAssetUrl(dayExercise.exercise?.image_url);
  const gifUrl = [thumbnailUrl, imageUrl].find((candidate) => isGifUrl(candidate)) ?? null;
  const posterUrl =
    (!useYouTubeModal ? getVideoThumbnailUrl(videoUrl) : null) ||
    [imageUrl, thumbnailUrl].find((candidate) => candidate && !isGifUrl(candidate)) ||
    null;

  return { gifUrl, posterUrl };
};

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  mode,
  dayExercise,
  progress,
  currentSetNumber,
  currentReps,
  currentWeight,
  currentEffortValue,
  currentSegments,
  isActive,
  exerciseNumber,
  totalExercises,
  setInProgress,
  isSavingSet = false,
  onActivateExercise,
  onRepsChange,
  onRepsCommit,
  onWeightChange,
  onWeightCommit,
  onEffortChange,
  onEffortCommit,
  onSegmentRepsChange,
  onSegmentRepsCommit,
  onSegmentWeightChange,
  onSegmentWeightCommit,
  onSegmentEffortChange,
  onSegmentEffortCommit,
  onAddSegment,
  onRemoveSegment,
  onAdvanceSet,
  onSaveSet,
  onSelectSet,
  onDeleteSet,
  shouldAutoplayPreview = false,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [isEditing, setIsEditing] = useState(false);
  const [showGifModal, setShowGifModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const wasActiveRef = useRef(isActive);

  const exercise = dayExercise.exercise;
  const exerciseName = exercise?.name_es || exercise?.name_en || 'Ejercicio';
  const exerciseDescription = getExerciseDescription(dayExercise);
  const setTypeDefinition = getWorkoutSetTypeDefinition(dayExercise.set_type);
  const isCardio = isCardioExercise(dayExercise);
  const isCompleted = progress.is_completed;
  const isReviewMode = mode === 'review';
  const isHistoricalEditMode = mode === 'historicalEdit';
  const isInteractiveMode = !isReviewMode;
  const usesSegmentedCapture = !isCardio && usesSegmentedWorkoutCapture(dayExercise.set_type);
  const showControls = isInteractiveMode && (isActive || isEditing) && (!isCompleted || isEditing);
  const canEditCompletedExercise = isCompleted && !isReviewMode;
  const showCompletedOverlay = canEditCompletedExercise && !isEditing;
  const showInlineControls = !usesSegmentedCapture && showControls;
  const showSegmentEditor = usesSegmentedCapture && showControls;
  const showCurrentSetChip = isInteractiveMode && (!isCompleted || isEditing) && (isActive || setInProgress);
  const showStrengthEffort = shouldShowStrengthEffort(dayExercise);
  const isEffortEditable = showStrengthEffort && isEditableEffortType(dayExercise.effort_type);
  const currentEffortLabel = formatEffortValue(dayExercise.effort_type, currentEffortValue ?? dayExercise.effort_value);
  const accentColor = isSavingSet ? theme.colors.iconMuted : theme.colors.primary;
  const videoUrl = getAssetUrl(exercise?.video_url);
  const useYouTubeModal = !videoUrl || isYouTubeUrl(videoUrl);
  const media = useMemo(
    () => resolveExerciseMedia(dayExercise, videoUrl, useYouTubeModal),
    [dayExercise, useYouTubeModal, videoUrl],
  );
  const inlineImageSource =
    shouldAutoplayPreview && media.gifUrl
      ? { uri: media.gifUrl }
      : media.posterUrl
        ? { uri: media.posterUrl }
        : EXERCISE_PLACEHOLDER;
  const layout = useMemo(
    () => createCardLayout(showInlineControls ? 'interactive' : 'compact'),
    [showInlineControls],
  );
  const primaryAction = isHistoricalEditMode ? onSaveSet : onAdvanceSet;
  const effectiveSets = isCardio ? getCardioEffectiveSets(dayExercise) : dayExercise.sets;
  const primaryActionLabel = isHistoricalEditMode
    ? `Guardar ${isCardio ? 'bloque' : 'serie'} ${currentSetNumber}`
    : `${setInProgress ? 'Finalizar' : 'Iniciar'} ${isCardio ? 'bloque' : 'serie'} ${currentSetNumber}`;

  const currentSetExists = progress.sets_data.some((setGroup) => setGroup.set_number === currentSetNumber);

  useEffect(() => {
    if (wasActiveRef.current && !isActive) {
      setIsEditing(false);
    }

    wasActiveRef.current = isActive;
  }, [isActive]);

  const handleShowSetTypeInfo = useCallback(() => {
    Alert.alert(setTypeDefinition.label, `${setTypeDefinition.description}\n\n${setTypeDefinition.captureHint}`);
  }, [setTypeDefinition.captureHint, setTypeDefinition.description, setTypeDefinition.label]);

  const handleTechniquePress = useCallback(() => {
    if (useYouTubeModal) {
      setShowYouTubeModal(true);
      return;
    }
    setShowVideoModal(true);
  }, [useYouTubeModal]);

  const handlePreviewPress = useCallback(() => {
    if (media.gifUrl) {
      setShowGifModal(true);
      return;
    }

    handleTechniquePress();
  }, [handleTechniquePress, media.gifUrl]);

  const handleCompletedOverlayPress = useCallback(() => {
    if (!canEditCompletedExercise) {
      return;
    }

    onActivateExercise?.();
    setIsEditing(true);
  }, [canEditCompletedExercise, onActivateExercise]);

  const chipLabelForSet = useCallback(
    (setNumber: number) => {
      if (isCardio) {
        return getCardioIntensityLabel(dayExercise);
      }
      
      const setGroup = progress.sets_data.find((item) => item.set_number === setNumber);
      if (!setGroup) {
        return usesSegmentedCapture ? setTypeDefinition.shortLabel : currentEffortLabel;
      }
      if (setGroup.segment_count > 1) {
        return `${setGroup.segment_count} seg`;
      }
      return formatEffortValue(dayExercise.effort_type, setGroup.segments[0]?.effort_value ?? dayExercise.effort_value);
    },
    [currentEffortLabel, dayExercise, isCardio, progress.sets_data, setTypeDefinition.shortLabel, usesSegmentedCapture],
  );

  return (
    <View style={styles.container}>
      <View style={[styles.cardBase, { height: layout.cardHeight }]}>
        <View style={[styles.mediaArea, { width: layout.imageWidth }]}>
          <TouchableOpacity
            style={[styles.mediaPressable, { width: layout.imageWidth, height: layout.cardHeight }]}
            activeOpacity={0.92}
            onPress={handlePreviewPress}
          >
            <MaskedView
              style={[styles.maskContainer, { width: layout.imageWidth, height: layout.cardHeight }]}
              maskElement={<ImageMask layout={layout} />}
            >
              <Image
                source={inlineImageSource}
                style={styles.exerciseImage}
                resizeMode="cover"
              />
            </MaskedView>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.playButton, useYouTubeModal && styles.youtubeButton]} onPress={handleTechniquePress}>
          <Ionicons name={useYouTubeModal ? 'logo-youtube' : 'play'} size={18} color={colors.white} />
        </TouchableOpacity>

        <View style={[styles.infoAreaContainer, { width: layout.infoWidth }]}>
          <MaskedView
            style={[styles.maskContainer, { width: layout.infoWidth, height: layout.cardHeight }]}
            maskElement={<InfoMask layout={layout} />}
          >
            <View style={[styles.infoBackground, { width: layout.infoWidth, height: layout.cardHeight }]} />
          </MaskedView>
        </View>

        <View style={[styles.infoArea, { width: layout.infoWidth }]}>
          <View style={styles.infoContent}>
            <View style={styles.headerRow}>
              <View style={styles.orderBadge}>
                <Text style={styles.orderBadgeText}>{exerciseNumber}/{totalExercises}</Text>
              </View>
              <Text style={styles.exerciseName} numberOfLines={2}>{exerciseName}</Text>
              {!isCardio ? (
                <TouchableOpacity style={styles.setTypeBadge} onPress={handleShowSetTypeInfo} activeOpacity={0.82}>
                  <Text style={styles.setTypeText} numberOfLines={1}>{setTypeDefinition.label}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {isCardio ? (
              <View style={showInlineControls ? styles.strengthSection : styles.cardioBlock}>
                <View style={showInlineControls ? [styles.strengthInteractiveColumn, { width: layout.actionDockWidth }] : undefined}>
                  <View style={showInlineControls ? styles.metricsStack : undefined}>
                    <Text style={styles.cardioTitle}>{getCardioSummaryLabel(dayExercise)}</Text>
                    <View style={styles.cardioMetaChips}>
                      <View style={styles.cardioMetaChip}>
                        <Text style={styles.cardioMetaChipText}>
                          {exercise?.cardio_subclass?.toUpperCase() || 'CARDIO'}
                        </Text>
                      </View>
                      {dayExercise.intensity_zone ? (
                        <View style={styles.cardioMetaChip}>
                          <Text style={styles.cardioMetaChipText}>Z{dayExercise.intensity_zone}</Text>
                        </View>
                      ) : null}
                      {dayExercise.distance_meters ? (
                        <View style={styles.cardioMetaChip}>
                          <Text style={styles.cardioMetaChipText}>
                            {dayExercise.distance_meters >= 1000 
                              ? `${(dayExercise.distance_meters / 1000).toFixed(1)} km` 
                              : `${dayExercise.distance_meters} m`}
                          </Text>
                        </View>
                      ) : null}
                      {dayExercise.target_calories ? (
                        <View style={styles.cardioMetaChip}>
                          <Text style={styles.cardioMetaChipText}>{dayExercise.target_calories} cal</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  
                  {showInlineControls ? (
                    <View style={[styles.actionDock, { width: layout.actionDockWidth }]}>
                      <TouchableOpacity
                        style={[styles.primaryButton, styles.actionDockTouchable, isSavingSet && styles.disabled]}
                        disabled={isSavingSet || !primaryAction}
                        onPress={primaryAction}
                        activeOpacity={0.84}
                      >
                        <LinearGradient colors={[brandColors.navy, brandColors.sky]} style={styles.primaryButtonGradient}>
                          <Text style={styles.primaryButtonText}>{primaryActionLabel}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : showInlineControls ? (
              <View style={styles.strengthSection}>
                <View style={[styles.strengthInteractiveColumn, { width: layout.metricsWidth }]}>
                  <View style={styles.metricsStack}>
                    <EditableStepperMetric
                      field="reps"
                      metricId={`inline-reps-${currentSetNumber}`}
                      label={`Rep ${dayExercise.reps_min} a ${dayExercise.reps_max}`}
                      value={currentReps}
                      onAdjust={onRepsChange}
                      onCommitValue={onRepsCommit}
                      step={1}
                      disabled={isSavingSet}
                      styles={styles}
                      accentColor={accentColor}
                      placeholderColor={theme.colors.textMuted}
                    />
                    <View style={styles.divider} />
                    <EditableStepperMetric
                      field="weight"
                      metricId={`inline-weight-${currentSetNumber}`}
                      label="Peso (kg)"
                      value={currentWeight}
                      onAdjust={onWeightChange}
                      onCommitValue={onWeightCommit}
                      step={2.5}
                      disabled={isSavingSet}
                      styles={styles}
                      accentColor={accentColor}
                      placeholderColor={theme.colors.textMuted}
                    />
                    {showStrengthEffort ? (
                      <>
                        <View style={styles.divider} />
                        {isEffortEditable ? (
                          <EditableStepperMetric
                            field="effort"
                            metricId={`inline-effort-${currentSetNumber}`}
                            label={dayExercise.effort_type}
                            value={currentEffortValue ?? dayExercise.effort_value}
                            onAdjust={onEffortChange}
                            onCommitValue={onEffortCommit}
                            step={0.5}
                            disabled={isSavingSet}
                            styles={styles}
                            accentColor={accentColor}
                            placeholderColor={theme.colors.textMuted}
                          />
                        ) : (
                          <StaticMetric
                            styles={styles}
                            label="Intensidad"
                            value={currentEffortLabel}
                          />
                        )}
                      </>
                    ) : null}
                  </View>

                  <View style={[styles.actionDock, { width: layout.actionDockWidth }]}>
                    <TouchableOpacity
                      style={[styles.primaryButton, styles.actionDockTouchable, isSavingSet && styles.disabled]}
                      disabled={isSavingSet || !primaryAction}
                      onPress={primaryAction}
                      activeOpacity={0.84}
                    >
                      <LinearGradient colors={[brandColors.navy, brandColors.sky]} style={styles.primaryButtonGradient}>
                        <Text style={styles.primaryButtonText}>{primaryActionLabel}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onActivateExercise}
                disabled={!isInteractiveMode || !onActivateExercise || isSavingSet}
              >
                <View style={styles.strengthSection}>
                  <View style={[styles.staticMetricsStack, { width: layout.metricsWidth }]}>
                    <StaticMetric styles={styles} label={`Rep ${dayExercise.reps_min} a ${dayExercise.reps_max}`} value={`${currentReps}`} />
                    <View style={styles.divider} />
                    <StaticMetric styles={styles} label="Peso (kg)" value={`${formatCompact(currentWeight)} kg`} />
                    {showStrengthEffort ? (
                      <>
                        <View style={styles.divider} />
                        <StaticMetric styles={styles} label="Intensidad" value={currentEffortLabel} />
                      </>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {showCompletedOverlay ? (
          <TouchableOpacity
            style={[styles.completedOverlayTouchable, { width: layout.infoWidth }]}
            activeOpacity={0.9}
            onPress={handleCompletedOverlayPress}
          >
            <MaskedView
              style={[styles.maskContainer, { width: layout.infoWidth, height: layout.cardHeight }]}
              maskElement={<InfoMask layout={layout} />}
            >
              <BlurView intensity={25} tint={theme.colors.blurTint} style={styles.blurView}>
                <View style={styles.completedOverlayContent}>
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={32} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.completedText}>Completado</Text>
                  <Text style={styles.tapToEditText}>Toca para editar</Text>
                </View>
              </BlurView>
            </MaskedView>
          </TouchableOpacity>
        ) : null}

        {canEditCompletedExercise && isEditing ? (
          <TouchableOpacity style={styles.editingBadge} onPress={() => setIsEditing(false)} activeOpacity={0.84}>
            <Ionicons name="close-circle" size={18} color={colors.white} />
            <Text style={styles.editingBadgeText}>Cerrar</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.setChipSection}>
        <View style={styles.setChipList}>
          {Array.from({ length: effectiveSets }, (_, index) => {
            const setNumber = index + 1;
            const setGroup = progress.sets_data.find((item) => item.set_number === setNumber);
            const isCompleted = !!setGroup;
            const isCurrent = showCurrentSetChip && setNumber === currentSetNumber;

            return (
              <TouchableOpacity
                key={setNumber}
                style={[styles.setChip, isCompleted && styles.setChipCompleted, isCurrent && styles.setChipCurrent]}
                activeOpacity={0.85}
                disabled={isReviewMode || !onSelectSet}
                onPress={() => onSelectSet?.(setNumber)}
                onLongPress={() => {
                  if (isHistoricalEditMode && isCompleted) {
                    onDeleteSet?.(setNumber);
                  }
                }}
              >
                <Text style={[styles.setChipTitle, isCompleted && styles.setChipTitleCompleted]}>
                  {isCardio ? `B${setNumber}` : `S${setNumber}`}
                </Text>
                <Text style={[styles.setChipValue, isCompleted && styles.setChipValueCompleted]} numberOfLines={2}>
                  {chipLabelForSet(setNumber)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.setIndicatorText}>
          {isCardio ? 'Bloque' : 'Serie'} {currentSetNumber}/{effectiveSets}
        </Text>
      </View>

      {showSegmentEditor ? (
        <View style={styles.segmentEditor}>
          <View style={styles.segmentHeader}>
            <View style={styles.segmentHeaderCopy}>
              <Text style={styles.segmentTitle}>Serie {currentSetNumber}</Text>
              <Text style={styles.segmentHint}>{setTypeDefinition.captureHint}</Text>
            </View>
            {isHistoricalEditMode && currentSetExists && onDeleteSet ? (
              <TouchableOpacity style={styles.deleteButton} onPress={() => onDeleteSet(currentSetNumber)}>
                <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            ) : null}
          </View>

          {currentSegments.map((segment, segmentIndex) => (
            <View key={`${currentSetNumber}-${segment.segment_index}`} style={styles.segmentCard}>
              <View style={styles.segmentCardHeader}>
                <Text style={styles.segmentCardTitle}>Segmento {segmentIndex + 1}</Text>
                {segmentIndex > 0 && currentSegments.length > setTypeDefinition.minimumSegments && onRemoveSegment ? (
                  <TouchableOpacity onPress={() => onRemoveSegment(segmentIndex)}>
                    <Text style={styles.removeText}>Quitar</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.segmentMetricRow}>
                <EditableStepperMetric
                  field="reps"
                  metricId={`segment-reps-${currentSetNumber}-${segmentIndex}`}
                  label="Reps"
                  value={segment.reps_completed}
                  onAdjust={(delta) => onSegmentRepsChange?.(segmentIndex, delta)}
                  onCommitValue={(nextValue) => onSegmentRepsCommit?.(segmentIndex, nextValue)}
                  step={1}
                  disabled={isSavingSet}
                  styles={styles}
                  accentColor={accentColor}
                  placeholderColor={theme.colors.textMuted}
                />
              </View>
              <View style={styles.segmentMetricRow}>
                <EditableStepperMetric
                  field="weight"
                  metricId={`segment-weight-${currentSetNumber}-${segmentIndex}`}
                  label="Peso (kg)"
                  value={segment.weight_kg}
                  onAdjust={(delta) => onSegmentWeightChange?.(segmentIndex, delta)}
                  onCommitValue={(nextValue) => onSegmentWeightCommit?.(segmentIndex, nextValue)}
                  step={2.5}
                  disabled={isSavingSet}
                  styles={styles}
                  accentColor={accentColor}
                  placeholderColor={theme.colors.textMuted}
                />
              </View>
              {showStrengthEffort ? (
                <View style={styles.segmentMetricRow}>
                  {isEffortEditable ? (
                    <EditableStepperMetric
                      field="effort"
                      metricId={`segment-effort-${currentSetNumber}-${segmentIndex}`}
                      label={dayExercise.effort_type}
                      value={segment.effort_value ?? dayExercise.effort_value}
                      onAdjust={(delta) => onSegmentEffortChange?.(segmentIndex, delta)}
                      onCommitValue={(nextValue) => onSegmentEffortCommit?.(segmentIndex, nextValue)}
                      step={0.5}
                      disabled={isSavingSet}
                      styles={styles}
                      accentColor={accentColor}
                      placeholderColor={theme.colors.textMuted}
                    />
                  ) : (
                    <StaticMetric
                      styles={styles}
                      label="Intensidad"
                      value={formatEffortValue(dayExercise.effort_type, segment.effort_value ?? dayExercise.effort_value)}
                    />
                  )}
                </View>
              ) : null}
            </View>
          ))}

          <View style={styles.segmentActions}>
            <TouchableOpacity style={styles.segmentGhostButton} onPress={handleShowSetTypeInfo}>
              <Ionicons name="information-circle-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.segmentGhostText}>Ver guia</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.segmentGhostButton}
              onPress={onAddSegment}
              disabled={isSavingSet || !onAddSegment}
            >
              <Ionicons name="add-circle-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.segmentGhostText}>Agregar segmento</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isSavingSet && styles.disabled]}
            disabled={isSavingSet || !primaryAction}
            onPress={primaryAction}
            activeOpacity={0.84}
          >
            <LinearGradient colors={[brandColors.navy, brandColors.sky]} style={styles.primaryButtonGradient}>
              <Text style={styles.primaryButtonText}>{primaryActionLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : null}

      {media.gifUrl ? (
        <Modal
          visible={showGifModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGifModal(false)}
        >
          <View style={styles.gifModalOverlay}>
            <Pressable style={styles.gifModalBackdrop} onPress={() => setShowGifModal(false)} />
            <View style={styles.gifModalCard}>
              <View style={styles.gifModalHeader}>
                <Text style={styles.gifModalTitle} numberOfLines={2}>
                  {exerciseName}
                </Text>
                <TouchableOpacity
                  style={styles.gifModalCloseButton}
                  onPress={() => setShowGifModal(false)}
                  activeOpacity={0.82}
                >
                  <Ionicons name="close" size={20} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.gifModalScroll}
                contentContainerStyle={styles.gifModalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Image source={{ uri: media.gifUrl }} style={styles.gifModalImage} resizeMode="contain" />

                {exerciseDescription ? (
                  <View style={styles.gifModalDescriptionBlock}>
                    <Text style={styles.gifModalDescriptionLabel}>Descripcion</Text>
                    <Text style={styles.gifModalDescriptionText}>{exerciseDescription}</Text>
                  </View>
                ) : null}
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}

      {!useYouTubeModal && videoUrl ? (
        <VideoPlayerModal
          visible={showVideoModal}
          videoUri={videoUrl}
          exerciseName={exerciseName}
          onClose={() => setShowVideoModal(false)}
        />
      ) : null}

      <YouTubePlayerModal
        visible={showYouTubeModal}
        exerciseName={exerciseName}
        searchName={exercise?.name_en}
        youtubeUrl={useYouTubeModal && videoUrl ? videoUrl : undefined}
        onClose={() => setShowYouTubeModal(false)}
      />
    </View>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { marginHorizontal: spacing.lg, marginVertical: spacing.sm },
  cardBase: { width: CARD_WIDTH, borderRadius: borderRadius.xl, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border, position: 'relative', ...shadows.md },
  mediaArea: { position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 1 },
  mediaPressable: { overflow: 'hidden' },
  maskContainer: { overflow: 'hidden' },
  exerciseImage: { width: '100%', height: '100%' },
  playButton: { position: 'absolute', right: spacing.md, bottom: spacing.md, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[500], zIndex: 10 },
  youtubeButton: { backgroundColor: YOUTUBE_RED },
  infoAreaContainer: { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 2 },
  infoBackground: { backgroundColor: theme.colors.card },
  infoArea: { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 3 },
  infoContent: { flex: 1, paddingLeft: spacing.md, paddingTop: spacing.sm, paddingRight: spacing.xl, paddingBottom: spacing.sm },
  headerRow: { gap: 2 },
  orderBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, backgroundColor: theme.colors.surfaceAlt },
  orderBadgeText: { fontSize: fontSize.xs, fontWeight: '600', color: theme.colors.textMuted },
  exerciseName: { maxWidth: '85%', fontSize: fontSize.lg, fontWeight: '600', color: theme.colors.textPrimary },
  setTypeBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full, backgroundColor: theme.colors.primarySoft, borderWidth: 1, borderColor: theme.colors.primaryBorder },
  setTypeText: { maxWidth: 152, fontSize: fontSize.xs, fontWeight: '700', color: theme.colors.primary },
  cardioBlock: { flex: 1, justifyContent: 'center', paddingRight: spacing.xl },
  cardioTitle: { fontSize: fontSize.base, fontWeight: '700', color: theme.colors.textPrimary },
  cardioMetaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  cardioMetaChip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border },
  cardioMetaChipText: { fontSize: fontSize.xs, fontWeight: '600', color: theme.colors.textSecondary },
  strengthSection: { flex: 1, alignItems: 'flex-start', paddingTop: 2 },
  strengthInteractiveColumn: { flex: 1, justifyContent: 'space-between', alignItems: 'flex-start' },
  metricsStack: { width: '100%' },
  staticMetricsStack: { width: '100%', paddingTop: spacing.xs },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricButton: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border },
  metricValue: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  metricValueInputShell: { width: '100%', minHeight: 30, borderRadius: borderRadius.md, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', paddingHorizontal: spacing.xs },
  metricValueInputShellFocused: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface },
  metricValueInput: { paddingVertical: 0, fontSize: fontSize.base, fontWeight: '700', color: theme.colors.textPrimary, textAlign: 'center' },
  metricValueNumber: { fontSize: fontSize.lg, fontWeight: '700', color: theme.colors.textPrimary, textAlign: 'center' },
  metricValueLabel: { marginTop: 2, fontSize: fontSize.xs, color: theme.colors.textMuted, textAlign: 'center' },
  divider: { width: '100%', height: 1, backgroundColor: theme.colors.border, marginVertical: 2 },
  primaryButton: { marginTop: spacing.xs, borderRadius: borderRadius.lg, overflow: 'hidden' },
  primaryButtonGradient: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  primaryButtonText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.white },
  actionDock: { paddingTop: spacing.xs, alignSelf: 'flex-start' },
  actionDockTouchable: { width: '100%' },
  disabled: { opacity: 0.6 },
  completedOverlayTouchable: { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 10 },
  blurView: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.isDark ? 'rgba(8, 17, 31, 0.82)' : 'rgba(59, 130, 246, 0.65)' },
  completedOverlayContent: { alignItems: 'center' },
  checkCircle: { width: 56, height: 56, marginBottom: spacing.sm, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface },
  completedText: { fontSize: fontSize.lg, fontWeight: '600', color: colors.white },
  tapToEditText: { marginTop: spacing.xs, fontSize: fontSize.xs, color: 'rgba(255, 255, 255, 0.8)' },
  editingBadge: { position: 'absolute', top: spacing.sm, right: spacing.xl, zIndex: 15, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.primary[500] },
  editingBadgeText: { fontSize: fontSize.xs, fontWeight: '500', color: colors.white },
  setChipSection: { marginTop: spacing.sm },
  setChipList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  setChip: { minWidth: 74, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.md, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border, ...shadows.sm },
  setChipCompleted: { backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primaryBorder },
  setChipCurrent: { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface },
  setChipTitle: { fontSize: fontSize.xs, fontWeight: '700', color: theme.colors.textSecondary },
  setChipTitleCompleted: { color: theme.colors.primary },
  setChipValue: { marginTop: 2, fontSize: fontSize.xs, fontWeight: '600', color: theme.colors.textPrimary },
  setChipValueCompleted: { color: theme.colors.primary },
  setIndicatorText: { marginTop: spacing.sm, fontSize: fontSize.xs, fontWeight: '500', color: theme.colors.textMuted },
  segmentEditor: { marginTop: spacing.sm, borderRadius: borderRadius.xl, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, padding: spacing.md, gap: spacing.sm, ...shadows.sm },
  segmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  segmentHeaderCopy: { flex: 1, gap: 4 },
  segmentTitle: { fontSize: fontSize.base, fontWeight: '700', color: theme.colors.textPrimary },
  segmentHint: { fontSize: fontSize.sm, color: theme.colors.textMuted },
  deleteButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.isDark ? 'rgba(248,113,113,0.12)' : '#fef2f2', borderWidth: 1, borderColor: theme.isDark ? 'rgba(248,113,113,0.28)' : '#fecaca' },
  segmentCard: { borderRadius: borderRadius.lg, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border, padding: spacing.sm, gap: spacing.xs },
  segmentCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  segmentCardTitle: { fontSize: fontSize.sm, fontWeight: '700', color: theme.colors.textPrimary },
  removeText: { fontSize: fontSize.xs, fontWeight: '700', color: theme.colors.error },
  segmentMetricRow: { marginTop: spacing.xs },
  segmentActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  segmentGhostButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: borderRadius.full, backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  segmentGhostText: { fontSize: fontSize.sm, fontWeight: '700', color: theme.colors.textSecondary },
  gifModalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  gifModalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(3, 7, 18, 0.76)' },
  gifModalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '88%',
    borderRadius: borderRadius.xl,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  gifModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  gifModalTitle: {
    flex: 1,
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  gifModalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gifModalScroll: { maxHeight: '100%' },
  gifModalScrollContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  gifModalImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: theme.colors.surfaceAlt,
  },
  gifModalDescriptionBlock: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  gifModalDescriptionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  gifModalDescriptionText: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
});

export default ExerciseCard;
