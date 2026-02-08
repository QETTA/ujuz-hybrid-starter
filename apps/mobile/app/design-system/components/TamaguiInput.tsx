/**
 * TamaguiInput - 테마 입력 컴포넌트
 *
 * Variants: default, search, chat
 */

import React, { forwardRef } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { styled, XStack, Input, useTheme } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

const StyledInputContainer = styled(XStack, {
  name: 'InputContainer',
  alignItems: 'center',
  borderRadius: 12,
  overflow: 'hidden',

  variants: {
    variant: {
      default: {
        backgroundColor: '$surface',
        borderWidth: 1,
        borderColor: '$borderColor',
        paddingHorizontal: '$3',
        height: 48,
      },
      search: {
        backgroundColor: '$surfaceMuted',
        paddingHorizontal: '$3',
        height: 44,
        borderRadius: 22,
      },
      chat: {
        backgroundColor: '$surface',
        borderWidth: 1,
        borderColor: '$borderColor',
        paddingHorizontal: '$3',
        height: 44,
        borderRadius: 22,
      },
    },

    focused: {
      true: {
        borderColor: '$primary',
        borderWidth: 2,
      },
    },
  } as const,

  defaultVariants: {
    variant: 'default',
  },
});

export interface TamaguiInputProps extends Omit<TextInputProps, 'style'> {
  /** Input variant */
  variant?: 'default' | 'search' | 'chat';
  /** Left icon (Ionicons name) */
  leftIcon?: string;
  /** Right icon (Ionicons name) */
  rightIcon?: string;
  /** Right icon press handler */
  onRightIconPress?: () => void;
  /** Error state */
  error?: boolean;
  /** Error message */
  errorMessage?: string;
}

export const TamaguiInput = forwardRef<TextInput, TamaguiInputProps>(
  (
    {
      variant = 'default',
      leftIcon,
      rightIcon,
      onRightIconPress,
      error,
      errorMessage,
      ...inputProps
    },
    ref,
  ) => {
    const theme = useTheme();
    const [focused, setFocused] = React.useState(false);

    const iconColor = focused ? theme.primary.val : theme.textTertiary.val;

    return (
      <>
        <StyledInputContainer
          variant={variant}
          focused={focused}
          borderColor={error ? '$error' : undefined}
        >
          {(leftIcon || variant === 'search') && (
            <Ionicons
              name={(leftIcon || 'search') as any}
              size={20}
              color={iconColor}
              style={{ marginRight: 8 }}
            />
          )}
          <TextInput
            ref={ref}
            {...inputProps}
            onFocus={(e) => {
              setFocused(true);
              inputProps.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              inputProps.onBlur?.(e);
            }}
            placeholderTextColor={theme.placeholderColor.val}
            style={{
              flex: 1,
              color: theme.color.val,
              fontSize: 16,
              paddingVertical: 0,
            }}
          />
          {rightIcon && (
            <Ionicons
              name={rightIcon as any}
              size={20}
              color={iconColor}
              onPress={onRightIconPress}
              style={{ marginLeft: 8 }}
            />
          )}
        </StyledInputContainer>
        {error && errorMessage && (
          <XStack paddingTop="$1" paddingLeft="$1">
            <Ionicons name="alert-circle" size={14} color={theme.error.val} />
            <XStack marginLeft={4}>
              <Input color="$error" fontSize={12} value={errorMessage} disabled borderWidth={0} padding={0} height="auto" />
            </XStack>
          </XStack>
        )}
      </>
    );
  },
);

TamaguiInput.displayName = 'TamaguiInput';

export default TamaguiInput;
