/**
 * TamaguiHeader - 표준 헤더 컴포넌트
 *
 * Safe area + 블러 배경 + 표준 네비게이션
 */

import { StyleSheet, Platform } from 'react-native';
import { XStack, Text, useTheme } from 'tamagui';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export interface TamaguiHeaderProps {
  /** Title text */
  title: string;
  /** Show back button */
  showBack?: boolean;
  /** Back button handler */
  onBack?: () => void;
  /** Right action icon (Ionicons name) */
  rightIcon?: string;
  /** Right action handler */
  onRightPress?: () => void;
  /** Second right action icon */
  rightIcon2?: string;
  /** Second right action handler */
  onRightPress2?: () => void;
  /** Enable blur background */
  blur?: boolean;
  /** Custom subtitle */
  subtitle?: string;
}

export function TamaguiHeader({
  title,
  showBack = false,
  onBack,
  rightIcon,
  onRightPress,
  rightIcon2,
  onRightPress2,
  blur = true,
  subtitle: _subtitle,
}: TamaguiHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack?.();
  };

  const content = (
    <XStack
      paddingTop={insets.top}
      paddingHorizontal="$4"
      height={56 + insets.top}
      alignItems="center"
      justifyContent="space-between"
    >
      {/* Left */}
      <XStack alignItems="center" gap="$2" flex={1}>
        {showBack && (
          <Ionicons
            name="chevron-back"
            size={24}
            color={theme.color.val}
            onPress={handleBack}
            style={{ marginLeft: -8, padding: 8 }}
          />
        )}
        <Text fontSize={18} fontWeight="700" color="$color" numberOfLines={1} flex={1}>
          {title}
        </Text>
      </XStack>

      {/* Right */}
      <XStack alignItems="center" gap="$3">
        {rightIcon2 && (
          <Ionicons
            name={rightIcon2 as any}
            size={22}
            color={theme.color.val}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRightPress2?.();
            }}
          />
        )}
        {rightIcon && (
          <Ionicons
            name={rightIcon as any}
            size={22}
            color={theme.color.val}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRightPress?.();
            }}
          />
        )}
      </XStack>
    </XStack>
  );

  if (blur && Platform.OS !== 'web') {
    return (
      <BlurView
        intensity={60}
        tint={theme.background.val === '#ffffff' ? 'light' : 'dark'}
        style={styles.blurContainer}
      >
        {content}
      </BlurView>
    );
  }

  return (
    <XStack backgroundColor="$background" style={styles.solidContainer}>
      {content}
    </XStack>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  solidContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
});

export default TamaguiHeader;
