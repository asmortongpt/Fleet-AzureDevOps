/**
 * Stub types for OpenCV.js (not available in Azure Static Web Apps)
 * These provide type definitions without requiring the actual package
 */

declare namespace cv {
  export const COLOR_RGB2GRAY: number;
  export const THRESH_BINARY: number;
  export const RETR_EXTERNAL: number;
  export const CHAIN_APPROX_SIMPLE: number;

  export class Mat {
    constructor();
    delete(): void;
  }

  export class MatVector {
    constructor();
    delete(): void;
  }

  export function imread(imageElement: any): Mat;
  export function cvtColor(src: Mat, dst: Mat, code: number): void;
  export function threshold(src: Mat, dst: Mat, thresh: number, maxval: number, type: number): void;
  export function findContours(image: Mat, contours: any, hierarchy: Mat, mode: number, method: number): void;
  export function contourArea(contour: any): number;
  export function matFromImageData(imageData: any): Mat;
  export function Canny(src: Mat, dst: Mat, threshold1: number, threshold2: number): void;
  export function boundingRect(contour: any): { x: number; y: number; width: number; height: number };
}

declare module '@techstark/opencv-js' {
  export = cv;
}
