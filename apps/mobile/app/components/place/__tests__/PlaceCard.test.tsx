/**
 * PlaceCard Component Tests
 *
 * Tests rendering, interactions, and accessibility
 */

/* eslint-disable @typescript-eslint/no-require-imports */
import { render, fireEvent } from '@testing-library/react-native';

import PlaceCard from '../PlaceCard.ios26';
import * as Haptics from 'expo-haptics';
import type { PlaceWithDistance } from '@/app/types/places';

// Mock dependencies before importing component
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
  },
}));

// Mock design-system: TamaguiPressableScale uses GestureDetector internally,
// which doesn't support fireEvent.press in tests. Replace with TouchableOpacity.
jest.mock('@/app/design-system', () => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  const HapticsMock = require('expo-haptics');

  return {
    TamaguiPressableScale: ({
      children,
      onPress,
      hapticType = 'light',
      disabled,
      style,
      accessibilityLabel,
      accessibilityHint,
    }: any) =>
      React.createElement(
        TouchableOpacity,
        {
          style,
          accessibilityRole: onPress ? 'button' : undefined,
          accessibilityLabel,
          accessibilityHint,
          accessibilityState: { disabled: !!disabled },
          disabled,
          onPress: disabled
            ? undefined
            : () => {
                if (hapticType === 'medium') {
                  HapticsMock.impactAsync(HapticsMock.ImpactFeedbackStyle.Medium);
                } else if (hapticType !== 'none') {
                  HapticsMock.impactAsync(HapticsMock.ImpactFeedbackStyle.Light);
                }
                onPress?.();
              },
        },
        children
      ),
    TamaguiText: ({ children, ...props }: any) => React.createElement(Text, props, children),
  };
});

jest.mock('@/app/components/shared', () => ({
  OptimizedImage: ({ alt }: { alt: string }) => {
    const { View, Text } = require('react-native');
    return (
      <View testID="optimized-image">
        <Text>{alt}</Text>
      </View>
    );
  },
}));

jest.mock('@/app/design-system/components/Badge/Badge', () => {
  const { View, Text } = require('react-native');
  return function MockBadge({ label }: { label: string }) {
    return (
      <View testID={`badge-${label.toLowerCase()}`}>
        <Text>{label}</Text>
      </View>
    );
  };
});

jest.mock('@/app/design-system/components/Rating/Rating', () => {
  const { View, Text } = require('react-native');
  return function MockRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
    return (
      <View testID="rating">
        <Text>{`${rating} (${reviewCount})`}</Text>
      </View>
    );
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, testID }: { name: string; testID?: string }) => {
    const { View, Text } = require('react-native');
    return (
      <View testID={testID || `icon-${name}`}>
        <Text>{name}</Text>
      </View>
    );
  },
}));

jest.mock('@/app/utils/distance', () => ({
  formatDistance: jest.fn((distance: number) => {
    if (distance < 1000) return `${distance}m`;
    return `${(distance / 1000).toFixed(1)}km`;
  }),
}));

jest.mock('@/app/utils/accessibility', () => ({
  getPlaceCardLabel: jest.fn(
    ({ name, category }: { name: string; category: string }) => `${name}, ${category}`
  ),
  getFavoriteButtonLabel: jest.fn(
    ({ placeName, isFavorite }: { placeName: string; isFavorite: boolean }) =>
      `${isFavorite ? 'Remove' : 'Add'} ${placeName} ${isFavorite ? 'from' : 'to'} favorites`
  ),
  getFavoriteButtonHint: jest.fn((isFavorite: boolean) =>
    isFavorite ? 'Tap to remove from favorites' : 'Tap to add to favorites'
  ),
}));

// Create test place data
const createTestPlace = (overrides: Partial<PlaceWithDistance> = {}): PlaceWithDistance => ({
  id: 'test-place-1',
  name: 'Test Kids Cafe',
  source: 'TOUR_API',
  sourceUrl: '',
  fetchedAt: new Date().toISOString(),
  category: 'kids_cafe',
  address: 'Seoul, Korea',
  latitude: 37.5,
  longitude: 127.0,
  distance: 500,
  rating: 4.5,
  reviewCount: 100,
  thumbnailUrl: 'https://example.com/image.jpg',
  admissionFee: { isFree: false, child: 10000 },
  amenities: {
    parking: true,
    nursingRoom: true,
    diaperChangingStation: false,
  },
  rawData: {},
  ...overrides,
});

describe('PlaceCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render place name', () => {
      const place = createTestPlace({ name: 'Awesome Kids Cafe' });
      const { getByText } = render(<PlaceCard place={place} />);

      expect(getByText('Awesome Kids Cafe')).toBeTruthy();
    });

    it('should render place address', () => {
      const place = createTestPlace({ address: '123 Main Street, Seoul' });
      const { getByText } = render(<PlaceCard place={place} />);

      expect(getByText('123 Main Street, Seoul')).toBeTruthy();
    });

    it('should render distance badge when distance is provided', () => {
      const place = createTestPlace({ distance: 800 });
      const { getByText } = render(<PlaceCard place={place} />);

      expect(getByText('800m')).toBeTruthy();
    });

    it('should not render distance badge when distance is undefined', () => {
      const place = createTestPlace({ distance: undefined });
      const { queryByText } = render(<PlaceCard place={place} />);

      // Should not find any distance text
      expect(queryByText(/\d+m/)).toBeNull();
    });

    it('should render free badge when admission is free', () => {
      const place = createTestPlace({ admissionFee: { isFree: true } });
      const { getByText } = render(<PlaceCard place={place} />);

      expect(getByText('무료')).toBeTruthy();
    });

    it('should not render free badge when admission is not free', () => {
      const place = createTestPlace({ admissionFee: { isFree: false, child: 10000 } });
      const { queryByText } = render(<PlaceCard place={place} />);

      expect(queryByText('무료')).toBeNull();
    });

    it('should render image when thumbnailUrl is provided', () => {
      const place = createTestPlace({ thumbnailUrl: 'https://example.com/image.jpg' });
      const { UNSAFE_getByType } = render(<PlaceCard place={place} />);

      // OptimizedImage mock renders with test content
      const { OptimizedImage } = require('@/app/components/shared');
      expect(UNSAFE_getByType(OptimizedImage)).toBeTruthy();
    });

    it('should render placeholder when thumbnailUrl is not provided', () => {
      const place = createTestPlace({ thumbnailUrl: undefined });
      const { queryByTestId } = render(<PlaceCard place={place} />);

      expect(queryByTestId('optimized-image')).toBeNull();
    });

    it('should render amenities text', () => {
      const place = createTestPlace({
        amenities: {
          parking: true,
          nursingRoom: true,
          diaperChangingStation: false,
        },
      });
      const { getByText } = render(<PlaceCard place={place} />);

      expect(getByText('주차 · 수유실')).toBeTruthy();
    });

    it('should not render amenities when none available', () => {
      const place = createTestPlace({
        amenities: {
          parking: false,
          nursingRoom: false,
          diaperChangingStation: false,
        },
      });
      const { queryByText } = render(<PlaceCard place={place} />);

      expect(queryByText(/주차/)).toBeNull();
    });
  });

  describe('Interactions', () => {
    it('should call onPress when card is pressed', () => {
      const onPress = jest.fn();
      const place = createTestPlace();
      const { getByRole } = render(<PlaceCard place={place} onPress={onPress} />);

      fireEvent.press(getByRole('button'));

      expect(onPress).toHaveBeenCalledTimes(1);
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
    });

    it('should call onFavoritePress when favorite button is pressed', () => {
      const onFavoritePress = jest.fn();
      const place = createTestPlace();
      const { UNSAFE_queryAllByProps } = render(
        <PlaceCard place={place} onFavoritePress={onFavoritePress} />
      );

      // Find the favorite button by its icon testID (inside hidden accessibility container)
      const heartIcons = UNSAFE_queryAllByProps({ testID: 'icon-heart-outline' });
      expect(heartIcons.length).toBeGreaterThan(0);
      // Press the icon (event bubbles to parent TouchableOpacity)
      fireEvent.press(heartIcons[0]);

      expect(onFavoritePress).toHaveBeenCalledTimes(1);
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium);
    });

    it('should not render favorite button when onFavoritePress is not provided', () => {
      const place = createTestPlace();
      const { queryByTestId } = render(<PlaceCard place={place} />);

      // The heart icon should not be rendered
      expect(queryByTestId('icon-heart')).toBeNull();
      expect(queryByTestId('icon-heart-outline')).toBeNull();
    });
  });

  describe('Favorite state', () => {
    it('should show filled heart when isFavorite is true', () => {
      const place = createTestPlace();
      const { UNSAFE_queryAllByProps } = render(
        <PlaceCard place={place} onFavoritePress={() => {}} isFavorite={true} />
      );

      // icon-heart is inside accessibilityElementsHidden container
      const filledHearts = UNSAFE_queryAllByProps({ testID: 'icon-heart' });
      expect(filledHearts.length).toBeGreaterThan(0);
    });

    it('should show outline heart when isFavorite is false', () => {
      const place = createTestPlace();
      const { UNSAFE_queryAllByProps } = render(
        <PlaceCard place={place} onFavoritePress={() => {}} isFavorite={false} />
      );

      // icon-heart-outline is inside accessibilityElementsHidden container
      const outlineHearts = UNSAFE_queryAllByProps({ testID: 'icon-heart-outline' });
      expect(outlineHearts.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have correct accessibility role', () => {
      const place = createTestPlace();
      const { getByRole } = render(<PlaceCard place={place} />);

      expect(getByRole('button')).toBeTruthy();
    });

    it('should have accessibility label with place info', () => {
      const place = createTestPlace({
        name: 'Fun Park',
        category: 'amusement_park',
      });
      const { getByLabelText } = render(<PlaceCard place={place} />);

      expect(getByLabelText('Fun Park, amusement_park')).toBeTruthy();
    });

    it('should have correct favorite button accessibility label', () => {
      const place = createTestPlace({ name: 'Test Place' });
      const { UNSAFE_queryAllByProps } = render(
        <PlaceCard place={place} onFavoritePress={() => {}} isFavorite={false} />
      );

      // Find elements with the specific accessibility label
      const elements = UNSAFE_queryAllByProps({
        accessibilityLabel: 'Add Test Place to favorites',
      });
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Rating display', () => {
    it('should render rating component', () => {
      const place = createTestPlace({ rating: 4.8, reviewCount: 250 });
      const { getByTestId } = render(<PlaceCard place={place} />);

      expect(getByTestId('rating')).toBeTruthy();
    });

    it('should not render rating when rating is missing', () => {
      const place = createTestPlace({ rating: undefined, reviewCount: undefined });
      const { queryByTestId } = render(<PlaceCard place={place} />);

      expect(queryByTestId('rating')).toBeNull();
    });
  });
});
