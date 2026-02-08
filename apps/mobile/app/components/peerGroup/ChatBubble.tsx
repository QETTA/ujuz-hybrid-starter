/**
 * ChatBubble - 채팅 버블 컴포넌트
 *
 * 2026 UJUz 테마 토큰 기반
 */

import React from 'react';
import { YStack, Text } from 'tamagui';
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
    <YStack
      marginVertical={4}
      marginHorizontal={16}
      maxWidth="80%"
      alignSelf={isOwn ? 'flex-end' : 'flex-start'}
    >
      {showSender && !isOwn && (
        <Text
          fontSize={12}
          color="$textSecondary"
          marginBottom={4}
          marginLeft={12}
        >
          {message.sender?.display_name || message.sender?.child_name || '익명'}
        </Text>
      )}

      <YStack
        borderRadius={18}
        paddingHorizontal={14}
        paddingVertical={10}
        backgroundColor={isOwn ? '$primary' : '$surfaceElevated'}
        borderBottomRightRadius={isOwn ? 4 : 18}
        borderBottomLeftRadius={isOwn ? 18 : 4}
      >
        <Text
          fontSize={15}
          lineHeight={20}
          color={isOwn ? '$background' : '$textPrimary'}
        >
          {message.is_deleted ? '삭제된 메시지입니다' : message.content}
        </Text>
      </YStack>

      <Text
        fontSize={11}
        color="$textTertiary"
        marginTop={4}
        marginLeft={isOwn ? 0 : 12}
        marginRight={isOwn ? 12 : 0}
        textAlign={isOwn ? 'right' : 'left'}
      >
        {time}
      </Text>
    </YStack>
  );
});
