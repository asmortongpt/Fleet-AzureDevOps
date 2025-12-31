/**
 * OfficeViewer - Office document preview (DOCX, XLSX, PPTX)
 * Uses Microsoft Office Online or Google Docs Viewer for preview
 */

import { Download, FileText, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentMetadata } from '@/lib/documents/types';

interface OfficeViewerProps {
  document: DocumentMetadata;
}

type ViewerProvider = 'microsoft' | 'google' | 'none';

export function OfficeViewer({ document }: OfficeViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [provider, setProvider] = useState<ViewerProvider>('microsoft');

  const handleDownload = () => {
    window.open(document.url, '_blank');
  };

  const getDocumentTypeInfo = () => {
    switch (document.type) {
      case 'document':
        return {
          icon: 'Word',
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          description: 'Word Document'
        };
      case 'spreadsheet':
        return {
          icon: 'Excel',
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          description: 'Excel Spreadsheet'
        };
      case 'presentation':
        return {
          icon: 'PowerPoint',
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          description: 'PowerPoint Presentation'
        };
      default:
        return {
          icon: 'Document',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          description: 'Office Document'
        };
    }
  };

  const typeInfo = getDocumentTypeInfo();

  // Check if URL is publicly accessible (required for Office viewers)
  const isPublicUrl = document.url.startsWith('http://') || document.url.startsWith('https://');

  // Generate viewer URLs
  const getMicrosoftViewerUrl = () => {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(document.url)}`;
  };

  const getGoogleViewerUrl = () => {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(document.url)}&embedded=true`;
  };

  const getViewerUrl = () => {
    if (provider === 'microsoft') return getMicrosoftViewerUrl();
    if (provider === 'google') return getGoogleViewerUrl();
    return '';
  };

  const switchProvider = () => {
    setLoading(true);
    setError(false);
    setProvider(prev => prev === 'microsoft' ? 'google' : 'microsoft');
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError(true);
  };

  // Reset states when document changes
  useEffect(() => {
    setLoading(true);
    setError(false);
    setProvider('microsoft');
  }, [document.url]);

  // If URL is not public, show download option
  if (!isPublicUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30">
        <div className="text-center max-w-md p-8">
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${typeInfo.bgColor} flex items-center justify-center ${typeInfo.color}`}>
            <FileText className="w-10 h-10" />
          </div>

          <h3 className="text-xl font-semibold mb-2">{document.name}</h3>
          <p className="text-muted-foreground mb-4">{typeInfo.description}</p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-800">
                This document is stored locally and cannot be previewed in the browser.
                Download the file to view it in a compatible application.
              </p>
            </div>
          </div>

          <Button onClick={handleDownload} size="lg">
            <Download className="mr-2 h-5 w-5" />
            Download {typeInfo.description}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-background border-b">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded ${typeInfo.bgColor} flex items-center justify-center ${typeInfo.color}`}>
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-medium truncate max-w-[200px]">{document.name}</p>
            <p className="text-xs text-muted-foreground">
              Viewing with {provider === 'microsoft' ? 'Microsoft Office Online' : 'Google Docs'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={switchProvider}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Try {provider === 'microsoft' ? 'Google' : 'Microsoft'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(getViewerUrl(), '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Viewer content */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="text-center space-y-4">
              <Skeleton className="w-16 h-16 rounded-full mx-auto" />
              <p className="text-muted-foreground">Loading document preview...</p>
            </div>
          </div>
        )}

        {error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md p-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle className="w-8 h-8" />
              </div>

              <h3 className="text-lg font-semibold mb-2">Preview Unavailable</h3>
              <p className="text-muted-foreground mb-6">
                Unable to load the document preview. The file may be too large, inaccessible,
                or in an unsupported format.
              </p>

              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={switchProvider}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try {provider === 'microsoft' ? 'Google' : 'Microsoft'} Viewer
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download File
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            src={getViewerUrl()}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title={`Preview of ${document.name}`}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        )}
      </div>
    </div>
  );
}
