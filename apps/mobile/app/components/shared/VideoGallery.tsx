/**
 * VideoGallery Component
 *
 * Design Philosophy (iOS 26 + 2026 Trends):
 * - Horizontal TikTok-style scroll layout
 * - Glassmorphism thumbnails with subtle depth
 * - Typography-first: minimal icons, clear duration labels
 * - Muted color palette for inactive states
 * - Smooth 60fps scroll animations
 *
 * UX Pattern (Kakao Map inspired):
 * - 3:4 aspect ratio thumbnails (shorts format)
 * - Auto-play on tap, full-screen modal
 * - Integration with PlaceDetailSheet bottom overlay
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/app/constants/Colors';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface VideoItem {
  id: string;
  thumbnailUrl: string;
  videoUrl?: string;
  youtubeId?: string;
  duration: number; // seconds
  title: string;
  viewCount?: number;
}

interface VideoGalleryProps {
  videos: VideoItem[];
  placeName?: string;
  autoPlay?: boolean;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatViewCount = (count?: number): string => {
  if (!count) return '';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

const VideoGallery: React.FC<VideoGalleryProps> = ({
  videos,
  placeName,
  autoPlay: _autoPlay = false,
}) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleVideoPress = (video: VideoItem) => {
    setSelectedVideo(video);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setTimeout(() => setSelectedVideo(null), 300);
  };

  if (videos.length === 0) return null;

  return (
    <>
      <View style={styles.container}>
        {/* Typography-first header - no emoji */}
        <View style={styles.header}>
          <TamaguiText
            preset="body"
            textColor="primary"
            weight="semibold"
            style={styles.headerTitle}
          >
            영상
          </TamaguiText>
          <View style={styles.countBadge}>
            <TamaguiText
              preset="caption"
              textColor="inverse"
              weight="semibold"
              style={styles.countText}
            >
              {videos.length}
            </TamaguiText>
          </View>
        </View>

        {/* Horizontal scroll gallery */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
          snapToInterval={THUMBNAIL_WIDTH + 12}
          snapToAlignment="start"
        >
          {videos.map((video, index) => (
            <TamaguiPressableScale
              key={video.id}
              onPress={() => handleVideoPress(video)}
              style={[styles.thumbnailContainer, index === 0 && styles.firstThumbnail]}
              hapticType="light"
              accessibilityLabel={`영상 재생: ${video.title || '선택한 영상'}`}
            >
              {/* Thumbnail with glassmorphism overlay */}
              <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnail} />

              {/* Glassmorphism gradient overlay */}
              <View style={styles.overlay}>
                {/* Play icon - centered */}
                <View style={styles.playIconContainer}>
                  <Ionicons name="play" size={32} color={Colors.white} />
                </View>

                {/* Duration badge - bottom right */}
                <View style={styles.durationBadge}>
                  <TamaguiText
                    preset="caption"
                    textColor="inverse"
                    weight="semibold"
                    style={styles.durationText}
                  >
                    {formatDuration(video.duration)}
                  </TamaguiText>
                </View>

                {/* View count - bottom left (if available) */}
                {video.viewCount && video.viewCount > 0 && (
                  <View style={styles.viewCountBadge}>
                    <Ionicons name="eye-outline" size={14} color={Colors.white} />
                    <TamaguiText
                      preset="caption"
                      textColor="inverse"
                      weight="semibold"
                      style={styles.viewCountText}
                    >
                      {formatViewCount(video.viewCount)}
                    </TamaguiText>
                  </View>
                )}
              </View>

              {/* Title - below thumbnail */}
              <TamaguiText
                preset="caption"
                textColor="primary"
                weight="medium"
                style={styles.videoTitle}
                numberOfLines={2}
              >
                {video.title}
              </TamaguiText>
            </TamaguiPressableScale>
          ))}
        </ScrollView>
      </View>

      {/* Full-screen video modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          {/* Close button */}
          <TamaguiPressableScale
            onPress={handleCloseModal}
            style={styles.closeButton}
            hapticType="light"
            accessibilityLabel="영상 닫기"
          >
            <Ionicons name="close" size={28} color={Colors.white} />
          </TamaguiPressableScale>

          {/* Video player */}
          {selectedVideo && (
            <View style={styles.videoPlayerContainer}>
              {selectedVideo.youtubeId ? (
                // YouTube embed via WebView
                <WebView
                  style={styles.webView}
                  source={{
                    html: `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                          <style>
                            * { margin: 0; padding: 0; }
                            body { background: #000; overflow: hidden; }
                            #player { width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center; }
                            iframe { width: 100%; height: 100%; border: none; }
                          </style>
                        </head>
                        <body>
                          <div id="player">
                            <iframe
                              src="https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&controls=1&rel=0&modestbranding=1&playsinline=1"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowfullscreen
                            ></iframe>
                          </div>
                        </body>
                      </html>
                    `,
                  }}
                  allowsInlineMediaPlayback
                  mediaPlaybackRequiresUserAction={false}
                  javaScriptEnabled
                  renderLoading={() => (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={Colors.white} />
                    </View>
                  )}
                  startInLoadingState
                />
              ) : (
                // Fallback for non-YouTube videos
                <View style={styles.videoPlaceholder}>
                  <Image
                    source={{ uri: selectedVideo.thumbnailUrl }}
                    style={styles.modalThumbnail}
                  />
                  <View style={styles.playOverlay}>
                    <Ionicons name="play-circle" size={80} color={Colors.white} />
                    <TamaguiText
                      preset="body"
                      textColor="inverse"
                      weight="medium"
                      style={styles.comingSoonText}
                    >
                      Direct video URL not supported
                    </TamaguiText>
                  </View>
                </View>
              )}

              {/* Video info overlay */}
              <View style={styles.videoInfo}>
                <TamaguiText
                  preset="body"
                  textColor="inverse"
                  weight="semibold"
                  style={styles.modalPlaceName}
                >
                  {placeName}
                </TamaguiText>
                <TamaguiText
                  preset="h3"
                  textColor="inverse"
                  weight="bold"
                  style={styles.modalVideoTitle}
                >
                  {selectedVideo.title}
                </TamaguiText>
                {selectedVideo.viewCount && selectedVideo.viewCount > 0 && (
                  <TamaguiText
                    preset="caption"
                    textColor="inverse"
                    weight="medium"
                    style={styles.modalViewCount}
                  >
                    조회수 {formatViewCount(selectedVideo.viewCount)}회
                  </TamaguiText>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

const THUMBNAIL_WIDTH = 160;
const THUMBNAIL_HEIGHT = (THUMBNAIL_WIDTH * 4) / 3; // 3:4 aspect ratio (shorts format)

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.iosLabel,
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: Colors.primary[500],
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  thumbnailContainer: {
    marginLeft: 12,
    width: THUMBNAIL_WIDTH,
  },
  firstThumbnail: {
    marginLeft: 0,
  },
  thumbnail: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    borderRadius: 16,
    backgroundColor: Colors.iosSecondaryBackground,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    // Glassmorphism gradient
    backgroundColor: Colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.whiteAlpha25,
    justifyContent: 'center',
    alignItems: 'center',
    // Note: backdropFilter not supported in React Native - use BlurView instead
    borderWidth: 2,
    borderColor: Colors.whiteAlpha30,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: Colors.blackAlpha75,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  viewCountBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.blackAlpha75,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  viewCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  videoTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.iosLabel,
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.black,
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.overlayMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  webView: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
  },
  modalPlaceName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.whiteAlpha80,
    marginBottom: 4,
  },
  modalVideoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  modalViewCount: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.whiteAlpha70,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalThumbnail: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resizeMode: 'cover',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlayMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.whiteAlpha80,
  },
});

export default VideoGallery;
