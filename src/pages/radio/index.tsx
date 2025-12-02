/**
 * Radio Dispatch Dashboard
 * Live radio feed with real-time transcription and automated dispatch
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RadioFeed } from '@/components/radio/RadioFeed';
import { TranscriptPanel } from '@/components/radio/TranscriptPanel';
import { PolicyQueue } from '@/components/radio/PolicyQueue';
import { Radio, Activity, FileText, Settings } from 'lucide-react';
import { useRadioSocket } from '@/hooks/useRadioSocket';

export default function RadioDispatchPage() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const { isConnected, transmissions, pendingApprovals } = useRadioSocket(selectedChannel);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Radio Dispatch</h1>
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
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Channels
            </CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Monitoring in real-time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transmissions Today
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transmissions.length}</div>
            <p className="text-xs text-muted-foreground">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting HITL review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="live" className="space-y-4">
        <TabsList>
          <TabsTrigger value="live">Live Feed</TabsTrigger>
          <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="live" className="space-y-4">
          <RadioFeed
            channelId={selectedChannel}
            onChannelSelect={setSelectedChannel}
            transmissions={transmissions}
          />
        </TabsContent>

        <TabsContent value="transcripts" className="space-y-4">
          <TranscriptPanel transmissions={transmissions} />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <PolicyQueue pendingApprovals={pendingApprovals} />
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automation Policies</CardTitle>
              <CardDescription>
                Configure dispatch automation rules and workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Policy management interface coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
