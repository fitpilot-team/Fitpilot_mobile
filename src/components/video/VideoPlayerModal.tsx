import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, spacing, fontSize, borderRadius } from '../../constants/colors';

interface VideoPlayerModalProps {
  visible: boolean;
  videoUri: string;
  exerciseName: string;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  visible,
  videoUri,
  exerciseName,
  onClose,
}) => {
  const { width } = useWindowDimensions();
  const videoRef = useRef<VideoView>(null);
  const [isInFullscreen, setIsInFullscreen] = useState(false);

  const player = useVideoPlayer(visible ? videoUri : null, (player) => {
    player.loop = true;
    player.muted = false;
  });

  useEffect(() => {
    if (visible && player) {
      const timer = setTimeout(() => player.play(), 100);
      return () => clearTimeout(timer);
    }
  }, [visible, player]);

  useEffect(() => {
    if (!visible && player) {
      player.pause();
    }
  }, [visible, player]);

  // Reset fullscreen state when modal closes
  useEffect(() => {
    if (!visible) {
      setIsInFullscreen(false);
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    player?.pause();
    onClose();
  }, [player, onClose]);

  // Entrar a fullscreen nativo (con rotación automática)
  const handleEnterFullscreen = useCallback(() => {
    videoRef.current?.enterFullscreen();
  }, []);

  // Mini player dimensions (estilo YouTube)
  const miniVideoWidth = width;
  const miniVideoHeight = width * (9 / 16); // 16:9 aspect ratio

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent
      onRequestClose={handleClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.overlay}>
        {/* Tappable background to close */}
        <Pressable style={styles.backdrop} onPress={handleClose} />

        {/* Mini player container */}
        <View style={styles.playerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Ionicons name="fitness-outline" size={18} color={colors.white} />
              <Text style={styles.title} numberOfLines={1}>{exerciseName}</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={handleEnterFullscreen}
                style={styles.headerButton}
              >
                <Ionicons
                  name="expand-outline"
                  size={22}
                  color={colors.white}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Video Player */}
          <View style={[styles.videoContainer, { height: miniVideoHeight }]}>
            {player && (
              <VideoView
                ref={videoRef}
                style={{ width: miniVideoWidth, height: miniVideoHeight }}
                player={player}
                nativeControls={true}
                contentFit="contain"
                onFullscreenEnter={() => setIsInFullscreen(true)}
                onFullscreenExit={() => setIsInFullscreen(false)}
              />
            )}
          </View>

          {/* Bottom bar with expand hint */}
          <TouchableOpacity
            style={styles.expandHint}
            onPress={handleEnterFullscreen}
          >
            <Ionicons name="expand-outline" size={20} color={colors.gray[400]} />
            <Text style={styles.expandHintText}>Pantalla completa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  playerContainer: {
    backgroundColor: colors.gray[900],
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.gray[800],
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerButton: {
    padding: spacing.xs,
  },
  videoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray[900],
  },
  expandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.gray[800],
  },
  expandHintText: {
    color: colors.gray[400],
    fontSize: fontSize.sm,
  },
});
