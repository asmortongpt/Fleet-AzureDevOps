import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useExport } from '../useExport';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('useExport', () => {
  let createElementSpy: any;
  let clickSpy: any;
  let createObjectURLSpy: any;
  let revokeObjectURLSpy: any;

  beforeEach(() => {
    clickSpy = vi.fn();
    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      click: clickSpy,
      href: '',
      download: ''
    } as any);

    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportToJSON', () => {
    it('should export data as JSON file', () => {
      const { result } = renderHook(() => useExport());
      const testData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];

      act(() => {
        result.current.exportToJSON(testData, 'test-export');
      });

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should format filename with current date', () => {
      const { result } = renderHook(() => useExport());
      const testData = [{ id: 1 }];
      const mockDate = '2024-01-15';

      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:30:00.000Z');

      let downloadAttr = '';
      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
        click: clickSpy,
        set download(value: string) {
          downloadAttr = value;
        },
        get download() {
          return downloadAttr;
        },
        href: ''
      } as any);

      act(() => {
        result.current.exportToJSON(testData, 'vehicles');
      });

      expect(downloadAttr).toBe('vehicles-2024-01-15.json');
    });

    it('should create Blob with correct JSON data', () => {
      const { result } = renderHook(() => useExport());
      const testData = [
        { id: 1, name: 'Test' }
      ];

      const blobSpy = vi.spyOn(global, 'Blob');

      act(() => {
        result.current.exportToJSON(testData, 'test');
      });

      expect(blobSpy).toHaveBeenCalledWith(
        [JSON.stringify(testData, null, 2)],
        { type: 'application/json' }
      );
    });

    it('should handle empty array', () => {
      const { result } = renderHook(() => useExport());

      act(() => {
        result.current.exportToJSON([], 'empty');
      });

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });

    it('should handle complex nested objects', () => {
      const { result } = renderHook(() => useExport());
      const complexData = [
        {
          id: 1,
          nested: { value: 'test', array: [1, 2, 3] },
          date: '2024-01-01'
        }
      ];

      act(() => {
        result.current.exportToJSON(complexData, 'complex');
      });

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('exportToCSV', () => {
    it('should export data as CSV file', () => {
      const { result } = renderHook(() => useExport());
      const testData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ];

      act(() => {
        result.current.exportToCSV(testData, 'test-export');
      });

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    });

    it('should show error toast for empty data', async () => {
      const { toast } = await import('sonner');
      const { result } = renderHook(() => useExport());

      act(() => {
        result.current.exportToCSV([], 'empty');
      });

      expect(toast.error).toHaveBeenCalledWith('No data to export');
      expect(createObjectURLSpy).not.toHaveBeenCalled();
    });

    it('should create CSV with correct headers', () => {
      const { result } = renderHook(() => useExport());
      const testData = [
        { id: 1, name: 'Test', status: 'active' }
      ];

      const blobSpy = vi.spyOn(global, 'Blob');

      act(() => {
        result.current.exportToCSV(testData, 'test');
      });

      const callArg = blobSpy.mock.calls[0][0][0];
      expect(callArg).toContain('id,name,status');
    });

    it('should escape values with quotes', () => {
      const { result } = renderHook(() => useExport());
      const testData = [
        { id: 1, name: 'Test, Name', description: 'A "quoted" value' }
      ];

      const blobSpy = vi.spyOn(global, 'Blob');

      act(() => {
        result.current.exportToCSV(testData, 'test');
      });

      const callArg = blobSpy.mock.calls[0][0][0];
      expect(callArg).toContain('"Test, Name"');
      expect(callArg).toContain('"A \\"quoted\\" value"');
    });

    it('should handle null and undefined values', () => {
      const { result } = renderHook(() => useExport());
      const testData = [
        { id: 1, name: null, status: undefined, value: '' }
      ];

      const blobSpy = vi.spyOn(global, 'Blob');

      act(() => {
        result.current.exportToCSV(testData, 'test');
      });

      const callArg = blobSpy.mock.calls[0][0][0];
      expect(callArg).toContain('1,"",""');
    });

    it('should format filename with current date for CSV', () => {
      const { result } = renderHook(() => useExport());
      const testData = [{ id: 1 }];

      vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-02-20T15:45:00.000Z');

      let downloadAttr = '';
      createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue({
        click: clickSpy,
        set download(value: string) {
          downloadAttr = value;
        },
        get download() {
          return downloadAttr;
        },
        href: ''
      } as any);

      act(() => {
        result.current.exportToCSV(testData, 'drivers');
      });

      expect(downloadAttr).toBe('drivers-2024-02-20.csv');
    });

    it('should handle multiple rows with consistent columns', () => {
      const { result } = renderHook(() => useExport());
      const testData = [
        { id: 1, name: 'A', value: 100 },
        { id: 2, name: 'B', value: 200 },
        { id: 3, name: 'C', value: 300 }
      ];

      const blobSpy = vi.spyOn(global, 'Blob');

      act(() => {
        result.current.exportToCSV(testData, 'test');
      });

      const callArg = blobSpy.mock.calls[0][0][0];
      const lines = callArg.split('\n');

      expect(lines).toHaveLength(4); // header + 3 rows
      expect(lines[0]).toBe('id,name,value');
      expect(lines[1]).toContain('1,"A",100');
      expect(lines[2]).toContain('2,"B",200');
      expect(lines[3]).toContain('3,"C",300');
    });

    it('should create Blob with correct CSV content type', () => {
      const { result } = renderHook(() => useExport());
      const testData = [{ id: 1 }];

      const blobSpy = vi.spyOn(global, 'Blob');

      act(() => {
        result.current.exportToCSV(testData, 'test');
      });

      expect(blobSpy).toHaveBeenCalledWith(
        expect.any(Array),
        { type: 'text/csv' }
      );
    });

    it('should handle objects with different property orders', () => {
      const { result } = renderHook(() => useExport());
      const testData = [
        { name: 'A', id: 1, status: 'active' },
        { id: 2, status: 'inactive', name: 'B' }
      ];

      const blobSpy = vi.spyOn(global, 'Blob');

      act(() => {
        result.current.exportToCSV(testData, 'test');
      });

      // Should use first object's property order
      const callArg = blobSpy.mock.calls[0][0][0];
      expect(callArg).toContain('name,id,status');
    });
  });

  describe('callback stability', () => {
    it('should maintain stable callback references', () => {
      const { result, rerender } = renderHook(() => useExport());

      const firstExportJSON = result.current.exportToJSON;
      const firstExportCSV = result.current.exportToCSV;

      rerender();

      expect(result.current.exportToJSON).toBe(firstExportJSON);
      expect(result.current.exportToCSV).toBe(firstExportCSV);
    });
  });
});
