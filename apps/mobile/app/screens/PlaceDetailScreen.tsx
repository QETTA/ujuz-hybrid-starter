/**
 * PlaceDetailScreen - Full detail view (mobile-only)
 *
 * 2026 Design:
 * - Hero image section with gradient overlay
 * - iOS Maps-style circular action buttons
 * - Card-based insight sections
 * - Dynamic CTA based on data confidence
 * - Tamagui useTheme() for all color tokens
 */

import { useMemo, useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useTheme } from 'tamagui';
import { Colors, Layout } from '@/app/constants';
import { usePlaceStore } from '@/app/stores/placeStore';
import { ConfidenceBadge, InsightCard, ProvenanceFooter } from '@/app/components/dataBlock';
import {
  TamaguiEmptyState,
  TamaguiText,
  TamaguiPressableScale,
  SocialProofBadge,
  TamaguiHeader,
} from '@/app/design-system';
import { OptimizedImage } from '@/app/components/shared';
import { useToast } from '@/app/components/shared/Toast';
import { useInsights } from '@/app/hooks/useInsights';
import { useAnalytics } from '@/app/hooks/useAnalytics';
import { COPY } from '@/app/copy/copy.ko';
import type { RootStackNavigationProp } from '@/app/types/navigation';
import type { DataBlock } from '@/app/types/dataBlock';
import type { ViewStyle, TextStyle, ImageStyle } from 'react-native';

const stagger = (i: number) =>
  FadeInDown.delay(i * Layout.stagger.delay)
    .springify()
    .damping(Layout.stagger.damping);

// Action button config (color removed; we use theme.textPrimary.val at render time)
const ACTIONS = [
  {
    icon: 'call-outline' as const,
    label: COPY.ACTION_CALL,
    a11yLabel: '전화하기',
  },
  {
    icon: 'navigate-outline' as const,
    label: COPY.ACTION_DIRECTIONS,
    a11yLabel: '지도에서 보기',
  },
  {
    icon: 'share-outline' as const,
    label: COPY.ACTION_SHARE,
    a11yLabel: '공유하기',
  },
  {
    icon: 'bookmark-outline' as const,
    label: COPY.ACTION_SAVE,
    a11yLabel: '저장하기',
  },
];

export default function PlaceDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { selectedPlace, toggleFavorite, isFavorite } = usePlaceStore();
  useAnalytics('PlaceDetail');
  const [refreshing, setRefreshing] = useState(false);
  const { showToast } = useToast();

  const { insightsMap, refetch } = useInsights(selectedPlace ? [selectedPlace.id] : []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch?.();
    setRefreshing(false);
  }, [refetch]);

  const insights = useMemo(
    () => (selectedPlace ? insightsMap.get(selectedPlace.id) : undefined),
    [insightsMap, selectedPlace]
  );

  const blocks = useMemo(() => {
    if (!insights) return [];
    return Object.values(insights).filter((b): b is DataBlock => b != null);
  }, [insights]);

  const overallConfidence = useMemo(() => {
    if (blocks.length === 0) return 0.5;
    return blocks.reduce((sum, b) => sum + b.confidence, 0) / blocks.length;
  }, [blocks]);

  const sourceCount = useMemo(() => new Set(blocks.map((b) => b.source)).size, [blocks]);

  /** Extract numeric peer-visit count from the peerVisits value string */
  const peerVisitCount = useMemo(() => {
    const raw = insights?.peerVisits?.value;
    if (!raw) return 0;
    const match = String(raw).match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }, [insights]);

  const primaryCta = useMemo(() => {
    const isReliable = (block?: DataBlock) => block && block.confidence >= 0.6;

    if (isReliable(insights?.dealCount)) {
      return {
        label: '딜 확인',
        hint: `활성 딜 ${insights?.dealCount?.value ?? ''}`.trim(),
      };
    }
    if (isReliable(insights?.waitTime)) {
      return {
        label: '지금 방문',
        hint: `대기 ${insights?.waitTime?.value ?? ''}`.trim(),
      };
    }
    if (isReliable(insights?.safetyScore)) {
      return {
        label: '안전 확인',
        hint: `${COPY.SAFETY_LABEL} ${insights?.safetyScore?.value ?? ''}`.trim(),
      };
    }
    if (isReliable(insights?.crowdLevel)) {
      return {
        label: '혼잡도 확인',
        hint: `혼잡도 ${insights?.crowdLevel?.value ?? ''}`.trim(),
      };
    }

    return {
      label: COPY.ACTION_DIRECTIONS,
      hint: '근거 데이터가 업데이트되면 더 정확해져요',
    };
  }, [insights]);

  const orderedSections = useMemo(() => {
    const sections = [
      {
        key: 'deals',
        title: COPY.SECTION_DEALS,
        icon: 'pricetag' as const,
        items: insights?.dealCount ? [{ label: '활성 딜', block: insights.dealCount }] : [],
        emptyText: '현재 활성 딜이 없어요',
      },
      {
        key: 'safety',
        title: COPY.SECTION_SAFETY,
        icon: 'shield-checkmark' as const,
        items: insights?.safetyScore
          ? [{ label: COPY.SAFETY_LABEL, block: insights.safetyScore }]
          : [],
        emptyText: '안전 정보가 아직 없어요',
      },
      {
        key: 'community',
        title: COPY.SECTION_COMMUNITY,
        icon: 'people' as const,
        items: [
          insights?.waitTime ? { label: '대기 시간', block: insights.waitTime } : null,
          insights?.crowdLevel ? { label: '혼잡도', block: insights.crowdLevel } : null,
          insights?.peerVisits ? { label: '또래 방문', block: insights.peerVisits } : null,
        ].filter(Boolean) as { label: string; block: DataBlock }[],
        emptyText: '커뮤니티 인사이트가 아직 없어요',
      },
    ];

    const priorityFor = (items: { block: DataBlock }[]) => {
      if (items.length === 0) return 0;
      return Math.max(...items.map((item) => item.block.confidence));
    };

    const order = ['deals', 'safety', 'community'];

    return sections
      .map((section) => ({ ...section, priority: priorityFor(section.items) }))
      .sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return order.indexOf(a.key) - order.indexOf(b.key);
      });
  }, [insights]);

  // ── Styles (theme-aware, computed inside component) ──────────────────
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (!selectedPlace) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top + 40 }]}>
        <TamaguiEmptyState
          icon="location-outline"
          title="선택된 장소가 없어요"
          message="지도에서 장소를 선택하거나 검색해보세요"
          action={{
            label: '지도로 돌아가기',
            onPress: () => navigation.goBack(),
          }}
        />
      </View>
    );
  }

  const hasFav = isFavorite(selectedPlace.id);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      {/* Hero Section */}
      <View style={styles.heroSection}>
        {selectedPlace.thumbnailUrl ? (
          <OptimizedImage
            uri={selectedPlace.thumbnailUrl}
            style={styles.heroImage as ImageStyle}
            alt={`${selectedPlace.name} 사진`}
            accessibilityLabel={`${selectedPlace.name} 사진`}
          />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]} accessible={false}>
            <Ionicons name="image-outline" size={48} color={theme.textTertiary.val} />
          </View>
        )}
        <LinearGradient colors={['transparent', Colors.overlayDark]} style={styles.heroGradient} />

        {/* TamaguiHeader over hero (transparent, acts as nav) */}
        <TamaguiHeader
          title=""
          showBack
          onBack={() => navigation.goBack()}
          rightIcon={hasFav ? 'heart' : 'heart-outline'}
          onRightPress={() => toggleFavorite(selectedPlace.id, selectedPlace)}
          blur={false}
        />

        {/* Place Info over hero */}
        <View style={styles.heroInfo}>
          <TamaguiText preset="h2" weight="bold" style={styles.heroName}>
            {selectedPlace.name}
          </TamaguiText>
          <View style={styles.heroMeta}>
            {selectedPlace.distance !== undefined && (
              <TamaguiText preset="caption" style={styles.heroMetaText}>
                {selectedPlace.distance < 1000
                  ? COPY.DISTANCE_M(Math.round(selectedPlace.distance))
                  : COPY.DISTANCE_KM((selectedPlace.distance / 1000).toFixed(1))}
              </TamaguiText>
            )}
            {selectedPlace.category && (
              <TamaguiText preset="caption" style={styles.heroMetaText}>
                {selectedPlace.distance !== undefined ? ' · ' : ''}
                {selectedPlace.category}
              </TamaguiText>
            )}
          </View>
        </View>
      </View>

      {/* Trust & Confidence Bar */}
      <Animated.View entering={stagger(0)} style={styles.trustBar}>
        <View style={styles.trustBarLeft}>
          <Ionicons
            name="shield-checkmark"
            size={14}
            color={theme.textSecondary.val}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          />
          <TamaguiText
            preset="caption"
            textColor="secondary"
            weight="semibold"
            style={styles.trustBarText}
          >
            {blocks.length > 0
              ? COPY.TRUST_ROW(blocks.length, sourceCount, Math.round(overallConfidence * 100))
              : COPY.EVIDENCE_EMPTY}
          </TamaguiText>
        </View>
        <ConfidenceBadge confidence={overallConfidence} size="sm" />
      </Animated.View>

      {/* Social Proof */}
      {peerVisitCount > 0 && (
        <Animated.View entering={stagger(0)} style={styles.socialProofRow}>
          <SocialProofBadge
            count={peerVisitCount}
            label="{count}명이 관심"
            size="sm"
          />
        </Animated.View>
      )}

      {/* Address */}
      <Animated.View entering={stagger(1)} style={styles.addressSection}>
        <Ionicons name="location-outline" size={16} color={theme.textTertiary.val} />
        <TamaguiText preset="body" textColor="secondary" style={styles.addressText}>
          {selectedPlace.address ?? '주소 정보 없음'}
        </TamaguiText>
      </Animated.View>

      {/* Action Buttons - iOS Maps Style */}
      <Animated.View entering={stagger(2)} style={styles.actionsRow}>
        {ACTIONS.map((action) => (
          <TamaguiPressableScale
            key={action.label}
            style={styles.actionBtn}
            hapticType="light"
            onPress={() => showToast({ type: 'info', message: '준비 중입니다' })}
            accessibilityLabel={action.a11yLabel}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name={action.icon} size={22} color={theme.textPrimary.val} />
            </View>
            <TamaguiText
              preset="caption"
              textColor="secondary"
              weight="medium"
              style={styles.actionLabel}
            >
              {action.label}
            </TamaguiText>
          </TamaguiPressableScale>
        ))}
      </Animated.View>

      {/* Insight Sections */}
      {orderedSections.map((section, sectionIndex) => (
        <Animated.View
          key={section.key}
          entering={stagger(3 + sectionIndex)}
          style={styles.section}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name={section.icon} size={16} color={Colors.primary} />
            <TamaguiText
              preset="body"
              textColor="primary"
              weight="bold"
              style={styles.sectionTitle}
            >
              {section.title}
            </TamaguiText>
          </View>
          {section.items.length > 0 ? (
            <View style={styles.sectionCard}>
              <View style={styles.grid}>
                {section.items.map((item, index) => (
                  <InsightCard
                    key={`${section.key}-${index}`}
                    label={item.label}
                    block={item.block}
                  />
                ))}
              </View>
              {section.items[0] && <ProvenanceFooter block={section.items[0].block} compact />}
            </View>
          ) : (
            <View style={styles.sectionEmptyCard}>
              <TamaguiText preset="caption" textColor="tertiary" style={styles.sectionEmpty}>
                {section.emptyText}
              </TamaguiText>
            </View>
          )}
        </Animated.View>
      ))}

      {/* Primary CTA */}
      <Animated.View
        entering={FadeInUp.delay(400).springify().damping(16)}
        style={styles.ctaSection}
      >
        <TamaguiPressableScale
          style={styles.primaryCta}
          hapticType="medium"
          onPress={() =>
            showToast({ type: 'info', message: '지도 앱 연동은 다음 단계에서 연결됩니다.' })
          }
        >
          <TamaguiText preset="body" weight="bold" style={styles.primaryCtaText}>
            {primaryCta.label}
          </TamaguiText>
          <Ionicons name="arrow-forward" size={18} color={theme.background.val} />
        </TamaguiPressableScale>
        <TamaguiText preset="caption" textColor="tertiary" style={styles.primaryCtaHint}>
          {primaryCta.hint}
        </TamaguiText>
      </Animated.View>

      {/* Secondary Actions */}
      <View style={styles.section}>
        <View style={styles.secondaryRow}>
          <TamaguiPressableScale
            style={styles.secondaryBtn}
            hapticType="light"
            onPress={() => navigation.navigate('Ask')}
            accessibilityLabel="우주봇에게 질문하기"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.textPrimary.val} />
            <TamaguiText
              preset="caption"
              textColor="primary"
              weight="semibold"
              style={styles.secondaryText}
            >
              {COPY.ACTION_ASK}
            </TamaguiText>
          </TamaguiPressableScale>
          <TamaguiPressableScale
            style={styles.secondaryBtn}
            hapticType="light"
            onPress={() => navigation.navigate('Feedback')}
            accessibilityLabel="후기 작성하기"
          >
            <Ionicons name="create-outline" size={16} color={theme.textPrimary.val} />
            <TamaguiText
              preset="caption"
              textColor="primary"
              weight="semibold"
              style={styles.secondaryText}
            >
              후기
            </TamaguiText>
          </TamaguiPressableScale>
          <TamaguiPressableScale
            style={styles.secondaryBtn}
            hapticType="light"
            onPress={() => navigation.navigate('Report')}
            accessibilityLabel="정보 정정 요청하기"
          >
            <Ionicons name="alert-circle-outline" size={16} color={theme.textPrimary.val} />
            <TamaguiText
              preset="caption"
              textColor="primary"
              weight="semibold"
              style={styles.secondaryText}
            >
              정정
            </TamaguiText>
          </TamaguiPressableScale>
        </View>
      </View>
    </ScrollView>
  );
}

// ── Style factory (plain objects, theme-dependent) ──────────────────────
type Styles = Record<string, ViewStyle | TextStyle | ImageStyle>;

function createStyles(theme: ReturnType<typeof useTheme>): Styles {
  return {
    container: {
      flex: 1,
      backgroundColor: theme.background.val,
    },

    // Hero Section
    heroSection: {
      height: 280,
      position: 'relative',
      backgroundColor: theme.surface.val,
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.surface.val,
    },
    heroGradient: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 160,
    },
    heroInfo: {
      position: 'absolute',
      bottom: 16,
      left: Layout.screenPadding,
      right: Layout.screenPadding,
    },
    heroName: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.textPrimary.val,
      letterSpacing: -0.5,
      textShadowColor: 'rgba(0, 0, 0, 0.6)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    heroMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    heroMetaText: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.85)',
    },

    // Trust Bar
    trustBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Layout.screenPadding,
      paddingVertical: 12,
      backgroundColor: theme.surface.val,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.borderColor.val,
    },
    trustBarLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    trustBarText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textSecondary.val,
      letterSpacing: -0.1,
    },

    // Social Proof
    socialProofRow: {
      paddingHorizontal: Layout.screenPadding,
      paddingVertical: 8,
      backgroundColor: theme.surface.val,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.borderColor.val,
    },

    // Address
    addressSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: Layout.screenPadding,
      paddingVertical: 14,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.borderColor.val,
    },
    addressText: {
      fontSize: 14,
      color: theme.textSecondary.val,
      flex: 1,
    },

    // Action Buttons
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 16,
      paddingHorizontal: Layout.screenPadding,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.borderColor.val,
    },
    actionBtn: {
      alignItems: 'center',
      gap: 6,
    },
    actionIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.surfaceElevated.val,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0.5,
      borderColor: theme.borderColor.val,
    },
    actionLabel: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.textSecondary.val,
      letterSpacing: -0.1,
    },

    // Sections
    section: {
      marginTop: 20,
      paddingHorizontal: Layout.screenPadding,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.textPrimary.val,
      letterSpacing: -0.3,
    },
    sectionCard: {
      backgroundColor: theme.surface.val,
      borderRadius: 14,
      padding: 14,
      borderWidth: 0.5,
      borderColor: theme.borderColor.val,
      gap: 10,
    },
    sectionEmptyCard: {
      backgroundColor: theme.surface.val,
      borderRadius: 14,
      padding: 20,
      alignItems: 'center',
    },
    sectionEmpty: {
      fontSize: 13,
      color: theme.textTertiary.val,
      letterSpacing: -0.2,
    },
    grid: {
      gap: 8,
    },

    // Primary CTA
    ctaSection: {
      marginTop: 24,
      paddingHorizontal: Layout.screenPadding,
    },
    primaryCta: {
      height: 52,
      borderRadius: 14,
      backgroundColor: Colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    primaryCtaText: {
      color: theme.background.val,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    primaryCtaHint: {
      marginTop: 8,
      fontSize: 12,
      color: theme.textTertiary.val,
      textAlign: 'center',
      letterSpacing: -0.2,
    },

    // Secondary Actions
    secondaryRow: {
      flexDirection: 'row',
      gap: 8,
    },
    secondaryBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: theme.surface.val,
      borderWidth: 0.5,
      borderColor: theme.borderColor.val,
    },
    secondaryText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textPrimary.val,
      letterSpacing: -0.2,
    },

    // Empty
    empty: {
      flex: 1,
      alignItems: 'center',
      gap: 16,
      backgroundColor: theme.background.val,
    },
  };
}
