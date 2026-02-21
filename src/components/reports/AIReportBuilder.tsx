import { ArrowLeft, Sparkles, Send, Code, Eye, Save, X } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import apiClient from '@/lib/api-client';
import logger from '@/utils/logger';

interface AIReportBuilderProps {
  onBack: () => void;
  onReportCreated: (reportId: string) => void;
}

/**
 * AIReportBuilder - Low-code/no-code AI-powered report builder
 *
 * Features:
 * - Natural language input for report generation
 * - Multi-LLM orchestration (GPT-4 + Grok)
 * - Live preview of generated report
 * - Drag-and-drop visual arrangement
 * - Export as JSON definition
 * - Save to user account
 * - Share with team
 */
export function AIReportBuilder({ onBack, onReportCreated }: AIReportBuilderProps) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonDialogOpen, setJsonDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewVisual, setPreviewVisual] = useState<any>(null);

  // Example prompts
  const examplePrompts = [
    "Create a report showing monthly fuel costs by department with a trend chart and detailed breakdown",
    "Show me top 10 most expensive work orders this month with labor hours and parts costs",
    "Generate a preventive maintenance compliance report by division with completion percentages",
    "Create an EV charging utilization report with kWh consumed and cost analysis",
    "Show safety incidents by type with trend analysis and department breakdown"
  ];

  // Handle generate report
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    setError(null);

    try {
      const { reportDefinition, reportId } = await apiClient.post<{
        reportDefinition: unknown;
        reportId: string;
      }>('/api/reports/ai/generate', {
        prompt,
        model: 'gpt-4-turbo'
      });
      setGeneratedReport(reportDefinition);
      setShowPreview(true);
      if (reportId) {
        onReportCreated(reportId);
      }
    } catch (err) {
      logger.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  }, [prompt]);

  // Handle save report
  const handleSave = useCallback(async () => {
    if (!generatedReport) return;

    try {
      const { reportId } = await apiClient.post<{ reportId: string }>('/api/reports/custom', {
        definition: generatedReport,
        name: generatedReport.title
      });
      onReportCreated(reportId);
    } catch (err) {
      logger.error('Save error:', err);
      toast.error('Failed to save report. Please try again.');
    }
  }, [generatedReport, onReportCreated]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(var(--primary))] to-[hsl(var(--background))] text-white px-3 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-white hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                <h1 className="text-sm font-bold">AI Report Builder</h1>
              </div>
              <p className="text-sm opacity-90 mt-1">
                Describe your report in natural language, and AI will generate it for you
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 bg-muted/30">
        <div className="max-w-6xl mx-auto space-y-2">
          {/* Input section */}
          {!showPreview && (
            <>
              <Card className="p-3 bg-card/90 border-border/50">
                <h2 className="text-sm font-semibold text-foreground mb-2">
                  What report would you like to create?
                </h2>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: Create a report showing monthly fuel costs by department with a trend chart and detailed breakdown..."
                  className="min-h-[150px] mb-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleGenerate();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Press Ctrl+Enter to generate
                  </p>
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || generating}
                  >
                    {generating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Example prompts */}
              <Card className="p-3 bg-card/90 border-border/50">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  Example Prompts
                </h3>
                <div className="space-y-2">
                  {examplePrompts.map((example) => (
                    <button
                      key={example}
                      onClick={() => setPrompt(example)}
                      className="w-full text-left px-2 py-3 bg-muted/40 hover:bg-muted/60 rounded-lg transition-colors text-sm text-muted-foreground"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </Card>

              {/* How it works */}
              <Card className="p-3 bg-[linear-gradient(135deg,hsl(var(--background) / 0.6),hsl(var(--primary) / 0.4))] border-border/50">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  How it works
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">1.</span>
                    <span>Describe your report using natural language</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">2.</span>
                    <span>AI analyzes your request and generates a report schema</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">3.</span>
                    <span>Preview and customize the generated report</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold">4.</span>
                    <span>Save to your account or share with your team</span>
                  </li>
                </ul>
              </Card>
            </>
          )}

          {/* Preview section */}
          {showPreview && generatedReport && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">
                  Generated Report Preview
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Edit Prompt
                  </Button>
                  <Button variant="outline" onClick={() => setJsonDialogOpen(true)}>
                    <Code className="h-4 w-4 mr-2" />
                    View JSON
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Report
                  </Button>
                </div>
              </div>

              <Card className="p-3 bg-card/90 border-border/50">
                <div className="mb-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {generatedReport.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {generatedReport.description}
                  </p>
                </div>

                <div className="space-y-2">
                  {generatedReport.visuals?.map((visual: any) => (
                    <div
                      key={visual.title}
                      className="p-2 bg-muted/40 rounded-lg border-2 border-dashed border-border/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium text-foreground">{visual.title}</div>
                          <div className="text-xs text-muted-foreground">Type: {visual.type}</div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setPreviewVisual(visual)
                          setPreviewDialogOpen(true)
                        }}>
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                      {visual.measures && (
                        <div className="text-xs text-muted-foreground">
                          {visual.measures.length} measures configured
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-3 bg-emerald-500/10 border-emerald-500/30">
                <h3 className="text-sm font-semibold text-emerald-200 mb-2">
                  Report Generated Successfully
                </h3>
                <p className="text-sm text-emerald-100/80">
                  Your report has been generated and is ready to save. You can customize
                  the layout, add more visuals, or save it directly to your account.
                </p>
              </Card>
            </>
          )}

          {/* Error */}
          {error && (
            <Card className="p-3 bg-red-500/10 border-red-500/30">
              <h3 className="text-sm font-semibold text-red-200 mb-2">
                Generation Failed
              </h3>
              <p className="text-sm text-red-100/80">{error}</p>
            </Card>
          )}
        </div>
      </div>

      {/* JSON Schema Dialog */}
      <Dialog open={jsonDialogOpen} onOpenChange={setJsonDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Report JSON Schema
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
              {generatedReport ? JSON.stringify(generatedReport, null, 2) : 'No report generated'}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Visual Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visual Preview: {previewVisual?.title || 'Untitled'}
            </DialogTitle>
          </DialogHeader>
          {previewVisual && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>{' '}
                  <span className="font-medium">{previewVisual.type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Measures:</span>{' '}
                  <span className="font-medium">{previewVisual.measures?.length || 0}</span>
                </div>
              </div>
              {previewVisual.measures && previewVisual.measures.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Configured Measures</h4>
                  <div className="space-y-1">
                    {previewVisual.measures.map((m: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <span>{m.label || m.id}</span>
                        <span className="text-muted-foreground text-xs">{m.format || m.aggregation || 'value'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                <div className="text-3xl mb-2">
                  {previewVisual.type === 'line' ? '📈' : previewVisual.type === 'bar' ? '📊' : previewVisual.type === 'table' ? '📋' : '📊'}
                </div>
                <p className="text-sm">{previewVisual.type} visualization</p>
                <p className="text-xs mt-1">Data will be populated when the report is executed</p>
              </div>
              <div className="mt-2">
                <h4 className="text-sm font-medium mb-1">Raw Configuration</h4>
                <pre className="text-xs font-mono bg-muted p-2 rounded overflow-x-auto max-h-32">
                  {JSON.stringify(previewVisual, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
