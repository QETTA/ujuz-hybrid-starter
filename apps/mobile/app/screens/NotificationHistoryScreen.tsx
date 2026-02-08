/**
 * NotificationHistoryScreen - TO 알림 내역
 *
 * MongoDB: to_alerts 컬렉션 -> 날짜별 그룹 SectionList
 * 2026 Design: LinearGradient bg, monochrome cards, tight typography
 */

import { useEffect, useMemo, useCallback } from 'react';
import { View, SectionList, type ViewStyle, type TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from 'tamagui';

import type { RootStackNavigationProp } from '@/app/types/navigation';
import Animated, { FadeInDown } from 'react-native-reanimated';
// LinearGradient removed — flat dark bg
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

import { Colors, Layout } from '@/app/constants';
import { TamaguiText, TamaguiPressableScale, TamaguiEmptyState, TamaguiHeader } from '@/app/design-system';
import { useNotifications } from '@/app/hooks/useNotifications';
import { COPY } from '@/app/copy/copy.ko';
import type { TOAlert } from '@/app/types/toAlert';

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════

const SOURCE_LABELS: Record<TOAlert['source'], string> = {
  auto_detection: '자동 감지',
  community_report: '커뮤니티',
  official: '공식 발표',
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

/** Map confidence number (0-1) to human-readable label */
function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.7) return CONFIDENCE_LABELS.high;
  if (confidence >= 0.4) return CONFIDENCE_LABELS.medium;
  return CONFIDENCE_LABELS.low;
}

/** Stagger entrance animation for list items */
const stagger = (index: number) =>
  FadeInDown.delay(index * 60)
    .springify()
    .damping(18)
    .stiffness(120)
    .mass(0.8);

// ═══════════════════════════════════════════════════════════
// DATE GROUPING
// ═══════════════════════════════════════════════════════════

interface AlertSection {
  title: string;
  data: TOAlert[];
}

function getDateSectionKey(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfToday.getDay());
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  if (date >= startOfToday) return '오늘';
  if (date >= startOfYesterday) return '어제';
  if (date >= startOfWeek) return '이번 주';
  if (date >= startOfLastWeek) return '지난 주';
  if (date >= startOfMonth) return '이번 달';

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });
}

function groupAlertsByDate(alerts: TOAlert[]): AlertSection[] {
  const grouped: Record<string, TOAlert[]> = {};
  const order: string[] = [];

  for (const alert of alerts) {
    const key = getDateSectionKey(alert.detected_at);
    if (!grouped[key]) {
      grouped[key] = [];
      order.push(key);
    }
    grouped[key].push(alert);
  }

  return order.map((title) => ({ title, data: grouped[title] }));
}

// ═══════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════

export function NotificationHistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNavigationProp>();
  const theme = useTheme();

  const { alerts, unreadCount, fetchAlerts, markAlertRead, markAllRead, isLoading } =
    useNotifications();

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const sections = useMemo(() => groupAlertsByDate(alerts), [alerts]);

  const handleAlertPress = useCallback(
    (alert: TOAlert) => {
      markAlertRead(alert.id);
      navigation.navigate('PlaceDetail', { id: alert.facility_id });
    },
    [markAlertRead, navigation]
  );

  // ─────────────────────────────────────────────────────────
  // Theme-aware styles
  // ─────────────────────────────────────────────────────────

  const styles = useMemo(
    () => ({
      root: {
        flex: 1,
        backgroundColor: theme.background.val,
      } as ViewStyle,

      // Section
      sectionHeader: {
        fontSize: 13,
        color: theme.textTertiary.val,
        paddingHorizontal: Layout.screenPadding,
        marginTop: 20,
        marginBottom: 10,
        letterSpacing: -0.2,
      } as TextStyle,

      // List
      listContent: {
        paddingTop: 56 + insets.top + 4,
      } as ViewStyle,
      listContentEmpty: {
        flex: 1,
      } as ViewStyle,

      // Alert Card
      alertCard: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 8,
        padding: 16,
        backgroundColor: theme.surface.val,
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: theme.borderColor.val,
      } as ViewStyle,
      unreadDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
        marginRight: 10,
        marginTop: 6,
      } as ViewStyle,
      alertContent: {
        flex: 1,
      } as ViewStyle,

      // Alert Row 1: facility + age class
      alertRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
      } as ViewStyle,
      facilityName: {
        fontSize: 14,
        color: theme.textPrimary.val,
        letterSpacing: -0.3,
        flexShrink: 1,
      } as TextStyle,
      ageClassBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: theme.surfaceElevated.val,
        borderRadius: 6,
        marginLeft: 8,
      } as ViewStyle,
      ageClassText: {
        fontSize: 11,
        color: theme.textSecondary.val,
        letterSpacing: -0.2,
      } as TextStyle,

      // Alert Row 2: slots
      slotsText: {
        fontSize: 13,
        color: theme.textSecondary.val,
        letterSpacing: -0.2,
        marginBottom: 8,
      } as TextStyle,

      // Alert Row 3: footer
      alertFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      } as ViewStyle,
      footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      } as ViewStyle,
      timeText: {
        fontSize: 12,
        color: theme.textTertiary.val,
        letterSpacing: -0.2,
      } as TextStyle,
      sourceBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: theme.surfaceElevated.val,
        borderRadius: 4,
      } as ViewStyle,
      sourceText: {
        fontSize: 10,
        color: theme.textTertiary.val,
        letterSpacing: -0.2,
      } as TextStyle,
      confidenceBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: theme.surfaceElevated.val,
        borderRadius: 4,
      } as ViewStyle,
      confidenceText: {
        fontSize: 10,
        color: theme.textTertiary.val,
        letterSpacing: -0.2,
      } as TextStyle,

      // Empty State
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Layout.screenPadding,
      } as ViewStyle,
      ctaButton: {
        marginTop: 20,
        paddingHorizontal: 28,
        paddingVertical: 16,
        backgroundColor: Colors.primary,
        borderRadius: 14,
      } as ViewStyle,
      ctaText: {
        color: theme.background.val,
        letterSpacing: -0.2,
      } as TextStyle,
    }),
    [theme, insets.top]
  );

  // ─────────────────────────────────────────────────────────
  // Renderers
  // ─────────────────────────────────────────────────────────

  const renderSectionHeader = useCallback(
    ({ section }: { section: AlertSection }) => (
      <TamaguiText preset="bodySmall" weight="semibold" style={styles.sectionHeader}>
        {section.title}
      </TamaguiText>
    ),
    [styles]
  );

  const renderAlert = useCallback(
    ({ item, index }: { item: TOAlert; index: number }) => {
      const timeAgo = formatDistanceToNow(new Date(item.detected_at), {
        addSuffix: true,
        locale: ko,
      });
      const confidenceLabel = getConfidenceLabel(item.confidence);

      return (
        <Animated.View entering={stagger(index)}>
          <TamaguiPressableScale
            style={styles.alertCard}
            onPress={() => handleAlertPress(item)}
            hapticType="light"
            accessibilityLabel={`${item.facility_name} ${item.age_class} ${COPY.VACANCY_DETECTED(item.estimated_slots)}`}
            accessibilityHint="눌러서 시설 상세 화면으로 이동"
          >
            {/* Unread dot */}
            {!item.is_read && <View style={styles.unreadDot} />}

            <View style={styles.alertContent}>
              {/* Row 1: facility name + age class badge */}
              <View style={styles.alertRow}>
                <TamaguiText
                  preset="label"
                  weight="bold"
                  style={styles.facilityName}
                  numberOfLines={1}
                >
                  {item.facility_name}
                </TamaguiText>
                <View style={styles.ageClassBadge}>
                  <TamaguiText preset="caption" weight="semibold" style={styles.ageClassText}>
                    {item.age_class}
                  </TamaguiText>
                </View>
              </View>

              {/* Row 2: estimated slots */}
              <TamaguiText preset="bodySmall" textColor="secondary" style={styles.slotsText}>
                {COPY.VACANCY_DETECTED(item.estimated_slots)}
              </TamaguiText>

              {/* Row 3: time + source + confidence */}
              <View style={styles.alertFooter}>
                <View style={styles.footerLeft}>
                  <TamaguiText preset="caption" textColor="tertiary" style={styles.timeText}>
                    {timeAgo}
                  </TamaguiText>
                  <View style={styles.sourceBadge}>
                    <TamaguiText preset="caption" weight="semibold" style={styles.sourceText}>
                      {SOURCE_LABELS[item.source]}
                    </TamaguiText>
                  </View>
                </View>
                <View style={styles.confidenceBadge}>
                  <TamaguiText preset="caption" weight="medium" style={styles.confidenceText}>
                    {`신뢰도 ${confidenceLabel}`}
                  </TamaguiText>
                </View>
              </View>
            </View>
          </TamaguiPressableScale>
        </Animated.View>
      );
    },
    [handleAlertPress, styles]
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <TamaguiEmptyState
          icon="notifications-outline"
          title="아직 알림이 없어요"
          message="빈자리 알림을 설정해보세요"
        />
        <TamaguiPressableScale
          style={styles.ctaButton}
          onPress={() => navigation.navigate('TOAlertSettings')}
          hapticType="medium"
          accessibilityLabel="빈자리 알림 설정하러 가기"
          accessibilityHint="알림 설정 화면으로 이동합니다"
        >
          <TamaguiText preset="buttonSmall" weight="semibold" style={styles.ctaText}>
            빈자리 알림 설정하기
          </TamaguiText>
        </TamaguiPressableScale>
      </View>
    ),
    [navigation, styles]
  );

  // ─────────────────────────────────────────────────────────
  // Layout
  // ─────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      {/* Header */}
      <TamaguiHeader
        title="알림"
        showBack
        onBack={() => navigation.goBack()}
        rightIcon={unreadCount > 0 ? 'checkmark-done' : undefined}
        onRightPress={unreadCount > 0 ? markAllRead : undefined}
      />

      {/* Alert SectionList */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderAlert}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.listContent,
          alerts.length === 0 && styles.listContentEmpty,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        onRefresh={fetchAlerts}
        refreshing={isLoading}
      />
    </View>
  );
}

export default NotificationHistoryScreen;
