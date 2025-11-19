/**
 * CodeViewer - Syntax-highlighted code viewer
 * Features: Syntax highlighting, line numbers, copy, search
 */

import { useState, useEffect } from 'react';
import { Copy, Check, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DocumentMetadata } from '@/lib/documents/types';

interface CodeViewerProps {
  document: DocumentMetadata;
}

export function CodeViewer({ document }: CodeViewerProps) {
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch code content
    fetch(document.url)
      .then(res => res.text())
      .then(text => {
        setCode(text);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading code:', err);
        setCode('// Error loading file');
        setLoading(false);
      });
  }, [document.url]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = document.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLanguage = () => {
    const ext = document.name.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      js: 'JavaScript',
      jsx: 'React',
      ts: 'TypeScript',
      tsx: 'TypeScript React',
      py: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      cs: 'C#',
      go: 'Go',
      rs: 'Rust',
      rb: 'Ruby',
      php: 'PHP',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      json: 'JSON',
      xml: 'XML',
      yaml: 'YAML',
      yml: 'YAML',
      md: 'Markdown',
      sql: 'SQL',
    };
    return langMap[ext] || ext.toUpperCase();
  };

  /**
   * Escapes HTML to prevent XSS attacks
   */
  const escapeHtml = (text: string): string => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  const highlightCode = (code: string): string => {
    // SECURITY: First escape all HTML to prevent XSS attacks
    let highlighted = escapeHtml(code);

    // Keywords (simplified example)
    const keywords = [
      'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return',
      'class', 'interface', 'type', 'import', 'export', 'from', 'async', 'await',
      'public', 'private', 'protected', 'static', 'extends', 'implements'
    ];

    // This is a simplified highlighter. For production, use a library like Prism.js
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="text-purple-600 dark:text-purple-400 font-semibold">${keyword}</span>`);
    });

    // Strings - now matching escaped quotes
    highlighted = highlighted.replace(
      /(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)/g,
      '<span class="text-green-600 dark:text-green-400">$1</span>'
    );

    // Comments
    highlighted = highlighted.replace(
      /(\/\/.*$)/gm,
      '<span class="text-gray-500 dark:text-gray-400 italic">$1</span>'
    );
    highlighted = highlighted.replace(
      /(\/\*[\s\S]*?\*\/)/g,
      '<span class="text-gray-500 dark:text-gray-400 italic">$1</span>'
    );

    // Numbers
    highlighted = highlighted.replace(
      /\b(\d+)\b/g,
      '<span class="text-orange-600 dark:text-orange-400">$1</span>'
    );

    return highlighted;
  };

  const lines = code.split('\n');
  const filteredLines = searchQuery
    ? lines.map((line, idx) => ({ line, idx })).filter(({ line }) =>
        line.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : lines.map((line, idx) => ({ line, idx }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{getLanguage()}</Badge>
          <span className="text-sm text-muted-foreground">
            {lines.length} lines
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 w-48"
              aria-label="Search code"
            />
          </div>

          {/* Copy */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>

          {/* Download */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            aria-label="Download file"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      {/* Code content */}
      <ScrollArea className="flex-1">
        <div className="font-mono text-sm">
          <table className="w-full border-collapse">
            <tbody>
              {filteredLines.map(({ line, idx }) => (
                <tr
                  key={idx}
                  className="hover:bg-accent/50 transition-colors"
                >
                  {/* Line number */}
                  <td className="px-4 py-0.5 text-right text-muted-foreground select-none border-r w-16 bg-muted/30">
                    {idx + 1}
                  </td>

                  {/* Code line */}
                  <td className="px-4 py-0.5">
                    <pre
                      className="whitespace-pre-wrap break-all"
                      dangerouslySetInnerHTML={{ __html: highlightCode(line) || '&nbsp;' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>

      {/* Search results info */}
      {searchQuery && (
        <div className="p-2 border-t bg-card text-sm text-muted-foreground text-center">
          {filteredLines.length} of {lines.length} lines match "{searchQuery}"
        </div>
      )}
    </div>
  );
}
