/**
 * ScannerModal - Camera-based scanner for QR codes, VIN barcodes, and license plates
 * Uses @yudiel/react-qr-scanner for QR/barcode detection
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
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner'
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

// VIN checksum validation (ISO 3779)
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

// Parse VIN from barcode (Code 39 format commonly used)
function parseVINFromBarcode(rawValue: string): string | null {
  // Clean up the value - remove any start/stop characters
  let cleaned = rawValue.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase()

  // VIN is exactly 17 characters
  if (cleaned.length === 17) {
    return cleaned
  }

  // Sometimes VIN barcodes include extra characters
  if (cleaned.length > 17) {
    // Try to find a 17-character VIN substring
    for (let i = 0; i <= cleaned.length - 17; i++) {
      const candidate = cleaned.substring(i, i + 17)
      if (validateVIN(candidate)) {
        return candidate
      }
    }
    // Fall back to first 17 characters
    return cleaned.substring(0, 17)
  }

  return null
}

export function ScannerModal({ open, onOpenChange, type, onScan }: ScannerModalProps) {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [manualInput, setManualInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)

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
      case 'vin': return 'Align the VIN barcode (door jamb or dashboard) within the frame'
      case 'plate': return 'Center the license plate in the frame'
    }
  }

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const handleScan = useCallback((detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes.length === 0 || paused) return

    const code = detectedCodes[0]
    const rawValue = code.rawValue

    logger.info(`Barcode detected: ${rawValue} (format: ${code.format})`)

    let processedValue = rawValue.trim().toUpperCase()
    let isValid = true

    if (type === 'vin') {
      // Try to parse VIN from the barcode
      const parsedVIN = parseVINFromBarcode(rawValue)
      if (parsedVIN) {
        processedValue = parsedVIN
        isValid = validateVIN(processedValue)
      } else {
        // Not a valid VIN barcode
        return
      }
    } else if (type === 'plate') {
      // License plates: alphanumeric, 2-8 characters
      processedValue = processedValue.replace(/[^A-Z0-9]/g, '')
      isValid = processedValue.length >= 2 && processedValue.length <= 8
      if (!isValid) return
    } else if (type === 'qr') {
      // QR codes can contain any data
      isValid = processedValue.length > 0
    }

    // Pause scanning and show result
    setPaused(true)
    setScanResult({
      value: processedValue,
      confidence: isValid ? 95 : 70,
      type
    })
  }, [type, paused])

  const handleError = useCallback((err: unknown) => {
    logger.error('Scanner error:', err)
    if (err instanceof Error) {
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please grant camera permissions.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.')
      } else {
        setError(`Camera error: ${err.message}`)
      }
    }
  }, [])

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return

    let processedValue = manualInput.trim().toUpperCase()
    let isValid = true

    if (type === 'vin') {
      processedValue = processedValue.replace(/[^A-HJ-NPR-Z0-9]/gi, '')
      isValid = processedValue.length === 17 && validateVIN(processedValue)
    } else if (type === 'plate') {
      processedValue = processedValue.replace(/[^A-Z0-9]/g, '')
      isValid = processedValue.length >= 2 && processedValue.length <= 8
    }

    setScanResult({
      value: processedValue,
      confidence: isValid ? 100 : 60,
      type
    })
    setPaused(true)
  }

  const confirmResult = () => {
    if (scanResult) {
      onScan(scanResult.value)
      onOpenChange(false)
    }
  }

  const resetScanner = () => {
    setScanResult(null)
    setPaused(false)
    setManualInput('')
    setShowManualInput(false)
    setError(null)
  }

  // Reset state when modal opens/closes or type changes
  useEffect(() => {
    if (open) {
      resetScanner()
    }
  }, [open, type])

  // Determine which barcode formats to scan based on type
  const getFormats = (): string[] => {
    switch (type) {
      case 'qr':
        return ['qr_code']
      case 'vin':
        // VIN barcodes are typically Code 39 or Code 128
        return ['code_39', 'code_128', 'code_93', 'ean_13', 'ean_8']
      case 'plate':
        // For plates, scan any format that might encode text
        return ['qr_code', 'code_39', 'code_128', 'data_matrix']
      default:
        return ['qr_code', 'code_39', 'code_128']
    }
  }

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
          {/* Scanner or Result View */}
          {!scanResult ? (
            <>
              {!error ? (
                <div className="relative">
                  <Scanner
                    onScan={handleScan}
                    onError={handleError}
                    formats={getFormats()}
                    paused={paused || showManualInput}
                    components={{
                      audio: false,
                      torch: true,
                      finder: true,
                    }}
                    constraints={{
                      facingMode: facingMode,
                    }}
                    styles={{
                      container: {
                        width: '100%',
                        aspectRatio: '4/3',
                      },
                      video: {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      },
                    }}
                  />

                  {/* Scan type indicator */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white text-xs font-medium">
                      {type === 'qr' ? 'QR Mode' : type === 'vin' ? 'VIN Mode' : 'Plate Mode'}
                    </span>
                  </div>

                  {/* Camera controls */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-black/60 hover:bg-black/80 text-white"
                      onClick={toggleCamera}
                    >
                      <FlipHorizontal className="w-4 h-4 mr-1" />
                      Flip
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-black/60 hover:bg-black/80 text-white"
                      onClick={() => setShowManualInput(true)}
                    >
                      <Keyboard className="w-4 h-4 mr-1" />
                      Manual
                    </Button>
                  </div>
                </div>
              ) : (
                /* Error state */
                <div className="aspect-[4/3] flex items-center justify-center bg-background">
                  <div className="text-center p-6 space-y-4">
                    <Camera className="w-16 h-16 text-muted-foreground mx-auto" />
                    <p className="text-destructive">{error}</p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setShowManualInput(true)}>
                        Enter Manually
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Scan Result */
            <div className="p-6 bg-background">
              <div className="text-center space-y-4">
                {scanResult.confidence > 80 ? (
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" weight="fill" />
                ) : (
                  <Warning className="w-16 h-16 text-yellow-500 mx-auto" weight="fill" />
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {type === 'qr' && 'QR Code Detected'}
                    {type === 'vin' && 'VIN Detected'}
                    {type === 'plate' && 'License Plate Detected'}
                  </p>
                  <p className="text-2xl font-mono font-bold tracking-wide">{scanResult.value}</p>
                  {type === 'vin' && !validateVIN(scanResult.value) && (
                    <p className="text-xs text-yellow-600 mt-2">
                      VIN checksum validation failed - please verify
                    </p>
                  )}
                  {type === 'vin' && validateVIN(scanResult.value) && (
                    <p className="text-xs text-green-600 mt-2">
                      VIN checksum valid
                    </p>
                  )}
                </div>

                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={resetScanner}>
                    Scan Again
                  </Button>
                  <Button onClick={confirmResult}>
                    Use This {type === 'vin' ? 'VIN' : type === 'plate' ? 'Plate' : 'Code'}
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
              {type === 'vin' && (
                <p className="text-xs text-muted-foreground">
                  17 alphanumeric characters (excluding I, O, Q)
                </p>
              )}
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
          className="absolute top-2 right-2 text-muted-foreground hover:bg-accent"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-5 h-5" />
        </Button>
      </DialogContent>
    </Dialog>
  )
}
