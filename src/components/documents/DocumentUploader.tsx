/**
 * DocumentUploader - Drag-drop multi-file uploader with progress tracking
 * Features: Drag-drop, multi-file, progress bars, file validation, thumbnails
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  X,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  FileText,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { UploadProgress } from '@/lib/documents/types';
import { formatFileSize, validateFile } from '@/lib/documents/utils';
interface DocumentUploaderProps {
  onUpload?: (files: File[]) => void;
  onClose: () => void;
  maxSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
}

export function DocumentUploader({
  onUpload,
  onClose,
  maxSize = 100 * 1024 * 1024, // 100MB
  allowedTypes,
  multiple = true
}: DocumentUploaderProps) {
  const [uploadQueue, setUploadQueue] = useState<Map<string, UploadProgress>>(new Map());
  const [rejectedFiles, setRejectedFiles] = useState<Array<{ file: File; error: string }>>([]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    // Handle rejected files
    const rejected = fileRejections.map((rejection: any) => ({
      file: rejection.file,
      error: rejection.errors[0]?.message || 'Invalid file'
    }));
    setRejectedFiles(rejected);

    // Validate and queue accepted files
    const newQueue = new Map(uploadQueue);

    acceptedFiles.forEach((file) => {
      const validation = validateFile(file, { maxSize, allowedTypes });

      if (!validation.valid) {
        setRejectedFiles(prev => [...prev, { file, error: validation.error! }]);
        return;
      }

      const fileId = `${Date.now()}-${file.name}`;
      newQueue.set(fileId, {
        fileId,
        fileName: file.name,
        progress: 0,
        status: 'pending',
        uploadedBytes: 0,
        totalBytes: file.size
      });
    });

    setUploadQueue(newQueue);

    // Simulate upload (replace with actual upload logic)
    acceptedFiles.forEach((file, index) => {
      const fileId = Array.from(newQueue.keys())[uploadQueue.size + index];
      simulateUpload(fileId, file);
    });
  }, [uploadQueue, maxSize, allowedTypes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    maxSize,
  });

  const simulateUpload = (fileId: string, file: File) => {
    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 20;

      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);

        setUploadQueue(prev => {
          const newQueue = new Map(prev);
          const item = newQueue.get(fileId);
          if (item) {
            newQueue.set(fileId, {
              ...item,
              progress: 100,
              status: 'complete',
              uploadedBytes: item.totalBytes
            });
          }
          return newQueue;
        });
      } else {
        setUploadQueue(prev => {
          const newQueue = new Map(prev);
          const item = newQueue.get(fileId);
          if (item) {
            newQueue.set(fileId, {
              ...item,
              progress,
              status: 'uploading',
              uploadedBytes: Math.floor((progress / 100) * item.totalBytes)
            });
          }
          return newQueue;
        });
      }
    }, 300);
  };

  const removeFile = (fileId: string) => {
    setUploadQueue(prev => {
      const newQueue = new Map(prev);
      newQueue.delete(fileId);
      return newQueue;
    });
  };

  const handleUpload = () => {
    if (onUpload) {
      // In real implementation, pass the actual files
      onUpload([]);
    }
    onClose();
  };

  const allComplete = Array.from(uploadQueue.values()).every(item => item.status === 'complete');
  const hasFiles = uploadQueue.size > 0;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Upload Documents</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Drop zone */}
          {!hasFiles && (
            <div className="p-6">
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                )}
              >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>

                  {isDragActive ? (
                    <div>
                      <p className="text-lg font-semibold">Drop files here</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Release to upload
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg font-semibold">
                        Drag and drop files here
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        or click to browse your computer
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">
                      Max {formatFileSize(maxSize)}
                    </Badge>
                    {allowedTypes && (
                      <Badge variant="secondary">
                        {allowedTypes.join(', ')}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload queue */}
          {hasFiles && (
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-3">
                {Array.from(uploadQueue.entries()).map(([fileId, item]) => (
                  <UploadItem
                    key={fileId}
                    item={item}
                    onRemove={() => removeFile(fileId)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Rejected files */}
          {rejectedFiles.length > 0 && (
            <div className="px-6 pb-4">
              <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                <h4 className="text-sm font-medium text-destructive mb-2">
                  Failed to upload {rejectedFiles.length} file(s)
                </h4>
                <div className="space-y-1">
                  {rejectedFiles.map((item, index) => (
                    <div key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                      <AlertCircle className="h-3 w-3 text-destructive" />
                      <span className="font-medium">{item.file.name}</span>
                      <span>-</span>
                      <span>{item.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 p-6 pt-0 border-t">
            <div
              {...getRootProps()}
              className="flex-1"
            >
              <input {...getInputProps()} />
              <Button variant="outline" className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                Add more files
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!allComplete || !hasFiles}
              >
                {allComplete ? 'Done' : 'Uploading...'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface UploadItemProps {
  item: UploadProgress;
  onRemove: () => void;
}

function UploadItem({ item, onRemove }: UploadItemProps) {
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    }
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) {
      return <Video className="h-5 w-5 text-purple-500" />;
    }
    if (['pdf'].includes(ext)) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }

    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const StatusIcon = () => {
    switch (item.status) {
      case 'complete':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div className="flex-shrink-0">
        {getFileIcon(item.fileName)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium truncate">{item.fileName}</span>
          <span className="text-xs text-muted-foreground ml-2">
            {item.uploadedBytes && item.totalBytes ? (
              <>
                {formatFileSize(item.uploadedBytes)} / {formatFileSize(item.totalBytes)}
              </>
            ) : (
              formatFileSize(item.totalBytes || 0)
            )}
          </span>
        </div>

        {item.status !== 'complete' && item.status !== 'error' && (
          <Progress value={item.progress} className="h-1.5" />
        )}

        {item.status === 'complete' && (
          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500">
            <CheckCircle className="h-3 w-3" />
            <span>Upload complete</span>
          </div>
        )}

        {item.status === 'error' && item.error && (
          <div className="flex items-center gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span>{item.error}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <StatusIcon />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onRemove}
          aria-label={`Remove ${item.fileName}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
