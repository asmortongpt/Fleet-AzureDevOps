/**
 * Fleet Mobile Camera Service
 *
 * Comprehensive camera service for photo capture, compression, GPS tagging,
 * EXIF metadata handling, and offline queue management
 */

import { Camera, CameraDevice } from 'react-native-vision-camera';
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CameraOptions,
  CameraPermissionStatus,
  LocationPermissionStatus,
  PhotoMetadata,
  PhotoWithGPS,
  GeoLocation,
  ExifData,
  CompressionOptions,
  QueueItem,
  QueueItemType,
  SyncStatus,
  OfflineQueue,
  CameraError,
  CameraErrorCode,
  LocationError,
  LocationErrorCode,
  FlashMode,
  STORAGE_KEYS,
} from '../types';

/**
 * CameraService - Singleton service for all camera operations
 */
class CameraService {
  private static instance: CameraService;
  private offlineQueue: OfflineQueue = {
    items: [],
    isProcessing: false,
  };
  private queueProcessingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeQueue();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  // ============================================================================
  // Permission Management
  // ============================================================================

  /**
   * Request camera permissions
   */
  public async requestCameraPermission(): Promise<CameraPermissionStatus> {
    try {
      const permission = await Camera.requestCameraPermission();

      return {
        granted: permission === 'granted',
        canAskAgain: permission !== 'denied',
        status:
          permission === 'granted'
            ? 'granted'
            : permission === 'denied'
            ? 'blocked'
            : 'denied',
      };
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      throw new CameraError(
        'Failed to request camera permission',
        CameraErrorCode.PERMISSION_DENIED,
        error as Error
      );
    }
  }

  /**
   * Check camera permission status
   */
  public async checkCameraPermission(): Promise<CameraPermissionStatus> {
    try {
      const permission = await Camera.getCameraPermissionStatus();

      return {
        granted: permission === 'granted',
        canAskAgain: permission !== 'denied',
        status:
          permission === 'granted'
            ? 'granted'
            : permission === 'denied'
            ? 'blocked'
            : 'denied',
      };
    } catch (error) {
      console.error('Error checking camera permission:', error);
      throw new CameraError(
        'Failed to check camera permission',
        CameraErrorCode.UNKNOWN,
        error as Error
      );
    }
  }

  /**
   * Request location permissions
   */
  public async requestLocationPermission(): Promise<LocationPermissionStatus> {
    return new Promise((resolve) => {
      Geolocation.requestAuthorization('whenInUse').then((status) => {
        resolve({
          granted: status === 'granted',
          canAskAgain: status !== 'denied',
          status:
            status === 'granted'
              ? 'granted'
              : status === 'denied'
              ? 'blocked'
              : 'denied',
        });
      });
    });
  }

  /**
   * Ensure all required permissions are granted
   */
  public async ensurePermissions(
    includeLocation: boolean = true
  ): Promise<{ camera: boolean; location: boolean }> {
    const cameraPermission = await this.checkCameraPermission();
    if (!cameraPermission.granted) {
      const requested = await this.requestCameraPermission();
      if (!requested.granted) {
        throw new CameraError(
          'Camera permission is required',
          CameraErrorCode.PERMISSION_DENIED
        );
      }
    }

    let locationGranted = true;
    if (includeLocation) {
      const locationPermission = await this.requestLocationPermission();
      locationGranted = locationPermission.granted;
    }

    return { camera: true, location: locationGranted };
  }

  // ============================================================================
  // Photo Capture
  // ============================================================================

  /**
   * Capture a photo with the camera
   */
  public async capturePhoto(
    cameraRef: any,
    options: CameraOptions = {}
  ): Promise<PhotoWithGPS> {
    try {
      const {
        quality = 90,
        includeGPS = true,
        includeExif = true,
        flashMode = FlashMode.AUTO,
      } = options;

      // Ensure permissions
      await this.ensurePermissions(includeGPS);

      // Capture photo
      const photo = await cameraRef.current?.takePhoto({
        flash: flashMode,
        enableShutterSound: true,
        qualityPrioritization: 'quality',
      });

      if (!photo) {
        throw new CameraError(
          'Failed to capture photo',
          CameraErrorCode.CAPTURE_FAILED
        );
      }

      // Get file info
      const fileInfo = await RNFS.stat(photo.path);

      // Create base metadata
      const metadata: PhotoMetadata = {
        id: this.generatePhotoId(),
        uri: `file://${photo.path}`,
        filename: photo.path.split('/').pop() || 'photo.jpg',
        timestamp: new Date(),
        size: fileInfo.size,
        width: photo.width,
        height: photo.height,
        mimeType: 'image/jpeg',
        compressed: false,
      };

      // Get GPS location if requested
      let location: GeoLocation | undefined;
      if (includeGPS) {
        try {
          location = await this.getCurrentLocation();
        } catch (error) {
          console.warn('Failed to get GPS location:', error);
          // Continue without GPS
        }
      }

      // Create photo with GPS
      const photoWithGPS: PhotoWithGPS = {
        ...metadata,
        location,
      };

      // Compress if needed
      if (options.maxWidth || options.maxHeight || quality < 100) {
        return await this.compressPhoto(photoWithGPS, {
          quality,
          maxWidth: options.maxWidth,
          maxHeight: options.maxHeight,
        });
      }

      return photoWithGPS;
    } catch (error) {
      console.error('Error capturing photo:', error);
      if (error instanceof CameraError) {
        throw error;
      }
      throw new CameraError(
        'Failed to capture photo',
        CameraErrorCode.CAPTURE_FAILED,
        error as Error
      );
    }
  }

  /**
   * Get current GPS location
   */
  public async getCurrentLocation(
    timeout: number = 15000
  ): Promise<GeoLocation> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude ?? undefined,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading ?? undefined,
            speed: position.coords.speed ?? undefined,
            timestamp: new Date(position.timestamp),
          });
        },
        (error) => {
          reject(
            new LocationError(
              error.message,
              this.mapLocationErrorCode(error.code),
              error
            )
          );
        },
        {
          enableHighAccuracy: true,
          timeout,
          maximumAge: 10000,
          showLocationDialog: true,
        }
      );
    });
  }

  /**
   * Map Geolocation error codes
   */
  private mapLocationErrorCode(code: number): LocationErrorCode {
    switch (code) {
      case 1:
        return LocationErrorCode.PERMISSION_DENIED;
      case 2:
        return LocationErrorCode.LOCATION_UNAVAILABLE;
      case 3:
        return LocationErrorCode.TIMEOUT;
      default:
        return LocationErrorCode.UNKNOWN;
    }
  }

  // ============================================================================
  // Image Compression
  // ============================================================================

  /**
   * Compress a photo
   */
  public async compressPhoto(
    photo: PhotoWithGPS,
    options: CompressionOptions
  ): Promise<PhotoWithGPS> {
    try {
      const { quality, maxWidth, maxHeight, format = 'JPEG' } = options;

      const compressedImage = await ImageResizer.createResizedImage(
        photo.uri,
        maxWidth || photo.width,
        maxHeight || photo.height,
        format,
        quality,
        0,
        undefined,
        false,
        {
          mode: 'contain',
          onlyScaleDown: true,
        }
      );

      const fileInfo = await RNFS.stat(compressedImage.path);

      return {
        ...photo,
        uri: compressedImage.uri,
        filename: compressedImage.name,
        size: fileInfo.size,
        width: compressedImage.width,
        height: compressedImage.height,
        compressed: true,
        originalSize: photo.size,
      };
    } catch (error) {
      console.error('Error compressing photo:', error);
      throw new CameraError(
        'Failed to compress photo',
        CameraErrorCode.COMPRESSION_FAILED,
        error as Error
      );
    }
  }

  /**
   * Batch compress multiple photos
   */
  public async compressPhotos(
    photos: PhotoWithGPS[],
    options: CompressionOptions,
    onProgress?: (current: number, total: number) => void
  ): Promise<PhotoWithGPS[]> {
    const compressed: PhotoWithGPS[] = [];

    for (let i = 0; i < photos.length; i++) {
      const compressedPhoto = await this.compressPhoto(photos[i], options);
      compressed.push(compressedPhoto);
      onProgress?.(i + 1, photos.length);
    }

    return compressed;
  }

  // ============================================================================
  // EXIF Metadata
  // ============================================================================

  /**
   * Add EXIF metadata to photo
   */
  public async addExifMetadata(
    photo: PhotoWithGPS,
    additionalMetadata: Partial<ExifData> = {}
  ): Promise<PhotoWithGPS> {
    try {
      const exifData: ExifData = {
        latitude: photo.location?.latitude,
        longitude: photo.location?.longitude,
        altitude: photo.location?.altitude,
        timestamp: photo.timestamp.toISOString(),
        ...additionalMetadata,
      };

      return {
        ...photo,
        exifData,
      };
    } catch (error) {
      console.error('Error adding EXIF metadata:', error);
      // Continue without EXIF
      return photo;
    }
  }

  // ============================================================================
  // File Management
  // ============================================================================

  /**
   * Save photo to persistent storage
   */
  public async savePhoto(photo: PhotoWithGPS): Promise<string> {
    try {
      const directory = `${RNFS.DocumentDirectoryPath}/photos`;
      await RNFS.mkdir(directory);

      const filename = `${photo.id}_${Date.now()}.jpg`;
      const destinationPath = `${directory}/${filename}`;

      await RNFS.copyFile(photo.uri.replace('file://', ''), destinationPath);

      return `file://${destinationPath}`;
    } catch (error) {
      console.error('Error saving photo:', error);
      throw new CameraError(
        'Failed to save photo',
        CameraErrorCode.SAVE_FAILED,
        error as Error
      );
    }
  }

  /**
   * Delete a photo from storage
   */
  public async deletePhoto(uri: string): Promise<void> {
    try {
      const path = uri.replace('file://', '');
      const exists = await RNFS.exists(path);
      if (exists) {
        await RNFS.unlink(path);
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  }

  /**
   * Get photo file size
   */
  public async getPhotoSize(uri: string): Promise<number> {
    try {
      const path = uri.replace('file://', '');
      const fileInfo = await RNFS.stat(path);
      return fileInfo.size;
    } catch (error) {
      console.error('Error getting photo size:', error);
      return 0;
    }
  }

  // ============================================================================
  // Offline Queue Management
  // ============================================================================

  /**
   * Initialize offline queue from storage
   */
  private async initializeQueue(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (queueData) {
        this.offlineQueue = JSON.parse(queueData);
      }

      // Start queue processor
      this.startQueueProcessor();
    } catch (error) {
      console.error('Error initializing offline queue:', error);
    }
  }

  /**
   * Add item to offline queue
   */
  public async addToQueue<T = any>(
    type: QueueItemType,
    data: T,
    priority: number = 5
  ): Promise<string> {
    const queueItem: QueueItem<T> = {
      id: this.generateQueueItemId(),
      type,
      data,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
      status: SyncStatus.PENDING,
      priority,
    };

    this.offlineQueue.items.push(queueItem);
    this.offlineQueue.items.sort((a, b) => b.priority - a.priority);

    await this.saveQueue();

    return queueItem.id;
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): OfflineQueue {
    return { ...this.offlineQueue };
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    if (this.queueProcessingInterval) {
      return;
    }

    this.queueProcessingInterval = setInterval(() => {
      this.processQueue();
    }, 30000); // Process every 30 seconds
  }

  /**
   * Stop queue processor
   */
  public stopQueueProcessor(): void {
    if (this.queueProcessingInterval) {
      clearInterval(this.queueProcessingInterval);
      this.queueProcessingInterval = null;
    }
  }

  /**
   * Process offline queue
   */
  public async processQueue(): Promise<void> {
    if (this.offlineQueue.isProcessing) {
      return;
    }

    this.offlineQueue.isProcessing = true;
    this.offlineQueue.lastSyncAttempt = new Date();

    try {
      const pendingItems = this.offlineQueue.items.filter(
        (item) =>
          item.status === SyncStatus.PENDING ||
          (item.status === SyncStatus.FAILED && item.attempts < item.maxAttempts)
      );

      for (const item of pendingItems) {
        try {
          item.status = SyncStatus.SYNCING;
          await this.syncQueueItem(item);
          item.status = SyncStatus.SYNCED;
          this.offlineQueue.lastSuccessfulSync = new Date();
        } catch (error) {
          item.attempts++;
          item.status = SyncStatus.FAILED;
          item.error = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Failed to sync queue item ${item.id}:`, error);
        }
      }

      // Remove synced items
      this.offlineQueue.items = this.offlineQueue.items.filter(
        (item) => item.status !== SyncStatus.SYNCED
      );

      await this.saveQueue();
    } finally {
      this.offlineQueue.isProcessing = false;
    }
  }

  /**
   * Sync a queue item (to be implemented based on your API)
   */
  private async syncQueueItem(item: QueueItem): Promise<void> {
    // TODO: Implement actual API sync based on item.type
    // This is a placeholder that should be replaced with actual API calls

    console.log(`Syncing queue item: ${item.type}`, item.data);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Example implementation:
    // switch (item.type) {
    //   case QueueItemType.DAMAGE_REPORT:
    //     await api.uploadDamageReport(item.data);
    //     break;
    //   case QueueItemType.PHOTO_UPLOAD:
    //     await api.uploadPhoto(item.data);
    //     break;
    //   default:
    //     throw new Error(`Unknown queue item type: ${item.type}`);
    // }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_QUEUE,
        JSON.stringify(this.offlineQueue)
      );
    } catch (error) {
      console.error('Error saving queue:', error);
    }
  }

  /**
   * Clear synced items from queue
   */
  public async clearSyncedItems(): Promise<void> {
    this.offlineQueue.items = this.offlineQueue.items.filter(
      (item) => item.status !== SyncStatus.SYNCED
    );
    await this.saveQueue();
  }

  /**
   * Retry failed items
   */
  public async retryFailedItems(): Promise<void> {
    this.offlineQueue.items.forEach((item) => {
      if (item.status === SyncStatus.FAILED) {
        item.status = SyncStatus.PENDING;
        item.attempts = 0;
        item.error = undefined;
      }
    });
    await this.saveQueue();
    await this.processQueue();
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Generate unique photo ID
   */
  private generatePhotoId(): string {
    return `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique queue item ID
   */
  private generateQueueItemId(): string {
    return `queue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get available camera devices
   */
  public async getAvailableDevices(): Promise<CameraDevice[]> {
    try {
      const devices = await Camera.getAvailableCameraDevices();
      return devices;
    } catch (error) {
      console.error('Error getting camera devices:', error);
      return [];
    }
  }

  /**
   * Format file size
   */
  public formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Calculate compression ratio
   */
  public calculateCompressionRatio(
    originalSize: number,
    compressedSize: number
  ): number {
    if (originalSize === 0) return 0;
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  }
}

export default CameraService.getInstance();
