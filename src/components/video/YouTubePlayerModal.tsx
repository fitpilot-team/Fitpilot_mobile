import React, { useState, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { colors, spacing, fontSize, borderRadius } from '../../constants/colors';

interface YouTubePlayerModalProps {
  visible: boolean;
  exerciseName: string;
  searchName?: string;
  youtubeUrl?: string | null;
  onClose: () => void;
}

const YOUTUBE_RED = '#FF0000';

/**
 * Builds a YouTube search URL from the exercise name.
 * Uses the English name (searchName) for better results since
 * YouTube has far more fitness content in English.
 * Falls back to exerciseName (Spanish) if searchName is not provided.
 */
const getYouTubeUrl = (
  exerciseName: string,
  searchName?: string,
  youtubeUrl?: string | null,
): string => {
  if (youtubeUrl) return youtubeUrl;
  const name = searchName || exerciseName;
  const query = encodeURIComponent(`${name} exercise tutorial proper form`);
  return `https://m.youtube.com/results?search_query=${query}`;
};

export const YouTubePlayerModal: React.FC<YouTubePlayerModalProps> = ({
  visible,
  exerciseName,
  searchName,
  youtubeUrl,
  onClose,
}) => {
  const { width, height } = useWindowDimensions();
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const url = getYouTubeUrl(exerciseName, searchName, youtubeUrl);

  const handleClose = useCallback(() => {
    setIsLoading(true);
    onClose();
  }, [onClose]);

  const handleOpenExternal = useCallback(() => {
    Linking.openURL(url);
  }, [url]);

  // Height: 75% of screen for more immersive YouTube experience
  const modalHeight = height * 0.75;

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

        {/* Player container */}
        <View style={[styles.playerContainer, { height: modalHeight }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Ionicons name="logo-youtube" size={20} color={YOUTUBE_RED} />
              <Text style={styles.title} numberOfLines={1}>
                {exerciseName}
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={handleOpenExternal}
                style={styles.headerButton}
              >
                <Ionicons
                  name="open-outline"
                  size={20}
                  color={colors.white}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* WebView */}
          <View style={styles.webViewContainer}>
            {visible && (
              <WebView
                ref={webViewRef}
                source={{ uri: url }}
                style={styles.webView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                allowsFullscreenVideo={true}
              />
            )}

            {/* Loading overlay */}
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={YOUTUBE_RED} />
                <Text style={styles.loadingText}>Buscando videos...</Text>
              </View>
            )}
          </View>

          {/* Bottom hint bar */}
          <View style={styles.bottomHint}>
            <Ionicons name="search-outline" size={16} color={colors.gray[400]} />
            <Text style={styles.bottomHintText}>
              Búsqueda automática en YouTube
            </Text>
          </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
  webViewContainer: {
    flex: 1,
    backgroundColor: colors.gray[900],
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.gray[900],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.gray[400],
    fontSize: fontSize.sm,
  },
  bottomHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.gray[800],
  },
  bottomHintText: {
    color: colors.gray[400],
    fontSize: fontSize.sm,
  },
});
