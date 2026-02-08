/**
 * Video Player Component
 *
 * 2026 UX: TikTok-style short-form video player
 * For place preview videos and parent reviews
 */

import { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { COPY } from '@/app/copy/copy.ko';
import { getVideoPlayerLabel, getVideoControlLabel } from '@/app/utils/accessibility';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = SCREEN_WIDTH * (16 / 9); // 16:9 aspect ratio

export interface VideoPlayerProps {
  videoId: string; // YouTube video ID
  title?: string;
  author?: string;
  onPlayPress?: () => void;
  onClose?: () => void;
  autoPlay?: boolean;
}

export default function VideoPlayer({
  videoId,
  title,
  author,
  onPlayPress,
  onClose,
  autoPlay = false,
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [hasError, setHasError] = useState(false);
  const webviewRef = useRef<WebView>(null);

  const handlePlayPress = useCallback(() => {
    setIsPlaying(true);
    onPlayPress?.();
  }, [onPlayPress]);

  const handleClosePress = useCallback(() => {
    setIsPlaying(false);
    onClose?.();
  }, [onClose]);

  // YouTube embed HTML
  const videoHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; }
          body { background: #000; overflow: hidden; }
          #player { width: 100vw; height: 100vh; }
          iframe { width: 100%; height: 100%; border: none; }
        </style>
      </head>
      <body>
        <div id="player">
          <iframe
            src="https://www.youtube.com/embed/${videoId}?autoplay=${isPlaying ? 1 : 0}&controls=1&rel=0&modestbranding=1&playsinline=1"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {!isPlaying ? (
        <TamaguiPressableScale
          style={styles.thumbnailContainer}
          onPress={handlePlayPress}
          hapticType="medium"
          accessibilityLabel={getVideoPlayerLabel({ title, isPlaying: false })}
          accessibilityHint={COPY.A11Y_PLAY_VIDEO}
        >
          {/* YouTube thumbnail as background */}
          <View style={styles.thumbnail}>
            {/* Play button overlay */}
            <View
              style={styles.playButtonContainer}
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
            >
              <View style={styles.playButton}>
                <Ionicons
                  name="play"
                  size={40}
                  color={Colors.white}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no"
                />
              </View>
            </View>

            {/* Video info overlay */}
            {(title || author) && (
              <View style={styles.infoOverlay}>
                {title && (
                  <TamaguiText
                    preset="body"
                    textColor="inverse"
                    weight="semibold"
                    style={styles.videoTitle}
                    numberOfLines={2}
                  >
                    {title}
                  </TamaguiText>
                )}
                {author && (
                  <TamaguiText preset="body" style={styles.videoAuthor}>
                    {author}
                  </TamaguiText>
                )}
              </View>
            )}
          </View>
        </TamaguiPressableScale>
      ) : (
        <View style={styles.videoContainer}>
          {/* Close button */}
          {onClose && (
            <TamaguiPressableScale
              style={styles.closeButton}
              onPress={handleClosePress}
              hapticType="light"
              accessibilityLabel={getVideoControlLabel('close')}
              accessibilityHint={COPY.A11Y_CLOSE_PLAYER}
            >
              <Ionicons
                name="close-circle"
                size={32}
                color={Colors.white}
                accessibilityElementsHidden={true}
                importantForAccessibility="no"
              />
            </TamaguiPressableScale>
          )}

          {/* Video player */}
          {hasError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={Colors.gray400} />
              <TamaguiText preset="body" style={styles.errorText}>
                Video unavailable
              </TamaguiText>
              <TamaguiPressableScale
                style={styles.retryButton}
                hapticType="light"
                onPress={() => setHasError(false)}
                accessibilityLabel={COPY.A11Y_RETRY_VIDEO}
              >
                <TamaguiText
                  preset="body"
                  textColor="inverse"
                  weight="semibold"
                  style={styles.retryText}
                >
                  Retry
                </TamaguiText>
              </TamaguiPressableScale>
            </View>
          ) : (
            <WebView
              ref={webviewRef}
              source={{ html: videoHtml }}
              style={styles.webview}
              allowsFullscreenVideo
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled
              domStorageEnabled
              onError={() => setHasError(true)}
              onHttpError={() => setHasError(true)}
              renderError={() => (
                <View style={styles.errorContainer}>
                  <Ionicons name="wifi-outline" size={48} color={Colors.gray400} />
                  <TamaguiText preset="body" style={styles.errorText}>
                    Network error
                  </TamaguiText>
                </View>
              )}
              accessible={true}
              accessibilityLabel={getVideoPlayerLabel({ title, isPlaying: true })}
              accessibilityHint="Video player, swipe to interact"
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: VIDEO_HEIGHT,
    backgroundColor: Colors.black,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailContainer: {
    width: '100%',
    height: '100%',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.gray800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.blackAlpha70,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: Colors.blackAlpha50,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  videoAuthor: {
    fontSize: 13,
    color: Colors.gray300,
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    ...Shadows.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray900,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.gray400,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});
