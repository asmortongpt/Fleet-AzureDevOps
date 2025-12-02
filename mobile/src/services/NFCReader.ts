/**
 * NFCReader Service
 *
 * Comprehensive NFC tag reading and writing service with:
 * - Read NFC tags (NDEF, MIFARE, etc.)
 * - Write to NFC tags
 * - Vehicle check-in via NFC tap
 * - Driver identification
 * - Access control
 */

import NfcManager, { NfcTech, Ndef, NfcEvents } from 'react-native-nfc-manager'

export interface NFCTag {
  id: string
  type: string
  techTypes: string[]
  maxSize?: number
  isWritable?: boolean
}

export interface NFCRecord {
  tnf: number // Type Name Format
  type: string
  id?: string
  payload: string
}

export interface NFCMessage {
  records: NFCRecord[]
}

export interface VehicleNFCData {
  vehicleId: string
  vin: string
  make: string
  model: string
  year: number
  licensePlate?: string
  fleetNumber?: string
}

export interface DriverNFCData {
  driverId: string
  employeeId: string
  name: string
  licenseNumber?: string
  expirationDate?: string
}

export interface AccessControlData {
  accessLevel: 'basic' | 'advanced' | 'admin'
  permissions: string[]
  validUntil?: string
  zoneAccess?: string[]
}

class NFCReaderService {
  private isInitialized = false
  private isReading = false
  private readCallback: ((data: NFCMessage) => void) | null = null

  /**
   * Initialize NFC Manager
   */
  async init(): Promise<boolean> {
    if (this.isInitialized) return true

    try {
      const supported = await NfcManager.isSupported()
      if (!supported) {
        console.warn('NFC is not supported on this device')
        return false
      }

      await NfcManager.start()
      this.isInitialized = true
      console.log('NFC Manager initialized successfully')
      return true
    } catch (error) {
      console.error('Error initializing NFC Manager:', error)
      return false
    }
  }

  /**
   * Check if NFC is enabled on the device
   */
  async isEnabled(): Promise<boolean> {
    try {
      await this.init()
      const enabled = await NfcManager.isEnabled()
      return enabled
    } catch (error) {
      console.error('Error checking NFC status:', error)
      return false
    }
  }

  /**
   * Request NFC to be enabled (Android only)
   */
  async goToNfcSetting(): Promise<void> {
    try {
      await NfcManager.goToNfcSetting()
    } catch (error) {
      console.error('Error opening NFC settings:', error)
    }
  }

  /**
   * Read NFC tag
   */
  async readTag(): Promise<NFCMessage | null> {
    try {
      await this.init()

      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef)

      // Get tag info
      const tag = await NfcManager.getTag()
      console.log('NFC Tag detected:', tag)

      if (!tag) {
        await NfcManager.cancelTechnologyRequest()
        return null
      }

      // Read NDEF message
      const ndefMessage = tag.ndefMessage
      if (!ndefMessage || ndefMessage.length === 0) {
        await NfcManager.cancelTechnologyRequest()
        return null
      }

      const records: NFCRecord[] = ndefMessage.map((record: any) => ({
        tnf: record.tnf,
        type: Ndef.text.decodeType(record.type),
        id: record.id ? Ndef.text.decodePayload(record.id) : undefined,
        payload: this.decodePayload(record)
      }))

      await NfcManager.cancelTechnologyRequest()

      return { records }
    } catch (error) {
      console.error('Error reading NFC tag:', error)
      await NfcManager.cancelTechnologyRequest()
      return null
    }
  }

  /**
   * Read NFC tag continuously (listening mode)
   */
  async startReading(callback: (data: NFCMessage) => void): Promise<void> {
    if (this.isReading) {
      console.warn('Already reading NFC tags')
      return
    }

    try {
      await this.init()
      this.isReading = true
      this.readCallback = callback

      NfcManager.setEventListener(NfcEvents.DiscoverTag, async (tag: any) => {
        console.log('NFC Tag discovered:', tag)

        if (tag.ndefMessage && tag.ndefMessage.length > 0) {
          const records: NFCRecord[] = tag.ndefMessage.map((record: any) => ({
            tnf: record.tnf,
            type: Ndef.text.decodeType(record.type),
            id: record.id ? Ndef.text.decodePayload(record.id) : undefined,
            payload: this.decodePayload(record)
          }))

          if (this.readCallback) {
            this.readCallback({ records })
          }
        }
      })

      await NfcManager.registerTagEvent()
    } catch (error) {
      console.error('Error starting NFC reading:', error)
      this.isReading = false
      this.readCallback = null
    }
  }

  /**
   * Stop reading NFC tags
   */
  async stopReading(): Promise<void> {
    try {
      if (this.isReading) {
        await NfcManager.unregisterTagEvent()
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null)
        this.isReading = false
        this.readCallback = null
      }
    } catch (error) {
      console.error('Error stopping NFC reading:', error)
    }
  }

  /**
   * Write data to NFC tag
   */
  async writeTag(records: NFCRecord[]): Promise<boolean> {
    try {
      await this.init()

      // Request NFC technology
      await NfcManager.requestTechnology(NfcTech.Ndef)

      // Convert records to NDEF format
      const ndefRecords = records.map(record => {
        const typeBytes = Ndef.encodeMessage([
          Ndef.textRecord(record.type)
        ])[0].type
        const payloadBytes = Ndef.encodeMessage([
          Ndef.textRecord(record.payload)
        ])[0].payload

        return {
          tnf: record.tnf,
          type: typeBytes,
          id: record.id ? new TextEncoder().encode(record.id) : undefined,
          payload: payloadBytes
        }
      })

      // Write NDEF message to tag
      await NfcManager.ndefHandler.writeNdefMessage(ndefRecords)
      await NfcManager.cancelTechnologyRequest()

      console.log('NFC tag written successfully')
      return true
    } catch (error) {
      console.error('Error writing NFC tag:', error)
      await NfcManager.cancelTechnologyRequest()
      return false
    }
  }

  /**
   * Read vehicle data from NFC tag
   */
  async readVehicleTag(): Promise<VehicleNFCData | null> {
    const message = await this.readTag()
    if (!message) return null

    try {
      // Look for vehicle data record
      const vehicleRecord = message.records.find(
        record => record.type === 'application/fleet-vehicle'
      )

      if (!vehicleRecord) return null

      const data = JSON.parse(vehicleRecord.payload)
      return data as VehicleNFCData
    } catch (error) {
      console.error('Error parsing vehicle NFC data:', error)
      return null
    }
  }

  /**
   * Write vehicle data to NFC tag
   */
  async writeVehicleTag(vehicleData: VehicleNFCData): Promise<boolean> {
    const record: NFCRecord = {
      tnf: Ndef.TNF_MIME_MEDIA,
      type: 'application/fleet-vehicle',
      payload: JSON.stringify(vehicleData)
    }

    return await this.writeTag([record])
  }

  /**
   * Read driver identification from NFC tag (badge, card, etc.)
   */
  async readDriverTag(): Promise<DriverNFCData | null> {
    const message = await this.readTag()
    if (!message) return null

    try {
      // Look for driver data record
      const driverRecord = message.records.find(
        record => record.type === 'application/fleet-driver'
      )

      if (!driverRecord) return null

      const data = JSON.parse(driverRecord.payload)
      return data as DriverNFCData
    } catch (error) {
      console.error('Error parsing driver NFC data:', error)
      return null
    }
  }

  /**
   * Write driver data to NFC tag
   */
  async writeDriverTag(driverData: DriverNFCData): Promise<boolean> {
    const record: NFCRecord = {
      tnf: Ndef.TNF_MIME_MEDIA,
      type: 'application/fleet-driver',
      payload: JSON.stringify(driverData)
    }

    return await this.writeTag([record])
  }

  /**
   * Vehicle check-in via NFC tap
   */
  async vehicleCheckIn(
    authToken: string
  ): Promise<{ success: boolean; reservationId?: string; message?: string }> {
    const vehicleData = await this.readVehicleTag()

    if (!vehicleData) {
      return {
        success: false,
        message: 'Failed to read vehicle NFC tag'
      }
    }

    try {
      const response = await fetch('/api/mobile/checkin/nfc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          vehicleId: vehicleData.vehicleId,
          vin: vehicleData.vin,
          checkInMethod: 'nfc',
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        const result = await response.json()
        return {
          success: true,
          reservationId: result.reservationId,
          message: 'Check-in successful'
        }
      } else {
        const error = await response.json()
        return {
          success: false,
          message: error.message || 'Check-in failed'
        }
      }
    } catch (error) {
      console.error('Error during vehicle check-in:', error)
      return {
        success: false,
        message: 'Network error during check-in'
      }
    }
  }

  /**
   * Driver authentication via NFC badge
   */
  async authenticateDriver(
    authToken: string
  ): Promise<{ success: boolean; driverData?: DriverNFCData; message?: string }> {
    const driverData = await this.readDriverTag()

    if (!driverData) {
      return {
        success: false,
        message: 'Failed to read driver NFC badge'
      }
    }

    try {
      const response = await fetch('/api/mobile/driver/authenticate-nfc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          driverId: driverData.driverId,
          employeeId: driverData.employeeId,
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        return {
          success: true,
          driverData,
          message: 'Authentication successful'
        }
      } else {
        const error = await response.json()
        return {
          success: false,
          message: error.message || 'Authentication failed'
        }
      }
    } catch (error) {
      console.error('Error during driver authentication:', error)
      return {
        success: false,
        message: 'Network error during authentication'
      }
    }
  }

  /**
   * Read access control data from NFC tag
   */
  async readAccessControl(): Promise<AccessControlData | null> {
    const message = await this.readTag()
    if (!message) return null

    try {
      const accessRecord = message.records.find(
        record => record.type === 'application/fleet-access'
      )

      if (!accessRecord) return null

      const data = JSON.parse(accessRecord.payload)
      return data as AccessControlData
    } catch (error) {
      console.error('Error parsing access control data:', error)
      return null
    }
  }

  /**
   * Write access control data to NFC tag
   */
  async writeAccessControl(accessData: AccessControlData): Promise<boolean> {
    const record: NFCRecord = {
      tnf: Ndef.TNF_MIME_MEDIA,
      type: 'application/fleet-access',
      payload: JSON.stringify(accessData)
    }

    return await this.writeTag([record])
  }

  /**
   * Decode NFC record payload
   */
  private decodePayload(record: any): string {
    try {
      // Try to decode as text
      if (record.tnf === Ndef.TNF_WELL_KNOWN) {
        const typeStr = Ndef.text.decodeType(record.type)
        if (typeStr === 'T') {
          return Ndef.text.decodePayload(record.payload)
        } else if (typeStr === 'U') {
          return Ndef.uri.decodePayload(record.payload)
        }
      }

      // For other types, try to decode as string
      const decoder = new TextDecoder('utf-8')
      return decoder.decode(record.payload)
    } catch (error) {
      console.error('Error decoding payload:', error)
      return ''
    }
  }

  /**
   * Format NFC tag (erase all data)
   */
  async formatTag(): Promise<boolean> {
    try {
      await this.init()
      await NfcManager.requestTechnology(NfcTech.Ndef)

      // Write empty NDEF message
      await NfcManager.ndefHandler.writeNdefMessage([])
      await NfcManager.cancelTechnologyRequest()

      console.log('NFC tag formatted successfully')
      return true
    } catch (error) {
      console.error('Error formatting NFC tag:', error)
      await NfcManager.cancelTechnologyRequest()
      return false
    }
  }

  /**
   * Get tag information
   */
  async getTagInfo(): Promise<NFCTag | null> {
    try {
      await this.init()
      await NfcManager.requestTechnology(NfcTech.Ndef)

      const tag = await NfcManager.getTag()
      await NfcManager.cancelTechnologyRequest()

      if (!tag) return null

      return {
        id: tag.id || '',
        type: tag.type || 'unknown',
        techTypes: tag.techTypes || [],
        maxSize: tag.maxSize,
        isWritable: tag.isWritable
      }
    } catch (error) {
      console.error('Error getting tag info:', error)
      await NfcManager.cancelTechnologyRequest()
      return null
    }
  }

  /**
   * Clean up and release resources
   */
  async cleanup(): Promise<void> {
    try {
      await this.stopReading()
      await NfcManager.cancelTechnologyRequest()
      this.isInitialized = false
    } catch (error) {
      console.error('Error cleaning up NFC Manager:', error)
    }
  }
}

// Export singleton instance
export default new NFCReaderService()
