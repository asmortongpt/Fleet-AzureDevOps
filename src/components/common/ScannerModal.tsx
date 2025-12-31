/**
 * ScannerModal - Camera-based scanner for QR codes, VIN barcodes, and license plates
 * Uses @yudiel/react-qr-scanner for QR/barcode detection
 * Uses Tesseract.js for license plate OCR
 */

import {
  Camera,
  X,
  FlipHorizontal,
  Keyboard,
  CheckCircle,
  Warning,
  CircleNotch
} from "@phosphor-icons/react"
import { Scanner, IDetectedBarcode } from '@yudiel/react-qr-scanner'
import { createWorker, Worker } from 'tesseract.js'
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
import { Progress } from "@/components/ui/progress"
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

// Parse VIN from barcode
function parseVINFromBarcode(rawValue: string): string | null {
  let cleaned = rawValue.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase()
  if (cleaned.length === 17) return cleaned
  if (cleaned.length > 17) {
    for (let i = 0; i <= cleaned.length - 17; i++) {
      const candidate = cleaned.substring(i, i + 17)
      if (validateVIN(candidate)) return candidate
    }
    return cleaned.substring(0, 17)
  }
  return null
}

// Extract license plate from OCR text
function extractPlateFromText(text: string): string | null {
  // Remove whitespace and normalize
  const cleaned = text.replace(/\s+/g, '').toUpperCase()

  // Common US plate patterns: ABC1234, ABC123, 1ABC234, 123ABC, etc.
  const patterns = [
    /\b([A-Z]{2,3}[0-9]{3,4})\b/,      // ABC1234, AB1234
    /\b([0-9]{1,3}[A-Z]{2,3}[0-9]{2,4})\b/, // 1ABC234, 123AB12
    /\b([A-Z]{1,3}[0-9]{1,2}[A-Z]{1,3})\b/, // A1B, AB1CD
    /\b([0-9]{3,4}[A-Z]{2,3})\b/,      // 1234ABC
    /\b([A-Z0-9]{5,8})\b/,             // Generic 5-8 char alphanumeric
  ]

  for (const pattern of patterns) {
    const match = cleaned.match(pattern)
    if (match && match[1].length >= 4 && match[1].length <= 8) {
      return match[1]
    }
  }

  // Fallback: extract longest alphanumeric sequence
  const alphanumeric = cleaned.replace(/[^A-Z0-9]/g, '')
  if (alphanumeric.length >= 4 && alphanumeric.length <= 8) {
    return alphanumeric
  }

  return null
}

export function ScannerModal({ open, onOpenChange, type, onScan }: ScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const workerRef = useRef<Worker | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const ocrIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [manualInput, setManualInput] = useState('')
  const [showManualInput, setShowManualInput] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrStatus, setOcrStatus] = useState<string>('')
  const [isProcessingOCR, setIsProcessingOCR] = useState(false)

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
      case 'vin': return 'Align the VIN barcode (door jamb or dashboard)'
      case 'plate': return 'Center the license plate - hold steady for OCR'
    }
  }

  // Initialize Tesseract worker for plate OCR
  const initOCRWorker = useCallback(async () => {
    if (workerRef.current) return

    try {
      setOcrStatus('Initializing OCR...')
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100))
          }
        }
      })

      // Configure for license plates: alphanumeric only
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        tessedit_pageseg_mode: '7', // Single text line
      })

      workerRef.current = worker
      setOcrStatus('OCR ready')
      logger.info('Tesseract OCR worker initialized')
    } catch (err) {
      logger.error('Failed to initialize OCR:', err)
      setError('Failed to initialize OCR engine')
    }
  }, [])

  // Start camera for plate OCR
  const startPlateCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err) {
      logger.error('Camera error:', err)
      setError('Camera access denied')
    }
  }, [facingMode])

  // Capture frame and run OCR
  const captureAndOCR = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !workerRef.current || isProcessingOCR || paused) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx || video.videoWidth === 0) return

    setIsProcessingOCR(true)

    // Capture center region (where plate should be)
    const cropWidth = video.videoWidth * 0.7
    const cropHeight = video.videoHeight * 0.3
    const cropX = (video.videoWidth - cropWidth) / 2
    const cropY = (video.videoHeight - cropHeight) / 2

    canvas.width = cropWidth
    canvas.height = cropHeight

    // Draw cropped region with contrast enhancement
    ctx.filter = 'contrast(1.5) grayscale(1)'
    ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
    ctx.filter = 'none'

    try {
      const { data } = await workerRef.current.recognize(canvas)
      const plateText = extractPlateFromText(data.text)

      if (plateText && data.confidence > 50) {
        logger.info(`OCR detected plate: ${plateText} (confidence: ${data.confidence})`)
        setPaused(true)
        setScanResult({
          value: plateText,
          confidence: Math.round(data.confidence),
          type: 'plate'
        })
      }
    } catch (err) {
      logger.error('OCR error:', err)
    } finally {
      setIsProcessingOCR(false)
    }
  }, [isProcessingOCR, paused])

  // Start OCR interval for plate mode
  useEffect(() => {
    if (type === 'plate' && open && !scanResult && !showManualInput) {
      initOCRWorker()
      startPlateCamera()

      // Run OCR every 1.5 seconds
      ocrIntervalRef.current = setInterval(captureAndOCR, 1500)

      return () => {
        if (ocrIntervalRef.current) {
          clearInterval(ocrIntervalRef.current)
        }
      }
    }
  }, [type, open, scanResult, showManualInput, initOCRWorker, startPlateCamera, captureAndOCR])

  // Cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      if (ocrIntervalRef.current) {
        clearInterval(ocrIntervalRef.current)
      }
    }
  }, [])

  // Terminate worker on close
  useEffect(() => {
    if (!open && workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
  }, [open])

  const toggleCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
  }

  const handleBarcodeScan = useCallback((detectedCodes: IDetectedBarcode[]) => {
    if (detectedCodes.length === 0 || paused) return

    const code = detectedCodes[0]
    const rawValue = code.rawValue

    logger.info(`Barcode detected: ${rawValue} (format: ${code.format})`)

    let processedValue = rawValue.trim().toUpperCase()
    let isValid = true

    if (type === 'vin') {
      const parsedVIN = parseVINFromBarcode(rawValue)
      if (parsedVIN) {
        processedValue = parsedVIN
        isValid = validateVIN(processedValue)
      } else {
        return
      }
    } else if (type === 'qr') {
      isValid = processedValue.length > 0
    }

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
    setOcrProgress(0)
    setIsProcessingOCR(false)

    if (type === 'plate') {
      startPlateCamera()
    }
  }

  useEffect(() => {
    if (open) {
      resetScanner()
    }
  }, [open, type])

  const getFormats = (): string[] => {
    switch (type) {
      case 'qr': return ['qr_code']
      case 'vin': return ['code_39', 'code_128', 'code_93', 'ean_13', 'ean_8']
      default: return ['qr_code', 'code_39', 'code_128']
    }
  }

  // Render plate scanner with OCR
  const renderPlateScanner = () => (
    <div className="relative">
      <video
        ref={videoRef}
        className="w-full aspect-[4/3] object-cover bg-black"
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Plate frame overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[70%] h-[25%] border-2 border-yellow-400 rounded-lg relative">
          <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-yellow-400" />
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-yellow-400" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-yellow-400" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-yellow-400" />
        </div>
      </div>

      {/* OCR status */}
      <div className="absolute top-3 left-3 right-3">
        <div className="flex items-center gap-2 bg-black/70 px-3 py-2 rounded-lg">
          {isProcessingOCR ? (
            <>
              <CircleNotch className="w-4 h-4 text-yellow-400 animate-spin" />
              <span className="text-white text-xs">Reading plate...</span>
              <div className="flex-1">
                <Progress value={ocrProgress} className="h-1" />
              </div>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-white text-xs">{ocrStatus || 'Position plate in frame'}</span>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
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
        <Button
          size="sm"
          variant="secondary"
          className="bg-black/60 hover:bg-black/80 text-white"
          onClick={captureAndOCR}
          disabled={isProcessingOCR}
        >
          <Camera className="w-4 h-4 mr-1" />
          Capture
        </Button>
      </div>
    </div>
  )

  // Render barcode scanner (QR/VIN)
  const renderBarcodeScanner = () => (
    <div className="relative">
      <Scanner
        onScan={handleBarcodeScan}
        onError={handleError}
        formats={getFormats()}
        paused={paused || showManualInput}
        components={{ audio: false, torch: true, finder: true }}
        constraints={{ facingMode }}
        styles={{
          container: { width: '100%', aspectRatio: '4/3' },
          video: { width: '100%', height: '100%', objectFit: 'cover' },
        }}
      />

      <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-white text-xs font-medium">
          {type === 'qr' ? 'QR Mode' : 'VIN Mode'}
        </span>
      </div>

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
  )

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
          {!scanResult ? (
            <>
              {!error ? (
                type === 'plate' ? renderPlateScanner() : renderBarcodeScanner()
              ) : (
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
            <div className="p-6 bg-background">
              <div className="text-center space-y-4">
                {scanResult.confidence > 70 ? (
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" weight="fill" />
                ) : (
                  <Warning className="w-16 h-16 text-yellow-500 mx-auto" weight="fill" />
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {type === 'qr' && 'QR Code Detected'}
                    {type === 'vin' && 'VIN Detected'}
                    {type === 'plate' && `License Plate Detected (${scanResult.confidence}% confidence)`}
                  </p>
                  <p className="text-2xl font-mono font-bold tracking-wide">{scanResult.value}</p>
                  {type === 'vin' && !validateVIN(scanResult.value) && (
                    <p className="text-xs text-yellow-600 mt-2">VIN checksum validation failed</p>
                  )}
                  {type === 'vin' && validateVIN(scanResult.value) && (
                    <p className="text-xs text-green-600 mt-2">VIN checksum valid</p>
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
