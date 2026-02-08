/**
 * VideoOverlay Component
 *
 * Overlay UI with actions, author info, and related place
 */

import { View, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { COPY } from '@/app/copy/copy.ko';
import { ActionsColumn } from './ActionsColumn';
import { BottomInfo } from './BottomInfo';
import type { ShortsVideo } from '../types';

interface VideoOverlayProps {
  video: ShortsVideo;
  liked: boolean;
  saved: boolean;
  onDoubleTap: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onVisitPlace: () => void;
}

export function VideoOverlay({
  video,
  liked,
  saved,
  onDoubleTap,
  onLike,
  onComment,
  onShare,
  onSave,
  onVisitPlace,
}: VideoOverlayProps) {
  return (
    <View style={styles.overlay}>
      {/* Double-tap detector */}
      <TouchableWithoutFeedback
        onPress={onDoubleTap}
        accessible={true}
        accessibilityLabel="Video area. Double tap to like"
        accessibilityRole="button"
        accessibilityHint={COPY.A11Y_LIKE_HINT}
      >
        <View style={StyleSheet.absoluteFill} />
      </TouchableWithoutFeedback>

      {/* Right Actions Column */}
      <ActionsColumn
        liked={liked}
        saved={saved}
        likes={video.likes}
        comments={video.comments}
        shares={video.shares}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onSave={onSave}
      />

      {/* Bottom Info */}
      <BottomInfo
        author={video.author}
        title={video.title}
        relatedPlace={video.relatedPlace}
        onVisitPlace={onVisitPlace}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
});
