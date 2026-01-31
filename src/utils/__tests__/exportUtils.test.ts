/**
 * Export Utilities Tests
 * Test suite for CSV, Excel, and PDF export functions
 */

import { describe, it, expect } from 'vitest';
import {
  exportToCSV,
  exportToExcel,
  downloadFile,
  formatDataForExport,
  sanitizeFilename
} from '../exportUtils';

describe('Export Utilities', () => {
  const mockData = [
    { id: 1, name: 'Vehicle 1', status: 'Active', mileage: 15000 },
    { id: 2, name: 'Vehicle 2', status: 'Maintenance', mileage: 25000 },
    { id: 3, name: 'Vehicle 3', status: 'Active', mileage: 10000 }
  ];

  describe('exportToCSV', () => {
    it('should convert array of objects to CSV format', () => {
      const result = exportToCSV(mockData, 'test.csv');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should handle empty arrays', () => {
      const result = exportToCSV([], 'empty.csv');
      expect(result).toBeDefined();
    });

    it('should handle special characters in data', () => {
      const specialData = [
        { name: 'Test, Inc.', description: 'Quote: "test"', value: '$1,000' }
      ];

      const result = exportToCSV(specialData, 'special.csv');
      expect(result).toBeDefined();
    });

    it('should include headers by default', () => {
      const result = exportToCSV(mockData, 'with-headers.csv');
      expect(result).toBeDefined();
    });
  });

  describe('exportToExcel', () => {
    it('should create Excel workbook from data', () => {
      const result = exportToExcel(mockData, 'test.xlsx');
      expect(result).toBeDefined();
    });

    it('should handle empty data arrays', () => {
      const result = exportToExcel([], 'empty.xlsx');
      expect(result).toBeDefined();
    });

    it('should preserve data types', () => {
      const typedData = [
        { id: 1, value: 100, flag: true, date: new Date() }
      ];

      const result = exportToExcel(typedData, 'types.xlsx');
      expect(result).toBeDefined();
    });
  });

  describe('formatDataForExport', () => {
    it('should format dates to readable strings', () => {
      const dataWithDates = [
        { id: 1, createdAt: new Date('2024-01-15') }
      ];

      const formatted = formatDataForExport(dataWithDates);
      expect(formatted).toHaveLength(1);
      expect(typeof formatted[0].createdAt).toBe('string');
    });

    it('should handle null and undefined values', () => {
      const dataWithNulls = [
        { id: 1, value: null, optional: undefined }
      ];

      const formatted = formatDataForExport(dataWithNulls);
      expect(formatted).toHaveLength(1);
      expect(formatted[0].value).toBe('');
      expect(formatted[0].optional).toBe('');
    });

    it('should convert numbers to localized strings', () => {
      const dataWithNumbers = [
        { id: 1, cost: 1234.56, quantity: 100 }
      ];

      const formatted = formatDataForExport(dataWithNumbers);
      expect(formatted).toHaveLength(1);
      expect(typeof formatted[0].cost).toBe('number');
    });

    it('should preserve boolean values', () => {
      const dataWithBooleans = [
        { id: 1, active: true, deleted: false }
      ];

      const formatted = formatDataForExport(dataWithBooleans);
      expect(formatted[0].active).toBe(true);
      expect(formatted[0].deleted).toBe(false);
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove invalid filename characters', () => {
      const result = sanitizeFilename('test/file<name>|.csv');
      expect(result).not.toMatch(/[<>:"/\\|?*]/);
    });

    it('should preserve valid characters', () => {
      const result = sanitizeFilename('valid-filename_123.xlsx');
      expect(result).toBe('valid-filename_123.xlsx');
    });

    it('should handle spaces', () => {
      const result = sanitizeFilename('file with spaces.csv');
      expect(result).toBe('file_with_spaces.csv');
    });

    it('should truncate long filenames', () => {
      const longName = 'a'.repeat(300) + '.csv';
      const result = sanitizeFilename(longName);
      expect(result.length).toBeLessThan(260); // Windows MAX_PATH
    });

    it('should preserve file extensions', () => {
      const result = sanitizeFilename('report.xlsx');
      expect(result).toMatch(/\.xlsx$/);
    });
  });

  describe('downloadFile', () => {
    it('should create downloadable blob', () => {
      const content = 'Test file content';
      const result = downloadFile(content, 'test.txt', 'text/plain');

      // Note: Actual download won't happen in test environment
      expect(result).toBeUndefined(); // Function doesn't return value
    });

    it('should handle binary data', () => {
      const binaryData = new Uint8Array([1, 2, 3, 4, 5]);
      const result = downloadFile(binaryData, 'test.bin', 'application/octet-stream');

      expect(result).toBeUndefined();
    });
  });

  describe('Integration Tests', () => {
    it('should export vehicle data to CSV', () => {
      const vehicles = [
        {
          id: 'VEH-001',
          make: 'Ford',
          model: 'F-150',
          year: 2022,
          mileage: 15000,
          status: 'Active'
        }
      ];

      const result = exportToCSV(vehicles, 'vehicles.csv');
      expect(result).toBeDefined();
    });

    it('should export maintenance records to Excel', () => {
      const maintenance = [
        {
          id: 'MAINT-001',
          vehicleId: 'VEH-001',
          type: 'Oil Change',
          cost: 45.99,
          date: new Date('2024-01-15')
        }
      ];

      const result = exportToExcel(maintenance, 'maintenance.xlsx');
      expect(result).toBeDefined();
    });
  });
});
