/**
 * ThreeSnapBottomSheet Enhanced - Kakao Map Style
 *
 * 3-Level Content (delegated to sub-components):
 * - Peek (25%): PeekCard — basic info + thumbnail
 * - Half (50%): HalfCard — detailed info + reviews preview
 * - Full (90%): FullCard — complete info + shorts gallery + group buy
 */

import { useCallback, useMemo, forwardRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { usePlaceStore } from '@/app/stores/placeStore';
import { Colors, Layout } from '@/app/constants';
import { PeekCard, HalfCard, FullCard } from './sheet';
import type { PlaceInsights } from '@/app/types/dataBlock';

export interface ThreeSnapBottomSheetProps {
  onClose?: () => void;
  insightsMap?: Map<string, PlaceInsights>;
}

const ThreeSnapBottomSheet = forwardRef<BottomSheet, ThreeSnapBottomSheetProps>(
  ({ onClose, insightsMap }, ref) => {
    const { selectedPlace } = usePlaceStore();
    const [currentSnap, setCurrentSnap] = useState(1); // Start at Half

    const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

    const handleSheetChanges = useCallback(
      (index: number) => {
        setCurrentSnap(index);
        if (index === -1) {
          onClose?.();
        }
      },
      [onClose]
    );

    if (!selectedPlace) return null;

    const insights = insightsMap?.get(selectedPlace.id);

    return (
      <BottomSheet
        ref={ref}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {currentSnap === 0 && <PeekCard place={selectedPlace} insights={insights} />}
            {currentSnap === 1 && <HalfCard place={selectedPlace} insights={insights} />}
            {currentSnap === 2 && <FullCard place={selectedPlace} insights={insights} />}
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

ThreeSnapBottomSheet.displayName = 'ThreeSnapBottomSheet';
export default ThreeSnapBottomSheet;

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handleIndicator: {
    backgroundColor: Colors.iosQuaternaryFill,
    width: 40,
    height: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: Layout.screenPadding,
  },
});
