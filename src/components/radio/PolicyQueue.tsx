/**
 * Policy Queue Component
 * Human-in-the-loop approval interface for automated actions
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

interface PendingApproval {
  id: string;
  policy_id: string;
  transmission_id: string;
  conditions_matched: Record<string, any>;
  actions_executed: any[];
  execution_status: string;
  created_at: string;
}

interface PolicyQueueProps {
  pendingApprovals: PendingApproval[];
}

export function PolicyQueue({ pendingApprovals }: PolicyQueueProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const handleApprove = async (id: string) => {
    try {
      await fetch(`/api/v1/policies/executions/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes[id] }),
      });
    } catch (error) {
      console.error('Failed to approve', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await fetch(`/api/v1/policies/executions/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: notes[id] }),
      });
    } catch (error) {
      console.error('Failed to reject', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Approvals
            </CardTitle>
            <CardDescription>
              Review and approve automated dispatch actions
            </CardDescription>
          </div>
          <Badge variant="outline">
            {pendingApprovals.length} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          {pendingApprovals.length === 0 ? (
            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
              <div className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No pending approvals</p>
                <p className="text-sm">All actions have been reviewed</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <Card key={approval.id} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold">Action Requires Approval</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(approval.created_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Conditions Matched */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Conditions Matched</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(approval.conditions_matched).map(([key, value]) => (
                          <Badge key={key} variant="secondary">
                            {key}: {JSON.stringify(value)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions to Execute */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">Actions to Execute</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {approval.actions_executed.map((action: any, idx: number) => (
                          <li key={idx}>
                            {action.action === 'create_incident' && 'Create incident'}
                            {action.action === 'create_task' && `Create task: ${action.title || 'Untitled'}`}
                            {action.action === 'notify' && 'Send notification'}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Notes */}
                    {expandedId === approval.id && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Notes (optional)</h4>
                        <Textarea
                          placeholder="Add notes or comments..."
                          value={notes[approval.id] || ''}
                          onChange={(e) =>
                            setNotes((prev) => ({ ...prev, [approval.id]: e.target.value }))
                          }
                          className="min-h-[80px]"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (expandedId === approval.id) {
                            handleApprove(approval.id);
                          } else {
                            setExpandedId(approval.id);
                          }
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {expandedId === approval.id ? 'Confirm Approval' : 'Approve'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (expandedId === approval.id) {
                            handleReject(approval.id);
                          } else {
                            setExpandedId(approval.id);
                          }
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {expandedId === approval.id ? 'Confirm Rejection' : 'Reject'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
