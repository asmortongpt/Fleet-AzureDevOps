// Azure Testing Orchestrator - Infrastructure as Code
// Deploys comprehensive testing infrastructure with RAG + MCP integration

@description('Environment name')
param environmentName string = 'testing-orchestrator'

@description('Location for all resources')
param location string = resourceGroup().location

@description('Container Apps Environment name')
param containerAppsEnvName string = '${environmentName}-env'

// ============================================================================
// SHARED RESOURCES
// ============================================================================

// Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${environmentName}-logs'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 90
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${environmentName}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// Container Apps Environment
resource containerAppsEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: containerAppsEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ============================================================================
// STORAGE - RAG Vector Store & Artifacts
// ============================================================================

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: replace('${environmentName}storage', '-', '')
  location: location
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

// Blob containers for different artifact types
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource artifactsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'test-artifacts'
}

resource screenshotsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'ui-screenshots'
}

resource reportsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'test-reports'
}

// ============================================================================
// COSMOS DB - RAG Document Store
// ============================================================================

resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: '${environmentName}-cosmos'
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
  }
}

resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosAccount
  name: 'rag-knowledge'
  properties: {
    resource: {
      id: 'rag-knowledge'
    }
  }
}

// RAG namespace containers
var ragNamespaces = [
  'code_files'
  'code_symbols'
  'code_components'
  'code_flows'
  'requirements'
  'architecture'
  'test_specs'
  'test_runs'
  'defects'
  'data_rules'
  'ui_snapshots'
]

resource ragContainers 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = [for namespace in ragNamespaces: {
  parent: cosmosDatabase
  name: namespace
  properties: {
    resource: {
      id: namespace
      partitionKey: {
        paths: [
          '/partition_key'
        ]
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        automatic: true
        includedPaths: [
          {
            path: '/*'
          }
        ]
      }
    }
  }
}]

// ============================================================================
// AZURE OPENAI - Embeddings & LLM
// ============================================================================

resource openAI 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: '${environmentName}-openai'
  location: location
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: '${environmentName}-openai'
    publicNetworkAccess: 'Enabled'
  }
}

resource embeddingDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openAI
  name: 'text-embedding-3-large'
  sku: {
    name: 'Standard'
    capacity: 120
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'text-embedding-3-large'
      version: '1'
    }
  }
}

resource gpt4Deployment 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openAI
  name: 'gpt-4-turbo'
  sku: {
    name: 'Standard'
    capacity: 100
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4'
      version: 'turbo-2024-04-09'
    }
  }
  dependsOn: [
    embeddingDeployment
  ]
}

// ============================================================================
// AZURE AI SEARCH - Vector Search
// ============================================================================

resource searchService 'Microsoft.Search/searchServices@2023-11-01' = {
  name: '${environmentName}-search'
  location: location
  sku: {
    name: 'standard'
  }
  properties: {
    replicaCount: 1
    partitionCount: 1
    hostingMode: 'default'
  }
}

// ============================================================================
// KEY VAULT - Secrets Management
// ============================================================================

resource keyVault 'Microsoft.KeyVault/vaults@2023-02-01' = {
  name: '${environmentName}-kv'
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 90
  }
}

// ============================================================================
// CONTAINER APPS - Microservices
// ============================================================================

// RAG Indexer Service
resource ragIndexer 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${environmentName}-rag-indexer'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
        transport: 'http'
      }
      secrets: [
        {
          name: 'cosmos-connection-string'
          value: cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString
        }
        {
          name: 'openai-key'
          value: openAI.listKeys().key1
        }
        {
          name: 'search-key'
          value: searchService.listAdminKeys().primaryKey
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'rag-indexer'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest' // Will be replaced
          resources: {
            cpu: json('2.0')
            memory: '4Gi'
          }
          env: [
            {
              name: 'COSMOS_CONNECTION_STRING'
              secretRef: 'cosmos-connection-string'
            }
            {
              name: 'OPENAI_API_KEY'
              secretRef: 'openai-key'
            }
            {
              name: 'OPENAI_ENDPOINT'
              value: openAI.properties.endpoint
            }
            {
              name: 'SEARCH_ENDPOINT'
              value: 'https://${searchService.name}.search.windows.net'
            }
            {
              name: 'SEARCH_KEY'
              secretRef: 'search-key'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 5
      }
    }
  }
}

// Test Orchestrator Service
resource testOrchestrator 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${environmentName}-orchestrator'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8001
        transport: 'http'
      }
      secrets: [
        {
          name: 'cosmos-connection-string'
          value: cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString
        }
        {
          name: 'storage-connection-string'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        {
          name: 'appinsights-connection-string'
          value: appInsights.properties.ConnectionString
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'test-orchestrator'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest' // Will be replaced
          resources: {
            cpu: json('4.0')
            memory: '8Gi'
          }
          env: [
            {
              name: 'COSMOS_CONNECTION_STRING'
              secretRef: 'cosmos-connection-string'
            }
            {
              name: 'STORAGE_CONNECTION_STRING'
              secretRef: 'storage-connection-string'
            }
            {
              name: 'APPINSIGHTS_CONNECTION_STRING'
              secretRef: 'appinsights-connection-string'
            }
            {
              name: 'RAG_INDEXER_URL'
              value: 'https://${ragIndexer.properties.configuration.ingress.fqdn}'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
      }
    }
  }
}

// Playwright Runner Service
resource playwrightRunner 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${environmentName}-playwright'
  location: location
  properties: {
    managedEnvironmentId: containerAppsEnv.id
    configuration: {
      ingress: {
        external: false
        targetPort: 8002
        transport: 'http'
      }
      secrets: [
        {
          name: 'storage-connection-string'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'playwright-runner'
          image: 'mcr.microsoft.com/playwright:v1.40.0-jammy' // Official Playwright image
          resources: {
            cpu: json('2.0')
            memory: '4Gi'
          }
          env: [
            {
              name: 'STORAGE_CONNECTION_STRING'
              secretRef: 'storage-connection-string'
            }
            {
              name: 'SCREENSHOTS_CONTAINER'
              value: 'ui-screenshots'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 2
        maxReplicas: 20
      }
    }
  }
}

// ============================================================================
// OUTPUTS
// ============================================================================

output ragIndexerUrl string = 'https://${ragIndexer.properties.configuration.ingress.fqdn}'
output testOrchestratorUrl string = 'https://${testOrchestrator.properties.configuration.ingress.fqdn}'
output cosmosEndpoint string = cosmosAccount.properties.documentEndpoint
output storageAccountName string = storageAccount.name
output searchServiceName string = searchService.name
output openAIEndpoint string = openAI.properties.endpoint
output appInsightsConnectionString string = appInsights.properties.ConnectionString
