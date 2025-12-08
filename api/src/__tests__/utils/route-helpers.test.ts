/**
 * Tests for route-helpers utilities
 */

import { describe, it, expect } from '@jest/globals';

import {
  applyFilters,
  applyPagination,
  generateCacheKey,
  generateItemCacheKey,
} from '../../utils/route-helpers';

describe('route-helpers', () => {
  describe('applyFilters', () => {
    const testData = [
      { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active' },
      { id: 4, name: 'Alice Brown', email: 'alice@example.com', status: 'pending' },
    ];

    it('should return all items when no filters applied', () => {
      const result = applyFilters(testData, {});
      expect(result).toEqual(testData);
      expect(result.length).toBe(4);
    });

    it('should filter by search term', () => {
      const result = applyFilters(testData, {
        search: 'john',
        searchFields: ['name', 'email'],
      });
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('John Doe');
      expect(result[1].name).toBe('Bob Johnson');
    });

    it('should filter by status', () => {
      const result = applyFilters(testData, {
        status: 'active',
      });
      expect(result.length).toBe(2);
      expect(result.every((item) => item.status === 'active')).toBe(true);
    });

    it('should apply both search and status filters', () => {
      const result = applyFilters(testData, {
        search: 'john',
        searchFields: ['name'],
        status: 'active',
      });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should handle case-insensitive search', () => {
      const result = applyFilters(testData, {
        search: 'JANE',
        searchFields: ['name'],
      });
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Jane Smith');
    });

    it('should apply custom filters', () => {
      const result = applyFilters(testData, {
        customFilters: { id: 2 },
      });
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(2);
    });

    it('should return empty array when no matches', () => {
      const result = applyFilters(testData, {
        search: 'nonexistent',
        searchFields: ['name'],
      });
      expect(result.length).toBe(0);
    });
  });

  describe('applyPagination', () => {
    const testData = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
    }));

    it('should paginate with default values', () => {
      const result = applyPagination(testData, {});
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.data.length).toBe(20);
      expect(result.total).toBe(100);
      expect(result.totalPages).toBe(5);
    });

    it('should paginate to specific page', () => {
      const result = applyPagination(testData, { page: 3, pageSize: 20 });
      expect(result.page).toBe(3);
      expect(result.data.length).toBe(20);
      expect(result.data[0].id).toBe(41); // Page 3 starts at item 41
    });

    it('should handle custom page size', () => {
      const result = applyPagination(testData, { page: 1, pageSize: 10 });
      expect(result.data.length).toBe(10);
      expect(result.totalPages).toBe(10);
    });

    it('should handle last page with fewer items', () => {
      const result = applyPagination(testData, { page: 5, pageSize: 20 });
      expect(result.data.length).toBe(20);
      expect(result.page).toBe(5);
    });

    it('should handle empty data', () => {
      const result = applyPagination([], { page: 1, pageSize: 20 });
      expect(result.data.length).toBe(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle single page', () => {
      const smallData = [{ id: 1 }, { id: 2 }];
      const result = applyPagination(smallData, { page: 1, pageSize: 10 });
      expect(result.data.length).toBe(2);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('generateCacheKey', () => {
    it('should generate consistent cache key', () => {
      const key = generateCacheKey('vehicles', 123, {
        page: 1,
        pageSize: 20,
        search: 'ford',
      });
      expect(key).toContain('vehicles:list:123');
      expect(key).toContain('page:1');
      expect(key).toContain('pageSize:20');
      expect(key).toContain('search:ford');
    });

    it('should handle empty params', () => {
      const key = generateCacheKey('vehicles', 123, {});
      expect(key).toBe('vehicles:list:123:');
    });

    it('should sort params for consistency', () => {
      const key1 = generateCacheKey('vehicles', 123, {
        page: 1,
        search: 'ford',
      });
      const key2 = generateCacheKey('vehicles', 123, {
        search: 'ford',
        page: 1,
      });
      expect(key1).toBe(key2);
    });

    it('should handle undefined values', () => {
      const key = generateCacheKey('vehicles', 123, {
        page: 1,
        search: undefined,
      });
      expect(key).toContain('page:1');
      expect(key).toContain('search:');
    });
  });

  describe('generateItemCacheKey', () => {
    it('should generate item cache key', () => {
      const key = generateItemCacheKey('vehicles', 123, 456);
      expect(key).toBe('vehicles:item:123:456');
    });

    it('should handle string IDs', () => {
      const key = generateItemCacheKey('vehicles', '123', 'abc-def');
      expect(key).toBe('vehicles:item:123:abc-def');
    });
  });
});
