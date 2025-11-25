/**
 * Vehicle Identification Service
 *
 * Provides multiple methods to identify vehicles:
 * - VIN barcode/QR scanning
 * - License plate OCR (photo recognition)
 * - Manual VIN/plate entry
 * - Vehicle QR code generation for printing
 */

import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import pool from '../config/database'

export interface VehicleIdentification {
  vehicleId: string
  vehicleNumber: string
  vin?: string
  licensePlate?: string
  make?: string
  model?: string
  year?: number
  qrCode?: string
}

export class VehicleIdentificationService {
  /**
   * Generate QR code for a vehicle
   * Admin can print this and affix to vehicle
   */
  async generateVehicleQRCode(vehicleId: string, tenantId: string): Promise<string> {
    try {
      // Get vehicle details
      const vehicleResult = await pool.query(
        `SELECT id, vehicle_number, vin, license_plate, make, model, year
         FROM vehicles
         WHERE id = $1 AND tenant_id = $2',
        [vehicleId, tenantId]
      )

      if (vehicleResult.rows.length === 0) {
        throw new Error('Vehicle not found')
      }

      const vehicle = vehicleResult.rows[0]

      // Generate unique QR code identifier
      const qrIdentifier = `FLEET-${vehicle.vehicle_number}-${uuidv4().slice(0, 8).toUpperCase()}`

      // Create QR code data payload
      const qrData = JSON.stringify({
        type: 'fleet_vehicle',
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicle_number,
        vin: vehicle.vin,
        licensePlate: vehicle.license_plate,
        identifier: qrIdentifier,
        tenantId
      })

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2
      })

      // Store QR code reference in database
      await pool.query(
        `UPDATE vehicles
         SET qr_code = $1, updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3',
        [qrIdentifier, vehicleId, tenantId]
      )

      return qrCodeDataUrl
    } catch (error) {
      console.error('Error generating vehicle QR code:', error)
      throw new Error('Failed to generate vehicle QR code')
    }
  }

  /**
   * Identify vehicle by scanning QR code
   */
  async identifyByQRCode(qrData: string, tenantId: string): Promise<VehicleIdentification | null> {
    try {
      // Parse QR code data
      const parsed = JSON.parse(qrData)

      if (parsed.type !== 'fleet_vehicle') {
        throw new Error('Invalid QR code type')
      }

      // Look up vehicle
      const result = await pool.query(
        `SELECT id, vehicle_number, vin, license_plate, make, model, year, qr_code
         FROM vehicles
         WHERE id = $1 AND tenant_id = $2',
        [parsed.vehicleId, tenantId]
      )

      if (result.rows.length === 0) {
        return null
      }

      const vehicle = result.rows[0]
      return {
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicle_number,
        vin: vehicle.vin,
        licensePlate: vehicle.license_plate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        qrCode: vehicle.qr_code
      }
    } catch (error) {
      console.error('Error identifying vehicle by QR code:', error)
      return null
    }
  }

  /**
   * Identify vehicle by VIN (from barcode scan or manual entry)
   */
  async identifyByVIN(vin: string, tenantId: string): Promise<VehicleIdentification | null> {
    try {
      const result = await pool.query(
        `SELECT id, vehicle_number, vin, license_plate, make, model, year, qr_code
         FROM vehicles
         WHERE UPPER(vin) = UPPER($1) AND tenant_id = $2',
        [vin.trim(), tenantId]
      )

      if (result.rows.length === 0) {
        return null
      }

      const vehicle = result.rows[0]
      return {
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicle_number,
        vin: vehicle.vin,
        licensePlate: vehicle.license_plate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        qrCode: vehicle.qr_code
      }
    } catch (error) {
      console.error('Error identifying vehicle by VIN:', error)
      return null
    }
  }

  /**
   * Identify vehicle by license plate (from OCR or manual entry)
   */
  async identifyByLicensePlate(
    licensePlate: string,
    tenantId: string
  ): Promise<VehicleIdentification | null> {
    try {
      // Normalize license plate (remove spaces, hyphens, make uppercase)
      const normalized = licensePlate.replace(/[\s-]/g, '').toUpperCase()

      const result = await pool.query(
        `SELECT id, vehicle_number, vin, license_plate, make, model, year, qr_code
         FROM vehicles
         WHERE UPPER(REPLACE(REPLACE(license_plate, ' ', ''), '-', '')) = $1
         AND tenant_id = $2',
        [normalized, tenantId]
      )

      if (result.rows.length === 0) {
        return null
      }

      const vehicle = result.rows[0]
      return {
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicle_number,
        vin: vehicle.vin,
        licensePlate: vehicle.license_plate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        qrCode: vehicle.qr_code
      }
    } catch (error) {
      console.error('Error identifying vehicle by license plate:', error)
      return null
    }
  }

  /**
   * Process license plate image using OCR
   * This is a placeholder - in production, integrate with Azure Computer Vision or similar
   */
  async processLicensePlateImage(
    imageData: string,
    tenantId: string
  ): Promise<VehicleIdentification | null> {
    try {
      // PRODUCTION TODO: Integrate with Azure Computer Vision API
      // https://docs.microsoft.com/en-us/azure/cognitive-services/computer-vision/overview-ocr

      // For now, return a helpful error message
      throw new Error(
        'License plate OCR requires Azure Computer Vision integration. ' +
        'Please configure AZURE_COMPUTER_VISION_KEY and AZURE_COMPUTER_VISION_ENDPOINT in environment variables.'
      )

      // Example production implementation:
      /*
      const ComputerVisionClient = require('@azure/cognitiveservices-computervision').ComputerVisionClient
      const ApiKeyCredentials = require('@azure/ms-rest-js').ApiKeyCredentials

      const key = process.env.AZURE_COMPUTER_VISION_KEY
      const endpoint = process.env.AZURE_COMPUTER_VISION_ENDPOINT

      if (!key || !endpoint) {
        throw new Error('Azure Computer Vision not configured')
      }

      const computerVisionClient = new ComputerVisionClient(
        new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': key } }),
        endpoint
      )

      // Read text from image
      const result = await computerVisionClient.readInStream(imageData)

      // Extract license plate number from OCR results
      // This requires custom logic to identify plate format
      const licensePlate = extractLicensePlateFromOCR(result)

      // Look up vehicle
      return await this.identifyByLicensePlate(licensePlate, tenantId)
      */
    } catch (error) {
      console.error('Error processing license plate image:', error)
      throw error
    }
  }

  /**
   * Search vehicles by multiple criteria
   */
  async searchVehicles(
    searchTerm: string,
    tenantId: string
  ): Promise<VehicleIdentification[]> {
    try {
      const result = await pool.query(
        `SELECT id, vehicle_number, vin, license_plate, make, model, year, qr_code
         FROM vehicles
         WHERE tenant_id = $1
         AND (
           UPPER(vehicle_number) LIKE UPPER($2) OR
           UPPER(vin) LIKE UPPER($2) OR
           UPPER(license_plate) LIKE UPPER($2) OR
           UPPER(make) LIKE UPPER($2) OR
           UPPER(model) LIKE UPPER($2)
         )
         ORDER BY vehicle_number
         LIMIT 20`,
        [tenantId, `%${searchTerm}%`]
      )

      return result.rows.map(vehicle => ({
        vehicleId: vehicle.id,
        vehicleNumber: vehicle.vehicle_number,
        vin: vehicle.vin,
        licensePlate: vehicle.license_plate,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        qrCode: vehicle.qr_code
      }))
    } catch (error) {
      console.error('Error searching vehicles:', error)
      return []
    }
  }

  /**
   * Validate VIN format (basic check)
   */
  isValidVIN(vin: string): boolean {
    // VIN must be exactly 17 characters (excluding spaces)
    const cleaned = vin.replace(/\s/g, '')
    if (cleaned.length !== 17) {
      return false
    }

    // VIN cannot contain I, O, or Q (to avoid confusion with 1, 0)
    if (/[IOQ]/i.test(cleaned)) {
      return false
    }

    // Must be alphanumeric
    if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(cleaned)) {
      return false
    }

    return true
  }

  /**
   * Generate printable QR code label (PDF or image)
   */
  async generatePrintableLabel(
    vehicleId: string,
    tenantId: string
  ): Promise<{ qrCode: string; labelData: any }> {
    try {
      const vehicle = await pool.query(
        `SELECT id, vehicle_number, vin, license_plate, make, model, year, qr_code
         FROM vehicles
         WHERE id = $1 AND tenant_id = $2',
        [vehicleId, tenantId]
      )

      if (vehicle.rows.length === 0) {
        throw new Error('Vehicle not found')
      }

      const v = vehicle.rows[0]

      // Generate or retrieve QR code
      let qrCodeDataUrl = ''
      if (!v.qr_code) {
        qrCodeDataUrl = await this.generateVehicleQRCode(vehicleId, tenantId)
      } else {
        const qrData = JSON.stringify({
          type: 'fleet_vehicle',
          vehicleId: v.id,
          vehicleNumber: v.vehicle_number,
          vin: v.vin,
          licensePlate: v.license_plate,
          identifier: v.qr_code,
          tenantId
        })
        qrCodeDataUrl = await QRCode.toDataURL(qrData, {
          errorCorrectionLevel: 'H',
          width: 300
        })
      }

      return {
        qrCode: qrCodeDataUrl,
        labelData: {
          vehicleNumber: v.vehicle_number,
          vin: v.vin,
          licensePlate: v.license_plate,
          make: v.make,
          model: v.model,
          year: v.year,
          qrIdentifier: v.qr_code
        }
      }
    } catch (error) {
      console.error('Error generating printable label:', error)
      throw new Error('Failed to generate printable label')
    }
  }
}

// Export function to get singleton instance (lazy initialization)
let serviceInstance: VehicleIdentificationService | null = null

export function getVehicleIdentificationService(): VehicleIdentificationService {
  if (!serviceInstance) {
    serviceInstance = new VehicleIdentificationService()
  }
  return serviceInstance
}

export default getVehicleIdentificationService
