/**
 * Automated Threat Hunting Module
 * Detects threats using hunting rules and pattern matching
 * Executes investigations and generates alerts
 */

import { EventEmitter } from 'events';
import type {
  ThreatHuntingRule,
  HuntingResult,
  ThreatIndicator,
  ThreatLevel,
  ThreatNotification,
  ThreatIncident
} from './types';

interface HuntingContext {
  timeWindow: number;
  lookbackPeriod: number;
  threshold: number;
  pattern: string | Record<string, unknown>;
}

export class AutomatedThreatHunter extends EventEmitter {
  private rules: Map<string, ThreatHuntingRule> = new Map();
  private incidents: Map<string, ThreatIncident> = new Map();
  private notifications: ThreatNotification[] = [];
  private huntingHistory: HuntingResult[] = [];
  private ruleExecutionIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Register a hunting rule
   */
  registerRule(rule: ThreatHuntingRule): void {
    this.rules.set(rule.id, rule);
    this.emit('rule-registered', rule);

    // Start execution if enabled
    if (rule.enabled) {
      this.scheduleRuleExecution(rule);
    }
  }

  /**
   * Deregister a hunting rule
   */
  deregisterRule(ruleId: string): void {
    this.rules.delete(ruleId);
    this.stopRuleExecution(ruleId);
    this.emit('rule-deregistered', { ruleId });
  }

  /**
   * Execute a hunting rule immediately
   */
  async executeRule(ruleId: string): Promise<HuntingResult | null> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      return null;
    }

    try {
      const result = await this.performHunt(rule);
      this.huntingHistory.push(result);

      // Limit history size
      if (this.huntingHistory.length > 1000) {
        this.huntingHistory.shift();
      }

      // Take action if threshold met
      if (result.matchCount >= rule.threshold) {
        await this.executeActions(rule, result);
      }

      this.emit('rule-executed', result);
      return result;
    } catch (error) {
      console.error(`Failed to execute rule ${ruleId}:`, error);
      this.emit('rule-execution-failed', { ruleId, error });
      return null;
    }
  }

  /**
   * Perform threat hunt based on rule
   */
  private async performHunt(rule: ThreatHuntingRule): Promise<HuntingResult> {
    const context: HuntingContext = {
      timeWindow: rule.timeWindow,
      lookbackPeriod: rule.timeWindow,
      threshold: rule.threshold,
      pattern: rule.pattern
    };

    let matched = false;
    let matchCount = 0;
    let indicators: string[] = [];
    let entities: string[] = [];
    let severity: ThreatLevel = 'low';

    // Simulate pattern matching based on rule type
    switch (rule.type) {
      case 'behavioral':
        ({ matched, matchCount, severity } = await this.matchBehavioralPattern(context));
        break;

      case 'indicator': {
        const result = await this.matchIndicatorPattern(context, rule.indicators || []);
        matched = result.matched;
        matchCount = result.matchCount;
        indicators = result.indicators;
        break;
      }

      case 'statistical':
        ({ matched, matchCount, severity } = await this.matchStatisticalPattern(context));
        break;

      case 'rule_based': {
        const result = await this.matchRuleBasedPattern(context);
        matched = result.matched;
        matchCount = result.matchCount;
        entities = result.entities;
        break;
      }

      case 'ml_based':
        ({ matched, matchCount, severity } = await this.matchMLPattern(context));
        break;
    }

    return {
      ruleId: rule.id,
      matched,
      matchCount,
      indicators,
      entities,
      severity,
      timestamp: Date.now(),
      details: {
        timeWindow: context.timeWindow,
        pattern: context.pattern,
        threshold: context.threshold
      }
    };
  }

  /**
   * Match behavioral patterns
   */
  private async matchBehavioralPattern(context: HuntingContext): Promise<{
    matched: boolean;
    matchCount: number;
    severity: ThreatLevel;
  }> {
    // Simulate behavioral pattern matching
    // In production, this would analyze actual behavioral data
    const matchCount = Math.floor(Math.random() * 10);
    const matched = matchCount > 0;

    let severity: ThreatLevel = 'low';
    if (matchCount > 5) severity = 'high';
    if (matchCount > 10) severity = 'critical';

    return { matched, matchCount, severity };
  }

  /**
   * Match indicator patterns
   */
  private async matchIndicatorPattern(
    context: HuntingContext,
    indicators: ThreatIndicator[]
  ): Promise<{ matched: boolean; matchCount: number; indicators: string[] }> {
    const matchedIndicators: string[] = [];

    // Simulate indicator matching
    for (const indicator of indicators) {
      // In production, would check against actual data
      if (Math.random() > 0.7) {
        matchedIndicators.push(indicator.value);
      }
    }

    return {
      matched: matchedIndicators.length > 0,
      matchCount: matchedIndicators.length,
      indicators: matchedIndicators
    };
  }

  /**
   * Match statistical patterns
   */
  private async matchStatisticalPattern(context: HuntingContext): Promise<{
    matched: boolean;
    matchCount: number;
    severity: ThreatLevel;
  }> {
    // Simulate statistical anomaly detection
    const deviation = Math.random() * 5;
    const matchCount = Math.floor(deviation * 2);
    const matched = deviation > 3;

    let severity: ThreatLevel = 'low';
    if (deviation > 3) severity = 'medium';
    if (deviation > 4) severity = 'high';

    return { matched, matchCount, severity };
  }

  /**
   * Match rule-based patterns
   */
  private async matchRuleBasedPattern(context: HuntingContext): Promise<{
    matched: boolean;
    matchCount: number;
    entities: string[];
  }> {
    // Simulate rule-based pattern matching
    const entities: string[] = [];
    const matchCount = Math.floor(Math.random() * 5);

    for (let i = 0; i < matchCount; i++) {
      entities.push(`entity-${i}`);
    }

    return {
      matched: matchCount > 0,
      matchCount,
      entities
    };
  }

  /**
   * Match ML-based patterns
   */
  private async matchMLPattern(context: HuntingContext): Promise<{
    matched: boolean;
    matchCount: number;
    severity: ThreatLevel;
  }> {
    // Simulate ML-based pattern matching
    const confidence = Math.random();
    const matchCount = confidence > 0.7 ? Math.floor(Math.random() * 10) : 0;
    const matched = confidence > 0.7;

    let severity: ThreatLevel = 'low';
    if (confidence > 0.8) severity = 'medium';
    if (confidence > 0.9) severity = 'high';

    return { matched, matchCount, severity };
  }

  /**
   * Execute actions for matched rule
   */
  private async executeActions(rule: ThreatHuntingRule, result: HuntingResult): Promise<void> {
    for (const action of rule.actions) {
      switch (action.type) {
        case 'alert':
          await this.createAlert(rule, result);
          break;

        case 'quarantine':
          await this.quarantineIndicators(rule, result);
          break;

        case 'block':
          await this.blockIndicators(rule, result);
          break;

        case 'log':
          console.log(`[HUNTING] Rule ${rule.id} matched:`, result);
          break;

        case 'investigate':
          await this.initiateInvestigation(rule, result);
          break;

        case 'notify':
          await this.notifySecurityTeam(rule, result);
          break;
      }
    }
  }

  /**
   * Create alert from hunting result
   */
  private async createAlert(rule: ThreatHuntingRule, result: HuntingResult): Promise<void> {
    const notification: ThreatNotification = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      threatLevel: result.severity,
      title: `Threat Hunt Alert: ${rule.name}`,
      description: rule.description,
      indicators: result.indicators,
      affectedEntities: result.entities,
      source: 'threat-hunter',
      actionItems: [
        'Review affected entities',
        'Investigate indicators',
        'Take containment action if needed'
      ],
      read: false
    };

    this.notifications.push(notification);
    this.emit('alert-created', notification);
  }

  /**
   * Quarantine indicators
   */
  private async quarantineIndicators(
    rule: ThreatHuntingRule,
    result: HuntingResult
  ): Promise<void> {
    console.log(`[QUARANTINE] Quarantining ${result.indicators.length} indicators from rule ${rule.id}`);
    this.emit('quarantine-initiated', {
      ruleId: rule.id,
      indicators: result.indicators,
      timestamp: Date.now()
    });
  }

  /**
   * Block indicators
   */
  private async blockIndicators(rule: ThreatHuntingRule, result: HuntingResult): Promise<void> {
    console.log(`[BLOCK] Blocking ${result.indicators.length} indicators from rule ${rule.id}`);
    this.emit('block-initiated', {
      ruleId: rule.id,
      indicators: result.indicators,
      timestamp: Date.now()
    });
  }

  /**
   * Initiate investigation
   */
  private async initiateInvestigation(
    rule: ThreatHuntingRule,
    result: HuntingResult
  ): Promise<void> {
    const incident: ThreatIncident = {
      id: `incident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'investigating',
      severity: result.severity,
      title: `Investigation: ${rule.name}`,
      description: rule.description,
      indicators: rule.indicators || [],
      affectedEntities: result.entities,
      mitigationSteps: [
        'Collect forensic evidence',
        'Analyze affected systems',
        'Identify root cause'
      ],
      tags: ['automated-hunt', rule.id]
    };

    this.incidents.set(incident.id, incident);
    this.emit('investigation-initiated', incident);
  }

  /**
   * Notify security team
   */
  private async notifySecurityTeam(rule: ThreatHuntingRule, result: HuntingResult): Promise<void> {
    const notification: ThreatNotification = {
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      threatLevel: result.severity,
      title: `Security Team Notification: ${rule.name}`,
      description: `Rule matched with ${result.matchCount} indicators`,
      indicators: result.indicators,
      affectedEntities: result.entities,
      source: 'threat-hunter',
      actionItems: ['Review threat hunting results', 'Take action if needed'],
      read: false
    };

    this.notifications.push(notification);
    console.log(`[NOTIFY] Notifying security team:`, notification);
    this.emit('team-notification', notification);
  }

  /**
   * Get hunting history
   */
  getHuntingHistory(ruleId?: string, limit: number = 100): HuntingResult[] {
    let history = this.huntingHistory;

    if (ruleId) {
      history = history.filter(r => r.ruleId === ruleId);
    }

    return history.slice(-limit);
  }

  /**
   * Get active incidents
   */
  getActiveIncidents(): ThreatIncident[] {
    return Array.from(this.incidents.values()).filter(
      incident => incident.status !== 'closed' && incident.status !== 'resolved'
    );
  }

  /**
   * Get notifications
   */
  getNotifications(limit: number = 50): ThreatNotification[] {
    return this.notifications.slice(-limit);
  }

  /**
   * Mark notification as read
   */
  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.emit('notification-read', notificationId);
    }
  }

  /**
   * Get hunting statistics
   */
  getHuntingStatistics(): {
    totalRules: number;
    enabledRules: number;
    rulesExecuted: number;
    totalMatches: number;
    activeIncidents: number;
    unreadNotifications: number;
  } {
    const enabledRules = Array.from(this.rules.values()).filter(r => r.enabled).length;
    const totalMatches = this.huntingHistory.reduce((sum, h) => sum + h.matchCount, 0);
    const activeIncidents = this.getActiveIncidents().length;
    const unreadNotifications = this.notifications.filter(n => !n.read).length;

    return {
      totalRules: this.rules.size,
      enabledRules,
      rulesExecuted: this.huntingHistory.length,
      totalMatches,
      activeIncidents,
      unreadNotifications
    };
  }

  // Private helper methods

  private scheduleRuleExecution(rule: ThreatHuntingRule): void {
    const interval = setInterval(() => {
      this.executeRule(rule.id).catch(err => {
        console.error(`Failed to execute rule ${rule.id}:`, err);
      });
    }, rule.timeWindow);

    this.ruleExecutionIntervals.set(rule.id, interval);
  }

  private stopRuleExecution(ruleId: string): void {
    const interval = this.ruleExecutionIntervals.get(ruleId);
    if (interval) {
      clearInterval(interval);
      this.ruleExecutionIntervals.delete(ruleId);
    }
  }
}

export default AutomatedThreatHunter;
