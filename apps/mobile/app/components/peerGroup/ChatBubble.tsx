// 채팅 버블 컴포넌트

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/app/constants';
import { TamaguiText } from '@/app/design-system';
import type { PeerGroupMessage } from '@/app/types/peerGroup';

interface ChatBubbleProps {
  message: PeerGroupMessage;
  isOwn: boolean;
  showSender?: boolean;
}

export const ChatBubble = React.memo(function ChatBubble({
  message,
  isOwn,
  showSender = true,
}: ChatBubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.container, isOwn && styles.ownContainer]}>
      {showSender && !isOwn && (
        <TamaguiText preset="caption" textColor="secondary" style={styles.sender}>
          {message.sender?.display_name || message.sender?.child_name || '익명'}
        </TamaguiText>
      )}

      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        <TamaguiText preset="body" style={[styles.content, isOwn && styles.ownContent]}>
          {message.is_deleted ? '삭제된 메시지입니다' : message.content}
        </TamaguiText>
      </View>

      <TamaguiText
        preset="caption"
        textColor="tertiary"
        style={[styles.time, isOwn && styles.ownTime]}
      >
        {time}
      </TamaguiText>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
    maxWidth: '80%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  sender: {
    fontSize: 12,
    color: Colors.darkTextSecondary,
    marginBottom: 4,
    marginLeft: 12,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ownBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Colors.darkSurfaceElevated,
    borderBottomLeftRadius: 4,
  },
  content: {
    fontSize: 15,
    lineHeight: 20,
    color: Colors.darkTextPrimary,
  },
  ownContent: {
    color: Colors.darkBg,
  },
  time: {
    fontSize: 11,
    color: Colors.darkTextTertiary,
    marginTop: 4,
    marginLeft: 12,
  },
  ownTime: {
    textAlign: 'right',
    marginRight: 12,
    marginLeft: 0,
  },
});
