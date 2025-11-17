/**
 * DocumentActivity - Activity feed for document
 * Features: Timeline of actions, filters, user attribution
 */

import { Activity, Eye, Download, Share2, MessageSquare, Tag, FolderOpen, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DocumentActivity as ActivityItem } from '@/lib/documents/types';
import { formatRelativeTime } from '@/lib/documents/utils';

interface DocumentActivityProps {
  activities: ActivityItem[];
}

export function DocumentActivity({ activities }: DocumentActivityProps) {
  const getActivityIcon = (action: ActivityItem['action']) => {
    const icons = {
      created: Upload,
      updated: Activity,
      viewed: Eye,
      downloaded: Download,
      shared: Share2,
      commented: MessageSquare,
      tagged: Tag,
      moved: FolderOpen,
    };
    return icons[action] || Activity;
  };

  const getActivityColor = (action: ActivityItem['action']) => {
    const colors = {
      created: 'text-green-500',
      updated: 'text-blue-500',
      viewed: 'text-gray-500',
      downloaded: 'text-purple-500',
      shared: 'text-orange-500',
      commented: 'text-blue-500',
      tagged: 'text-yellow-500',
      moved: 'text-indigo-500',
    };
    return colors[action] || 'text-gray-500';
  };

  const getActivityDescription = (activity: ActivityItem) => {
    const actions = {
      created: 'created this document',
      updated: 'updated this document',
      viewed: 'viewed this document',
      downloaded: 'downloaded this document',
      shared: 'shared this document',
      commented: 'commented on this document',
      tagged: 'added tags to this document',
      moved: 'moved this document',
    };

    const base = actions[activity.action] || 'performed an action';
    return activity.details ? `${base}: ${activity.details}` : base;
  };

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Activity className="h-12 w-12 text-muted-foreground opacity-30 mb-3" />
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </div>
    );
  }

  // Group by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.timestamp).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityItem[]>);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {activities.length} {activities.length === 1 ? 'activity' : 'activities'}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {Object.entries(groupedActivities).map(([date, dateActivities]) => (
            <div key={date}>
              <div className="text-xs font-semibold text-muted-foreground mb-3">
                {new Date(date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>

              <div className="space-y-3">
                {dateActivities.map((activity) => {
                  const Icon = getActivityIcon(activity.action);
                  const color = getActivityColor(activity.action);

                  return (
                    <div key={activity.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.userAvatar} />
                        <AvatarFallback>
                          {activity.userName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <Icon className={`h-4 w-4 mt-0.5 ${color}`} />
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">{activity.userName}</span>{' '}
                              <span className="text-muted-foreground">
                                {getActivityDescription(activity)}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatRelativeTime(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
