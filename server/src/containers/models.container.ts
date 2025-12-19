import { Pool } from 'pg';

import { Model3DRepository } from '../repositories/model3d.repository';
import { getAzureBlobService } from '../services/azure-blob';
import { getSketchfabService } from '../services/sketchfab';

export interface ModelsContainerDeps {
  db: Pool;
  sketchfabService?: any;
  azureBlobService?: any;
}

export class ModelsContainer {
  private modelsRepository: Model3DRepository;
  private sketchfabService: any;
  private azureBlobService: any;

  constructor(deps: ModelsContainerDeps) {
    this.modelsRepository = new Model3DRepository(deps.db);
    this.sketchfabService = deps.sketchfabService || getSketchfabService();
    this.azureBlobService = deps.azureBlobService || getAzureBlobService();
  }

  getModelsRepository(): Model3DRepository {
    return this.modelsRepository;
  }

  getSketchfabService(): any {
    return this.sketchfabService;
  }

  getAzureBlobService(): any {
    return this.azureBlobService;
  }
}
