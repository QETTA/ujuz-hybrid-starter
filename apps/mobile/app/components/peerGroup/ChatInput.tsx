// 채팅 입력 컴포넌트

import { useState } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/app/constants';
import { TamaguiPressableScale } from '@/app/design-system';

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = '메시지를 입력하세요...',
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim() || sending || disabled) return;

    setSending(true);
    try {
      await onSend(text.trim());
      setText('');
    } finally {
      setSending(false);
    }
  };

  const canSend = text.trim().length > 0 && !sending && !disabled;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={Colors.darkTextTertiary}
        multiline
        maxLength={1000}
        editable={!disabled}
      />

      <TamaguiPressableScale
        style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!canSend}
        hapticType="light"
        accessibilityLabel="메시지 전송"
        accessibilityHint="작성한 메시지를 전송합니다"
      >
        {sending ? (
          <ActivityIndicator size="small" color={Colors.darkBg} />
        ) : (
          <Ionicons
            name="arrow-up"
            size={20}
            color={canSend ? Colors.darkBg : Colors.darkTextTertiary}
          />
        )}
      </TamaguiPressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.darkBg,
    borderTopWidth: 0.5,
    borderTopColor: Colors.darkBorder,
  },
  input: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: Colors.darkTextPrimary,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.darkSurfaceElevated,
  },
});
