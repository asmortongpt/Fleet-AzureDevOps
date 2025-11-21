/**
 * DocumentScanner Component
 *
 * Intelligent document upload and OCR processing with:
 * - Drag and drop upload
 * - Camera capture (mobile)
 * - Real-time OCR preview
 * - Confidence indicators
 * - Field mapping visualization
 * - Batch processing
 */

import React, { useState, useRef } from 'react'
import {
  Upload,
  Camera,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Eye,
  Download
} from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Alert, AlertDescription } from '../ui/alert'
import { apiClient } from '../../lib/api'

interface DocumentAnalysis {
  documentType: string
  confidence: number
  extractedData: Record<string, {
    value: any
    confidence: number
    needsReview: boolean
  }>
  suggestedMatches: {
    vehicle?: { id: string; name: string; confidence: number }
    vendor?: { id: string; name: string; confidence: number }
    driver?: { id: string; name: string; confidence: number }
  }
  validationIssues: string[]
  rawOcrText?: string
}

interface DocumentScannerProps {
  documentType?: string
  onComplete?: (analysis: DocumentAnalysis) => void
  allowBatch?: boolean
}

export function DocumentScanner({
  documentType,
  onComplete,
  allowBatch = false
}: DocumentScannerProps) {
  const [files, setFiles] = useState<File[]>([])
  const [analyses, setAnalyses] = useState<Map<string, DocumentAnalysis>>(new Map())
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles = Array.from(selectedFiles)
    setFiles(prev => allowBatch ? [...prev, ...newFiles] : [newFiles[0]])

    // Auto-process files
    if (allowBatch) {
      processFiles(newFiles)
    } else {
      processFiles([newFiles[0]])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const processFiles = async (filesToProcess: File[]) => {
    setIsProcessing(true)

    try {
      for (const file of filesToProcess) {
        const formData = new FormData()
        formData.append('file', file)
        if (documentType) {
          formData.append('documentType', documentType)
        }

        const response = await apiClient.post('/api/ai/analyze-document', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        setAnalyses(prev => new Map(prev).set(file.name, response.data))

        if (onComplete && !allowBatch) {
          onComplete(response.data)
        }
      }

      if (onComplete && allowBatch && filesToProcess.length > 0) {
        // Return all analyses
        const allAnalyses = Array.from(analyses.values())
        onComplete(allAnalyses[allAnalyses.length - 1]) // or combine them
      }
    } catch (error: any) {
      console.error('Document processing error:', error)
      alert(`Error processing document: ${error.response?.data?.error || error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName))
    setAnalyses(prev => {
      const newMap = new Map(prev)
      newMap.delete(fileName)
      return newMap
    })
  }

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      fuel_receipt: 'bg-blue-500',
      parts_invoice: 'bg-green-500',
      service_invoice: 'bg-orange-500',
      inspection_report: 'bg-purple-500',
      driver_license: 'bg-indigo-500',
      vehicle_registration: 'bg-pink-500',
      unknown: 'bg-gray-500'
    }
    return colors[type] || 'bg-gray-500'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600'
    if (confidence >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              multiple={allowBatch}
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />

            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />

            <h3 className="text-lg font-semibold mb-2">
              Upload {documentType ? documentType.replace('_', ' ') : 'Document'}
            </h3>

            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop {allowBatch ? 'files' : 'a file'} here, or click to browse
            </p>

            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <File className="w-4 h-4 mr-2" />
                Browse Files
              </Button>

              {/* Camera capture for mobile */}
              {navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.capture = 'environment'
                    input.onchange = (e: any) => handleFileSelect(e.target.files)
                    input.click()
                  }}
                  disabled={isProcessing}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Supported formats: JPG, PNG, PDF (max 10MB)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <div className="flex-1">
                <p className="font-medium">Processing documents...</p>
                <Progress value={66} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File List with Analyses */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">
            Documents ({files.length})
          </h3>

          {files.map((file) => {
            const analysis = analyses.get(file.name)

            return (
              <Card key={file.name} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <File className="w-4 h-4" />
                        {file.name}
                        {analysis && (
                          <Badge className={getDocumentTypeColor(analysis.documentType)}>
                            {analysis.documentType.replace('_', ' ')}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {analysis && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFile(selectedFile === file.name ? null : file.name)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.name)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Analysis Results */}
                {analysis && selectedFile === file.name && (
                  <CardContent className="border-t pt-4">
                    {/* Confidence Score */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Extraction Confidence</span>
                        <span className={`text-sm font-bold ${getConfidenceColor(analysis.confidence)}`}>
                          {Math.round(analysis.confidence * 100)}%
                        </span>
                      </div>
                      <Progress value={analysis.confidence * 100} />
                    </div>

                    {/* Validation Issues */}
                    {analysis.validationIssues.length > 0 && (
                      <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription>
                          <p className="font-semibold text-yellow-900 mb-1">Issues Found:</p>
                          {analysis.validationIssues.map((issue, index) => (
                            <p key={index} className="text-sm text-yellow-800">• {issue}</p>
                          ))}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Suggested Matches */}
                    {Object.keys(analysis.suggestedMatches).length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold mb-2">Matched Entities:</p>
                        <div className="space-y-1">
                          {analysis.suggestedMatches.vehicle && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Vehicle</Badge>
                              <span className="text-sm">{analysis.suggestedMatches.vehicle.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(analysis.suggestedMatches.vehicle.confidence * 100)}% match
                              </Badge>
                            </div>
                          )}
                          {analysis.suggestedMatches.vendor && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Vendor</Badge>
                              <span className="text-sm">{analysis.suggestedMatches.vendor.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(analysis.suggestedMatches.vendor.confidence * 100)}% match
                              </Badge>
                            </div>
                          )}
                          {analysis.suggestedMatches.driver && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Driver</Badge>
                              <span className="text-sm">{analysis.suggestedMatches.driver?.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {Math.round(analysis.suggestedMatches.driver?.confidence * 100)}% match
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Extracted Data */}
                    <div>
                      <p className="text-sm font-semibold mb-2">Extracted Data:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(analysis.extractedData).map(([field, data]) => (
                          <div key={field} className="text-sm">
                            <div className="flex items-start justify-between">
                              <span className="text-muted-foreground capitalize">
                                {field.replace(/_/g, ' ')}:
                              </span>
                              {data.needsReview && (
                                <AlertCircle className="w-3 h-3 text-yellow-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{String(data.value)}</span>
                              <span className={`text-xs ${getConfidenceColor(data.confidence)}`}>
                                ({Math.round(data.confidence * 100)}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
