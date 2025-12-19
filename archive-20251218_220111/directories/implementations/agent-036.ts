I'll provide a complete, working TypeScript code example for a CTAFleet Agent system. This code represents a fleet management agent (Agent 36) that could be used for tracking and managing vehicles in a transit system like the Chicago Transit Authority (CTA). The code includes interfaces, classes, error handling, and basic functionality for vehicle tracking and status updates.

```typescript
// Interfaces for type safety
interface Vehicle {
  id: string;
  route: string;
  status: 'active' | 'inactive' | 'maintenance';
  location: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: Date;
}

interface FleetUpdate {
  vehicleId: string;
  status?: 'active' | 'inactive' | 'maintenance';
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Custom error class for fleet management
class FleetError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FleetError';
  }
}

// Main CTAFleet Agent class
class CTAFleetAgent36 {
  private readonly agentId: string = 'AGENT_36';
  private vehicles: Map<string, Vehicle> = new Map();
  private readonly MAX_VEHICLES: number = 100;
  private readonly VALID_COORDINATES = {
    latitude: { min: -90, max: 90 },
    longitude: { min: -180, max: 180 }
  };

  constructor() {
    console.log(`CTAFleet Agent ${this.agentId} initialized`);
  }

  // Add a new vehicle to the fleet
  public addVehicle(vehicle: Vehicle): void {
    try {
      if (this.vehicles.size >= this.MAX_VEHICLES) {
        throw new FleetError(
          'Maximum vehicle capacity reached',
          'CAPACITY_EXCEEDED'
        );
      }

      if (this.vehicles.has(vehicle.id)) {
        throw new FleetError(
          `Vehicle ${vehicle.id} already exists`,
          'DUPLICATE_VEHICLE'
        );
      }

      if (!this.validateCoordinates(vehicle.location)) {
        throw new FleetError(
          'Invalid vehicle coordinates',
          'INVALID_COORDINATES'
        );
      }

      this.vehicles.set(vehicle.id, vehicle);
      console.log(`Vehicle ${vehicle.id} added to fleet`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Update vehicle status or location
  public updateVehicle(update: FleetUpdate): void {
    try {
      const vehicle = this.vehicles.get(update.vehicleId);
      if (!vehicle) {
        throw new FleetError(
          `Vehicle ${update.vehicleId} not found`,
          'VEHICLE_NOT_FOUND'
        );
      }

      if (update.location && !this.validateCoordinates(update.location)) {
        throw new FleetError(
          'Invalid update coordinates',
          'INVALID_COORDINATES'
        );
      }

      const updatedVehicle: Vehicle = {
        ...vehicle,
        status: update.status ?? vehicle.status,
        location: update.location ?? vehicle.location,
        lastUpdated: new Date()
      };

      this.vehicles.set(update.vehicleId, updatedVehicle);
      console.log(`Vehicle ${update.vehicleId} updated`);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Get vehicle information
  public getVehicle(vehicleId: string): Vehicle | undefined {
    try {
      const vehicle = this.vehicles.get(vehicleId);
      if (!vehicle) {
        throw new FleetError(
          `Vehicle ${vehicleId} not found`,
          'VEHICLE_NOT_FOUND'
        );
      }
      return vehicle;
    } catch (error) {
      this.handleError(error);
      return undefined;
    }
  }

  // Get all vehicles on a specific route
  public getVehiclesByRoute(route: string): Vehicle[] {
    const vehicles: Vehicle[] = [];
    this.vehicles.forEach((vehicle) => {
      if (vehicle.route === route) {
        vehicles.push(vehicle);
      }
    });
    return vehicles;
  }

  // Remove vehicle from fleet
  public removeVehicle(vehicleId: string): boolean {
    try {
      if (!this.vehicles.has(vehicleId)) {
        throw new FleetError(
          `Vehicle ${vehicleId} not found`,
          'VEHICLE_NOT_FOUND'
        );
      }
      this.vehicles.delete(vehicleId);
      console.log(`Vehicle ${vehicleId} removed from fleet`);
      return true;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  // Validate geographic coordinates
  private validateCoordinates(location: {
    latitude: number;
    longitude: number;
  }): boolean {
    return (
      location.latitude >= this.VALID_COORDINATES.latitude.min &&
      location.latitude <= this.VALID_COORDINATES.latitude.max &&
      location.longitude >= this.VALID_COORDINATES.longitude.min &&
      location.longitude <= this.VALID_COORDINATES.longitude.max
    );
  }

  // Centralized error handling
  private handleError(error: unknown): void {
    if (error instanceof FleetError) {
      console.error(`Fleet Error [${error.code}]: ${error.message}`);
    } else if (error instanceof Error) {
      console.error(`Unexpected Error: ${error.message}`);
    } else {
      console.error('Unknown error occurred');
    }
  }

  // Get fleet statistics
  public getFleetStats(): {
    totalVehicles: number;
    activeVehicles: number;
    inactiveVehicles: number;
    maintenanceVehicles: number;
  } {
    let active = 0;
    let inactive = 0;
    let maintenance = 0;

    this.vehicles.forEach((vehicle) => {
      if (vehicle.status === 'active') active++;
      else if (vehicle.status === 'inactive') inactive++;
      else if (vehicle.status === 'maintenance') maintenance++;
    });

    return {
      totalVehicles: this.vehicles.size,
      activeVehicles: active,
      inactiveVehicles: inactive,
      maintenanceVehicles: maintenance
    };
  }
}

// Example usage
function demoCTAFleetAgent() {
  const agent = new CTAFleetAgent36();

  // Add sample vehicles
  const vehicle1: Vehicle = {
    id: 'BUS_001',
    route: 'Route 66',
    status: 'active',
    location: { latitude: 41.8781, longitude: -87.6298 },
    lastUpdated: new Date()
  };

  const vehicle2: Vehicle = {
    id: 'BUS_002',
    route: 'Route 66',
    status: 'inactive',
    location: { latitude: 41.8782, longitude: -87.6299 },
    lastUpdated: new Date()
  };

  agent.addVehicle(vehicle1);
  agent.addVehicle(vehicle2);

  // Update vehicle status
  agent.updateVehicle({
    vehicleId: 'BUS_001',
    status: 'maintenance',
    location: { latitude: 41.8783, longitude: -87.6300 }
  });

  // Get vehicle info
  const vehicleInfo = agent.getVehicle('BUS_001');
  if (vehicleInfo) {
    console.log('Vehicle Info:', vehicleInfo);
  }

  // Get route vehicles
  const routeVehicles = agent.getVehiclesByRoute('Route 66');
  console.log('Route 66 Vehicles:', routeVehicles);

  // Get fleet statistics
  const stats = agent.getFleetStats();
  console.log('Fleet Statistics:', stats);

  // Remove vehicle
  agent.removeVehicle('BUS_002');
}

// Run the demo
demoCTAFleetAgent();
```

### Explanation of the Code

1. **Interfaces**: `Vehicle` and `FleetUpdate` define the structure of vehicle data and updates, ensuring type safety.
2. **Custom Error Class**: `FleetError` provides specific error handling for fleet operations with custom error codes.
3. **CTAFleetAgent36 Class**: The main class for managing the fleet with methods to:
   - Add, update, and remove vehicles.
   - Retrieve vehicle information and route-specific vehicles.
   - Validate geographic coordinates.
   - Track fleet statistics.
4. **Error Handling**: Centralized error handling with detailed logging.
5. **Demo Function**: A sample usage of the agent with test data to demonstrate functionality.

### Features
- **Type Safety**: Uses TypeScript interfaces for strict typing.
- **Error Handling**: Robust error handling with custom errors.
- **Validation**: Includes coordinate validation for realistic location data.
- **Statistics**: Provides fleet-wide statistics for monitoring.
- **Modularity**: Well-structured and easy to extend for additional features.

### How to Run
1. Save this code in a file named `ctaFleetAgent.ts`.
2. Ensure you have Node.js and TypeScript installed.
3. Compile the TypeScript code using `tsc ctaFleetAgent.ts`.
4. Run the compiled JavaScript with `node ctaFleetAgent.js`.

This code provides a solid foundation for a fleet management system and can be extended with additional features like real-time tracking, API integration, or database persistence as needed. Let me know if you need modifications or additional functionality!
