/**
 * Mobile Emulator Test Screen
 * Allows testing the Fleet Management app with iOS/Android emulators
 * Features: Device selection, API testing, data injection, screen navigation
 */

import React, { useState } from 'react'
import { DeviceMobile, Globe, Database, Play, Bug, CheckCircle, XCircle } from '@phosphor-icons/react'

interface Device {
  id: string
  name: string
  width: number
  height: number
  userAgent: string
  platform: 'ios' | 'android'
}

interface APIEndpoint {
  name: string
  url: string
  method: string
  status?: 'pending' | 'success' | 'error'
  response?: any
}

const DEVICES: Device[] = [
  {
    id: 'iphone-14-pro',
    name: 'iPhone 14 Pro',
    width: 393,
    height: 852,
    platform: 'ios',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  },
  {
    id: 'iphone-se',
    name: 'iPhone SE',
    width: 375,
    height: 667,
    platform: 'ios',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  },
  {
    id: 'ipad-pro',
    name: 'iPad Pro 12.9"',
    width: 1024,
    height: 1366,
    platform: 'ios',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  },
  {
    id: 'pixel-7',
    name: 'Google Pixel 7',
    width: 412,
    height: 915,
    platform: 'android',
    userAgent: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/110.0.0.0 Mobile'
  },
  {
    id: 'galaxy-s23',
    name: 'Samsung Galaxy S23',
    width: 360,
    height: 780,
    platform: 'android',
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S911U) AppleWebKit/537.36 Chrome/110.0.0.0 Mobile'
  }
]

const API_ENDPOINTS: APIEndpoint[] = [
  { name: 'Vehicles', url: '/api/vehicles', method: 'GET' },
  { name: 'Drivers', url: '/api/drivers', method: 'GET' },
  { name: 'Work Orders', url: '/api/work-orders', method: 'GET' },
  { name: 'Fuel Transactions', url: '/api/fuel-transactions', method: 'GET' },
  { name: 'Facilities', url: '/api/facilities', method: 'GET' },
  { name: 'Routes', url: '/api/routes', method: 'GET' }
]

export function MobileEmulatorTestScreen() {
  const [selectedDevice, setSelectedDevice] = useState<Device>(DEVICES[0])
  const [iframeUrl, setIframeUrl] = useState('http://localhost:5000')
  const [apiResults, setApiResults] = useState<APIEndpoint[]>(API_ENDPOINTS)
  const [isTestingAPI, setIsTestingAPI] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  // Test all API endpoints
  const testAllAPIs = async () => {
    setIsTestingAPI(true)
    const results: APIEndpoint[] = []

    for (const endpoint of API_ENDPOINTS) {
      try {
        const response = await fetch(endpoint.url)
        const data = await response.json()
        results.push({
          ...endpoint,
          status: response.ok ? 'success' : 'error',
          response: data
        })
      } catch (error) {
        results.push({
          ...endpoint,
          status: 'error',
          response: { error: error.message }
        })
      }
    }

    setApiResults(results)
    setIsTestingAPI(false)
  }

  // Get device dimensions based on orientation
  const getDeviceDimensions = () => {
    if (orientation === 'portrait') {
      return { width: selectedDevice.width, height: selectedDevice.height }
    }
    return { width: selectedDevice.height, height: selectedDevice.width }
  }

  const dimensions = getDeviceDimensions()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mobile Emulator Test Screen</h1>
          <p className="text-gray-600">Test the Fleet Management app with various mobile devices and emulators</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <div className="space-y-4">
            {/* Device Selection */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DeviceMobile size={20} />
                Select Device
              </h2>
              <div className="space-y-2">
                {DEVICES.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDevice(device)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedDevice.id === device.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{device.name}</div>
                    <div className="text-sm text-gray-500">
                      {device.width} × {device.height} • {device.platform.toUpperCase()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation Toggle */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold mb-3">Orientation</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setOrientation('portrait')}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    orientation === 'portrait'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Portrait
                </button>
                <button
                  onClick={() => setOrientation('landscape')}
                  className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                    orientation === 'landscape'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>

            {/* API Testing */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Database size={20} />
                API Endpoints
              </h2>
              <button
                onClick={testAllAPIs}
                disabled={isTestingAPI}
                className="w-full mb-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Play size={16} />
                {isTestingAPI ? 'Testing...' : 'Test All APIs'}
              </button>
              <div className="space-y-2">
                {apiResults.map((endpoint, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded border border-gray-200"
                  >
                    <div>
                      <div className="font-medium text-sm">{endpoint.name}</div>
                      <div className="text-xs text-gray-500">{endpoint.url}</div>
                    </div>
                    {endpoint.status === 'success' && (
                      <CheckCircle size={20} className="text-green-600" />
                    )}
                    {endpoint.status === 'error' && (
                      <XCircle size={20} className="text-red-600" />
                    )}
                    {endpoint.status === 'pending' && (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* URL Control */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Globe size={20} />
                URL
              </h3>
              <input
                type="text"
                value={iframeUrl}
                onChange={(e) => setIframeUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="http://localhost:5000"
              />
              <button
                onClick={() => {
                  const iframe = document.getElementById('mobile-emulator-frame') as HTMLIFrameElement
                  if (iframe) iframe.src = iframeUrl
                }}
                className="w-full mt-2 py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Reload
              </button>
            </div>
          </div>

          {/* Center/Right - Device Preview */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{selectedDevice.name}</h2>
                  <p className="text-sm text-gray-500">
                    {dimensions.width} × {dimensions.height} • {orientation}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Bug size={16} />
                  <span>DEV Mode</span>
                </div>
              </div>

              {/* Device Frame */}
              <div className="flex justify-center">
                <div
                  className="bg-gray-900 rounded-3xl p-4 shadow-2xl"
                  style={{
                    width: dimensions.width + 32,
                    height: dimensions.height + 32
                  }}
                >
                  {/* Screen */}
                  <div
                    className="bg-white rounded-2xl overflow-hidden"
                    style={{
                      width: dimensions.width,
                      height: dimensions.height
                    }}
                  >
                    <iframe
                      id="mobile-emulator-frame"
                      src={iframeUrl}
                      className="w-full h-full border-0"
                      title="Mobile Emulator"
                    />
                  </div>
                </div>
              </div>

              {/* Device Info */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2 text-sm">Device Information</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Platform:</span>
                    <span className="ml-2 font-medium">{selectedDevice.platform.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Viewport:</span>
                    <span className="ml-2 font-medium">{dimensions.width}×{dimensions.height}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">User Agent:</span>
                    <div className="mt-1 text-xs text-gray-500 break-all">
                      {selectedDevice.userAgent}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileEmulatorTestScreen
