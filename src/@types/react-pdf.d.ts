declare module 'react-pdf' {
  import { ComponentType, ReactElement, ReactNode } from 'react';

  export interface DocumentProps {
    file?: string | File | ArrayBuffer | null;
    loading?: ReactElement | string;
    error?: ReactElement | string;
    noData?: ReactElement | string;
    onLoadSuccess?: (pdf: PDFDocumentProxy) => void;
    onLoadError?: (error: Error) => void;
    onSourceSuccess?: () => void;
    onSourceError?: (error: Error) => void;
    rotate?: number;
    className?: string;
    children?: ReactNode;
    inputRef?: React.Ref<HTMLDivElement>;
    imageResourcesPath?: string;
    options?: {
      cMapUrl?: string;
      cMapPacked?: boolean;
      standardFontDataUrl?: string;
      workerSrc?: string;
      withCredentials?: boolean;
    };
    renderMode?: 'canvas' | 'svg' | 'none';
    externalLinkTarget?: '_self' | '_blank' | '_parent' | '_top';
    externalLinkRel?: string;
  }

  export interface PageProps {
    pageNumber?: number;
    pageIndex?: number;
    scale?: number;
    width?: number;
    height?: number;
    rotate?: number;
    loading?: ReactElement | string;
    error?: ReactElement | string;
    noData?: ReactElement | string;
    onLoadSuccess?: (page: PDFPageProxy) => void;
    onLoadError?: (error: Error) => void;
    onRenderSuccess?: () => void;
    onRenderError?: (error: Error) => void;
    onGetAnnotationsSuccess?: (annotations: any) => void;
    onGetAnnotationsError?: (error: Error) => void;
    onGetTextSuccess?: (textContent: any) => void;
    onGetTextError?: (error: Error) => void;
    className?: string;
    customTextRenderer?: (textItem: any) => string;
    renderAnnotationLayer?: boolean;
    renderForms?: boolean;
    renderTextLayer?: boolean;
    renderMode?: 'canvas' | 'svg' | 'none';
    canvasBackground?: string;
    canvasRef?: React.Ref<HTMLCanvasElement>;
    inputRef?: React.Ref<HTMLDivElement>;
    devicePixelRatio?: number;
  }

  export interface PDFDocumentProxy {
    numPages: number;
    fingerprint: string;
    getPage: (pageNumber: number) => Promise<PDFPageProxy>;
    getPageIndex: (ref: any) => Promise<number>;
    getDestinations: () => Promise<any>;
    getDestination: (id: string) => Promise<any>;
    getPageLabels: () => Promise<string[] | null>;
    getPageMode: () => Promise<string>;
    getOpenAction: () => Promise<any>;
    getAttachments: () => Promise<any>;
    getJavaScript: () => Promise<string[] | null>;
    getOutline: () => Promise<any>;
    getPermissions: () => Promise<any>;
    getMetadata: () => Promise<any>;
    getData: () => Promise<Uint8Array>;
    getDownloadInfo: () => Promise<{ length: number }>;
    getStats: () => Promise<any>;
    cleanup: () => void;
    destroy: () => void;
  }

  export interface PDFPageProxy {
    pageNumber: number;
    rotate: number;
    ref: any;
    userUnit: number;
    view: number[];
    getViewport: (options: { scale: number; rotation?: number; offsetX?: number; offsetY?: number; dontFlip?: boolean }) => PDFPageViewport;
    getAnnotations: (params?: { intent?: string }) => Promise<any[]>;
    render: (params: { canvasContext: CanvasRenderingContext2D; viewport: PDFPageViewport; intent?: string; enableWebGL?: boolean; renderInteractiveForms?: boolean; transform?: number[]; imageLayer?: any; canvasFactory?: any; background?: string }) => PDFRenderTask;
    getTextContent: (params?: { normalizeWhitespace?: boolean; disableCombineTextItems?: boolean }) => Promise<any>;
    cleanup: () => void;
  }

  export interface PDFPageViewport {
    width: number;
    height: number;
    scale: number;
    rotation: number;
    offsetX: number;
    offsetY: number;
    transform: number[];
    viewBox: number[];
    convertToViewportPoint: (x: number, y: number) => number[];
    convertToViewportRectangle: (rect: number[]) => number[];
    convertToPdfPoint: (x: number, y: number) => number[];
  }

  export interface PDFRenderTask {
    promise: Promise<void>;
    cancel: () => void;
  }

  export const Document: ComponentType<DocumentProps>;
  export const Page: ComponentType<PageProps>;
  export const pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: string;
    };
    version: string;
    disableWorker: boolean;
  };

  export function resetPdfjs(): void;
}

declare module 'react-pdf/dist/esm/entry.webpack' {
  export * from 'react-pdf';
}