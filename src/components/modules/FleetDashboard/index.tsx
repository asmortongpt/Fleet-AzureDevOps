src/components/modules/FleetDashboard/index.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { VehicleList } from './VehicleList';
import { FilterPanel } from './FilterPanel';
import { StatsSummary } from './StatsSummary';
import { useVehicles } from '../../../hooks/useVehicles';
import { Vehicle } from '../../../types/Vehicle';
import { ErrorBoundary } from '../../common/ErrorBoundary';
import { Logger } from '../../../utils/Logger';

interface FleetDashboardProps {
  tenantId: string;
}

export const FleetDashboard: React.FC<FleetDashboardProps> = ({ tenantId }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const { vehicles, isLoading, error, fetchVehicles } = useVehicles(tenantId);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleSelectVehicle = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    Logger.info(`Vehicle selected: ${vehicle.id}`);
  }, []);

  if (error) {
    Logger.error('Error fetching vehicles', error);
    return <div>Error loading vehicles</div>;
  }

  return (
    <ErrorBoundary>
      <FilterPanel onFilterChange={fetchVehicles} />
      <StatsSummary vehicles={vehicles} />
      <VehicleList
        vehicles={vehicles}
        onSelect={handleSelectVehicle}
        isLoading={isLoading}
      />
    </ErrorBoundary>
  );
};
```

src/components/modules/FleetDashboard/VehicleList.tsx
```typescript
import React, { memo } from 'react';
import { VehicleCard } from './VehicleCard';
import { Vehicle } from '../../../types/Vehicle';
import { LoadingSpinner } from '../../common/LoadingSpinner';

interface VehicleListProps {
  vehicles: Vehicle[];
  onSelect: (vehicle: Vehicle) => void;
  isLoading: boolean;
}

export const VehicleList: React.FC<VehicleListProps> = memo(({
  vehicles,
  onSelect,
  isLoading
}) => {
  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {vehicles.map(vehicle => (
        <VehicleCard
          key={vehicle.id}
          vehicle={vehicle}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
});
```

src/components/modules/FleetDashboard/VehicleCard.tsx
```typescript
import React from 'react';
import { Vehicle } from '../../../types/Vehicle';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect: (vehicle: Vehicle) => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onSelect }) => {
  return (
    <div className="vehicle-card" onClick={() => onSelect(vehicle)}>
      <h3>{vehicle.name}</h3>
      <p>{vehicle.model}</p>
      <p>{vehicle.status}</p>
    </div>
  );
};
```

src/components/modules/FleetDashboard/FilterPanel.tsx
```typescript
import React, { useState } from 'react';

interface FilterPanelProps {
  onFilterChange: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ onFilterChange }) => {
  const [filter, setFilter] = useState<string>('');

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value);
    onFilterChange();
  };

  return (
    <div className="filter-panel">
      <input
        type="text"
        value={filter}
        onChange={handleFilterChange}
        placeholder="Search vehicles..."
      />
    </div>
  );
};
```

src/hooks/useVehicles.ts
```typescript
import { useState, useCallback } from 'react';
import { Vehicle } from '../types/Vehicle';
import { Logger } from '../utils/Logger';

export const useVehicles = (tenantId: string) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    try {
      // Replace with actual data fetching logic
      const response = await fetch(`/api/vehicles?tenantId=${tenantId}`);
      const data: Vehicle[] = await response.json();
      setVehicles(data);
      Logger.info('Vehicles fetched successfully');
    } catch (err) {
      setError(err as Error);
      Logger.error('Error fetching vehicles', err);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  return { vehicles, isLoading, error, fetchVehicles };
};
```

src/types/Vehicle.ts
```typescript
export interface Vehicle {
  id: string;
  name: string;
  model: string;
  status: string;
}
```

src/utils/Logger.ts
```typescript
export class Logger {
  static info(message: string, ...optionalParams: any[]) {
    console.info(message, ...optionalParams);
  }

  static error(message: string, ...optionalParams: any[]) {
    console.error(message, ...optionalParams);
  }
}
```

src/components/common/ErrorBoundary.tsx
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

src/components/common/LoadingSpinner.tsx
```typescript
import React from 'react';

export const LoadingSpinner: React.FC = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
  </div>
);
```