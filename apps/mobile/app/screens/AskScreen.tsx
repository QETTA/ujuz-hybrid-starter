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
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { Colors, Layout } from '@/app/constants';
import { ConfidenceBadge, InsightCard, ProvenanceFooter } from '@/app/components/dataBlock';
import { TamaguiText, TamaguiPressableScale } from '@/app/design-system';
import { useAskEngine } from '@/app/hooks/useAskEngine';
import { useAnalytics } from '@/app/hooks/useAnalytics';
import { usePlaceStore } from '@/app/stores/placeStore';
import { COPY } from '@/app/copy/copy.ko';
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
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  useAnalytics('Ask');

  const { answer, loading, error } = useAskEngine(query);
  const blocks = useMemo(() => answer?.blocks ?? [], [answer]);
  const { selectPlace } = usePlaceStore();
  const isSubmitDisabled = draft.trim().length < 2;

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
    navigation.navigate('PeerGroups');
  }, [navigation]);

  const showEmptyState = messages.length === 0 && !loading && !answer;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <TamaguiText preset="h3" textColor="primary" weight="bold" style={styles.headerTitle}>
            {COPY.SCREEN_ASK}
          </TamaguiText>
          <View style={styles.headerBadge}>
            <Ionicons name="sparkles" size={10} color={Colors.primary} />
            <TamaguiText
              preset="caption"
              textColor="secondary"
              weight="semibold"
              style={styles.headerBadgeText}
            >
              근거 우선
            </TamaguiText>
          </View>
        </View>
        <TamaguiPressableScale
          style={styles.peerGroupBtn}
          onPress={handleOpenPeerGroups}
          hapticType="light"
          accessibilityLabel="또래 모임"
        >
          <Ionicons name="people" size={18} color={Colors.darkTextPrimary} />
        </TamaguiPressableScale>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={styles.chatContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Empty State */}
        {showEmptyState && (
          <Animated.View entering={FadeIn.delay(200)} style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.darkTextTertiary} />
            </View>
            <TamaguiText
              preset="body"
              textColor="secondary"
              weight="semibold"
              style={styles.emptyTitle}
            >
              무엇이든 물어보세요
            </TamaguiText>
            <TamaguiText preset="caption" textColor="tertiary" style={styles.emptyDesc}>
              근거 기반 답변과 장소 추천을 드려요
            </TamaguiText>

            {/* Suggestion Grid */}
            <View style={styles.suggestionGrid}>
              {SUGGESTIONS.map((item, i) => (
                <Animated.View
                  key={item}
                  entering={FadeInDown.delay(300 + i * 80)
                    .springify()
                    .damping(16)}
                >
                  <TamaguiPressableScale
                    style={styles.suggestionCard}
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
                      color={Colors.darkTextSecondary}
                      style={styles.suggestionIcon}
                    />
                    <TamaguiText
                      preset="caption"
                      textColor="primary"
                      weight="medium"
                      style={styles.suggestionCardText}
                    >
                      {item}
                    </TamaguiText>
                  </TamaguiPressableScale>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Message Bubbles */}
        {messages.map((msg) => (
          <Animated.View
            key={msg.id}
            entering={FadeInDown.duration(300).springify().damping(16)}
            style={msg.type === 'user' ? styles.userBubbleWrap : styles.aiBubbleWrap}
          >
            {msg.type === 'ai' && (
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={14} color={Colors.primary} />
              </View>
            )}
            <View style={msg.type === 'user' ? styles.userBubble : styles.aiBubble}>
              <TamaguiText
                preset="body"
                style={msg.type === 'user' ? styles.userBubbleText : styles.aiBubbleText}
              >
                {msg.text}
              </TamaguiText>
            </View>
          </Animated.View>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <Animated.View entering={FadeIn} style={styles.aiBubbleWrap}>
            <View style={styles.aiAvatar}>
              <Ionicons name="sparkles" size={14} color={Colors.primary} />
            </View>
            <View style={styles.loadingBubble}>
              <ActivityIndicator color={Colors.darkTextSecondary} size="small" />
              <TamaguiText preset="caption" textColor="secondary" style={styles.loadingText}>
                답변 생성 중...
              </TamaguiText>
            </View>
          </Animated.View>
        )}

        {/* AI Answer Card */}
        {answer && !loading && (
          <Animated.View
            entering={FadeInUp.delay(100).springify().damping(16)}
            style={styles.answerSection}
          >
            {/* Answer Summary Card */}
            <View style={styles.answerCard}>
              <View style={styles.answerHeader}>
                <View style={styles.answerHeaderLeft}>
                  <Ionicons name="sparkles" size={16} color={Colors.primary} />
                  <TamaguiText
                    preset="body"
                    textColor="primary"
                    weight="bold"
                    style={styles.answerTitle}
                  >
                    추천 요약
                  </TamaguiText>
                </View>
                <ConfidenceBadge confidence={answer.confidence} size="sm" />
              </View>

              {/* Evidence Trust Line */}
              <View style={styles.trustLine}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.darkTextTertiary} />
                <TamaguiText
                  preset="caption"
                  textColor="tertiary"
                  weight="medium"
                  style={styles.trustText}
                >
                  {evidence.blockCount > 0
                    ? COPY.TRUST_ROW(
                        evidence.blockCount,
                        evidence.sourceCount,
                        evidence.avgConfidence
                      )
                    : COPY.EVIDENCE_EMPTY}
                </TamaguiText>
              </View>

              <TamaguiText preset="body" textColor="secondary" style={styles.answerBody}>
                {error
                  ? COPY.ASK_FAILED
                  : (answer.summary ?? '질문을 입력하면 근거 기반 답변을 보여드려요.')}
              </TamaguiText>

              {blocks[0] && (
                <View style={styles.answerProvenance}>
                  <ProvenanceFooter block={blocks[0]} compact />
                </View>
              )}
            </View>

            {/* Place Card */}
            {answer.place && (
              <TamaguiPressableScale
                style={styles.placeCard}
                onPress={handleOpenPlace}
                hapticType="light"
                accessibilityLabel={`추천 장소: ${answer.place.name}`}
              >
                <View style={styles.placeCardInner}>
                  <View style={styles.placeCardLeft}>
                    <View style={styles.placeCardIcon}>
                      <Ionicons name="location" size={16} color={Colors.primary} />
                    </View>
                    <View style={styles.placeCardInfo}>
                      <TamaguiText
                        preset="body"
                        textColor="primary"
                        weight="bold"
                        style={styles.placeName}
                      >
                        {answer.place.name}
                      </TamaguiText>
                      <TamaguiText preset="caption" textColor="secondary" style={styles.placeMeta}>
                        {answer.place.distance ? `${Math.round(answer.place.distance)}m · ` : ''}
                        {answer.place.category ?? '추천 장소'}
                      </TamaguiText>
                    </View>
                  </View>
                  <View style={styles.placeCardRight}>
                    <ConfidenceBadge confidence={answer.confidence} size="sm" />
                    <Ionicons name="chevron-forward" size={16} color={Colors.darkTextTertiary} />
                  </View>
                </View>
              </TamaguiPressableScale>
            )}

            {/* Evidence Blocks */}
            {blocks.length > 0 && (
              <View style={styles.evidenceSection}>
                <TamaguiText
                  preset="caption"
                  textColor="primary"
                  weight="bold"
                  style={styles.evidenceSectionTitle}
                >
                  {COPY.EVIDENCE_TITLE}
                </TamaguiText>
                <View style={styles.blockGrid}>
                  {blocks.map((block, index) => (
                    <InsightCard
                      key={`${block.source}-${index}`}
                      label={index === 0 ? '대기 시간' : index === 1 ? '딜' : COPY.SAFETY_LABEL}
                      block={block}
                    />
                  ))}
                </View>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Floating Input Bar */}
      <Animated.View
        entering={FadeInUp.delay(200).springify().damping(18)}
        style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        {/* Quick Suggestion Chips (when no messages) */}
        {messages.length > 0 && !loading && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipScrollContent}
          >
            {SUGGESTIONS.map((item) => (
              <TamaguiPressableScale
                key={item}
                style={styles.chipBtn}
                hapticType="light"
                onPress={() => handleSuggestion(item)}
                accessibilityLabel={`질문 제안: ${item}`}
              >
                <TamaguiText preset="caption" textColor="secondary" style={styles.chipText}>
                  {item}
                </TamaguiText>
              </TamaguiPressableScale>
            ))}
          </ScrollView>
        )}

        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="질문을 입력하세요"
            placeholderTextColor={Colors.darkTextTertiary}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
            multiline={false}
            accessibilityLabel="메시지 입력"
            accessibilityHint="우주봇에게 질문을 입력하세요"
          />
          <TamaguiPressableScale
            style={[styles.sendBtn, (isSubmitDisabled || loading) && styles.sendBtnDisabled]}
            hapticType="medium"
            onPress={handleSubmit}
            disabled={isSubmitDisabled || loading}
            accessibilityLabel="질문 보내기"
          >
            {loading ? (
              <ActivityIndicator color={Colors.darkBg} size="small" />
            ) : (
              <Ionicons name="arrow-up" size={18} color={Colors.darkBg} />
            )}
          </TamaguiPressableScale>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.darkBorder,
    backgroundColor: Colors.darkBg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.8,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.darkSurfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.darkTextSecondary,
  },
  peerGroupBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.darkSurfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chat Area
  chatArea: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 16,
    paddingBottom: 16,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.darkSurfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.darkTextTertiary,
    letterSpacing: -0.2,
    marginBottom: 28,
  },
  suggestionGrid: {
    width: '100%',
    gap: 8,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkSurface,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionCardText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.2,
  },

  // User Bubble
  userBubbleWrap: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  userBubble: {
    maxWidth: '80%',
    backgroundColor: Colors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userBubbleText: {
    fontSize: 15,
    color: Colors.darkBg,
    lineHeight: 21,
  },

  // AI Bubble
  aiBubbleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.darkSurfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiBubble: {
    maxWidth: '80%',
    backgroundColor: Colors.darkSurface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  aiBubbleText: {
    fontSize: 15,
    color: Colors.darkTextPrimary,
    lineHeight: 21,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.darkSurface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.darkTextSecondary,
  },

  // Answer Section
  answerSection: {
    marginTop: 4,
    gap: 10,
  },
  answerCard: {
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  answerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  answerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.3,
  },
  trustLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 8,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.darkTextTertiary,
    letterSpacing: -0.1,
  },
  answerBody: {
    fontSize: 14,
    color: Colors.darkTextSecondary,
    lineHeight: 21,
  },
  answerProvenance: {
    marginTop: 10,
  },

  // Place Card
  placeCard: {
    backgroundColor: Colors.darkSurface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  placeCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  placeCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.darkSurfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeCardInfo: {
    flex: 1,
  },
  placeCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  placeName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.3,
  },
  placeMeta: {
    fontSize: 12,
    color: Colors.darkTextSecondary,
    marginTop: 2,
  },

  // Evidence Section
  evidenceSection: {
    marginTop: 4,
  },
  evidenceSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  blockGrid: {
    gap: 8,
  },

  // Floating Input Bar
  inputBar: {
    backgroundColor: Colors.darkBg,
    borderTopWidth: 0.5,
    borderTopColor: Colors.darkBorder,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 8,
  },
  chipScroll: {
    marginBottom: 8,
  },
  chipScrollContent: {
    gap: 6,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  chipText: {
    fontSize: 12,
    color: Colors.darkTextSecondary,
    letterSpacing: -0.1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: Colors.darkSurface,
    borderRadius: 22,
    fontSize: 15,
    color: Colors.darkTextPrimary,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
