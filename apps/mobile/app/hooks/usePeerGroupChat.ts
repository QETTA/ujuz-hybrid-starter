// 채팅 Realtime Hook

import { useEffect, useCallback, useRef } from 'react';
import { usePeerGroupStore } from '@/app/stores/peerGroupStore';
import {
  fetchGroupMessages,
  sendMessage as sendMessageApi,
  subscribeToChatMessages,
} from '@/app/services/supabase/peerGroups';
import type { PeerGroupMessage, SendMessageInput } from '@/app/types/peerGroup';

export function usePeerGroupChat(groupId: string | null) {
  const {
    messages,
    isLoadingMessages,
    isSending,
    setMessages,
    addMessage,
    addOptimisticMessage,
    confirmMessage,
    setLoadingMessages,
    setSending,
  } = usePeerGroupStore();

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const loadMessages = useCallback(async () => {
    if (!groupId) return;

    setLoadingMessages(true);
    try {
      const msgs = await fetchGroupMessages(groupId);
      setMessages(groupId, msgs);
    } finally {
      setLoadingMessages(false);
    }
  }, [groupId, setMessages, setLoadingMessages]);

  const loadMoreMessages = useCallback(async () => {
    if (!groupId) return;

    const currentMessages = messages[groupId] || [];
    if (currentMessages.length === 0) return;

    const oldestMessage = currentMessages[0];
    const olderMessages = await fetchGroupMessages(groupId, {
      before: oldestMessage.created_at,
      limit: 30,
    });

    if (olderMessages.length > 0) {
      setMessages(groupId, [...olderMessages, ...currentMessages]);
    }
  }, [groupId, messages, setMessages]);

  const sendMessage = useCallback(
    async (content: string, options?: Partial<SendMessageInput>) => {
      if (!groupId || !content.trim()) return null;

      setSending(true);

      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: PeerGroupMessage = {
        id: tempId,
        group_id: groupId,
        sender_id: '',
        content: content.trim(),
        message_type: options?.message_type || 'text',
        metadata: options?.metadata || {},
        reply_to_id: options?.reply_to_id || null,
        is_edited: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
        edited_at: null,
      };

      addOptimisticMessage(groupId, optimisticMessage);

      try {
        const confirmed = await sendMessageApi({
          group_id: groupId,
          content: content.trim(),
          ...options,
        });

        if (confirmed) {
          confirmMessage(groupId, tempId, confirmed);
          return confirmed;
        }
        return null;
      } finally {
        setSending(false);
      }
    },
    [groupId, addOptimisticMessage, confirmMessage, setSending]
  );

  useEffect(() => {
    if (!groupId) return;

    loadMessages();

    unsubscribeRef.current = subscribeToChatMessages(groupId, (newMessage) => {
      addMessage(groupId, newMessage);
    });

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [groupId, loadMessages, addMessage]);

  return {
    messages: groupId ? messages[groupId] || [] : [],
    isLoading: isLoadingMessages,
    isSending,
    sendMessage,
    loadMoreMessages,
    refresh: loadMessages,
  };
}
