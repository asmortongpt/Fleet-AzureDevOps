
export type CaptureType = 'mobile_photos' | 'mobile_video' | 'mobile_lidar' | 'rig_camera_array';

export type ScanStatus = 'created' | 'uploading' | 'uploaded' | 'processing' | 'ready' | 'failed' | 'needs_recapture';

export interface ScanAsset {
  name: string;
  container: string;
  blobName: string;
  contentType: string;
  sizeBytes?: number;
  sha256?: string;
  uploadedAt?: string;
}

export interface QualityMetrics {
  imageCount?: number;
  registeredImages?: number;
  reprojectionError?: number;
  coverageScore?: number;
  textureSharpness?: number;
  notes?: string[];
}

export interface EvidenceManifest {
  manifestVersion: string;
  scanSessionId: string;
  createdAt: string;
  files: Array<{ blobName: string; sha256: string; sizeBytes?: number }>;
  signature: string;
  signatureAlg: string;
}

export interface ScanSession {
  id: string;
  vehicleId: string;
  captureType: CaptureType;
  status: ScanStatus;
  rawAssets: ScanAsset[];
  processedAssets: ScanAsset[];
  quality?: QualityMetrics;
  evidence?: EvidenceManifest;
  createdAt: string;
  updatedAt: string;
}
