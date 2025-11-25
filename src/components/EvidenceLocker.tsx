/**
 * Evidence Locker Component
 * Secure storage and management of video evidence for incidents, accidents, and legal cases
 */

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Shield, Lock, AlertTriangle, FileText, Video, Plus, Search, Eye, Folder } from 'lucide-react';import { cn } from '@/lib/utils';

interface EvidenceLocker {
  id: number;
  locker_name: string;
  locker_type: string;
  case_number: string;
  incident_date: string;
  incident_description: string;
  status: string;
  legal_hold: boolean;
  legal_hold_reason: string;
  created_by_name: string;
  assigned_to_name: string;
  video_count: number;
  created_at: string;
}

interface EvidenceLockerDetails extends EvidenceLocker {
  videos: VideoEvidence[];
}

interface VideoEvidence {
  id: number;
  event_type: string;
  severity: string;
  event_timestamp: string;
  vehicle_name: string;
  driver_name: string;
  video_url: string;
  video_thumbnail_url: string;
  address: string;
}

const lockerTypeLabels: Record<string, string> = {
  incident: 'Incident',
  accident: 'Accident',
  litigation: 'Litigation',
  insurance_claim: 'Insurance Claim',
  training: 'Training',
  compliance: 'Compliance'
};

const statusColors = {
  open: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  closed: 'bg-gray-100 text-gray-800',
  archived: 'bg-purple-100 text-purple-800'
};

export default function EvidenceLocker() {
  const [lockers, setLockers] = useState<EvidenceLocker[]>([]);
  const [selectedLocker, setSelectedLocker] = useState<EvidenceLockerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    lockerType: 'all',
    legalHold: 'all'
  });

  const [newLocker, setNewLocker] = useState({
    lockerName: '',
    lockerType: 'incident',
    caseNumber: '',
    incidentDate: '',
    incidentDescription: '',
    legalHold: false,
    legalHoldReason: ''
  });

  useEffect(() => {
    loadEvidenceLockers();
  }, [filters]);

  const loadEvidenceLockers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.lockerType !== 'all') params.append('lockerType', filters.lockerType);
      if (filters.legalHold !== 'all') params.append('legalHold', filters.legalHold);

      const response = await fetch(`/api/video/evidence-locker?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLockers(data.lockers || []);
      }
    } catch (error) {
      console.error('Failed to load evidence lockers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLockerDetails = async (lockerId: number) => {
    try {
      const response = await fetch(`/api/video/evidence-locker/${lockerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedLocker(data);
        setShowDetailsDialog(true);
      }
    } catch (error) {
      console.error('Failed to load locker details:', error);
    }
  };

  const handleCreateLocker = async () => {
    try {
      const response = await fetch('/api/video/evidence-locker', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newLocker)
      });

      if (response.ok) {
        setShowCreateDialog(false);
        setNewLocker({
          lockerName: '',
          lockerType: 'incident',
          caseNumber: '',
          incidentDate: '',
          incidentDescription: '',
          legalHold: false,
          legalHoldReason: ''
        });
        loadEvidenceLockers();
      }
    } catch (error) {
      console.error('Failed to create evidence locker:', error);
    }
  };

  const getVideoPlaybackUrl = async (eventId: number) => {
    try {
      const response = await fetch(`/api/video/events/${eventId}/clip`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
    } catch (error) {
      console.error('Failed to get video URL:', error);
    }
    return null;
  };

  const handlePlayVideo = async (eventId: number) => {
    const url = await getVideoPlaybackUrl(eventId);
    if (url) {
      window.open(url, '_blank');
    }
  };

  const filteredLockers = lockers.filter(locker =>
    locker.locker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    locker.case_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: lockers.length,
    open: lockers.filter(l => l.status === 'open').length,
    legalHold: lockers.filter(l => l.legal_hold).length,
    totalVideos: lockers.reduce((sum, l) => sum + l.video_count, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Evidence Locker</h1>
          <p className="text-muted-foreground">Secure storage for incident videos and documentation</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Case
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cases</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Folder className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Cases</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Legal Hold</p>
                <p className="text-2xl font-bold text-red-600">{stats.legalHold}</p>
              </div>
              <Lock className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Videos</p>
                <p className="text-2xl font-bold">{stats.totalVideos}</p>
              </div>
              <Video className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.lockerType} onValueChange={(value) => setFilters({ ...filters, lockerType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(lockerTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.legalHold} onValueChange={(value) => setFilters({ ...filters, legalHold: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Legal Hold" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Legal Hold Only</SelectItem>
                <SelectItem value="false">No Legal Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Locker List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Loading evidence lockers...</p>
            </CardContent>
          </Card>
        ) : filteredLockers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No evidence lockers found</p>
            </CardContent>
          </Card>
        ) : (
          filteredLockers.map((locker) => (
            <Card key={locker.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <CardTitle className="text-lg">{locker.locker_name}</CardTitle>
                    <CardDescription>
                      {lockerTypeLabels[locker.locker_type]} • Case #{locker.case_number}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={cn(statusColors[locker.status as keyof typeof statusColors])}>
                      {locker.status.replace('_', ' ')}
                    </Badge>
                    {locker.legal_hold && (
                      <Badge className="bg-red-100 text-red-800">
                        <Lock className="h-3 w-3 mr-1" />
                        Legal Hold
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Incident Date:</span>
                    <span>{new Date(locker.incident_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created By:</span>
                    <span>{locker.created_by_name}</span>
                  </div>
                  {locker.assigned_to_name && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assigned To:</span>
                      <span>{locker.assigned_to_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Videos:</span>
                    <span className="font-semibold">{locker.video_count}</span>
                  </div>
                  {locker.incident_description && (
                    <p className="text-muted-foreground pt-2 line-clamp-2">{locker.incident_description}</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => loadLockerDetails(locker.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {/* Create Evidence Locker Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Evidence Locker</DialogTitle>
            <DialogDescription>Create a new secure case for storing video evidence</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Case Name *</label>
              <Input
                placeholder="e.g., Fleet Accident - Vehicle 123"
                value={newLocker.lockerName}
                onChange={(e) => setNewLocker({ ...newLocker, lockerName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Case Type *</label>
                <Select value={newLocker.lockerType} onValueChange={(value) => setNewLocker({ ...newLocker, lockerType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(lockerTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Case Number</label>
                <Input
                  placeholder="Optional case number"
                  value={newLocker.caseNumber}
                  onChange={(e) => setNewLocker({ ...newLocker, caseNumber: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Incident Date</label>
              <Input
                type="date"
                value={newLocker.incidentDate}
                onChange={(e) => setNewLocker({ ...newLocker, incidentDate: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Incident Description</label>
              <Textarea
                placeholder="Describe the incident..."
                rows={4}
                value={newLocker.incidentDescription}
                onChange={(e) => setNewLocker({ ...newLocker, incidentDescription: e.target.value })}
              />
            </div>

            <div className="border rounded p-4 bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="legalHold"
                  checked={newLocker.legalHold}
                  onChange={(e) => setNewLocker({ ...newLocker, legalHold: e.target.checked })}
                  className="h-4 w-4"
                />
                <label htmlFor="legalHold" className="text-sm font-medium flex items-center gap-1">
                  <Lock className="h-4 w-4 text-red-600" />
                  Place on Legal Hold
                </label>
              </div>

              {newLocker.legalHold && (
                <div className="mt-2">
                  <Textarea
                    placeholder="Reason for legal hold..."
                    rows={2}
                    value={newLocker.legalHoldReason}
                    onChange={(e) => setNewLocker({ ...newLocker, legalHoldReason: e.target.value })}
                  />
                </div>
              )}

              <p className="text-xs text-red-600 mt-2">
                Legal hold prevents automatic deletion and extends retention indefinitely
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateLocker} disabled={!newLocker.lockerName}>
              <Shield className="h-4 w-4 mr-2" />
              Create Evidence Locker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Evidence Locker Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedLocker && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle>{selectedLocker.locker_name}</DialogTitle>
                    <DialogDescription>
                      {lockerTypeLabels[selectedLocker.locker_type]} • Case #{selectedLocker.case_number}
                    </DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={cn(statusColors[selectedLocker.status as keyof typeof statusColors])}>
                      {selectedLocker.status.replace('_', ' ')}
                    </Badge>
                    {selectedLocker.legal_hold && (
                      <Badge className="bg-red-100 text-red-800">
                        <Lock className="h-3 w-3 mr-1" />
                        Legal Hold
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Case Information */}
                <div className="border rounded p-4 space-y-2">
                  <h3 className="font-semibold mb-2">Case Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Incident Date:</span>{' '}
                      {new Date(selectedLocker.incident_date).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created:</span>{' '}
                      {new Date(selectedLocker.created_at).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created By:</span> {selectedLocker.created_by_name}
                    </div>
                    {selectedLocker.assigned_to_name && (
                      <div>
                        <span className="text-muted-foreground">Assigned To:</span> {selectedLocker.assigned_to_name}
                      </div>
                    )}
                  </div>
                  {selectedLocker.incident_description && (
                    <div className="pt-2">
                      <span className="text-muted-foreground text-sm">Description:</span>
                      <p className="text-sm mt-1">{selectedLocker.incident_description}</p>
                    </div>
                  )}
                  {selectedLocker.legal_hold && selectedLocker.legal_hold_reason && (
                    <div className="pt-2 border-t">
                      <span className="text-red-600 text-sm font-medium flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Legal Hold Reason:
                      </span>
                      <p className="text-sm mt-1">{selectedLocker.legal_hold_reason}</p>
                    </div>
                  )}
                </div>

                {/* Video Evidence */}
                <div>
                  <h3 className="font-semibold mb-3">Video Evidence ({selectedLocker.videos.length})</h3>
                  <div className="space-y-2">
                    {selectedLocker.videos.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No videos in this evidence locker</p>
                    ) : (
                      selectedLocker.videos.map((video) => (
                        <div key={video.id} className="border rounded p-3 flex items-center gap-4">
                          {video.video_thumbnail_url && (
                            <img
                              src={video.video_thumbnail_url}
                              alt="Video thumbnail"
                              className="w-24 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-grow">
                            <p className="font-medium text-sm">{video.event_type.replace('_', ' ')}</p>
                            <p className="text-xs text-muted-foreground">
                              {video.vehicle_name} • {video.driver_name} • {new Date(video.event_timestamp).toLocaleString()}
                            </p>
                            {video.address && <p className="text-xs text-muted-foreground mt-1">{video.address}</p>}
                          </div>
                          <Button size="sm" onClick={() => handlePlayVideo(video.id)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
