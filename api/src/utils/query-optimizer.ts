export class QueryOptimizer {
  static analyzeQuery(sql: string): {
    hasSelectStar: boolean;
    hasMissingWhere: boolean;
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    const hasSelectStar = /SELECT\s+\*/i.test(sql);
    const hasMissingWhere = /DELETE|UPDATE/i.test(sql) && !/WHERE/i.test(sql);

    if (hasSelectStar) {
      recommendations.push('Replace SELECT id, created_at, updated_at with explicit column names');
    }

    if (hasMissingWhere) {
      recommendations.push('Add WHERE clause to prevent full table operations');
    }

    return { hasSelectStar, hasMissingWhere, recommendations };
  }

  static addPagination(sql: string, page: number, limit: number): string {
    const offset = (page - 1) * limit;
    return `${sql} LIMIT ${limit} OFFSET ${offset}`;
  }

  static addIndex(table: string, column: string): string {
    return `CREATE INDEX IF NOT EXISTS idx_${table}_${column} ON ${table}(${column})`;
  }
}
