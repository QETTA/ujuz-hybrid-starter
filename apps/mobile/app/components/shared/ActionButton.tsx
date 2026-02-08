/**
 * ActionButton - Shared Component
 *
 * Reusable action button for place detail sheets
 * Used in: ThreeSnapBottomSheet, PlaceDetailSheet
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getActionButtonLabel, getActionButtonHint } from '@/app/utils/accessibility';
import { Colors } from '@/app/constants/Colors';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { COPY } from '@/app/copy/copy.ko';

export interface ActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  variant?: 'vertical' | 'horizontal';
  active?: boolean;
  placeName?: string;
}

export const ActionButton = React.memo(function ActionButton({
  icon,
  label,
  onPress,
  variant = 'vertical',
  active = false,
  placeName,
}: ActionButtonProps) {
  // Map label to action type for accessibility
  const actionType = label.toLowerCase().includes('call')
    ? 'call'
    : label.toLowerCase().includes('direction')
      ? 'directions'
      : label.toLowerCase().includes('share')
        ? 'share'
        : label.toLowerCase().includes('website')
          ? 'website'
          : undefined;

  const accessibilityLabel = actionType
    ? getActionButtonLabel(actionType as any, placeName)
    : label;

  const accessibilityHint = actionType
    ? getActionButtonHint(actionType as any)
    : COPY.A11Y_ACTIVATE_HINT;

  if (variant === 'horizontal') {
    return (
      <TamaguiPressableScale
        style={[styles.buttonHorizontal, active && styles.buttonActive]}
        onPress={onPress}
        hapticType="light"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        <Ionicons
          name={icon}
          size={20}
          color={active ? Colors.primary : Colors.darkTextSecondary}
          accessibilityElementsHidden={true}
          importantForAccessibility="no"
        />
        <TamaguiText
          preset="body"
          weight="medium"
          style={active ? styles.labelActive : styles.labelHorizontal}
        >
          {label}
        </TamaguiText>
      </TamaguiPressableScale>
    );
  }

  return (
    <TamaguiPressableScale
      style={styles.button}
      onPress={onPress}
      hapticType="light"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <Ionicons
        name={icon}
        size={24}
        color={Colors.darkTextSecondary}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      />
      <TamaguiText preset="caption" textColor="secondary" weight="medium" style={styles.label}>
        {label}
      </TamaguiText>
    </TamaguiPressableScale>
  );
});

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.darkTextSecondary,
    marginTop: 4,
  },
  buttonHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonActive: {
    backgroundColor: Colors.darkSurfaceElevated,
  },
  labelHorizontal: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.darkTextSecondary,
  },
  labelActive: {
    color: Colors.primary,
  },
});
