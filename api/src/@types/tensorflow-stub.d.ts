/**
 * Stub types for TensorFlow.js (not available in Azure Static Web Apps)
 * These provide type definitions without requiring the actual package
 */

declare namespace tf {
  export interface Tensor<R extends Rank = Rank> {
    dataSync(): any[];
    array(): Promise<any>;
    dispose(): void;
  }

  export type Rank = 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6';

  export interface LayersModel {
    predict(x: any): Tensor;
    dispose(): void;
  }

  export interface GraphModel {
    predict(x: any): Tensor;
    dispose(): void;
  }

  export function loadLayersModel(path: string): Promise<LayersModel>;
  export function loadGraphModel(path: string): Promise<GraphModel>;
  export function tensor(data: any, shape?: number[]): Tensor;
  export function tensor2d(data: any, shape?: [number, number]): Tensor;
  export function tensor3d(data: any, shape?: [number, number, number]): Tensor;
  export function tidy<T>(fn: () => T): T;
}

declare module '@tensorflow/tfjs-node' {
  export = tf;
}