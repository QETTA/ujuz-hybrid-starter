import { useEffect, useState } from 'react';
import { LocationService, Coordinates } from '@/app/services/location/LocationService';

interface UseLocationResult {
  location: Coordinates | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Hook to get and track user's location
 */
export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const coords = await LocationService.getCurrentLocation();
      if (coords) {
        setLocation(coords);
      } else {
        setError('Failed to get location');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return {
    location,
    error,
    loading,
    refetch: fetchLocation,
  };
}
