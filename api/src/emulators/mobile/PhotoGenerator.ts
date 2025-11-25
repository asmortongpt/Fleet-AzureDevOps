/**
 * PhotoGenerator - Generates realistic placeholder images for mobile app submissions
 *
 * Simulates:
 * - Fuel receipt photos with OCR-readable text
 * - Damage photos (scratches, dents, collision)
 * - Inspection photos (tires, lights, mirrors, interior)
 * - Includes realistic metadata (GPS, EXIF, timestamps)
 */

import { EventEmitter } from 'events'

export interface PhotoMetadata {
  filename: string
  mime_type: string
  file_size_bytes: number
  width: number
  height: number
  latitude?: number
  longitude?: number
  altitude?: number
  accuracy?: number
  timestamp: Date
  exif?: {
    make?: string
    model?: string
    orientation?: number
    iso?: number
    aperture?: number
    focal_length?: number
  }
  device_info?: {
    platform: string
    os_version: string
    app_version: string
    network_type: string
  }
  annotations?: {
    type: 'arrow' | 'circle' | 'text' | 'freehand'
    points: number[][]
    color: string
    text?: string
  }[]
}

export interface GeneratedPhoto {
  url: string // Placeholder URL or data URI
  metadata: PhotoMetadata
  blob_path?: string // Azure Blob Storage path
  type: 'fuel_receipt' | 'damage' | 'inspection' | 'general'
  tags: string[]
  description: string
}

export class PhotoGenerator extends EventEmitter {
  private fuelVendors = ['Shell', 'BP', 'Chevron', 'Speedway', 'Exxon', 'Mobil', 'Circle K', 'Wawa']
  private deviceModels = [
    { make: 'Apple', model: 'iPhone 14 Pro', platform: 'iOS', os: '17.2' },
    { make: 'Apple', model: 'iPhone 13', platform: 'iOS', os: '17.1' },
    { make: 'Samsung', model: 'Galaxy S23', platform: 'Android', os: '14' },
    { make: 'Google', model: 'Pixel 8', platform: 'Android', os: '14' }
  ]

  constructor() {
    super()
  }

  /**
   * Generate a fuel receipt photo
   */
  public generateFuelReceipt(
    vendor: string,
    gallons: number,
    pricePerGallon: number,
    totalCost: number,
    location: { lat: number; lng: number },
    timestamp: Date
  ): GeneratedPhoto {
    const device = this.deviceModels[Math.floor(Math.random() * this.deviceModels.length)]

    // Generate placeholder URL with receipt data visible
    const receiptText = `${vendor}\nFuel Receipt\n$${pricePerGallon.toFixed(2)}/gal\n${gallons.toFixed(2)} gal\nTotal: $${totalCost.toFixed(2)}`
    const encodedText = encodeURIComponent(receiptText)
    const url = `https://via.placeholder.com/800x1200/ffffff/000000?text=${encodedText}`

    const metadata: PhotoMetadata = {
      filename: `receipt_${vendor.toLowerCase()}_${timestamp.getTime()}.jpg`,
      mime_type: 'image/jpeg',
      file_size_bytes: Math.floor(Math.random() * (500000 - 200000) + 200000), // 200KB-500KB
      width: 800,
      height: 1200,
      latitude: location.lat,
      longitude: location.lng,
      accuracy: Math.random() * 10 + 5, // 5-15m
      timestamp,
      exif: {
        make: device.make,
        model: device.model,
        orientation: 1,
        iso: 200,
        aperture: 1.8,
        focal_length: 26
      },
      device_info: {
        platform: device.platform,
        os_version: device.os,
        app_version: '2.5.1',
        network_type: Math.random() > 0.3 ? 'WiFi' : '4G'
      }
    }

    return {
      url,
      metadata,
      blob_path: `mobile-photos/receipts/${metadata.filename}`,
      type: 'fuel_receipt',
      tags: ['fuel', 'receipt', vendor.toLowerCase()],
      description: `${vendor} fuel receipt - ${gallons.toFixed(1)} gallons @ $${pricePerGallon.toFixed(2)}/gal`
    }
  }

  /**
   * Generate damage report photos
   */
  public generateDamagePhotos(
    severity: 'minor' | 'moderate' | 'severe',
    damageType: string,
    location: { lat: number; lng: number },
    timestamp: Date,
    count: number = 3
  ): GeneratedPhoto[] {
    const photos: GeneratedPhoto[] = []
    const angles = ['front', 'rear', 'left', 'right', 'closeup', 'interior']
    const device = this.deviceModels[Math.floor(Math.random() * this.deviceModels.length)]

    for (let i = 0; i < count; i++) {
      const angle = angles[i % angles.length]
      const damageText = `${severity.toUpperCase()}\n${damageType}\n${angle} view`
      const color = severity === 'severe' ? 'ff0000' : severity === 'moderate' ? 'ff9900' : 'ffff00'
      const url = `https://via.placeholder.com/1200x800/${color}/ffffff?text=${encodeURIComponent(damageText)}`

      const metadata: PhotoMetadata = {
        filename: `damage_${severity}_${angle}_${timestamp.getTime()}_${i}.jpg`,
        mime_type: 'image/jpeg',
        file_size_bytes: Math.floor(Math.random() * (800000 - 400000) + 400000), // 400KB-800KB
        width: 1200,
        height: 800,
        latitude: location.lat + (Math.random() - 0.5) * 0.0001,
        longitude: location.lng + (Math.random() - 0.5) * 0.0001,
        accuracy: Math.random() * 15 + 10, // 10-25m
        timestamp: new Date(timestamp.getTime() + i * 15000), // 15s between photos
        exif: {
          make: device.make,
          model: device.model,
          orientation: 1,
          iso: 320,
          aperture: 1.8,
          focal_length: 26
        },
        device_info: {
          platform: device.platform,
          os_version: device.os,
          app_version: '2.5.1',
          network_type: 'WiFi'
        },
        annotations: i === 0 ? [{
          type: 'circle',
          points: [[600, 400], [700, 500]],
          color: '#ff0000',
          text: `${damageType} here`
        }] : undefined
      }

      photos.push({
        url,
        metadata,
        blob_path: `mobile-photos/damage/${metadata.filename}`,
        type: 'damage',
        tags: ['damage', severity, damageType.toLowerCase(), angle],
        description: `${severity} ${damageType} - ${angle} view`
      })
    }

    return photos
  }

  /**
   * Generate vehicle inspection photos
   */
  public generateInspectionPhotos(
    inspectionType: 'pre_trip' | 'post_trip' | 'annual',
    itemName: string,
    passed: boolean,
    location: { lat: number; lng: number },
    timestamp: Date
  ): GeneratedPhoto {
    const device = this.deviceModels[Math.floor(Math.random() * this.deviceModels.length)]
    const status = passed ? 'PASS' : 'FAIL'
    const color = passed ? '00ff00' : 'ff0000'
    const text = `${inspectionType.toUpperCase()}\n${itemName}\n${status}`
    const url = `https://via.placeholder.com/1200x800/${color}/ffffff?text=${encodeURIComponent(text)}`

    const metadata: PhotoMetadata = {
      filename: 'inspection_${inspectionType}_${itemName.replace(/\s+/g, '_').toLowerCase()}_${timestamp.getTime()}.jpg',
      mime_type: 'image/jpeg',
      file_size_bytes: Math.floor(Math.random() * (600000 - 300000) + 300000), // 300KB-600KB
      width: 1200,
      height: 800,
      latitude: location.lat,
      longitude: location.lng,
      accuracy: Math.random() * 8 + 5, // 5-13m
      timestamp,
      exif: {
        make: device.make,
        model: device.model,
        orientation: 1,
        iso: 250,
        aperture: 2.0,
        focal_length: 26
      },
      device_info: {
        platform: device.platform,
        os_version: device.os,
        app_version: '2.5.1',
        network_type: Math.random() > 0.5 ? 'WiFi' : '5G'
      }
    }

    return {
      url,
      metadata,
      blob_path: `mobile-photos/inspections/${metadata.filename}`,
      type: 'inspection',
      tags: ['inspection', inspectionType, itemName.toLowerCase(), status.toLowerCase()],
      description: `${inspectionType} inspection - ${itemName}: ${status}`
    }
  }

  /**
   * Generate general purpose photo
   */
  public generateGeneralPhoto(
    description: string,
    location: { lat: number; lng: number },
    timestamp: Date
  ): GeneratedPhoto {
    const device = this.deviceModels[Math.floor(Math.random() * this.deviceModels.length)]
    const url = `https://via.placeholder.com/1200x800/cccccc/333333?text=${encodeURIComponent(description)}`

    const metadata: PhotoMetadata = {
      filename: `photo_${timestamp.getTime()}.jpg`,
      mime_type: 'image/jpeg',
      file_size_bytes: Math.floor(Math.random() * (700000 - 400000) + 400000),
      width: 1200,
      height: 800,
      latitude: location.lat,
      longitude: location.lng,
      accuracy: Math.random() * 12 + 8,
      timestamp,
      exif: {
        make: device.make,
        model: device.model,
        orientation: 1,
        iso: 200,
        aperture: 1.8,
        focal_length: 26
      },
      device_info: {
        platform: device.platform,
        os_version: device.os,
        app_version: '2.5.1',
        network_type: Math.random() > 0.4 ? 'WiFi' : '4G'
      }
    }

    return {
      url,
      metadata,
      blob_path: `mobile-photos/general/${metadata.filename}`,
      type: 'general',
      tags: ['general'],
      description
    }
  }

  /**
   * Get random fuel vendor
   */
  public getRandomVendor(): string {
    return this.fuelVendors[Math.floor(Math.random() * this.fuelVendors.length)]
  }

  /**
   * Compress photo metadata for storage
   */
  public compressMetadata(photo: GeneratedPhoto): string {
    return JSON.stringify({
      f: photo.metadata.filename,
      m: photo.metadata.mime_type,
      s: photo.metadata.file_size_bytes,
      w: photo.metadata.width,
      h: photo.metadata.height,
      lat: photo.metadata.latitude,
      lng: photo.metadata.longitude,
      t: photo.metadata.timestamp.toISOString(),
      d: photo.metadata.device_info,
      e: photo.metadata.exif
    })
  }
}
