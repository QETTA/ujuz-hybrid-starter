// 채팅 입력 컴포넌트

import { useState, useMemo } from 'react';
import { View, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from 'tamagui';
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
  const theme = useTheme();

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

  const styles = useMemo(() => ({
    container: {
      flexDirection: 'row' as const,
      alignItems: 'flex-end' as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.background.val,
      borderTopWidth: 0.5,
      borderTopColor: theme.borderColor.val,
    },
    input: {
      flex: 1,
      minHeight: 36,
      maxHeight: 100,
      backgroundColor: theme.surfaceElevated.val,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 8,
      fontSize: 15,
      color: theme.textPrimary.val,
      marginRight: 8,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.primary,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    sendButtonDisabled: {
      backgroundColor: theme.surfaceElevated.val,
    },
  }), [theme]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary.val}
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
          <ActivityIndicator size="small" color={theme.background.val} />
        ) : (
          <Ionicons
            name="arrow-up"
            size={20}
            color={canSend ? theme.background.val : theme.textTertiary.val}
          />
        )}
      </TamaguiPressableScale>
    </View>
  );
}
