/**
 * HomeScreen v6 — UJUz (우쥬) 메인 화면
 *
 * Toss 2026 Senior Designer 리디자인
 * - Borderless hero: 숫자가 떠있는 느낌
 * - Metrics bar: 3개 박스 → 단일 바 + 디바이더
 * - 라이브 상태: 헤더 인라인
 * - 섹션 간격 대폭 확대 (호흡감)
 * - Ultra-thin display numbers (weight 100)
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { YStack, XStack } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useNavigation } from '@react-navigation/native';

import type { TabNavigationProp } from '@/app/types/navigation';

import { PeerActivityCard, PeerTrendWidget } from '@/app/components/peer';
import {
  TamaguiEmptyState,
  TamaguiSkeleton,
  TamaguiText,
  TamaguiPressableScale,
} from '@/app/design-system';
import { usePeerSync } from '@/app/hooks';
import { useProfileStore } from '@/app/stores/profileStore';
import { useAnalytics } from '@/app/hooks/useAnalytics';
import { useNotifications } from '@/app/hooks/useNotifications';
import { useAdmissionScore } from '@/app/hooks/useAdmissionScore';
import { usePayment } from '@/app/hooks/usePayment';
import { Colors } from '@/app/constants';
import type { PeerActivity } from '@/app/types/peerSync';
import { COPY } from '@/app/copy/copy.ko';

// ─── Constants ───────────────────────────────────────────
const stagger = (i: number) =>
  FadeInDown.delay(i * 60)
    .duration(400)
    .springify()
    .damping(18)
    .stiffness(120)
    .mass(0.8);

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return '늦은 밤이에요';
  if (h < 12) return '좋은 아침이에요';
  if (h < 18) return '안녕하세요';
  return '좋은 저녁이에요';
}

// ─── Types ───────────────────────────────────────────────
export interface HomeScreenPeerSyncProps {
  testID?: string;
}

// ═════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════
export function HomeScreenPeerSync({ testID }: HomeScreenPeerSyncProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<TabNavigationProp>();
  useAnalytics('UjuHome');

  // ─── Data ──────────────────────────────────────────
  const childName = useProfileStore((s) => s.childName);
  const childAgeMonths = useProfileStore((s) => s.getChildAgeMonths());
  const { unreadCount, alerts } = useNotifications();
  const { lastResult } = useAdmissionScore();
  const { currentTier, getRemainingQuota } = usePayment();

  const { liveStatus, activities, trends, refresh, isLoading } = usePeerSync({
    childAgeMonths,
    enablePolling: true,
  });

  const [refreshing, setRefreshing] = React.useState(false);

  // ─── Computed ──────────────────────────────────────
  const greeting = useMemo(() => getGreeting(), []);
  const ageLabel = useMemo(
    () => (childAgeMonths >= 12 ? `${Math.floor(childAgeMonths / 12)}세` : `${childAgeMonths}개월`),
    [childAgeMonths]
  );

  const lastUpdated = liveStatus?.lastUpdated;
  const syncLabel = useMemo(() => {
    if (!lastUpdated) return null;
    const date = new Date(lastUpdated);
    if (Number.isNaN(date.getTime())) return null;
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  }, [lastUpdated]);

  const scoreDisplay = lastResult?.probability;
  const scoreGrade = lastResult?.grade;
  const scoreFacility = lastResult?.facility_name;

  const latestAlert = alerts?.[0];
  const toActiveCount = useNotifications().subscriptions?.filter((s) => s.is_active)?.length ?? 0;

  const admissionQuota = getRemainingQuota('admission_score_limit');
  const botQuota = getRemainingQuota('bot_query_daily_limit');

  // ─── Live Pulse Animation ──────────────────────────
  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);
  const liveDotAnim = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  // ─── Handlers ──────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleActivityPress = useCallback(
    (_activity: PeerActivity) => {
      if (_activity.place?.id) {
        navigation.navigate('PlaceDetail', { id: _activity.place.id });
      }
    },
    [navigation]
  );

  const handlePlacePress = useCallback(
    (id: string) => navigation.navigate('PlaceDetail', { id }),
    [navigation]
  );

  const handleGroupBuyPress = useCallback(
    (id: string) => navigation.navigate('GroupBuy', { id }),
    [navigation]
  );

  // ─── Render ────────────────────────────────────────
  return (
    <View testID={testID} style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.darkTextTertiary}
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── 헤더 ─────────────────────────────────── */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <XStack alignItems="center" gap={10}>
            <TamaguiText style={styles.logo}>ujuz</TamaguiText>
            {liveStatus && (
              <XStack alignItems="center" gap={5}>
                <Animated.View style={[styles.liveDot, liveDotAnim]} />
                <TamaguiText style={styles.liveCount}>{liveStatus.activeNow}</TamaguiText>
              </XStack>
            )}
          </XStack>
          <XStack gap={16} alignItems="center">
            <TamaguiPressableScale
              hapticType="light"
              style={styles.hitArea}
              onPress={() => navigation.navigate('Search')}
            >
              <Ionicons name="search" size={20} color={Colors.darkTextSecondary} />
            </TamaguiPressableScale>
            <TamaguiPressableScale
              hapticType="light"
              style={styles.hitArea}
              onPress={() => navigation.navigate('NotificationHistory')}
            >
              <View>
                <Ionicons name="notifications-outline" size={20} color={Colors.darkTextSecondary} />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <TamaguiText style={styles.badgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </TamaguiText>
                  </View>
                )}
              </View>
            </TamaguiPressableScale>
          </XStack>
        </View>

        {/* ── 인사 ─────────────────────────────────── */}
        <Animated.View entering={stagger(0)} style={styles.greetingSection}>
          <TamaguiText style={styles.meta}>
            {childName || '우리 아이'} · {ageLabel}
          </TamaguiText>
          <TamaguiText style={styles.greeting}>{greeting}</TamaguiText>
        </Animated.View>

        {/* ── 히어로: 입학 가능성 ───────────────────── */}
        <Animated.View entering={stagger(1)} style={styles.heroSection}>
          <TamaguiPressableScale
            hapticType="medium"
            onPress={() => navigation.navigate('AdmissionScore')}
          >
            <View style={styles.heroCard}>
              <XStack justifyContent="space-between" alignItems="center">
                <TamaguiText style={styles.heroLabel}>입학 가능성</TamaguiText>
                {scoreGrade && (
                  <View style={styles.gradeChip}>
                    <TamaguiText style={styles.gradeText}>{scoreGrade}</TamaguiText>
                  </View>
                )}
              </XStack>

              {scoreDisplay != null ? (
                <View style={styles.heroScoreWrap}>
                  <XStack alignItems="baseline" gap={2}>
                    <TamaguiText style={styles.heroScore}>{Math.round(scoreDisplay)}</TamaguiText>
                    <TamaguiText style={styles.heroUnit}>%</TamaguiText>
                  </XStack>
                  {scoreFacility && (
                    <TamaguiText style={styles.heroFacility}>{scoreFacility}</TamaguiText>
                  )}
                </View>
              ) : (
                <View style={styles.heroEmptyWrap}>
                  <TamaguiText style={styles.heroEmpty}>
                    우리 아이,{'\n'}들어갈 수 있을까?
                  </TamaguiText>
                  <View style={styles.heroCta}>
                    <TamaguiText style={styles.heroCtaText}>무료로 확인</TamaguiText>
                    <Ionicons name="arrow-forward" size={14} color={Colors.darkBg} />
                  </View>
                </View>
              )}

              {syncLabel && <TamaguiText style={styles.heroSync}>{syncLabel} 업데이트</TamaguiText>}
            </View>
          </TamaguiPressableScale>
        </Animated.View>

        {/* ── 핵심 지표 ──────────────────────────────── */}
        <Animated.View entering={stagger(2)} style={styles.section}>
          <View style={styles.metricsBar}>
            <TamaguiPressableScale
              style={styles.metric}
              hapticType="light"
              onPress={() => navigation.navigate('AdmissionScore')}
            >
              <TamaguiText style={styles.metricValue}>
                {admissionQuota > 0 ? admissionQuota : '0'}
              </TamaguiText>
              <TamaguiText style={styles.metricLabel}>입학 조회</TamaguiText>
            </TamaguiPressableScale>

            <View style={styles.metricDivider} />

            <TamaguiPressableScale
              style={styles.metric}
              hapticType="light"
              onPress={() => navigation.navigate('TOAlertSettings')}
            >
              <TamaguiText style={styles.metricValue}>
                {toActiveCount > 0 ? toActiveCount : '0'}
              </TamaguiText>
              <TamaguiText style={styles.metricLabel}>빈자리 알림</TamaguiText>
            </TamaguiPressableScale>

            <View style={styles.metricDivider} />

            <TamaguiPressableScale
              style={styles.metric}
              hapticType="light"
              onPress={() => navigation.navigate('Ask')}
            >
              <TamaguiText style={styles.metricValue}>{botQuota > 0 ? botQuota : '0'}</TamaguiText>
              <TamaguiText style={styles.metricLabel}>우주봇</TamaguiText>
            </TamaguiPressableScale>
          </View>
        </Animated.View>

        {/* ── TO 알림 프리뷰 ─────────────────────── */}
        {latestAlert && (
          <Animated.View entering={stagger(3)} style={styles.section}>
            <TamaguiPressableScale
              hapticType="light"
              onPress={() => navigation.navigate('NotificationHistory')}
            >
              <View style={styles.alertCard}>
                <XStack justifyContent="space-between" alignItems="flex-start">
                  <YStack flex={1} gap={3}>
                    <TamaguiText style={styles.alertTitle}>{latestAlert.facility_name}</TamaguiText>
                    <TamaguiText style={styles.alertBody}>
                      {COPY.VACANCY_DETECTED(latestAlert.estimated_slots)}
                    </TamaguiText>
                  </YStack>
                  {!latestAlert.is_read && <View style={styles.unreadDot} />}
                </XStack>
                <TamaguiText style={styles.alertTime}>
                  {formatDistanceToNow(new Date(latestAlert.detected_at), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </TamaguiText>
              </View>
            </TamaguiPressableScale>
          </Animated.View>
        )}

        {/* ── 구독 배너 ──────────────────────────── */}
        {currentTier === 'free' && (
          <Animated.View entering={stagger(4)} style={styles.section}>
            <TamaguiPressableScale
              hapticType="light"
              onPress={() => navigation.navigate('Subscription')}
            >
              <View style={styles.tierCard}>
                <TamaguiText style={styles.tierLabel}>Free</TamaguiText>
                <TamaguiText style={styles.tierCta}>프리미엄으로 무제한 이용</TamaguiText>
                <Ionicons name="chevron-forward" size={14} color={Colors.darkTextTertiary} />
              </View>
            </TamaguiPressableScale>
          </Animated.View>
        )}

        {/* ── 트렌드 ──────────────────────────────── */}
        {trends && (
          <Animated.View entering={stagger(5)} style={styles.trendWrap}>
            <PeerTrendWidget
              trends={trends}
              onPlacePress={handlePlacePress}
              onGroupBuyPress={handleGroupBuyPress}
            />
          </Animated.View>
        )}

        {/* ── 또래 피드 ───────────────────────────── */}
        <Animated.View entering={stagger(6)} style={styles.feedSection}>
          <XStack justifyContent="space-between" alignItems="center" marginBottom={16}>
            <TamaguiText style={styles.feedTitle}>또래 피드</TamaguiText>
            <TamaguiPressableScale hapticType="light" style={styles.hitArea}>
              <TamaguiText style={styles.feedMore}>더보기</TamaguiText>
            </TamaguiPressableScale>
          </XStack>

          {isLoading && activities.length === 0 ? (
            <YStack gap={12}>
              {[0, 1].map((i) => (
                <YStack
                  key={i}
                  gap={8}
                  padding={16}
                  backgroundColor="$surfaceMuted"
                  borderRadius={16}
                >
                  <TamaguiSkeleton variant="title" width="half" />
                  <TamaguiSkeleton variant="text" width="full" />
                  <TamaguiSkeleton variant="text" width="third" />
                </YStack>
              ))}
            </YStack>
          ) : activities.length > 0 ? (
            <YStack gap={10}>
              {activities.map((activity) => (
                <PeerActivityCard
                  key={activity.id}
                  activity={activity}
                  onPress={() => handleActivityPress(activity)}
                />
              ))}
            </YStack>
          ) : (
            <TamaguiEmptyState
              icon="people-outline"
              title="아직 또래 활동이 없어요"
              message="비슷한 연령대의 부모님이 주변 장소를 방문하면 여기에 표시됩니다"
            />
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ═════════════════════════════════════════════════════════
// Styles — Toss 2026: Borderless cards, ultra-thin numbers
// ═════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },

  // ── 헤더 ──────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  logo: {
    fontSize: 26,
    fontWeight: '800',
    fontStyle: 'italic',
    color: Colors.darkTextPrimary,
    letterSpacing: -1.8,
  },
  hitArea: {
    padding: 12,
    margin: -12,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.darkBg,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  liveCount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: -0.3,
  },

  // ── 인사 ──────────────────────────────────────
  greetingSection: {
    paddingHorizontal: 20,
    marginTop: 28,
  },
  meta: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -1.2,
  },

  // ── 공통 ──────────────────────────────────────
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },

  // ── 히어로 카드 ────────────────────────────────
  heroSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  heroCard: {
    backgroundColor: Colors.darkSurface,
    borderRadius: 24,
    padding: 28,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.darkTextSecondary,
    letterSpacing: -0.2,
  },
  heroScoreWrap: {
    marginTop: 20,
  },
  heroScore: {
    fontSize: 64,
    fontWeight: '100',
    color: Colors.darkTextPrimary,
    letterSpacing: -4,
    includeFontPadding: false,
  },
  heroUnit: {
    fontSize: 28,
    fontWeight: '200',
    color: Colors.darkTextTertiary,
    letterSpacing: -1,
  },
  heroFacility: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.darkTextSecondary,
    letterSpacing: -0.3,
    marginTop: 8,
  },
  gradeChip: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: Colors.primaryAlpha15,
    borderRadius: 8,
  },
  gradeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    letterSpacing: -0.2,
  },
  heroEmptyWrap: {
    marginTop: 24,
  },
  heroEmpty: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    letterSpacing: -1,
    lineHeight: 32,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  heroCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkBg,
    letterSpacing: -0.3,
  },
  heroSync: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
    marginTop: 20,
  },

  // ── 핵심 지표 바 ─────────────────────────────
  metricsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
    paddingVertical: 20,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '200',
    color: Colors.darkTextPrimary,
    letterSpacing: -1,
    includeFontPadding: false,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.darkTextTertiary,
    letterSpacing: -0.2,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.darkBorder,
  },

  // ── TO 알림 ──────────────────────────────────
  alertCard: {
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 3,
    borderLeftColor: Colors.iosSystemOrange,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.3,
  },
  alertBody: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.darkTextSecondary,
    letterSpacing: -0.2,
  },
  alertTime: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
    marginTop: 10,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },

  // ── 구독 배너 ────────────────────────────────
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkSurface,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  tierLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tierCta: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: Colors.darkTextSecondary,
    letterSpacing: -0.2,
  },

  // ── 트렌드 ───────────────────────────────────
  trendWrap: {
    marginTop: 36,
  },

  // ── 피드 ─────────────────────────────────────
  feedSection: {
    marginTop: 40,
    paddingHorizontal: 20,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.5,
  },
  feedMore: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.darkTextTertiary,
    letterSpacing: -0.2,
  },
});

export default HomeScreenPeerSync;
