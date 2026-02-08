/**
 * KidsMap Mobile - UI Dimension Constants
 *
 * Centralized dimensions for consistent UI sizing
 */

/**
 * PlaceCard component dimensions
 */
export const PLACE_CARD = {
  IMAGE_HEIGHT: 200,
  CORNER_RADIUS: 16,
  HORIZONTAL_MARGIN: 16,
  VERTICAL_MARGIN: 8,
  BADGE_PADDING: 8,
  INFO_PADDING: 16,
} as const;

/**
 * Map component dimensions
 */
export const MAP = {
  MARKER_SIZE: 40,
  CLUSTER_SIZE: 48,
  SEARCH_BAR_HEIGHT: 44,
  FILTER_PILL_HEIGHT: 36,
} as const;

/**
 * BottomSheet snap points
 */
export const BOTTOM_SHEET = {
  PEEK_PERCENTAGE: 0.25,
  HALF_PERCENTAGE: 0.5,
  FULL_PERCENTAGE: 1.0,
  HANDLE_HEIGHT: 24,
} as const;

/**
 * Shorts/Video player dimensions
 */
export const VIDEO = {
  ACTION_BUTTON_SIZE: 48,
  THUMBNAIL_HEIGHT: 180,
  PROGRESS_BAR_HEIGHT: 4,
} as const;

/**
 * Common component sizes
 */
export const COMPONENT = {
  AVATAR_SM: 32,
  AVATAR_MD: 40,
  AVATAR_LG: 56,
  ICON_SM: 16,
  ICON_MD: 24,
  ICON_LG: 32,
  BUTTON_HEIGHT: 48,
  BUTTON_SM_HEIGHT: 36,
  INPUT_HEIGHT: 44,
} as const;
