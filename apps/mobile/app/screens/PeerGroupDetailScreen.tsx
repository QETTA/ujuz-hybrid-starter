/**
 * PeerGroupDetailScreen - 모임 상세 + 채팅 화면
 *
 * 2026 UJUz 공동육아 커뮤니티
 * - 메시지 타입별 렌더링 (text, image, place, groupBuy, system)
 * - 멤버 수/활동 통계 헤더
 * - 테마 토큰 기반 다크모드
 */

import { useCallback, useRef, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { YStack, XStack, Text, useTheme } from 'tamagui';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';

import { TamaguiHeader, TamaguiEmptyState, SocialProofBadge } from '@/app/design-system';
import { usePeerGroupStore } from '@/app/stores/peerGroupStore';
import { usePeerGroupChat } from '@/app/hooks/usePeerGroupChat';
import { ChatBubble, ChatInput } from '@/app/components/peerGroup';
import { ensureSupabaseUser } from '@/app/services/supabase';
import type { PeerGroupMessage } from '@/app/types/peerGroup';
import type { RootStackParamList } from '@/app/types/navigation';

export function PeerGroupDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'PeerGroupDetail'>>();
  const navigation = useNavigation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const groupId = route.params.groupId;

  const flatListRef = useRef<FlashListRef<PeerGroupMessage>>(null);
  const [currentUserId, setCurrentUserId] = useState('');

  const setCurrentGroupId = usePeerGroupStore((s) => s.setCurrentGroupId);
  const myGroups = usePeerGroupStore((s) => s.myGroups);
  const group = myGroups.find((g) => g.id === groupId);

  useEffect(() => {
    setCurrentGroupId(groupId);
    if (group) {
      navigation.setOptions({ title: group.name });
    }
    return () => setCurrentGroupId(null);
  }, [groupId, group, setCurrentGroupId, navigation]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { userId } = await ensureSupabaseUser();
      if (mounted && userId) {
        setCurrentUserId(userId);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const { messages, sendMessage, loadMoreMessages } = usePeerGroupChat(groupId);

  const handleSend = useCallback(
    async (content: string) => {
      await sendMessage(content);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    [sendMessage]
  );

  const renderMessage = useCallback(
    ({ item, index }: { item: PeerGroupMessage; index: number }) => {
      const isOwn = item.sender_id === currentUserId;
      const prevMessage = messages[index - 1];
      const showSender = !isOwn && (!prevMessage || prevMessage.sender_id !== item.sender_id);

      return <ChatBubble message={item} isOwn={isOwn} showSender={showSender} />;
    },
    [currentUserId, messages]
  );

  if (!group) {
    return (
      <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center">
        <TamaguiEmptyState
          icon="people-outline"
          title="모임을 찾을 수 없습니다"
          message="모임이 삭제되었거나 접근 권한이 없습니다"
        />
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <TamaguiHeader
        title={group.name}
        showBack
        onBack={() => navigation.goBack()}
        rightIcon="people-outline"
        subtitle={group.member_count ? `${group.member_count}명 참여 중` : undefined}
      />

      {/* Member Stats Bar */}
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$2"
        backgroundColor="$surface"
        borderBottomWidth={0.5}
        borderBottomColor="$borderColor"
        alignItems="center"
        justifyContent="space-between"
        marginTop={56 + insets.top}
      >
        <SocialProofBadge
          count={group.member_count ?? 0}
          label="{count}명 참여 중"
          size="sm"
        />
        <XStack alignItems="center" gap="$1">
          <Ionicons name="chatbubbles-outline" size={14} color={theme.textTertiary.val} />
          <Text fontSize={12} color="$textTertiary">
            {messages.length}개 메시지
          </Text>
        </XStack>
      </XStack>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlashList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.1}
        />

        <ChatInput onSend={handleSend} />
      </KeyboardAvoidingView>
    </YStack>
  );
}

export default PeerGroupDetailScreen;
