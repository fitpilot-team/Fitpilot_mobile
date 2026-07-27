import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { borderRadius, fontSize, spacing } from '../../constants/colors';
import { useAppTheme, useThemedStyles } from '../../theme';
import type { ChatAttachment } from '../../types/chat';

type AudioMessagePlayerProps = {
  attachment: ChatAttachment;
  isMine: boolean;
  isActive: boolean;
  onActiveChange: (attachmentId: number | null) => void;
  onDownload: (attachment: ChatAttachment) => void;
};

const formatAudioTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const roundedSeconds = Math.floor(seconds);
  const minutes = Math.floor(roundedSeconds / 60);
  return `${minutes}:${String(roundedSeconds % 60).padStart(2, '0')}`;
};

const getAudioDisplayName = (name?: string | null) => {
  const trimmedName = name?.trim();
  if (!trimmedName || /^nota-voz-\d+/i.test(trimmedName)) {
    return 'Nota de voz';
  }

  return trimmedName;
};

export function AudioMessagePlayer({
  attachment,
  isMine,
  isActive,
  onActiveChange,
  onDownload,
}: AudioMessagePlayerProps) {
  const { theme } = useAppTheme();
  const styles = useThemedStyles(createStyles);
  const [progressWidth, setProgressWidth] = useState(0);
  const player = useAudioPlayer(
    attachment.url ? { uri: attachment.url } : null,
    { updateInterval: 200 },
  );
  const status = useAudioPlayerStatus(player);

  const duration = useMemo(() => {
    if (Number.isFinite(status.duration) && status.duration > 0) {
      return status.duration;
    }

    return attachment.duration_seconds && attachment.duration_seconds > 0
      ? attachment.duration_seconds
      : 0;
  }, [attachment.duration_seconds, status.duration]);

  const currentTime = Math.max(
    0,
    duration > 0 ? Math.min(status.currentTime, duration) : status.currentTime,
  );
  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const canPlay = Boolean(attachment.url);
  const canSeek = canPlay && duration > 0;
  const title = !canPlay
    ? 'Audio no disponible'
    : status.isBuffering
      ? 'Cargando audio…'
      : getAudioDisplayName(attachment.file_name);

  useEffect(() => {
    if (!isActive && status.playing) {
      player.pause();
    }
  }, [isActive, player, status.playing]);

  useEffect(() => {
    if (isActive && status.didJustFinish) {
      onActiveChange(null);
    }
  }, [isActive, onActiveChange, status.didJustFinish]);

  const togglePlayback = async () => {
    if (!canPlay) {
      return;
    }

    if (status.playing) {
      player.pause();
      onActiveChange(null);
      return;
    }

    if (status.didJustFinish || (duration > 0 && currentTime >= duration - 0.1)) {
      await player.seekTo(0);
    }

    onActiveChange(attachment.id);
    player.play();
  };

  const seekToRatio = (ratio: number) => {
    if (!canSeek) {
      return;
    }

    const nextTime = duration * Math.max(0, Math.min(1, ratio));
    void player.seekTo(nextTime);
  };

  const handleProgressPress = (event: GestureResponderEvent) => {
    if (!progressWidth) {
      return;
    }

    seekToRatio(event.nativeEvent.locationX / progressWidth);
  };

  return (
    <View
      style={[
        styles.container,
        isMine ? styles.containerMine : null,
        !canPlay ? styles.containerUnavailable : null,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          !canPlay
            ? 'Audio no disponible'
            : status.playing
              ? 'Pausar nota de voz'
              : 'Reproducir nota de voz'
        }
        accessibilityState={{ disabled: !canPlay }}
        disabled={!canPlay}
        onPress={() => {
          void togglePlayback();
        }}
        style={({ pressed }) => [
          styles.controlButton,
          isMine ? styles.controlButtonMine : null,
          pressed ? styles.controlButtonPressed : null,
          !canPlay ? styles.controlButtonDisabled : null,
        ]}
      >
        {status.isBuffering && canPlay ? (
          <ActivityIndicator
            size="small"
            color={isMine ? '#08111f' : theme.colors.primary}
          />
        ) : (
          <Ionicons
            name={status.playing ? 'pause' : 'play'}
            size={18}
            color={
              !canPlay
                ? theme.colors.iconMuted
                : isMine
                  ? '#08111f'
                  : theme.colors.primary
            }
          />
        )}
      </Pressable>

      <View style={styles.content}>
        <Text
          numberOfLines={1}
          style={[styles.title, isMine ? styles.titleMine : null]}
        >
          {title}
        </Text>
        <View style={styles.progressRow}>
          <Pressable
            accessibilityRole="adjustable"
            accessibilityLabel="Progreso de la nota de voz"
            accessibilityValue={{
              min: 0,
              max: Math.max(1, Math.round(duration)),
              now: Math.round(currentTime),
              text:
                duration > 0
                  ? `${formatAudioTime(currentTime)} de ${formatAudioTime(duration)}`
                  : 'Duración no disponible',
            }}
            accessibilityActions={[
              { name: 'decrement', label: 'Retroceder 10 segundos' },
              { name: 'increment', label: 'Adelantar 10 segundos' },
            ]}
            disabled={!canSeek}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === 'increment') {
                seekToRatio((currentTime + 10) / duration);
              } else if (event.nativeEvent.actionName === 'decrement') {
                seekToRatio((currentTime - 10) / duration);
              }
            }}
            onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)}
            onPress={handleProgressPress}
            style={[
              styles.progressTrack,
              isMine ? styles.progressTrackMine : null,
            ]}
          >
            <View
              style={[
                styles.progressFill,
                isMine ? styles.progressFillMine : null,
                { width: `${progress * 100}%` },
              ]}
            />
          </Pressable>
          <Text
            style={[styles.time, isMine ? styles.timeMine : null]}
            numberOfLines={1}
          >
            {formatAudioTime(currentTime)} / {duration > 0 ? formatAudioTime(duration) : '--:--'}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Descargar nota de voz"
        accessibilityState={{ disabled: !canPlay }}
        disabled={!canPlay}
        onPress={() => onDownload(attachment)}
        style={({ pressed }) => [
          styles.controlButton,
          isMine ? styles.controlButtonMine : null,
          pressed ? styles.controlButtonPressed : null,
          !canPlay ? styles.controlButtonDisabled : null,
        ]}
      >
        <Ionicons
          name="download-outline"
          size={19}
          color={
            canPlay
              ? isMine
                ? '#08111f'
                : theme.colors.primary
              : theme.colors.iconMuted
          }
        />
      </Pressable>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>['theme']) =>
  StyleSheet.create({
    container: {
      width: '100%',
      minHeight: 60,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: theme.colors.primaryBorder,
      borderRadius: borderRadius.lg,
      backgroundColor: theme.colors.surfaceAlt,
      padding: spacing.xs,
    },
    containerMine: {
      borderColor: 'rgba(8,17,31,0.18)',
      backgroundColor: 'rgba(255,255,255,0.22)',
    },
    containerUnavailable: {
      opacity: 0.72,
    },
    controlButton: {
      width: 44,
      height: 44,
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primarySoft,
    },
    controlButtonMine: {
      backgroundColor: 'rgba(8,17,31,0.12)',
    },
    controlButtonPressed: {
      opacity: 0.68,
    },
    controlButtonDisabled: {
      backgroundColor: theme.colors.surface,
    },
    content: {
      minWidth: 0,
      flex: 1,
      gap: 5,
    },
    title: {
      color: theme.colors.textPrimary,
      fontSize: fontSize.xs,
      fontWeight: '800',
    },
    titleMine: {
      color: '#08111f',
    },
    progressRow: {
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    progressTrack: {
      height: 16,
      minWidth: 24,
      flex: 1,
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.border,
    },
    progressTrackMine: {
      backgroundColor: 'rgba(8,17,31,0.18)',
    },
    progressFill: {
      height: 4,
      borderRadius: borderRadius.full,
      backgroundColor: theme.colors.primary,
    },
    progressFillMine: {
      backgroundColor: '#08111f',
    },
    time: {
      flexShrink: 0,
      color: theme.colors.textMuted,
      fontSize: 9,
      fontWeight: '800',
    },
    timeMine: {
      color: 'rgba(8,17,31,0.66)',
    },
  });
