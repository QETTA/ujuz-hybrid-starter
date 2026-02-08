/**
 * Hooks Tests - useNetworkStatus
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';

// Import after mocking
import { useNetworkStatus } from '../useNetworkStatus';

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
  fetch: jest.fn(),
}));

const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

describe('useNetworkStatus', () => {
  let unsubscribeMock: jest.Mock;
  let listenerCallback: ((state: any) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    unsubscribeMock = jest.fn();
    listenerCallback = null;

    // Store the callback when addEventListener is called
    mockNetInfo.addEventListener.mockImplementation((callback) => {
      listenerCallback = callback;
      return unsubscribeMock;
    });

    // Default fetch response
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    } as any);
  });

  it('should return initial connected state', async () => {
    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should subscribe to network changes', () => {
    renderHook(() => useNetworkStatus());

    expect(mockNetInfo.addEventListener).toHaveBeenCalled();
  });

  it('should unsubscribe on unmount', () => {
    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it('should update when network state changes', async () => {
    const { result } = renderHook(() => useNetworkStatus());

    // Initial state
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    // Simulate network disconnection
    await act(async () => {
      if (listenerCallback) {
        listenerCallback({
          isConnected: false,
          isInternetReachable: false,
          type: 'none',
        });
      }
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('should detect WiFi connection type', async () => {
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    } as any);

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.type).toBe('wifi');
    });
  });

  it('should detect cellular connection type', async () => {
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: 'cellular',
    } as any);

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.type).toBe('cellular');
    });
  });

  it('should handle internet unreachable state', async () => {
    mockNetInfo.fetch.mockResolvedValue({
      isConnected: true,
      isInternetReachable: false,
      type: 'wifi',
    } as any);

    const { result } = renderHook(() => useNetworkStatus());

    await waitFor(() => {
      expect(result.current.isInternetReachable).toBe(false);
    });
  });
});
