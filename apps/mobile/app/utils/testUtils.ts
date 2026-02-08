/**
 * Test Utilities for UJUz Mobile
 *
 * Provides testing helpers and mock data factories
 *
 * Note: Install @testing-library/react-native and jest for full functionality:
 * npx expo install jest @testing-library/react-native @types/jest
 */

// ============================================
// Mock Data Factories
// ============================================

interface MockPlace {
  id: string;
  kakaoId: string;
  name: string;
  category: string;
  address: string;
  roadAddress: string;
  phone: string;
  location: { lat: number; lng: number };
  distance: number;
  rating: number;
  reviewCount: number;
  amenities: Record<string, boolean>;
  ageGroups: string[];
  images: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Creates a mock place for testing
 */
export function createMockPlace(overrides?: Partial<MockPlace>): MockPlace {
  return {
    id: `place-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    kakaoId: `kakao-${Date.now()}`,
    name: 'Test Kids Cafe',
    category: 'kids_cafe',
    address: '서울특별시 강남구 테스트로 123',
    roadAddress: '서울특별시 강남구 테스트로 123',
    phone: '02-1234-5678',
    location: {
      lat: 37.5665,
      lng: 126.978,
    },
    distance: 500,
    rating: 4.5,
    reviewCount: 120,
    amenities: {
      strollerAccess: true,
      nursingRoom: true,
      diaperChangingStation: true,
      parking: true,
      restaurant: false,
      restroom: true,
      wheelchairAccess: false,
      babyChair: true,
      nursingCushion: false,
      indoor: true,
      outdoor: false,
    },
    ageGroups: ['toddler', 'child'],
    images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Creates multiple mock places
 */
export function createMockPlaces(count: number): MockPlace[] {
  return Array.from({ length: count }, (_, index) =>
    createMockPlace({
      id: `place-${index}`,
      name: `Test Place ${index + 1}`,
      distance: (index + 1) * 100,
    })
  );
}

interface MockVideo {
  id: string;
  youtubeId: string;
  title: string;
  author: string;
  likes: number;
  comments: number;
  shares: number;
  thumbnail: string;
}

/**
 * Creates a mock video for shorts
 */
export function createMockVideo(overrides?: Partial<MockVideo>): MockVideo {
  return {
    id: `video-${Date.now()}`,
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Test Video Title',
    author: 'Test Author',
    likes: 1234,
    comments: 56,
    shares: 78,
    thumbnail: 'https://example.com/thumbnail.jpg',
    ...overrides,
  };
}

// ============================================
// Wait Utilities
// ============================================

/**
 * Waits for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Waits for React Native's event loop to settle
 */
export async function waitForNextTick(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

// ============================================
// Test Assertion Helpers (requires Jest)
// ============================================

/**
 * Asserts that an element has accessibility properties
 * Note: Requires Jest to be installed
 */
export function expectAccessible(element: {
  props: { accessible?: boolean; accessibilityLabel?: string };
}) {
  if (element.props.accessible === false) {
    throw new Error('Element is not accessible');
  }
  if (!element.props.accessibilityLabel) {
    throw new Error('Element is missing accessibilityLabel');
  }
}

/**
 * Asserts that a button has proper accessibility
 * Note: Requires Jest to be installed
 */
export function expectAccessibleButton(element: {
  props: { accessible?: boolean; accessibilityLabel?: string; accessibilityRole?: string };
}) {
  expectAccessible(element);
  if (element.props.accessibilityRole !== 'button') {
    throw new Error('Element is not marked as button role');
  }
}
