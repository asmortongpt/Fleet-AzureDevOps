/**
 * Dependency Injection Container
 *
 * This module provides a centralized DI container using Awilix for managing
 * service dependencies throughout the application.
 *
 * Benefits:
 * - Improved testability: Easy to inject mocks/stubs for testing
 * - Loose coupling: Services depend on interfaces, not concrete implementations
 * - Single Responsibility: Each service has clear dependencies
 * - Lifecycle management: Control singleton vs transient lifetimes
 *
 * Usage:
 * ```typescript
 * import { container } from './container'
 *
 * // In routes or other consumers
 * const dispatchService = container.resolve('dispatchService')
 * const samsaraService = container.resolve('samsaraService')
 * ```
 */

import { createContainer, asClass, asFunction, asValue, InjectionMode, Lifetime, AwilixContainer } from 'awilix'
import { Pool } from 'pg'
import { connectionManager } from './config/connection-manager'

// Import service classes for DI (exported as classes, not instances)
import DispatchService from './services/dispatch.service'
import DocumentService from './services/document.service'
import ExampleDIService from './services/example-di.service'

// Import Tier 2 business logic services
import { VehicleService } from './services/VehicleService'
import { DriverService } from './services/DriverService'
import { MaintenanceService } from './services/MaintenanceService'
import { WorkorderService } from './services/WorkOrderService'
import { InspectionService } from './services/InspectionService'
import { FueltransactionService } from './services/FuelTransactionService'
import { RouteService } from './services/RouteService'

// Import Tier 3 Document Management services
import DocumentAuditService from './services/document-audit.service'
import DocumentFolderService from './services/document-folder.service'
import DocumentPermissionService from './services/document-permission.service'
import DocumentVersionService from './services/document-version.service'
import DocumentIndexer from './services/DocumentIndexer'
import DocumentSearchService from './services/DocumentSearchService'
import DocumentAiService from './services/DocumentAiService'
import DocumentRAGService from './services/document-rag.service'
import DocumentGeoService from './services/document-geo.service'
import DocumentManagementService from './services/document-management.service'
import DocumentSearchServiceAlt from './services/document-search.service'
import DocumentStorageService from './services/document-storage.service'

// Import Tier 4 AI/ML services
import AIAgentSupervisorService from './services/ai-agent-supervisor.service'
import AIControlsService from './services/ai-controls.service'
import AIIntakeService from './services/ai-intake.service'
import AIOcrService from './services/ai-ocr.service'
import AIValidationService from './services/ai-validation.service'
import FleetCognitionService from './services/fleet-cognition.service'
import FleetOptimizerService from './services/fleet-optimizer.service'
import LangChainOrchestratorService from './services/langchain-orchestrator.service'
import MLDecisionEngineService from './services/ml-decision-engine.service'
import MLTrainingService from './services/ml-training.service'
import RAGEngineService from './services/rag-engine.service'
import EmbeddingService from './services/EmbeddingService'
import VectorSearchService from './services/VectorSearchService'

// Import Tier 5 Integration services
import { MicrosoftGraphService } from './services/microsoft-graph.service'
import MicrosoftIntegrationService from './services/microsoft-integration.service'
import OutlookService from './services/outlook.service'
import SamsaraService from './services/samsara.service'
import SmartcarService from './services/smartcar.service'
import OBD2EmulatorService from './services/obd2-emulator.service'
import OCPPService from './services/ocpp.service'
import EVChargingService from './services/ev-charging.service'
import MobileIntegrationService from './services/mobile-integration.service'
import PushNotificationService from './services/push-notification.service'
import SMSService from './services/sms.service'
import WebRTCService from './services/webrtc.service'
import VideoTelematicsService from './services/video-telematics.service'
import MCPServerService from './services/mcp-server.service'
import MCPServerRegistryService from './services/mcp-server-registry.service'

// Import repository classes
import { VehicleRepository } from './repositories/VehicleRepository'
import { DriverRepository } from './repositories/DriverRepository'
import { VendorRepository } from './repositories/VendorRepository'
import { InspectionRepository } from './repositories/InspectionRepository'
import { MaintenanceRepository } from './repositories/MaintenanceRepository'
import { WorkOrderRepository } from './repositories/WorkOrderRepository'

// Logger import
import logger from './utils/logger'

/**
 * Container type definition for better TypeScript support
 *
 * This interface defines all services available through DI.
 * Services are loaded lazily to avoid circular dependencies.
 */
export interface DIContainer extends AwilixContainer {
  // Database
  db: Pool
  readPool: Pool
  writePool: Pool

  // Logger
  logger: typeof logger

  // DI Services (proper constructor injection)
  dispatchService: DispatchService
  documentService: DocumentService
  exampleDIService: ExampleDIService

  // Tier 2 Business Logic Services (core domain services)
  vehicleService: VehicleService
  driverService: DriverService
  maintenanceService: MaintenanceService
  workOrderService: WorkorderService
  inspectionService: InspectionService
  fuelTransactionService: FueltransactionService
  routeService: RouteService

  // Repositories (data access layer)
  vehicleRepository: VehicleRepository
  driverRepository: DriverRepository
  vendorRepository: VendorRepository
  inspectionRepository: InspectionRepository
  maintenanceRepository: MaintenanceRepository
  workOrderRepository: WorkOrderRepository

  // Tier 3 Document Management Services
  documentAuditService: DocumentAuditService
  documentFolderService: DocumentFolderService
  documentPermissionService: DocumentPermissionService
  documentVersionService: DocumentVersionService
  documentIndexer: DocumentIndexer
  documentSearchService: DocumentSearchService
  documentAiService: DocumentAiService
  documentRagService: DocumentRAGService
  documentGeoService: DocumentGeoService
  documentManagementService: DocumentManagementService
  documentSearchServiceAlt: DocumentSearchServiceAlt
  documentStorageService: DocumentStorageService

  // Tier 4 AI/ML Services
  aiAgentSupervisorService: AIAgentSupervisorService
  aiControlsService: AIControlsService
  aiIntakeService: AIIntakeService
  aiOcrService: AIOcrService
  aiValidationService: AIValidationService
  fleetCognitionService: FleetCognitionService
  fleetOptimizerService: FleetOptimizerService
  langchainOrchestratorService: LangChainOrchestratorService
  mlDecisionEngineService: MLDecisionEngineService
  mlTrainingService: MLTrainingService
  ragEngineService: RAGEngineService
  embeddingService: EmbeddingService
  vectorSearchService: VectorSearchService

  // Tier 5 Integration Services
  microsoftGraphService: MicrosoftGraphService
  microsoftIntegrationService: MicrosoftIntegrationService
  outlookService: OutlookService
  samsaraService: SamsaraService
  smartcarService: SmartcarService
  obd2EmulatorService: OBD2EmulatorService
  ocppService: OCPPService
  evChargingService: EVChargingService
  mobileIntegrationService: MobileIntegrationService
  pushNotificationService: PushNotificationService
  smsService: SMSService
  webrtcService: WebRTCService
  videoTelematicsService: VideoTelematicsService
  mcpServerService: MCPServerService
  mcpServerRegistryService: MCPServerRegistryService
}

/**
 * Create and configure the DI container
 */
export function createDIContainer() {
  const container = createContainer<DIContainer>({
    injectionMode: InjectionMode.PROXY
  })

  // Register database connections as functions (lazy singleton)
  // Using asFunction with SINGLETON ensures the connection is only retrieved
  // when first accessed, after connectionManager.initialize() has been called
  container.register({
    db: asFunction(() => connectionManager.getWritePool(), { lifetime: Lifetime.SINGLETON }),
    readPool: asFunction(() => connectionManager.getReadPool(), { lifetime: Lifetime.SINGLETON }),
    writePool: asFunction(() => connectionManager.getWritePool(), { lifetime: Lifetime.SINGLETON }),
    logger: asValue(logger)
  })

  // Register DI-enabled services (constructor injection)
  container.register({
    dispatchService: asClass(DispatchService, {
      lifetime: Lifetime.SINGLETON
    }),
    documentService: asClass(DocumentService, {
      lifetime: Lifetime.SINGLETON
    })
  })

  // Register Tier 2 business logic services (core domain services)
  // These services handle primary business operations (vehicles, drivers, maintenance, etc.)
  container.register({
    vehicleService: asClass(VehicleService, {
      lifetime: Lifetime.SINGLETON
    }),
    driverService: asClass(DriverService, {
      lifetime: Lifetime.SINGLETON
    }),
    maintenanceService: asClass(MaintenanceService, {
      lifetime: Lifetime.SINGLETON
    }),
    workOrderService: asClass(WorkorderService, {
      lifetime: Lifetime.SINGLETON
    }),
    inspectionService: asClass(InspectionService, {
      lifetime: Lifetime.SINGLETON
    }),
    fuelTransactionService: asClass(FueltransactionService, {
      lifetime: Lifetime.SINGLETON
    }),
    routeService: asClass(RouteService, {
      lifetime: Lifetime.SINGLETON
    })
  })

  // Register new DI-enabled services
  // These services use constructor injection and are instantiated by Awilix
  container.register({
    // SCOPED lifetime - new instance per request
    exampleDIService: asClass(ExampleDIService, {
      lifetime: Lifetime.SCOPED,
      // This tells Awilix to inject { db, logger } into the constructor
      injector: () => ({
        db: container.resolve('db'),
        logger: container.resolve('logger')
      })
    })
  })

  // Register repositories
  // Repositories are SINGLETON because they're stateless and thread-safe
  // They only provide data access methods and maintain no state
  container.register({
    vehicleRepository: asClass(VehicleRepository, {
      lifetime: Lifetime.SINGLETON
    }),
    driverRepository: asClass(DriverRepository, {
      lifetime: Lifetime.SINGLETON
    }),
    vendorRepository: asClass(VendorRepository, {
      lifetime: Lifetime.SINGLETON
    }),
    inspectionRepository: asClass(InspectionRepository, {
      lifetime: Lifetime.SINGLETON
    }),
    maintenanceRepository: asClass(MaintenanceRepository, {
      lifetime: Lifetime.SINGLETON
    }),
    workOrderRepository: asClass(WorkOrderRepository, {
      lifetime: Lifetime.SINGLETON
    })
  })

  // Register Tier 3 Document Management services
  // These services handle document storage, versioning, permissions, search, and AI features
  container.register({
    documentAuditService: asClass(DocumentAuditService, {
      lifetime: Lifetime.SINGLETON
    }),
    documentFolderService: asClass(DocumentFolderService, {
      lifetime: Lifetime.SINGLETON
    }),
    documentPermissionService: asClass(DocumentPermissionService, {
      lifetime: Lifetime.SINGLETON
    }),
    documentVersionService: asClass(DocumentVersionService, {
      lifetime: Lifetime.SINGLETON
    }),
    documentIndexer: asClass(DocumentIndexer, {
      lifetime: Lifetime.SINGLETON
    }),
    documentSearchService: asClass(DocumentSearchService, {
      lifetime: Lifetime.SINGLETON
    }),
    documentAiService: asClass(DocumentAiService, {
      lifetime: Lifetime.SINGLETON
    }),
    documentRagService: asClass(DocumentRAGService, {
      lifetime: Lifetime.SINGLETON
    }),
    documentGeoService: asClass(DocumentGeoService, {
      lifetime: Lifetime.SINGLETON
    }),
    documentManagementService: asClass(DocumentManagementService, {
      lifetime: Lifetime.SINGLETON
    }),
    documentSearchServiceAlt: asClass(DocumentSearchServiceAlt, {
      lifetime: Lifetime.SINGLETON
    }),
    documentStorageService: asClass(DocumentStorageService, {
      lifetime: Lifetime.SINGLETON
    })
  })

  // Register Tier 4 AI/ML services
  // These services handle AI agents, ML models, embeddings, vector search, and fleet intelligence
  container.register({
    aiAgentSupervisorService: asClass(AIAgentSupervisorService, {
      lifetime: Lifetime.SINGLETON
    }),
    aiControlsService: asClass(AIControlsService, {
      lifetime: Lifetime.SINGLETON
    }),
    aiIntakeService: asClass(AIIntakeService, {
      lifetime: Lifetime.SINGLETON
    }),
    aiOcrService: asClass(AIOcrService, {
      lifetime: Lifetime.SINGLETON
    }),
    aiValidationService: asClass(AIValidationService, {
      lifetime: Lifetime.SINGLETON
    }),
    fleetCognitionService: asClass(FleetCognitionService, {
      lifetime: Lifetime.SINGLETON
    }),
    fleetOptimizerService: asClass(FleetOptimizerService, {
      lifetime: Lifetime.SINGLETON
    }),
    langchainOrchestratorService: asClass(LangChainOrchestratorService, {
      lifetime: Lifetime.SINGLETON
    }),
    mlDecisionEngineService: asClass(MLDecisionEngineService, {
      lifetime: Lifetime.SINGLETON
    }),
    mlTrainingService: asClass(MLTrainingService, {
      lifetime: Lifetime.SINGLETON
    }),
    ragEngineService: asClass(RAGEngineService, {
      lifetime: Lifetime.SINGLETON
    }),
    embeddingService: asClass(EmbeddingService, {
      lifetime: Lifetime.SINGLETON
    }),
    vectorSearchService: asClass(VectorSearchService, {
      lifetime: Lifetime.SINGLETON
    })
  })

  // Register Tier 5 Integration services
  // These services handle external integrations (Microsoft, Samsara, SmartCar, OBD2, OCPP, mobile apps, SMS)
  container.register({
    microsoftGraphService: asFunction(() => MicrosoftGraphService.getInstance(), {
      lifetime: Lifetime.SINGLETON
    }),
    microsoftIntegrationService: asClass(MicrosoftIntegrationService, {
      lifetime: Lifetime.SINGLETON
    }),
    outlookService: asClass(OutlookService, {
      lifetime: Lifetime.SINGLETON
    }),
    samsaraService: asClass(SamsaraService, {
      lifetime: Lifetime.SINGLETON
    }),
    smartcarService: asClass(SmartcarService, {
      lifetime: Lifetime.SINGLETON
    }),
    obd2EmulatorService: asFunction(() => OBD2EmulatorService.getInstance(), {
      lifetime: Lifetime.SINGLETON
    }),
    ocppService: asClass(OCPPService, {
      lifetime: Lifetime.SINGLETON
    }),
    evChargingService: asClass(EVChargingService, {
      lifetime: Lifetime.SINGLETON
    }),
    mobileIntegrationService: asClass(MobileIntegrationService, {
      lifetime: Lifetime.SINGLETON
    }),
    pushNotificationService: asClass(PushNotificationService, {
      lifetime: Lifetime.SINGLETON
    }),
    smsService: asClass(SMSService, {
      lifetime: Lifetime.SINGLETON
    }),
    webrtcService: asClass(WebRTCService, {
      lifetime: Lifetime.SINGLETON
    }),
    videoTelematicsService: asClass(VideoTelematicsService, {
      lifetime: Lifetime.SINGLETON
    }),
    mcpServerService: asClass(MCPServerService, {
      lifetime: Lifetime.SINGLETON
    }),
    mcpServerRegistryService: asClass(MCPServerRegistryService, {
      lifetime: Lifetime.SINGLETON
    })
  })

  return container
}

/**
 * Register a new service dynamically
 * Useful for registering services at runtime or in tests
 */
export function registerService<K extends keyof DIContainer>(
  serviceName: K,
  serviceInstance: DIContainer[K]
) {
  container.register({
    [serviceName]: asValue(serviceInstance)
  })
}

/**
 * Register a service class for instantiation
 * Useful for services that need constructor injection
 */
export function registerServiceClass<T>(
  serviceName: string,
  serviceClass: new (...args: any[]) => T,
  lifetime: typeof Lifetime.SCOPED | typeof Lifetime.SINGLETON | typeof Lifetime.TRANSIENT = Lifetime.SCOPED
) {
  container.register({
    [serviceName]: asClass(serviceClass, { lifetime })
  })
}

/**
 * Global container instance
 */
export const container = createDIContainer()

/**
 * Middleware to create a scoped container per request
 * This ensures each HTTP request gets fresh scoped dependencies
 */
export function containerMiddleware(req: any, res: any, next: any) {
  // Create a scoped container for this request
  req.container = container.createScope()

  // Clean up the scope after response
  res.on('finish', () => {
    if (req.container) {
      req.container.dispose()
    }
  })

  next()
}

/**
 * Utility function to resolve a service
 * Useful for non-Express contexts (jobs, scripts)
 */
export function resolve<T extends keyof DIContainer>(serviceName: T): DIContainer[T] {
  return container.resolve(serviceName)
}

/**
 * Create a test container with mock dependencies
 * Useful for unit testing
 */
export function createTestContainer(mocks?: Partial<DIContainer>) {
  const testContainer = createContainer<DIContainer>({
    injectionMode: InjectionMode.PROXY
  })

  // Register mocks or real implementations
  if (mocks) {
    Object.keys(mocks).forEach(key => {
      testContainer.register({
        [key]: asValue(mocks[key as keyof DIContainer])
      })
    })
  }

  return testContainer
}

export default container
