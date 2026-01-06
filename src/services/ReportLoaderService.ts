/**
 * Report Loader Service
 * Loads and manages report definitions from the reporting library
 */

export interface ReportFilter {
  name: string;
  type: 'dateRange' | 'select' | 'multiSelect';
  values?: string[] | 'dynamic';
  default?: string | string[];
  required?: boolean;
}

export interface ReportVisual {
  id: string;
  type: 'kpiTiles' | 'line' | 'bar' | 'table' | 'pie' | 'scatter';
  title: string;
  measures?: ReportMeasure[];
  encoding?: ReportEncoding;
  columns?: ReportColumn[];
  pagination?: {
    pageSize: number;
  };
  layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  interactions?: {
    drilldown?: boolean;
    tooltip?: string[];
  };
}

export interface ReportMeasure {
  id: string;
  label: string;
  format: 'currency' | 'integer' | 'percent' | 'decimal';
  aggregation?: 'sum' | 'avg' | 'count' | 'distinctCount' | 'min' | 'max';
  field?: string;
  expression?: string;
}

export interface ReportEncoding {
  x?: {
    field: string;
    type: 'temporal' | 'quantitative' | 'nominal' | 'ordinal';
    aggregate?: string;
  };
  y?: {
    field: string;
    type: 'temporal' | 'quantitative' | 'nominal' | 'ordinal';
    aggregate?: string;
  };
  color?: {
    field: string;
    type: 'nominal' | 'ordinal' | 'quantitative';
  };
}

export interface ReportColumn {
  field: string;
  label: string;
  format?: 'currency' | 'date' | 'integer' | 'percent';
}

export interface ReportDrilldown {
  fromVisual: string;
  hierarchy: {
    level: string;
    field: string;
  }[];
  targetVisual: string;
}

export interface ReportDrillthrough {
  label: string;
  targetReport: string;
  paramsMap: Record<string, string>;
}

export interface ReportExport {
  format: 'csv' | 'xlsx' | 'pdf';
  dataset?: string;
  layout?: string;
}

export interface ReportSecurity {
  rowLevel?: {
    role: string;
    rule: string;
  }[];
}

export interface ReportValidation {
  reconciliationChecks?: string[];
}

export interface ReportDefinition {
  id: string;
  title: string;
  domain: string;
  description?: string;
  datasource: {
    type: 'sqlView' | 'api' | 'stored_procedure';
    view?: string;
    endpoint?: string;
    parameters?: Record<string, string>;
  };
  filters: ReportFilter[];
  visuals: ReportVisual[];
  drilldowns?: ReportDrilldown[];
  drillthrough?: ReportDrillthrough[];
  exports?: ReportExport[];
  security?: ReportSecurity;
  validation?: ReportValidation;
}

export interface ReportRegistry {
  totalReports: number;
  domains: string[];
  reports: {
    id: string;
    title: string;
    domain: string;
    description?: string;
    path: string;
  }[];
}

class ReportLoaderService {
  private static instance: ReportLoaderService;
  private registry: ReportRegistry | null = null;
  private cachedReports: Map<string, ReportDefinition> = new Map();
  private baseUrl: string;

  private constructor() {
    // Determine base URL based on environment
    this.baseUrl = import.meta.env.PROD
      ? '/reporting_library'
      : '/src/reporting_library';
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ReportLoaderService {
    if (!ReportLoaderService.instance) {
      ReportLoaderService.instance = new ReportLoaderService();
    }
    return ReportLoaderService.instance;
  }

  /**
   * Load the report registry (index.json)
   */
  public async loadRegistry(): Promise<ReportRegistry> {
    if (this.registry) {
      return this.registry;
    }

    try {
      const response = await fetch(`${this.baseUrl}/index.json`);
      if (!response.ok) {
        throw new Error(`Failed to load report registry: ${response.statusText}`);
      }

      this.registry = await response.json();
      console.log(`✓ Loaded report registry: ${this.registry.totalReports} reports`);
      return this.registry;
    } catch (error) {
      console.error('Error loading report registry:', error);
      throw error;
    }
  }

  /**
   * Get all report metadata (from registry)
   */
  public async getAllReportMetadata(): Promise<ReportRegistry['reports']> {
    const registry = await this.loadRegistry();
    return registry.reports;
  }

  /**
   * Get reports grouped by domain
   */
  public async getReportsByDomain(): Promise<Map<string, ReportRegistry['reports']>> {
    const reports = await this.getAllReportMetadata();
    const grouped = new Map<string, ReportRegistry['reports']>();

    reports.forEach(report => {
      const domain = report.domain;
      if (!grouped.has(domain)) {
        grouped.set(domain, []);
      }
      grouped.get(domain)!.push(report);
    });

    return grouped;
  }

  /**
   * Load full report definition by ID
   */
  public async loadReport(reportId: string): Promise<ReportDefinition> {
    // Check cache first
    if (this.cachedReports.has(reportId)) {
      return this.cachedReports.get(reportId)!;
    }

    const registry = await this.loadRegistry();
    const metadata = registry.reports.find(r => r.id === reportId);

    if (!metadata) {
      throw new Error(`Report not found: ${reportId}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}/${metadata.path}`);
      if (!response.ok) {
        throw new Error(`Failed to load report ${reportId}: ${response.statusText}`);
      }

      const reportDef: ReportDefinition = await response.json();

      // Cache the report
      this.cachedReports.set(reportId, reportDef);
      console.log(`✓ Loaded report: ${reportDef.title} (${reportDef.id})`);

      return reportDef;
    } catch (error) {
      console.error(`Error loading report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Search reports by text (searches title, description, domain)
   */
  public async searchReports(searchTerm: string): Promise<ReportRegistry['reports']> {
    const reports = await this.getAllReportMetadata();
    const term = searchTerm.toLowerCase();

    return reports.filter(report => {
      return (
        report.title.toLowerCase().includes(term) ||
        report.domain.toLowerCase().includes(term) ||
        report.description?.toLowerCase().includes(term) ||
        false
      );
    });
  }

  /**
   * Get reports by domain
   */
  public async getReportsByDomainName(domain: string): Promise<ReportRegistry['reports']> {
    const reports = await this.getAllReportMetadata();
    return reports.filter(r => r.domain === domain);
  }

  /**
   * Get all unique domains
   */
  public async getDomains(): Promise<string[]> {
    const registry = await this.loadRegistry();
    return registry.domains;
  }

  /**
   * Clear cache (useful for dev/testing)
   */
  public clearCache(): void {
    this.cachedReports.clear();
    this.registry = null;
    console.log('✓ Report cache cleared');
  }

  /**
   * Preload multiple reports (useful for performance)
   */
  public async preloadReports(reportIds: string[]): Promise<void> {
    const promises = reportIds.map(id => this.loadReport(id).catch(err => {
      console.warn(`Failed to preload report ${id}:`, err);
    }));

    await Promise.all(promises);
    console.log(`✓ Preloaded ${reportIds.length} reports`);
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { cachedReports: number; hasRegistry: boolean } {
    return {
      cachedReports: this.cachedReports.size,
      hasRegistry: this.registry !== null
    };
  }
}

// Export singleton instance
export const reportLoader = ReportLoaderService.getInstance();
export default reportLoader;
