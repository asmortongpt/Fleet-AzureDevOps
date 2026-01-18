declare module '@yudiel/react-qr-scanner' {
  import { CSSProperties, ReactNode } from 'react';

  export interface QrScannerProps {
    onDecode?: (result: string) => void;
    onError?: (error: Error) => void;
    onResult?: (result: QrResult) => void;
    constraints?: MediaTrackConstraints;
    containerStyle?: CSSProperties;
    videoStyle?: CSSProperties;
    ViewFinder?: () => ReactNode;
    scanDelay?: number;
    deviceId?: string;
    aspectRatio?: string;
    facingMode?: 'user' | 'environment';
  }

  export interface QrResult {
    text: string;
    rawBytes: Uint8Array;
    numBits: number;
    resultPoints: ResultPoint[];
    format: string;
    timestamp: number;
    resultMetadata: Map<string, any>;
  }

  export interface ResultPoint {
    x: number;
    y: number;
  }

  export const QrScanner: React.FC<QrScannerProps>;
}