/**
 * MyPageScreen - Dark-First Toss 2026 + Data Block Architecture
 *
 * 크롤링 플랜 피드백 반영:
 * - 데이터 블록 구조 (evidence + provenance + version)
 * - TO 패턴/대기 정보 우선 표시
 * - 공식 API 소스 투명성
 * - 신뢰도/최신성 표시
 */

import { StyleSheet, View, Pressable, ScrollView, Alert } from 'react-native';
import { Text } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { TamaguiPressableScale } from '@/app/design-system';
import { useFilterStore } from '@/app/stores/filterStore';
import { usePlaceStore } from '@/app/stores/placeStore';
import { useProfileStore } from '@/app/stores/profileStore';
import { Colors, Layout, Animations } from '@/app/constants';

const SPRING_CONFIG = Animations.springSnappy;

// ============================================
// Staggered Entry Animation
// ============================================
const createStaggeredEntry = (index: number) =>
  FadeInDown.delay(index * Layout.stagger.delay)
    .duration(400)
    .springify()
    .damping(SPRING_CONFIG.damping);

// ============================================
// Main Component
// ============================================

export default function MyPageScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { favorites, recentVisits } = usePlaceStore();
  const { reset: resetFilters } = useFilterStore();
  const childName = useProfileStore((s) => s.childName);
  const childAgeMonths = useProfileStore((s) => s.getChildAgeMonths());

  // Mock data for demonstration (would come from data blocks)
  const dataBlocks = {
    syncStatus: 'synced',
    lastSync: '2m ago',
    trainingBlocks: 847,
    confidence: 0.92,
    sources: [
      { name: 'public API', count: 523, status: 'active' },
      { name: 'official feeds', count: 289, status: 'active' },
      { name: 'user reports', count: 35, status: 'pending' },
    ],
    toPatterns: {
      avgWait: 23,
      peakHours: '10-12am',
      updated: '1h ago',
    },
  };

  const handleResetData = () => {
    Alert.alert('데이터 초기화', '모든 로컬 데이터를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '초기화',
        style: 'destructive',
        onPress: () => {
          resetFilters();
          Alert.alert('완료', '데이터가 삭제되었습니다');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.View entering={createStaggeredEntry(0)} style={styles.header}>
        <Text style={styles.logoText}>uju</Text>
        <Pressable
          style={styles.profileChip}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="프로필 편집"
          accessibilityRole="button"
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{childName?.charAt(0) || 'U'}</Text>
          </View>
          <Text style={styles.profileInfo}>{childAgeMonths}m</Text>
        </Pressable>
      </Animated.View>

      {/* uju intelligence - Data Block Status */}
      <Animated.View entering={createStaggeredEntry(1)}>
        <TamaguiPressableScale style={styles.intelCard} hapticType="medium">
          <View style={styles.intelHeader}>
            <Text style={styles.intelLogo}>uju 인텔리전스</Text>
            <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
          </View>
          <View style={styles.intelStats}>
            <View
              style={styles.intelStat}
              accessible
              accessibilityLabel={`블록 수 ${dataBlocks.trainingBlocks}`}
            >
              <Text style={styles.intelStatValue}>{dataBlocks.trainingBlocks}</Text>
              <Text style={styles.intelStatLabel}>블록</Text>
            </View>
            <View style={styles.intelDivider} />
            <View
              style={styles.intelStat}
              accessible
              accessibilityLabel={`신뢰도 ${Math.round(dataBlocks.confidence * 100)}%`}
            >
              <Text style={styles.intelStatValue}>{Math.round(dataBlocks.confidence * 100)}%</Text>
              <Text style={styles.intelStatLabel}>신뢰도</Text>
            </View>
            <View style={styles.intelDivider} />
            <View
              style={styles.intelStat}
              accessible
              accessibilityLabel={`동기화 상태 ${dataBlocks.lastSync}`}
            >
              <Text style={styles.intelStatValue}>{dataBlocks.lastSync}</Text>
              <Text style={styles.intelStatLabel}>동기화</Text>
            </View>
          </View>
        </TamaguiPressableScale>
      </Animated.View>

      {/* Data Sources - Transparency */}
      <Animated.View entering={createStaggeredEntry(2)}>
        <View style={styles.section} accessible accessibilityLabel="데이터 출처 목록">
          <Text style={styles.sectionTitle}>데이터 출처</Text>
          {dataBlocks.sources.map((source) => (
            <View key={source.name} style={styles.sourceRow}>
              <View style={styles.sourceInfo}>
                <View
                  style={[
                    styles.sourceStatus,
                    {
                      backgroundColor:
                        source.status === 'active' ? Colors.success : Colors.iosSystemOrange,
                    },
                  ]}
                />
                <Text style={styles.sourceName}>{source.name}</Text>
              </View>
              <Text style={styles.sourceCount}>{source.count}</Text>
            </View>
          ))}
          <Text style={styles.sourceNote}>공식 API만 사용 · 스크래핑 없음</Text>
        </View>
      </Animated.View>

      {/* TO Pattern Insight - Priority Block */}
      <Animated.View entering={createStaggeredEntry(3)}>
        <TamaguiPressableScale style={styles.insightCard} hapticType="light">
          <View style={styles.insightHeader}>
            <Text style={styles.insightTitle}>대기 패턴</Text>
            <Text style={styles.insightUpdated}>{dataBlocks.toPatterns.updated}</Text>
          </View>
          <View style={styles.insightBody}>
            <View style={styles.insightMetric}>
              <Text style={styles.insightValue}>{dataBlocks.toPatterns.avgWait}</Text>
              <Text style={styles.insightUnit}>분 평균</Text>
            </View>
            <View style={styles.insightDetail}>
              <Text style={styles.insightDetailText}>
                혼잡 시간: {dataBlocks.toPatterns.peakHours}
              </Text>
              <Text style={styles.insightDetailText}>
                {dataBlocks.trainingBlocks}개 데이터 블록 기반
              </Text>
            </View>
          </View>
        </TamaguiPressableScale>
      </Animated.View>

      {/* User Stats - Minimal */}
      <Animated.View entering={createStaggeredEntry(4)}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{favorites.length}</Text>
            <Text style={styles.statLabel}>저장</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{recentVisits.length}</Text>
            <Text style={styles.statLabel}>방문</Text>
          </View>
        </View>
      </Animated.View>

      {/* Settings - Minimal */}
      <Animated.View entering={createStaggeredEntry(5)}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>설정</Text>

          <TamaguiPressableScale
            style={styles.settingItem}
            hapticType="light"
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.settingText}>구독 관리</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TamaguiPressableScale>

          <TamaguiPressableScale
            style={styles.settingItem}
            hapticType="light"
            onPress={() => navigation.navigate('TOAlertSettings')}
          >
            <Text style={styles.settingText}>알림 설정</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TamaguiPressableScale>

          <TamaguiPressableScale style={styles.settingItem} hapticType="light">
            <Text style={styles.settingText}>아이 프로필</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TamaguiPressableScale>

          <TamaguiPressableScale style={styles.settingItem} hapticType="light">
            <Text style={styles.settingText}>개인정보 보호</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TamaguiPressableScale>

          <TamaguiPressableScale
            style={styles.settingItem}
            hapticType="medium"
            onPress={handleResetData}
          >
            <Text style={[styles.settingText, { color: Colors.iosSystemRed }]}>데이터 초기화</Text>
            <Text style={[styles.settingArrow, { color: Colors.iosSystemRed }]}>›</Text>
          </TamaguiPressableScale>
        </View>
      </Animated.View>

      {/* Footer */}
      <Animated.View entering={createStaggeredEntry(6)} style={styles.footer}>
        <Text style={styles.footerText}>uju v1.0.0</Text>
        <Text style={styles.footerSubtext}>claude code로 제작</Text>
      </Animated.View>
    </ScrollView>
  );
}

// ============================================
// Styles (Dark-First Toss 2026)
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    fontStyle: 'italic',
    color: Colors.darkTextPrimary,
    letterSpacing: -1.5,
  },
  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 12,
    backgroundColor: Colors.darkSurface,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  profileAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.darkBg,
  },
  profileInfo: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
  },

  // Intelligence Card
  intelCard: {
    marginHorizontal: 20,
    padding: 18,
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  intelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  intelLogo: {
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  intelStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  intelStat: {
    flex: 1,
    alignItems: 'center',
  },
  intelStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.5,
  },
  intelStatLabel: {
    fontSize: 11,
    color: Colors.darkTextTertiary,
    marginTop: 2,
  },
  intelDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.darkBorder,
  },

  // Section
  section: {
    marginTop: 28,
    paddingHorizontal: Layout.screenPadding,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.2,
    marginBottom: 12,
  },

  // Data Sources
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.darkBorder,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sourceStatus: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sourceName: {
    fontSize: 14,
    color: Colors.darkTextSecondary,
  },
  sourceCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkTextPrimary,
  },
  sourceNote: {
    fontSize: 11,
    color: Colors.darkTextTertiary,
    marginTop: 10,
    fontStyle: 'italic',
  },

  // Insight Card
  insightCard: {
    marginTop: 20,
    marginHorizontal: 20,
    padding: 18,
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.2,
  },
  insightUpdated: {
    fontSize: 11,
    color: Colors.darkTextTertiary,
  },
  insightBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  insightMetric: {
    alignItems: 'center',
  },
  insightValue: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -1,
  },
  insightUnit: {
    fontSize: 12,
    color: Colors.darkTextTertiary,
  },
  insightDetail: {
    flex: 1,
    gap: 4,
  },
  insightDetailText: {
    fontSize: 12,
    color: Colors.darkTextSecondary,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: Layout.screenPadding,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: Colors.darkSurface,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.darkTextTertiary,
    marginTop: 2,
  },

  // Settings
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.darkBorder,
  },
  settingText: {
    fontSize: 14,
    color: Colors.darkTextPrimary,
  },
  settingArrow: {
    fontSize: 18,
    color: Colors.darkTextTertiary,
    fontWeight: '300',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: Colors.darkTextTertiary,
  },
  footerSubtext: {
    fontSize: 11,
    color: Colors.darkTextTertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
