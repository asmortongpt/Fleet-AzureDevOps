/**
 * Tests for export-helpers utilities
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Response } from 'express';

import {
  exportJSON,
  exportCSV,
  parseExportFormat,
  ExportFormat,
  CommonExportColumns,
} from '../../utils/export-helpers';

describe('export-helpers', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
  });

  describe('exportJSON', () => {
    it('should export data as JSON', () => {
      const data = [
        { id: 1, name: 'Test' },
        { id: 2, name: 'Test 2' },
      ];

      exportJSON(mockResponse as Response, data, 'test-export');

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="test-export.json"'
      );
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle empty data', () => {
      exportJSON(mockResponse as Response, [], 'empty-export');
      expect(mockResponse.send).toHaveBeenCalledWith('[]');
    });
  });

  describe('exportCSV', () => {
    it('should export data as CSV with headers', () => {
      const data = [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', email: 'jane@example.com' },
      ];

      exportCSV(mockResponse as Response, data, {
        filename: 'test-export',
        includeHeaders: true,
      });

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/csv'
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="test-export.csv"'
      );
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle values with commas', () => {
      const data = [{ description: 'Value, with, commas' }];

      exportCSV(mockResponse as Response, data, {
        filename: 'test',
        includeHeaders: false,
      });

      const csvContent = (mockResponse.send as jest.Mock).mock.calls[0][0];
      expect(csvContent).toContain('"Value, with, commas"');
    });

    it('should handle values with quotes', () => {
      const data = [{ description: 'Value with "quotes"' }];

      exportCSV(mockResponse as Response, data, {
        filename: 'test',
        includeHeaders: false,
      });

      const csvContent = (mockResponse.send as jest.Mock).mock.calls[0][0];
      expect(csvContent).toContain('""'); // Escaped quotes
    });

    it('should apply column formatting', () => {
      const data = [{ created_at: '2024-01-01T00:00:00Z', amount: 100.5 }];

      exportCSV(mockResponse as Response, data, {
        filename: 'test',
        columns: [
          {
            key: 'created_at',
            label: 'Created',
            format: (val) => new Date(val).toLocaleDateString(),
          },
          {
            key: 'amount',
            label: 'Amount',
            format: (val) => `$${val.toFixed(2)}`,
          },
        ],
      });

      const csvContent = (mockResponse.send as jest.Mock).mock.calls[0][0];
      expect(csvContent).toContain('Created');
      expect(csvContent).toContain('Amount');
    });
  });

  describe('parseExportFormat', () => {
    it('should parse JSON format', () => {
      expect(parseExportFormat('json')).toBe(ExportFormat.JSON);
      expect(parseExportFormat('JSON')).toBe(ExportFormat.JSON);
    });

    it('should parse CSV format', () => {
      expect(parseExportFormat('csv')).toBe(ExportFormat.CSV);
      expect(parseExportFormat('CSV')).toBe(ExportFormat.CSV);
    });

    it('should parse Excel format', () => {
      expect(parseExportFormat('excel')).toBe(ExportFormat.EXCEL);
      expect(parseExportFormat('xlsx')).toBe(ExportFormat.EXCEL);
      expect(parseExportFormat('XLSX')).toBe(ExportFormat.EXCEL);
    });

    it('should return null for invalid format', () => {
      expect(parseExportFormat('invalid')).toBeNull();
      expect(parseExportFormat('')).toBeNull();
      expect(parseExportFormat(undefined)).toBeNull();
    });
  });

  describe('CommonExportColumns', () => {
    it('should have vehicle columns', () => {
      expect(CommonExportColumns.vehicle).toBeDefined();
      expect(CommonExportColumns.vehicle.length).toBeGreaterThan(0);
      expect(
        CommonExportColumns.vehicle.find((c) => c.key === 'vin')
      ).toBeDefined();
    });

    it('should have driver columns', () => {
      expect(CommonExportColumns.driver).toBeDefined();
      expect(CommonExportColumns.driver.length).toBeGreaterThan(0);
      expect(
        CommonExportColumns.driver.find((c) => c.key === 'license_number')
      ).toBeDefined();
    });

    it('should have work order columns', () => {
      expect(CommonExportColumns.workOrder).toBeDefined();
      expect(CommonExportColumns.workOrder.length).toBeGreaterThan(0);
    });

    it('should have maintenance columns', () => {
      expect(CommonExportColumns.maintenance).toBeDefined();
      expect(CommonExportColumns.maintenance.length).toBeGreaterThan(0);
    });

    it('should have format functions for date fields', () => {
      const vehicleCreatedCol = CommonExportColumns.vehicle.find(
        (c) => c.key === 'created_at'
      );
      expect(vehicleCreatedCol?.format).toBeDefined();
    });
  });
});
