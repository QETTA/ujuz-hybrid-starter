/**
 * GroupBuyButton Component (공구 - Group Purchase)
 *
 * Design Philosophy (iOS 26 + 2026 Trends):
 * - Glassmorphism badge with subtle depth
 * - Typography-first: clear percentage, participant counts
 * - Muted color palette for progress indicators
 * - No emoji spam (❌ 🔥💰 → ✅ Typography)
 *
 * UX Pattern (Wadiz-inspired):
 * - Compact badge for PlaceCard overlay (top-right)
 * - Expandable modal with participant progress
 * - Urgency indicators (limited slots, deadline)
 * - Trust signals (verified seller badge)
 */

import React, { useState } from 'react';
import { View, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/app/constants/Colors';
import { Shadows } from '@/app/constants';
import { Badge, TamaguiText, TamaguiPressableScale } from '@/app/design-system';

export interface GroupBuyData {
  id: string;
  title: string;
  currentParticipants: number;
  maxParticipants: number;
  discountPercentage: number;
  originalPrice: number;
  discountedPrice: number;
  deadline: Date;
  minQuantity?: number;
  isVerified?: boolean;
  description?: string;
}

interface GroupBuyButtonProps {
  data: GroupBuyData;
  compact?: boolean; // For PlaceCard overlay
  onApply?: (quantity: number) => void;
}

const GroupBuyButton: React.FC<GroupBuyButtonProps> = ({ data, compact = false, onApply }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(data.minQuantity || 1);

  const progressPercentage = (data.currentParticipants / data.maxParticipants) * 100;
  const slotsRemaining = data.maxParticipants - data.currentParticipants;
  const isAlmostFull = progressPercentage >= 80;
  const isFull = data.currentParticipants >= data.maxParticipants;

  const formatDeadline = (date: Date): string => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (daysLeft < 1) return '오늘 마감';
    if (daysLeft === 1) return '내일 마감';
    return `${daysLeft}일 남음`;
  };

  const handleApply = () => {
    if (onApply) {
      onApply(selectedQuantity);
    }
    setIsModalVisible(false);
  };

  // Compact badge for PlaceCard overlay
  if (compact) {
    return (
      <TamaguiPressableScale
        onPress={() => setIsModalVisible(true)}
        hapticType="medium"
        style={styles.compactBadge}
        accessibilityLabel="공동구매 신청 열기"
        accessibilityHint="공동구매 신청 화면을 엽니다"
      >
        <TamaguiText preset="caption" textColor="inverse" weight="semibold">
          공구
        </TamaguiText>
        <TamaguiText preset="caption" textColor="inverse" weight="bold">
          -{data.discountPercentage}%
        </TamaguiText>
      </TamaguiPressableScale>
    );
  }

  // Full button for PlaceDetailSheet
  return (
    <>
      <TamaguiPressableScale
        onPress={isFull ? undefined : () => setIsModalVisible(true)}
        hapticType="medium"
        disabled={isFull}
        style={[styles.button, isFull && styles.buttonDisabled]}
        accessibilityLabel="공동구매 신청 열기"
        accessibilityHint="공동구매 상세와 신청 옵션을 확인합니다"
      >
        {/* Header row */}
        <View style={styles.buttonHeader}>
          <View style={styles.buttonTitleRow}>
            <TamaguiText preset="body" textColor="error" weight="semibold">
              공구 진행중
            </TamaguiText>
            {data.isVerified && <Badge variant="verified" size="sm" label="인증됨" />}
          </View>
          <TamaguiText preset="h4" textColor="error" weight="bold">
            -{data.discountPercentage}%
          </TamaguiText>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progressPercentage, 100)}%` },
                isAlmostFull && styles.progressFillAlmostFull,
              ]}
            />
          </View>
          <TamaguiText preset="caption" textColor="tertiary" weight="medium">
            {data.currentParticipants}/{data.maxParticipants}명
            {!isFull && ` · ${slotsRemaining}자리 남음`}
          </TamaguiText>
        </View>

        {/* Price row */}
        <View style={styles.priceRow}>
          <View>
            <TamaguiText preset="caption" textColor="tertiary" style={styles.originalPriceDecor}>
              {data.originalPrice.toLocaleString()}원
            </TamaguiText>
            <TamaguiText preset="h4" textColor="primary" weight="bold">
              {data.discountedPrice.toLocaleString()}원
            </TamaguiText>
          </View>
          <TamaguiText preset="body" textColor="warning" weight="semibold">
            {formatDeadline(data.deadline)}
          </TamaguiText>
        </View>

        {isFull && (
          <TamaguiText
            preset="caption"
            textColor="tertiary"
            align="center"
            style={styles.fullBadgeMargin}
          >
            마감됨
          </TamaguiText>
        )}
      </TamaguiPressableScale>

      {/* Application modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsModalVisible(false)}
          accessibilityRole="button"
          accessibilityLabel="공동구매 신청 닫기"
          accessibilityHint="공동구매 신청 화면을 닫습니다"
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
            accessible={false}
            accessibilityRole="none"
            accessibilityLabel="공동구매 신청 내용"
            accessibilityHint=""
          >
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <TamaguiText preset="h3" textColor="primary" weight="bold">
                공동구매 신청
              </TamaguiText>
              <TamaguiPressableScale
                onPress={() => setIsModalVisible(false)}
                hapticType="light"
                style={styles.closeButton}
                accessibilityLabel="닫기"
              >
                <Ionicons name="close" size={24} color={Colors.iosTertiaryLabel} />
              </TamaguiPressableScale>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Group buy info */}
              <View style={styles.modalSection}>
                <View style={styles.modalTitleRow}>
                  <TamaguiText
                    preset="bodyLarge"
                    textColor="primary"
                    weight="semibold"
                    style={styles.flex1}
                  >
                    {data.title}
                  </TamaguiText>
                  {data.isVerified && <Badge variant="verified" size="sm" label="인증됨" />}
                </View>

                {data.description && (
                  <TamaguiText preset="body" textColor="tertiary" style={styles.modalDescription}>
                    {data.description}
                  </TamaguiText>
                )}

                {/* Progress */}
                <View style={styles.modalProgress}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.min(progressPercentage, 100)}%` },
                        isAlmostFull && styles.progressFillAlmostFull,
                      ]}
                    />
                  </View>
                  <TamaguiText preset="caption" textColor="tertiary" weight="medium">
                    현재 {data.currentParticipants}명 참여 · {slotsRemaining}자리 남음
                  </TamaguiText>
                </View>
              </View>

              {/* Price breakdown */}
              <View style={styles.modalSection}>
                <TamaguiText
                  preset="body"
                  textColor="primary"
                  weight="semibold"
                  style={styles.sectionTitleMargin}
                >
                  가격
                </TamaguiText>
                <View style={styles.priceBreakdown}>
                  <View style={styles.priceRow}>
                    <TamaguiText preset="body" textColor="tertiary">
                      정가
                    </TamaguiText>
                    <TamaguiText
                      preset="body"
                      textColor="tertiary"
                      style={styles.originalPriceDecor}
                    >
                      {data.originalPrice.toLocaleString()}원
                    </TamaguiText>
                  </View>
                  <View style={styles.priceRow}>
                    <TamaguiText preset="body" textColor="tertiary">
                      할인
                    </TamaguiText>
                    <TamaguiText preset="body" textColor="error" weight="semibold">
                      -{(data.originalPrice - data.discountedPrice).toLocaleString()}원 (
                      {data.discountPercentage}%)
                    </TamaguiText>
                  </View>
                  <View style={[styles.priceRow, styles.finalPriceRow]}>
                    <TamaguiText preset="bodyLarge" textColor="primary" weight="semibold">
                      공구가
                    </TamaguiText>
                    <TamaguiText preset="h4" textColor="error" weight="bold">
                      {data.discountedPrice.toLocaleString()}원
                    </TamaguiText>
                  </View>
                </View>
              </View>

              {/* Quantity selector */}
              <View style={styles.modalSection}>
                <TamaguiText
                  preset="body"
                  textColor="primary"
                  weight="semibold"
                  style={styles.sectionTitleMargin}
                >
                  수량
                </TamaguiText>
                <View style={styles.quantitySelector}>
                  <TamaguiPressableScale
                    onPress={() =>
                      setSelectedQuantity(Math.max(data.minQuantity || 1, selectedQuantity - 1))
                    }
                    hapticType="light"
                    style={styles.quantityButton}
                    accessibilityLabel="수량 감소"
                  >
                    <Ionicons name="remove" size={20} color={Colors.primary} />
                  </TamaguiPressableScale>
                  <TamaguiText
                    preset="h4"
                    textColor="primary"
                    weight="semibold"
                    style={styles.quantityTextStyle}
                  >
                    {selectedQuantity}
                  </TamaguiText>
                  <TamaguiPressableScale
                    onPress={() => setSelectedQuantity(selectedQuantity + 1)}
                    hapticType="light"
                    style={styles.quantityButton}
                    accessibilityLabel="수량 증가"
                  >
                    <Ionicons name="add" size={20} color={Colors.primary} />
                  </TamaguiPressableScale>
                </View>
                <TamaguiText
                  preset="bodyLarge"
                  textColor="primary"
                  weight="semibold"
                  align="center"
                >
                  합계: {(data.discountedPrice * selectedQuantity).toLocaleString()}원
                </TamaguiText>
              </View>

              {/* Deadline notice */}
              <View style={styles.deadlineNotice}>
                <Ionicons name="time-outline" size={16} color={Colors.iosSystemOrange} />
                <TamaguiText preset="body" textColor="warning" weight="semibold">
                  {formatDeadline(data.deadline)}
                </TamaguiText>
              </View>
            </ScrollView>

            {/* Apply button */}
            <TamaguiPressableScale
              onPress={isFull ? undefined : handleApply}
              hapticType="medium"
              disabled={isFull}
              style={[styles.applyButton, isFull && styles.applyButtonDisabled]}
              accessibilityLabel={isFull ? '공동구매 마감됨' : '공동구매 신청하기'}
              accessibilityHint={isFull ? '마감된 공동구매입니다' : '선택한 수량으로 신청합니다'}
            >
              <TamaguiText preset="bodyLarge" textColor="inverse" weight="semibold">
                {isFull ? '마감됨' : '신청하기'}
              </TamaguiText>
            </TamaguiPressableScale>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Compact badge (PlaceCard overlay)
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.iosSystemRedAlpha95,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...Shadows.sm,
  },
  compactText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  compactDiscount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },

  // Full button (PlaceDetailSheet)
  button: {
    backgroundColor: Colors.iosSystemRedAlpha08,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.iosSystemRedAlpha20,
    ...Shadows.md,
  },
  buttonDisabled: {
    backgroundColor: Colors.iosSecondaryBackground,
    borderColor: Colors.iosQuaternaryFill,
    opacity: 0.6,
  },
  buttonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.iosSystemRed,
  },
  discountBadge: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.iosSystemRed,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.iosSystemRedAlpha15,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.iosSystemRed,
    borderRadius: 4,
  },
  progressFillAlmostFull: {
    backgroundColor: Colors.iosSystemOrange, // Orange for urgency
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.iosTertiaryLabel,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  originalPrice: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.iosTertiaryLabel,
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  discountedPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.iosLabel,
  },
  deadline: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.iosSystemOrange,
  },
  fullBadge: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.iosTertiaryLabel,
    textAlign: 'center',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlayMedium,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.iosLabel,
  },
  closeButton: {
    padding: 4,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  modalItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.iosLabel,
    flex: 1,
  },
  modalDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.iosTertiaryLabel,
    lineHeight: 20,
    marginBottom: 12,
  },
  modalProgress: {
    marginTop: 12,
  },
  modalProgressText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.iosTertiaryLabel,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.iosLabel,
    marginBottom: 12,
  },
  priceBreakdown: {
    backgroundColor: Colors.iosSecondaryBackground,
    borderRadius: 12,
    padding: 16,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.iosTertiaryLabel,
  },
  originalPriceModal: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.iosTertiaryLabel,
    textDecorationLine: 'line-through',
  },
  discountAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.iosSystemRed,
  },
  finalPriceRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.iosQuaternaryFill,
  },
  finalPriceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.iosLabel,
  },
  finalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.iosSystemRed,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 12,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.iosSecondaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.iosLabel,
    minWidth: 40,
    textAlign: 'center',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.iosLabel,
    textAlign: 'center',
  },
  deadlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.iosSystemOrangeAlpha10,
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  deadlineNoticeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.iosSystemOrange,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    ...Shadows.lg,
  },
  applyButtonDisabled: {
    backgroundColor: Colors.iosQuaternaryFill,
  },
  applyButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.white,
  },
  // DS migration helper styles
  originalPriceDecor: {
    textDecorationLine: 'line-through',
  },
  fullBadgeMargin: {
    marginTop: 8,
  },
  flex1: {
    flex: 1,
  },
  sectionTitleMargin: {
    marginBottom: 12,
  },
  quantityTextStyle: {
    minWidth: 40,
    textAlign: 'center',
  },
});

export default GroupBuyButton;
