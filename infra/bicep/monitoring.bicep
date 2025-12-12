
param location string
param appServicePlanId string
param apiAppId string
param workersAppId string

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'fleet-app-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    RetentionInDays: 90
    IngestionMode: 'ApplicationInsights'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// API Response Time Monitoring
resource apiResponseTimeAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'api-slow-response-alert'
  location: 'global'
  properties: {
    description: 'Alert when API response time exceeds 1 second'
    severity: 2
    enabled: true
    scopes: [apiAppId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'ResponseTime'
          metricName: 'HttpResponseTime'
          operator: 'GreaterThan'
          threshold: 1000
          timeAggregation: 'Average'
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

// Database Query Performance Monitoring
resource dbQueryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'database-slow-query-alert'
  location: 'global'
  properties: {
    description: 'Alert when database queries take too long'
    severity: 2
    enabled: true
    scopes: [apiAppId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'DatabaseLatency'
          metricName: 'DatabaseLatency'
          operator: 'GreaterThan'
          threshold: 500
          timeAggregation: 'Average'
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

// Mobile App Crash Rate Monitoring
resource mobileCrashAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'mobile-crash-rate-alert'
  location: 'global'
  properties: {
    description: 'Alert when mobile app crash rate exceeds 1%'
    severity: 1
    enabled: true
    scopes: [appInsights.id]
    evaluationFrequency: 'PT5M'
    windowSize: 'PT15M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'CrashRate'
          metricName: 'exceptions/count'
          operator: 'GreaterThan'
          threshold: 100
          timeAggregation: 'Count'
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

// Memory Usage Alert
resource memoryAlert 'Microsoft.Insights/metricAlerts@2018-03-01' = {
  name: 'high-memory-alert'
  location: 'global'
  properties: {
    description: 'Alert when memory usage exceeds 85%'
    severity: 2
    enabled: true
    scopes: [apiAppId]
    evaluationFrequency: 'PT1M'
    windowSize: 'PT5M'
    criteria: {
      'odata.type': 'Microsoft.Azure.Monitor.SingleResourceMultipleMetricCriteria'
      allOf: [
        {
          name: 'MemoryPercentage'
          metricName: 'MemoryPercentage'
          operator: 'GreaterThan'
          threshold: 85
          timeAggregation: 'Average'
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

// Action Group for Alerts
resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: 'fleet-alert-action-group'
  location: 'global'
  properties: {
    groupShortName: 'FleetAlerts'
    enabled: true
    emailReceivers: [
      {
        name: 'DevOps Team'
        emailAddress: 'devops@fleet.com'
        useCommonAlertSchema: true
      }
    ]
    smsReceivers: []
    webhookReceivers: [
      {
        name: 'Slack Webhook'
        serviceUri: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
        useCommonAlertSchema: true
      }
    ]
  }
}

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'fleet-log-analytics'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 90
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

// Diagnostic Settings for API
resource apiDiagnostics 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  scope: apiAppId
  name: 'api-diagnostics'
  properties: {
    workspaceId: logAnalytics.id
    logs: [
      {
        category: 'AppServiceHTTPLogs'
        enabled: true
      }
      {
        category: 'AppServiceConsoleLogs'
        enabled: true
      }
      {
        category: 'AppServiceAppLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
output appInsightsConnectionString string = appInsights.properties.ConnectionString
output logAnalyticsWorkspaceId string = logAnalytics.id
