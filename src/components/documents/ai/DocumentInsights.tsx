/**
 * DocumentInsights - AI-generated insights panel
 * Features: Summary, key points, entities, sentiment
 */

import { Sparkles, FileText, Tag, TrendingUp, Users, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { DocumentInsight, DocumentMetadata } from '@/lib/documents/types';

interface DocumentInsightsProps {
  document: DocumentMetadata;
  insights: DocumentInsight[];
}

export function DocumentInsights({ document, insights }: DocumentInsightsProps) {
  const summaryInsight = insights.find(i => i.type === 'summary');
  const keyPointsInsight = insights.find(i => i.type === 'key-points');
  const entitiesInsight = insights.find(i => i.type === 'entities');
  const sentimentInsight = insights.find(i => i.type === 'sentiment');

  if (insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Sparkles className="h-12 w-12 text-muted-foreground opacity-30 mb-3" />
        <p className="text-sm text-muted-foreground">No AI insights available</p>
        <p className="text-xs text-muted-foreground mt-1">
          Process this document to generate insights
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Summary */}
        {summaryInsight && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                Summary
                {summaryInsight.confidence && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {Math.round(summaryInsight.confidence * 100)}% confidence
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {summaryInsight.content}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Key Points */}
        {keyPointsInsight && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="h-4 w-4 text-primary" />
                Key Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(keyPointsInsight.metadata?.points as string[] || []).map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Entities */}
        {entitiesInsight && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-4 w-4 text-primary" />
                Detected Entities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* People */}
              {entitiesInsight.metadata?.people && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">People</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(entitiesInsight.metadata.people as string[]).map((person) => (
                      <Badge key={person} variant="secondary">
                        {person}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates */}
              {entitiesInsight.metadata?.dates && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Dates</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(entitiesInsight.metadata.dates as string[]).map((date, i) => (
                      <Badge key={i} variant="outline">
                        {date}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Locations */}
              {entitiesInsight.metadata?.locations && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-muted-foreground">Locations</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(entitiesInsight.metadata.locations as string[]).map((location) => (
                      <Badge key={location} variant="outline">
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sentiment */}
        {sentimentInsight && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-primary" />
                Sentiment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Sentiment</span>
                  <Badge variant="outline" className="capitalize">
                    {sentimentInsight.metadata?.sentiment || 'Neutral'}
                  </Badge>
                </div>

                {sentimentInsight.confidence && (
                  <>
                    <Progress value={sentimentInsight.confidence * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {Math.round(sentimentInsight.confidence * 100)}% confidence
                    </p>
                  </>
                )}
              </div>

              {sentimentInsight.content && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground">{sentimentInsight.content}</p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Document metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {document.ocrText && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">OCR Extracted</span>
                <Badge variant="secondary">{document.ocrText.split(' ').length} words</Badge>
              </div>
            )}
            {document.ocrConfidence && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">OCR Confidence</span>
                <div className="flex items-center gap-2">
                  <Progress value={document.ocrConfidence * 100} className="h-1.5 w-24" />
                  <span className="text-xs">{Math.round(document.ocrConfidence * 100)}%</span>
                </div>
              </div>
            )}
            {document.aiTags && document.aiTags.length > 0 && (
              <div>
                <span className="text-muted-foreground">AI Tags</span>
                <div className="flex flex-wrap gap-1 mt-2">
                  {document.aiTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
