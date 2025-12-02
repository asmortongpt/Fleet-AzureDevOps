/**
 * DashcamIntegration Service
 *
 * Comprehensive dashcam integration with:
 * - Connect to dashcam via WiFi
 * - Stream live video
 * - Download footage for incidents
 * - Tag events with timestamp
 * - Configure dashcam settings
 * - Support for multiple dashcam brands (BlackVue, Garmin, Nextbase, etc.)
 */

import WifiManager from 'react-native-wifi-reborn'
import { Platform } from 'react-native'

export interface DashcamInfo {
  brand: string
  model: string
  serialNumber: string
  firmwareVersion: string
  ipAddress: string
  macAddress?: string
  storageCapacity?: number
  storageUsed?: number
  batteryLevel?: number
  isRecording?: boolean
}

export interface DashcamVideo {
  id: string
  filename: string
  timestamp: Date
  duration: number // seconds
  size: number // bytes
  type: 'normal' | 'event' | 'parking' | 'manual'
  resolution: string
  gpsData?: GPSData
  thumbnail?: string
  url: string
}

export interface GPSData {
  latitude: number
  longitude: number
  speed?: number
  heading?: number
}

export interface VideoSegment {
  startTime: Date
  endTime: Date
  url: string
}

export interface DashcamEvent {
  id: string
  timestamp: Date
  type: 'impact' | 'harsh_braking' | 'harsh_acceleration' | 'harsh_turn' | 'manual'
  severity?: 'low' | 'medium' | 'high'
  gpsData?: GPSData
  videoUrl?: string
  notes?: string
}

export interface DashcamSettings {
  resolution: '1080p' | '1440p' | '4K'
  frameRate: 30 | 60
  nightMode: boolean
  parkingMode: boolean
  gSensor: {
    enabled: boolean
    sensitivity: 'low' | 'medium' | 'high'
  }
  audioRecording: boolean
  timestamp: boolean
  speedDisplay: boolean
  wifiAutoOn: boolean
}

export interface StreamConfig {
  quality: 'low' | 'medium' | 'high'
  width: number
  height: number
  fps: number
}

type ProgressCallback = (progress: number, downloaded: number, total: number) => void

class DashcamIntegrationService {
  private connectedDashcam: DashcamInfo | null = null
  private baseUrl: string = ''
  private streamUrl: string = ''
  private isStreaming = false

  // Dashcam WiFi SSID patterns
  private readonly DASHCAM_SSID_PATTERNS = [
    /^BlackVue/,
    /^GARMIN/,
    /^Nextbase/,
    /^VIOFO/,
    /^Thinkware/,
    /^Street Guardian/,
    /^DR\d+/
  ]

  /**
   * Scan for nearby dashcam WiFi networks
   */
  async scanForDashcams(): Promise<string[]> {
    try {
      const wifiList = await WifiManager.loadWifiList()

      const dashcamNetworks = wifiList
        .filter(wifi =>
          this.DASHCAM_SSID_PATTERNS.some(pattern => pattern.test(wifi.SSID))
        )
        .map(wifi => wifi.SSID)

      console.log('Found dashcam networks:', dashcamNetworks)
      return dashcamNetworks
    } catch (error) {
      console.error('Error scanning for dashcams:', error)
      return []
    }
  }

  /**
   * Connect to dashcam WiFi network
   */
  async connectToDashcam(ssid: string, password?: string): Promise<boolean> {
    try {
      const connected = await WifiManager.connectToProtectedSSID(
        ssid,
        password || '',
        false, // isWEP
        false  // isHidden
      )

      if (connected) {
        console.log('Connected to dashcam WiFi:', ssid)

        // Detect dashcam type and set base URL
        await this.detectDashcamType(ssid)

        return true
      }

      return false
    } catch (error) {
      console.error('Error connecting to dashcam:', error)
      return false
    }
  }

  /**
   * Disconnect from dashcam WiFi
   */
  async disconnect(): Promise<void> {
    try {
      await WifiManager.disconnect()
      this.connectedDashcam = null
      this.baseUrl = ''
      this.streamUrl = ''
      console.log('Disconnected from dashcam')
    } catch (error) {
      console.error('Error disconnecting from dashcam:', error)
    }
  }

  /**
   * Detect dashcam type and configure connection
   */
  private async detectDashcamType(ssid: string): Promise<void> {
    let brand = 'Unknown'
    let defaultIP = '192.168.1.254' // Common default

    if (/BlackVue/.test(ssid)) {
      brand = 'BlackVue'
      defaultIP = '10.99.77.1'
      this.baseUrl = `http://${defaultIP}`
      this.streamUrl = `http://${defaultIP}/blackvue_live.cgi`
    } else if (/GARMIN/.test(ssid)) {
      brand = 'Garmin'
      defaultIP = '192.168.0.1'
      this.baseUrl = `http://${defaultIP}`
      this.streamUrl = `http://${defaultIP}/live`
    } else if (/Nextbase/.test(ssid)) {
      brand = 'Nextbase'
      defaultIP = '192.168.1.254'
      this.baseUrl = `http://${defaultIP}`
      this.streamUrl = `http://${defaultIP}/stream`
    } else if (/VIOFO/.test(ssid)) {
      brand = 'VIOFO'
      defaultIP = '192.168.1.254'
      this.baseUrl = `http://${defaultIP}`
      this.streamUrl = `http://${defaultIP}/live`
    }

    // Try to get dashcam info
    const info = await this.getDashcamInfo()
    if (info) {
      this.connectedDashcam = info
    } else {
      // Fallback info
      this.connectedDashcam = {
        brand,
        model: 'Unknown',
        serialNumber: 'Unknown',
        firmwareVersion: 'Unknown',
        ipAddress: defaultIP
      }
    }
  }

  /**
   * Get dashcam information
   */
  async getDashcamInfo(): Promise<DashcamInfo | null> {
    if (!this.baseUrl) return null

    try {
      const response = await fetch(`${this.baseUrl}/info`, {
        timeout: 5000
      } as any)

      if (response.ok) {
        const data = await response.json()
        return this.parseDashcamInfo(data)
      }
    } catch (error) {
      console.error('Error getting dashcam info:', error)
    }

    return this.connectedDashcam
  }

  /**
   * Parse dashcam info from response
   */
  private parseDashcamInfo(data: any): DashcamInfo {
    return {
      brand: data.brand || this.connectedDashcam?.brand || 'Unknown',
      model: data.model || 'Unknown',
      serialNumber: data.serial || data.serialNumber || 'Unknown',
      firmwareVersion: data.firmware || data.version || 'Unknown',
      ipAddress: data.ip || this.connectedDashcam?.ipAddress || '',
      macAddress: data.mac,
      storageCapacity: data.storageCapacity,
      storageUsed: data.storageUsed,
      batteryLevel: data.battery,
      isRecording: data.recording || data.isRecording
    }
  }

  /**
   * Get list of recorded videos
   */
  async getVideoList(type?: 'normal' | 'event' | 'parking'): Promise<DashcamVideo[]> {
    if (!this.baseUrl) return []

    try {
      const url = type
        ? `${this.baseUrl}/videos?type=${type}`
        : `${this.baseUrl}/videos`

      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        return this.parseVideoList(data)
      }
    } catch (error) {
      console.error('Error getting video list:', error)
    }

    return []
  }

  /**
   * Parse video list from response
   */
  private parseVideoList(data: any): DashcamVideo[] {
    const videos = data.videos || data.files || []

    return videos.map((video: any) => ({
      id: video.id || video.filename,
      filename: video.filename || video.name,
      timestamp: new Date(video.timestamp || video.date),
      duration: video.duration || 60,
      size: video.size || 0,
      type: video.type || 'normal',
      resolution: video.resolution || '1080p',
      gpsData: video.gps ? {
        latitude: video.gps.lat,
        longitude: video.gps.lng,
        speed: video.gps.speed,
        heading: video.gps.heading
      } : undefined,
      thumbnail: video.thumbnail,
      url: video.url || `${this.baseUrl}/videos/${video.filename}`
    }))
  }

  /**
   * Download video file
   */
  async downloadVideo(
    video: DashcamVideo,
    onProgress?: ProgressCallback
  ): Promise<string | null> {
    try {
      const response = await fetch(video.url)

      if (!response.ok) {
        throw new Error('Failed to download video')
      }

      const totalSize = parseInt(response.headers.get('content-length') || '0', 10)
      let downloadedSize = 0

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const chunks: Uint8Array[] = []

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        chunks.push(value)
        downloadedSize += value.length

        if (onProgress) {
          const progress = totalSize > 0 ? (downloadedSize / totalSize) * 100 : 0
          onProgress(progress, downloadedSize, totalSize)
        }
      }

      // Combine chunks into a single blob
      const blob = new Blob(chunks, { type: 'video/mp4' })

      // Save to local file system
      // Note: You'll need to implement file saving logic based on your app's file system
      // This is a placeholder that returns a local URL
      const localUrl = `file://dashcam-videos/${video.filename}`

      console.log('Video downloaded:', localUrl)
      return localUrl
    } catch (error) {
      console.error('Error downloading video:', error)
      return null
    }
  }

  /**
   * Get live stream URL
   */
  getLiveStreamUrl(config?: StreamConfig): string {
    if (!this.streamUrl) return ''

    if (!config) {
      return this.streamUrl
    }

    // Add stream quality parameters
    const params = new URLSearchParams({
      quality: config.quality,
      width: config.width.toString(),
      height: config.height.toString(),
      fps: config.fps.toString()
    })

    return `${this.streamUrl}?${params.toString()}`
  }

  /**
   * Start live streaming
   */
  async startLiveStream(config?: StreamConfig): Promise<string | null> {
    try {
      const streamUrl = this.getLiveStreamUrl(config)

      // Verify stream is available
      const response = await fetch(streamUrl, {
        method: 'HEAD',
        timeout: 3000
      } as any)

      if (response.ok) {
        this.isStreaming = true
        console.log('Live stream started:', streamUrl)
        return streamUrl
      }

      return null
    } catch (error) {
      console.error('Error starting live stream:', error)
      return null
    }
  }

  /**
   * Stop live streaming
   */
  stopLiveStream(): void {
    this.isStreaming = false
    console.log('Live stream stopped')
  }

  /**
   * Tag an event (impact, harsh braking, etc.)
   */
  async tagEvent(
    authToken: string,
    type: DashcamEvent['type'],
    notes?: string,
    gpsData?: GPSData
  ): Promise<DashcamEvent | null> {
    const timestamp = new Date()

    // Create event record
    const event: DashcamEvent = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp,
      type,
      notes,
      gpsData
    }

    try {
      // Send to API
      const response = await fetch('/api/mobile/dashcam/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          eventId: event.id,
          timestamp: timestamp.toISOString(),
          type,
          notes,
          gpsData,
          dashcamInfo: this.connectedDashcam
        })
      })

      if (response.ok) {
        const result = await response.json()
        event.id = result.eventId || event.id

        // Try to capture video segment around the event
        await this.captureEventVideo(event)

        console.log('Event tagged:', event)
        return event
      }
    } catch (error) {
      console.error('Error tagging event:', error)
    }

    return null
  }

  /**
   * Capture video segment for an event
   */
  private async captureEventVideo(event: DashcamEvent): Promise<void> {
    try {
      // Request dashcam to save the last 30 seconds + next 10 seconds
      const response = await fetch(`${this.baseUrl}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          timestamp: event.timestamp.toISOString(),
          beforeSeconds: 30,
          afterSeconds: 10,
          eventType: event.type
        })
      })

      if (response.ok) {
        const data = await response.json()
        event.videoUrl = data.videoUrl || data.filename
        console.log('Event video captured:', event.videoUrl)
      }
    } catch (error) {
      console.error('Error capturing event video:', error)
    }
  }

  /**
   * Get dashcam settings
   */
  async getSettings(): Promise<DashcamSettings | null> {
    if (!this.baseUrl) return null

    try {
      const response = await fetch(`${this.baseUrl}/settings`)

      if (response.ok) {
        const data = await response.json()
        return this.parseSettings(data)
      }
    } catch (error) {
      console.error('Error getting dashcam settings:', error)
    }

    return null
  }

  /**
   * Update dashcam settings
   */
  async updateSettings(settings: Partial<DashcamSettings>): Promise<boolean> {
    if (!this.baseUrl) return false

    try {
      const response = await fetch(`${this.baseUrl}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        console.log('Dashcam settings updated')
        return true
      }
    } catch (error) {
      console.error('Error updating dashcam settings:', error)
    }

    return false
  }

  /**
   * Parse settings from response
   */
  private parseSettings(data: any): DashcamSettings {
    return {
      resolution: data.resolution || '1080p',
      frameRate: data.frameRate || data.fps || 30,
      nightMode: data.nightMode !== undefined ? data.nightMode : true,
      parkingMode: data.parkingMode !== undefined ? data.parkingMode : true,
      gSensor: {
        enabled: data.gSensor?.enabled !== undefined ? data.gSensor.enabled : true,
        sensitivity: data.gSensor?.sensitivity || 'medium'
      },
      audioRecording: data.audioRecording !== undefined ? data.audioRecording : true,
      timestamp: data.timestamp !== undefined ? data.timestamp : true,
      speedDisplay: data.speedDisplay !== undefined ? data.speedDisplay : true,
      wifiAutoOn: data.wifiAutoOn !== undefined ? data.wifiAutoOn : false
    }
  }

  /**
   * Format storage card
   */
  async formatStorage(): Promise<boolean> {
    if (!this.baseUrl) return false

    try {
      const response = await fetch(`${this.baseUrl}/format`, {
        method: 'POST'
      })

      return response.ok
    } catch (error) {
      console.error('Error formatting storage:', error)
      return false
    }
  }

  /**
   * Get current WiFi connection info
   */
  async getCurrentWifiInfo(): Promise<{ ssid: string; bssid: string } | null> {
    try {
      const ssid = await WifiManager.getCurrentWifiSSID()
      const bssid = await WifiManager.getBSSID()

      return { ssid, bssid }
    } catch (error) {
      console.error('Error getting WiFi info:', error)
      return null
    }
  }

  /**
   * Check if connected to dashcam
   */
  isConnected(): boolean {
    return this.connectedDashcam !== null
  }

  /**
   * Get connected dashcam info
   */
  getConnectedDashcam(): DashcamInfo | null {
    return this.connectedDashcam
  }
}

// Export singleton instance
export default new DashcamIntegrationService()
