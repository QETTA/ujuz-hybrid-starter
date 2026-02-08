import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@env';
import NetInfo from '@react-native-community/netinfo';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // ms
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
};

// Custom error types
export class NetworkError extends Error {
  constructor(message: string = 'Network connection error') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class ApiError extends Error {
  statusCode: number;
  requestId?: string;
  body?: any;

  constructor(message: string, statusCode: number, requestId?: string, body?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.requestId = requestId;
    this.body = body;
  }
}

// Retry with exponential backoff
async function retryRequest<T>(
  requestFn: () => Promise<T>,
  config: typeof RETRY_CONFIG = RETRY_CONFIG
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;

      if (error instanceof AxiosError) {
        // Don't retry on client errors (4xx) except specified ones
        if (error.response?.status && !config.retryStatusCodes.includes(error.response.status)) {
          throw error;
        }
      }

      if (attempt < config.maxRetries) {
        const delay = config.retryDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Check network connectivity before request
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new NetworkError('No internet connection');
    }

    // Add request timestamp for timeout tracking
    config.metadata = { startTime: Date.now() };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log response time in dev
    if (__DEV__ && response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(`[API] ${response.config.url} - ${duration}ms`);
    }
    return response;
  },
  (error: AxiosError) => {
    // Transform errors for better handling
    if (error.code === 'ECONNABORTED') {
      throw new TimeoutError();
    }

    if (error.message === 'Network Error' || !error.response) {
      throw new NetworkError();
    }

    if (error.response?.status === 401) {
      // Handle unauthorized - could trigger auth refresh
    }

    if (error.response?.status && error.response.status >= 500) {
      // Extract request id and API-provided message when available
      const headers = (error.response.headers || {}) as Record<string, any>;
      const requestId =
        headers['x-request-id'] || headers['x-correlation-id'] || headers['request-id'];

      // Log detailed server error for debugging (DEV only)
      if (__DEV__) {
        console.error('[API] Server Error:', {
          status: error.response.status,
          requestId,
          body: error.response.data,
        });
      }

      // Use generic message for users (never expose internal error details)
      const message = 'Server error. Please try again.';
      throw new ApiError(message, error.response.status, requestId, error.response.data);
    }

    return Promise.reject(error);
  }
);

// Export enhanced request methods with retry
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    retryRequest(() => apiClient.get<T>(url, config).then((r) => r.data)),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    retryRequest(() => apiClient.post<T>(url, data, config).then((r) => r.data)),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    retryRequest(() => apiClient.put<T>(url, data, config).then((r) => r.data)),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    retryRequest(() => apiClient.delete<T>(url, config).then((r) => r.data)),
};

export default apiClient;

// Type augmentation for axios config
declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}
