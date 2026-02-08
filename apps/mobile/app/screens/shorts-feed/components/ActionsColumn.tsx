/**
 * ActionsColumn Component
 *
 * Vertical action buttons (like, comment, share, save)
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';
import { formatCount } from '../utils';

interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress: () => void;
}

const ActionButton = React.memo(function ActionButton({
  icon,
  label,
  color = Colors.white,
  onPress,
}: ActionButtonProps) {
  const hint = icon.includes('heart')
    ? COPY.A11Y_LIKE_HINT
    : icon.includes('chat')
      ? COPY.A11Y_COMMENT_HINT
      : icon.includes('share')
        ? COPY.A11Y_SHARE_HINT
        : icon.includes('bookmark')
          ? COPY.A11Y_SAVE_HINT
          : '';

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={handlePress}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${label}`}
      accessibilityHint={hint}
    >
      <Ionicons
        name={icon}
        size={32}
        color={color}
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
      />
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
});

interface ActionsColumnProps {
  liked: boolean;
  saved: boolean;
  likes: number;
  comments: number;
  shares: number;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}

export const ActionsColumn = React.memo(function ActionsColumn({
  liked,
  saved,
  likes,
  comments,
  shares,
  onLike,
  onComment,
  onShare,
  onSave,
}: ActionsColumnProps) {
  return (
    <View
      style={styles.container}
      accessibilityRole="toolbar"
      accessibilityLabel={COPY.A11Y_VIDEO_ACTIONS}
      accessibilityHint={COPY.A11Y_VIDEO_ACTIONS_HINT}
    >
      <ActionButton
        icon={liked ? 'heart' : 'heart-outline'}
        label={formatCount(likes + (liked ? 1 : 0))}
        color={liked ? Colors.iosSystemRed : Colors.white}
        onPress={onLike}
      />
      <ActionButton icon="chatbubble-outline" label={formatCount(comments)} onPress={onComment} />
      <ActionButton icon="share-outline" label={formatCount(shares)} onPress={onShare} />
      <ActionButton
        icon={saved ? 'bookmark' : 'bookmark-outline'}
        label={COPY.ACTION_SAVE}
        color={saved ? Colors.iosSystemOrange : Colors.white}
        onPress={onSave}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 8, // Adjusted for larger buttons
    bottom: 100,
    gap: 16, // Reduced gap to accommodate larger touch targets
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 44, // iOS HIG minimum touch target
    minHeight: 44, // iOS HIG minimum touch target
    paddingHorizontal: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
