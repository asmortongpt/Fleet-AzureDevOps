/**
 * Query Performance Monitoring Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { QueryMonitor } from '../utils/query-monitor';
import { QueryResult } from 'pg';

describe('QueryMonitor', () => {
  let monitor: QueryMonitor;
  let mockPool: any;

  beforeEach(() => {
    monitor = new QueryMonitor();
    mockPool = {
      query: vi.fn()
    };
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('Query Monitoring', () => {
    it('should track query execution time', async () => {
      const mockResult: QueryResult = {
        rows: [{ id: 1 }],
        rowCount: 1,
        command: 'SELECT',
        oid: 0,
        fields: []
      };

      mockPool.query.mockResolvedValue(mockResult);

      const result = await monitor.monitorQuery(
        mockPool,
        'SELECT * FROM test WHERE id = $1',
        [1]
      );

      expect(result).toEqual(mockResult);
      const summary = monitor.getPerformanceSummary();
      expect(summary.totalQueries).toBeGreaterThan(0);
    });
  });
});
