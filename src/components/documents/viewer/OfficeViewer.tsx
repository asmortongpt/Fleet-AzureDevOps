/**
 * OfficeViewer - Office document preview (DOCX, XLSX, PPTX)
 * Placeholder for future integration with Office viewers
 * Can be integrated with: Office Online, Google Docs Viewer, or Mammoth.js
 */

import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentMetadata } from '@/lib/documents/types';

interface OfficeViewerProps {
  document: DocumentMetadata;
}

export function OfficeViewer({ document }: OfficeViewerProps) {
  const handleDownload = () => {
    window.open(document.url, '_blank');
  };

  const getDocumentTypeInfo = () => {
    switch (document.type) {
      case 'document':
        return {
          icon: 'Word',
          color: 'text-blue-600',
          description: 'Word Document'
        };
      case 'spreadsheet':
        return {
          icon: 'Excel',
          color: 'text-green-600',
          description: 'Excel Spreadsheet'
        };
      case 'presentation':
        return {
          icon: 'PowerPoint',
          color: 'text-orange-600',
          description: 'PowerPoint Presentation'
        };
      default:
        return {
          icon: 'Document',
          color: 'text-gray-600',
          description: 'Office Document'
        };
    }
  };

  const typeInfo = getDocumentTypeInfo();

  return (
    <div className="flex items-center justify-center h-full bg-muted/30">
      <div className="text-center max-w-md p-8">
        <div className={`w-24 h-24 mx-auto mb-6 rounded-full bg-background flex items-center justify-center ${typeInfo.color}`}>
          <FileText className="w-12 h-12" />
        </div>

        <h3 className="text-xl font-semibold mb-2">{document.name}</h3>
        <p className="text-muted-foreground mb-6">{typeInfo.description}</p>

        <div className="bg-card border rounded-lg p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            Office document preview is not yet available. You can download the file to view it
            in Microsoft Office, Google Docs, or compatible applications.
          </p>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Future integrations:</strong></p>
            <ul className="list-disc list-inside">
              <li>Microsoft Office Online viewer</li>
              <li>Google Docs Viewer</li>
              <li>Mammoth.js (DOCX to HTML)</li>
              <li>SheetJS (XLSX parsing)</li>
            </ul>
          </div>
        </div>

        <Button onClick={handleDownload} size="lg">
          <Download className="mr-2 h-5 w-5" />
          Download to view
        </Button>
      </div>
    </div>
  );
}
