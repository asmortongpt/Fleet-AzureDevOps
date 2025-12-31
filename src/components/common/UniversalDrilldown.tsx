/**
 * Universal Drilldown System
 *
 * Implements: Every data element drills to final record
 * - Shows summary/list view first
 * - Allows drill-down to detail/edit view
 * - RBAC-based CRUD operations
 *
 * Created: 2025-12-31
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Eye, Edit, Trash2 } from 'lucide-react';

export interface DrilldownRecord {
  id: string | number;
  title: string;
  subtitle?: string;
  status?: string;
  metadata?: Record<string, any>;
  children?: DrilldownRecord[];
}

export interface DrilldownConfig {
  entityType: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onView?: (record: DrilldownRecord) => void;
  onEdit?: (record: DrilldownRecord) => void;
  onDelete?: (record: DrilldownRecord) => void;
  customFields?: Array<{
    key: string;
    label: string;
    render?: (value: any, record: DrilldownRecord) => React.ReactNode;
  }>;
}

interface UniversalDrilldownProps {
  records: DrilldownRecord[];
  config: DrilldownConfig;
  level?: number;
}

export function UniversalDrilldown({ records, config, level = 0 }: UniversalDrilldownProps) {
  const [expandedRecords, setExpandedRecords] = useState<Set<string | number>>(new Set());

  const toggleExpand = (recordId: string | number) => {
    setExpandedRecords(prev => {
      const next = new Set(prev);
      if (next.has(recordId)) {
        next.delete(recordId);
      } else {
        next.add(recordId);
      }
      return next;
    });
  };

  const isExpanded = (recordId: string | number) => expandedRecords.has(recordId);

  return (
    <div className="space-y-2">
      {records.map(record => (
        <div key={record.id} className={`${level > 0 ? 'ml-6 border-l-2 border-muted pl-4' : ''}`}>
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {record.children && record.children.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(record.id)}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${isExpanded(record.id) ? 'rotate-90' : ''}`}
                      />
                    </Button>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {record.title}
                      {record.status && (
                        <Badge variant={
                          record.status === 'active' ? 'default' :
                          record.status === 'completed' ? 'secondary' :
                          record.status === 'pending' ? 'outline' : 'destructive'
                        }>
                          {record.status}
                        </Badge>
                      )}
                    </CardTitle>
                    {record.subtitle && (
                      <p className="text-sm text-muted-foreground mt-1">{record.subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {config.canView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => config.onView?.(record)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {config.canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => config.onEdit?.(record)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {config.canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => config.onDelete?.(record)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            {(record.metadata || config.customFields) && (
              <CardContent className="pt-0">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {config.customFields?.map(field => {
                    const value = record.metadata?.[field.key];
                    if (value === undefined) return null;

                    return (
                      <div key={field.key}>
                        <dt className="font-medium text-muted-foreground">{field.label}</dt>
                        <dd className="mt-1">
                          {field.render ? field.render(value, record) : String(value)}
                        </dd>
                      </div>
                    );
                  })}
                  {!config.customFields && record.metadata && Object.entries(record.metadata).map(([key, value]) => (
                    <div key={key}>
                      <dt className="font-medium text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                      <dd className="mt-1">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            )}
          </Card>

          {/* Nested children - recursive drilldown */}
          {record.children && record.children.length > 0 && isExpanded(record.id) && (
            <div className="mt-2">
              <UniversalDrilldown
                records={record.children}
                config={config}
                level={level + 1}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Hook for managing drilldown state and operations
 */
export function useDrilldown(entityType: string) {
  const [selectedRecord, setSelectedRecord] = useState<DrilldownRecord | null>(null);
  const [drilldownPath, setDrilldownPath] = useState<DrilldownRecord[]>([]);

  const drillDown = (record: DrilldownRecord) => {
    setDrilldownPath(prev => [...prev, record]);
    setSelectedRecord(record);
  };

  const drillUp = () => {
    setDrilldownPath(prev => {
      const next = [...prev];
      next.pop();
      setSelectedRecord(next[next.length - 1] || null);
      return next;
    });
  };

  const resetDrilldown = () => {
    setDrilldownPath([]);
    setSelectedRecord(null);
  };

  return {
    selectedRecord,
    drilldownPath,
    drillDown,
    drillUp,
    resetDrilldown,
    currentLevel: drilldownPath.length
  };
}
