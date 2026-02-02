import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useVirtual } from '@tanstack/react-virtual';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { SearchIcon } from 'lucide-react';

interface Vehicle {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'maintenance' | 'failed';
  lastUpdated: string;
  location: string;
}

interface Driver {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'onbreak';
  currentVehicle?: string;
  lastCheckIn: string;
}

interface Route {
  id: string;
  name: string;
  status: 'ontrack' | 'delayed' | 'critical';
  progress: number;
  eta: string;
}

interface Maintenance {
  id: string;
  vehicleId: string;
  type: string;
  status: 'scheduled' | 'inprogress' | 'completed';
  dueDate: string;
}

type TabType = 'vehicles' | 'drivers' | 'routes' | 'maintenance';

const fetchVehicles = async (): Promise<Vehicle[]> => {
  const res = await fetch('/api/vehicles');
  if (!res.ok) throw new Error('Failed to fetch vehicles');
  return res.json();
};

const fetchDrivers = async (): Promise<Driver[]> => {
  const res = await fetch('/api/drivers');
  if (!res.ok) throw new Error('Failed to fetch drivers');
  return res.json();
};

const fetchRoutes = async (): Promise<Route[]> => {
  const res = await fetch('/api/routes');
  if (!res.ok) throw new Error('Failed to fetch routes');
  return res.json();
};

const fetchMaintenance = async (): Promise<Maintenance[]> => {
  const res = await fetch('/api/maintenance');
  if (!res.ok) throw new Error('Failed to fetch maintenance');
  return res.json();
};

const statusColors = {
  operational: 'bg-green-500',
  degraded: 'bg-yellow-500',
  maintenance: 'bg-orange-500',
  failed: 'bg-red-500',
  active: 'bg-green-500',
  inactive: 'bg-gray-500',
  onbreak: 'bg-yellow-500',
  ontrack: 'bg-green-500',
  delayed: 'bg-yellow-500',
  critical: 'bg-red-500',
  scheduled: 'bg-blue-500',
  inprogress: 'bg-yellow-500',
  completed: 'bg-green-500',
};

const OperationsCommand: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('vehicles');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const tabs: TabType[] = ['vehicles', 'drivers', 'routes', 'maintenance'];

  const vehiclesQuery = useQuery(['vehicles'], fetchVehicles, {
    staleTime: 60000,
    retry: 2,
  });
  const driversQuery = useQuery(['drivers'], fetchDrivers, {
    staleTime: 60000,
    retry: 2,
  });
  const routesQuery = useQuery(['routes'], fetchRoutes, {
    staleTime: 60000,
    retry: 2,
  });
  const maintenanceQuery = useQuery(['maintenance'], fetchMaintenance, {
    staleTime: 60000,
    retry: 2,
  });

  const getData = useCallback(() => {
    switch (activeTab) {
      case 'vehicles':
        return vehiclesQuery.data || [];
      case 'drivers':
        return driversQuery.data || [];
      case 'routes':
        return routesQuery.data || [];
      case 'maintenance':
        return maintenanceQuery.data || [];
      default:
        return [];
    }
  }, [activeTab, vehiclesQuery.data, driversQuery.data, routesQuery.data, maintenanceQuery.data]);

  const filteredData = useCallback(() => {
    const data = getData();
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((item: any) => item.name?.toLowerCase().includes(term) || item.id.includes(term));
  }, [getData, searchTerm]);

  const virtualizer = useVirtual({
    size: filteredData().length,
    parentRef: listRef,
    estimateSize: useCallback(() => 64, []),
    overscan: 10,
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = filteredData();
      if (!items.length) return;
      const currentIndex = items.findIndex((item: any) => item.id === selectedItem);
      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        setSelectedItem(items[nextIndex].id);
        virtualizer.scrollToIndex(nextIndex);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        setSelectedItem(items[prevIndex].id);
        virtualizer.scrollToIndex(prevIndex);
      } else if (e.key === 'Enter' && selectedItem) {
        e.preventDefault();
        // Placeholder for action trigger
      }
    },
    [filteredData, selectedItem, virtualizer]
  );

  useEffect(() => {
    const listElement = listRef.current;
    if (listElement) {
      listElement.focus();
    }
  }, []);

  const renderItem = useCallback(
    (item: any, index: number) => {
      const isSelected = selectedItem === item.id;
      const statusColor = statusColors[item.status as keyof typeof statusColors] || 'bg-gray-500';
      return (
        <motion.div
          key={item.id}
          className={`p-4 border-b border-gray-200 cursor-pointer flex items-center justify-between ${
            isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
          }`}
          onClick={() => setSelectedItem(item.id)}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 64, transform: `translateY(${index * 64}px)` }}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${statusColor}`} />
            <span className="font-medium">{item.name}</span>
          </div>
          <span className="text-sm text-gray-500">
            {item.lastUpdated || item.lastCheckIn || item.eta || item.dueDate || 'N/A'}
          </span>
        </motion.div>
      );
    },
    [selectedItem]
  );

  const renderDetail = useCallback(() => {
    if (!selectedItem) return <div className="p-6 text-center text-gray-500">Select an item to view details</div>;
    const data = filteredData();
    const item = data.find((d: any) => d.id === selectedItem);
    if (!item) return <div className="p-6 text-center text-gray-500">Item not found</div>;

    return (
      <motion.div
        key={selectedItem}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 space-y-4"
      >
        <h2 className="text-2xl font-bold">{item.name}</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Status</p>
            <p className="capitalize flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${statusColors[item.status as keyof typeof statusColors]}`} />
              {item.status}
            </p>
          </div>
          {'location' in item && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Location</p>
              <p>{item.location}</p>
            </div>
          )}
          {'currentVehicle' in item && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Vehicle</p>
              <p>{item.currentVehicle || 'Unassigned'}</p>
            </div>
          )}
          {'progress' in item && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Progress</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}
          {'vehicleId' in item && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Vehicle ID</p>
              <p>{item.vehicleId}</p>
            </div>
          )}
        </div>
        <div className="pt-4 flex gap-2">
          <Button variant="outline">Take Action</Button>
          <Button variant="destructive">Report Issue</Button>
        </div>
      </motion.div>
    );
  }, [selectedItem, filteredData]);

  const isLoading = vehiclesQuery.isLoading || driversQuery.isLoading || routesQuery.isLoading || maintenanceQuery.isLoading;
  const error = vehiclesQuery.error || driversQuery.error || routesQuery.error || maintenanceQuery.error;

  return (
    <div className="h-screen bg-white flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold mb-4">Operations Command</h1>
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              onClick={() => {
                setActiveTab(tab);
                setSelectedItem(null);
              }}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[40%] border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div
            ref={listRef}
            className="flex-1 overflow-auto focus:outline-none"
            tabIndex={0}
            onKeyDown={handleKeyDown}
          >
            {isLoading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : error ? (
              <div className="p-6 text-center text-red-500">Error: {(error as Error).message}</div>
            ) : filteredData().length === 0 ? (
              <div className="p-6 text-center text-gray-500">No items found</div>
            ) : (
              <div
                className="relative"
                style={{ height: virtualizer.totalSize, width: '100%' }}
              >
                {virtualizer.virtualItems.map((virtualRow) => {
                  const item = filteredData()[virtualRow.index];
                  return renderItem(item, virtualRow.index);
                })}
              </div>
            )}
          </div>
        </div>

        <div className="w-[60%] bg-gray-50 overflow-auto">{renderDetail()}</div>
      </div>
    </div>
  );
};

export default OperationsCommand;