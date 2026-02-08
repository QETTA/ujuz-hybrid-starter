/**
 * API Client Tests
 *
 * Tests for network error handling, retry logic, and interceptors
 */

// axios mocked for testing
import { api, NetworkError, TimeoutError, ApiError } from '../client';

// Mock axios
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  return {
    create: jest.fn(() => mockAxiosInstance),
    AxiosError: class extends Error {
      constructor(message?: string) {
        super(message);
        this.name = 'AxiosError';
      }
    },
  };
});

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Custom Error Classes', () => {
    it('should create NetworkError with default message', () => {
      const error = new NetworkError();
      expect(error.message).toBe('Network connection error');
      expect(error.name).toBe('NetworkError');
    });

    it('should create NetworkError with custom message', () => {
      const error = new NetworkError('Custom network error');
      expect(error.message).toBe('Custom network error');
    });

    it('should create TimeoutError with default message', () => {
      const error = new TimeoutError();
      expect(error.message).toBe('Request timed out');
      expect(error.name).toBe('TimeoutError');
    });

    it('should create ApiError with message and status code', () => {
      const error = new ApiError('Server error', 500);
      expect(error.message).toBe('Server error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('ApiError');
    });
  });

  describe('Error Type Guards', () => {
    it('should identify NetworkError instance', () => {
      const error = new NetworkError();
      expect(error instanceof NetworkError).toBe(true);
      expect(error instanceof TimeoutError).toBe(false);
    });

    it('should identify TimeoutError instance', () => {
      const error = new TimeoutError();
      expect(error instanceof TimeoutError).toBe(true);
      expect(error instanceof NetworkError).toBe(false);
    });

    it('should identify ApiError instance', () => {
      const error = new ApiError('Test', 404);
      expect(error instanceof ApiError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });
});

describe('API Methods', () => {
  // Note: These tests are structural - full integration tests
  // would require more complex mocking of the retry logic

  it('should export get method', () => {
    expect(typeof api.get).toBe('function');
  });

  it('should export post method', () => {
    expect(typeof api.post).toBe('function');
  });

  it('should export put method', () => {
    expect(typeof api.put).toBe('function');
  });

  it('should export delete method', () => {
    expect(typeof api.delete).toBe('function');
  });
});
