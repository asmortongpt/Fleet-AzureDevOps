/**
 * Threat Detector Service
 * Integrates with VirusTotal and other threat intelligence sources
 * Analyzes files, URLs, IPs, and domains for security threats
 */

import { EventEmitter } from 'events';

import type { ThreatLevel, ThreatIndicator, ThreatAnalysisResult } from './types';

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY || '';
const VIRUSTOTAL_API_URL = 'https://www.virustotal.com/api/v3';

interface VirusTotalResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      last_analysis_date?: number;
      last_analysis_stats?: {
        malicious: number;
        suspicious: number;
        undetected: number;
        harmless: number;
      };
      reputation?: number;
      meaningful_name?: string;
      tags?: string[];
    };
    relationships?: {
      last_analysis_results?: {
        data: Array<{
          id: string;
          type: string;
          attributes: {
            engine_name: string;
            result: string;
            category: string;
          };
        }>;
      };
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ThreatIndicatorMetadata extends Record<string, unknown> {
  source: string;
  confidence: number;
  timestamp: number;
  tags?: string[];
  enginesDetected?: number;
  totalEngines?: number;
}

export class ThreatDetector extends EventEmitter {
  private apiKey: string;
  private apiUrl: string;
  private cache: Map<string, { result: ThreatAnalysisResult; timestamp: number }>;
  private cacheExpiry: number = 3600000; // 1 hour
  private requestRateLimit: number = 4; // requests per minute
  private requestTimestamps: number[] = [];

  constructor(apiKey?: string) {
    super();
    this.apiKey = apiKey || VIRUSTOTAL_API_KEY;
    this.apiUrl = VIRUSTOTAL_API_URL;
    this.cache = new Map();

    if (!this.apiKey) {
      console.warn('VirusTotal API key not configured');
    }
  }

  /**
   * Analyze a file by its hash (MD5, SHA1, SHA256)
   */
  async analyzeFileHash(hash: string): Promise<ThreatAnalysisResult> {
    const normalizedHash = hash.toLowerCase();
    const cacheKey = `file:${normalizedHash}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    try {
      await this.enforceRateLimit();

      const response = await fetch(`${this.apiUrl}/files/${normalizedHash}`, {
        method: 'GET',
        headers: {
          'x-apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return this.createCleanResult(normalizedHash, 'file_hash');
        }
        throw new Error(`VirusTotal API error: ${response.statusText}`);
      }

      const data: VirusTotalResponse = await response.json();
      const result = this.parseVirusTotalResponse(normalizedHash, 'file_hash', data);

      // Cache result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });
      this.emit('threat-analyzed', { indicator: normalizedHash, type: 'file_hash', result });

      return result;
    } catch (error) {
      console.error('File hash analysis error:', error);
      return this.createErrorResult(normalizedHash, 'file_hash', error);
    }
  }

  /**
   * Analyze a URL
   */
  async analyzeUrl(url: string): Promise<ThreatAnalysisResult> {
    const cacheKey = `url:${url}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    try {
      await this.enforceRateLimit();

      // Convert URL to safe base64 for VirusTotal
      const urlId = this.encodeUrl(url);

      const response = await fetch(`${this.apiUrl}/urls/${urlId}`, {
        method: 'GET',
        headers: {
          'x-apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return this.createCleanResult(url, 'url');
        }
        throw new Error(`VirusTotal API error: ${response.statusText}`);
      }

      const data: VirusTotalResponse = await response.json();
      const result = this.parseVirusTotalResponse(url, 'url', data);

      // Cache result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });
      this.emit('threat-analyzed', { indicator: url, type: 'url', result });

      return result;
    } catch (error) {
      console.error('URL analysis error:', error);
      return this.createErrorResult(url, 'url', error);
    }
  }

  /**
   * Analyze an IP address
   */
  async analyzeIP(ip: string): Promise<ThreatAnalysisResult> {
    const cacheKey = `ip:${ip}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    try {
      await this.enforceRateLimit();

      const response = await fetch(`${this.apiUrl}/ip_addresses/${ip}`, {
        method: 'GET',
        headers: {
          'x-apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`VirusTotal API error: ${response.statusText}`);
      }

      const data: VirusTotalResponse = await response.json();
      const result = this.parseVirusTotalResponse(ip, 'ip', data);

      // Cache result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });
      this.emit('threat-analyzed', { indicator: ip, type: 'ip', result });

      return result;
    } catch (error) {
      console.error('IP analysis error:', error);
      return this.createErrorResult(ip, 'ip', error);
    }
  }

  /**
   * Analyze a domain
   */
  async analyzeDomain(domain: string): Promise<ThreatAnalysisResult> {
    const cacheKey = `domain:${domain}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    try {
      await this.enforceRateLimit();

      const response = await fetch(`${this.apiUrl}/domains/${domain}`, {
        method: 'GET',
        headers: {
          'x-apikey': this.apiKey,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`VirusTotal API error: ${response.statusText}`);
      }

      const data: VirusTotalResponse = await response.json();
      const result = this.parseVirusTotalResponse(domain, 'domain', data);

      // Cache result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });
      this.emit('threat-analyzed', { indicator: domain, type: 'domain', result });

      return result;
    } catch (error) {
      console.error('Domain analysis error:', error);
      return this.createErrorResult(domain, 'domain', error);
    }
  }

  /**
   * Analyze multiple indicators in batch
   */
  async analyzeIndicators(indicators: ThreatIndicator[]): Promise<ThreatAnalysisResult[]> {
    const results = await Promise.all(
      indicators.map(async (indicator) => {
        switch (indicator.type) {
          case 'file_hash':
            return this.analyzeFileHash(indicator.value);
          case 'url':
            return this.analyzeUrl(indicator.value);
          case 'ip':
            return this.analyzeIP(indicator.value);
          case 'domain':
            return this.analyzeDomain(indicator.value);
          default:
            return this.createUnknownResult(indicator.value, indicator.type);
        }
      })
    );

    this.emit('batch-analyzed', { count: indicators.length, results });
    return results;
  }

  /**
   * Validate threat analysis results and filter by severity
   */
  filterBySeverity(
    results: ThreatAnalysisResult[],
    minSeverity: ThreatLevel
  ): ThreatAnalysisResult[] {
    const severityLevels: Record<ThreatLevel, number> = {
      'critical': 4,
      'high': 3,
      'medium': 2,
      'low': 1,
      'clean': 0
    };

    return results.filter(
      (result) => severityLevels[result.threatLevel] >= severityLevels[minSeverity]
    );
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    this.emit('cache-cleared', { timestamp: Date.now() });
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.values()).length
    };
  }

  // Private helper methods

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    // Remove timestamps older than 1 minute
    this.requestTimestamps = this.requestTimestamps.filter((ts) => now - ts < 60000);

    if (this.requestTimestamps.length >= this.requestRateLimit) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = 60000 - (now - oldestRequest);
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.enforceRateLimit();
      }
    }

    this.requestTimestamps.push(now);
  }

  private encodeUrl(url: string): string {
    // VirusTotal uses base64url encoding for URL ID
    return Buffer.from(url).toString('base64').replace(/[+/]/g, (char) => {
      return char === '+' ? '-' : '_';
    });
  }

  private parseVirusTotalResponse(
    indicator: string,
    type: string,
    response: VirusTotalResponse
  ): ThreatAnalysisResult {
    if (response.error) {
      return this.createErrorResult(indicator, type, new Error(response.error.message));
    }

    const attributes = response.data.attributes;
    const stats = attributes.last_analysis_stats || { malicious: 0, suspicious: 0, undetected: 0, harmless: 0 };
    const totalEngines = stats.malicious + stats.suspicious + stats.undetected + stats.harmless || 0;
    const enginesDetected = stats.malicious + stats.suspicious || 0;

    let threatLevel: ThreatLevel = 'clean';
    if (stats.malicious && stats.malicious > 0) {
      threatLevel = stats.malicious >= 5 ? 'critical' : stats.malicious >= 3 ? 'high' : 'medium';
    } else if (stats.suspicious && stats.suspicious > 0) {
      threatLevel = 'medium';
    }

    const metadata: ThreatIndicatorMetadata = {
      source: 'virustotal',
      confidence: totalEngines > 0 ? (enginesDetected / totalEngines) : 0,
      timestamp: attributes.last_analysis_date ? attributes.last_analysis_date * 1000 : Date.now(),
      tags: attributes.tags,
      enginesDetected,
      totalEngines
    };

    return {
      indicator,
      type,
      threatLevel,
      isMalicious: threatLevel !== 'clean',
      confidence: metadata.confidence,
      metadata,
      analysisDate: new Date(metadata.timestamp),
      engines: {
        detected: enginesDetected,
        total: totalEngines || 1
      }
    };
  }

  private createCleanResult(indicator: string, type: string): ThreatAnalysisResult {
    return {
      indicator,
      type,
      threatLevel: 'clean',
      isMalicious: false,
      confidence: 1.0,
      metadata: {
        source: 'virustotal',
        confidence: 1.0,
        timestamp: Date.now(),
        enginesDetected: 0,
        totalEngines: 1
      },
      analysisDate: new Date(),
      engines: { detected: 0, total: 1 }
    };
  }

  private createErrorResult(indicator: string, type: string, error: unknown): ThreatAnalysisResult {
    return {
      indicator,
      type,
      threatLevel: 'low',
      isMalicious: false,
      confidence: 0,
      metadata: {
        source: 'virustotal',
        confidence: 0,
        timestamp: Date.now(),
        enginesDetected: 0,
        totalEngines: 0
      },
      analysisDate: new Date(),
      engines: { detected: 0, total: 0 },
      error: error instanceof Error ? error.message : String(error)
    };
  }

  private createUnknownResult(indicator: string, type: string): ThreatAnalysisResult {
    return {
      indicator,
      type,
      threatLevel: 'low',
      isMalicious: false,
      confidence: 0,
      metadata: {
        source: 'unknown',
        confidence: 0,
        timestamp: Date.now()
      },
      analysisDate: new Date(),
      engines: { detected: 0, total: 0 }
    };
  }
}

export default ThreatDetector;
