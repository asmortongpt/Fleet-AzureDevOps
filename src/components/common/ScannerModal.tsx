/**
 * ScannerModal - Camera-based scanner for QR codes, VIN barcodes, and license plates
 * Uses navigator.mediaDevices.getUserMedia for camera access
 */

import {
  Camera,
  X,
  FlipHorizontal,
  Flashlight,
  Keyboard,
  CheckCircle,
  Warning
} from "@phosphor-icons/react"
import { useState, useRef, useEffect, useCallback } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import logger from '@/utils/logger'

export type ScannerType = 'qr' | 'vin' | 'plate'

interface ScannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: ScannerType
  onScan: (result: string) => void
}

interface ScanResult {
  value: string
  confidence: number
  type: ScannerType
}

// VIN checksum validation
function validateVIN(vin: string): boolean {
  if (vin.length !== 17) return false

  // VIN cannot contain I, O, Q
  if (/[IOQ]/i.test(vin)) return false

  const transliteration: Record<string, number> = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
    'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
  }

  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

  let sum = 0
  for (let i = 0; i < 17; i++) {
    const char = vin[i].toUpperCase()
    const value = transliteration[char]
    if (value === undefined) return false
    sum += value * weights[i]
  }

  const remainder = sum % 11
  const checkDigit = remainder === 10 ? 'X' : remainder.toString()

  return vin[8].toUpperCase() === checkDigit
}

// Simple QR code detection simulation (in production, use a library like @yudiel/react-qr-scanner)
function detectQRFromCanvas(canvas: HTMLCanvasElement): string | null {
  // This is a placeholder - in production, integrate with a QR scanning library
  // For demo purposes, we'll simulate occasional detection
  return null
}

export function ScannerModal({ open, onOpenChange, type, onScan }: ScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [manualInput, setManualInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [torchEnabled, setTorchEnabled] = useState(false)

  const getScannerTitle = () => {
    switch (type) {
      case 'qr': return 'Scan QR Code'
      case 'vin': return 'Scan VIN Barcode'
      case 'plate': return 'Scan License Plate'
    }
  }

  const getScannerDescription = () => {
    switch (type) {
      case 'qr': return 'Position the QR code within the frame'
      case 'vin': return 'Align the VIN barcode within the frame'
      case 'plate': return 'Center the license plate in the frame'
    }
  }

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      setIsScanning(true)

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      logger.info(`Scanner started: ${type} mode`)
    } catch (err) {
      logger.error('Camera access error:', err)
      setError('Unable to access camera. Please grant camera permissions.')
      setIsScanning(false)
    }
  }, [facingMode, type])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }, [])

  const toggleCamera = async () => {
    stopCamera()
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0]
      const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }

      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled } as MediaTrackConstraintSet]
        })
        setTorchEnabled(!torchEnabled)
      }
    }
  }

  // Simulated scan detection (in production, use proper libraries)
  useEffect(() => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scanInterval = setInterval(() => {
      if (!videoRef.current) return

      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      ctx.drawImage(videoRef.current, 0, 0)

      // In production, process the canvas with appropriate library
      // For demo, we simulate detection after a few seconds
      const detected = detectQRFromCanvas(canvas)
      if (detected) {
        handleScanResult(detected)
      }
    }, 500)

    return () => clearInterval(scanInterval)
  }, [isScanning])

  const handleScanResult = (value: string) => {
    let isValid = true
    let processedValue = value.trim().toUpperCase()

    if (type === 'vin') {
      processedValue = processedValue.replace(/[^A-HJ-NPR-Z0-9]/g, '')
      isValid = validateVIN(processedValue)
    } else if (type === 'plate') {
      processedValue = processedValue.replace(/[^A-Z0-9]/g, '')
      isValid = processedValue.length >= 2 && processedValue.length <= 8
    }

    setScanResult({
      value: processedValue,
      confidence: isValid ? 95 : 60,
      type
    })

    if (isValid) {
      stopCamera()
    }
  }

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return
    handleScanResult(manualInput)
  }

  const confirmResult = () => {
    if (scanResult) {
      onScan(scanResult.value)
      onOpenChange(false)
    }
  }

  useEffect(() => {
    if (open) {
      startCamera()
      setScanResult(null)
      setManualInput('')
      setShowManualInput(false)
    } else {
      stopCamera()
    }

    return () => stopCamera()
  }, [open, startCamera, stopCamera])

  // Restart camera when facing mode changes
  useEffect(() => {
    if (open && !scanResult) {
      startCamera()
    }
  }, [facingMode, open, scanResult, startCamera])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {getScannerTitle()}
          </DialogTitle>
          <DialogDescription>
            {getScannerDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="relative bg-black">
          {/* Camera Preview */}
          {!scanResult && (
            <>
              <video
                ref={videoRef}
                className="w-full aspect-[4/3] object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scan Frame Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`
                  border-2 rounded-lg
                  ${type === 'qr' ? 'w-48 h-48 border-blue-400' : ''}
                  ${type === 'vin' ? 'w-72 h-16 border-green-400' : ''}
                  ${type === 'plate' ? 'w-64 h-24 border-yellow-400' : ''}
                `}>
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-current" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-current" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-current" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-current" />
                </div>
              </div>

              {/* Scanning indicator */}
              {isScanning && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-white text-xs font-medium">Scanning...</span>
                </div>
              )}

              {/* Camera controls */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-black/60 hover:bg-black/80"
                  onClick={toggleCamera}
                >
                  <FlipHorizontal className="w-4 h-4 mr-1" />
                  Flip
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-black/60 hover:bg-black/80"
                  onClick={toggleTorch}
                >
                  <Flashlight className={`w-4 h-4 mr-1 ${torchEnabled ? 'text-yellow-400' : ''}`} />
                  Light
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-black/60 hover:bg-black/80"
                  onClick={() => setShowManualInput(true)}
                >
                  <Keyboard className="w-4 h-4 mr-1" />
                  Manual
                </Button>
              </div>
            </>
          )}

          {/* Scan Result */}
          {scanResult && (
            <div className="p-6 bg-background">
              <div className="text-center space-y-4">
                {scanResult.confidence > 80 ? (
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                ) : (
                  <Warning className="w-16 h-16 text-yellow-500 mx-auto" />
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {type === 'qr' && 'QR Code Detected'}
                    {type === 'vin' && 'VIN Detected'}
                    {type === 'plate' && 'License Plate Detected'}
                  </p>
                  <p className="text-2xl font-mono font-bold">{scanResult.value}</p>
                  {type === 'vin' && !validateVIN(scanResult.value) && (
                    <p className="text-xs text-yellow-600 mt-1">VIN checksum may be invalid</p>
                  )}
                </div>

                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setScanResult(null)
                      startCamera()
                    }}
                  >
                    Scan Again
                  </Button>
                  <Button onClick={confirmResult}>
                    Use This {type === 'vin' ? 'VIN' : type === 'plate' ? 'Plate' : 'Code'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !scanResult && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/95">
              <div className="text-center p-6 space-y-4">
                <Camera className="w-16 h-16 text-muted-foreground mx-auto" />
                <p className="text-destructive">{error}</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={startCamera}>
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Manual Input Section */}
        {showManualInput && !scanResult && (
          <div className="p-4 border-t bg-muted/50">
            <div className="space-y-3">
              <Label htmlFor="manual-input">
                {type === 'qr' && 'Enter code manually'}
                {type === 'vin' && 'Enter VIN (17 characters)'}
                {type === 'plate' && 'Enter license plate number'}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="manual-input"
                  value={manualInput}
                  onChange={e => setManualInput(e.target.value.toUpperCase())}
                  placeholder={
                    type === 'vin' ? '1HGBH41JXMN109186' :
                    type === 'plate' ? 'ABC1234' : 'Enter code...'
                  }
                  className="font-mono"
                  maxLength={type === 'vin' ? 17 : type === 'plate' ? 8 : undefined}
                  onKeyPress={e => e.key === 'Enter' && handleManualSubmit()}
                />
                <Button onClick={handleManualSubmit} disabled={!manualInput.trim()}>
                  Submit
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowManualInput(false)}
              >
                Back to Camera
              </Button>
            </div>
          </div>
        )}

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-white hover:bg-white/20"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-5 h-5" />
        </Button>
      </DialogContent>
    </Dialog>
  )
}
