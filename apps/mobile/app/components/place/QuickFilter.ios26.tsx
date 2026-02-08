/**
 * QuickFilter Component - Minimal, Trust-First
 *
 * - TamaguiChip 기반으로 통일
 * - 과한 블러/애니메이션 제거
 * - 카테고리 필터만 명확하게 노출
 */

import { useCallback, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useTheme } from 'tamagui';
import { TamaguiChip, TamaguiChipGroup } from '@/app/design-system/components';
import { COPY } from '@/app/copy/copy.ko';
import { useFilterStore } from '@/app/stores/filterStore';
import type { FilterCategory } from '@/app/types/places';

interface FilterItem {
  category: FilterCategory;
  label: string;
}

const FILTERS: FilterItem[] = [
  { category: 'outdoor', label: COPY.FILTER_OUTDOOR },
  { category: 'indoor', label: COPY.FILTER_INDOOR },
  { category: 'public', label: COPY.FILTER_PUBLIC },
  { category: 'restaurant', label: COPY.FILTER_RESTAURANT },
];

export default function QuickFilter() {
  const { filterCategory, setFilterCategory } = useFilterStore();
  const theme = useTheme();

  const handlePress = useCallback(
    (category: FilterCategory) => {
      if (filterCategory === category) {
        setFilterCategory(null);
      } else {
        setFilterCategory(category);
      }
    },
    [filterCategory, setFilterCategory]
  );

  const handleClear = useCallback(() => {
    setFilterCategory(null);
  }, [setFilterCategory]);

  const styles = useMemo(() => ({
    container: {
      backgroundColor: theme.background.val,
      paddingVertical: 10,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.borderColor.val,
    },
    scrollContent: {
      paddingHorizontal: 16,
    },
  }), [theme]);

  return (
    <View style={styles.container} accessibilityRole="toolbar">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        accessibilityRole="list"
      >
        <TamaguiChipGroup gap={8} wrap={false}>
          {filterCategory && (
            <TamaguiChip
              label={COPY.FILTER_ALL}
              variant="soft"
              size="md"
              selected={false}
              haptics={false}
              onPress={handleClear}
            />
          )}
          {FILTERS.map((filter) => (
            <TamaguiChip
              key={filter.category}
              label={filter.label}
              variant={filterCategory === filter.category ? 'filled' : 'outlined'}
              size="md"
              selected={filterCategory === filter.category}
              haptics={false}
              onPress={() => handlePress(filter.category)}
            />
          ))}
        </TamaguiChipGroup>
      </ScrollView>
    </View>
  );
}
