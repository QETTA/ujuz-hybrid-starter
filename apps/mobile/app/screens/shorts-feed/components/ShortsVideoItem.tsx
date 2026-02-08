/**
 * ShortsVideoItem Component
 *
 * Individual video item in the shorts feed - Full screen TikTok style
 */

import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';
import type { ShortsScreenNavigationProp } from '@/app/types/navigation';
import { useDoubleTap } from '../hooks/useDoubleTap';
import { useVideoActions } from '../hooks/useVideoActions';
import { LikeAnimation } from './LikeAnimation';
import { VideoOverlay } from './VideoOverlay';
import type { ShortsVideo } from '../types';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface ShortsVideoItemProps {
  video: ShortsVideo;
  isActive: boolean;
  navigation: ShortsScreenNavigationProp;
}

export const ShortsVideoItem = React.memo(function ShortsVideoItem({
  video,
  isActive,
  navigation,
}: ShortsVideoItemProps) {
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { liked, saved, handleLike, handleComment, handleShare, handleSave } =
    useVideoActions(video);

  const handleDoubleTapLike = () => {
    if (!liked) {
      handleLike();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setShowLikeAnimation(true);
    }
  };

  const handleDoubleTap = useDoubleTap(handleDoubleTapLike);

  const handleVisitPlace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Map');
  };

  // Full-screen YouTube embed HTML
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
            src="https://www.youtube.com/embed/${video.youtubeId}?autoplay=${isActive ? 1 : 0}&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&mute=0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </body>
    </html>
  `;

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityLabel={`${video.author} 님의 영상: ${video.title}. 좋아요 ${video.likes}개. 두 번 탭하여 좋아요.`}
      accessibilityHint={COPY.A11Y_VIDEO_CONTROLS}
      accessibilityRole="none"
    >
      {/* Full-screen Video Background */}
      {hasError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="videocam-off-outline" size={64} color={Colors.gray500} />
          <Text style={styles.errorText}>{COPY.VIDEO_UNAVAILABLE}</Text>
        </View>
      ) : (
        <WebView
          source={{ html: videoHtml }}
          style={styles.video}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          onError={() => setHasError(true)}
          onHttpError={() => setHasError(true)}
          scrollEnabled={false}
          bounces={false}
        />
      )}

      {/* Like Animation */}
      <LikeAnimation show={showLikeAnimation} onComplete={() => setShowLikeAnimation(false)} />

      {/* Overlay UI */}
      <VideoOverlay
        video={video}
        liked={liked}
        saved={saved}
        onDoubleTap={handleDoubleTap}
        onLike={handleLike}
        onComment={handleComment}
        onShare={handleShare}
        onSave={handleSave}
        onVisitPlace={handleVisitPlace}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT,
    width: SCREEN_WIDTH,
    position: 'relative',
    backgroundColor: Colors.black,
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.black,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.black,
  },
  errorText: {
    color: Colors.gray500,
    fontSize: 16,
    marginTop: 12,
  },
});
