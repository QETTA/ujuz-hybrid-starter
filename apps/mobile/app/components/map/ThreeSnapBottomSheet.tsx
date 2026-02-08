/**
 * ThreeSnapBottomSheet - Kakao Map Style
 *
 * 3-Level Snap Points: Peek (25%) → Half (50%) → Full (90%)
 * Features:
 * - Drag to dismiss
 * - Smooth animations
 * - Content based on snap level
 */

import { useCallback, useMemo, forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/app/constants/Colors';
import { Layout } from '@/app/constants';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { TamaguiText } from '@/app/design-system';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { usePlaceStore } from '@/app/stores/placeStore';
import { ActionButton, Pill, OptimizedImage } from '@/app/components/shared';
import type { PlaceWithDistance } from '@/app/types/places';
import { COPY } from '@/app/copy/copy.ko';

export interface ThreeSnapBottomSheetProps {
  onClose?: () => void;
}

const ThreeSnapBottomSheet = forwardRef<BottomSheet, ThreeSnapBottomSheetProps>(
  ({ onClose }, ref) => {
    const { selectedPlace } = usePlaceStore();

    // Snap points: Peek (15%), Half (50%), Full (90%) - iOS Maps style
    const snapPoints = useMemo(() => ['15%', '50%', '90%'], []);

    // iOS-style backdrop with subtle dimming
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={0}
          appearsOnIndex={1}
          opacity={0.3}
          pressBehavior="close"
        />
      ),
      []
    );

    const handleSheetChanges = useCallback(
      (index: number) => {
        if (index === -1) {
          onClose?.();
        }
      },
      [onClose]
    );

    if (!selectedPlace) return null;

    return (
      <BottomSheet
        ref={ref}
        index={1} // Start at Half (50%)
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        enablePanDownToClose
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        backdropComponent={renderBackdrop}
        // iOS-style spring animation (damping ~0.8)
        animateOnMount
        enableDynamicSizing={false}
      >
        <BottomSheetView style={styles.contentContainer}>
          <SheetContent place={selectedPlace} />
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

ThreeSnapBottomSheet.displayName = 'ThreeSnapBottomSheet';

export default ThreeSnapBottomSheet;

// ============================================
// Sheet Content Component
// ============================================

interface SheetContentProps {
  place: PlaceWithDistance;
}

function SheetContent({ place }: SheetContentProps) {
  const mockRating = 4.5 + Math.random() * 0.5;
  const mockReviews = Math.floor(Math.random() * 500) + 50;

  return (
    <View style={styles.content}>
      {/* Image */}
      {place.thumbnailUrl && (
        <OptimizedImage uri={place.thumbnailUrl} style={styles.image} alt={`${place.name} image`} />
      )}

      {/* Place Name */}
      <TamaguiText preset="h3" textColor="primary" weight="semibold" style={styles.placeName}>
        {place.name}
      </TamaguiText>

      {/* Rating */}
      <TamaguiText preset="body" textColor="secondary" style={styles.placeRating}>
        {mockRating.toFixed(1)} · {COPY.REVIEWS_COUNT(mockReviews)}
      </TamaguiText>

      {/* Distance */}
      {place.distance !== undefined && (
        <TamaguiText preset="body" textColor="tertiary" style={styles.placeDistance}>
          {place.distance < 1000
            ? COPY.DISTANCE_M(Math.round(place.distance))
            : COPY.DISTANCE_KM((place.distance / 1000).toFixed(1))}
        </TamaguiText>
      )}

      {/* Address */}
      {place.address && (
        <TamaguiText preset="body" textColor="tertiary" style={styles.placeAddress}>
          {place.address}
        </TamaguiText>
      )}

      {/* Amenities */}
      <View style={styles.amenitiesRow}>
        {place.admissionFee?.isFree && <Pill text={COPY.AMENITY_FREE} variant="success" />}
        {place.amenities?.parking && <Pill text={COPY.AMENITY_PARKING} />}
        {place.amenities?.nursingRoom && <Pill text={COPY.AMENITY_NURSING_ROOM} />}
      </View>

      {/* Quick Actions (for Half/Full snap) */}
      <View style={styles.actionsRow}>
        <ActionButton icon="call-outline" label={COPY.ACTION_CALL} />
        <ActionButton icon="navigate-outline" label={COPY.ACTION_DIRECTIONS} />
        <ActionButton icon="share-outline" label={COPY.ACTION_SHARE} />
        <ActionButton icon="bookmark-outline" label={COPY.ACTION_SAVE} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handleIndicator: {
    backgroundColor: Colors.iosQuaternaryFill, // iOS handle color
    width: 36,
    height: 5,
    borderRadius: 2.5, // iOS HIG: half of height
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: Layout.screenPadding,
  },
  content: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: Colors.iosSecondaryBackground,
  },
  placeName: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    color: Colors.iosLabel,
    marginBottom: 6,
  },
  placeRating: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.iosSecondaryLabel,
    marginBottom: 4,
  },
  placeDistance: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.iosTertiaryLabel,
    marginBottom: 8,
  },
  placeAddress: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.iosTertiaryLabel,
    marginBottom: 16,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  amenityBadge: {
    backgroundColor: Colors.iosSecondaryBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  amenityText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.iosSecondaryLabel,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.iosSecondaryBackground,
  },
  actionButton: {
    alignItems: 'center',
    gap: 6,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.iosSecondaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.link,
  },
});
