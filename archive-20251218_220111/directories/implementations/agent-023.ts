I'll provide a complete, working TypeScript code example for a CTAFleet Agent system. This code represents a fleet management agent (Agent 23) that could be used for tracking and managing vehicles in a transit system like the Chicago Transit Authority (CTA). The code includes interfaces, classes, error handling, and basic functionality for vehicle tracking and status reporting.

```typescript
// Interfaces for type safety
interface Vehicle {
  id: string;
  type: 'bus' | 'train';
  route: string;
  status: 'active' | 'inactive' | 'maintenance';
  location: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: Date;
}

interface FleetStatus {
  totalVehicles: number;
  activeVehicles: number;
  inactiveVehicles: number;
  maintenanceVehicles: number;
  timestamp: Date;
}

// Custom error class for fleet management errors
class FleetError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FleetError';
  }
}

// Main CTAFleet Agent class
class CTAFleetAgent23 {
  private vehicles: Map<string, Vehicle> = new Map();
  private agentId: string = 'AGENT_23';
  private isRunning: boolean = false;
  private readonly UPDATE_INTERVAL_MS: number = 5000; // 5 seconds

  constructor() {
    console.log(`CTAFleet Agent ${this.agentId} initialized`);
  }

  // Start the agent monitoring system
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new FleetError('Agent is already running', 'AGENT_ALREADY_RUNNING');
    }

    this.isRunning = true;
    console.log(`CTAFleet Agent ${this.agentId} started`);

    // Start periodic status updates
    this.startPeriodicUpdates();
  }

  // Stop the agent monitoring system
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      throw new FleetError('Agent is not running', 'AGENT_NOT_RUNNING');
    }

    this.isRunning = false;
    console.log(`CTAFleet Agent ${this.agentId} stopped`);
  }

  // Add or update a vehicle in the fleet
  public addVehicle(vehicle: Vehicle): void {
    if (!this.isRunning) {
      throw new FleetError('Cannot add vehicle: Agent is not running', 'AGENT_NOT_RUNNING');
    }

    this.vehicles.set(vehicle.id, {
      ...vehicle,
      lastUpdated: new Date()
    });
    console.log(`Vehicle ${vehicle.id} added/updated on route ${vehicle.route}`);
  }

  // Remove a vehicle from the fleet
  public removeVehicle(vehicleId: string): void {
    if (!this.isRunning) {
      throw new FleetError('Cannot remove vehicle: Agent is not running', 'AGENT_NOT_RUNNING');
    }

    if (!this.vehicles.has(vehicleId)) {
      throw new FleetError(`Vehicle ${vehicleId} not found`, 'VEHICLE_NOT_FOUND');
    }

    this.vehicles.delete(vehicleId);
    console.log(`Vehicle ${vehicleId} removed from fleet`);
  }

  // Get current fleet status
  public getFleetStatus(): FleetStatus {
    let active = 0;
    let inactive = 0;
    let maintenance = 0;

    for (const vehicle of this.vehicles.values()) {
      switch (vehicle.status) {
        case 'active':
          active++;
          break;
        case 'inactive':
          inactive++;
          break;
        case 'maintenance':
          maintenance++;
          break;
      }
    }

    return {
      totalVehicles: this.vehicles.size,
      activeVehicles: active,
      inactiveVehicles: inactive,
      maintenanceVehicles: maintenance,
      timestamp: new Date()
    };
  }

  // Update vehicle location
  public updateVehicleLocation(vehicleId: string, latitude: number, longitude: number): void {
    if (!this.isRunning) {
      throw new FleetError('Cannot update location: Agent is not running', 'AGENT_NOT_RUNNING');
    }

    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle) {
      throw new FleetError(`Vehicle ${vehicleId} not found`, 'VEHICLE_NOT_FOUND');
    }

    vehicle.location = { latitude, longitude };
    vehicle.lastUpdated = new Date();
    this.vehicles.set(vehicleId, vehicle);
    console.log(`Updated location for vehicle ${vehicleId}: (${latitude}, ${longitude})`);
  }

  // Private method for periodic status updates
  private startPeriodicUpdates(): void {
    setInterval(() => {
      if (!this.isRunning) return;

      const status = this.getFleetStatus();
      console.log(`Fleet Status Update - Total: ${status.totalVehicles}, Active: ${status.activeVehicles}, Inactive: ${status.inactiveVehicles}, Maintenance: ${status.maintenanceVehicles}`);
    }, this.UPDATE_INTERVAL_MS);
  }
}

// Example usage with error handling
async function demoCTAFleetAgent() {
  const agent = new CTAFleetAgent23();

  try {
    // Start the agent
    await agent.start();

    // Add some sample vehicles
    agent.addVehicle({
      id: 'BUS_101',
      type: 'bus',
      route: 'Route 66',
      status: 'active',
      location: { latitude: 41.8781, longitude: -87.6298 },
      lastUpdated: new Date()
    });

    agent.addVehicle({
      id: 'TRAIN_202',
      type: 'train',
      route: 'Red Line',
      status: 'maintenance',
      location: { latitude: 41.8857, longitude: -87.6225 },
      lastUpdated: new Date()
    });

    // Update vehicle location
    agent.updateVehicleLocation('BUS_101', 41.8800, -87.6300);

    // Get initial fleet status
    const status = agent.getFleetStatus();
    console.log('Initial Fleet Status:', status);

    // Wait for a few seconds to see periodic updates
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Stop the agent
    await agent.stop();

  } catch (error) {
    if (error instanceof FleetError) {
      console.error(`Fleet Error [${error.code}]: ${error.message}`);
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Run the demo
demoCTAFleetAgent();
```

### Explanation of the Code

1. **Interfaces**: 
   - `Vehicle` defines the structure for vehicle data including ID, type, route, status, location, and last update timestamp.
   - `FleetStatus` defines the structure for fleet summary statistics.

2. **Custom Error Class**: 
   - `FleetError` extends the built-in `Error` class to provide specific error handling for fleet management operations with custom error codes.

3. **CTAFleetAgent23 Class**: 
   - Manages a fleet of vehicles using a `Map` for efficient storage and retrieval.
   - Provides methods to start/stop the agent, add/remove vehicles, update vehicle locations, and get fleet status.
   - Includes periodic status updates using `setInterval` to simulate real-time monitoring.
   - Implements error handling for various scenarios (e.g., agent not running, vehicle not found).

4. **Demo Function**: 
   - `demoCTAFleetAgent` demonstrates the usage of the agent by starting it, adding vehicles, updating locations, and stopping it.
   - Includes proper error handling using try-catch blocks.

5. **Features**:
   - Real-time fleet status updates every 5 seconds.
   - Location tracking for vehicles.
   - Status categorization (active, inactive, maintenance).
   - Type safety with TypeScript interfaces.

### How to Run
1. Save this code in a file named `CTAFleetAgent23.ts`.
2. Ensure you have Node.js and TypeScript installed.
3. Compile the TypeScript code using:
   ```bash
   tsc CTAFleetAgent23.ts
   ```
4. Run the compiled JavaScript code using:
   ```bash
   node CTAFleetAgent23.js
   ```

### Output
When you run the code, you'll see logs showing:
- Agent initialization and start/stop events.
- Vehicle additions and location updates.
- Periodic fleet status updates every 5 seconds.
- Any errors that occur during operation.

This code provides a foundation for a fleet management system and can be extended with additional features like API integration, database storage, or more complex vehicle tracking algorithms. Let me know if you'd like to add specific functionality or modify the code for a different use case!
