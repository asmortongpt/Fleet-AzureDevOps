/**
 * Vehicles Fleet Management Interface
 *
 * Modern split-view layout for production fleet management:
 * - Professional vehicle list with real-time data
 * - Advanced search and filtering capabilities
 * - Inline editing with status badges
 * - Comprehensive vehicle details panel
 * - Complete CRUD operations
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Car,
  Plus,
  MagnifyingGlass,
  Funnel,
  Gauge,
  Drop,
  CheckCircle,
  Trash,
  PencilSimple,
  X,
  GasPump,
  Wrench,
  Clock
} from '@phosphor-icons/react';
import { toast } from 'react-hot-toast';

import { SplitView } from '@/components/operations/SplitView';
import {
  ActionButton,
  InlineEditPanel,
  ConfirmDialog,
  StatusBadge
} from '@/components/operations/InlineActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useVehicles, useVehicleMutations } from '@/hooks/use-api';

interface Vehicle {
  id: string;
  vehicle_number?: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  licensePlate?: string;
  license_plate?: string;
  status?: string;
  mileage?: number;
  odometer?: number;
  fuelType?: string;
  fuel_type?: string;
  fuelLevel?: number;
  fuel_level?: number;
  tenant_id?: string;
}

interface VehicleFormData extends Vehicle {
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string;
  status: string;
  mileage: number;
  fuelType: string;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-emerald-500/20 border-emerald-500' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-amber-500/20 border-amber-500' },
  { value: 'inactive', label: 'Inactive', color: 'bg-slate-500/20 border-slate-500' },
  { value: 'out_of_service', label: 'Out of Service', color: 'bg-red-500/20 border-red-500' },
];

const FUEL_TYPES = [
  'Gasoline',
  'Diesel',
  'Electric',
  'Hybrid',
  'CNG',
  'Propane'
];

function getStatusBadgeType(status?: string): 'active' | 'inactive' | 'warning' {
  if (!status) return 'inactive';
  const lower = status.toLowerCase();
  if (lower === 'active' || lower === 'operational') return 'active';
  if (lower === 'maintenance') return 'warning';
  return 'inactive';
}

export function VehiclesOperations() {
  // State management
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<VehicleFormData>>({});

  // API hooks
  const { data: vehiclesResponse, isLoading } = useVehicles({ tenant_id: '' });
  const { createVehicle, updateVehicle, deleteVehicle } = useVehicleMutations();

  // Normalize and extract vehicles from response
  const vehicles = useMemo(() => {
    if (!vehiclesResponse) return [];
    const arr = Array.isArray(vehiclesResponse)
      ? vehiclesResponse
      : (vehiclesResponse as any).data || [];
    return arr.map((v: any) => ({
      ...v,
      licensePlate: v.licensePlate || v.license_plate,
      mileage: v.mileage || v.odometer || 0,
      fuelType: v.fuelType || v.fuel_type,
      fuelLevel: v.fuelLevel || v.fuel_level || 0,
    }));
  }, [vehiclesResponse]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v: any) => {
      const matchesSearch = !searchQuery ||
        v.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.vin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = filterStatus === 'all' ||
        v.status?.toLowerCase() === filterStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchQuery, filterStatus]);

  // Selected vehicle details
  const selectedVehicle = useMemo(() => {
    return vehicles.find((v: any) => v.id === selectedVehicleId);
  }, [vehicles, selectedVehicleId]);

  // Handlers
  const handleSelectVehicle = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setIsEditing(false);
    setIsCreating(false);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedVehicleId(null);
    setIsEditing(false);
    setIsCreating(false);
    setFormData({});
  }, []);

  const handleCreateNew = useCallback(() => {
    setIsCreating(true);
    setSelectedVehicleId(null);
    setIsEditing(false);
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      vin: '',
      licensePlate: '',
      status: 'active',
      mileage: 0,
      fuelType: 'Gasoline',
      vehicle_number: `V-${Date.now().toString().slice(-6)}`,
    });
  }, []);

  const handleSaveNew = useCallback(async () => {
    try {
      await createVehicle.mutateAsync(formData as any);
      toast.success('Vehicle created successfully!');
      handleCloseDetail();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create vehicle');
    }
  }, [formData, createVehicle, handleCloseDetail]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setFormData(selectedVehicle || {});
  }, [selectedVehicle]);

  const handleSaveEdit = useCallback(async () => {
    if (!selectedVehicleId) return;

    try {
      const updateData = {
        ...formData,
        id: selectedVehicleId,
      };
      await updateVehicle.mutateAsync(updateData as any);
      toast.success('Vehicle updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update vehicle');
    }
  }, [selectedVehicleId, formData, updateVehicle]);

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm) return;

    try {
      await deleteVehicle.mutateAsync({
        id: deleteConfirm,
        tenant_id: selectedVehicle?.tenant_id || ''
      });
      toast.success('Vehicle deleted successfully!');
      setDeleteConfirm(null);
      if (selectedVehicleId === deleteConfirm) {
        handleCloseDetail();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete vehicle');
    }
  }, [deleteConfirm, selectedVehicleId, selectedVehicle, deleteVehicle, handleCloseDetail]);

  const handleFormChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Render vehicle table row
  const renderVehicleRow = (vehicle: Vehicle) => {
    const isSelected = vehicle.id === selectedVehicleId;
    const statusLabel = STATUS_OPTIONS.find(s => s.value === vehicle.status?.toLowerCase())?.label || 'Unknown';

    return (
      <motion.div
        key={vehicle.id}
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => handleSelectVehicle(vehicle.id)}
        className={cn(
          'border-b border-slate-700/50 cursor-pointer transition-all duration-200 hover:bg-cyan-400/5',
          isSelected && 'bg-cyan-400/10 border-l-4 border-l-cyan-400'
        )}
      >
        <div className="grid grid-cols-12 gap-4 p-4 items-center text-sm">
          {/* Vehicle Number */}
          <div className="col-span-2">
            <p className="font-mono font-semibold text-white">{vehicle.vehicle_number || '-'}</p>
            <p className="text-xs text-slate-400 mt-1">ID: {vehicle.id?.slice(0, 8) || 'N/A'}</p>
          </div>

          {/* Make/Model */}
          <div className="col-span-3">
            <p className="font-semibold text-white">{vehicle.year || '—'} {vehicle.make || '—'}</p>
            <p className="text-xs text-slate-400 mt-1">{vehicle.model || 'Unknown Model'}</p>
          </div>

          {/* Status */}
          <div className="col-span-2">
            <StatusBadge status={getStatusBadgeType(vehicle.status)} size="sm" />
            <p className="text-xs text-slate-400 mt-2">{statusLabel}</p>
          </div>

          {/* Mileage */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Gauge className="w-4 h-4 text-cyan-400" weight="bold" />
              <span className="font-mono">{(vehicle.mileage || 0).toLocaleString()} mi</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Current Mileage</p>
          </div>

          {/* Fuel Level */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Drop className="w-4 h-4 text-blue-400" weight="bold" />
              <span className="font-mono">{vehicle.fuelLevel || 0}%</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Fuel Level</p>
          </div>

          {/* License Plate */}
          <div className="col-span-1 text-right">
            <p className="font-mono font-semibold text-slate-300 text-xs">{vehicle.licensePlate || '—'}</p>
          </div>
        </div>
      </motion.div>
    );
  };

  // Render vehicle form
  const renderVehicleForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Vehicle Number */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Vehicle Number
          </label>
          <Input
            value={formData.vehicle_number || ''}
            onChange={(e) => handleFormChange('vehicle_number', e.target.value)}
            placeholder="V-12345"
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>

        {/* License Plate */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            License Plate *
          </label>
          <Input
            value={formData.licensePlate || ''}
            onChange={(e) => handleFormChange('licensePlate', e.target.value.toUpperCase())}
            placeholder="ABC-1234"
            className="bg-slate-700/50 border-slate-600 text-white font-mono"
          />
        </div>

        {/* Make */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Make *
          </label>
          <Input
            value={formData.make || ''}
            onChange={(e) => handleFormChange('make', e.target.value)}
            placeholder="Toyota, Ford, etc."
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>

        {/* Model */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Model *
          </label>
          <Input
            value={formData.model || ''}
            onChange={(e) => handleFormChange('model', e.target.value)}
            placeholder="Camry, F-150, etc."
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>

        {/* Year */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Year *
          </label>
          <Input
            type="number"
            value={formData.year || ''}
            onChange={(e) => handleFormChange('year', parseInt(e.target.value))}
            placeholder="2024"
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>

        {/* VIN */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            VIN *
          </label>
          <Input
            value={formData.vin || ''}
            onChange={(e) => handleFormChange('vin', e.target.value.toUpperCase())}
            placeholder="17-character VIN"
            maxLength={17}
            className="bg-slate-700/50 border-slate-600 text-white font-mono text-sm"
          />
        </div>

        {/* Fuel Type */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Fuel Type *
          </label>
          <select
            value={formData.fuelType || 'Gasoline'}
            onChange={(e) => handleFormChange('fuelType', e.target.value)}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white text-sm"
          >
            {FUEL_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Status *
          </label>
          <select
            value={formData.status || 'active'}
            onChange={(e) => handleFormChange('status', e.target.value)}
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white text-sm"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Mileage */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Mileage (miles)
          </label>
          <Input
            type="number"
            value={formData.mileage || 0}
            onChange={(e) => handleFormChange('mileage', parseInt(e.target.value) || 0)}
            placeholder="0"
            className="bg-slate-700/50 border-slate-600 text-white"
          />
        </div>
      </div>
    </div>
  );

  // Render detail content
  const detailContent = () => {
    if (isCreating) {
      return (
        <div className="space-y-4">
          <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-cyan-400/30 p-4">
            <h4 className="text-sm font-bold text-white mb-4">New Vehicle Registration</h4>
            {renderVehicleForm()}
          </div>
        </div>
      );
    }

    if (!selectedVehicle) return null;

    const statusLabel = STATUS_OPTIONS.find(s => s.value === selectedVehicle.status?.toLowerCase())?.label || 'Unknown';

    return (
      <div className="space-y-4">
        {/* Vehicle Overview */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-cyan-400/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-white">Fleet Information</h4>
            <StatusBadge status={getStatusBadgeType(selectedVehicle.status)} />
          </div>

          {!isEditing ? (
            <div className="space-y-3 text-sm">
              {/* Header Row */}
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-700/50">
                <div>
                  <span className="text-slate-400 text-xs">Vehicle Number</span>
                  <p className="text-white font-mono font-semibold mt-1">{selectedVehicle.vehicle_number || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Status</span>
                  <p className="text-white font-semibold mt-1">{statusLabel}</p>
                </div>
              </div>

              {/* Make/Model/Year */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-400 text-xs">Make</span>
                  <p className="text-white font-semibold mt-1">{selectedVehicle.make || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Model</span>
                  <p className="text-white font-semibold mt-1">{selectedVehicle.model || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">Year</span>
                  <p className="text-white font-semibold mt-1">{selectedVehicle.year || '—'}</p>
                </div>
              </div>

              {/* IDs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 text-xs">VIN</span>
                  <p className="text-white font-mono text-xs mt-1">{selectedVehicle.vin || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs">License Plate</span>
                  <p className="text-white font-mono font-semibold mt-1">{selectedVehicle.licensePlate || 'N/A'}</p>
                </div>
              </div>

              {/* Operational Data */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-700/50">
                <div>
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <Gauge className="w-3 h-3" weight="bold" />
                    Mileage
                  </span>
                  <p className="text-white font-mono font-semibold mt-1">{(selectedVehicle.mileage || 0).toLocaleString()} mi</p>
                </div>
                <div>
                  <span className="text-slate-400 text-xs flex items-center gap-1">
                    <GasPump className="w-3 h-3" weight="bold" />
                    Fuel Type
                  </span>
                  <p className="text-white font-semibold mt-1">{selectedVehicle.fuelType || 'N/A'}</p>
                </div>
              </div>

              {/* Fuel Level */}
              <div>
                <span className="text-slate-400 text-xs flex items-center gap-1">
                  <Drop className="w-3 h-3" weight="bold" />
                  Fuel Level
                </span>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 bg-slate-700/50 rounded-full h-2 overflow-hidden border border-slate-600">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all"
                      style={{ width: `${Math.min(selectedVehicle.fuelLevel || 0, 100)}%` }}
                    />
                  </div>
                  <span className="text-white font-mono text-sm min-w-12">{selectedVehicle.fuelLevel || 0}%</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Quick Stats */}
        {!isEditing && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-cyan-400/20 p-3 text-center">
              <Wrench className="w-4 h-4 text-cyan-400 mx-auto mb-1" weight="bold" />
              <p className="text-xs text-slate-400">Maintenance Due</p>
              <p className="text-white font-semibold text-sm mt-1">Soon</p>
            </div>
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-cyan-400/20 p-3 text-center">
              <Clock className="w-4 h-4 text-cyan-400 mx-auto mb-1" weight="bold" />
              <p className="text-xs text-slate-400">Last Service</p>
              <p className="text-white font-semibold text-sm mt-1">30 days ago</p>
            </div>
            <div className="bg-slate-800/30 backdrop-blur-xl rounded-lg border border-cyan-400/20 p-3 text-center">
              <GasPump className="w-4 h-4 text-cyan-400 mx-auto mb-1" weight="bold" />
              <p className="text-xs text-slate-400">Efficiency</p>
              <p className="text-white font-semibold text-sm mt-1">18 MPG</p>
            </div>
          </div>
        )}

        {/* Inline Edit Panel */}
        <InlineEditPanel
          isEditing={isEditing}
          onEdit={handleEdit}
          onSave={handleSaveEdit}
          onCancel={() => setIsEditing(false)}
          isSaving={updateVehicle.isPending}
          title="Edit Vehicle"
        >
          {renderVehicleForm()}
        </InlineEditPanel>

        {/* Danger Zone */}
        {!isEditing && (
          <div className="bg-red-500/10 backdrop-blur-xl rounded-lg border border-red-500/30 p-4">
            <h4 className="text-sm font-bold text-red-400 mb-2">Danger Zone</h4>
            <p className="text-xs text-slate-300 mb-3">
              Permanently remove this vehicle from the fleet. This action cannot be undone.
            </p>
            <Button
              onClick={() => setDeleteConfirm(selectedVehicle.id)}
              variant="outline"
              size="sm"
              className="border-red-500 text-red-400 hover:bg-red-500/10"
            >
              <Trash className="w-4 h-4" weight="bold" />
              <span className="ml-2">Delete Vehicle</span>
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Render list panel
  const listPanel = (
    <div className="flex flex-col h-full">
      {/* Search and Filters */}
      <div className="p-4 space-y-3 border-b border-slate-700/50">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" weight="bold" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vehicle #, make, model, or plate..."
            className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 text-sm"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Funnel className="w-4 h-4 text-slate-400 flex-shrink-0" weight="bold" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white text-sm"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Header */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <div className="col-span-2">Vehicle #</div>
        <div className="col-span-3">Make / Model</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Mileage</div>
        <div className="col-span-2">Fuel</div>
        <div className="col-span-1">Plate</div>
      </div>

      {/* Vehicle List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full" />
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <Car className="w-12 h-12 text-slate-600 mb-3" weight="bold" />
            <p className="text-sm font-semibold text-slate-400">No vehicles found</p>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first vehicle to get started'}
            </p>
          </div>
        ) : (
          <div>
            {filteredVehicles.map(renderVehicleRow)}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <SplitView
        theme="operations"
        listPanel={{
          title: 'Fleet Vehicles',
          description: `${filteredVehicles.length} vehicle${filteredVehicles.length !== 1 ? 's' : ''}`,
          icon: <Car />,
          content: listPanel,
          actions: (
            <Button
              onClick={handleCreateNew}
              size="sm"
              className="bg-cyan-400 hover:bg-cyan-300 text-slate-900 font-bold shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            >
              <Plus className="w-4 h-4" weight="bold" />
              <span className="ml-2">Add Vehicle</span>
            </Button>
          )
        }}
        detailPanel={
          selectedVehicleId || isCreating
            ? {
                title: isCreating
                  ? 'Register New Vehicle'
                  : `${selectedVehicle?.year || '—'} ${selectedVehicle?.make || '—'} ${selectedVehicle?.model || '—'}`,
                subtitle: isCreating
                  ? 'Complete vehicle details'
                  : `${selectedVehicle?.vehicle_number || 'N/A'} • ${selectedVehicle?.licensePlate || 'No plate'}`,
                content: detailContent(),
                onClose: handleCloseDetail,
                actions: isCreating ? (
                  <ActionButton
                    icon={<CheckCircle />}
                    label="Create"
                    onClick={handleSaveNew}
                    variant="success"
                    loading={createVehicle.isPending}
                  />
                ) : isEditing ? (
                  <div className="flex gap-2">
                    <ActionButton
                      icon={<CheckCircle />}
                      label="Save"
                      onClick={handleSaveEdit}
                      variant="success"
                      loading={updateVehicle.isPending}
                    />
                  </div>
                ) : (
                  <ActionButton
                    icon={<PencilSimple />}
                    label="Edit"
                    onClick={handleEdit}
                    variant="default"
                  />
                )
              }
            : null
        }
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete Vehicle?"
        message="This action is permanent. The vehicle will be removed from the fleet database along with all associated records."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteVehicle.isPending}
      />
    </>
  );
}

export default VehiclesOperations;
