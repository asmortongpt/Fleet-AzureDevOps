/**
 * Radio Dispatch Dashboard
 * Live radio feed with real-time transcription and automated dispatch
 */

import { Radio, Activity, FileText, Settings } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PolicyQueue } from '@/components/radio/PolicyQueue';
import { RadioFeed } from '@/components/radio/RadioFeed';
import { TranscriptPanel } from '@/components/radio/TranscriptPanel';
import { Badge } from '@/components/ui/badge';
import { Section } from '@/components/ui/section';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRadioSocket } from '@/hooks/useRadioSocket';

export default function RadioDispatchPage() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const { isConnected, transmissions, pendingApprovals } = useRadioSocket(selectedChannel);
  const activeChannelCount = useMemo(() => {
    const set = new Set(transmissions.map((t) => t.channel_id).filter(Boolean));
    return set.size;
  }, [transmissions]);

  const transmissionsToday = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return transmissions.filter((t) => {
      const date = new Date(t.started_at);
      return !Number.isNaN(date.getTime()) && date >= start;
    }).length;
  }, [transmissions]);

  return (
    <div className="flex flex-col gap-2 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold tracking-tight">Radio Dispatch</h1>
          <p className="text-muted-foreground">
            AI-powered radio monitoring and automated dispatch
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"}>
            <Activity className="mr-1 h-3 w-3" />
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-2 md:grid-cols-3">
        <Section
          title="Active Channels"
          icon={<Radio className="h-4 w-4" />}
          contentClassName="space-y-1"
        >
          <div className="text-sm font-bold">{activeChannelCount}</div>
          <p className="text-xs text-muted-foreground">
            Monitoring in real-time
          </p>
        </Section>

        <Section
          title="Transmissions Today"
          icon={<FileText className="h-4 w-4" />}
          contentClassName="space-y-1"
        >
          <div className="text-sm font-bold">{transmissionsToday}</div>
          <p className="text-xs text-muted-foreground">
            Since midnight
          </p>
        </Section>

        <Section
          title="Pending Approvals"
          icon={<Settings className="h-4 w-4" />}
          contentClassName="space-y-1"
        >
          <div className="text-sm font-bold">{pendingApprovals.length}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting HITL review
          </p>
        </Section>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="live" className="space-y-2">
        <TabsList>
          <TabsTrigger value="live">Live Feed</TabsTrigger>
          <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-2">
          <RadioFeed
            channelId={selectedChannel}
            onChannelSelect={setSelectedChannel}
            transmissions={transmissions}
          />
        </TabsContent>

        <TabsContent value="transcripts" className="space-y-2">
          <TranscriptPanel transmissions={transmissions} />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-2">
          <PolicyQueue pendingApprovals={pendingApprovals} />
        </TabsContent>

        <TabsContent value="policies" className="space-y-2">
          <Section
            title="Automation Policies"
            description="Configure dispatch automation rules and workflows"
            icon={<Settings className="h-5 w-5" />}
          >
            <div className="text-sm text-muted-foreground">
              No policies configured.
            </div>
          </Section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
