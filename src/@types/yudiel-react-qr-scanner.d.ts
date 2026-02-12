declare module '@yudiel/react-qr-scanner' {
  import { CSSProperties, ReactNode } from 'react';

  export interface IDetectedBarcode {
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    cornerPoints: Array<{ x: number; y: number }>;
    format: string;
    rawValue: string;
  }

  export interface IScannerComponents {
    audio?: boolean;
    torch?: boolean;
    finder?: boolean;
    tracker?: ((detectedCodes: IDetectedBarcode[], ctx: CanvasRenderingContext2D) => void) | boolean;
    onOff?: boolean;
    zoom?: boolean;
  }

  export interface IScannerStyles {
    container?: CSSProperties;
    video?: CSSProperties;
    finderBorder?: number;
  }

  export interface IScannerClassNames {
    container?: string;
    video?: string;
  }

  export interface IScannerProps {
    onScan: (detectedCodes: IDetectedBarcode[]) => void;
    onError?: (error: unknown) => void;
    constraints?: MediaTrackConstraints;
    formats?: string[];
    paused?: boolean;
    children?: ReactNode;
    components?: IScannerComponents;
    styles?: IScannerStyles;
    classNames?: IScannerClassNames;
    allowMultiple?: boolean;
    scanDelay?: number;
    sound?: boolean | string;
  }

  export function Scanner(props: IScannerProps): JSX.Element;

  export function useDevices(): {
    devices: MediaDeviceInfo[];
    loading: boolean;
    error: Error | null;
  };

  export function boundingBox(
    detectedCodes: IDetectedBarcode[],
    ctx: CanvasRenderingContext2D
  ): void;

  export function centerText(
    detectedCodes: IDetectedBarcode[],
    ctx: CanvasRenderingContext2D
  ): void;

  export function outline(
    detectedCodes: IDetectedBarcode[],
    ctx: CanvasRenderingContext2D
  ): void;
}
