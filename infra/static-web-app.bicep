@description('Name of the Static Web App')
param staticWebAppName string = 'fleet-management'

@description('Location for the Static Web App')
param location string = 'eastus2'

@description('SKU name for the Static Web App')
@allowed([
  'Free'
  'Standard'
])
param skuName string = 'Free'

@description('SKU tier for the Static Web App')
@allowed([
  'Free'
  'Standard'
])
param skuTier string = 'Free'

@description('Repository URL (optional)')
param repositoryUrl string = 'https://github.com/asmortongpt/fleet'

@description('Branch to deploy from')
param branch string = 'main'

@description('Tags for the resource')
param tags object = {
  environment: 'production'
  project: 'fleet-management'
  managedBy: 'bicep'
}

// Static Web App resource
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  sku: {
    name: skuName
    tier: skuTier
  }
  tags: tags
  properties: {
    // Build configuration
    buildProperties: {
      appLocation: '/'
      apiLocation: ''
      outputLocation: 'dist'
      appBuildCommand: 'npm run build'
      apiBuildCommand: ''
      skipGithubActionWorkflowGeneration: false
    }

    // Repository configuration (if using GitHub integration)
    repositoryUrl: repositoryUrl
    branch: branch

    // Provider (GitHub or other)
    provider: 'GitHub'

    // Enterprise-grade features (requires Standard SKU)
    // enterpriseGradeCdnStatus: skuName == 'Standard' ? 'Enabled' : 'Disabled'

    // Staging environments (requires Standard SKU)
    // allowConfigFileUpdates: true
  }
}

// Custom domain (optional)
// Uncomment and configure if you have a custom domain
/*
resource customDomain 'Microsoft.Web/staticSites/customDomains@2023-01-01' = {
  parent: staticWebApp
  name: 'fleet.capitaltechalliance.com'
  properties: {}
}
*/

// Outputs
output staticWebAppId string = staticWebApp.id
output staticWebAppName string = staticWebApp.name
output defaultHostname string = staticWebApp.properties.defaultHostname
output deploymentToken string = listSecrets(staticWebApp.id, '2023-01-01').properties.apiKey

// Resource group deployment outputs
output resourceGroupName string = resourceGroup().name
output location string = location
