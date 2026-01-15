// Fleet Application - Advanced Document Comparison & Visual Diff
// Side-by-side comparison with AI-powered change detection and visual diff

import React, { useState, useEffect } from 'react';
import { pdfjs } from 'react-pdf';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  X,
  GitCompare,
  FileText,
  Zap,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';

import { cn } from '@/lib/utils';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface DocumentVersion {
  id: string;
  version: number;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  created_by: string;
  content_text?: string;
  downloadUrl: string;
}

interface ComparisonResult {
  added: string[];
  removed: string[];
  modified: string[];
  unchanged: number;
  totalChanges: number;
  changePercentage: number;
  aiSummary?: string;
}

interface DocumentComparisonProps {
  open: boolean;
  onClose: () => void;
  oldVersion: DocumentVersion;
  newVersion: DocumentVersion;
}

export function DocumentComparison({
  open,
  onClose,
  oldVersion,
  newVersion
}: DocumentComparisonProps) {
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified' | 'ai-summary'>('side-by-side');
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [highlightChanges, setHighlightChanges] = useState(true);

  // Perform document comparison
  useEffect(() => {
    if (open) {
      performComparison();
    }
  }, [open, oldVersion.id, newVersion.id]);

  const performComparison = async () => {
    setLoading(true);
    try {
      // Fetch content for both versions
      const [oldContent, newContent] = await Promise.all([
        fetchDocumentContent(oldVersion),
        fetchDocumentContent(newVersion)
      ]);

      // Perform text-based diff
      const result = computeDiff(oldContent, newContent);

      // Get AI summary of changes
      const aiSummary = await getAISummary(oldContent, newContent, result);

      setComparisonResult({
        ...result,
        aiSummary
      });
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentContent = async (version: DocumentVersion): Promise<string> => {
    if (version.content_text) {
      return version.content_text;
    }

    // For PDFs and images, we'd need OCR - use the indexing service
    const response = await fetch(`/api/documents/${version.id}/content`);
    if (!response.ok) throw new Error('Failed to fetch content');

    const data = await response.json();
    return data.content || '';
  };

  const computeDiff = (oldText: string, newText: string): Omit<ComparisonResult, 'aiSummary'> => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];
    let unchanged = 0;

    // Simple line-by-line diff (in production, use diff-match-patch or similar)
    const maxLen = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';

      if (oldLine === newLine) {
        unchanged++;
      } else if (!oldLine && newLine) {
        added.push(newLine);
      } else if (oldLine && !newLine) {
        removed.push(oldLine);
      } else {
        modified.push(`${oldLine} → ${newLine}`);
      }
    }

    const totalChanges = added.length + removed.length + modified.length;
    const totalLines = maxLen;
    const changePercentage = totalLines > 0 ? (totalChanges / totalLines) * 100 : 0;

    return {
      added,
      removed,
      modified,
      unchanged,
      totalChanges,
      changePercentage
    };
  };

  const getAISummary = async (
    oldContent: string,
    newContent: string,
    diff: Omit<ComparisonResult, 'aiSummary'>
  ): Promise<string> => {
    try {
      const response = await fetch('/api/ai/summarize-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldContent: oldContent.substring(0, 5000), // Limit for API
          newContent: newContent.substring(0, 5000),
          changeStats: {
            added: diff.added.length,
            removed: diff.removed.length,
            modified: diff.modified.length
          }
        })
      });

      if (!response.ok) throw new Error('AI summary failed');

      const data = await response.json();
      return data.summary || 'Changes detected between versions.';
    } catch (error) {
      console.error('AI summary error:', error);
      return `${diff.totalChanges} changes detected (${diff.added.length} additions, ${diff.removed.length} deletions, ${diff.modified.length} modifications)`;
    }
  };

  const renderSideBySide = () => {
    if (!comparisonResult) return null;

    return (
      <div className="grid grid-cols-2 gap-2 h-full">
        {/* Old Version */}
        <div className="border-r pr-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-sm">Version {oldVersion.version}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(oldVersion.created_at).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">by {oldVersion.created_by}</p>
            </div>
            <Badge variant="secondary">Old</Badge>
          </div>
          <ScrollArea className="h-[600px]">
            <div className="font-mono text-sm whitespace-pre-wrap">
              {oldVersion.content_text?.split('\n').map((line, idx) => {
                const isRemoved = comparisonResult.removed.includes(line);
                const isModified = comparisonResult.modified.some(m => m.startsWith(line));

                return (
                  <div
                    key={idx}
                    className={cn(
                      "px-2 py-1 border-l-4",
                      isRemoved && highlightChanges && "bg-red-50 border-red-500 text-red-900",
                      isModified && highlightChanges && "bg-yellow-50 border-yellow-500 text-yellow-900",
                      !isRemoved && !isModified && !showUnchanged && "opacity-30"
                    )}
                  >
                    <span className="text-xs text-gray-400 mr-2">{idx + 1}</span>
                    {line || ' '}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* New Version */}
        <div className="pl-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-sm">Version {newVersion.version}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(newVersion.created_at).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">by {newVersion.created_by}</p>
            </div>
            <Badge variant="default">New</Badge>
          </div>
          <ScrollArea className="h-[600px]">
            <div className="font-mono text-sm whitespace-pre-wrap">
              {newVersion.content_text?.split('\n').map((line, idx) => {
                const isAdded = comparisonResult.added.includes(line);
                const isModified = comparisonResult.modified.some(m => m.endsWith(line));

                return (
                  <div
                    key={idx}
                    className={cn(
                      "px-2 py-1 border-l-4",
                      isAdded && highlightChanges && "bg-green-50 border-green-500 text-green-900",
                      isModified && highlightChanges && "bg-blue-50 border-blue-500 text-blue-900",
                      !isAdded && !isModified && !showUnchanged && "opacity-30"
                    )}
                  >
                    <span className="text-xs text-gray-400 mr-2">{idx + 1}</span>
                    {line || ' '}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  const renderUnified = () => {
    if (!comparisonResult) return null;

    const allChanges = [
      ...comparisonResult.added.map(line => ({ type: 'added', text: line })),
      ...comparisonResult.removed.map(line => ({ type: 'removed', text: line })),
      ...comparisonResult.modified.map(line => ({ type: 'modified', text: line }))
    ];

    return (
      <ScrollArea className="h-[700px]">
        <div className="font-mono text-sm">
          {allChanges.map((change, idx) => (
            <div
              key={idx}
              className={cn(
                "px-2 py-2 border-l-4",
                change.type === 'added' && "bg-green-50 border-green-500 text-green-900",
                change.type === 'removed' && "bg-red-50 border-red-500 text-red-900",
                change.type === 'modified' && "bg-blue-50 border-blue-500 text-blue-900"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {change.type === 'added' && <CheckCircle2 className="w-4 h-4" />}
                {change.type === 'removed' && <XCircle className="w-4 h-4" />}
                {change.type === 'modified' && <AlertCircle className="w-4 h-4" />}
                <Badge variant="outline" className="text-xs">
                  {change.type.toUpperCase()}
                </Badge>
              </div>
              <div className="whitespace-pre-wrap">{change.text}</div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  const renderAISummary = () => {
    if (!comparisonResult) return null;

    return (
      <div className="space-y-2">
        {/* AI Generated Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-3 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3 h-3 text-purple-600" />
            <h3 className="font-semibold text-sm">AI-Powered Change Summary</h3>
          </div>
          <p className="text-gray-700 leading-relaxed">
            {comparisonResult.aiSummary}
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-green-50 p-2 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Added</span>
            </div>
            <div className="text-sm font-bold text-green-700">
              {comparisonResult.added.length}
            </div>
          </div>

          <div className="bg-red-50 p-2 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">Removed</span>
            </div>
            <div className="text-sm font-bold text-red-700">
              {comparisonResult.removed.length}
            </div>
          </div>

          <div className="bg-blue-50 p-2 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-800" />
              <span className="text-sm font-medium text-blue-900">Modified</span>
            </div>
            <div className="text-sm font-bold text-blue-700">
              {comparisonResult.modified.length}
            </div>
          </div>

          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <span className="text-sm font-medium text-gray-900">Change %</span>
            </div>
            <div className="text-sm font-bold text-gray-700">
              {comparisonResult.changePercentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Top Changes */}
        <div className="space-y-3">
          <h4 className="font-semibold">Notable Changes</h4>

          {comparisonResult.added.slice(0, 5).map((line, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5" />
              <div>
                <Badge variant="outline" className="mb-2">Added</Badge>
                <p className="text-sm text-gray-700 font-mono">{line}</p>
              </div>
            </div>
          ))}

          {comparisonResult.removed.slice(0, 5).map((line, idx) => (
            <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <XCircle className="w-3 h-3 text-red-600 mt-0.5" />
              <div>
                <Badge variant="outline" className="mb-2">Removed</Badge>
                <p className="text-sm text-gray-700 font-mono">{line}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh]">
        <DialogHeader className="border-b pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitCompare className="h-6 w-6 text-blue-800" />
              <div>
                <DialogTitle className="text-base">Document Comparison</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Comparing {oldVersion.file_name} (v{oldVersion.version} → v{newVersion.version})
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Controls */}
        <div className="flex items-center justify-between border-b pb-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="side-by-side">
                <ArrowLeftRight className="w-4 h-4 mr-2" />
                Side-by-Side
              </TabsTrigger>
              <TabsTrigger value="unified">
                <FileText className="w-4 h-4 mr-2" />
                Unified
              </TabsTrigger>
              <TabsTrigger value="ai-summary">
                <Zap className="w-4 h-4 mr-2" />
                AI Summary
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2">
            <Button
              variant={highlightChanges ? "default" : "outline"}
              size="sm"
              onClick={() => setHighlightChanges(!highlightChanges)}
            >
              {highlightChanges ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUnchanged(!showUnchanged)}
            >
              {showUnchanged ? 'Hide' : 'Show'} Unchanged
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-9 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-500">Analyzing changes...</p>
              </div>
            </div>
          ) : (
            <>
              {viewMode === 'side-by-side' && renderSideBySide()}
              {viewMode === 'unified' && renderUnified()}
              {viewMode === 'ai-summary' && renderAISummary()}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
