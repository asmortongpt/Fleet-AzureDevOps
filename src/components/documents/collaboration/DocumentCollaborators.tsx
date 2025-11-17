/**
 * DocumentCollaborators - Real-time presence indicators
 * Features: Online status, cursor positions, active viewers
 */

import { Users, Circle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collaborator } from '@/lib/documents/types';
import { formatRelativeTime } from '@/lib/documents/utils';

interface DocumentCollaboratorsProps {
  collaborators: Collaborator[];
  compact?: boolean;
}

export function DocumentCollaborators({ collaborators, compact = false }: DocumentCollaboratorsProps) {
  const onlineCollaborators = collaborators.filter(c => c.isOnline);
  const offlineCollaborators = collaborators.filter(c => !c.isOnline);

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <div className="flex -space-x-2">
            {onlineCollaborators.slice(0, 3).map((collaborator) => (
              <Tooltip key={collaborator.userId}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Avatar className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={collaborator.userAvatar} />
                      <AvatarFallback>
                        {collaborator.userName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{collaborator.userName}</p>
                  <p className="text-xs text-muted-foreground">{collaborator.role}</p>
                  <p className="text-xs text-green-500">Online</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>

          {onlineCollaborators.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{onlineCollaborators.length - 3}
            </Badge>
          )}
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Collaborators
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {onlineCollaborators.length} online • {collaborators.length} total
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Online collaborators */}
          {onlineCollaborators.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-3">
                Online ({onlineCollaborators.length})
              </div>
              <div className="space-y-2">
                {onlineCollaborators.map((collaborator) => (
                  <CollaboratorCard
                    key={collaborator.userId}
                    collaborator={collaborator}
                    isOnline
                  />
                ))}
              </div>
            </div>
          )}

          {/* Offline collaborators */}
          {offlineCollaborators.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-3">
                Offline ({offlineCollaborators.length})
              </div>
              <div className="space-y-2">
                {offlineCollaborators.map((collaborator) => (
                  <CollaboratorCard
                    key={collaborator.userId}
                    collaborator={collaborator}
                    isOnline={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface CollaboratorCardProps {
  collaborator: Collaborator;
  isOnline: boolean;
}

function CollaboratorCard({ collaborator, isOnline }: CollaboratorCardProps) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={collaborator.userAvatar} />
            <AvatarFallback>
              {collaborator.userName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
              isOnline ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{collaborator.userName}</div>
          <div className="text-xs text-muted-foreground truncate">{collaborator.email}</div>
          {!isOnline && collaborator.lastSeen && (
            <div className="text-xs text-muted-foreground">
              Last seen {formatRelativeTime(collaborator.lastSeen)}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs capitalize">
          {collaborator.role}
        </Badge>
        {isOnline && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Currently active</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}
