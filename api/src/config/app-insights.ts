import * as appInsights from 'applicationinsights'
import { logger } from '../utils/logger'

interface CustomProperties {
  [key: string]: string | number | boolean
}

class ApplicationInsightsService {
  private client: appInsights.TelemetryClient | null = null
  private isConfigured: boolean = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING

    if (!connectionString) {
      logger.warn('Application Insights connection string not configured')
      return
    }

    try {
      appInsights.setup(connectionString)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true, true)
        .setSendLiveMetrics(true)
        .start()

      this.client = appInsights.defaultClient
      this.isConfigured = true

      logger.info('Application Insights initialized successfully')
    } catch (error) {
      logger.error('Failed to initialize Application Insights', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Track custom events for personal use features
   */
  trackTripSubmission(userId: string, usageType: string, miles: number, properties?: CustomProperties) {
    if (!this.isConfigured || !this.client) return

    this.client.trackEvent({
      name: 'TripSubmitted',
      properties: {
        userId,
        usageType,
        miles: miles.toString(),
        ...properties
      }
    })
  }

  trackTripApproval(managerId: string, tripId: string, decision: 'approved' | 'rejected', properties?: CustomProperties) {
    if (!this.isConfigured || !this.client) return

    this.client.trackEvent({
      name: 'TripApprovalDecision',
      properties: {
        managerId,
        tripId,
        decision,
        ...properties
      }
    })
  }

  trackPolicyViolation(userId: string, violationType: string, details: string) {
    if (!this.isConfigured || !this.client) return

    this.client.trackEvent({
      name: 'PolicyViolation',
      properties: {
        userId,
        violationType,
        details,
        severity: 'warning'
      }
    })
  }

  trackChargeCalculation(driverId: string, period: string, totalCharge: number, miles: number) {
    if (!this.isConfigured || !this.client) return

    this.client.trackEvent({
      name: 'PersonalUseChargeCalculated',
      properties: {
        driverId,
        period,
        totalCharge: totalCharge.toString(),
        miles: miles.toString()
      }
    })

    // Also track as metric for dashboards
    this.client.trackMetric({
      name: 'PersonalUseMiles',
      value: miles
    })

    this.client.trackMetric({
      name: 'PersonalUseCharge',
      value: totalCharge
    })
  }

  trackLimitWarning(driverId: string, period: 'month' | 'year', percentageUsed: number) {
    if (!this.isConfigured || !this.client) return

    this.client.trackEvent({
      name: 'PersonalUseLimitWarning',
      properties: {
        driverId,
        period,
        percentageUsed: percentageUsed.toString(),
        severity: percentageUsed >= 95 ? 'high' : 'medium'
      }
    })
  }

  /**
   * Track API performance metrics
   */
  trackApiPerformance(endpoint: string, duration: number, statusCode: number) {
    if (!this.isConfigured || !this.client) return

    this.client.trackMetric({
      name: `API_${endpoint}_Duration`,
      value: duration
    })

    this.client.trackMetric({
      name: `API_${endpoint}_StatusCode`,
      value: statusCode
    })
  }

  /**
   * Track monthly billing metrics
   */
  trackMonthlyBilling(period: string, totalDrivers: number, totalCharges: number, totalMiles: number) {
    if (!this.isConfigured || !this.client) return

    this.client.trackEvent({
      name: 'MonthlyBillingGenerated',
      properties: {
        period,
        totalDrivers: totalDrivers.toString(),
        totalCharges: totalCharges.toString(),
        totalMiles: totalMiles.toString()
      }
    })

    // Track as metrics for trending
    this.client.trackMetric({
      name: 'Monthly_PersonalUseMiles',
      value: totalMiles
    })

    this.client.trackMetric({
      name: 'Monthly_PersonalUseRevenue',
      value: totalCharges
    })

    this.client.trackMetric({
      name: 'Monthly_ActiveDrivers',
      value: totalDrivers
    })
  }

  /**
   * Track quality gates and deployments
   */
  trackQualityGate(gateType: string, status: string, executionTime: number) {
    if (!this.isConfigured || !this.client) return

    this.client.trackEvent({
      name: 'QualityGateExecuted',
      properties: {
        gateType,
        status,
        executionTime: executionTime.toString()
      }
    })

    this.client.trackMetric({
      name: `QualityGate_${gateType}_Duration`,
      value: executionTime
    })
  }

  trackDeployment(environment: string, version: string, status: string) {
    if (!this.isConfigured || !this.client) return

    this.client.trackEvent({
      name: 'DeploymentCompleted',
      properties: {
        environment,
        version,
        status
      }
    })
  }

  /**
   * Flush telemetry before shutdown
   */
  async flush(): Promise<void> {
    if (!this.isConfigured || !this.client) return

    return new Promise((resolve) => {
      this.client!.flush()
      // Wait a moment for flush to complete
      setTimeout(() => resolve(), 100)
    })
  }
}

export const appInsightsService = new ApplicationInsightsService()
export default appInsightsService
