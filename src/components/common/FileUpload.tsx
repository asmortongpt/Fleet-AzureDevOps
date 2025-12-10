/**
 * FileUpload - Reusable file upload component with drag-and-drop
 *
 * A flexible file upload component that supports drag-and-drop,
 * multiple files, file type restrictions, and preview thumbnails.
 *
 * Features:
 * - Drag-and-drop support
 * - Multiple file upload
 * - File type restrictions
 * - Size validation
 * - Image preview thumbnails
 * - File list with remove option
 * - Progress indicator (optional)
 *
 * Usage:
 * ```tsx
 * <FileUpload
 *   accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
 *   multiple
 *   maxSize={5 * 1024 * 1024} // 5MB
 *   onFilesChange={(files) => setFiles(files)}
 *   showPreview
 * />
 * ```
 */

import { Upload, X, File, Image as ImageIcon } from "@phosphor-icons/react"
import { useState, useCallback } from "react"
import { useDropzone, Accept } from "react-dropzone"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// ============================================================================
// TYPES
// ============================================================================

export interface FileUploadProps {
  /** Accepted file types (MIME types and extensions) */
  accept?: Accept
  /** Allow multiple file selection */
  multiple?: boolean
  /** Maximum file size in bytes */
  maxSize?: number
  /** Maximum number of files */
  maxFiles?: number
  /** Callback when files change */
  onFilesChange: (files: File[]) => void
  /** Show image previews */
  showPreview?: boolean
  /** Custom message for drag area */
  message?: string
  /** Show upload progress (0-100) */
  uploadProgress?: number
  /** Disabled state */
  disabled?: boolean
  /** Additional className */
  className?: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FileUpload({
  accept = { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles,
  onFilesChange,
  showPreview = false,
  message,
  uploadProgress,
  disabled = false,
  className = ""
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map())

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (disabled) return

      // Limit number of files
      const newFiles = maxFiles
        ? [...files, ...acceptedFiles].slice(0, maxFiles)
        : multiple
        ? [...files, ...acceptedFiles]
        : [acceptedFiles[0]]

      setFiles(newFiles)
      onFilesChange(newFiles)

      // Generate preview URLs for images
      if (showPreview) {
        const newPreviewUrls = new Map(previewUrls)
        acceptedFiles.forEach((file) => {
          if (isImageFile(file) && !newPreviewUrls.has(file.name)) {
            const url = URL.createObjectURL(file)
            newPreviewUrls.set(file.name, url)
          }
        })
        setPreviewUrls(newPreviewUrls)
      }
    },
    [files, multiple, maxFiles, disabled, showPreview, onFilesChange, previewUrls]
  )

  // Remove file
  const removeFile = (index: number) => {
    const file = files[index]
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFilesChange(newFiles)

    // Clean up preview URL
    if (previewUrls.has(file.name)) {
      URL.revokeObjectURL(previewUrls.get(file.name)!)
      const newPreviewUrls = new Map(previewUrls)
      newPreviewUrls.delete(file.name)
      setPreviewUrls(newPreviewUrls)
    }
  }

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
    maxSize,
    maxFiles,
    disabled
  })

  // Default message based on accept types
  const getDefaultMessage = () => {
    const acceptTypes = Object.keys(accept)
    if (acceptTypes.includes("image/*")) {
      return "Drag & drop images here, or click to select"
    }
    return "Drag & drop files here, or click to select"
  }

  return (
    <div className={className}>
      {/* Dropzone */}
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <CardContent className="p-6">
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <Upload className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm font-medium">
              {isDragActive ? "Drop files here..." : message || getDefaultMessage()}
            </p>
            <p className="text-xs text-muted-foreground">
              {maxSize && `Max file size: ${formatFileSize(maxSize)}`}
              {maxFiles && ` • Max ${maxFiles} file${maxFiles > 1 ? "s" : ""}`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Uploading...</span>
            <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">
            {files.length} file{files.length > 1 ? "s" : ""} selected
          </p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <Card key={`${file.name}-${index}`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {/* Preview or Icon */}
                    {showPreview && previewUrls.has(file.name) ? (
                      <img
                        src={previewUrls.get(file.name)}
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-muted rounded">
                        {isImageFile(file) ? (
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        ) : (
                          <File className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                    )}

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(index)
                      }}
                      disabled={disabled}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
