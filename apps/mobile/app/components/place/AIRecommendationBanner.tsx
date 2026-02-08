/**
 * AI Recommendation Banner Component
 *
 * 2026 UX: AI 기반 개인화 추천 배너
 * 날씨, 시간, 아이 연령 고려
 */

import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/app/constants';

export interface AIRecommendationContext {
  childAge?: 'infant' | 'toddler' | 'child' | 'elementary';
  weather?: 'sunny' | 'rainy' | 'cloudy';
  time?: 'morning' | 'afternoon' | 'evening';
  temperature?: number;
}

export interface AIRecommendationBannerProps {
  context: AIRecommendationContext;
  recommendationText?: string;
  placeCount?: number;
  onPress: () => void;
}

export default function AIRecommendationBanner({
  context,
  recommendationText,
  placeCount = 5,
  onPress,
}: AIRecommendationBannerProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  // Generate contextual text - 2026 UX (emoji-free, text-first)
  const getContextText = () => {
    const parts: string[] = [];

    if (context.weather === 'sunny') parts.push('맑은 날씨');
    else if (context.weather === 'rainy') parts.push('비 오는 날');
    else if (context.weather === 'cloudy') parts.push('흐린 날씨');

    if (context.time === 'morning') parts.push('오전');
    else if (context.time === 'afternoon') parts.push('오후');
    else if (context.time === 'evening') parts.push('저녁');

    if (context.childAge === 'infant') parts.push('영아');
    else if (context.childAge === 'toddler') parts.push('유아');
    else if (context.childAge === 'child') parts.push('아동');
    else if (context.childAge === 'elementary') parts.push('초등학생');

    return parts.join(' · ');
  };

  const contextText = getContextText();
  const displayText = recommendationText || `${contextText}에 딱 맞는 장소`;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.9}
      accessible={true}
      accessibilityLabel={`AI recommendation: ${displayText}. ${placeCount} places recommended.`}
      accessibilityRole="button"
      accessibilityHint="Double tap to view AI recommended places"
    >
      {/* Glassmorphism background - iOS 26 style */}
      <View style={styles.gradient}>
        {/* Content */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.aiLabelContainer}>
              <Ionicons
                name="sparkles"
                size={14}
                color={Colors.primary}
                accessibilityElementsHidden={true}
              />
              <Text style={styles.aiLabel}>AI 추천</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{placeCount}곳</Text>
            </View>
          </View>

          <Text style={styles.title}>{displayText}</Text>

          {contextText && <Text style={styles.subtitle}>{contextText}</Text>}
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.primary}
            accessibilityElementsHidden={true}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
    // Enhanced shadow for 2026
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  gradient: {
    // Glassmorphism effect - iOS 26
    backgroundColor: Colors.iosSystemBlueAlpha08,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.iosSystemBlueAlpha20,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  aiLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary700,
    letterSpacing: -0.2,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.iosLabel,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.iosTertiaryLabel,
  },
  arrowContainer: {
    marginLeft: 12,
    opacity: 0.6,
  },
});
