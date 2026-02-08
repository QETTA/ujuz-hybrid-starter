/**
 * useNetworkStatus - Network connectivity hook
 *
 * Monitors network status and provides connection state
 */

import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string | null;
  details: NetInfoState | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
    details: null,
  });

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then((state) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        details: state,
      });
    });

    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        details: state,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkStatus;
}

// Hook for simple connection check
export function useIsConnected(): boolean {
  const { isConnected } = useNetworkStatus();
  return isConnected;
}

// Hook for internet reachability check
export function useIsInternetReachable(): boolean {
  const { isInternetReachable } = useNetworkStatus();
  return isInternetReachable;
}
