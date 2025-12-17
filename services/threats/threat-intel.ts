/**
 * Threat Intelligence Feed Integration
 * Manages multiple threat intelligence sources
 * Aggregates IOCs and threat data from various feeds
 */

import { EventEmitter } from 'events';
import type {
  ThreatIntelFeed,
  ThreatIndicator,
  IndicatorOfCompromise,
  IndicatorType
} from './types';

interface FeedSourceConfig {
  id: string;
  name: string;
  url: string;
  type: IndicatorType;
  headers?: Record<string, string>;
  parser?: (data: unknown) => ThreatIndicator[];
}

export class ThreatIntelligenceService extends EventEmitter {
  private feeds: Map<string, ThreatIntelFeed> = new Map();
  private indicators: Map<string, IndicatorOfCompromise> = new Map();
  private feedSources: Map<string, FeedSourceConfig> = new Map();
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();

  private defaultSources: FeedSourceConfig[] = [
    {
      id: 'abuse-ipdb',
      name: 'AbuseIPDB',
      url: 'https://api.abuseipdb.com/api/v2/blacklist',
      type: 'ip',
      headers: {
        'Key': process.env.ABUSEIPDB_API_KEY || ''
      }
    },
    {
      id: 'malwaredomainlist',
      name: 'Malware Domain List',
      url: 'https://www.malwaredomainlist.com/hostslist/hosts.txt',
      type: 'domain'
    },
    {
      id: 'phishtank',
      name: 'PhishTank',
      url: 'https://data.phishtank.com/data/online-valid.json',
      type: 'url'
    }
  ];

  constructor() {
    super();
    this.initializeDefaultFeeds();
  }

  /**
   * Initialize default threat intelligence feeds
   */
  private initializeDefaultFeeds(): void {
    for (const source of this.defaultSources) {
      this.addFeedSource(source);
    }
  }

  /**
   * Add a threat intelligence feed source
   */
  addFeedSource(config: FeedSourceConfig): void {
    this.feedSources.set(config.id, config);

    const feed: ThreatIntelFeed = {
      id: config.id,
      name: config.name,
      source: config.url,
      type: config.type,
      refreshInterval: 3600000, // 1 hour default
      enabled: true,
      credibility: 80,
      indicators: [],
      lastUpdated: 0
    };

    this.feeds.set(config.id, feed);
    this.emit('feed-added', feed);
  }

  /**
   * Start automatic feed updates
   */
  startFeedUpdates(feedId?: string): void {
    if (feedId) {
      const feed = this.feeds.get(feedId);
      if (feed) {
        this.scheduleFeedUpdate(feedId, feed.refreshInterval);
      }
    } else {
      // Start all feeds
      const feedsIterator = this.feeds.entries();
      let current = feedsIterator.next();
      while (!current.done) {
        const [id, feed] = current.value;
        if (feed.enabled) {
          this.scheduleFeedUpdate(id, feed.refreshInterval);
        }
        current = feedsIterator.next();
      }
    }
  }

  /**
   * Stop automatic feed updates
   */
  stopFeedUpdates(feedId?: string): void {
    if (feedId) {
      const interval = this.updateIntervals.get(feedId);
      if (interval) {
        clearInterval(interval);
        this.updateIntervals.delete(feedId);
      }
    } else {
      // Stop all feeds
      const intervalsIterator = this.updateIntervals.values();
      let current = intervalsIterator.next();
      while (!current.done) {
        clearInterval(current.value);
        current = intervalsIterator.next();
      }
      this.updateIntervals.clear();
    }
  }

  /**
   * Manually update a feed
   */
  async updateFeed(feedId: string): Promise<ThreatIntelFeed | null> {
    const feed = this.feeds.get(feedId);
    const source = this.feedSources.get(feedId);

    if (!feed || !source) {
      return null;
    }

    try {
      const indicators = await this.fetchFeedData(source);
      feed.indicators = indicators;
      feed.lastUpdated = Date.now();

      // Update indicators map
      for (const indicator of indicators) {
        this.addIndicator(indicator);
      }

      this.emit('feed-updated', feed);
      return feed;
    } catch (error) {
      console.error(`Failed to update feed ${feedId}:`, error);
      this.emit('feed-update-failed', { feedId, error });
      return null;
    }
  }

  /**
   * Get all indicators across all feeds
   */
  getAllIndicators(): IndicatorOfCompromise[] {
    return Array.from(this.indicators.values());
  }

  /**
   * Search indicators by type
   */
  searchIndicators(type: IndicatorType): IndicatorOfCompromise[] {
    return Array.from(this.indicators.values()).filter(ioc => ioc.type === type);
  }

  /**
   * Search indicators by value
   */
  findIndicator(value: string): IndicatorOfCompromise | undefined {
    return this.indicators.get(`${value}`);
  }

  /**
   * Check if value is in threat intelligence feeds
   */
  isKnownThreat(value: string, type?: IndicatorType): boolean {
    const ioc = this.indicators.get(value);
    if (!ioc) return false;

    if (type && ioc.type !== type) {
      return false;
    }

    return ioc.threatLevel !== 'clean';
  }

  /**
   * Get related indicators
   */
  getRelatedIndicators(value: string): IndicatorOfCompromise[] {
    const indicator = this.indicators.get(value);
    if (!indicator) return [];

    return indicator.relatedIndicators
      .map(v => this.indicators.get(v))
      .filter((ioc): ioc is IndicatorOfCompromise => ioc !== undefined);
  }

  /**
   * Add a threat indicator
   */
  private addIndicator(indicator: ThreatIndicator): void {
    const ioc: IndicatorOfCompromise = {
      value: indicator.value,
      type: indicator.type,
      firstSeen: indicator.timestamp || Date.now(),
      lastSeen: Date.now(),
      sources: [indicator.source || 'unknown'],
      relatedIndicators: [],
      threatLevel: 'medium',
      confidence: 0.7,
      context: indicator.context || {}
    };

    const existing = this.indicators.get(indicator.value);
    if (existing) {
      // Update existing indicator
      existing.lastSeen = Date.now();
      if (!existing.sources.includes(indicator.source || 'unknown')) {
        existing.sources.push(indicator.source || 'unknown');
      }
    } else {
      this.indicators.set(indicator.value, ioc);
      this.emit('indicator-added', ioc);
    }
  }

  /**
   * Get feed statistics
   */
  getFeedStatistics(): {
    totalFeeds: number;
    enabledFeeds: number;
    totalIndicators: number;
    byType: Record<IndicatorType, number>;
    lastUpdate: number;
  } {
    const byType: Partial<Record<IndicatorType, number>> = {};

    const indicatorsIterator = this.indicators.values();
    let iocCurrent = indicatorsIterator.next();
    while (!iocCurrent.done) {
      const ioc = iocCurrent.value;
      byType[ioc.type] = (byType[ioc.type] || 0) + 1;
      iocCurrent = indicatorsIterator.next();
    }

    const feedsList: ThreatIntelFeed[] = [];
    const feedsIterator = this.feeds.values();
    let feedCurrent = feedsIterator.next();
    while (!feedCurrent.done) {
      feedsList.push(feedCurrent.value);
      feedCurrent = feedsIterator.next();
    }

    const enabledCount = feedsList.filter(f => f.enabled).length;
    const lastUpdates = feedsList
      .filter(f => f.lastUpdated > 0)
      .map(f => f.lastUpdated)
      .sort((a, b) => b - a);

    return {
      totalFeeds: this.feeds.size,
      enabledFeeds: enabledCount,
      totalIndicators: this.indicators.size,
      byType: byType as Record<IndicatorType, number>,
      lastUpdate: lastUpdates[0] || 0
    };
  }

  /**
   * Export indicators for backup or sharing
   */
  exportIndicators(type?: IndicatorType): IndicatorOfCompromise[] {
    if (type) {
      return this.searchIndicators(type);
    }
    return this.getAllIndicators();
  }

  /**
   * Import indicators from external source
   */
  importIndicators(indicators: ThreatIndicator[]): number {
    let importedCount = 0;

    for (const indicator of indicators) {
      const existing = this.indicators.get(indicator.value);
      if (!existing) {
        this.addIndicator(indicator);
        importedCount++;
      }
    }

    this.emit('indicators-imported', { count: importedCount });
    return importedCount;
  }

  // Private helper methods

  private async fetchFeedData(source: FeedSourceConfig): Promise<ThreatIndicator[]> {
    try {
      const response = await fetch(source.url, {
        headers: source.headers || {}
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (source.parser) {
        return source.parser(data);
      }

      return this.parseGenericFeedData(data, source.type);
    } catch (error) {
      console.error(`Failed to fetch feed from ${source.url}:`, error);
      throw error;
    }
  }

  private parseGenericFeedData(data: unknown, type: IndicatorType): ThreatIndicator[] {
    const indicators: ThreatIndicator[] = [];

    if (Array.isArray(data)) {
      for (const item of data) {
        if (typeof item === 'string') {
          indicators.push({
            value: item.trim(),
            type,
            timestamp: Date.now()
          });
        } else if (typeof item === 'object' && item !== null) {
          const obj = item as Record<string, unknown>;
          const value = (obj.value || obj.indicator || obj.ioc || obj.ip || obj.domain) as string;
          if (value) {
            indicators.push({
              value: String(value).trim(),
              type,
              timestamp: Date.now(),
              context: obj
            });
          }
        }
      }
    } else if (typeof data === 'object' && data !== null) {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.indicators)) {
        return this.parseGenericFeedData(obj.indicators, type);
      }
      if (Array.isArray(obj.data)) {
        return this.parseGenericFeedData(obj.data, type);
      }
    }

    return indicators;
  }

  private scheduleFeedUpdate(feedId: string, interval: number): void {
    // Clear existing interval if any
    const existing = this.updateIntervals.get(feedId);
    if (existing) {
      clearInterval(existing);
    }

    // Update immediately, then schedule
    this.updateFeed(feedId).catch(err => {
      console.error(`Failed to update feed ${feedId}:`, err);
    });

    const timeout = setInterval(() => {
      this.updateFeed(feedId).catch(err => {
        console.error(`Failed to update feed ${feedId}:`, err);
      });
    }, interval);

    this.updateIntervals.set(feedId, timeout);
  }
}

export default ThreatIntelligenceService;
