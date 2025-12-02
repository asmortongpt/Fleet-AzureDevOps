/**
 * Vehicle Health Score Service
 * Calculates comprehensive vehicle health score (0-100) based on multiple factors
 */

import {
  DTCCode,
  DTCSeverity,
  LivePIDData,
  ReadinessMonitors,
  MonitorStatus,
  VehicleInfo,
} from '../types/obd2';

// ============================================================================
// Types
// ============================================================================

export interface HealthScoreBreakdown {
  totalScore: number; // 0-100
  dtcScore: number; // 0-100
  metricsScore: number; // 0-100
  readinessScore: number; // 0-100
  maintenanceScore: number; // 0-100
  recommendations: Recommendation[];
  riskLevel: RiskLevel;
}

export enum RiskLevel {
  LOW = 'low', // 80-100
  MODERATE = 'moderate', // 60-79
  HIGH = 'high', // 40-59
  CRITICAL = 'critical', // 0-39
}

export enum RecommendationPriority {
  IMMEDIATE = 'immediate',
  URGENT = 'urgent',
  SCHEDULED = 'scheduled',
  ROUTINE = 'routine',
}

export interface Recommendation {
  id: string;
  priority: RecommendationPriority;
  title: string;
  description: string;
  estimatedCost?: string;
  action?: string;
  relatedDTC?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const WEIGHTS = {
  DTC: 0.35, // 35% - Most important factor
  METRICS: 0.30, // 30% - Real-time sensor data
  READINESS: 0.20, // 20% - Readiness monitors
  MAINTENANCE: 0.15, // 15% - Service schedule
};

const DTC_SEVERITY_POINTS = {
  [DTCSeverity.CRITICAL]: 30, // -30 points per critical DTC
  [DTCSeverity.WARNING]: 15, // -15 points per warning DTC
  [DTCSeverity.INFORMATIONAL]: 5, // -5 points per informational DTC
};

const METRIC_THRESHOLDS = {
  coolantTemp: { min: 180, max: 220, critical: 240 }, // °F
  oilPressure: { min: 20, max: 80, critical: 10 }, // PSI
  batteryVoltage: { min: 12.6, max: 14.7, critical: 11.8 }, // V
  engineLoad: { min: 0, max: 85, critical: 95 }, // %
  fuelTrim: { min: -10, max: 10, critical: 25 }, // %
};

// ============================================================================
// Vehicle Health Score Calculator
// ============================================================================

export class VehicleHealthScoreCalculator {
  /**
   * Calculate comprehensive vehicle health score
   */
  static calculateHealthScore(
    dtcCodes: DTCCode[],
    liveData: LivePIDData | undefined,
    readinessMonitors: ReadinessMonitors,
    vehicleInfo: VehicleInfo
  ): HealthScoreBreakdown {
    const dtcScore = this.calculateDTCScore(dtcCodes);
    const metricsScore = liveData
      ? this.calculateMetricsScore(liveData)
      : 100; // No live data = assume OK
    const readinessScore = this.calculateReadinessScore(readinessMonitors);
    const maintenanceScore = this.calculateMaintenanceScore(vehicleInfo);

    // Calculate weighted total score
    const totalScore = Math.round(
      dtcScore * WEIGHTS.DTC +
        metricsScore * WEIGHTS.METRICS +
        readinessScore * WEIGHTS.READINESS +
        maintenanceScore * WEIGHTS.MAINTENANCE
    );

    const riskLevel = this.determineRiskLevel(totalScore);
    const recommendations = this.generateRecommendations(
      dtcCodes,
      liveData,
      readinessMonitors,
      vehicleInfo,
      totalScore
    );

    return {
      totalScore,
      dtcScore,
      metricsScore,
      readinessScore,
      maintenanceScore,
      recommendations,
      riskLevel,
    };
  }

  // ==========================================================================
  // DTC Score Calculation
  // ==========================================================================

  private static calculateDTCScore(dtcCodes: DTCCode[]): number {
    if (dtcCodes.length === 0) {
      return 100;
    }

    let deductions = 0;

    for (const dtc of dtcCodes) {
      deductions += DTC_SEVERITY_POINTS[dtc.severity];
    }

    // Cap deductions at 100 points
    deductions = Math.min(deductions, 100);

    return Math.max(0, 100 - deductions);
  }

  // ==========================================================================
  // Metrics Score Calculation
  // ==========================================================================

  private static calculateMetricsScore(liveData: LivePIDData): number {
    let score = 100;
    let checks = 0;

    // Check coolant temperature
    if (liveData.coolantTemp) {
      const tempF = this.celsiusToFahrenheit(liveData.coolantTemp);
      const tempCheck = this.checkMetric(
        tempF,
        METRIC_THRESHOLDS.coolantTemp.min,
        METRIC_THRESHOLDS.coolantTemp.max,
        METRIC_THRESHOLDS.coolantTemp.critical
      );
      score -= tempCheck.deduction;
      checks++;
    }

    // Check oil pressure (if available)
    if (liveData.oilPressure) {
      const pressurePsi = this.kpaToPsi(liveData.oilPressure);
      const pressureCheck = this.checkMetric(
        pressurePsi,
        METRIC_THRESHOLDS.oilPressure.min,
        METRIC_THRESHOLDS.oilPressure.max,
        METRIC_THRESHOLDS.oilPressure.critical
      );
      score -= pressureCheck.deduction;
      checks++;
    }

    // Check battery voltage
    if (liveData.batteryVoltage) {
      const voltageCheck = this.checkMetric(
        liveData.batteryVoltage,
        METRIC_THRESHOLDS.batteryVoltage.min,
        METRIC_THRESHOLDS.batteryVoltage.max,
        METRIC_THRESHOLDS.batteryVoltage.critical
      );
      score -= voltageCheck.deduction;
      checks++;
    }

    // Check engine load
    if (liveData.engineLoad) {
      const loadCheck = this.checkMetric(
        liveData.engineLoad,
        METRIC_THRESHOLDS.engineLoad.min,
        METRIC_THRESHOLDS.engineLoad.max,
        METRIC_THRESHOLDS.engineLoad.critical
      );
      score -= loadCheck.deduction;
      checks++;
    }

    // Check fuel trim (both short and long term)
    const totalFuelTrim =
      Math.abs(liveData.shortTermFuelTrim) +
      Math.abs(liveData.longTermFuelTrim);
    if (totalFuelTrim > METRIC_THRESHOLDS.fuelTrim.critical) {
      score -= 20; // Major fuel system issue
    } else if (totalFuelTrim > METRIC_THRESHOLDS.fuelTrim.max) {
      score -= 10; // Minor fuel system issue
    }
    checks++;

    return Math.max(0, score);
  }

  private static checkMetric(
    value: number,
    min: number,
    max: number,
    critical: number
  ): { deduction: number; status: string } {
    if (value >= critical || value <= critical) {
      // Critical threshold
      if (
        (max > min && value >= critical) ||
        (max < min && value <= critical)
      ) {
        return { deduction: 25, status: 'critical' };
      }
    }

    if (value < min || value > max) {
      return { deduction: 15, status: 'warning' };
    }

    return { deduction: 0, status: 'normal' };
  }

  // ==========================================================================
  // Readiness Score Calculation
  // ==========================================================================

  private static calculateReadinessScore(
    readinessMonitors: ReadinessMonitors
  ): number {
    const monitors = Object.values(readinessMonitors);
    const supportedMonitors = monitors.filter(
      (status) => status !== MonitorStatus.NOT_SUPPORTED
    );

    if (supportedMonitors.length === 0) {
      return 100; // No monitors = no deduction
    }

    const completeMonitors = supportedMonitors.filter(
      (status) => status === MonitorStatus.COMPLETE
    );

    const completionRate =
      (completeMonitors.length / supportedMonitors.length) * 100;

    return Math.round(completionRate);
  }

  // ==========================================================================
  // Maintenance Score Calculation
  // ==========================================================================

  private static calculateMaintenanceScore(vehicleInfo: VehicleInfo): number {
    let score = 100;

    if (!vehicleInfo.lastServiceDate) {
      // No service history = warning
      score -= 20;
      return score;
    }

    const now = new Date();
    const lastService = new Date(vehicleInfo.lastServiceDate);
    const daysSinceService = Math.floor(
      (now.getTime() - lastService.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check time-based service interval (6 months = 180 days)
    if (daysSinceService > 365) {
      score -= 30; // Over a year overdue
    } else if (daysSinceService > 270) {
      score -= 20; // 9+ months
    } else if (daysSinceService > 180) {
      score -= 10; // 6+ months
    }

    // Check mileage-based service interval
    if (
      vehicleInfo.lastServiceOdometer &&
      vehicleInfo.odometer > vehicleInfo.lastServiceOdometer
    ) {
      const milesSinceService =
        vehicleInfo.odometer - vehicleInfo.lastServiceOdometer;

      if (milesSinceService > 7500) {
        score -= 30; // Way overdue
      } else if (milesSinceService > 5000) {
        score -= 20; // Overdue
      } else if (milesSinceService > 3750) {
        score -= 10; // Due soon
      }
    }

    return Math.max(0, score);
  }

  // ==========================================================================
  // Risk Level Determination
  // ==========================================================================

  private static determineRiskLevel(totalScore: number): RiskLevel {
    if (totalScore >= 80) return RiskLevel.LOW;
    if (totalScore >= 60) return RiskLevel.MODERATE;
    if (totalScore >= 40) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  // ==========================================================================
  // Recommendations Generation
  // ==========================================================================

  private static generateRecommendations(
    dtcCodes: DTCCode[],
    liveData: LivePIDData | undefined,
    readinessMonitors: ReadinessMonitors,
    vehicleInfo: VehicleInfo,
    totalScore: number
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // DTC-based recommendations
    for (const dtc of dtcCodes) {
      if (dtc.severity === DTCSeverity.CRITICAL) {
        recommendations.push({
          id: `dtc-${dtc.code}`,
          priority: RecommendationPriority.IMMEDIATE,
          title: `Critical: ${dtc.code} - ${dtc.description}`,
          description: dtc.recommendedActions?.[0] || 'Immediate service required',
          action: 'Schedule immediate service',
          relatedDTC: dtc.code,
        });
      } else if (dtc.severity === DTCSeverity.WARNING) {
        recommendations.push({
          id: `dtc-${dtc.code}`,
          priority: RecommendationPriority.URGENT,
          title: `Warning: ${dtc.code} - ${dtc.description}`,
          description: dtc.recommendedActions?.[0] || 'Service recommended soon',
          estimatedCost: '$100-$500',
          action: 'Schedule service within 2 weeks',
          relatedDTC: dtc.code,
        });
      }
    }

    // Metrics-based recommendations
    if (liveData) {
      const tempF = this.celsiusToFahrenheit(liveData.coolantTemp);
      if (tempF > METRIC_THRESHOLDS.coolantTemp.critical) {
        recommendations.push({
          id: 'coolant-critical',
          priority: RecommendationPriority.IMMEDIATE,
          title: 'Critical Coolant Temperature',
          description: `Engine temperature is critically high (${Math.round(tempF)}°F). Stop driving immediately to prevent engine damage.`,
          action: 'Pull over safely and turn off engine',
        });
      } else if (tempF > METRIC_THRESHOLDS.coolantTemp.max) {
        recommendations.push({
          id: 'coolant-warning',
          priority: RecommendationPriority.URGENT,
          title: 'High Coolant Temperature',
          description: 'Engine is running hotter than normal. Check coolant level and cooling system.',
          estimatedCost: '$50-$300',
          action: 'Check coolant level and schedule inspection',
        });
      }

      if (
        liveData.batteryVoltage < METRIC_THRESHOLDS.batteryVoltage.critical
      ) {
        recommendations.push({
          id: 'battery-critical',
          priority: RecommendationPriority.IMMEDIATE,
          title: 'Critical Battery Voltage',
          description: `Battery voltage is critically low (${liveData.batteryVoltage.toFixed(1)}V). Vehicle may not start soon.`,
          estimatedCost: '$100-$200',
          action: 'Test battery and charging system immediately',
        });
      } else if (
        liveData.batteryVoltage < METRIC_THRESHOLDS.batteryVoltage.min
      ) {
        recommendations.push({
          id: 'battery-warning',
          priority: RecommendationPriority.URGENT,
          title: 'Low Battery Voltage',
          description: 'Battery voltage is lower than normal. May indicate charging system issue.',
          estimatedCost: '$100-$500',
          action: 'Test battery and alternator',
        });
      }

      if (liveData.oilPressure) {
        const pressurePsi = this.kpaToPsi(liveData.oilPressure);
        if (pressurePsi < METRIC_THRESHOLDS.oilPressure.critical) {
          recommendations.push({
            id: 'oil-pressure-critical',
            priority: RecommendationPriority.IMMEDIATE,
            title: 'Critical Low Oil Pressure',
            description: `Oil pressure is critically low (${Math.round(pressurePsi)} PSI). Stop driving immediately.`,
            action: 'Stop engine and check oil level',
          });
        }
      }
    }

    // Readiness monitor recommendations
    const incompleteMonitors = Object.entries(readinessMonitors).filter(
      ([_, status]) => status === MonitorStatus.INCOMPLETE
    );

    if (incompleteMonitors.length > 0) {
      recommendations.push({
        id: 'readiness-incomplete',
        priority: RecommendationPriority.SCHEDULED,
        title: 'Incomplete Readiness Monitors',
        description: `${incompleteMonitors.length} emission system monitor(s) incomplete. Complete drive cycle for accurate diagnostics.`,
        action: 'Complete a full drive cycle',
      });
    }

    // Maintenance recommendations
    if (vehicleInfo.lastServiceDate) {
      const daysSinceService = Math.floor(
        (new Date().getTime() -
          new Date(vehicleInfo.lastServiceDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysSinceService > 180) {
        recommendations.push({
          id: 'maintenance-overdue',
          priority:
            daysSinceService > 270
              ? RecommendationPriority.URGENT
              : RecommendationPriority.SCHEDULED,
          title: 'Scheduled Maintenance Overdue',
          description: `Last service was ${Math.floor(daysSinceService / 30)} months ago. Regular maintenance is crucial for vehicle longevity.`,
          estimatedCost: '$75-$300',
          action: 'Schedule maintenance service',
        });
      }
    } else {
      recommendations.push({
        id: 'maintenance-unknown',
        priority: RecommendationPriority.ROUTINE,
        title: 'No Service History',
        description: 'No service history recorded. Consider scheduling inspection and maintenance.',
        estimatedCost: '$75-$300',
        action: 'Schedule comprehensive vehicle inspection',
      });
    }

    // General health score recommendations
    if (totalScore < 60) {
      recommendations.push({
        id: 'health-low',
        priority: RecommendationPriority.URGENT,
        title: 'Low Vehicle Health Score',
        description: 'Multiple issues detected. Comprehensive inspection recommended.',
        estimatedCost: '$100-$500',
        action: 'Schedule full diagnostic service',
      });
    }

    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityOrder = {
        [RecommendationPriority.IMMEDIATE]: 0,
        [RecommendationPriority.URGENT]: 1,
        [RecommendationPriority.SCHEDULED]: 2,
        [RecommendationPriority.ROUTINE]: 3,
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  private static celsiusToFahrenheit(celsius: number): number {
    return (celsius * 9) / 5 + 32;
  }

  private static kpaToPsi(kpa: number): number {
    return kpa * 0.145038;
  }
}

// ============================================================================
// Export convenience function
// ============================================================================

export const calculateVehicleHealth = (
  dtcCodes: DTCCode[],
  liveData: LivePIDData | undefined,
  readinessMonitors: ReadinessMonitors,
  vehicleInfo: VehicleInfo
): HealthScoreBreakdown => {
  return VehicleHealthScoreCalculator.calculateHealthScore(
    dtcCodes,
    liveData,
    readinessMonitors,
    vehicleInfo
  );
};
