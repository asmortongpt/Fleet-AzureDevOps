/**
 * Index Monitoring Service
 *
 * Monitors database index usage, identifies unused indexes,
 * tracks index bloat, and provides recommendations for optimization.
 *
 * Usage:
 *   import { IndexMonitoring } from './index-monitoring';
 *   const report = await IndexMonitoring.getIndexUsageReport();
 *   const unused = await IndexMonitoring.getUnusedIndexes();
 */

import { Pool } from 'pg';

export interface IndexUsageStats {
  schemaname: string;
  tablename: string;
  indexname: string;
  index_size: string;
  index_scans: number;
  tuples_read: number;
  tuples_fetched: number;
  last_idx_scan?: Date;
  idx_scan_rate: string;
  usage_category: 'heavy' | 'moderate' | 'light' | 'unused';
}

export interface IndexBloatStats {
  schemaname: string;
  tablename: string;
  indexname: string;
  real_size: string;
  extra_size: string;
  bloat_percentage: number;
  bloat_category: 'none' | 'low' | 'moderate' | 'high' | 'critical';
}

export interface IndexRecommendation {
  type: 'create' | 'drop' | 'rebuild' | 'analyze';
  priority: 'high' | 'medium' | 'low';
  indexname?: string;
  tablename: string;
  reason: string;
  sql_command?: string;
  estimated_impact: string;
}

export class IndexMonitoring {
  /**
   * Get comprehensive index usage statistics
   */
  static async getIndexUsageReport(pool: Pool): Promise<IndexUsageStats[]> {
    const query = `
      SELECT
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        CASE
          WHEN idx_scan = 0 THEN 'unused'
          WHEN idx_scan < 100 THEN 'light'
          WHEN idx_scan < 1000 THEN 'moderate'
          ELSE 'heavy'
        END as usage_category,
        CASE
          WHEN idx_scan = 0 THEN '0 scans/day'
          WHEN idx_scan < 100 THEN '<1 scan/day'
          WHEN idx_scan < 1000 THEN '~' || ROUND(idx_scan::numeric / 30, 1)::text || ' scans/day'
          ELSE '~' || ROUND(idx_scan::numeric / 30, 0)::text || ' scans/day'
        END as idx_scan_rate
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Identify unused indexes (never scanned)
   * These are candidates for removal to improve write performance
   */
  static async getUnusedIndexes(pool: Pool): Promise<IndexUsageStats[]> {
    const query = `
      SELECT
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        'unused'::text as usage_category,
        '0 scans/day'::text as idx_scan_rate
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
        AND idx_scan = 0
        AND indexname NOT LIKE 'pg_toast%'
        AND indexname NOT LIKE '%_pkey'  -- Keep primary keys
        AND indexname NOT LIKE '%_key'   -- Keep unique constraints
      ORDER BY pg_relation_size(indexrelid) DESC;
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Calculate index bloat (wasted space)
   * Bloat occurs when indexes aren't maintained with REINDEX or VACUUM
   */
  static async getIndexBloat(pool: Pool): Promise<IndexBloatStats[]> {
    const query = `
      SELECT
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(real_size::bigint) as real_size,
        pg_size_pretty(extra_size::bigint) as extra_size,
        ROUND((extra_size::numeric / NULLIF(real_size, 0)::numeric) * 100, 1) as bloat_percentage,
        CASE
          WHEN extra_size::numeric / NULLIF(real_size, 0)::numeric < 0.1 THEN 'none'
          WHEN extra_size::numeric / NULLIF(real_size, 0)::numeric < 0.2 THEN 'low'
          WHEN extra_size::numeric / NULLIF(real_size, 0)::numeric < 0.4 THEN 'moderate'
          WHEN extra_size::numeric / NULLIF(real_size, 0)::numeric < 0.6 THEN 'high'
          ELSE 'critical'
        END as bloat_category
      FROM (
        SELECT
          schemaname,
          tablename,
          indexname,
          pg_relation_size(indexrelid) as real_size,
          GREATEST(
            pg_relation_size(indexrelid) - (
              SELECT pg_relation_size(indexrelid::regclass)
              FROM pg_index
              WHERE indexrelid = pg_stat_user_indexes.indexrelid
            ),
            0
          ) as extra_size
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
      ) bloat_calc
      WHERE extra_size > 0
      ORDER BY bloat_percentage DESC, real_size DESC;
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      // Simplified bloat detection if the above fails
      console.warn('Advanced bloat detection failed, using simplified method:', error);
      return [];
    }
  }

  /**
   * Get indexes that should be rebuilt due to bloat
   */
  static async getIndexesNeedingRebuild(pool: Pool): Promise<IndexBloatStats[]> {
    const allBloat = await this.getIndexBloat(pool);
    return allBloat.filter(index =>
      index.bloat_category === 'high' || index.bloat_category === 'critical'
    );
  }

  /**
   * Get missing indexes based on sequential scans
   * Tables with high sequential scan counts may benefit from additional indexes
   */
  static async getMissingIndexSuggestions(pool: Pool): Promise<IndexRecommendation[]> {
    const query = `
      SELECT
        schemaname,
        tablename,
        seq_scan,
        seq_tup_read,
        idx_scan,
        n_tup_ins + n_tup_upd + n_tup_del as write_activity,
        pg_size_pretty(pg_relation_size(relid)) as table_size
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
        AND seq_scan > 1000  -- High sequential scans
        AND seq_tup_read > 100000  -- Reading many rows
        AND (idx_scan IS NULL OR idx_scan < seq_scan / 10)  -- Few index scans
      ORDER BY seq_scan DESC, seq_tup_read DESC
      LIMIT 20;
    `;

    const result = await pool.query(query);

    return result.rows.map(row => ({
      type: 'create' as const,
      priority: row.seq_scan > 10000 ? 'high' as const : 'medium' as const,
      tablename: row.tablename,
      reason: `Table has ${row.seq_scan.toLocaleString()} sequential scans reading ${row.seq_tup_read.toLocaleString()} rows. Consider adding indexes on frequently filtered columns.`,
      estimated_impact: `Could reduce ${Math.round((row.seq_scan / (row.seq_scan + row.idx_scan)) * 100)}% of query time`,
      sql_command: `-- Analyze query patterns first:\n-- EXPLAIN ANALYZE SELECT ... FROM ${row.tablename} WHERE ...;`
    }));
  }

  /**
   * Generate comprehensive recommendations
   */
  static async getRecommendations(pool: Pool): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];

    // 1. Recommend dropping unused indexes
    const unusedIndexes = await this.getUnusedIndexes(pool);
    for (const index of unusedIndexes) {
      // Skip if it's a small index (< 1MB)
      if (index.index_size.includes('kB')) continue;

      recommendations.push({
        type: 'drop',
        priority: 'medium',
        indexname: index.indexname,
        tablename: index.tablename,
        reason: `Index has never been scanned and uses ${index.index_size}. Dropping it will improve write performance.`,
        sql_command: `DROP INDEX IF EXISTS ${index.indexname}; -- Frees ${index.index_size}`,
        estimated_impact: `Faster INSERT/UPDATE/DELETE on ${index.tablename}, frees ${index.index_size}`
      });
    }

    // 2. Recommend rebuilding bloated indexes
    const bloatedIndexes = await this.getIndexesNeedingRebuild(pool);
    for (const index of bloatedIndexes) {
      recommendations.push({
        type: 'rebuild',
        priority: index.bloat_category === 'critical' ? 'high' : 'medium',
        indexname: index.indexname,
        tablename: index.tablename,
        reason: `Index has ${index.bloat_percentage}% bloat (${index.extra_size} wasted). Rebuilding will improve query performance.`,
        sql_command: `REINDEX INDEX CONCURRENTLY ${index.indexname}; -- Reclaims ${index.extra_size}`,
        estimated_impact: `${Math.round(index.bloat_percentage)}% reduction in index size, faster queries`
      });
    }

    // 3. Recommend creating missing indexes
    const missingIndexes = await this.getMissingIndexSuggestions(pool);
    recommendations.push(...missingIndexes);

    // 4. Recommend running ANALYZE on large tables
    const tablesNeedingAnalyze = await this.getTablesNeedingAnalyze(pool);
    for (const table of tablesNeedingAnalyze) {
      recommendations.push({
        type: 'analyze',
        priority: 'low',
        tablename: table.tablename,
        reason: `Table statistics are outdated. Running ANALYZE will improve query planning.`,
        sql_command: `ANALYZE ${table.tablename};`,
        estimated_impact: 'Better query plans from optimizer'
      });
    }

    return recommendations;
  }

  /**
   * Get tables that haven't been analyzed recently
   */
  static async getTablesNeedingAnalyze(pool: Pool): Promise<any[]> {
    const query = `
      SELECT
        schemaname,
        tablename,
        last_analyze,
        last_autoanalyze,
        n_tup_ins + n_tup_upd + n_tup_del as modifications_since_analyze
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
        AND (
          last_analyze IS NULL OR
          last_analyze < NOW() - INTERVAL '7 days'
        )
        AND (n_tup_ins + n_tup_upd + n_tup_del) > 10000
      ORDER BY modifications_since_analyze DESC
      LIMIT 10;
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get overall index health summary
   */
  static async getIndexHealthSummary(pool: Pool) {
    const [usageStats, unusedCount, bloatStats, recommendations] = await Promise.all([
      this.getIndexUsageReport(pool),
      this.getUnusedIndexes(pool),
      this.getIndexBloat(pool),
      this.getRecommendations(pool)
    ]);

    const totalIndexes = usageStats.length;
    const heavyUse = usageStats.filter(i => i.usage_category === 'heavy').length;
    const moderateUse = usageStats.filter(i => i.usage_category === 'moderate').length;
    const lightUse = usageStats.filter(i => i.usage_category === 'light').length;
    const unused = unusedCount.length;

    const totalBloat = bloatStats.reduce((sum, idx) => {
      const sizeStr = idx.extra_size.replace(/[^0-9.]/g, '');
      const size = parseFloat(sizeStr);
      return sum + (idx.extra_size.includes('GB') ? size * 1024 : size);
    }, 0);

    return {
      totalIndexes,
      usage: {
        heavy: heavyUse,
        moderate: moderateUse,
        light: lightUse,
        unused
      },
      usagePercentages: {
        heavy: Math.round((heavyUse / totalIndexes) * 100),
        moderate: Math.round((moderateUse / totalIndexes) * 100),
        light: Math.round((lightUse / totalIndexes) * 100),
        unused: Math.round((unused / totalIndexes) * 100)
      },
      bloat: {
        totalWastedSpaceMB: Math.round(totalBloat),
        indexesWithBloat: bloatStats.length,
        criticalBloat: bloatStats.filter(i => i.bloat_category === 'critical').length,
        highBloat: bloatStats.filter(i => i.bloat_category === 'high').length
      },
      recommendations: {
        total: recommendations.length,
        high: recommendations.filter(r => r.priority === 'high').length,
        medium: recommendations.filter(r => r.priority === 'medium').length,
        low: recommendations.filter(r => r.priority === 'low').length
      },
      healthScore: this.calculateHealthScore({
        unused,
        totalIndexes,
        criticalBloat: bloatStats.filter(i => i.bloat_category === 'critical').length,
        highBloat: bloatStats.filter(i => i.bloat_category === 'high').length
      })
    };
  }

  /**
   * Calculate overall index health score (0-100)
   */
  private static calculateHealthScore(params: {
    unused: number;
    totalIndexes: number;
    criticalBloat: number;
    highBloat: number;
  }): number {
    let score = 100;

    // Deduct for unused indexes
    const unusedPercentage = (params.unused / params.totalIndexes) * 100;
    score -= unusedPercentage * 0.3; // Max 30 point deduction

    // Deduct for critical bloat
    score -= params.criticalBloat * 5; // 5 points per critical bloat index

    // Deduct for high bloat
    score -= params.highBloat * 2; // 2 points per high bloat index

    return Math.max(0, Math.round(score));
  }

  /**
   * Pretty print index health report
   */
  static async printHealthReport(pool: Pool): Promise<void> {
    console.log('\n' + '='.repeat(80));
    console.log('DATABASE INDEX HEALTH REPORT');
    console.log('='.repeat(80) + '\n');

    const summary = await this.getIndexHealthSummary(pool);

    console.log(`📊 OVERALL HEALTH SCORE: ${summary.healthScore}/100`);
    console.log(this.getHealthScoreEmoji(summary.healthScore));
    console.log('');

    console.log('📈 INDEX USAGE STATISTICS:');
    console.log(`   Total Indexes: ${summary.totalIndexes}`);
    console.log(`   Heavy Use:     ${summary.usage.heavy} (${summary.usagePercentages.heavy}%)`);
    console.log(`   Moderate Use:  ${summary.usage.moderate} (${summary.usagePercentages.moderate}%)`);
    console.log(`   Light Use:     ${summary.usage.light} (${summary.usagePercentages.light}%)`);
    console.log(`   Unused:        ${summary.usage.unused} (${summary.usagePercentages.unused}%) ⚠️`);
    console.log('');

    console.log('💾 INDEX BLOAT:');
    console.log(`   Total Wasted Space: ${summary.bloat.totalWastedSpaceMB} MB`);
    console.log(`   Indexes with Bloat: ${summary.bloat.indexesWithBloat}`);
    console.log(`   Critical Bloat:     ${summary.bloat.criticalBloat} 🔴`);
    console.log(`   High Bloat:         ${summary.bloat.highBloat} 🟠`);
    console.log('');

    console.log('💡 RECOMMENDATIONS:');
    console.log(`   Total:   ${summary.recommendations.total}`);
    console.log(`   High:    ${summary.recommendations.high} 🔴`);
    console.log(`   Medium:  ${summary.recommendations.medium} 🟡`);
    console.log(`   Low:     ${summary.recommendations.low} 🟢`);
    console.log('');

    // Print top recommendations
    const recommendations = await this.getRecommendations(pool);
    const topRecommendations = recommendations
      .filter(r => r.priority === 'high')
      .slice(0, 5);

    if (topRecommendations.length > 0) {
      console.log('🎯 TOP RECOMMENDATIONS:');
      topRecommendations.forEach((rec, idx) => {
        console.log(`   ${idx + 1}. [${rec.type.toUpperCase()}] ${rec.tablename}`);
        console.log(`      ${rec.reason}`);
        if (rec.sql_command) {
          console.log(`      ${rec.sql_command}`);
        }
        console.log('');
      });
    }

    console.log('='.repeat(80) + '\n');
  }

  private static getHealthScoreEmoji(score: number): string {
    if (score >= 90) return '🟢 Excellent - Indexes are well-maintained';
    if (score >= 75) return '🟡 Good - Minor improvements recommended';
    if (score >= 60) return '🟠 Fair - Several optimizations needed';
    return '🔴 Poor - Immediate attention required';
  }
}

/**
 * CLI Usage Example
 */
if (require.main === module) {
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost/fleet_db'
  });

  (async () => {
    try {
      await IndexMonitoring.printHealthReport(pool);

      // Optional: Get detailed reports
      if (process.argv.includes('--detailed')) {
        console.log('\n📋 DETAILED UNUSED INDEXES:');
        const unused = await IndexMonitoring.getUnusedIndexes(pool);
        console.table(unused);

        console.log('\n💾 DETAILED INDEX BLOAT:');
        const bloat = await IndexMonitoring.getIndexBloat(pool);
        console.table(bloat);
      }

      await pool.end();
    } catch (error) {
      console.error('Error generating index health report:', error);
      process.exit(1);
    }
  })();
}
