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
    constructor(rows: number, cols: number, type: number);
    constructor(rows: number, cols: number, type: number, scalar: Scalar);
    delete(): void;
    rows: number;
    cols: number;
    data: Uint8Array;
    data32S: Int32Array;
    data32F: Float32Array;
    data64F: Float64Array;
    clone(): Mat;
    copyTo(dst: Mat): void;
    convertTo(dst: Mat, rtype: number, alpha?: number, beta?: number): void;
    total(): number;
    row(y: number): Mat;
    col(x: number): Mat;
  }

  export class MatVector {
    constructor();
    delete(): void;
    size(): number;
    get(index: number): Mat;
    push_back(mat: Mat): void;
  }

  export class Scalar {
    constructor(v0: number, v1?: number, v2?: number, v3?: number);
  }

  export class Rect {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  export function imread(imageElement: HTMLImageElement | HTMLCanvasElement): Mat;
  export function cvtColor(src: Mat, dst: Mat, code: number): void;
  export function threshold(src: Mat, dst: Mat, thresh: number, maxval: number, type: number): void;
  export function findContours(image: Mat, contours: MatVector, hierarchy: Mat, mode: number, method: number): void;
  export function contourArea(contour: Mat): number;
  export function matFromImageData(imageData: ImageData): Mat;
  export function Canny(src: Mat, dst: Mat, threshold1: number, threshold2: number, apertureSize?: number, L2gradient?: boolean): void;
  export function boundingRect(contour: Mat): Rect;
}

declare module '@techstark/opencv-js' {
  export = cv;
}