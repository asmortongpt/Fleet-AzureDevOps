export interface LODConfig {
  enabled: boolean;
  distances?: number[];
}

export class LODSystem {
  private config: LODConfig;
  constructor(config: LODConfig = { enabled: true }) {
    this.config = config;
  }
  update(camera: any, objects: any[]): void {}
  setDistances(distances: number[]): void {
    this.config.distances = distances;
  }
}

export default LODSystem;
