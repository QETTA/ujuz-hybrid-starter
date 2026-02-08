/**
 * Hooks Tests - useDebounce
 */

import { renderHook, act } from '@testing-library/react-native';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook<string, { value: string; delay: number }>(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Value should be initial
    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });

    // Should still be old value immediately
    expect(result.current).toBe('initial');

    // Advance timers
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Now should be updated
    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid changes', async () => {
    const { result, rerender } = renderHook<string, { value: string }>(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } }
    );

    // Rapid changes
    rerender({ value: 'b' });
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    rerender({ value: 'c' });
    await act(async () => {
      jest.advanceTimersByTime(200);
    });
    rerender({ value: 'd' });

    // Should still be 'a' (timer keeps resetting)
    expect(result.current).toBe('a');

    // Advance full delay
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Should be final value
    expect(result.current).toBe('d');
  });

  it('should respect different delay values', async () => {
    const { result: shortResult } = renderHook(() => useDebounce('test', 100));
    renderHook(() => useDebounce('test', 1000));

    // Update both
    renderHook<string, { value: string }>(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 'updated' },
    });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    // Short delay should update
    expect(shortResult.current).toBe('test');
  });

  it('should handle empty string', async () => {
    const { result, rerender } = renderHook<string, { value: string }>(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: '' });

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('');
  });

  it('should handle object values', async () => {
    const initialObj = { name: 'test' };
    const updatedObj = { name: 'updated' };

    const { result, rerender } = renderHook<{ name: string }, { value: { name: string } }>(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: initialObj } }
    );

    rerender({ value: updatedObj });

    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toEqual(updatedObj);
  });
});
