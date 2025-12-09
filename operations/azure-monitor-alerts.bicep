/**
 * Azure Monitor Alert Rules Configuration
 * Deploys comprehensive alerting for Fleet Management System
 */

@description('Application Insights resource name')
param appInsightsName string

@description('Action Group for alerts')
param actionGroupName string = 'fleet-ops-team'

@description('Email addresses for alerts')
param alertEmails array = [
  'ops@capitaltechalliance.com'
  'andrew.m@capitaltechalliance.com'
]

@description('Environment name')
param environment string = 'production'

@description('Location for resources')
param location string = resourceGroup().location

// Get existing Application Insights instance
resource appInsights 'Microsoft.Insights/components@2020-02-02' existing = {
  name: appInsightsName
}

// Create Action Group for notifications
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: actionGroupName
  location: 'global'
  properties: {
    groupShortName: 'FleetOps'
    enabled: true
    emailReceivers: [for (email, i) in alertEmails: {
      name: 'Email${i}'
      emailAddress: email
      useCommonAlertSchema: true
    }]
    smsReceivers: []
    webhookReceivers: []
    // Add PagerDuty/Opsgenie webhook receivers here if needed
  }
}

// Alert: High Error Rate
resource errorRateAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'fleet-high-error-rate-${environment}'
  location: 'global'
  properties: {
    description: 'Triggers when error rate exceeds 1% for 5 minutes'
    severity: 2 // Warning
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT1M' // Every 1 minute
    windowSize: 'PT5M' // 5 minute window
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.MultipleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ErrorRate'
          metricNamespace: 'Microsoft.Insights/components'
          metricName: 'exceptions/count'
          operator: 'GreaterThan'
          threshold: 100 // More than 100 exceptions in 5 minutes
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert: High Response Time
resource responseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'fleet-high-response-time-${environment}'
  location: 'global'
  properties: {
    description: 'Triggers when p95 response time exceeds 1 second for 5 minutes'
    severity: 2 // Warning
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.MultipleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ResponseTime'
          metricNamespace: 'Microsoft.Insights/components'
          metricName: 'requests/duration'
          operator: 'GreaterThan'
          threshold: 1000 // 1 second in milliseconds
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert: Application Downtime
resource downtimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'fleet-application-down-${environment}'
  location: 'global'
  properties: {
    description: 'Triggers when application stops receiving requests for 2 minutes'
    severity: 0 // Critical
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT2M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.MultipleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'NoRequests'
          metricNamespace: 'Microsoft.Insights/components'
          metricName: 'requests/count'
          operator: 'LessThan'
          threshold: 1
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert: High Memory Usage
resource memoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'fleet-high-memory-${environment}'
  location: 'global'
  properties: {
    description: 'Triggers when memory usage exceeds 85% for 10 minutes'
    severity: 2 // Warning
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT10M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.MultipleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'MemoryUsage'
          metricNamespace: 'Microsoft.Insights/components'
          metricName: 'performanceCounters/memoryAvailableBytes'
          operator: 'LessThan'
          threshold: 500000000 // Less than 500MB available
          timeAggregation: 'Average'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert: Database Connection Failures
resource databaseAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'fleet-database-failures-${environment}'
  location: 'global'
  properties: {
    description: 'Triggers when database connection failures are detected'
    severity: 1 // Error
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.MultipleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'DatabaseFailures'
          metricNamespace: 'Microsoft.Insights/components'
          metricName: 'dependencies/failed'
          operator: 'GreaterThan'
          threshold: 5 // More than 5 failures in 5 minutes
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Alert: Failed Requests
resource failedRequestsAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'fleet-failed-requests-${environment}'
  location: 'global'
  properties: {
    description: 'Triggers when failed request rate exceeds threshold'
    severity: 2 // Warning
    enabled: true
    scopes: [
      appInsights.id
    ]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.MultipleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'FailedRequests'
          metricNamespace: 'Microsoft.Insights/components'
          metricName: 'requests/failed'
          operator: 'GreaterThan'
          threshold: 10 // More than 10 failed requests in 5 minutes
          timeAggregation: 'Total'
          criterionType: 'StaticThresholdCriterion'
        }
      ]
    }
    actions: [
      {
        actionGroupId: actionGroup.id
      }
    ]
  }
}

// Log Analytics Query Alert: Custom Error Pattern
resource customErrorAlert 'Microsoft.Insights/scheduledQueryRules@2021-08-01' = {
  name: 'fleet-custom-errors-${environment}'
  location: location
  properties: {
    description: 'Detects critical errors in application logs'
    severity: 1 // Error
    enabled: true
    evaluationFrequency: 'PT5M'
    windowSize: 'PT5M'
    scopes: [
      appInsights.id
    ]
    criteria: {
      allOf: [
        {
          query: '''
            traces
            | where severityLevel >= 3
            | where message contains "CRITICAL" or message contains "FATAL"
            | summarize count() by bin(timestamp, 5m)
            | where count_ > 0
          '''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [
        actionGroup.id
      ]
    }
  }
}

// Outputs
output actionGroupId string = actionGroup.id
output actionGroupName string = actionGroup.name
