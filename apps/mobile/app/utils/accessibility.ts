/**
 * KidsMap Mobile - Accessibility Utilities
 *
 * Helper functions for creating accessible labels, hints, and announcements
 * for screen readers (VoiceOver on iOS, TalkBack on Android)
 */

import type {
  NormalizedPlace,
  PlaceWithDistance,
  Amenities,
  AgeGroup,
  FilterCategory,
} from '@/app/types/places';

// ============================================
// Place-related accessibility
// ============================================

/**
 * Creates an accessible label for a place card
 * Combines name, category, rating, and distance into a natural sentence
 *
 * @example
 * getPlaceCardLabel({
 *   name: "Kids Cafe Happy",
 *   category: "키즈카페",
 *   rating: 4.5,
 *   distance: 1200
 * })
 * // Returns: "Kids Cafe Happy, 키즈카페, Rating 4.5 out of 5, 1.2 kilometers away"
 */
export function getPlaceCardLabel(params: {
  name: string;
  category?: string;
  rating?: number;
  distance?: number;
}): string {
  const { name, category, rating, distance } = params;

  const parts: string[] = [name];

  if (category) {
    parts.push(category);
  }

  if (rating !== undefined && rating > 0) {
    parts.push(`Rating ${rating.toFixed(1)} out of 5`);
  }

  if (distance !== undefined && distance > 0) {
    const distanceText =
      distance >= 1000
        ? `${(distance / 1000).toFixed(1)} kilometers away`
        : `${Math.round(distance)} meters away`;
    parts.push(distanceText);
  }

  return parts.join(', ');
}

/**
 * Creates an accessible label for a favorite/bookmark button
 */
export function getFavoriteButtonLabel(params: { placeName: string; isFavorite: boolean }): string {
  const { placeName, isFavorite } = params;

  if (isFavorite) {
    return `Remove ${placeName} from favorites`;
  }
  return `Add ${placeName} to favorites`;
}

/**
 * Creates an accessible hint for a favorite button
 */
export function getFavoriteButtonHint(isFavorite: boolean): string {
  return isFavorite ? 'Double tap to remove from favorites' : 'Double tap to add to favorites';
}

/**
 * Creates an accessible label for a place detail sheet
 */
export function getPlaceDetailLabel(place: NormalizedPlace | PlaceWithDistance): string {
  const parts: string[] = [`${place.name} details`];

  if (place.category) {
    parts.push(`Category: ${place.category}`);
  }

  if (place.address) {
    parts.push(`Location: ${place.address}`);
  }

  return parts.join(', ');
}

// ============================================
// Group Buy accessibility
// ============================================

/**
 * Creates an accessible label for a group buy button
 */
export function getGroupBuyLabel(params: {
  currentCount: number;
  maxCount: number;
  discountRate?: number;
  isFull?: boolean;
}): string {
  const { currentCount, maxCount, discountRate, isFull } = params;

  if (isFull) {
    return `Group buy full, ${currentCount} of ${maxCount} people joined`;
  }

  const parts: string[] = [`Group buy`, `${currentCount} of ${maxCount} people joined`];

  if (discountRate) {
    parts.push(`${discountRate}% discount`);
  }

  return parts.join(', ');
}

/**
 * Creates an accessible hint for a group buy button
 */
export function getGroupBuyHint(isFull: boolean): string {
  return isFull ? 'Group buy is full' : 'Double tap to join group buy';
}

// ============================================
// Video Player accessibility
// ============================================

/**
 * Creates an accessible label for a video player
 */
export function getVideoPlayerLabel(params: {
  title?: string;
  duration?: number;
  isPlaying?: boolean;
}): string {
  const { title, duration, isPlaying } = params;

  const parts: string[] = [];

  if (title) {
    parts.push(title);
  } else {
    parts.push('Video');
  }

  if (duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    parts.push(`Duration ${minutes} minutes ${seconds} seconds`);
  }

  if (isPlaying !== undefined) {
    parts.push(isPlaying ? 'Playing' : 'Paused');
  }

  return parts.join(', ');
}

/**
 * Creates an accessible label for video controls
 */
export function getVideoControlLabel(
  control: 'play' | 'pause' | 'mute' | 'unmute' | 'close'
): string {
  const labels: Record<string, string> = {
    play: 'Play video',
    pause: 'Pause video',
    mute: 'Mute video',
    unmute: 'Unmute video',
    close: 'Close video player',
  };

  return labels[control] || control;
}

// ============================================
// Filter and Search accessibility
// ============================================

/**
 * Creates an accessible label for a filter button
 */
export function getFilterButtonLabel(params: {
  category: FilterCategory | string;
  isActive: boolean;
  count?: number;
}): string {
  const { category, isActive, count } = params;

  const categoryNames: Record<FilterCategory, string> = {
    outdoor: 'Outdoor',
    indoor: 'Indoor',
    public: 'Public facilities',
    restaurant: 'Restaurants',
  };

  const name = categoryNames[category as FilterCategory] || category;
  const parts: string[] = [name];

  if (isActive) {
    parts.push('selected');
  }

  if (count !== undefined && count > 0) {
    parts.push(`${count} places`);
  }

  return parts.join(', ');
}

/**
 * Creates an accessible label for search results
 */
export function getSearchResultsLabel(count: number, query?: string): string {
  if (count === 0) {
    return query ? `No results found for ${query}` : 'No results found';
  }

  if (count === 1) {
    return query ? `1 result found for ${query}` : '1 result found';
  }

  return query ? `${count} results found for ${query}` : `${count} results found`;
}

// ============================================
// Rating accessibility
// ============================================

/**
 * Creates an accessible label for a rating display
 */
export function getRatingLabel(
  rating: number,
  maxRating: number = 5,
  reviewCount?: number
): string {
  const parts: string[] = [`Rating ${rating.toFixed(1)} out of ${maxRating} stars`];

  if (reviewCount !== undefined) {
    parts.push(`${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`);
  }

  return parts.join(', ');
}

// ============================================
// Amenities accessibility
// ============================================

/**
 * Creates an accessible label for amenities list
 */
export function getAmenitiesLabel(amenities: Amenities): string {
  const amenityNames: Record<keyof Amenities, string> = {
    strollerAccess: 'Stroller accessible',
    nursingRoom: 'Nursing room available',
    diaperChangingStation: 'Diaper changing station available',
    parking: 'Parking available',
    restaurant: 'Restaurant on site',
    restroom: 'Restroom available',
    wheelchairAccess: 'Wheelchair accessible',
    babyChair: 'Baby chair available',
    nursingCushion: 'Nursing cushion available',
    indoor: 'Indoor facility',
    outdoor: 'Outdoor facility',
  };

  const available: string[] = [];

  Object.entries(amenities).forEach(([key, value]) => {
    if (value === true) {
      const name = amenityNames[key as keyof Amenities];
      if (name) {
        available.push(name);
      }
    }
  });

  if (available.length === 0) {
    return 'No amenities information available';
  }

  if (available.length === 1) {
    return `Amenity: ${available[0]}`;
  }

  return `Amenities: ${available.join(', ')}`;
}

/**
 * Creates an accessible label for a single amenity icon
 */
export function getAmenityIconLabel(amenityKey: keyof Amenities): string {
  const labels: Record<keyof Amenities, string> = {
    strollerAccess: 'Stroller accessible',
    nursingRoom: 'Nursing room',
    diaperChangingStation: 'Diaper changing station',
    parking: 'Parking',
    restaurant: 'Restaurant',
    restroom: 'Restroom',
    wheelchairAccess: 'Wheelchair accessible',
    babyChair: 'Baby chair',
    nursingCushion: 'Nursing cushion',
    indoor: 'Indoor',
    outdoor: 'Outdoor',
  };

  return labels[amenityKey] || amenityKey;
}

// ============================================
// Age Group accessibility
// ============================================

/**
 * Creates an accessible label for age group tags
 */
export function getAgeGroupLabel(ageGroups: AgeGroup[]): string {
  const ageGroupNames: Record<AgeGroup, string> = {
    infant: 'Infants 0-2 years',
    toddler: 'Toddlers 3-5 years',
    child: 'Children 6-9 years',
    elementary: 'Elementary 10-12 years',
  };

  if (ageGroups.length === 0) {
    return 'All ages';
  }

  const names = ageGroups.map((age) => ageGroupNames[age]);
  return `Suitable for: ${names.join(', ')}`;
}

// ============================================
// Action Button accessibility
// ============================================

/**
 * Creates an accessible label for action buttons (directions, call, share, etc.)
 */
export function getActionButtonLabel(
  action: 'directions' | 'call' | 'share' | 'website',
  placeName?: string
): string {
  const labels: Record<string, string> = {
    directions: placeName ? `Get directions to ${placeName}` : 'Get directions',
    call: placeName ? `Call ${placeName}` : 'Make a phone call',
    share: placeName ? `Share ${placeName}` : 'Share this place',
    website: placeName ? `Visit ${placeName} website` : 'Visit website',
  };

  return labels[action] || action;
}

/**
 * Creates an accessible hint for action buttons
 */
export function getActionButtonHint(action: 'directions' | 'call' | 'share' | 'website'): string {
  const hints: Record<string, string> = {
    directions: 'Opens maps app with directions',
    call: 'Opens phone app to make a call',
    share: 'Opens share menu',
    website: 'Opens website in browser',
  };

  return hints[action] || 'Double tap to activate';
}

// ============================================
// Loading and Error accessibility
// ============================================

/**
 * Creates an accessible announcement for loading states
 */
export function formatLoadingAnnouncement(message: string = 'Loading'): string {
  return `${message}. Please wait.`;
}

/**
 * Creates an accessible announcement for error states
 */
export function formatErrorAnnouncement(error: string): string {
  return `Error: ${error}`;
}

/**
 * Creates an accessible announcement for success states
 */
export function formatSuccessAnnouncement(message: string): string {
  return `Success: ${message}`;
}

// ============================================
// General Announcement Formatting
// ============================================

/**
 * Formats a general announcement for screen readers
 * Adds appropriate pauses and emphasis
 */
export function formatAnnouncement(
  type: 'loading' | 'error' | 'success' | 'info',
  message: string
): string {
  switch (type) {
    case 'loading':
      return formatLoadingAnnouncement(message);
    case 'error':
      return formatErrorAnnouncement(message);
    case 'success':
      return formatSuccessAnnouncement(message);
    case 'info':
      return message;
    default:
      return message;
  }
}

/**
 * Creates an accessible label for tab navigation
 * Supports both tab names and descriptions
 */
export function getTabLabel(tabName: string, description?: string): string {
  if (description) {
    return `${tabName} tab, ${description}`;
  }
  return `${tabName} tab`;
}

/**
 * Creates an accessible hint for tab navigation
 */
export function getTabHint(tab: string): string {
  return `Navigate to ${tab} screen`;
}
