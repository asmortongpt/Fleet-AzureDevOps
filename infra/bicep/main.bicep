
resource appServicePlan 'Microsoft.Web/serverfarms@2022-03-01' = {
  name: 'fleet-app-service-plan'
  location: location
  sku: {
    name: 'P2v3'
    tier: 'PremiumV3'
    capacity: 5  // Minimum instances increased from 1 to 5
  }
  properties: {
    reserved: true
  }
}

resource autoScaleSettings 'Microsoft.Insights/autoscalesettings@2022-10-01' = {
  name: 'fleet-autoscale'
  location: location
  properties: {
    enabled: true
    targetResourceUri: appServicePlan.id
    profiles: [
      {
        name: 'Auto scale based on CPU and Memory'
        capacity: {
          minimum: '5'    // Increased from 1
          maximum: '50'   // Increased from 10
          default: '10'   // Increased from 2
        }
        rules: [
          {
            metricTrigger: {
              metricName: 'CpuPercentage'
              threshold: 60  // More aggressive: 60% instead of 75%
              operator: 'GreaterThan'
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '5'  // Scale up by 5 instances instead of 1
              cooldown: 'PT3M'
            }
          }
          {
            metricTrigger: {
              metricName: 'MemoryPercentage'
              threshold: 70
              operator: 'GreaterThan'
              timeGrain: 'PT1M'
              statistic: 'Average'
              timeWindow: 'PT5M'
            }
            scaleAction: {
              direction: 'Increase'
              type: 'ChangeCount'
              value: '3'
              cooldown: 'PT3M'
            }
          }
        ]
      }
    ]
  }
}
