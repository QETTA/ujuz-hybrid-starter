/**
 * TOAlertSettingsScreen - TO 실시간 알림 관리
 *
 * MongoDB: to_subscriptions CRUD + insight_waiting DataBlock
 * 크롤러: 2시간 주기 "TO 나왔어요" 키워드 수집 → toAlertService 감지
 */

import { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { TamaguiPressableScale } from '@/app/design-system';
import { useNotifications } from '@/app/hooks/useNotifications';
import { usePayment } from '@/app/hooks/usePayment';
import { placesService } from '@/app/services/mongo/places';
import { Colors, Layout } from '@/app/constants';
import { COPY } from '@/app/copy/copy.ko';
import type { AgeClass } from '@/app/types/auth';
import type { PlaceWithDistance } from '@/app/types/places';

const AGE_CLASSES: AgeClass[] = ['0세반', '1세반', '2세반', '3세반', '4세반', '5세반'];

const stagger = (i: number) =>
  FadeInDown.delay(i * 60)
    .springify()
    .damping(18)
    .stiffness(120)
    .mass(0.8);

export default function TOAlertSettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const {
    subscriptions,
    preferences,
    isLoading,
    fetchSubscriptions,
    subscribeFacility,
    unsubscribeFacility,
    setPreferences,
  } = useNotifications();
  const { canUseFeature } = usePayment();

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceWithDistance[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<PlaceWithDistance | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<AgeClass[]>(['2세반']);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await placesService.searchByText(query, 10);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    }
  }, []);

  const toggleClass = useCallback((cls: AgeClass) => {
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  }, []);

  const handleAddSubscription = useCallback(async () => {
    if (!selectedFacility) return;
    if (selectedClasses.length === 0) {
      Alert.alert('연령반 선택', '모니터링할 연령반을 선택해주세요');
      return;
    }
    if (!canUseFeature('to_alert_facility_limit')) {
      Alert.alert(
        '시설 한도 초과',
        '현재 플랜의 모니터링 한도에 도달했어요.\n베이직 플랜에서 5개까지 가능해요.',
        [
          { text: '다음에', style: 'cancel' },
          { text: '플랜 보기', onPress: () => navigation.navigate('Subscription') },
        ]
      );
      return;
    }

    const { error } = await subscribeFacility(
      selectedFacility.id,
      selectedFacility.name,
      selectedClasses
    );
    if (error) {
      Alert.alert('오류', error);
    } else {
      setShowAddForm(false);
      setSelectedFacility(null);
      setSearchQuery('');
      setSelectedClasses(['2세반']);
    }
  }, [selectedFacility, selectedClasses, canUseFeature, subscribeFacility, navigation]);

  const handleRemove = useCallback(
    (facilityId: string, name: string) => {
      Alert.alert('구독 해제', `${name} 빈자리 알림을 해제할까요?`, [
        { text: '취소', style: 'cancel' },
        {
          text: '해제',
          style: 'destructive',
          onPress: () => unsubscribeFacility(facilityId),
        },
      ]);
    },
    [unsubscribeFacility]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <Animated.View entering={stagger(0)} style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backBtn}>‹</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>빈자리 알림 관리</Text>
          <Text style={styles.subtitle}>{subscriptions.length}개 시설 모니터링 중</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('NotificationHistory')} hitSlop={12}>
          <Text style={styles.historyBtn}>알림 내역</Text>
        </Pressable>
      </Animated.View>

      {/* Subscription List */}
      <Animated.View entering={stagger(1)} style={styles.section}>
        <Text style={styles.sectionTitle}>구독 시설</Text>
        {isLoading ? (
          <ActivityIndicator color={Colors.darkTextTertiary} style={{ marginTop: 20 }} />
        ) : subscriptions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>아직 구독 중인 시설이 없어요</Text>
            <Text style={styles.emptySubtext}>
              시설을 추가하면 빈자리 발생 시 알림을 받을 수 있어요
            </Text>
          </View>
        ) : (
          subscriptions.map((sub) => (
            <TamaguiPressableScale
              key={sub.id}
              style={styles.subCard}
              hapticType="light"
              onPress={() => handleRemove(sub.facility_id, sub.facility_name)}
            >
              <View style={styles.subInfo}>
                <Text style={styles.subName}>{sub.facility_name}</Text>
                <View style={styles.subClasses}>
                  {sub.target_classes.map((cls) => (
                    <View key={cls} style={styles.classBadge}>
                      <Text style={styles.classBadgeText}>{cls}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: sub.is_active ? Colors.success : Colors.darkTextTertiary,
                  },
                ]}
              />
            </TamaguiPressableScale>
          ))
        )}
      </Animated.View>

      {/* Add Facility */}
      <Animated.View entering={stagger(2)} style={styles.section}>
        {!showAddForm ? (
          <TamaguiPressableScale
            style={styles.addBtn}
            onPress={() => setShowAddForm(true)}
            hapticType="light"
          >
            <Text style={styles.addBtnText}>+ 시설 추가</Text>
          </TamaguiPressableScale>
        ) : (
          <View style={styles.addForm}>
            <Text style={styles.sectionTitle}>시설 추가</Text>

            {selectedFacility ? (
              <TamaguiPressableScale
                style={styles.selectedCard}
                onPress={() => setSelectedFacility(null)}
                hapticType="light"
              >
                <Text style={styles.selectedName}>{selectedFacility.name}</Text>
                <Text style={styles.changeBtn}>변경</Text>
              </TamaguiPressableScale>
            ) : (
              <View>
                <TextInput
                  style={styles.searchInput}
                  placeholder="어린이집 이름으로 검색..."
                  placeholderTextColor={Colors.darkTextTertiary}
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoCorrect={false}
                />
                {searchResults.length > 0 && (
                  <View style={styles.dropdown}>
                    {searchResults.map((place) => (
                      <Pressable
                        key={place.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedFacility(place);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                      >
                        <Text style={styles.dropdownName}>{place.name}</Text>
                        <Text style={styles.dropdownAddr}>{place.address}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>모니터링 연령반</Text>
            <View style={styles.chipRow}>
              {AGE_CLASSES.map((cls) => (
                <TamaguiPressableScale
                  key={cls}
                  style={[styles.chip, selectedClasses.includes(cls) && styles.chipSel]}
                  onPress={() => toggleClass(cls)}
                  hapticType="light"
                >
                  <Text
                    style={[styles.chipText, selectedClasses.includes(cls) && styles.chipTextSel]}
                  >
                    {cls}
                  </Text>
                </TamaguiPressableScale>
              ))}
            </View>

            <View style={styles.addFormActions}>
              <TamaguiPressableScale
                style={styles.cancelBtn}
                onPress={() => {
                  setShowAddForm(false);
                  setSelectedFacility(null);
                }}
                hapticType="light"
              >
                <Text style={styles.cancelBtnText}>취소</Text>
              </TamaguiPressableScale>
              <TamaguiPressableScale
                style={[styles.confirmBtn, !selectedFacility && styles.confirmBtnDisabled]}
                onPress={handleAddSubscription}
                disabled={!selectedFacility}
                hapticType="medium"
              >
                <Text style={styles.confirmBtnText}>구독 추가</Text>
              </TamaguiPressableScale>
            </View>
          </View>
        )}
      </Animated.View>

      {/* Notification Settings */}
      <Animated.View entering={stagger(3)} style={styles.section}>
        <Text style={styles.sectionTitle}>알림 설정</Text>
        <View style={styles.settingsCard}>
          <SettingRow
            label="푸시 알림"
            value={preferences.push}
            onToggle={(v) => setPreferences({ push: v })}
          />
          <SettingRow
            label="SMS 알림"
            value={preferences.sms}
            onToggle={(v) => setPreferences({ sms: v })}
          />
          <SettingRow
            label="이메일 알림"
            value={preferences.email}
            onToggle={(v) => setPreferences({ email: v })}
          />
        </View>
      </Animated.View>

      {/* Data Source Note */}
      <Animated.View entering={stagger(4)} style={styles.noteSection}>
        <Text style={styles.noteText}>{COPY.DATA_NOTE_VACANCY}</Text>
      </Animated.View>
    </ScrollView>
  );
}

function SettingRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.darkSurfaceElevated, true: Colors.primaryAlpha20 as string }}
        thumbColor={value ? Colors.primary : Colors.darkTextTertiary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 8,
  },
  backBtn: { fontSize: 32, color: Colors.darkTextPrimary, fontWeight: '300' },
  headerCenter: { flex: 1, marginLeft: 12 },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 12, color: Colors.darkTextTertiary, marginTop: 2 },
  historyBtn: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  section: { marginTop: 24, paddingHorizontal: Layout.screenPadding },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.darkTextPrimary,
    marginBottom: 10,
    letterSpacing: -0.2,
  },

  // Empty
  emptyBox: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
  },
  emptyText: { fontSize: 14, fontWeight: '600', color: Colors.darkTextSecondary },
  emptySubtext: {
    fontSize: 12,
    color: Colors.darkTextTertiary,
    marginTop: 6,
    textAlign: 'center',
  },

  // Subscription Cards
  subCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.darkSurface,
    borderRadius: 14,
    marginBottom: 8,
  },
  subInfo: { flex: 1 },
  subName: { fontSize: 14, fontWeight: '600', color: Colors.darkTextPrimary },
  subClasses: { flexDirection: 'row', gap: 6, marginTop: 6 },
  classBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: Colors.primaryAlpha10 as string,
    borderRadius: 8,
  },
  classBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  statusDot: { width: 8, height: 8, borderRadius: 4 },

  // Add Button
  addBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  // Add Form
  addForm: {
    padding: 16,
    backgroundColor: Colors.darkSurface,
    borderRadius: 16,
  },
  searchInput: {
    height: 44,
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.darkTextPrimary,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  dropdown: {
    marginTop: 4,
    backgroundColor: Colors.darkSurfaceElevated,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.darkBorder,
  },
  dropdownName: { fontSize: 13, fontWeight: '600', color: Colors.darkTextPrimary },
  dropdownAddr: { fontSize: 11, color: Colors.darkTextTertiary, marginTop: 2 },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: Colors.primaryAlpha10 as string,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  selectedName: { fontSize: 14, fontWeight: '600', color: Colors.darkTextPrimary },
  changeBtn: { fontSize: 12, color: Colors.primary, fontWeight: '600' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: Colors.darkSurfaceElevated,
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  chipSel: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: { fontSize: 12, fontWeight: '500', color: Colors.darkTextSecondary },
  chipTextSel: { color: Colors.darkBg, fontWeight: '600' },

  addFormActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.darkSurfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: Colors.darkBorder,
  },
  cancelBtnText: { fontSize: 13, fontWeight: '600', color: Colors.darkTextSecondary },
  confirmBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: { fontSize: 13, fontWeight: '700', color: Colors.darkBg },

  // Settings
  settingsCard: {
    backgroundColor: Colors.darkSurface,
    borderRadius: 14,
    padding: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingLabel: { fontSize: 14, color: Colors.darkTextPrimary },

  // Note
  noteSection: { marginTop: 32, paddingHorizontal: Layout.screenPadding, alignItems: 'center' },
  noteText: {
    fontSize: 11,
    color: Colors.darkTextTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});
