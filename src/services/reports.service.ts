/**
import logger from '@/utils/logger';
 * Reports Service - Client-side API calls for Reports Hub
 *
 * This service provides typed methods for interacting with the backend Reports API.
 * All methods include error handling and return properly typed responses.
 */

export interface ReportListItem {
  id: string;
  title: string;
  domain: string;
  file: string;
  description?: string;
  isCustom?: boolean;
  createdBy?: string;
  createdAt?: string;
}

export interface ReportDefinition {
  id: string;
  title: string;
  domain: string;
  description: string;
  datasource: {
    type: string;
    view: string;
    parameters: Record<string, string>;
  };
  filters: Array<{
    name: string;
    type: string;
    default: string;
    required?: boolean;
    values?: string[] | string;
  }>;
  visuals: any[];
  drilldowns: any[];
  drillthrough: any[];
  exports: any[];
  security: {
    rowLevel: Array<{
      role: string;
      rule: string;
    }>;
  };
}

export interface ExecuteReportRequest {
  reportId: string;
  filters: {
    dateRange: { start: Date; end: Date };
    businessArea: string;
    division: string;
    department: string;
    shop: string;
  };
  drilldown?: {
    level: number;
    filters: Record<string, any>;
  };
  userId?: string;
}

export interface ExportReportRequest {
  reportId: string;
  format: 'csv' | 'xlsx' | 'pdf';
  filters: ExecuteReportRequest['filters'];
  userId?: string;
}

export interface AIGenerateRequest {
  prompt: string;
  model?: 'gpt-4-turbo' | 'grok' | 'gemini';
}

export interface ChatRequest {
  message: string;
  userId?: string;
  userRole?: string;
  history?: Array<{ role: string; content: string }>;
}

class ReportsService {
  private baseUrl = '/api/reports';

  /**
   * Get list of all available reports (filtered by RBAC)
   */
  async getReports(): Promise<ReportListItem[]> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      logger.error('Error fetching reports:', error);
      throw error;
    }
  }

  /**
   * Get single report definition by ID
   */
  async getReport(reportId: string): Promise<ReportDefinition> {
    try {
      const response = await fetch(`${this.baseUrl}/${reportId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch report: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      logger.error(`Error fetching report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Execute report with filters and get data
   */
  async executeReport(request: ExecuteReportRequest): Promise<Record<string, any>> {
    try {
      const response = await fetch(`${this.baseUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to execute report: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error executing report:', error);
      throw error;
    }
  }

  /**
   * Save custom AI-generated report
   */
  async saveCustomReport(definition: any, name: string): Promise<{ reportId: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ definition, name })
      });

      if (!response.ok) {
        throw new Error(`Failed to save custom report: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error saving custom report:', error);
      throw error;
    }
  }

  /**
   * AI report generation endpoint
   */
  async generateReport(request: AIGenerateRequest): Promise<{
    reportDefinition: ReportDefinition;
    reportId: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error generating report:', error);
      throw error;
    }
  }

  /**
   * AI chatbot query endpoint
   */
  async chatQuery(request: ChatRequest): Promise<{
    message: string;
    reportData?: any;
    modelUsed: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to process chat query: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Error processing chat query:', error);
      throw error;
    }
  }

  /**
   * Export report to file
   */
  async exportReport(request: ExportReportRequest): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Failed to export report: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      logger.error('Error exporting report:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const reportsService = new ReportsService();
