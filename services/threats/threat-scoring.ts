/**
 * Threat Scoring and Prioritization Module
 * Calculates threat severity scores based on multiple factors
 */

import { EventEmitter } from 'events';

import type {
  ThreatScore,
  ThreatLevel,
  ThreatAnalysisResult,
  AnomalyDetectionResult,
  BehaviorProfile
} from './types';

interface ScoringWeights {
  indicators: number;
  behavioral: number;
  historical: number;
  temporal: number;
}

export class ThreatScorer extends EventEmitter {
  private scores: Map<string, ThreatScore> = new Map();
  private weights: ScoringWeights = {
    indicators: 0.4, // 40% from threat intel indicators
    behavioral: 0.35, // 35% from behavioral analysis
    historical: 0.15, // 15% from historical patterns
    temporal: 0.1 // 10% from temporal factors
  };

  private severityThresholds: Record<ThreatLevel, { min: number; max: number }> = {
    critical: { min: 80, max: 100 },
    high: { min: 60, max: 79 },
    medium: { min: 40, max: 59 },
    low: { min: 20, max: 39 },
    clean: { min: 0, max: 19 }
  };

  /**
   * Calculate threat score from analysis results
   */
  calculateScore(
    entityId: string,
    entityType: string,
    analysisResults: ThreatAnalysisResult[],
    anomalies: AnomalyDetectionResult[],
    behaviorProfile?: BehaviorProfile
  ): ThreatScore {
    const indicators = this.scoreIndicators(analysisResults);
    const behavioral = this.scoreBehavioral(anomalies, behaviorProfile);
    const historical = this.scoreHistorical(entityId, entityType);
    const temporal = this.scoreTemporal(analysisResults, anomalies);

    const overall =
      indicators * this.weights.indicators +
      behavioral * this.weights.behavioral +
      historical * this.weights.historical +
      temporal * this.weights.temporal;

    const level = this.levelFromScore(overall);
    const key = `${entityType}:${entityId}`;

    const score: ThreatScore = {
      entityId,
      entityType,
      overall: Math.round(overall),
      factors: {
        indicators: Math.round(indicators),
        behavioral: Math.round(behavioral),
        historical: Math.round(historical),
        temporal: Math.round(temporal)
      },
      level,
      justification: this.generateJustification(indicators, behavioral, historical, temporal),
      recommendations: this.generateRecommendations(
        level,
        analysisResults,
        anomalies,
        behaviorProfile
      ),
      lastUpdated: Date.now()
    };

    this.scores.set(key, score);
    this.emit('score-calculated', score);

    return score;
  }

  /**
   * Get existing threat score for entity
   */
  getScore(entityId: string, entityType: string): ThreatScore | undefined {
    const key = `${entityType}:${entityId}`;
    return this.scores.get(key);
  }

  /**
   * Get all scores sorted by severity
   */
  getAllScoresSorted(): ThreatScore[] {
    const levelOrder: Record<ThreatLevel, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      clean: 4
    };

    return Array.from(this.scores.values()).sort(
      (a, b) => levelOrder[a.level] - levelOrder[b.level]
    );
  }

  /**
   * Get high-risk entities (critical and high threats)
   */
  getHighRiskEntities(): ThreatScore[] {
    return Array.from(this.scores.values()).filter(score =>
      score.level === 'critical' || score.level === 'high'
    );
  }

  /**
   * Prioritize threat response actions
   */
  prioritizeThreats(scores: ThreatScore[]): ThreatScore[] {
    return scores.sort((a, b) => {
      // First by level
      const levelOrder: Record<ThreatLevel, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
        clean: 4
      };

      const levelDiff = levelOrder[a.level] - levelOrder[b.level];
      if (levelDiff !== 0) return levelDiff;

      // Then by overall score
      return b.overall - a.overall;
    });
  }

  /**
   * Update scoring weights
   */
  setWeights(weights: Partial<ScoringWeights>): void {
    const totalWeight = Object.values({ ...this.weights, ...weights }).reduce((a, b) => a + b, 0);

    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new Error('Weights must sum to 1.0');
    }

    this.weights = { ...this.weights, ...weights };
    this.emit('weights-updated', this.weights);
  }

  /**
   * Get scoring statistics
   */
  getStatistics(): {
    totalScored: number;
    byLevel: Record<ThreatLevel, number>;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
  } {
    const scores = Array.from(this.scores.values());
    const byLevel: Record<ThreatLevel, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      clean: 0
    };

    let totalScore = 0;
    let highest = 0;
    let lowest = 100;

    for (const score of scores) {
      byLevel[score.level]++;
      totalScore += score.overall;
      highest = Math.max(highest, score.overall);
      lowest = Math.min(lowest, score.overall);
    }

    return {
      totalScored: scores.length,
      byLevel,
      averageScore: scores.length > 0 ? Math.round(totalScore / scores.length) : 0,
      highestScore: highest,
      lowestScore: lowest
    };
  }

  // Private helper methods

  private scoreIndicators(results: ThreatAnalysisResult[]): number {
    if (results.length === 0) return 0;

    let totalScore = 0;
    const severityWeights: Record<ThreatLevel, number> = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25,
      clean: 0
    };

    for (const result of results) {
      const weight = severityWeights[result.threatLevel];
      const confidence = result.confidence || 0;
      totalScore += weight * confidence;
    }

    return Math.min(100, totalScore / results.length);
  }

  private scoreBehavioral(
    anomalies: AnomalyDetectionResult[],
    profile?: BehaviorProfile
  ): number {
    if (anomalies.length === 0) {
      return profile ? profile.riskScore * 0.5 : 0;
    }

    let totalScore = 0;
    const severityWeights: Record<ThreatLevel, number> = {
      critical: 100,
      high: 75,
      medium: 50,
      low: 25,
      clean: 0
    };

    for (const anomaly of anomalies) {
      const weight = severityWeights[anomaly.severity];
      const confidence = anomaly.confidence || 0;
      totalScore += weight * confidence;
    }

    let avgScore = totalScore / anomalies.length;

    // Factor in profile's risk score if available
    if (profile) {
      avgScore = (avgScore + profile.riskScore) / 2;
    }

    return Math.min(100, avgScore);
  }

  private scoreHistorical(entityId: string, entityType: string): number {
    // This would connect to incident database
    // For now, return baseline based on stored history
    const key = `${entityType}:${entityId}`;
    const existingScore = this.scores.get(key);

    if (!existingScore) return 0;

    // If entity was previously flagged, increase score
    if (existingScore.level === 'critical' || existingScore.level === 'high') {
      return 30; // Moderate increase for repeat offenders
    }

    return 0;
  }

  private scoreTemporal(
    analysisResults: ThreatAnalysisResult[],
    anomalies: AnomalyDetectionResult[]
  ): number {
    const now = Date.now();
    let recentCount = 0;
    let totalItems = 0;

    // Score recent analysis results (within last 24 hours)
    const oneDay = 24 * 60 * 60 * 1000;
    for (const result of analysisResults) {
      totalItems++;
      if (now - result.analysisDate.getTime() < oneDay) {
        recentCount++;
      }
    }

    // Score recent anomalies (within last 1 hour)
    const oneHour = 60 * 60 * 1000;
    for (const anomaly of anomalies) {
      totalItems++;
      if (now - anomaly.timestamp < oneHour) {
        recentCount++;
      }
    }

    if (totalItems === 0) return 0;

    // More recent = higher score
    const recencyRatio = recentCount / totalItems;
    return recencyRatio * 100;
  }

  private levelFromScore(score: number): ThreatLevel {
    for (const [level, range] of Object.entries(this.severityThresholds)) {
      if (score >= range.min && score <= range.max) {
        return level as ThreatLevel;
      }
    }
    return 'clean';
  }

  private generateJustification(
    indicators: number,
    behavioral: number,
    historical: number,
    temporal: number
  ): string[] {
    const justifications: string[] = [];

    if (indicators > 70) {
      justifications.push('High number of malicious indicators detected');
    } else if (indicators > 40) {
      justifications.push('Multiple threat intelligence matches');
    }

    if (behavioral > 70) {
      justifications.push('Multiple behavioral anomalies detected');
    } else if (behavioral > 40) {
      justifications.push('Unusual behavior patterns observed');
    }

    if (historical > 50) {
      justifications.push('Previous incidents or warnings associated with entity');
    }

    if (temporal > 60) {
      justifications.push('Threats detected recently indicate ongoing activity');
    }

    if (justifications.length === 0) {
      justifications.push('Low threat indicators across all factors');
    }

    return justifications;
  }

  private generateRecommendations(
    level: ThreatLevel,
    analysisResults: ThreatAnalysisResult[],
    anomalies: AnomalyDetectionResult[],
    profile?: BehaviorProfile
  ): string[] {
    const recommendations: string[] = [];

    switch (level) {
      case 'critical':
        recommendations.push('IMMEDIATE: Isolate affected system');
        recommendations.push('Block all associated IP addresses and domains');
        recommendations.push('Revoke potentially compromised credentials');
        recommendations.push('Initiate incident response procedure');
        recommendations.push('Notify security team immediately');
        break;

      case 'high':
        recommendations.push('Increase monitoring of affected entity');
        recommendations.push('Block identified malicious indicators');
        recommendations.push('Review access logs for suspicious activity');
        recommendations.push('Consider credential rotation if user-related');
        break;

      case 'medium':
        recommendations.push('Monitor closely for escalation');
        recommendations.push('Review flagged activity details');
        recommendations.push('Consider temporary access restrictions');
        recommendations.push('Update detection rules if new pattern detected');
        break;

      case 'low':
        recommendations.push('Continue normal monitoring');
        recommendations.push('Log incident for future reference');
        break;

      case 'clean':
        recommendations.push('No action required');
        break;
    }

    // Add specific recommendations based on anomalies
    for (const anomaly of anomalies) {
      switch (anomaly.anomalyType) {
        case 'privilege_escalation':
          recommendations.push('Review privilege assignment for this entity');
          recommendations.push('Check for unauthorized role changes');
          break;

        case 'data_exfiltration':
          recommendations.push('Review data access patterns');
          recommendations.push('Monitor outbound traffic');
          break;

        case 'brute_force':
          recommendations.push('Implement rate limiting');
          recommendations.push('Enable MFA if available');
          break;

        case 'lateral_movement':
          recommendations.push('Review network segmentation');
          recommendations.push('Check for compromised credentials');
          break;
      }
    }

    // Remove duplicates
    return Array.from(new Set(recommendations));
  }
}

export default ThreatScorer;
