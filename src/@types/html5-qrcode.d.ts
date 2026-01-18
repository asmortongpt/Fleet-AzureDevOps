declare module 'html5-qrcode' {
  export interface Html5QrcodeResult {
    decodedText: string;
    result: {
      text: string;
      format?: {
        format: number;
        formatName: string;
      };
    };
  }

  export interface Html5QrcodeError {
    errorMessage: string;
    type: string;
  }

  export interface Html5QrcodeCameraScanConfig {
    fps?: number;
    qrbox?: number | { width: number; height: number };
    aspectRatio?: number;
    disableFlip?: boolean;
    videoConstraints?: MediaTrackConstraints;
  }

  export interface Html5QrcodeConfigs {
    formatsToSupport?: Html5QrcodeSupportedFormats[];
    experimentalFeatures?: {
      useBarCodeDetectorIfSupported?: boolean;
    };
    verbose?: boolean;
    supportedScanTypes?: Html5QrcodeScanType[];
  }

  export interface CameraDevice {
    id: string;
    label: string;
  }

  export enum Html5QrcodeSupportedFormats {
    QR_CODE = 0,
    AZTEC = 1,
    CODABAR = 2,
    CODE_39 = 3,
    CODE_93 = 4,
    CODE_128 = 5,
    DATA_MATRIX = 6,
    MAXICODE = 7,
    ITF = 8,
    EAN_13 = 9,
    EAN_8 = 10,
    PDF_417 = 11,
    RSS_14 = 12,
    RSS_EXPANDED = 13,
    UPC_A = 14,
    UPC_E = 15,
    UPC_EAN_EXTENSION = 16
  }

  export enum Html5QrcodeScanType {
    SCAN_TYPE_CAMERA = 0,
    SCAN_TYPE_FILE = 1
  }

  export enum Html5QrcodeScannerState {
    UNKNOWN = 0,
    NOT_STARTED = 1,
    SCANNING = 2,
    PAUSED = 3
  }

  export class Html5Qrcode {
    constructor(elementId: string, config?: Html5QrcodeConfigs);

    start(
      cameraIdOrConfig: string | MediaTrackConstraints,
      configuration: Html5QrcodeCameraScanConfig,
      qrCodeSuccessCallback: (decodedText: string, result: Html5QrcodeResult) => void,
      qrCodeErrorCallback?: (errorMessage: string, error: Html5QrcodeError) => void
    ): Promise<void>;

    stop(): Promise<void>;

    pause(shouldPauseVideo?: boolean): void;

    resume(): void;

    getState(): Html5QrcodeScannerState;

    clear(): Promise<void>;

    scanFile(
      imageFile: File,
      showImage?: boolean
    ): Promise<string>;

    scanFileV2(
      imageFile: File,
      showImage?: boolean
    ): Promise<Html5QrcodeResult>;

    static getCameras(): Promise<CameraDevice[]>;

    static getSupportedFormats(
      configOrVerbosityFlag?: boolean | Html5QrcodeConfigs
    ): Html5QrcodeSupportedFormats[];

    applyVideoConstraints(videoConstraints: MediaTrackConstraints): Promise<void>;

    getRunningTrackCapabilities(): MediaTrackCapabilities;

    getRunningTrackSettings(): MediaTrackSettings;

    getRunningTrackCameraCapabilities(): CameraCapabilities;
  }

  export interface CameraCapabilities {
    zoomFeature(): ZoomFeature;
    torchFeature(): TorchFeature;
  }

  export interface ZoomFeature {
    isSupported(): boolean;
    min(): number;
    max(): number;
    step(): number;
    value(): number;
    apply(value: number): Promise<void>;
  }

  export interface TorchFeature {
    isSupported(): boolean;
    value(): boolean;
    apply(value: boolean): Promise<void>;
  }

  export class Html5QrcodeScanner {
    constructor(
      elementId: string,
      config?: Html5QrcodeScannerConfig,
      verbose?: boolean
    );

    render(
      qrCodeSuccessCallback: (decodedText: string, result: Html5QrcodeResult) => void,
      qrCodeErrorCallback?: (errorMessage: string, error: Html5QrcodeError) => void
    ): void;

    pause(shouldPauseVideo?: boolean): void;

    resume(): void;

    getState(): Html5QrcodeScannerState;

    clear(): Promise<void>;

    applyVideoConstraints(videoConstraints: MediaTrackConstraints): Promise<void>;
  }

  export interface Html5QrcodeScannerConfig extends Html5QrcodeConfigs {
    fps?: number;
    qrbox?: number | { width: number; height: number } | ((viewfinderWidth: number, viewfinderHeight: number) => { width: number; height: number });
    aspectRatio?: number;
    disableFlip?: boolean;
    rememberLastUsedCamera?: boolean;
    showTorchButtonIfSupported?: boolean;
    showZoomSliderIfSupported?: boolean;
    defaultZoomValueIfSupported?: number;
    videoConstraints?: MediaTrackConstraints;
  }
}