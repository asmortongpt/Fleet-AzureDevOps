/**
 * BulkActions - Select multiple, batch operations
 * Features: Multi-select, batch move, tag, share, delete, download
 */

import { useState } from 'react';
import { Download, Share2, Trash2, Tag, FolderOpen, Archive, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { BulkOperation, DocumentMetadata, Folder as FolderType } from '@/lib/documents/types';

interface BulkActionsProps {
  selectedDocuments: DocumentMetadata[];
  availableFolders: FolderType[];
  availableTags: string[];
  onExecute: (operation: BulkOperation) => Promise<void>;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedDocuments,
  availableFolders,
  availableTags,
  onExecute,
  onClearSelection
}: BulkActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<BulkOperation['operation'] | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);

  // State for operation parameters
  const [targetFolderId, setTargetFolderId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleMove = () => {
    setCurrentOperation('move');
    setShowConfirm(true);
  };

  const handleTag = () => {
    setCurrentOperation('tag');
    setShowConfirm(true);
  };

  const handleDelete = () => {
    setCurrentOperation('delete');
    setShowConfirm(true);
  };

  const handleDownload = async () => {
    setIsExecuting(true);
    try {
      for (let i = 0; i < selectedDocuments.length; i++) {
        const doc = selectedDocuments[i];
        window.open(doc.url, '_blank');
        setProgress(((i + 1) / selectedDocuments.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      onClearSelection();
    } finally {
      setIsExecuting(false);
      setProgress(0);
    }
  };

  const executeOperation = async () => {
    if (!currentOperation) return;

    setIsExecuting(true);
    try {
      const operation: BulkOperation = {
        operation: currentOperation,
        documentIds: selectedDocuments.map(d => d.id),
        metadata: {
          folderId: targetFolderId || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
        }
      };

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await onExecute(operation);
      setShowConfirm(false);
      setCurrentOperation(null);
      onClearSelection();
    } finally {
      setIsExecuting(false);
      setProgress(0);
      setTargetFolderId('');
      setSelectedTags([]);
    }
  };

  if (selectedDocuments.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-card border shadow-lg rounded-lg p-4 flex items-center gap-4 min-w-[600px]">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="font-medium">{selectedDocuments.length} selected</span>
            <Button variant="ghost" size="sm" onClick={onClearSelection}>
              Clear
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={isExecuting}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>

            <Button variant="outline" size="sm" onClick={() => {}} disabled={isExecuting}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>

            <Button variant="outline" size="sm" onClick={handleTag} disabled={isExecuting}>
              <Tag className="mr-2 h-4 w-4" />
              Tag
            </Button>

            <Button variant="outline" size="sm" onClick={handleMove} disabled={isExecuting}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Move
            </Button>

            <Button variant="outline" size="sm" onClick={() => {}} disabled={isExecuting}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isExecuting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {currentOperation === 'delete' && 'Delete Documents'}
              {currentOperation === 'move' && 'Move Documents'}
              {currentOperation === 'tag' && 'Tag Documents'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {isExecuting ? (
              <div className="space-y-3">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground text-center">
                  Processing {selectedDocuments.length} documents...
                </p>
              </div>
            ) : (
              <>
                <Alert>
                  <AlertDescription>
                    This will affect <strong>{selectedDocuments.length}</strong> document
                    {selectedDocuments.length !== 1 ? 's' : ''}.
                  </AlertDescription>
                </Alert>

                {currentOperation === 'move' && (
                  <div>
                    <label className="text-sm font-medium">Destination folder</label>
                    <Select value={targetFolderId} onValueChange={setTargetFolderId}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select folder" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFolders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.path}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {currentOperation === 'tag' && (
                  <div>
                    <label className="text-sm font-medium">Select tags</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            setSelectedTags(prev =>
                              prev.includes(tag)
                                ? prev.filter(t => t !== tag)
                                : [...prev, tag]
                            );
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {currentOperation === 'delete' && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      This action cannot be undone. Documents will be permanently deleted.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isExecuting}
            >
              Cancel
            </Button>
            <Button
              onClick={executeOperation}
              disabled={
                isExecuting ||
                (currentOperation === 'move' && !targetFolderId) ||
                (currentOperation === 'tag' && selectedTags.length === 0)
              }
              variant={currentOperation === 'delete' ? 'destructive' : 'default'}
            >
              {isExecuting ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
