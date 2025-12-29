// ==============================================================================
// Fleet Management System - Production Azure Deployment
// Bicep Template for Infrastructure as Code
// ==============================================================================

targetScope = 'resourceGroup'

// Parameters
@description('Environment name (e.g., production, staging)')
param environment string = 'production'

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Application name prefix')
param appName string = 'fleet'

@description('Admin email for alerts')
param adminEmail string

@description('Database admin username')
@secure()
param dbAdminUsername string

@description('Database admin password')
@secure()
param dbAdminPassword string

@description('Tags for all resources')
param tags object = {
  Environment: environment
  Application: 'Fleet Management System'
  ManagedBy: 'Bicep'
  CostCenter: 'Operations'
}

// Variables
var resourcePrefix = '${appName}-${environment}'
var appServicePlanName = '${resourcePrefix}-asp'
var webAppName = '${resourcePrefix}-app'
var dbServerName = '${resourcePrefix}-db'
var dbName = 'fleetdb'
var keyVaultName = '${resourcePrefix}-kv'
var appInsightsName = '${resourcePrefix}-ai'
var cdnProfileName = '${resourcePrefix}-cdn'
var cdnEndpointName = '${resourcePrefix}-cdn-endpoint'
var logAnalyticsName = '${resourcePrefix}-logs'
var storageAccountName = replace('${resourcePrefix}stor', '-', '')

// ==============================================================================
// Log Analytics Workspace
// ==============================================================================
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
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

// ==============================================================================
// Application Insights
// ==============================================================================
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    RetentionInDays: 90
    DisableIpMasking: false
    DisableLocalAuth: false
  }
}

// ==============================================================================
// Storage Account (for backups, static assets, logs)
// ==============================================================================
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Deny'
    }
    supportsHttpsTrafficOnly: true
    encryption: {
      services: {
        blob: {
          enabled: true
        }
        file: {
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
  }
}

// ==============================================================================
// Key Vault (for secrets management)
// ==============================================================================
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
    enablePurgeProtection: true
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Deny'
    }
  }
}

// ==============================================================================
// PostgreSQL Flexible Server
// ==============================================================================
resource dbServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: dbServerName
  location: location
  tags: tags
  sku: {
    name: 'Standard_B2s'
    tier: 'Burstable'
  }
  properties: {
    administratorLogin: dbAdminUsername
    administratorLoginPassword: dbAdminPassword
    version: '15'
    storage: {
      storageSizeGB: 32
      autoGrow: 'Enabled'
    }
    backup: {
      backupRetentionDays: 35
      geoRedundantBackup: 'Enabled'
    }
    highAvailability: {
      mode: 'Disabled' // Enable for production
    }
    network: {
      publicNetworkAccess: 'Enabled' // Change to Disabled with VNet integration
    }
  }
}

resource dbFirewallAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-03-01-preview' = {
  parent: dbServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource database 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: dbServer
  name: dbName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// ==============================================================================
// App Service Plan (Linux, Node.js 20 LTS)
// ==============================================================================
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  tags: tags
  sku: {
    name: 'P1v3' // Premium v3 (2 cores, 8GB RAM)
    tier: 'PremiumV3'
    capacity: 1
  }
  kind: 'linux'
  properties: {
    reserved: true
    perSiteScaling: false
    elasticScaleEnabled: false
    isSpot: false
    maximumElasticWorkerCount: 1
    zoneRedundant: false
  }
}

// ==============================================================================
// Web App (Node.js 20 LTS)
// ==============================================================================
resource webApp 'Microsoft.Web/sites@2023-01-01' = {
  name: webAppName
  location: location
  tags: tags
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlan.id
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      linuxFxVersion: 'NODE|20-lts'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      numberOfWorkers: 1
      appSettings: [
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'ApplicationInsightsAgent_EXTENSION_VERSION'
          value: '~3'
        }
        {
          name: 'XDT_MicrosoftApplicationInsights_Mode'
          value: 'Recommended'
        }
        {
          name: 'DATABASE_URL'
          value: 'postgresql://${dbAdminUsername}:${dbAdminPassword}@${dbServer.properties.fullyQualifiedDomainName}/${dbName}?sslmode=require'
        }
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'KEY_VAULT_URL'
          value: keyVault.properties.vaultUri
        }
      ]
      cors: {
        allowedOrigins: [
          'https://${webApp.properties.defaultHostName}'
        ]
        supportCredentials: true
      }
      healthCheckPath: '/api/health'
      ipSecurityRestrictions: []
      scmIpSecurityRestrictions: []
    }
  }
}

// ==============================================================================
// CDN Profile and Endpoint (for static assets)
// ==============================================================================
resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: cdnProfileName
  location: 'Global'
  tags: tags
  sku: {
    name: 'Standard_Microsoft'
  }
}

resource cdnEndpoint 'Microsoft.Cdn/profiles/endpoints@2023-05-01' = {
  parent: cdnProfile
  name: cdnEndpointName
  location: 'Global'
  tags: tags
  properties: {
    originHostHeader: webApp.properties.defaultHostName
    isHttpAllowed: false
    isHttpsAllowed: true
    queryStringCachingBehavior: 'IgnoreQueryString'
    contentTypesToCompress: [
      'text/plain'
      'text/html'
      'text/css'
      'application/x-javascript'
      'text/javascript'
      'application/javascript'
      'application/json'
      'application/xml'
    ]
    isCompressionEnabled: true
    origins: [
      {
        name: 'origin1'
        properties: {
          hostName: webApp.properties.defaultHostName
          httpPort: 80
          httpsPort: 443
        }
      }
    ]
  }
}

// ==============================================================================
// Outputs
// ==============================================================================
output webAppUrl string = 'https://${webApp.properties.defaultHostName}'
output cdnUrl string = 'https://${cdnEndpoint.properties.hostName}'
output dbServerFqdn string = dbServer.properties.fullyQualifiedDomainName
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
output keyVaultUri string = keyVault.properties.vaultUri
output webAppIdentityPrincipalId string = webApp.identity.principalId
