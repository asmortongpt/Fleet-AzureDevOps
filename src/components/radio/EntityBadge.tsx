/**
 * EntityBadge Component
 * Displays extracted entities from radio transcriptions as colored badges
 */

import { MapPin, User, Hash, Clock, AlertCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ExtractedEntity } from '@/types/radio';

interface EntityBadgeProps {
  entity: ExtractedEntity;
  onClick?: () => void;
  className?: string;
}

const ENTITY_CONFIG = {
  UNIT: {
    color: 'bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 dark:bg-emerald-900 dark:text-emerald-300',
    icon: Hash,
    label: 'Unit'
  },
  LOCATION: {
    color: 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300',
    icon: MapPin,
    label: 'Location'
  },
  INCIDENT_CODE: {
    color: 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300',
    icon: AlertCircle,
    label: 'Code'
  },
  PERSON: {
    color: 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-300',
    icon: User,
    label: 'Person'
  },
  TIME: {
    color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300',
    icon: Clock,
    label: 'Time'
  },
  OTHER: {
    color: 'bg-white/[0.05] text-[var(--text-secondary)] hover:bg-white/[0.06] dark:bg-[var(--surface-3)] dark:text-[var(--text-secondary)]',
    icon: Hash,
    label: 'Other'
  }
};

export function EntityBadge({ entity, onClick, className }: EntityBadgeProps) {
  const config = ENTITY_CONFIG[entity.type] || ENTITY_CONFIG.OTHER;
  const Icon = config.icon;

  const confidenceColor = entity.confidence >= 0.9 ? 'text-green-600' :
                          entity.confidence >= 0.7 ? 'text-yellow-600' :
                          'text-red-600';

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 cursor-pointer transition-colors',
        config.color,
        onClick && '',
        className
      )}
      onClick={onClick}
      title={`${config.label}: ${entity.value} (${Math.round(entity.confidence * 100)}% confidence)`}
    >
      <Icon className="h-3 w-3" />
      <span className="font-medium">{entity.value}</span>
      {entity.confidence < 0.9 && (
        <span className={cn('text-xs ml-1', confidenceColor)}>
          {Math.round(entity.confidence * 100)}%
        </span>
      )}
    </Badge>
  );
}

interface EntityBadgeListProps {
  entities: ExtractedEntity[];
  onEntityClick?: (entity: ExtractedEntity) => void;
  maxDisplay?: number;
  className?: string;
}

export function EntityBadgeList({
  entities,
  onEntityClick,
  maxDisplay = 10,
  className
}: EntityBadgeListProps) {
  const displayedEntities = entities.slice(0, maxDisplay);
  const remainingCount = entities.length - maxDisplay;

  if (entities.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No entities extracted
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {displayedEntities.map((entity) => (
        <EntityBadge
          key={entity.id}
          entity={entity}
          onClick={() => onEntityClick?.(entity)}
        />
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="bg-white/[0.03] dark:bg-[var(--surface-1)]">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}
