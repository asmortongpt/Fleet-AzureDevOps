import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAsync } from '../useAsync';

/**
 * Test Suite: useAsync Hook
 *
 * Tests comprehensive async state management, loading states, error handling,
 * manual execution, reset functionality, and lifecycle integration.
 */

describe('useAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      const mockFn = vi.fn(async () => 'data');
      const { result } = renderHook(() => useAsync(mockFn, false));

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.execute).toBe('function');
      expect(typeof result.current.reset).toBe('function');
    });

    it('should execute immediately when immediate=true', async () => {
      const mockFn = vi.fn(async () => 'fetched-data');
      const { result } = renderHook(() => useAsync(mockFn, true));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe('fetched-data');
      expect(result.current.error).toBeNull();
    });

    it('should not execute immediately when immediate=false', () => {
      const mockFn = vi.fn(async () => 'data');
      const { result } = renderHook(() => useAsync(mockFn, false));

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should default to immediate=true', async () => {
      const mockFn = vi.fn(async () => 'data');
      const { result } = renderHook(() => useAsync(mockFn));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe('data');
    });
  });

  describe('Successful Execution', () => {
    it('should update data on successful execution', async () => {
      const mockFn = vi.fn(async () => 'success-data');
      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('success-data');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle various data types', async () => {
      const testData = {
        string: 'test',
        number: 42,
        array: [1, 2, 3],
        object: { nested: true },
      };

      const mockFn = vi.fn(async () => testData);
      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toEqual(testData);
    });

    it('should reset loading state after execution', async () => {
      const mockFn = vi.fn(async () => 'data');
      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.loading).toBe(false);
    });

    it('should clear error on successful execution', async () => {
      const mockFn = vi.fn(async () => 'data');
      const { result } = renderHook(() => useAsync(mockFn, false));

      expect(result.current.error).toBeNull();

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBeNull();
    });

    it('should handle async functions with delays', async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      const mockFn = vi.fn(async () => {
        await delay(50);
        return 'delayed-data';
      });

      const { result } = renderHook(() => useAsync(mockFn, false));

      expect(result.current.loading).toBe(false);

      await act(async () => {
        const promise = result.current.execute();
        await promise;
      });

      expect(result.current.data).toBe('delayed-data');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should capture Error instances', async () => {
      const error = new Error('Test error message');
      const mockFn = vi.fn(async () => {
        throw error;
      });

      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toEqual(error);
      expect(result.current.error?.message).toBe('Test error message');
      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should convert non-Error objects to Error', async () => {
      const mockFn = vi.fn(async () => {
        throw 'string error';
      });

      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('string error');
    });

    it('should convert null/undefined errors to Error', async () => {
      const mockFn = vi.fn(async () => {
        throw null;
      });

      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('null');
    });

    it('should set loading to false on error', async () => {
      const mockFn = vi.fn(async () => {
        throw new Error('Failed');
      });

      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.loading).toBe(false);
    });

    it('should clear previous data on error', async () => {
      let callCount = 0;
      const mockFn = vi.fn(async () => {
        callCount++;
        if (callCount === 1) return 'success';
        throw new Error('Failed');
      });

      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('success');

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should handle network errors', async () => {
      const mockFn = vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      });

      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toContain('Failed to fetch');
    });

    it('should handle timeout errors', async () => {
      const mockFn = vi.fn(async () => {
        throw new Error('Request timeout');
      });

      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error?.message).toBe('Request timeout');
    });
  });

  describe('Manual Execution', () => {
    it('should call execute function', async () => {
      const mockFn = vi.fn(async () => 'data');
      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should allow multiple manual executions', async () => {
      const mockFn = vi.fn(async () => 'data');
      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
        await result.current.execute();
        await result.current.execute();
      });

      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should reset state before each execution', async () => {
      let callCount = 0;
      const mockFn = vi.fn(async () => {
        callCount++;
        if (callCount === 2) throw new Error('Error');
        return 'data';
      });

      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('data');
      expect(result.current.error).toBeNull();

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('should handle sequential executions', async () => {
      const results: string[] = [];
      const mockFn = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        const result = `result-${results.length + 1}`;
        results.push(result);
        return result;
      });

      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('result-1');

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('result-2');
    });

    it('should handle concurrent executions (last one wins)', async () => {
      const mockFn = vi.fn(async () => 'data');
      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        Promise.all([
          result.current.execute(),
          result.current.execute(),
          result.current.execute(),
        ]);
      });

      expect(mockFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial state', async () => {
      const mockFn = vi.fn(async () => 'data');
      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('data');

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should reset error state', async () => {
      const mockFn = vi.fn(async () => {
        throw new Error('Test error');
      });

      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.error).toBeInstanceOf(Error);

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });

    it('should reset loading state', async () => {
      const mockFn = vi.fn(async () => {
        return new Promise(() => {}); // never resolves
      });

      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        result.current.execute();
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.loading).toBe(false);
    });

    it('should allow re-execution after reset', async () => {
      const mockFn = vi.fn(async () => 'new-data');
      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('new-data');

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('new-data');
    });
  });

  describe('Lifecycle Integration', () => {
    it('should clean up on unmount', () => {
      const mockFn = vi.fn(async () => 'data');
      const { unmount } = renderHook(() => useAsync(mockFn, true));

      expect(() => unmount()).not.toThrow();
    });

    it('should handle dependency changes', async () => {
      let data = 'data-1';
      const mockFn = vi.fn(async () => data);

      const { result, rerender } = renderHook(
        ({ fn, immediate }: { fn: () => Promise<string>; immediate: boolean }) =>
          useAsync(fn, immediate),
        { initialProps: { fn: mockFn, immediate: true } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBe('data-1');

      // Change the async function
      data = 'data-2';
      const mockFn2 = vi.fn(async () => data);

      rerender({ fn: mockFn2, immediate: true });

      await waitFor(() => {
        expect(result.current.data).toBe('data-2');
      });
    });

    it('should handle immediate flag changes', async () => {
      const mockFn = vi.fn(async () => 'data');
      const { result, rerender } = renderHook(
        ({ immediate }: { immediate: boolean }) => useAsync(mockFn, immediate),
        { initialProps: { immediate: false } }
      );

      expect(result.current.loading).toBe(false);

      rerender({ immediate: true });

      await waitFor(() => {
        expect(result.current.data).toBe('data');
      });
    });
  });

  describe('State Transitions', () => {
    it('should transition through idle -> loading -> success', async () => {
      const mockFn = vi.fn(async () => 'data');
      const { result } = renderHook(() => useAsync(mockFn, false));

      expect(result.current.loading).toBe(false);

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBe('data');
    });

    it('should transition through idle -> loading -> error', async () => {
      const mockFn = vi.fn(async () => {
        throw new Error('Test');
      });

      const { result } = renderHook(() => useAsync(mockFn, false));

      expect(result.current.loading).toBe(false);

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response', async () => {
      const mockFn = vi.fn(async () => '');
      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe('');
      expect(result.current.error).toBeNull();
    });

    it('should handle null response', async () => {
      const mockFn = vi.fn(async () => null);
      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should handle undefined response', async () => {
      const mockFn = vi.fn(async () => undefined);
      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeNull();
    });

    it('should handle false response', async () => {
      const mockFn = vi.fn(async () => false);
      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle 0 response', async () => {
      const mockFn = vi.fn(async () => 0);
      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.data).toBe(0);
      expect(result.current.error).toBeNull();
    });

    it('should handle very large objects', async () => {
      const largeData = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [
          `key_${i}`,
          `value_${i}`,
        ])
      );

      const mockFn = vi.fn(async () => largeData);
      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await result.current.execute();
      });

      expect(Object.keys(result.current.data || {}).length).toBe(1000);
    });

    it('should handle rapid successive calls', async () => {
      const mockFn = vi.fn(async () => 'data');
      const { result } = renderHook(() => useAsync(mockFn, false));

      await act(async () => {
        await Promise.all([
          result.current.execute(),
          result.current.execute(),
          result.current.execute(),
          result.current.execute(),
          result.current.execute(),
        ]);
      });

      expect(result.current.data).toBe('data');
      expect(mockFn).toHaveBeenCalledTimes(5);
    });
  });
});
