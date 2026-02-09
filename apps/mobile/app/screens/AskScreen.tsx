/**
 * AskScreen - uju intelligence Q&A
 *
 * 2026 Chat-style UI with evidence-first answers.
 * - Message bubbles (user right, AI left)
 * - Floating input bar at bottom
 * - Horizontal suggestion chips
 * - Evidence cards within AI response
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { useTheme, YStack, XStack, Text } from 'tamagui';
import { Layout, Colors } from '@/app/constants';
import { ConfidenceBadge, InsightCard, ProvenanceFooter } from '@/app/components/dataBlock';
import {
  TamaguiText,
  TamaguiPressableScale,
  ProactiveAICard,
  TamaguiChip,
  TamaguiInput,
  QuotaBar,
} from '@/app/design-system';
import { useAskEngine } from '@/app/hooks/useAskEngine';
import { useAnalytics } from '@/app/hooks/useAnalytics';
import { usePayment } from '@/app/hooks/usePayment';
import { usePlaceStore } from '@/app/stores/placeStore';
import { COPY } from '@/app/copy/copy.ko';
import { PLAN_LIMITS } from '@/app/types/subscription';
import type { RootStackNavigationProp } from '@/app/types/navigation';

const SUGGESTIONS = [
  '이 동네 키즈카페 추천해줘',
  '오늘 대기 짧은 곳은?',
  '3세 아이랑 갈만한 실내',
  '이번 주 딜 있는 곳',
];

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  text: string;
}

export default function AskScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp>();
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  useAnalytics('Ask');

  const { answer, loading, error } = useAskEngine(query);
  const blocks = useMemo(() => answer?.blocks ?? [], [answer]);
  const { selectPlace } = usePlaceStore();
  const isSubmitDisabled = draft.trim().length < 2;

  const { subscription, currentTier } = usePayment();
  const botQueriesLimit = PLAN_LIMITS[currentTier].bot_query_daily_limit;
  const botQueriesUsed = subscription?.usage.bot_queries_today ?? 0;

  const evidence = useMemo(() => {
    const blockCount = blocks.length;
    const sourceCount = new Set(blocks.map((block) => block.source)).size;
    const avgConfidence =
      blockCount > 0
        ? Math.round((blocks.reduce((sum, block) => sum + block.confidence, 0) / blockCount) * 100)
        : 0;
    return { blockCount, sourceCount, avgConfidence };
  }, [blocks]);

  const handleSubmit = useCallback(() => {
    const next = draft.trim();
    if (next.length < 2) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, type: 'user', text: next }]);
    setDraft('');
    setQuery(next);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [draft]);

  const handleSuggestion = useCallback((value: string) => {
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, type: 'user', text: value }]);
    setDraft('');
    setQuery(value);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const handleOpenPlace = useCallback(() => {
    if (!answer?.place) return;
    selectPlace(answer.place);
    navigation.navigate('PlaceDetail');
  }, [answer, navigation, selectPlace]);

  const handleOpenPeerGroups = useCallback(() => {
    // PeerGroups screen not yet implemented — guard to prevent navigation error
    if (__DEV__) console.log('[AskScreen] PeerGroups screen not yet registered');
  }, []);

  const showEmptyState = messages.length === 0 && !loading && !answer;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background.val }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <XStack
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal={Layout.screenPadding}
        paddingBottom={12}
        borderBottomWidth={0.5}
        borderBottomColor="$borderColor"
        backgroundColor="$background"
        style={{ paddingTop: insets.top + 8 }}
      >
        <XStack alignItems="center" gap="$2">
          <TamaguiText
            preset="h3"
            textColor="primary"
            weight="bold"
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: theme.textPrimary.val,
              letterSpacing: -0.8,
            }}
          >
            {COPY.SCREEN_ASK}
          </TamaguiText>
          <XStack
            alignItems="center"
            gap="$1"
            backgroundColor="$surfaceElevated"
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius={6}
          >
            <Ionicons name="sparkles" size={10} color={theme.primary.val} />
            <TamaguiText
              preset="caption"
              textColor="secondary"
              weight="semibold"
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: theme.textSecondary.val,
              }}
            >
              근거 우선
            </TamaguiText>
          </XStack>
        </XStack>
        <TamaguiPressableScale
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.surfaceElevated.val,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={handleOpenPeerGroups}
          hapticType="light"
          accessibilityLabel="또래 모임"
        >
          <Ionicons name="people" size={18} color={theme.textPrimary.val} />
        </TamaguiPressableScale>
      </XStack>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: Layout.screenPadding,
          paddingTop: 16,
          paddingBottom: 16,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ProactiveAICard */}
        {messages.length === 0 && !loading && (
          <ProactiveAICard
            type="recommendation"
            message="서윤이 또래 부모들이 많이 찾는 곳을 알려드릴까요?"
            ctaText="추천 받기"
            onCtaPress={() => handleSuggestion('이 동네 키즈카페 추천해줘')}
            onDismiss={() => {}}
          />
        )}

        {/* Empty State */}
        {showEmptyState && (
          <Animated.View
            entering={FadeIn.delay(200)}
            style={{ alignItems: 'center', paddingTop: 60 }}
          >
            <YStack
              width={80}
              height={80}
              borderRadius={40}
              backgroundColor="$surfaceElevated"
              alignItems="center"
              justifyContent="center"
              marginBottom={16}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={48}
                color={theme.textTertiary.val}
              />
            </YStack>
            <TamaguiText
              preset="body"
              textColor="secondary"
              weight="semibold"
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: theme.textPrimary.val,
                letterSpacing: -0.3,
                marginBottom: 6,
              }}
            >
              무엇이든 물어보세요
            </TamaguiText>
            <TamaguiText
              preset="caption"
              textColor="tertiary"
              style={{
                fontSize: 13,
                color: theme.textTertiary.val,
                letterSpacing: -0.2,
                marginBottom: 28,
              }}
            >
              근거 기반 답변과 장소 추천을 드려요
            </TamaguiText>

            {/* Suggestion Grid */}
            <YStack width="100%" gap="$2">
              {SUGGESTIONS.map((item, i) => (
                <Animated.View
                  key={item}
                  entering={FadeInDown.delay(300 + i * 80)
                    .springify()
                    .damping(16)}
                >
                  <TamaguiPressableScale
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: theme.surface.val,
                      borderRadius: 14,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderWidth: 0.5,
                      borderColor: theme.borderColor.val,
                    }}
                    hapticType="light"
                    onPress={() => handleSuggestion(item)}
                    accessibilityLabel={`질문 제안: ${item}`}
                  >
                    <Ionicons
                      name={
                        i === 0
                          ? 'cafe-outline'
                          : i === 1
                            ? 'time-outline'
                            : i === 2
                              ? 'home-outline'
                              : 'pricetag-outline'
                      }
                      size={18}
                      color={theme.textSecondary.val}
                      style={{ marginRight: 12 }}
                    />
                    <TamaguiText
                      preset="caption"
                      textColor="primary"
                      weight="medium"
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: theme.textPrimary.val,
                        letterSpacing: -0.2,
                      }}
                    >
                      {item}
                    </TamaguiText>
                  </TamaguiPressableScale>
                </Animated.View>
              ))}
            </YStack>
          </Animated.View>
        )}

        {/* Message Bubbles */}
        {messages.map((msg) => (
          <Animated.View
            key={msg.id}
            entering={FadeInDown.duration(300).springify().damping(16)}
            style={
              msg.type === 'user'
                ? { alignItems: 'flex-end' as const, marginBottom: 12 }
                : {
                    flexDirection: 'row' as const,
                    alignItems: 'flex-start' as const,
                    marginBottom: 12,
                    gap: 8,
                  }
            }
          >
            {msg.type === 'ai' && (
              <YStack
                width={28}
                height={28}
                borderRadius={14}
                backgroundColor="$surfaceElevated"
                alignItems="center"
                justifyContent="center"
                marginTop={2}
              >
                <Ionicons name="sparkles" size={14} color={theme.primary.val} />
              </YStack>
            )}
            <View
              style={
                msg.type === 'user'
                  ? {
                      maxWidth: '80%',
                      backgroundColor: theme.primary.val,
                      borderRadius: 18,
                      borderBottomRightRadius: 4,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                    }
                  : {
                      maxWidth: '80%',
                      backgroundColor: theme.surface.val,
                      borderRadius: 18,
                      borderBottomLeftRadius: 4,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                    }
              }
            >
              <TamaguiText
                preset="body"
                style={
                  msg.type === 'user'
                    ? { fontSize: 15, color: theme.background.val, lineHeight: 21 }
                    : { fontSize: 15, color: theme.textPrimary.val, lineHeight: 21 }
                }
              >
                {msg.text}
              </TamaguiText>
            </View>
          </Animated.View>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <Animated.View
            entering={FadeIn}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              marginBottom: 12,
              gap: 8,
            }}
          >
            <YStack
              width={28}
              height={28}
              borderRadius={14}
              backgroundColor="$surfaceElevated"
              alignItems="center"
              justifyContent="center"
              marginTop={2}
            >
              <Ionicons name="sparkles" size={14} color={theme.primary.val} />
            </YStack>
            <XStack
              alignItems="center"
              gap="$2"
              backgroundColor="$surface"
              borderRadius={18}
              borderBottomLeftRadius={4}
              paddingHorizontal={16}
              paddingVertical={12}
            >
              <ActivityIndicator color={theme.textSecondary.val} size="small" />
              <TamaguiText
                preset="caption"
                textColor="secondary"
                style={{ fontSize: 13, color: theme.textSecondary.val }}
              >
                답변 생성 중...
              </TamaguiText>
            </XStack>
          </Animated.View>
        )}

        {/* AI Answer Card */}
        {answer && !loading && (
          <Animated.View
            entering={FadeInUp.delay(100).springify().damping(16)}
            style={{ marginTop: 4, gap: 10 }}
          >
            {/* Answer Summary Card */}
            <YStack
              backgroundColor="$surface"
              borderRadius={16}
              padding={16}
              borderWidth={0.5}
              borderColor="$borderColor"
            >
              <XStack
                alignItems="center"
                justifyContent="space-between"
                marginBottom={8}
              >
                <XStack alignItems="center" gap="$1.5">
                  <Ionicons name="sparkles" size={16} color={theme.primary.val} />
                  <TamaguiText
                    preset="body"
                    textColor="primary"
                    weight="bold"
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      color: theme.textPrimary.val,
                      letterSpacing: -0.3,
                    }}
                  >
                    추천 요약
                  </TamaguiText>
                </XStack>
                <ConfidenceBadge confidence={answer.confidence} size="sm" />
              </XStack>

              {/* Evidence Trust Line - Shield Badge */}
              <XStack
                alignItems="center"
                gap="$1.5"
                paddingVertical="$1.5"
                paddingHorizontal="$2.5"
                backgroundColor="$surfaceElevated"
                borderRadius={8}
                marginBottom={10}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={12}
                  color={theme.textTertiary.val}
                />
                <Text fontSize={11} fontWeight="600" color="$textTertiary">
                  {evidence.blockCount}개 소스 기반
                </Text>
                <View
                  style={{
                    backgroundColor: Colors.primaryAlpha15,
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 4,
                  }}
                >
                  <Text fontSize={10} fontWeight="600" color="$primary">
                    높은 신뢰도
                  </Text>
                </View>
              </XStack>

              <TamaguiText
                preset="body"
                textColor="secondary"
                style={{
                  fontSize: 14,
                  color: theme.textSecondary.val,
                  lineHeight: 21,
                }}
              >
                {error
                  ? COPY.ASK_FAILED
                  : (answer.summary ?? '질문을 입력하면 근거 기반 답변을 보여드려요.')}
              </TamaguiText>

              {blocks[0] && (
                <YStack marginTop={10}>
                  <ProvenanceFooter block={blocks[0]} compact />
                </YStack>
              )}
            </YStack>

            {/* Place Card */}
            {answer.place && (
              <TamaguiPressableScale
                style={{
                  backgroundColor: theme.surface.val,
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 0.5,
                  borderColor: theme.borderColor.val,
                }}
                onPress={handleOpenPlace}
                hapticType="light"
                accessibilityLabel={`추천 장소: ${answer.place.name}`}
              >
                <XStack alignItems="center" justifyContent="space-between">
                  <XStack alignItems="center" flex={1} gap="$2.5">
                    <YStack
                      width={36}
                      height={36}
                      borderRadius={10}
                      backgroundColor="$surfaceElevated"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Ionicons
                        name="location"
                        size={16}
                        color={theme.primary.val}
                      />
                    </YStack>
                    <YStack flex={1}>
                      <TamaguiText
                        preset="body"
                        textColor="primary"
                        weight="bold"
                        style={{
                          fontSize: 15,
                          fontWeight: '700',
                          color: theme.textPrimary.val,
                          letterSpacing: -0.3,
                        }}
                      >
                        {answer.place.name}
                      </TamaguiText>
                      <TamaguiText
                        preset="caption"
                        textColor="secondary"
                        style={{
                          fontSize: 12,
                          color: theme.textSecondary.val,
                          marginTop: 2,
                        }}
                      >
                        {answer.place.distance
                          ? `${Math.round(answer.place.distance)}m · `
                          : ''}
                        {answer.place.category ?? '추천 장소'}
                      </TamaguiText>
                    </YStack>
                  </XStack>
                  <XStack alignItems="center" gap="$1.5">
                    <ConfidenceBadge confidence={answer.confidence} size="sm" />
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={theme.textTertiary.val}
                    />
                  </XStack>
                </XStack>
              </TamaguiPressableScale>
            )}

            {/* Evidence Blocks */}
            {blocks.length > 0 && (
              <YStack marginTop={4}>
                <TamaguiText
                  preset="caption"
                  textColor="primary"
                  weight="bold"
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: theme.textPrimary.val,
                    letterSpacing: -0.2,
                    marginBottom: 8,
                  }}
                >
                  {COPY.EVIDENCE_TITLE}
                </TamaguiText>
                <YStack gap="$2">
                  {blocks.map((block, index) => (
                    <InsightCard
                      key={`${block.source}-${index}`}
                      label={
                        index === 0
                          ? '대기 시간'
                          : index === 1
                            ? '딜'
                            : COPY.SAFETY_LABEL
                      }
                      block={block}
                    />
                  ))}
                </YStack>
              </YStack>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Floating Input Bar */}
      <Animated.View
        entering={FadeInUp.delay(200).springify().damping(18)}
        style={{
          backgroundColor: theme.background.val,
          borderTopWidth: 0.5,
          borderTopColor: theme.borderColor.val,
          paddingHorizontal: Layout.screenPadding,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 12),
        }}
      >
        {/* Quick Suggestion Chips (when has messages) */}
        {messages.length > 0 && !loading && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 8 }}
            contentContainerStyle={{ gap: 6 }}
          >
            {SUGGESTIONS.map((item) => (
              <TamaguiChip
                key={item}
                label={item}
                variant="glass"
                onPress={() => handleSuggestion(item)}
              />
            ))}
          </ScrollView>
        )}

        <XStack alignItems="center" gap="$2">
          <YStack flex={1}>
            <TamaguiInput
              variant="chat"
              placeholder="질문을 입력하세요"
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={handleSubmit}
              rightIcon="mic-outline"
              onRightIconPress={() => {
                /* voice input placeholder */
              }}
              returnKeyType="send"
              multiline={false}
              accessibilityLabel="메시지 입력"
              accessibilityHint="우주봇에게 질문을 입력하세요"
            />
          </YStack>
          <TamaguiPressableScale
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: theme.primary.val,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isSubmitDisabled || loading ? 0.4 : 1,
            }}
            hapticType="medium"
            onPress={handleSubmit}
            disabled={isSubmitDisabled || loading}
            accessibilityLabel="질문 보내기"
          >
            {loading ? (
              <ActivityIndicator color={theme.background.val} size="small" />
            ) : (
              <Ionicons name="arrow-up" size={18} color={theme.background.val} />
            )}
          </TamaguiPressableScale>
        </XStack>

        {/* QuotaBar */}
        {botQueriesUsed >= botQueriesLimit * 0.8 && (
          <QuotaBar
            label="우주봇"
            used={botQueriesUsed}
            total={botQueriesLimit}
            iconName="chatbubble-outline"
            showUpgradeCta={botQueriesUsed >= botQueriesLimit}
            onUpgradePress={() => navigation.navigate('Subscription' as any)}
          />
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}
