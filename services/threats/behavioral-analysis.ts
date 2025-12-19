/**
 * Behavioral Analysis Module
 * Detects anomalies in user and system behavior patterns
 * Uses statistical analysis and ML-based detection
 */

import { EventEmitter } from 'events';

import type {
  BehaviorProfile,
  AnomalyDetectionResult,
  ThreatLevel
} from './types';

interface BehaviorBaseline {
  entityId: string;
  mean: number;
  stdDev: number;
  min: number;
  max: number;
}

interface TimeSeriesData {
  timestamp: number;
  value: number;
}

export class BehavioralAnalyzer extends EventEmitter {
  private profiles: Map<string, BehaviorProfile[]> = new Map();
  private baselines: Map<string, BehaviorBaseline> = new Map();
  private anomalyThresholds: Record<string, number> = {
    zScore: 3.0, // 3 standard deviations
    outlierPercentile: 95,
    frequencyChange: 2.0, // 2x increase
    timeDeviation: 60 // minutes
  };

  /**
   * Record a behavior profile for an entity
   */
  recordBehavior(profile: BehaviorProfile): void {
    const key = `${profile.entityType}:${profile.entityId}`;
    const existingProfiles = this.profiles.get(key) || [];

    // Keep only last 1000 profiles per entity
    if (existingProfiles.length >= 1000) {
      existingProfiles.shift();
    }

    existingProfiles.push(profile);
    this.profiles.set(key, existingProfiles);

    // Update baselines if we have enough data
    if (existingProfiles.length >= 30) {
      this.updateBaseline(key, existingProfiles);
    }
  }

  /**
   * Analyze current behavior against historical patterns
   */
  analyzeBehavior(profile: BehaviorProfile): AnomalyDetectionResult[] {
    const key = `${profile.entityType}:${profile.entityId}`;
    const anomalies: AnomalyDetectionResult[] = [];

    // Check each anomaly type
    const timeDeviation = this.detectTimeDeviation(profile);
    if (timeDeviation) {
      anomalies.push(timeDeviation);
    }

    const frequencyAnomaly = this.detectAccessFrequencyAnomaly(key, profile);
    if (frequencyAnomaly) {
      anomalies.push(frequencyAnomaly);
    }

    const locationAnomaly = this.detectLocationAnomaly(key, profile);
    if (locationAnomaly) {
      anomalies.push(locationAnomaly);
    }

    const accessAnomaly = this.detectAccessPatternAnomaly(key, profile);
    if (accessAnomaly) {
      anomalies.push(accessAnomaly);
    }

    const privilegeAnomaly = this.detectPrivilegeEscalation(key, profile);
    if (privilegeAnomaly) {
      anomalies.push(privilegeAnomaly);
    }

    const volumeAnomaly = this.detectDataVolumeAnomaly(key, profile);
    if (volumeAnomaly) {
      anomalies.push(volumeAnomaly);
    }

    // Record and emit if anomalies found
    if (anomalies.length > 0) {
      anomalies.forEach(anomaly => {
        this.emit('anomaly-detected', anomaly);
      });
    }

    return anomalies;
  }

  /**
   * Calculate risk score for an entity based on behavior
   */
  calculateRiskScore(entityId: string, entityType: string): number {
    const key = `${entityType}:${entityId}`;
    const profiles = this.profiles.get(key) || [];

    if (profiles.length === 0) {
      return 0;
    }

    // Calculate risk based on recent anomalies
    let riskScore = 0;
    const recentProfiles = profiles.slice(-10); // Last 10 profiles

    for (const profile of recentProfiles) {
      riskScore += profile.riskScore || 0;
    }

    // Average and normalize to 0-100
    const avgRisk = recentProfiles.length > 0 ? (riskScore / recentProfiles.length) : 0;
    return Math.min(100, Math.max(0, avgRisk));
  }

  /**
   * Get behavior profile for an entity
   */
  getBehaviorProfile(entityId: string, entityType: string): BehaviorProfile | undefined {
    const key = `${entityType}:${entityId}`;
    const profiles = this.profiles.get(key);
    return profiles ? profiles[profiles.length - 1] : undefined;
  }

  /**
   * Get historical behavior data for trending
   */
  getBehaviorHistory(
    entityId: string,
    entityType: string,
    limit: number = 100
  ): BehaviorProfile[] {
    const key = `${entityType}:${entityId}`;
    const profiles = this.profiles.get(key) || [];
    return profiles.slice(-limit);
  }

  /**
   * Clear behavior history for an entity
   */
  clearHistory(entityId: string, entityType: string): void {
    const key = `${entityType}:${entityId}`;
    this.profiles.delete(key);
    this.baselines.delete(key);
  }

  /**
   * Get anomaly detection statistics
   */
  getStatistics(): {
    totalEntities: number;
    totalProfiles: number;
    anomaliesDetected: number;
  } {
    let totalProfiles = 0;
    const profilesIterator = this.profiles.values();
    let current = profilesIterator.next();
    while (!current.done) {
      totalProfiles += current.value.length;
      current = profilesIterator.next();
    }

    return {
      totalEntities: this.profiles.size,
      totalProfiles,
      anomaliesDetected: 0 // Would be tracked separately
    };
  }

  // Private helper methods

  private updateBaseline(key: string, profiles: BehaviorProfile[]): void {
    const frequencies = profiles.map(p => p.features.accessFrequency);

    const mean = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
    const variance = frequencies.reduce((sum, freq) => sum + Math.pow(freq - mean, 2), 0) / frequencies.length;
    const stdDev = Math.sqrt(variance);

    this.baselines.set(key, {
      entityId: key,
      mean,
      stdDev,
      min: Math.min(...frequencies),
      max: Math.max(...frequencies)
    });
  }

  private detectTimeDeviation(profile: BehaviorProfile): AnomalyDetectionResult | null {
    const expectedHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18]; // Business hours
    const accessHour = new Date(profile.timestamp).getHours();

    if (!expectedHours.includes(accessHour)) {
      return {
        entityId: profile.entityId,
        entityType: profile.entityType,
        detected: true,
        anomalyType: 'suspicious_login',
        severity: this.calculateSeverity(0.6),
        confidence: 0.6,
        description: `Unusual access time: ${accessHour}:00 hours (outside business hours)`,
        evidence: { hour: accessHour, expectedHours },
        timestamp: profile.timestamp
      };
    }

    return null;
  }

  private detectAccessFrequencyAnomaly(
    key: string,
    profile: BehaviorProfile
  ): AnomalyDetectionResult | null {
    const baseline = this.baselines.get(key);
    if (!baseline) return null;

    const frequency = profile.features.accessFrequency;
    const zScore = Math.abs((frequency - baseline.mean) / (baseline.stdDev || 1));

    if (zScore > this.anomalyThresholds.zScore) {
      return {
        entityId: profile.entityId,
        entityType: profile.entityType,
        detected: true,
        anomalyType: 'unusual_access_pattern',
        severity: this.calculateSeverity(Math.min(1.0, zScore / 5)),
        confidence: Math.min(1.0, zScore / 5),
        description: `Unusual access frequency: ${frequency} (baseline: ${baseline.mean.toFixed(2)})`,
        evidence: { frequency, baseline: baseline.mean, zScore },
        timestamp: profile.timestamp
      };
    }

    return null;
  }

  private detectLocationAnomaly(
    key: string,
    profile: BehaviorProfile
  ): AnomalyDetectionResult | null {
    const profiles = this.profiles.get(key) || [];
    if (profiles.length < 5) return null;

    const recentLocations = profiles
      .slice(-5)
      .map(p => p.features.geolocation)
      .filter(Boolean) as string[];

    if (recentLocations.length === 0) return null;

    const uniqueLocations = new Set(recentLocations);
    const currentLocation = profile.features.geolocation;

    // If we see 3+ different locations in last 5 accesses, flag as anomaly
    if (uniqueLocations.size >= 3 && currentLocation) {
      const isNewLocation = !recentLocations.includes(currentLocation);
      if (isNewLocation) {
        return {
          entityId: profile.entityId,
          entityType: profile.entityType,
          detected: true,
          anomalyType: 'unusual_access_pattern',
          severity: 'medium',
          confidence: 0.75,
          description: `Access from new location: ${currentLocation}. Multiple locations detected recently.`,
          evidence: { currentLocation, previousLocations: Array.from(uniqueLocations) },
          timestamp: profile.timestamp
        };
      }
    }

    return null;
  }

  private detectAccessPatternAnomaly(
    key: string,
    profile: BehaviorProfile
  ): AnomalyDetectionResult | null {
    const profiles = this.profiles.get(key) || [];
    if (profiles.length < 10) return null;

    const recentProfiles = profiles.slice(-10);
    const currentEndpoints = new Set(profile.features.apiEndpoints);
    const historicalEndpoints = new Set<string>();

    for (const p of recentProfiles) {
      for (const endpoint of p.features.apiEndpoints) {
        historicalEndpoints.add(endpoint);
      }
    }

    // If accessing many new endpoints, flag as anomaly
    const newEndpoints = Array.from(currentEndpoints).filter(e => !historicalEndpoints.has(e));
    if (newEndpoints.length > 0 && newEndpoints.length / currentEndpoints.size > 0.5) {
      return {
        entityId: profile.entityId,
        entityType: profile.entityType,
        detected: true,
        anomalyType: 'unusual_access_pattern',
        severity: 'medium',
        confidence: 0.7,
        description: `${newEndpoints.length} new API endpoints accessed`,
        evidence: { newEndpoints, totalEndpoints: currentEndpoints.size },
        timestamp: profile.timestamp
      };
    }

    return null;
  }

  private detectPrivilegeEscalation(
    key: string,
    profile: BehaviorProfile
  ): AnomalyDetectionResult | null {
    const profiles = this.profiles.get(key) || [];
    if (profiles.length < 3) return null;

    const previousProfile = profiles[profiles.length - 2];
    if (!previousProfile) return null;

    // Check if accessing admin endpoints when they didn't before
    const adminEndpoints = profile.features.apiEndpoints.filter(e =>
      e.includes('/admin') || e.includes('/system') || e.includes('/config')
    );

    const previousAdminEndpoints = previousProfile.features.apiEndpoints.filter(e =>
      e.includes('/admin') || e.includes('/system') || e.includes('/config')
    );

    if (adminEndpoints.length > 0 && previousAdminEndpoints.length === 0) {
      return {
        entityId: profile.entityId,
        entityType: profile.entityType,
        detected: true,
        anomalyType: 'privilege_escalation',
        severity: 'high',
        confidence: 0.85,
        description: `Privilege escalation detected: accessing admin endpoints`,
        evidence: { newAdminEndpoints: adminEndpoints },
        timestamp: profile.timestamp
      };
    }

    return null;
  }

  private detectDataVolumeAnomaly(
    key: string,
    profile: BehaviorProfile
  ): AnomalyDetectionResult | null {
    const baseline = this.baselines.get(key);
    if (!baseline) return null;

    const dataAccessCount = profile.features.dataAccessed.length;
    const threshold = (baseline.max + baseline.mean) / 2;

    if (dataAccessCount > threshold * 2) {
      return {
        entityId: profile.entityId,
        entityType: profile.entityType,
        detected: true,
        anomalyType: 'data_exfiltration',
        severity: 'high',
        confidence: 0.8,
        description: `Abnormal data access volume: ${dataAccessCount} items (expected: ~${threshold.toFixed(0)})`,
        evidence: { accessCount: dataAccessCount, threshold },
        timestamp: profile.timestamp
      };
    }

    return null;
  }

  private calculateSeverity(confidence: number): ThreatLevel {
    if (confidence >= 0.9) return 'critical';
    if (confidence >= 0.75) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }
}

export default BehavioralAnalyzer;
