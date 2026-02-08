/**
 * TamagUiBadge - Tamagui 기반 Badge 컴포넌트
 *
 * Trust indicators, status badges, social proof
 * 기존 Badge와 동일한 Props 인터페이스 유지
 *
 * 2026 Design System: 테마 토큰 사용으로 Light/Dark 모드 자동 지원
 */

import { styled, XStack, Text, GetProps } from 'tamagui';

// Styled Badge Container - 테마 토큰 사용
const StyledBadge = styled(XStack, {
  name: 'UJUzBadge',
  alignItems: 'center',
  borderRadius: '$1',
  alignSelf: 'flex-start',
  gap: '$1',

  variants: {
    variant: {
      verified: {
        backgroundColor: '$badgeVerifiedBg',
      },
      popular: {
        backgroundColor: '$badgePopularBg',
      },
      new: {
        backgroundColor: '$badgeNewBg',
      },
      hot: {
        backgroundColor: '$badgeHotBg',
      },
      sale: {
        backgroundColor: '$badgeSaleBg',
      },
      recommended: {
        backgroundColor: '$badgeRecommendedBg',
      },
    },

    size: {
      sm: {
        paddingHorizontal: '$1',
        paddingVertical: 2,
      },
      md: {
        paddingHorizontal: '$2',
        paddingVertical: '$1',
      },
      lg: {
        paddingHorizontal: '$3',
        paddingVertical: '$1',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'verified',
    size: 'sm',
  },
});

// Styled Badge Text - 테마 토큰 사용
const BadgeLabel = styled(Text, {
  name: 'UJUzBadgeLabel',
  fontWeight: '600',
  lineHeight: 16,

  variants: {
    variant: {
      verified: { color: '$badgeVerified' },
      popular: { color: '$badgePopular' },
      new: { color: '$badgeNew' },
      hot: { color: '$badgeHot' },
      sale: { color: '$badgeSale' },
      recommended: { color: '$badgeRecommended' },
    },

    size: {
      sm: { fontSize: 10 },
      md: { fontSize: 12 },
      lg: { fontSize: 14 },
    },
  } as const,

  defaultVariants: {
    variant: 'verified',
    size: 'sm',
  },
});

// Styled Icon Text
const BadgeIcon = styled(Text, {
  name: 'UJUzBadgeIcon',
  lineHeight: 16,

  variants: {
    size: {
      sm: { fontSize: 12 },
      md: { fontSize: 14 },
      lg: { fontSize: 16 },
    },
  } as const,

  defaultVariants: {
    size: 'sm',
  },
});

// Props types
export type BadgeVariant = 'verified' | 'popular' | 'new' | 'hot' | 'sale' | 'recommended';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface TamagUiBadgeProps {
  /** Badge variant */
  variant?: BadgeVariant;
  /** Badge size */
  size?: BadgeSize;
  /** Icon (emoji or text) */
  icon?: string;
  /** Label text */
  label: string;
  /** Test ID */
  testID?: string;
}

export type TamaguiBadgeProps = TamagUiBadgeProps;

export default function TamagUiBadge({
  variant = 'verified',
  size = 'sm',
  icon,
  label,
  testID,
}: TamagUiBadgeProps) {
  return (
    <StyledBadge
      variant={variant}
      size={size}
      accessibilityRole="text"
      accessibilityLabel={`${variant} badge: ${label}`}
      accessibilityHint="Status indicator badge"
      testID={testID}
    >
      {icon && <BadgeIcon size={size}>{icon}</BadgeIcon>}
      <BadgeLabel variant={variant} size={size}>
        {label}
      </BadgeLabel>
    </StyledBadge>
  );
}

// Re-export types for convenience
export type { GetProps };
