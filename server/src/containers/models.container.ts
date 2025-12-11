import { Pool } from 'pg';
import { ModelsRepository } from '../repositories/models.repository';
import { getSketchfabService } from '../services/sketchfab';
import { getAzureBlobService } from '../services/azure-blob';

export interface ModelsContainerDeps {
  db: Pool;
  sketchfabService?: any;
  azureBlobService?: any;
}

export class ModelsContainer {
  private modelsRepository: ModelsRepository;
  private sketchfabService: any;
  private azureBlobService: any;

  constructor(deps: ModelsContainerDeps) {
    this.modelsRepository = new ModelsRepository(deps.db);
    this.sketchfabService = deps.sketchfabService || getSketchfabService();
    this.azureBlobService = deps.azureBlobService || getAzureBlobService();
  }

  getModelsRepository(): ModelsRepository {
    return this.modelsRepository;
  }

  getSketchfabService(): any {
    return this.sketchfabService;
  }

  getAzureBlobService(): any {
    return this.azureBlobService;
  }
}
