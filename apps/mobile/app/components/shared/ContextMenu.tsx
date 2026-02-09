/**
 * iOS 28.2 Context Menu Component
 *
 * Features:
 * - Glassmorphism 2.0 backdrop
 * - Smooth spring animations
 * - Haptic feedback
 * - SF Symbol icons
 * - Adaptive positioning
 */

import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Borders available from '../../design-system/tokens/materials' if needed
import { Animations } from '../../design-system/tokens/animations';
import { Colors } from '../../constants/Colors';
import { BlurView } from 'expo-blur';
import { TamaguiText } from '@/app/design-system';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface ContextMenuItem {
  id: string;
  label: string;
  icon: string;
  iconColor?: string;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export interface ContextMenuSection {
  items: ContextMenuItem[];
}

export interface ContextMenuProps {
  visible: boolean;
  onClose: () => void;
  sections: ContextMenuSection[];
  title?: string;
  subtitle?: string;
  anchorPosition?: { x: number; y: number };
  preview?: React.ReactNode;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MENU_WIDTH = Math.min(280, SCREEN_WIDTH - 40);

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ═══════════════════════════════════════════════════════════
// MENU ITEM COMPONENT
// ═══════════════════════════════════════════════════════════

interface MenuItemProps {
  item: ContextMenuItem;
  isLast: boolean;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, isLast, onPress }) => {
  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue('transparent');

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.98, Animations.springSnappy);
    backgroundColor.value = withTiming(
      item.destructive ? Colors.iosSystemRedAlpha10 : Colors.blackAlpha5,
      { duration: 100 }
    );
  }, [item.destructive, scale, backgroundColor]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, Animations.springSnappy);
    backgroundColor.value = withTiming('transparent', { duration: 100 });
  }, [scale, backgroundColor]);

  const handlePress = useCallback(() => {
    if (item.disabled) return;

    Haptics.impactAsync(
      item.destructive ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light
    );

    onPress();
  }, [item, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: backgroundColor.value,
  }));

  const textColor = item.destructive
    ? Colors.error
    : item.disabled
      ? Colors.gray400
      : Colors.gray900;

  const iconColor = item.iconColor || textColor;

  const accessibilityHint = item.destructive
    ? '주의: 삭제 작업입니다'
    : item.disabled
      ? '현재 사용할 수 없습니다'
      : undefined;

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={item.disabled}
      style={[styles.menuItem, animatedStyle, !isLast && styles.menuItemBorder]}
      accessible={true}
      accessibilityRole="menuitem"
      accessibilityLabel={item.label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: item.disabled }}
    >
      <MaterialCommunityIcons
        name={item.icon as any}
        size={20}
        color={iconColor}
        style={styles.menuItemIcon}
        accessibilityElementsHidden={true}
      />
      <TamaguiText
        preset="body"
        style={[
          styles.menuItemLabel,
          { color: textColor },
          item.disabled && styles.menuItemDisabled,
        ]}
      >
        {item.label}
      </TamaguiText>

      {/* Chevron for non-destructive items */}
      {!item.destructive && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={Colors.gray400}
          accessibilityElementsHidden={true}
        />
      )}
    </AnimatedPressable>
  );
};

// ═══════════════════════════════════════════════════════════
// CONTEXT MENU COMPONENT
// ═══════════════════════════════════════════════════════════

export const ContextMenu: React.FC<ContextMenuProps> = ({
  visible,
  onClose,
  sections,
  title,
  subtitle,
  anchorPosition,
  preview,
}) => {
  const menuScale = useSharedValue(0.8);
  const menuOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const actionTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(actionTimerRef.current), []);

  useEffect(() => {
    if (visible) {
      // Opening animation
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      backdropOpacity.value = withTiming(1, { duration: 200 });
      menuScale.value = withSpring(1, Animations.springSnappy);
      menuOpacity.value = withTiming(1, { duration: 150 });
    } else {
      // Closing animation
      backdropOpacity.value = withTiming(0, { duration: 150 });
      menuScale.value = withSpring(0.8, Animations.springSnappy);
      menuOpacity.value = withTiming(0, { duration: 100 });
    }
  }, [visible, backdropOpacity, menuOpacity, menuScale]);

  const handleItemPress = useCallback(
    (item: ContextMenuItem) => {
      // Close menu first, then trigger action
      onClose();
      actionTimerRef.current = setTimeout(() => {
        item.onPress();
      }, 200);
    },
    [onClose]
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const menuStyle = useAnimatedStyle(() => ({
    opacity: menuOpacity.value,
    transform: [{ scale: menuScale.value }],
  }));

  // Calculate menu position based on anchor
  const getMenuPosition = () => {
    if (!anchorPosition) {
      return {
        top: SCREEN_HEIGHT / 2 - 150,
        left: (SCREEN_WIDTH - MENU_WIDTH) / 2,
      };
    }

    let top = anchorPosition.y;
    let left = anchorPosition.x - MENU_WIDTH / 2;

    // Keep within screen bounds
    left = Math.max(20, Math.min(left, SCREEN_WIDTH - MENU_WIDTH - 20));

    // Flip up if near bottom
    if (top > SCREEN_HEIGHT - 300) {
      top = anchorPosition.y - 250;
    }

    return { top, left };
  };

  const menuPosition = getMenuPosition();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <AnimatedPressable style={[styles.backdrop, backdropStyle]} onPress={onClose}>
        <AnimatedBlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      </AnimatedPressable>

      {/* Menu Container */}
      <Animated.View
        style={[
          styles.menuContainer,
          menuStyle,
          { top: menuPosition.top, left: menuPosition.left },
        ]}
      >
        {/* Preview (optional) */}
        {preview && <View style={styles.previewContainer}>{preview}</View>}

        {/* Menu Card */}
        <BlurView intensity={80} tint="light" style={styles.menuCard}>
          {/* Title Header */}
          {(title || subtitle) && (
            <View style={styles.header}>
              {title && (
                <TamaguiText preset="body" weight="semibold" style={styles.title}>
                  {title}
                </TamaguiText>
              )}
              {subtitle && (
                <TamaguiText preset="caption" textColor="secondary" style={styles.subtitle}>
                  {subtitle}
                </TamaguiText>
              )}
            </View>
          )}

          {/* Menu Sections */}
          {sections.map((section, sectionIndex) => (
            <View key={sectionIndex}>
              {sectionIndex > 0 && <View style={styles.sectionDivider} />}
              {section.items.map((item, itemIndex) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  isLast={itemIndex === section.items.length - 1}
                  onPress={() => handleItemPress(item)}
                />
              ))}
            </View>
          ))}
        </BlurView>
      </Animated.View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════
// PRESET CONTEXT MENUS
// ═══════════════════════════════════════════════════════════

interface PlaceContextMenuProps {
  visible: boolean;
  onClose: () => void;
  placeName: string;
  onSave: () => void;
  onShare: () => void;
  onGetDirections: () => void;
  onReport?: () => void;
  isSaved?: boolean;
  anchorPosition?: { x: number; y: number };
}

export const PlaceContextMenu: React.FC<PlaceContextMenuProps> = ({
  visible,
  onClose,
  placeName,
  onSave,
  onShare,
  onGetDirections,
  onReport,
  isSaved = false,
  anchorPosition,
}) => {
  const sections: ContextMenuSection[] = [
    {
      items: [
        {
          id: 'save',
          label: isSaved ? '저장 취소' : '저장하기',
          icon: isSaved ? 'bookmark-minus' : 'bookmark-plus',
          iconColor: isSaved ? Colors.primary : Colors.gray700,
          onPress: onSave,
        },
        {
          id: 'share',
          label: '공유하기',
          icon: 'share-variant',
          onPress: onShare,
        },
        {
          id: 'directions',
          label: '길찾기',
          icon: 'directions',
          iconColor: Colors.secondary,
          onPress: onGetDirections,
        },
      ],
    },
  ];

  // Add report section if handler provided
  if (onReport) {
    sections.push({
      items: [
        {
          id: 'report',
          label: '신고하기',
          icon: 'flag',
          destructive: true,
          onPress: onReport,
        },
      ],
    });
  }

  return (
    <ContextMenu
      visible={visible}
      onClose={onClose}
      sections={sections}
      title={placeName}
      subtitle="장소 옵션"
      anchorPosition={anchorPosition}
    />
  );
};

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlayDark40,
  },

  menuContainer: {
    position: 'absolute',
    width: MENU_WIDTH,
    zIndex: 1000,
  },

  previewContainer: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },

  menuCard: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.whiteAlpha80,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.whiteAlpha18,
  },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.blackAlpha10,
  },

  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 2,
  },

  subtitle: {
    fontSize: 13,
    color: Colors.gray500,
  },

  sectionDivider: {
    height: 8,
    backgroundColor: Colors.blackAlpha3,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.blackAlpha8,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },

  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.blackAlpha8,
  },

  menuItemIcon: {
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },

  menuItemLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },

  menuItemDisabled: {
    opacity: 0.5,
  },
});

export default ContextMenu;
