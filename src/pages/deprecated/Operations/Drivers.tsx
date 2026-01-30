/**
 * Drivers Operations Surface
 *
 * PURPOSE: "What driver actions can I take right now?"
 *
 * WORKFLOW:
 * - View drivers list from real API (left panel)
 * - Click driver → details, vehicle assignment, performance metrics inline (right panel)
 * - Actions: create, update, assign vehicle (all inline with API calls)
 * - Real performance metrics shown inline (safety score, trips, miles)
 */

import React, { useState, useMemo } from 'react';
import { User, Plus, Search, CheckCircle, Car, Trophy, Trash2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

import { SplitView } from '@/components/operations/SplitView';
import { ActionButton, StatusBadge, InlineEditPanel, ConfirmDialog } from '@/components/operations/InlineActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useDrivers, useCreateDriver, useUpdateDriver, useDeleteDriver, Driver } from '@/hooks/useDrivers';
import logger from '@/utils/logger';

export function DriversOperations() {
  // API queries
  const { data: drivers = [], isLoading, error } = useDrivers({ pageSize: 100 });
  const createMutation = useCreateDriver();
  const updateMutation = useUpdateDriver();
  const deleteMutation = useDeleteDriver();

  // Local state
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<Partial<Driver>>({});
  const [isDeletingConfirmed, setIsDeletingConfirmed] = useState(false);

  // Filter drivers based on search
  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const searchLower = searchQuery.toLowerCase();
      const fullName = `${driver.first_name || ''} ${driver.last_name || ''}`.toLowerCase();
      const email = (driver.email || '').toLowerCase();
      const license = (driver.license_number || '').toLowerCase();

      return (
        fullName.includes(searchLower) ||
        email.includes(searchLower) ||
        license.includes(searchLower)
      );
    });
  }, [drivers, searchQuery]);

  const selectedDriver = selectedDriverId
    ? drivers.find(d => d.id === selectedDriverId)
    : null;

  // Handler: Create driver
  const handleCreateDriver = async () => {
    try {
      if (!formData.first_name || !formData.email || !formData.license_number) {
        toast.error('Please fill in all required fields');
        return;
      }

      await createMutation.mutateAsync(formData as Partial<Driver>);
      toast.success('Driver created successfully!');
      setIsCreating(false);
      setFormData({});
    } catch (err) {
      toast.error('Failed to create driver');
      logger.error(err);
    }
  };

  // Handler: Update driver
  const handleUpdateDriver = async () => {
    try {
      if (!selectedDriver) return;

      await updateMutation.mutateAsync({
        id: selectedDriver.id,
        data: formData
      });
      toast.success('Driver updated successfully!');
      setIsEditing(false);
      setFormData({});
    } catch (err) {
      toast.error('Failed to update driver');
      logger.error(err);
    }
  };

  // Handler: Delete driver
  const handleDeleteDriver = async () => {
    try {
      if (!selectedDriver) return;

      await deleteMutation.mutateAsync(selectedDriver.id);
      toast.success('Driver deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedDriverId(null);
    } catch (err) {
      toast.error('Failed to delete driver');
      logger.error(err);
    }
  };

  // Render driver list item
  const renderDriverItem = (driver: Driver) => {
    const isSelected = driver.id === selectedDriverId;
    const fullName = `${driver.first_name || ''} ${driver.last_name || ''}`.trim();
    const statusDisplay = driver.status as 'active' | 'inactive' | 'pending' | 'completed' | 'error' | 'warning' || 'active';

    return (
      <motion.div
        key={driver.id}
        whileHover={{ scale: 1.01, x: 4 }}
        onClick={() => {
          setSelectedDriverId(driver.id);
          setIsCreating(false);
          setIsEditing(false);
          setFormData({});
        }}
        className={cn(
          'p-4 border-b border-slate-700/50 cursor-pointer hover:bg-cyan-400/5 transition-colors',
          isSelected && 'bg-cyan-400/10 border-l-4 border-l-cyan-400'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center border border-emerald-400/30 flex-shrink-0">
              <User className="w-6 h-6 text-emerald-400" />
            </div>

            {/* Driver Info */}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-white mb-1 truncate">{fullName}</h3>
              <p className="text-xs text-slate-400 line-clamp-2">
                {driver.license_number} • Safety: {driver.safety_score || 0}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            <StatusBadge
              status={statusDisplay}
              size="sm"
            />
          </div>
        </div>
      </motion.div>
    );
  };

  // Render driver form fields
  const renderDriverForm = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          placeholder="First name"
          value={formData.first_name || ''}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          className="bg-slate-700/50 border-slate-600 text-white"
          disabled={createMutation.isPending || updateMutation.isPending}
        />
        <Input
          placeholder="Last name"
          value={formData.last_name || ''}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          className="bg-slate-700/50 border-slate-600 text-white"
          disabled={createMutation.isPending || updateMutation.isPending}
        />
      </div>

      <Input
        placeholder="Email"
        type="email"
        value={formData.email || ''}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="bg-slate-700/50 border-slate-600 text-white"
        disabled={createMutation.isPending || updateMutation.isPending}
      />

      <Input
        placeholder="Phone"
        value={formData.phone || ''}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        className="bg-slate-700/50 border-slate-600 text-white"
        disabled={createMutation.isPending || updateMutation.isPending}
      />

      <Input
        placeholder="License number"
        value={formData.license_number || ''}
        onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
        className="bg-slate-700/50 border-slate-600 text-white"
        disabled={createMutation.isPending || updateMutation.isPending}
      />

      <select
        value={formData.status || 'active'}
        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
        className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white text-sm disabled:opacity-50"
        disabled={createMutation.isPending || updateMutation.isPending}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="off-duty">Off Duty</option>
        <option value="on-leave">On Leave</option>
        <option value="suspended">Suspended</option>
        <option value="terminated">Terminated</option>
      </select>
    </div>
  );

  // Render detail panel content
  const detailContent = () => {
    if (isCreating) {
      return (
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-cyan-400/30 p-4">
          <h4 className="text-sm font-bold text-white mb-4">Create New Driver</h4>
          {renderDriverForm()}
        </div>
      );
    }

    if (!selectedDriver) return null;

    const fullName = `${selectedDriver.first_name || ''} ${selectedDriver.last_name || ''}`.trim();

    return (
      <div className="space-y-4">
        {/* Driver Details */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-cyan-400/30 p-4">
          <h4 className="text-sm font-bold text-white mb-4">Driver Details</h4>
          {!isEditing ? (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Email:</span>
                  <p className="text-white font-medium">{selectedDriver.email}</p>
                </div>
                <div>
                  <span className="text-slate-400">Phone:</span>
                  <p className="text-white font-medium">{selectedDriver.phone || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">License:</span>
                  <p className="text-white font-mono text-xs">{selectedDriver.license_number}</p>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>
                  <p className="text-white font-semibold capitalize">{selectedDriver.status}</p>
                </div>
              </div>
              {selectedDriver.hire_date && (
                <div>
                  <span className="text-slate-400">Hire Date:</span>
                  <p className="text-white font-medium">
                    {new Date(selectedDriver.hire_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Edit Panel */}
        <InlineEditPanel
          isEditing={isEditing}
          onEdit={() => {
            setIsEditing(true);
            setFormData(selectedDriver);
          }}
          onSave={handleUpdateDriver}
          onCancel={() => {
            setIsEditing(false);
            setFormData({});
          }}
          title="Edit Driver"
          isSaving={updateMutation.isPending}
          canEdit={true}
        >
          {renderDriverForm()}
        </InlineEditPanel>

        {/* Performance Metrics */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-emerald-400/30 p-4">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400" />
            Performance Metrics
          </h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-slate-400 text-xs mb-1">Safety Score</p>
              <p className="text-emerald-400 font-bold text-lg">
                {selectedDriver.safety_score || 0}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Total Trips</p>
              <p className="text-cyan-400 font-bold text-lg">
                {selectedDriver.total_trips || 0}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">Total Miles</p>
              <p className="text-blue-400 font-bold text-lg">
                {(selectedDriver.total_miles_driven || 0).toLocaleString()}
              </p>
            </div>
          </div>
          {(selectedDriver.incidents_count || 0) > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Safety Events</p>
              <p className="text-amber-400 font-semibold">
                {selectedDriver.incidents_count} incident{(selectedDriver.incidents_count || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Delete Action */}
        <Button
          onClick={() => setShowDeleteConfirm(true)}
          variant="outline"
          size="sm"
          className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="w-4 h-4" />
          <span className="ml-2">Delete Driver</span>
        </Button>
      </div>
    );
  };

  // List panel content
  const listPanel = (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drivers..."
            className="pl-10 bg-slate-700/50 border-slate-600 text-white"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Driver list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400">Loading drivers...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-slate-400">Failed to load drivers</p>
              <p className="text-xs text-slate-500 mt-1">Please try refreshing the page</p>
            </div>
          </div>
        ) : filteredDrivers.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center">
              <User className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-400">
                {searchQuery ? 'No drivers found' : 'No drivers yet'}
              </p>
            </div>
          </div>
        ) : (
          filteredDrivers.map(renderDriverItem)
        )}
      </div>
    </div>
  );

  return (
    <>
      <SplitView
        theme="operations"
        listPanel={{
          title: 'Drivers',
          description: `${filteredDrivers.length} of ${drivers.length} drivers`,
          icon: <User />,
          content: listPanel,
          actions: (
            <Button
              onClick={() => {
                setIsCreating(true);
                setSelectedDriverId(null);
                setIsEditing(false);
                setFormData({
                  first_name: '',
                  last_name: '',
                  email: '',
                  phone: '',
                  license_number: '',
                  status: 'active'
                });
              }}
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-400 text-white"
              disabled={isLoading}
            >
              <Plus className="w-4 h-4" />
              <span className="ml-2">Add Driver</span>
            </Button>
          )
        }}
        detailPanel={
          selectedDriverId || isCreating
            ? {
                title: isCreating ? 'New Driver' : selectedDriver ? `${selectedDriver.first_name || ''} ${selectedDriver.last_name || ''}` : '',
                subtitle: isCreating ? 'Create new driver' : selectedDriver?.license_number,
                content: detailContent(),
                onClose: () => {
                  setSelectedDriverId(null);
                  setIsCreating(false);
                  setIsEditing(false);
                  setFormData({});
                },
                actions: isCreating ? (
                  <ActionButton
                    icon={<CheckCircle />}
                    label="Create"
                    onClick={handleCreateDriver}
                    variant="success"
                    loading={createMutation.isPending}
                  />
                ) : null
              }
            : null
        }
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setIsDeletingConfirmed(false);
        }}
        onConfirm={handleDeleteDriver}
        title="Delete Driver"
        message={`Are you sure you want to delete ${selectedDriver?.first_name} ${selectedDriver?.last_name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}

export default DriversOperations;
