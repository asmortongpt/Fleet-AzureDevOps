/**
 * Live Radio Feed Component
 * Displays real-time radio transmissions with audio playback
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Pause, Volume2, Radio as RadioIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

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

interface RadioFeedProps {
  channelId: string | null;
  onChannelSelect: (channelId: string) => void;
  transmissions: Transmission[];
}

const PRIORITY_COLORS = {
  CRITICAL: 'destructive',
  HIGH: 'warning',
  NORMAL: 'default',
  LOW: 'secondary',
} as const;

export function RadioFeed({ channelId, onChannelSelect, transmissions }: RadioFeedProps) {
  const getPriorityColor = (priority: string) => {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || 'default';
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Channel Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RadioIcon className="h-5 w-5" />
            Channels
          </CardTitle>
          <CardDescription>Select a channel to monitor</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {[
                { id: '1', name: 'Fire Dispatch Channel 1', talkgroup: 'FD-01', active: true },
                { id: '2', name: 'Police Channel A', talkgroup: 'PD-A', active: true },
                { id: '3', name: 'EMS Primary', talkgroup: 'EMS-01', active: false },
              ].map((channel) => (
                <Button
                  key={channel.id}
                  variant={channelId === channel.id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => onChannelSelect(channel.id)}
                  disabled={!channel.active}
                >
                  <div className="flex flex-col items-start gap-1">
                    <div className="font-medium">{channel.name}</div>
                    <div className="text-xs text-muted-foreground">{channel.talkgroup}</div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Live Feed */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Live Transmissions</CardTitle>
          <CardDescription>
            {channelId ? `Monitoring channel ${channelId}` : 'Select a channel to begin'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {transmissions.length === 0 ? (
              <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <RadioIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No transmissions yet</p>
                  <p className="text-sm">Waiting for radio activity...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {transmissions.map((transmission) => (
                  <Card key={transmission.id} className={cn(
                    "border-l-4",
                    transmission.priority === 'CRITICAL' && "border-l-red-500",
                    transmission.priority === 'HIGH' && "border-l-orange-500",
                    transmission.priority === 'NORMAL' && "border-l-blue-500"
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(transmission.priority)}>
                            {transmission.priority}
                          </Badge>
                          {transmission.intent && (
                            <Badge variant="outline">{transmission.intent}</Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(transmission.started_at), { addSuffix: true })}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Entities */}
                      {transmission.entities && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {transmission.entities.unit_ids?.map((unit: string) => (
                            <Badge key={unit} variant="secondary">Unit: {unit}</Badge>
                          ))}
                          {transmission.entities.locations?.map((loc: string) => (
                            <Badge key={loc} variant="secondary">📍 {loc}</Badge>
                          ))}
                          {transmission.entities.incident_codes?.map((code: string) => (
                            <Badge key={code} variant="secondary">🚨 {code}</Badge>
                          ))}
                        </div>
                      )}

                      {/* Transcript */}
                      {transmission.processing_status === 'complete' && transmission.transcript ? (
                        <p className="text-sm leading-relaxed">{transmission.transcript}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          {transmission.processing_status === 'transcribing' && 'Transcribing...'}
                          {transmission.processing_status === 'analyzing' && 'Analyzing...'}
                          {transmission.processing_status === 'pending' && 'Processing...'}
                        </p>
                      )}

                      {/* Audio Player */}
                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" variant="ghost">
                          <Play className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 h-1 bg-muted rounded-full">
                          <div className="h-full w-0 bg-primary rounded-full" />
                        </div>
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
