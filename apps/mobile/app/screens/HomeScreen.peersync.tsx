/**
 * HomeScreen v7 — UJUz 비즈니스 허브
 *
 * 2026 Redesign:
 * - ProactiveAICard: TO 알림/맞춤 제안 최상단
 * - ScoreRing 히어로: 입학 점수 원형 프로그레스
 * - QuotaBar 위젯: 잔여 쿼터 시각화 → 업그레이드 유도
 * - 공동구매 캐러셀: 진행 중 딜 노출
 * - SocialProof: 이용자 수 상시 노출
 * - 또래 피드: 실시간 활동
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { YStack, XStack, useTheme } from 'tamagui';
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
  ScoreRing,
  QuotaBar,
  ProactiveAICard,
  SocialProofBadge,
  TamaguiGlassCard,
} from '@/app/design-system';
import TamaguiButton from '@/app/design-system/components/TamaguiButton';
import { usePeerSync } from '@/app/hooks';
import { useProfileStore } from '@/app/stores/profileStore';
import { useAnalytics } from '@/app/hooks/useAnalytics';
import { useNotifications } from '@/app/hooks/useNotifications';
import { useAdmissionScore } from '@/app/hooks/useAdmissionScore';
import { usePayment } from '@/app/hooks/usePayment';
import { useGroupBuys } from '@/app/hooks/useGroupBuys';
import type { PeerActivity } from '@/app/types/peerSync';
import { Colors } from '@/app/constants';
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

function getDaysSinceBirth(months: number): number {
  return Math.round(months * 30.44);
}

// ─── Types ───────────────────────────────────────────────
export interface HomeScreenPeerSyncProps {
  testID?: string;
}

// ═════════════════════════════════════════════════════════
// Sub-components
// ═════════════════════════════════════════════════════════

function HomeHeroScore({
  score,
  grade,
  facility,
  onPress,
}: {
  score: number | undefined;
  grade: string | undefined;
  facility: string | undefined;
  onPress: () => void;
}) {
  if (score == null || !grade) {
    return (
      <TamaguiPressableScale hapticType="medium" onPress={onPress}>
        <TamaguiGlassCard
          intensity="medium"
          padding="lg"
        >
          <YStack alignItems="center" gap="$3" paddingVertical="$4">
            <TamaguiText
              fontSize={22}
              fontWeight="600"
              color="$textPrimary"
              textAlign="center"
              letterSpacing={-1}
            >
              우리 아이,{'\n'}들어갈 수 있을까?
            </TamaguiText>
            <TamaguiButton variant="primary" size="md" onPress={onPress}>
              입학 가능성 1분 진단(무료)
            </TamaguiButton>
          </YStack>
        </TamaguiGlassCard>
      </TamaguiPressableScale>
    );
  }

  const validGrade = (['A', 'B', 'C', 'D', 'F'] as const).includes(grade as any)
    ? (grade as 'A' | 'B' | 'C' | 'D' | 'F')
    : 'C';

  return (
    <TamaguiPressableScale hapticType="medium" onPress={onPress}>
      <TamaguiGlassCard
        intensity="medium"
        padding="lg"
        scoreGlow={validGrade}
      >
        <YStack alignItems="center" gap="$3" paddingVertical="$2">
          <ScoreRing score={Math.round(score)} grade={validGrade} size="md" />
          {facility && (
            <TamaguiText fontSize={14} color="$textSecondary" fontWeight="400">
              {facility}
            </TamaguiText>
          )}
          <TamaguiText
            fontSize={13}
            color="$primary"
            fontWeight="600"
            pressStyle={{ opacity: 0.7 }}
          >
            다른 곳도 확인 →
          </TamaguiText>
        </YStack>
      </TamaguiGlassCard>
    </TamaguiPressableScale>
  );
}

const TODAY_PICKS = [
  { id: 'pick-wait', icon: 'time-outline' as const, label: '대기 짧은 곳', desc: '지금 바로 갈 수 있어요', filter: 'all' as const, accent: Colors.success },
  { id: 'pick-age', icon: 'people-outline' as const, label: '3세 인기', desc: '비슷한 연령대가 많이 간 곳', filter: 'peers' as const, accent: '#6366F1' },
  { id: 'pick-indoor', icon: 'home-outline' as const, label: '실내 놀이', desc: '날씨 걱정 없는 실내 공간', filter: 'all' as const, accent: Colors.warning },
  { id: 'pick-free', icon: 'gift-outline' as const, label: '무료 체험', desc: '무료로 이용할 수 있어요', filter: 'deals' as const, accent: Colors.deal },
  { id: 'pick-new', icon: 'sparkles-outline' as const, label: '새로 오픈', desc: '최근 오픈한 시설', filter: 'all' as const, accent: Colors.info },
];

function HomeTodayPicks({ onPickPress }: { onPickPress: (filter: string) => void }) {
  const theme = useTheme();
  return (
    <YStack gap="$3">
      <XStack paddingHorizontal="$5" alignItems="center" gap="$2">
        <TamaguiText fontSize={20} fontWeight="800" color="$textPrimary" letterSpacing={-0.8}>
          오늘 추천
        </TamaguiText>
        <View style={{
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 10,
          backgroundColor: `${theme.primary.val}15`,
        }}>
          <TamaguiText fontSize={12} color="$primary" fontWeight="700">
            TOP {TODAY_PICKS.length}
          </TamaguiText>
        </View>
      </XStack>
      <FlatList
        data={TODAY_PICKS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TamaguiPressableScale
            hapticType="light"
            onPress={() => onPickPress(item.filter)}
            accessibilityLabel={`${item.label}, ${item.desc}`}

            style={{
              width: 176,
              shadowColor: item.accent,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 4,
            }}
          >
            <TamaguiGlassCard
              intensity="light"
              padding="md"
            >
              <YStack gap="$3" alignItems="flex-start">
                <View style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: `${item.accent}15`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Ionicons name={item.icon} size={24} color={item.accent} />
                </View>
                <YStack gap="$1">
                  <TamaguiText fontSize={15} fontWeight="700" color="$textPrimary" letterSpacing={-0.4}>
                    {item.label}
                  </TamaguiText>
                  <TamaguiText fontSize={12} fontWeight="400" color="$textTertiary" numberOfLines={2} lineHeight={16}>
                    {item.desc}
                  </TamaguiText>
                </YStack>
              </YStack>
            </TamaguiGlassCard>
          </TamaguiPressableScale>
        )}
      />
    </YStack>
  );
}

function HomeQuotaWidget({
  admissionUsed,
  admissionTotal,
  toUsed,
  toTotal,
  botUsed,
  botTotal,
  onUpgrade,
}: {
  admissionUsed: number;
  admissionTotal: number;
  toUsed: number;
  toTotal: number;
  botUsed: number;
  botTotal: number;
  onUpgrade: () => void;
}) {
  return (
    <TamaguiGlassCard intensity="light" padding="md">
      <YStack gap="$3">
        <QuotaBar
          label="입학 조회"
          icon="🎓"
          used={admissionUsed}
          total={admissionTotal}
          onUpgradePress={onUpgrade}
        />
        <QuotaBar
          label="TO 알림"
          icon="🔔"
          used={toUsed}
          total={toTotal}
          onUpgradePress={onUpgrade}
        />
        <QuotaBar
          label="우주봇"
          icon="🤖"
          used={botUsed}
          total={botTotal}
          onUpgradePress={onUpgrade}
        />
        <TamaguiText
          fontSize={12}
          fontWeight="500"
          color="$textTertiary"
          textAlign="center"
          onPress={onUpgrade}
          pressStyle={{ opacity: 0.7 }}
          marginTop="$1"

          accessibilityLabel="구독 업그레이드"
        >
          더 많이 이용하기
        </TamaguiText>
      </YStack>
    </TamaguiGlassCard>
  );
}

function HomeDealCarousel({
  deals,
  onDealPress,
}: {
  deals: Array<{
    id: string;
    title: string;
    discount_rate?: number;
    current_price?: number;
    original_price?: number;
    current_participants?: number;
    max_participants?: number;
    image_url?: string;
    ends_at?: string;
  }>;
  onDealPress: (id: string) => void;
}) {
  if (!deals.length) return null;

  return (
    <YStack gap="$3">
      <XStack justifyContent="space-between" alignItems="center" paddingHorizontal="$5">
        <XStack alignItems="center" gap="$2">
          <TamaguiText fontSize={20} fontWeight="800" color="$textPrimary" letterSpacing={-0.8}>
            공동구매 진행중
          </TamaguiText>
          <TamaguiText fontSize={13} color="$deal" fontWeight="600">
            🔥 {deals.length}
          </TamaguiText>
        </XStack>
      </XStack>

      <FlatList
        data={deals}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TamaguiPressableScale
            hapticType="light"
            onPress={() => onDealPress(item.id)}
            accessibilityLabel={`${item.title}${item.discount_rate ? `, ${item.discount_rate}% 할인` : ''}`}

            style={{ width: 200 }}
          >
            <TamaguiGlassCard intensity="light" padding="md">
              <YStack gap="$2">
                {item.discount_rate && (
                  <XStack alignItems="center" gap="$1">
                    <TamaguiText fontSize={14} fontWeight="700" color="$deal">
                      -{item.discount_rate}%
                    </TamaguiText>
                    {item.ends_at && (
                      <TamaguiText fontSize={11} color="$textTertiary">
                        D-{Math.max(0, Math.ceil((new Date(item.ends_at).getTime() - Date.now()) / 86400000))}
                      </TamaguiText>
                    )}
                  </XStack>
                )}
                <TamaguiText
                  fontSize={14}
                  fontWeight="600"
                  color="$textPrimary"
                  numberOfLines={2}
                >
                  {item.title}
                </TamaguiText>
                <XStack alignItems="baseline" gap="$1">
                  {item.original_price && (
                    <TamaguiText
                      fontSize={12}
                      color="$textTertiary"
                      textDecorationLine="line-through"
                    >
                      ₩{item.original_price.toLocaleString()}
                    </TamaguiText>
                  )}
                  {item.current_price && (
                    <TamaguiText fontSize={16} fontWeight="700" color="$textPrimary">
                      ₩{item.current_price.toLocaleString()}
                    </TamaguiText>
                  )}
                </XStack>
                {item.max_participants && (
                  <XStack alignItems="center" gap="$1">
                    <TamaguiText fontSize={11} color="$textTertiary">
                      👥 {item.current_participants ?? 0}/{item.max_participants}명
                    </TamaguiText>
                  </XStack>
                )}
              </YStack>
            </TamaguiGlassCard>
          </TamaguiPressableScale>
        )}
      />

      <XStack paddingHorizontal="$5">
        <SocialProofBadge count={5432} size="sm" />
      </XStack>
    </YStack>
  );
}

function HomePeerFeed({
  activities,
  isLoading,
  liveCount,
  onActivityPress,
}: {
  activities: PeerActivity[];
  isLoading: boolean;
  liveCount?: number;
  onActivityPress: (activity: PeerActivity) => void;
}) {
  return (
    <YStack paddingHorizontal="$5" gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <XStack alignItems="center" gap="$2">
          <TamaguiText fontSize={20} fontWeight="800" color="$textPrimary" letterSpacing={-0.8}>
            또래 피드
          </TamaguiText>
          <TamaguiText fontSize={12} color="$textTertiary">
            실시간
          </TamaguiText>
        </XStack>
        {liveCount != null && (
          <XStack alignItems="center" gap="$1">
            <TamaguiText fontSize={12} color="$primary">
              👥 {liveCount}명 활동중
            </TamaguiText>
          </XStack>
        )}
      </XStack>

      {isLoading && activities.length === 0 ? (
        <YStack gap={12}>
          {[0, 1].map((i) => (
            <YStack key={i} gap={8} padding={16} backgroundColor="$surfaceMuted" borderRadius={16} borderWidth={0.5} borderColor="$borderColor">
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
              onPress={() => onActivityPress(activity)}
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
    </YStack>
  );
}

// ═════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════
export function HomeScreenPeerSync({ testID }: HomeScreenPeerSyncProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<TabNavigationProp>();
  const theme = useTheme();
  useAnalytics('UjuHome');

  // ─── Data ──────────────────────────────────────────
  const childName = useProfileStore((s) => s.childName);
  const childAgeMonths = useProfileStore((s) => s.getChildAgeMonths());
  const { unreadCount, alerts } = useNotifications();
  const { lastResult } = useAdmissionScore();
  const { getRemainingQuota } = usePayment();
  const { filteredGroupBuys } = useGroupBuys();

  const { liveStatus, activities, trends, refresh, isLoading } = usePeerSync({
    childAgeMonths,
    enablePolling: true,
  });

  const [refreshing, setRefreshing] = React.useState(false);

  // ─── Computed ──────────────────────────────────────
  const greeting = useMemo(() => getGreeting(), []);
  const ageLabel = useMemo(
    () => (childAgeMonths >= 12 ? `${Math.floor(childAgeMonths / 12)}세` : `${childAgeMonths}개월`),
    [childAgeMonths],
  );
  const daysLabel = useMemo(() => `D+${getDaysSinceBirth(childAgeMonths).toLocaleString()}`, [childAgeMonths]);

  const scoreDisplay = lastResult?.probability;
  const scoreGrade = lastResult?.grade;
  const scoreFacility = lastResult?.facility_name;

  const latestAlert = alerts?.[0];
  const toActiveCount =
    useNotifications().subscriptions?.filter((s) => s.is_active)?.length ?? 0;

  const admissionQuota = getRemainingQuota('admission_score_limit');
  const botQuota = getRemainingQuota('bot_query_daily_limit');

  // Map group buys to deal carousel format
  const deals = useMemo(() => filteredGroupBuys.map((gb) => ({
    id: gb.id,
    title: gb.title,
    discount_rate: gb.max_discount_rate,
    current_price: gb.group_price,
    original_price: gb.regular_price,
    current_participants: gb.supporter_count,
    max_participants: gb.goal_quantity,
    image_url: gb.thumbnail_url,
    ends_at: gb.end_date,
  })), [filteredGroupBuys]);

  // Quota calculations (approximate from remaining quota)
  const admissionTotal = 1;
  const admissionUsed = Math.max(0, admissionTotal - admissionQuota);
  const toTotal = 1;
  const toUsed = toActiveCount;
  const botTotal = 5;
  const botUsed = Math.max(0, botTotal - botQuota);

  // ─── Live Pulse Animation ──────────────────────────
  const pulseOpacity = useSharedValue(1);
  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
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
    [navigation],
  );

  const handleDealPress = useCallback(
    (id: string) => navigation.navigate('GroupBuy', { id }),
    [navigation],
  );

  const handlePickPress = useCallback(
    (_filter: string) => {
      navigation.navigate('Map');
    },
    [navigation],
  );

  // ─── Render ────────────────────────────────────────
  return (
    <LinearGradient
      testID={testID}
      colors={[theme.background.val, `${theme.primary.val}08`, theme.background.val]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.textTertiary.val}
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── 헤더 ─────────────────────────────────── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: insets.top + 14,
            paddingBottom: 8,
          }}
        >
          <XStack alignItems="center" gap={10}>
            <TamaguiText
              fontSize={26}
              fontWeight="800"
              fontStyle="italic"
              color="$textPrimary"
              letterSpacing={-1.8}
            >
              ujuz
            </TamaguiText>
            {liveStatus && (
              <XStack alignItems="center" gap={5}>
                <Animated.View
                  style={[
                    {
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: theme.primary.val,
                    },
                    liveDotAnim,
                  ]}
                />
                <TamaguiText fontSize={13} fontWeight="600" color="$primary" letterSpacing={-0.3}>
                  {liveStatus.activeNow}
                </TamaguiText>
              </XStack>
            )}
          </XStack>
          <XStack gap={16} alignItems="center">
            <TamaguiPressableScale
              hapticType="light"
              style={{ padding: 12, margin: -12 }}
              onPress={() => navigation.navigate('Search')}
              accessibilityLabel="검색"
  
            >
              <Ionicons name="search" size={20} color={theme.textSecondary.val} />
            </TamaguiPressableScale>
            <TamaguiPressableScale
              hapticType="light"
              style={{ padding: 12, margin: -12 }}
              onPress={() => navigation.navigate('NotificationHistory')}
              accessibilityLabel={unreadCount > 0 ? `알림 ${unreadCount}건` : '알림'}
  
            >
              <View>
                <Ionicons name="notifications-outline" size={20} color={theme.textSecondary.val} />
                {unreadCount > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -6,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: theme.primary.val,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                    }}
                  >
                    <TamaguiText fontSize={9} fontWeight="700" color="$background">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </TamaguiText>
                  </View>
                )}
              </View>
            </TamaguiPressableScale>
          </XStack>
        </View>

        {/* ── 인사 ─────────────────────────────────── */}
        <Animated.View entering={stagger(0)} style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <TamaguiText fontSize={34} fontWeight="800" color="$textPrimary" letterSpacing={-1.8}>
            {greeting}
          </TamaguiText>
          <XStack alignItems="center" gap={6} marginTop={8}>
            <View style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: theme.primary.val,
            }} />
            <TamaguiText fontSize={15} fontWeight="600" color="$textSecondary" letterSpacing={-0.3}>
              {childName || '우리 아이'} · {ageLabel} · {daysLabel}
            </TamaguiText>
          </XStack>
        </Animated.View>

        {/* ── ProactiveAICard: TO 알림 / AI 제안 ──── */}
        {latestAlert && (
          <Animated.View entering={stagger(1)} style={{ paddingHorizontal: 20, marginTop: 20 }}>
            <ProactiveAICard
              type="to_alert"
              message={`${latestAlert.facility_name}에 TO가 나왔어요! ${COPY.VACANCY_DETECTED(latestAlert.estimated_slots)}`}
              ctaText="지금 확인"
              onCtaPress={() => navigation.navigate('NotificationHistory')}
              subInfo={formatDistanceToNow(new Date(latestAlert.detected_at), {
                addSuffix: true,
                locale: ko,
              })}
              onDismiss={() => {}}
            />
          </Animated.View>
        )}

        {/* ── ScoreRing 히어로 ─────────────────────── */}
        <Animated.View entering={stagger(2)} style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <HomeHeroScore
            score={scoreDisplay}
            grade={scoreGrade}
            facility={scoreFacility}
            onPress={() => navigation.navigate('AdmissionScore')}
          />
        </Animated.View>

        {/* ── 오늘 추천 TOP 5 ────────────────────── */}
        <Animated.View entering={stagger(3)} style={{ marginTop: 28 }}>
          <HomeTodayPicks onPickPress={handlePickPress} />
        </Animated.View>

        {/* ── QuotaBar 위젯 ───────────────────────── */}
        <Animated.View entering={stagger(4)} style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <HomeQuotaWidget
            admissionUsed={admissionUsed}
            admissionTotal={admissionTotal}
            toUsed={toUsed}
            toTotal={toTotal}
            botUsed={botUsed}
            botTotal={botTotal}
            onUpgrade={() => navigation.navigate('Subscription')}
          />
        </Animated.View>

        {/* ── 공동구매 캐러셀 ──────────────────────── */}
        {deals && deals.length > 0 && (
          <Animated.View entering={stagger(5)} style={{ marginTop: 32 }}>
            <HomeDealCarousel deals={deals} onDealPress={handleDealPress} />
          </Animated.View>
        )}

        {/* ── 트렌드 ──────────────────────────────── */}
        {trends && (
          <Animated.View entering={stagger(6)} style={{ marginTop: 32 }}>
            <PeerTrendWidget
              trends={trends}
              onPlacePress={(id) => navigation.navigate('PlaceDetail', { id })}
              onGroupBuyPress={(id) => navigation.navigate('GroupBuy', { id })}
            />
          </Animated.View>
        )}

        {/* ── 또래 피드 ───────────────────────────── */}
        <Animated.View entering={stagger(7)} style={{ marginTop: 36 }}>
          <HomePeerFeed
            activities={activities}
            isLoading={isLoading}
            liveCount={liveStatus?.activeNow}
            onActivityPress={handleActivityPress}
          />
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

export default HomeScreenPeerSync;
