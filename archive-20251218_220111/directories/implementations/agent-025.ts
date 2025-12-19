I'll provide a complete, working TypeScript code example for a CTA (Chicago Transit Authority) Fleet Agent system. This code will simulate a fleet management agent for tracking buses or trains, including vehicle status, location, and basic operations.

```typescript
// CTAFleetAgent.ts

// Enums for vehicle status and type
enum VehicleStatus {
  IN_SERVICE = 'IN_SERVICE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  MAINTENANCE = 'MAINTENANCE',
}

enum VehicleType {
  BUS = 'BUS',
  TRAIN = 'TRAIN',
}

// Interface for location coordinates
interface Location {
  latitude: number;
  longitude: number;
  timestamp: Date;
}

// Interface for vehicle data
interface Vehicle {
  id: string;
  type: VehicleType;
  status: VehicleStatus;
  route: string;
  currentLocation: Location;
  lastMaintenance: Date;
  capacity: number;
  currentPassengers: number;
}

// Main CTA Fleet Agent class
class CTAFleetAgent {
  private vehicles: Map<string, Vehicle> = new Map();
  private readonly MAX_PASSENGERS_WARNING: number = 0.9; // 90% capacity warning
  private readonly MAINTENANCE_INTERVAL_DAYS: number = 30;

  constructor() {
    console.log('CTA Fleet Agent initialized');
  }

  // Add a new vehicle to the fleet
  public addVehicle(vehicle: Vehicle): void {
    this.vehicles.set(vehicle.id, vehicle);
    console.log(`Vehicle ${vehicle.id} (${vehicle.type}) added to fleet`);
  }

  // Remove a vehicle from the fleet
  public removeVehicle(vehicleId: string): boolean {
    if (this.vehicles.has(vehicleId)) {
      this.vehicles.delete(vehicleId);
      console.log(`Vehicle ${vehicleId} removed from fleet`);
      return true;
    }
    return false;
  }

  // Update vehicle location
  public updateVehicleLocation(vehicleId: string, latitude: number, longitude: number): boolean {
    const vehicle = this.vehicles.get(vehicleId);
    if (vehicle) {
      vehicle.currentLocation = {
        latitude,
        longitude,
        timestamp: new Date(),
      };
      console.log(`Updated location for vehicle ${vehicleId}: (${latitude}, ${longitude})`);
      return true;
    }
    return false;
  }

  // Update vehicle status
  public updateVehicleStatus(vehicleId: string, status: VehicleStatus): boolean {
    const vehicle = this.vehicles.get(vehicleId);
    if (vehicle) {
      vehicle.status = status;
      console.log(`Updated status for vehicle ${vehicleId} to ${status}`);
      return true;
    }
    return false;
  }

  // Update passenger count
  public updatePassengerCount(vehicleId: string, count: number): boolean {
    const vehicle = this.vehicles.get(vehicleId);
    if (vehicle) {
      if (count >= 0 && count <= vehicle.capacity) {
        vehicle.currentPassengers = count;
        console.log(`Updated passenger count for vehicle ${vehicleId} to ${count}`);
        this.checkCapacityWarning(vehicle);
        return true;
      }
    }
    return false;
  }

  // Check if vehicle is due for maintenance
  public checkMaintenanceDue(vehicleId: string): boolean {
    const vehicle = this.vehicles.get(vehicleId);
    if (vehicle) {
      const daysSinceMaintenance = Math.floor(
        (new Date().getTime() - vehicle.lastMaintenance.getTime()) / (1000 * 3600 * 24)
      );
      const isDue = daysSinceMaintenance >= this.MAINTENANCE_INTERVAL_DAYS;
      if (isDue) {
        console.log(`Vehicle ${vehicleId} is due for maintenance (${daysSinceMaintenance} days since last)`);
      }
      return isDue;
    }
    return false;
  }

  // Get vehicle details
  public getVehicleDetails(vehicleId: string): Vehicle | undefined {
    return this.vehicles.get(vehicleId);
  }

  // Get all vehicles on a specific route
  public getVehiclesByRoute(route: string): Vehicle[] {
    const routeVehicles: Vehicle[] = [];
    this.vehicles.forEach((vehicle) => {
      if (vehicle.route === route) {
        routeVehicles.push(vehicle);
      }
    });
    return routeVehicles;
  }

  // Get all vehicles by status
  public getVehiclesByStatus(status: VehicleStatus): Vehicle[] {
    const statusVehicles: Vehicle[] = [];
    this.vehicles.forEach((vehicle) => {
      if (vehicle.status === status) {
        statusVehicles.push(vehicle);
      }
    });
    return statusVehicles;
  }

  // Private method to check capacity warning
  private checkCapacityWarning(vehicle: Vehicle): void {
    const occupancyRate = vehicle.currentPassengers / vehicle.capacity;
    if (occupancyRate >= this.MAX_PASSENGERS_WARNING) {
      console.warn(
        `Vehicle ${vehicle.id} nearing capacity: ${vehicle.currentPassengers}/${vehicle.capacity} (${(occupancyRate * 100).toFixed(1)}%)`
      );
    }
  }
}

// Example usage
function demoCTAFleetAgent() {
  const fleetAgent = new CTAFleetAgent();

  // Create sample vehicles
  const bus1: Vehicle = {
    id: 'BUS-001',
    type: VehicleType.BUS,
    status: VehicleStatus.IN_SERVICE,
    route: 'Route 66',
    currentLocation: { latitude: 41.8781, longitude: -87.6298, timestamp: new Date() },
    lastMaintenance: new Date('2023-09-01'),
    capacity: 50,
    currentPassengers: 30,
  };

  const train1: Vehicle = {
    id: 'TRAIN-001',
    type: VehicleType.TRAIN,
    status: VehicleStatus.IN_SERVICE,
    route: 'Red Line',
    currentLocation: { latitude: 41.8857, longitude: -87.6225, timestamp: new Date() },
    lastMaintenance: new Date('2023-08-01'),
    capacity: 200,
    currentPassengers: 180,
  };

  // Add vehicles to fleet
  fleetAgent.addVehicle(bus1);
  fleetAgent.addVehicle(train1);

  // Update location
  fleetAgent.updateVehicleLocation('BUS-001', 41.8800, -87.6300);

  // Update passenger count
  fleetAgent.updatePassengerCount('BUS-001', 45);
  fleetAgent.updatePassengerCount('TRAIN-001', 190);

  // Check maintenance status
  fleetAgent.checkMaintenanceDue('BUS-001');
  fleetAgent.checkMaintenanceDue('TRAIN-001');

  // Get vehicles by route
  console.log('Vehicles on Route 66:', fleetAgent.getVehiclesByRoute('Route 66'));

  // Get vehicles by status
  console.log('Vehicles in service:', fleetAgent.getVehiclesByStatus(VehicleStatus.IN_SERVICE));
}

// Run the demo
demoCTAFleetAgent();
```

### Explanation of the Code

1. **Enums and Interfaces**:
   - `VehicleStatus` and `VehicleType` enums define possible states and types of vehicles.
   - `Location` interface defines the structure for GPS coordinates and timestamp.
   - `Vehicle` interface defines the structure for vehicle data.

2. **CTAFleetAgent Class**:
   - Manages a fleet of vehicles using a `Map` for efficient lookup.
   - Provides methods for adding/removing vehicles, updating location, status, and passenger count.
   - Includes maintenance checking based on a 30-day interval.
   - Offers capacity warning when a vehicle reaches 90% of its passenger capacity.
   - Provides methods to filter vehicles by route or status.

3. **Demo Function**:
   - Creates sample bus and train data.
   - Demonstrates various operations like updating location, passenger count, and checking maintenance status.
   - Shows how to retrieve vehicles based on route or status.

### How to Run
1. Save this code in a file named `CTAFleetAgent.ts`.
2. Ensure you have Node.js and TypeScript installed.
3. Compile the TypeScript code to JavaScript using:
   ```bash
   tsc CTAFleetAgent.ts
   ```
4. Run the compiled JavaScript file using:
   ```bash
   node CTAFleetAgent.js
   ```

### Output
When you run the code, you'll see console logs showing:
- Vehicle additions to the fleet.
- Location and passenger count updates.
- Capacity warnings for vehicles nearing full capacity.
- Maintenance due notifications.
- Lists of vehicles filtered by route or status.

This code is a fully functional starting point for a CTA fleet management system and can be extended with additional features like real-time tracking, API integration, or database storage as needed.
