/**
 * Group Buy Button Component
 *
 * 2026 UX: 공동구매 신청 버튼 (핵심 비즈니스 모델)
 * Design System: TamaguiText, TamaguiPressableScale
 */

import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '@/app/constants';
import { getGroupBuyLabel, getGroupBuyHint } from '@/app/utils/accessibility';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';

export interface GroupBuyButtonProps {
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  currentParticipants: number;
  targetParticipants: number;
  deadline?: string;
  onPress: () => void;
  variant?: 'card' | 'detail'; // card: PlaceCard용, detail: DetailSheet용
}

export default function GroupBuyButton({
  originalPrice,
  discountedPrice,
  discountPercent,
  currentParticipants,
  targetParticipants,
  deadline,
  onPress,
  variant = 'card',
}: GroupBuyButtonProps) {
  const safeTarget = targetParticipants > 0 ? targetParticipants : 1;
  const progressPercent = (currentParticipants / safeTarget) * 100;
  const clampedProgress = Math.min(Math.max(progressPercent, 0), 100);
  const isAlmostFull = clampedProgress >= 80;
  const isFull = targetParticipants <= 0 ? true : currentParticipants >= targetParticipants;

  // TamaguiPressableScale handles haptic feedback internally

  if (variant === 'card') {
    // Compact version for PlaceCard
    return (
      <TamaguiPressableScale
        onPress={onPress}
        hapticType="medium"
        style={[styles.cardButton, isFull && styles.cardButtonFull]}
        accessibilityLabel={getGroupBuyLabel({
          currentCount: currentParticipants,
          maxCount: targetParticipants,
          discountRate: discountPercent,
          isFull,
        })}
        accessibilityHint={getGroupBuyHint(isFull)}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <Ionicons
              name="people"
              size={14}
              color={Colors.white}
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
            />
            <TamaguiText preset="caption" textColor="inverse" weight="semibold">
              공구 {discountPercent}% 할인
            </TamaguiText>
          </View>
          <View style={styles.cardProgress}>
            <TamaguiText
              preset="caption"
              textColor="inverse"
              weight="semibold"
              style={styles.cardProgressSmall}
            >
              {currentParticipants}/{targetParticipants}
            </TamaguiText>
          </View>
        </View>
      </TamaguiPressableScale>
    );
  }

  // Full version for PlaceDetailSheet
  return (
    <TamaguiPressableScale
      onPress={isFull ? undefined : onPress}
      disabled={isFull}
      hapticType="medium"
      style={[styles.detailButton, isFull && styles.detailButtonFull]}
      accessibilityLabel={getGroupBuyLabel({
        currentCount: currentParticipants,
        maxCount: targetParticipants,
        discountRate: discountPercent,
        isFull,
      })}
      accessibilityHint={getGroupBuyHint(isFull)}
    >
      {/* Discount badge */}
      <View style={styles.discountBadge}>
        <TamaguiText preset="caption" textColor="inverse" weight="bold">
          {discountPercent}% 할인
        </TamaguiText>
      </View>

      {/* Content */}
      <View style={styles.detailContent}>
        {/* Left: Price */}
        <View style={styles.priceContainer}>
          <TamaguiText preset="caption" textColor="inverse" style={styles.originalPriceDecor}>
            ₩{originalPrice.toLocaleString()}
          </TamaguiText>
          <TamaguiText preset="h3" textColor="inverse" weight="bold">
            ₩{discountedPrice.toLocaleString()}
          </TamaguiText>
          <TamaguiText preset="caption" textColor="inverse">
            {(originalPrice - discountedPrice).toLocaleString()}원 절약
          </TamaguiText>
        </View>

        {/* Right: Participants */}
        <View style={styles.participantsContainer}>
          <View style={styles.participantsHeader}>
            <Ionicons
              name="people"
              size={18}
              color={Colors.white}
              accessibilityElementsHidden={true}
              importantForAccessibility="no"
            />
            <TamaguiText preset="body" textColor="inverse" weight="semibold">
              {currentParticipants}/{targetParticipants}명
            </TamaguiText>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${clampedProgress}%` }]} />
          </View>

          {deadline && (
            <View style={styles.deadlineContainer}>
              <Ionicons
                name="time-outline"
                size={11}
                color={Colors.white}
                accessibilityElementsHidden={true}
                importantForAccessibility="no"
              />
              <TamaguiText preset="caption" textColor="inverse">
                {deadline} 마감
              </TamaguiText>
            </View>
          )}
        </View>
      </View>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        {!isFull && isAlmostFull && (
          <Ionicons
            name="flame"
            size={16}
            color={Colors.white}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          />
        )}
        {!isFull && !isAlmostFull && (
          <Ionicons
            name="gift-outline"
            size={16}
            color={Colors.white}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          />
        )}
        <TamaguiText preset="bodyLarge" textColor="inverse" weight="semibold">
          {isFull ? '마감되었습니다' : isAlmostFull ? '서둘러 신청하세요!' : '공동구매 신청하기'}
        </TamaguiText>
        {!isFull && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.white}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          />
        )}
      </View>
    </TamaguiPressableScale>
  );
}

const styles = StyleSheet.create({
  // Card variant (compact)
  cardButton: {
    backgroundColor: Colors.premium,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    ...Shadows.button,
  },
  cardButtonFull: {
    backgroundColor: Colors.gray500,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardProgressSmall: {
    fontSize: 10,
  },
  cardProgress: {
    backgroundColor: Colors.whiteAlpha30,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  originalPriceDecor: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },

  // Detail variant (full)
  detailButton: {
    backgroundColor: Colors.premium,
    borderRadius: 12,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.lg,
  },
  detailButtonFull: {
    backgroundColor: Colors.gray500,
    opacity: 0.7,
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.error,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  detailContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  priceContainer: {
    flex: 1,
  },
  originalPrice: {
    fontSize: 14,
    color: Colors.white,
    textDecorationLine: 'line-through',
    opacity: 0.7,
    marginBottom: 2,
  },
  discountedPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },
  savingsText: {
    fontSize: 12,
    color: Colors.white,
    opacity: 0.9,
  },
  participantsContainer: {
    alignItems: 'flex-end',
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  participantsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  progressBarContainer: {
    width: 100,
    height: 6,
    backgroundColor: Colors.whiteAlpha30,
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 3,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  deadlineText: {
    fontSize: 11,
    color: Colors.white,
    opacity: 0.9,
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.whiteAlpha20,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
