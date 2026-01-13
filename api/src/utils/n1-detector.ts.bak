export class N1Detector {
  private static queryLog: Map<string, number> = new Map();

  static logQuery(query: string) {
    const count = this.queryLog.get(query) || 0;
    this.queryLog.set(query, count + 1);
  }

  static detectN1(): string[] {
    const warnings: string[] = [];

    this.queryLog.forEach((count, query) => {
      if (count > 10 && new RegExp('WHERE.*=\\s*\\$1').test(query)) {
        warnings.push(`Potential N+1 detected: "${query}" executed ${count} times`);
      }
    });

    return warnings;
  }

  static reset() {
    this.queryLog.clear();
  }
}
