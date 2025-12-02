/**
 * Transcript Panel Component
 * Displays searchable transcript history
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface Transmission {
  id: string;
  channel_id: string;
  started_at: string;
  transcript?: string;
  priority: string;
  intent?: string;
  entities?: Record<string, any>;
  processing_status: string;
}

interface TranscriptPanelProps {
  transmissions: Transmission[];
}

export function TranscriptPanel({ transmissions }: TranscriptPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransmissions = transmissions.filter((t) =>
    t.transcript?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportTranscripts = () => {
    const data = filteredTransmissions.map((t) => ({
      timestamp: t.started_at,
      priority: t.priority,
      intent: t.intent,
      transcript: t.transcript,
      entities: t.entities,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcripts-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Transcript History
            </CardTitle>
            <CardDescription>
              Search and review past transmissions
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportTranscripts}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transcripts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Results */}
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {filteredTransmissions.map((transmission) => (
              <Card key={transmission.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {format(new Date(transmission.started_at), 'MMM d, yyyy HH:mm:ss')}
                      </Badge>
                      <Badge>{transmission.priority}</Badge>
                      {transmission.intent && (
                        <Badge variant="secondary">{transmission.intent}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">
                    {transmission.transcript || <span className="italic text-muted-foreground">No transcript available</span>}
                  </p>

                  {/* Entities */}
                  {transmission.entities && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {transmission.entities.unit_ids?.map((unit: string) => (
                        <Badge key={unit} variant="outline" className="text-xs">
                          Unit: {unit}
                        </Badge>
                      ))}
                      {transmission.entities.locations?.map((loc: string) => (
                        <Badge key={loc} variant="outline" className="text-xs">
                          📍 {loc}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredTransmissions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No transcripts found</p>
                {searchQuery && (
                  <p className="text-sm">Try adjusting your search query</p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
