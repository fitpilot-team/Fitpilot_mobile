import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
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
import {
  borderRadius,
  brandColors,
  colors,
  fontSize,
  shadows,
  spacing,
} from '../../constants/colors';
import { getAssetUrl, getVideoThumbnailUrl } from '../../services/api';
import { useAppTheme, useThemedStyles, type AppTheme } from '../../theme';
import type { DayExercise, ExerciseProgress } from '../../types';
import {
  formatDistanceMeters,
  formatDurationSeconds,
  formatEffortValue,
  formatZoneLabel,
  getCardioSummaryLabel,
  isCardioExercise,
  isEditableEffortType,
  shouldShowStrengthEffort,
} from '../../utils/formatters';
import { VideoPlayerModal, YouTubePlayerModal } from '../video';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.lg * 2;
const CARD_HEIGHT = 312;
const YOUTUBE_RED = '#FF0000';

const IMAGE_WIDTH = CARD_WIDTH * 0.55;
const IMAGE_HEIGHT = CARD_HEIGHT;
const DIAGONAL_WIDTH = 80;
const IMAGE_CORNER_RADIUS = borderRadius.xl;
const INFO_WIDTH = CARD_WIDTH - IMAGE_WIDTH + DIAGONAL_WIDTH;

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

const ImageMask = () => (
  <Svg width={IMAGE_WIDTH} height={IMAGE_HEIGHT}>
    <Path
      d={getImageShapePath(IMAGE_WIDTH, IMAGE_HEIGHT, DIAGONAL_WIDTH, IMAGE_CORNER_RADIUS)}
      fill="black"
    />
  </Svg>
);

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
  currentEffortValue: number | null;
  isActive: boolean;
  exerciseNumber: number;
  totalExercises: number;
  setInProgress: boolean;
  isSavingSet?: boolean;
  readOnly?: boolean;
  onActivateExercise?: () => void;
  onRepsChange: (delta: number) => void;
  onRepsCommit?: (value: number) => void;
  onWeightChange: (delta: number) => void;
  onWeightCommit?: (value: number) => void;
  onEffortChange?: (delta: number) => void;
  onNextSet: () => void;
  onSelectSet?: (setNumber: number) => void;
  onDeleteSet?: (setNumber: number) => void;
  onVideoPress?: () => void;
}

type EditingField = 'reps' | 'weight' | null;

function formatEditableNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return Number.isInteger(value) ? `${value}` : value.toString().replace(/\.0+$/, '');
}

function sanitizeIntegerDraft(value: string): string {
  return value.replace(/[^\d]/g, '');
}

function sanitizeDecimalDraft(value: string): string {
  const normalized = value.replace(/,/g, '.').replace(/[^\d.]/g, '');
  const [whole = '', ...decimalParts] = normalized.split('.');

  return decimalParts.length ? `${whole}.${decimalParts.join('')}` : whole;
}

function parseIntegerDraft(value: string): number | null {
  const normalized = sanitizeIntegerDraft(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDecimalDraft(value: string): number | null {
  const normalized = sanitizeDecimalDraft(value);
  if (!normalized || normalized === '.') {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  dayExercise,
  progress,
  currentSetNumber,
  currentReps,
  currentWeight,
  currentEffortValue,
  isActive,
  exerciseNumber,
  totalExercises,
  setInProgress,
  isSavingSet = false,
  readOnly = false,
  onActivateExercise,
  onRepsChange,
  onRepsCommit,
  onWeightChange,
  onWeightCommit,
  onEffortChange,
  onNextSet,
  onSelectSet,
  onDeleteSet,
  onVideoPress,
}) => {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<EditingField>(null);
  const [repsDraft, setRepsDraft] = useState(() => formatEditableNumber(currentReps));
  const [weightDraft, setWeightDraft] = useState(() => formatEditableNumber(currentWeight));
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const repsInputRef = useRef<TextInput>(null);
  const weightInputRef = useRef<TextInput>(null);
  const skipBlurFieldRef = useRef<EditingField>(null);
  const wasActiveRef = useRef(isActive);

  const exercise = dayExercise.exercise;
  const exerciseName = exercise?.name_es || exercise?.name_en || 'Ejercicio';
  const videoUrl = getAssetUrl(exercise?.video_url);
  const thumbnailUrl = getVideoThumbnailUrl(videoUrl);
  const hasVideo = !!videoUrl;
  const hasThumbnail = !!thumbnailUrl;
  const isCompleted = progress.is_completed;
  const showControls = !isCompleted || isEditing;
  const controlsDisabled = !showControls || isSavingSet;
  const canEditCompletedExercise = isCompleted && !readOnly;
  const isCardio = isCardioExercise(dayExercise);
  const showStrengthEffort = shouldShowStrengthEffort(dayExercise);
  const isEffortEditable = showStrengthEffort && isEditableEffortType(dayExercise.effort_type);
  const currentEffortLabel = formatEffortValue(
    dayExercise.effort_type,
    currentEffortValue ?? dayExercise.effort_value,
  );
  const targetEffortLabel = formatEffortValue(dayExercise.effort_type, dayExercise.effort_value);
  const controlAccentColor = controlsDisabled ? theme.colors.iconMuted : theme.colors.primary;
  const showCurrentSetChip = !isCompleted && (isActive || setInProgress);
  const unitLabel = isCardio ? 'bloque' : 'serie';
  const currentUnitLabel = isCardio ? 'Bloque' : 'Serie';
  const cardioSummaryLabel = getCardioSummaryLabel(dayExercise);
  const cardioProtocolLabel = exercise?.cardio_subclass?.toUpperCase() || 'CARDIO';
  const cardioZoneLabel = formatZoneLabel(dayExercise.intensity_zone ?? exercise?.intensity_zone);
  const cardioMetrics = useMemo(() => {
    const metrics: Array<{ key: string; label: string; value: string }> = [];

    const durationLabel = dayExercise.duration_seconds == null
      ? null
      : formatDurationSeconds(dayExercise.duration_seconds);
    if (durationLabel) {
      metrics.push({ key: 'duration', label: 'Duracion', value: durationLabel });
    }

    if (cardioZoneLabel) {
      metrics.push({ key: 'zone', label: 'Zona', value: cardioZoneLabel });
    }

    const distanceLabel = dayExercise.distance_meters == null
      ? null
      : formatDistanceMeters(dayExercise.distance_meters);
    if (distanceLabel) {
      metrics.push({ key: 'distance', label: 'Distancia', value: distanceLabel });
    }

    if (dayExercise.target_calories != null) {
      metrics.push({
        key: 'calories',
        label: 'Calorias',
        value: `${dayExercise.target_calories} cal`,
      });
    }

    if (dayExercise.intervals && dayExercise.work_seconds) {
      const intervalLabel = dayExercise.interval_rest_seconds
        ? `${dayExercise.intervals} x ${formatDurationSeconds(dayExercise.work_seconds)} / ${formatDurationSeconds(dayExercise.interval_rest_seconds)}`
        : `${dayExercise.intervals} x ${formatDurationSeconds(dayExercise.work_seconds)}`;
      metrics.push({ key: 'intervals', label: 'Intervalos', value: intervalLabel });
    }

    return metrics.slice(0, 4);
  }, [
    dayExercise.distance_meters,
    dayExercise.duration_seconds,
    dayExercise.interval_rest_seconds,
    dayExercise.intervals,
    dayExercise.target_calories,
    dayExercise.work_seconds,
    cardioZoneLabel,
  ]);

  const setLogsByNumber = useMemo(() => {
    const logs = new Map<number, (typeof progress.sets_data)[number]>();
    progress.sets_data.forEach((setLog) => {
      logs.set(setLog.set_number, setLog);
    });
    return logs;
  }, [progress.sets_data]);

  useEffect(() => {
    if (editingField !== 'reps') {
      setRepsDraft(formatEditableNumber(currentReps));
    }
  }, [currentReps, editingField]);

  useEffect(() => {
    if (editingField !== 'weight') {
      setWeightDraft(formatEditableNumber(currentWeight));
    }
  }, [currentWeight, editingField]);

  useEffect(() => {
    if (wasActiveRef.current && !isActive && editingField) {
      setEditingField(null);
      skipBlurFieldRef.current = null;
    }

    wasActiveRef.current = isActive;
  }, [editingField, isActive]);

  useEffect(() => {
    if (!isActive || !editingField) {
      return;
    }

    const focusTimer = setTimeout(() => {
      if (editingField === 'reps') {
        repsInputRef.current?.focus();
        return;
      }

      weightInputRef.current?.focus();
    }, 0);

    return () => clearTimeout(focusTimer);
  }, [editingField, isActive]);

  const handleVideoPress = () => {
    if (hasVideo) {
      setShowVideoModal(true);
    } else if (onVideoPress) {
      onVideoPress();
    }
  };

  const handleStartEditing = useCallback((field: Exclude<EditingField, null>) => {
    if (controlsDisabled) {
      return;
    }

    onActivateExercise?.();

    if (field === 'reps') {
      setRepsDraft(formatEditableNumber(currentReps));
    } else {
      setWeightDraft(formatEditableNumber(currentWeight));
    }

    setEditingField(field);
  }, [controlsDisabled, currentReps, currentWeight, onActivateExercise]);

  const markSkipBlur = useCallback((field: Exclude<EditingField, null>) => {
    skipBlurFieldRef.current = field;

    setTimeout(() => {
      if (skipBlurFieldRef.current === field) {
        skipBlurFieldRef.current = null;
      }
    }, 0);
  }, []);

  const finalizeRepsDraft = useCallback(() => {
    if (editingField !== 'reps') {
      return;
    }

    const parsedValue = parseIntegerDraft(repsDraft);
    if (parsedValue == null) {
      setRepsDraft(formatEditableNumber(currentReps));
      setEditingField(null);
      return;
    }

    const nextReps = Math.max(1, parsedValue);
    setRepsDraft(formatEditableNumber(nextReps));
    setEditingField(null);
    onRepsCommit?.(nextReps);
  }, [currentReps, editingField, onRepsCommit, repsDraft]);

  const handleRepsBlur = useCallback(() => {
    if (skipBlurFieldRef.current === 'reps') {
      skipBlurFieldRef.current = null;
      return;
    }

    finalizeRepsDraft();
  }, [finalizeRepsDraft]);

  const handleRepsSubmit = useCallback(() => {
    markSkipBlur('reps');
    finalizeRepsDraft();
  }, [finalizeRepsDraft, markSkipBlur]);

  const finalizeWeightDraft = useCallback(() => {
    if (editingField !== 'weight') {
      return;
    }

    const parsedValue = parseDecimalDraft(weightDraft);
    if (parsedValue == null) {
      setWeightDraft(formatEditableNumber(currentWeight));
      setEditingField(null);
      return;
    }

    const nextWeight = Math.max(0, parsedValue);
    setWeightDraft(formatEditableNumber(nextWeight));
    setEditingField(null);
    onWeightCommit?.(nextWeight);
  }, [currentWeight, editingField, onWeightCommit, weightDraft]);

  const handleWeightBlur = useCallback(() => {
    if (skipBlurFieldRef.current === 'weight') {
      skipBlurFieldRef.current = null;
      return;
    }

    finalizeWeightDraft();
  }, [finalizeWeightDraft]);

  const handleWeightSubmit = useCallback(() => {
    markSkipBlur('weight');
    finalizeWeightDraft();
  }, [finalizeWeightDraft, markSkipBlur]);

  const handleRepsStep = useCallback((delta: number) => {
    if (editingField === 'reps') {
      markSkipBlur('reps');
      const nextReps = Math.max(1, (parseIntegerDraft(repsDraft) ?? currentReps) + delta);
      setRepsDraft(formatEditableNumber(nextReps));
      setEditingField(null);
      onRepsCommit?.(nextReps);
      return;
    }

    onRepsChange(delta);
  }, [currentReps, editingField, markSkipBlur, onRepsChange, onRepsCommit, repsDraft]);

  const handleWeightStep = useCallback((delta: number) => {
    if (editingField === 'weight') {
      markSkipBlur('weight');
      const nextWeight = Math.max(0, (parseDecimalDraft(weightDraft) ?? currentWeight) + delta);
      setWeightDraft(formatEditableNumber(nextWeight));
      setEditingField(null);
      onWeightCommit?.(nextWeight);
      return;
    }

    onWeightChange(delta);
  }, [currentWeight, editingField, markSkipBlur, onWeightChange, onWeightCommit, weightDraft]);

  return (
    <View style={styles.container}>
      <View style={styles.cardBase}>
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
              <Image
                source={require('../../../assets/exercise-placeholder.png')}
                style={styles.exerciseImage}
                resizeMode="cover"
              />
            )}
          </MaskedView>
        </View>

        {hasVideo ? (
          <TouchableOpacity
            style={styles.playButton}
            onPress={handleVideoPress}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={18} color={colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.playButton, styles.youtubeButton]}
            onPress={() => setShowYouTubeModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-youtube" size={20} color={colors.white} />
          </TouchableOpacity>
        )}

        <View style={styles.infoAreaContainer}>
          <MaskedView
            style={styles.infoMaskContainer}
            maskElement={<InfoMask />}
          >
            <View style={styles.infoBackground} />
          </MaskedView>
        </View>

        <View style={styles.infoArea}>
          <View style={styles.infoContent}>
            <View style={styles.orderBadge}>
              <Text style={styles.orderBadgeText}>{exerciseNumber}/{totalExercises}</Text>
            </View>

            <Text style={styles.exerciseName} numberOfLines={2}>
              {exerciseName}
            </Text>

            {isCardio ? (
              <View style={styles.cardioSection}>
                <View style={styles.cardioBadgeRow}>
                  <View style={styles.cardioBadge}>
                    <Ionicons name="pulse-outline" size={12} color={theme.colors.primary} />
                    <Text style={styles.cardioBadgeText}>{cardioProtocolLabel}</Text>
                  </View>
                  {cardioZoneLabel ? (
                    <View style={styles.cardioZoneBadge}>
                      <Text style={styles.cardioZoneBadgeText}>{cardioZoneLabel}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.cardioSummary}>{cardioSummaryLabel}</Text>

                <View style={styles.cardioMetrics}>
                  {cardioMetrics.map((metric) => (
                    <View key={metric.key} style={styles.cardioMetricRow}>
                      <Text style={styles.cardioMetricLabel}>{metric.label}</Text>
                      <Text style={styles.cardioMetricValue}>{metric.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <>
                <View style={styles.controlRow}>
                  <TouchableOpacity
                    onPress={() => handleRepsStep(-1)}
                    style={styles.controlButton}
                    disabled={controlsDisabled}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={22}
                      color={controlAccentColor}
                    />
                  </TouchableOpacity>
                  {editingField === 'reps' && isActive ? (
                    <View style={[styles.valueContainer, styles.valueContainerEditing]}>
                      <TextInput
                        ref={repsInputRef}
                        value={repsDraft}
                        onChangeText={(value) => setRepsDraft(sanitizeIntegerDraft(value))}
                        style={styles.valueInput}
                        keyboardType="number-pad"
                        returnKeyType="done"
                        blurOnSubmit
                        onBlur={handleRepsBlur}
                        onSubmitEditing={handleRepsSubmit}
                        selectTextOnFocus
                      />
                      <Text style={styles.valueLabel}>
                        Rep {dayExercise.reps_min} a {dayExercise.reps_max}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.valueContainer, styles.editableValueContainer]}
                      activeOpacity={0.8}
                      onPress={() => handleStartEditing('reps')}
                      disabled={controlsDisabled}
                    >
                      <Text style={[styles.valueNumber, !showControls && styles.valueDimmed]}>
                        {currentReps}
                      </Text>
                      <Text style={styles.valueLabel}>
                        Rep {dayExercise.reps_min} a {dayExercise.reps_max}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleRepsStep(1)}
                    style={styles.controlButton}
                    disabled={controlsDisabled}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={22}
                      color={controlAccentColor}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                <View style={styles.controlRow}>
                  <TouchableOpacity
                    onPress={() => handleWeightStep(-2.5)}
                    style={styles.controlButton}
                    disabled={controlsDisabled}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={22}
                      color={controlAccentColor}
                    />
                  </TouchableOpacity>
                  {editingField === 'weight' && isActive ? (
                    <View style={[styles.valueContainer, styles.valueContainerEditing]}>
                      <TextInput
                        ref={weightInputRef}
                        value={weightDraft}
                        onChangeText={(value) => setWeightDraft(sanitizeDecimalDraft(value))}
                        style={styles.valueInput}
                        keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                        returnKeyType="done"
                        blurOnSubmit
                        onBlur={handleWeightBlur}
                        onSubmitEditing={handleWeightSubmit}
                        selectTextOnFocus
                      />
                      <Text style={styles.valueLabel}>Peso (kg)</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.valueContainer, styles.editableValueContainer]}
                      activeOpacity={0.8}
                      onPress={() => handleStartEditing('weight')}
                      disabled={controlsDisabled}
                    >
                      <Text style={[styles.valueNumber, !showControls && styles.valueDimmed]}>
                        {formatEditableNumber(currentWeight)} kg
                      </Text>
                      <Text style={styles.valueLabel}>Peso (kg)</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => handleWeightStep(2.5)}
                    style={styles.controlButton}
                    disabled={controlsDisabled}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={22}
                      color={controlAccentColor}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {isEffortEditable ? (
                  <View style={styles.controlRow}>
                    <TouchableOpacity
                      onPress={() => onEffortChange?.(-0.5)}
                      style={styles.controlButton}
                      disabled={controlsDisabled || !onEffortChange}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={22}
                        color={controlAccentColor}
                      />
                    </TouchableOpacity>
                    <View style={styles.valueContainer}>
                      <Text style={[styles.effortValueText, !showControls && styles.valueDimmed]}>
                        {currentEffortLabel}
                      </Text>
                      <Text style={styles.valueLabel}>Intensidad de la serie</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => onEffortChange?.(0.5)}
                      style={styles.controlButton}
                      disabled={controlsDisabled || !onEffortChange}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={22}
                        color={controlAccentColor}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.controlRow, styles.readOnlyControlRow]}>
                    <View style={styles.readOnlyValueContainer}>
                      <Text style={styles.effortValueText}>{targetEffortLabel}</Text>
                      <Text style={styles.valueLabel}>Intensidad objetivo</Text>
                    </View>
                  </View>
                )}
              </>
            )}

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
                        return isFirstSet
                          ? 'Iniciar ejercicio'
                          : `Iniciar ${unitLabel} ${currentSetNumber}`;
                      }

                      return isLastSet
                        ? 'Finalizar ejercicio'
                        : `Finalizar ${unitLabel} ${currentSetNumber}`;
                    })()}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {canEditCompletedExercise && !isEditing && (
            <TouchableOpacity
              style={styles.completedOverlayTouchable}
              activeOpacity={0.9}
              onPress={() => setIsEditing(true)}
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
            </TouchableOpacity>
          )}

          {canEditCompletedExercise && isEditing && (
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

      <View style={styles.setChipSection}>
        <View style={styles.setChipList}>
          {Array.from({ length: dayExercise.sets }, (_, index) => {
            const setNumber = index + 1;
            const setLog = setLogsByNumber.get(setNumber);
            const isSetCompleted = setNumber <= progress.completed_sets;
            const isCurrentSet = showCurrentSetChip && setNumber === currentSetNumber;
            const chipLabel = isCardio
              ? cardioSummaryLabel
              : isSetCompleted
                ? formatEffortValue(
                    dayExercise.effort_type,
                    setLog?.effort_value ?? dayExercise.effort_value,
                  )
                : isCurrentSet
                  ? currentEffortLabel
                  : targetEffortLabel;

            return (
              <TouchableOpacity
                key={setNumber}
                style={[
                  styles.setChip,
                  isSetCompleted && styles.setChipCompleted,
                  isCurrentSet && styles.setChipCurrent,
                  isCurrentSet && setInProgress && styles.setChipInProgress,
                ]}
                activeOpacity={0.85}
                disabled={!onSelectSet}
                onPress={() => onSelectSet?.(setNumber)}
                onLongPress={() => {
                  if (isSetCompleted && !readOnly) {
                    onDeleteSet?.(setNumber);
                  }
                }}
              >
                <View style={styles.setChipHeader}>
                  <Text
                    style={[
                      styles.setChipTitle,
                      isSetCompleted && styles.setChipTitleCompleted,
                      isCurrentSet && styles.setChipTitleCurrent,
                    ]}
                  >
                    {isCardio ? `B${setNumber}` : `S${setNumber}`}
                  </Text>
                  {isSetCompleted ? (
                    <Ionicons name="checkmark-circle" size={14} color={theme.colors.primary} />
                  ) : isCurrentSet && setInProgress ? (
                    <Ionicons name="timer-outline" size={14} color={theme.colors.primary} />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.setChipEffort,
                    isSetCompleted && styles.setChipEffortCompleted,
                    isCurrentSet && styles.setChipEffortCurrent,
                  ]}
                >
                  {chipLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.setIndicatorText}>
          {currentUnitLabel} {currentSetNumber}/{dayExercise.sets}
        </Text>
      </View>

      {hasVideo && videoUrl && (
        <VideoPlayerModal
          visible={showVideoModal}
          videoUri={videoUrl}
          exerciseName={exerciseName}
          onClose={() => setShowVideoModal(false)}
        />
      )}

      {!hasVideo && (
        <YouTubePlayerModal
          visible={showYouTubeModal}
          exerciseName={exerciseName}
          searchName={exercise?.name_en}
          onClose={() => setShowYouTubeModal(false)}
        />
      )}
    </View>
  );
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  cardBase: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
    ...shadows.md,
  },
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
  playButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    zIndex: 100,
    elevation: 5,
  },
  youtubeButton: {
    backgroundColor: YOUTUBE_RED,
  },
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
    backgroundColor: theme.colors.card,
  },
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
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: theme.colors.surfaceAlt,
  },
  orderBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  exerciseName: {
    maxWidth: '85%',
    marginBottom: spacing.xs,
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  cardioSection: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  cardioBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  cardioBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: theme.colors.primarySoft,
  },
  cardioBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  cardioZoneBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardioZoneBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  cardioSummary: {
    marginTop: spacing.sm,
    fontSize: fontSize.base,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  cardioMetrics: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  cardioMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cardioMetricLabel: {
    fontSize: fontSize.xs,
    color: theme.colors.textMuted,
  },
  cardioMetricValue: {
    marginLeft: spacing.sm,
    flex: 1,
    textAlign: 'right',
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: spacing.xs,
  },
  readOnlyControlRow: {
    justifyContent: 'center',
  },
  controlButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContainer: {
    alignItems: 'center',
    minWidth: 84,
  },
  editableValueContainer: {
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
  },
  valueContainerEditing: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1,
    borderColor: theme.colors.primaryBorder,
    borderRadius: borderRadius.md,
  },
  readOnlyValueContainer: {
    alignItems: 'center',
    minWidth: 120,
  },
  valueInput: {
    minWidth: 72,
    paddingVertical: 0,
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  valueNumber: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  effortValueText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  valueDimmed: {
    color: theme.colors.textMuted,
  },
  valueLabel: {
    marginTop: 1,
    fontSize: fontSize.xs,
    color: theme.colors.textMuted,
  },
  divider: {
    width: '70%',
    height: 1,
    marginVertical: spacing.xs,
    backgroundColor: theme.colors.border,
  },
  nextButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.white,
  },
  completedOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    overflow: 'hidden',
    borderTopLeftRadius: borderRadius.xl,
    borderBottomLeftRadius: borderRadius.xl,
  },
  blurView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.isDark ? 'rgba(8, 17, 31, 0.82)' : 'rgba(59, 130, 246, 0.65)',
  },
  completedOverlayContent: {
    alignItems: 'center',
  },
  checkCircle: {
    width: 56,
    height: 56,
    marginBottom: spacing.sm,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  completedText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.white,
  },
  tapToEditText: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  editingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.xl,
    zIndex: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
  },
  editingBadgeText: {
    marginLeft: 4,
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.white,
  },
  setChipSection: {
    marginTop: spacing.sm,
  },
  setChipList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  setChip: {
    minWidth: 72,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...shadows.sm,
  },
  setChipCompleted: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primaryBorder,
  },
  setChipCurrent: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
  },
  setChipInProgress: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  setChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  setChipTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  setChipTitleCompleted: {
    color: theme.colors.primary,
  },
  setChipTitleCurrent: {
    color: theme.colors.primary,
  },
  setChipEffort: {
    marginTop: 2,
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  setChipEffortCompleted: {
    color: theme.colors.primary,
  },
  setChipEffortCurrent: {
    color: theme.colors.primary,
  },
  setIndicatorText: {
    marginTop: spacing.sm,
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
});
