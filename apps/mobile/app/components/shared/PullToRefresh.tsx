/**
 * PullToRefresh - iOS 26 Style
 *
 * Pull-to-refresh indicator wrapper
 */

import { RefreshControl } from 'react-native';
import { Colors } from '@/app/constants/Colors';

interface PullToRefreshProps {
  refreshing: boolean;
  onRefresh: () => void;
  tintColor?: string;
}

export default function PullToRefresh({
  refreshing,
  onRefresh,
  tintColor = Colors.link,
}: PullToRefreshProps) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={tintColor}
      colors={[tintColor]} // Android
    />
  );
}
