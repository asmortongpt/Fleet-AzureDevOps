/**
 * Universal Data Drilldown System - COMPLETE IMPLEMENTATION
 *
 * Features:
 * - Summary → Detail → Edit flow for all entities
 * - RBAC-aware actions (view, edit, delete)
 * - Breadcrumb navigation
 * - Deep linking support
 * - Related entity navigation
 * - Audit trail display
 *
 * Created: 2025-12-31 (Agent 5)
 */

import {
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  History,
  Link as LinkIcon
} from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

export interface DrilldownRecord {
  id: string | number;
  type: string;
  title: string;
  subtitle?: string;
  status?: string;
  metadata: Record<string, any>;
  children?: DrilldownRecord[];
  relatedEntities?: {
    type: string;
    id: string;
    label: string;
  }[];
  auditTrail?: {
    timestamp: Date;
    user: string;
    action: string;
    details: string;
  }[];
}

export interface DrilldownPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewChildren: boolean;
}

export interface DataDrilldownProps {
  records: DrilldownRecord[];
  entityType: string;
  permissions: DrilldownPermissions;
  onView?: (record: DrilldownRecord) => void;
  onEdit?: (record: DrilldownRecord) => void;
  onDelete?: (record: DrilldownRecord) => void;
  onNavigate?: (type: string, id: string) => void;
}

export function DataDrilldown({
  records,
  entityType,
  permissions,
  onView,
  onEdit,
  onDelete,
  onNavigate
}: DataDrilldownProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<DrilldownRecord[]>([]);
  const [currentRecord, setCurrentRecord] = useState<DrilldownRecord | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'edit'>('list');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<DrilldownRecord | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, any>>({});

  const getCurrentRecords = (): DrilldownRecord[] => {
    if (breadcrumbs.length === 0) return records;
    const parent = breadcrumbs[breadcrumbs.length - 1];
    return parent.children || [];
  };

  const handleDrillDown = (record: DrilldownRecord) => {
    if (record.children && record.children.length > 0) {
      setBreadcrumbs([...breadcrumbs, record]);
    } else {
      handleView(record);
    }
  };

  const handleView = (record: DrilldownRecord) => {
    if (!permissions.canView) return;
    setCurrentRecord(record);
    setViewMode('detail');
    onView?.(record);
  };

  const handleEditClick = (record: DrilldownRecord) => {
    if (!permissions.canEdit) return;
    setCurrentRecord(record);
    setEditFormData(record.metadata);
    setViewMode('edit');
  };

  const handleSaveEdit = () => {
    if (!currentRecord) return;
    onEdit?.({ ...currentRecord, metadata: editFormData });
    setViewMode('detail');
  };

  const handleDeleteClick = (record: DrilldownRecord) => {
    if (!permissions.canDelete) return;
    setRecordToDelete(record);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      onDelete?.(recordToDelete);
      setIsDeleteDialogOpen(false);
      setRecordToDelete(null);
      if (viewMode === 'detail' && currentRecord?.id === recordToDelete.id) {
        setViewMode('list');
        setCurrentRecord(null);
      }
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    setBreadcrumbs(breadcrumbs.slice(0, index));
    setViewMode('list');
    setCurrentRecord(null);
  };

  const handleBack = () => {
    if (viewMode !== 'list') {
      setViewMode('list');
      setCurrentRecord(null);
    } else if (breadcrumbs.length > 0) {
      setBreadcrumbs(breadcrumbs.slice(0, -1));
    }
  };

  // Render List View
  const renderListView = () => {
    const currentRecords = getCurrentRecords();

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {breadcrumbs.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Go back">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                {entityType}
              </CardTitle>
              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleBreadcrumbClick(0)}
                    className="p-0 h-auto"
                  >
                    Home
                  </Button>
                  {breadcrumbs.map((crumb, idx) => (
                    <React.Fragment key={crumb.id}>
                      <ChevronRight className="h-3 w-3" />
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleBreadcrumbClick(idx + 1)}
                        className="p-0 h-auto"
                      >
                        {crumb.title}
                      </Button>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentRecords.map(record => (
                <TableRow key={record.id}>
                  <TableCell className="font-mono text-sm">{record.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{record.title}</div>
                      {record.subtitle && (
                        <div className="text-sm text-muted-foreground">{record.subtitle}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {record.status && (
                      <Badge variant="outline">{record.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {Object.keys(record.metadata).length} fields
                    {record.children && ` • ${record.children.length} children`}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {permissions.canView && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDrillDown(record)}
                        >
                          {record.children && record.children.length > 0 ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {permissions.canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(record)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {permissions.canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(record)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  // Render Detail View
  const renderDetailView = () => {
    if (!currentRecord) return null;

    return (
      <div className="space-y-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Go back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle>{currentRecord.title}</CardTitle>
                  {currentRecord.subtitle && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentRecord.subtitle}
                    </p>
                  )}
                </div>
                {currentRecord.status && (
                  <Badge variant="outline">{currentRecord.status}</Badge>
                )}
              </div>
              <div className="flex gap-2">
                {permissions.canEdit && (
                  <Button onClick={() => setViewMode('edit')}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {permissions.canDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteClick(currentRecord)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-2">
              <div className="col-span-2 border-b pb-2">
                <dt className="text-sm font-medium text-muted-foreground">Record ID</dt>
                <dd className="font-mono text-sm mt-1">{currentRecord.id}</dd>
              </div>
              {Object.entries(currentRecord.metadata).map(([key, value]) => (
                <div key={key} className="border-b pb-2">
                  <dt className="text-sm font-medium text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </dt>
                  <dd className="text-sm mt-1">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        {/* Related Entities */}
        {currentRecord.relatedEntities && currentRecord.relatedEntities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Related Entities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currentRecord.relatedEntities.map((entity, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => onNavigate?.(entity.type, entity.id)}
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    {entity.type}: {entity.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audit Trail */}
        {currentRecord.auditTrail && currentRecord.auditTrail.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentRecord.auditTrail.map((entry, idx) => (
                  <div key={idx} className="flex gap-2 text-sm border-b pb-3">
                    <div className="text-muted-foreground w-32">
                      {entry.timestamp.toLocaleString()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{entry.action}</div>
                      <div className="text-muted-foreground">{entry.details}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        by {entry.user}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Render Edit View
  const renderEditView = () => {
    if (!currentRecord) return null;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setViewMode('detail')} aria-label="Cancel editing and go back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>Edit {currentRecord.title}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setViewMode('detail')}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(editFormData).map(([key, value]) => (
              <div key={key}>
                <label className="text-sm font-medium capitalize">
                  {key.replace(/_/g, ' ')}
                </label>
                <Input
                  value={String(value)}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    [key]: e.target.value
                  })}
                  className="mt-1"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div>
      {viewMode === 'list' && renderListView()}
      {viewMode === 'detail' && renderDetailView()}
      {viewMode === 'edit' && renderEditView()}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{recordToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
