// 모임 상세 + 채팅 화면

import { useCallback, useRef, useEffect, useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { TamaguiText } from '@/app/design-system';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import { usePeerGroupStore } from '@/app/stores/peerGroupStore';
import { usePeerGroupChat } from '@/app/hooks/usePeerGroupChat';
import { ChatBubble, ChatInput } from '@/app/components/peerGroup';
import { Colors } from '@/app/constants';
import { ensureSupabaseUser } from '@/app/services/supabase';
import type { PeerGroupMessage } from '@/app/types/peerGroup';
import type { RootStackParamList } from '@/app/types/navigation';

export function PeerGroupDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'PeerGroupDetail'>>();
  const navigation = useNavigation();
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
      <View style={styles.center}>
        <TamaguiText preset="body" textColor="secondary" style={styles.errorText}>
          모임을 찾을 수 없습니다
        </TamaguiText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlashList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.1}
        />

        <ChatInput onSend={handleSend} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.darkTextSecondary,
  },
  messageList: {
    paddingVertical: 16,
  },
});
