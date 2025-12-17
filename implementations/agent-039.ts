I'll provide a complete, working TypeScript code example for a CTAFleet Agent (assuming this refers to a fleet management system agent for Chicago Transit Authority or a similar context). Since the exact requirements for "CTAFleet Agent 39" are not specified, I'll create a comprehensive agent class that handles vehicle tracking, status updates, and basic fleet management functionality. This code will include interfaces, error handling, and modern TypeScript practices.

This implementation assumes the agent is responsible for managing vehicle data, tracking status, and communicating updates. If you have specific requirements or a different context, please clarify.

```typescript
// Enums for vehicle and agent status
enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

enum AgentStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR',
}

// Interfaces for data structures
interface Vehicle {
  id: string;
  name: string;
  status: VehicleStatus;
  location: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: Date;
  routeId?: string;
}

interface FleetUpdate {
  vehicleId: string;
  status?: VehicleStatus;
  location?: {
    latitude: number;
    longitude: number;
  };
  routeId?: string;
  timestamp: Date;
}

// Custom error class for agent-specific errors
class CTAFleetError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'CTAFleetError';
  }
}

/**
 * CTAFleetAgent class to manage fleet operations for agent ID 39
 */
class CTAFleetAgent {
  private readonly agentId: string = 'AGENT_39';
  private status: AgentStatus = AgentStatus.OFFLINE;
  private vehicles: Map<string, Vehicle> = new Map();
  private readonly maxVehicles: number = 100;
  private readonly apiEndpoint: string = 'https://api.ctafleet.example.com';

  constructor() {
    console.log(`CTAFleetAgent ${this.agentId} initialized`);
    this.initializeAgent();
  }

  /**
   * Initialize the agent and connect to fleet system
   */
  private async initializeAgent(): Promise<void> {
    try {
      this.status = AgentStatus.ONLINE;
      console.log(`Agent ${this.agentId} is now ${this.status}`);
      await this.fetchInitialFleetData();
    } catch (error) {
      this.status = AgentStatus.ERROR;
      throw new CTAFleetError(
        `Failed to initialize agent: ${error.message}`,
        'INIT_ERROR'
      );
    }
  }

  /**
   * Fetch initial fleet data from API (mock implementation)
   */
  private async fetchInitialFleetData(): Promise<void> {
    try {
      // Mock API call - in real implementation, this would be an actual HTTP request
      const mockVehicles: Vehicle[] = [
        {
          id: 'BUS_001',
          name: 'Bus 001',
          status: VehicleStatus.ACTIVE,
          location: { latitude: 41.8781, longitude: -87.6298 },
          lastUpdated: new Date(),
          routeId: 'ROUTE_66',
        },
        {
          id: 'BUS_002',
          name: 'Bus 002',
          status: VehicleStatus.MAINTENANCE,
          location: { latitude: 41.8851, longitude: -87.6398 },
          lastUpdated: new Date(),
        },
      ];

      mockVehicles.forEach((vehicle) => {
        this.vehicles.set(vehicle.id, vehicle);
      });
      console.log(`Loaded ${this.vehicles.size} vehicles into agent ${this.agentId}`);
    } catch (error) {
      throw new CTAFleetError('Failed to fetch initial fleet data', 'API_ERROR');
    }
  }

  /**
   * Get current status of the agent
   */
  public getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * Get all managed vehicles
   */
  public getVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values());
  }

  /**
   * Get specific vehicle by ID
   */
  public getVehicle(vehicleId: string): Vehicle | undefined {
    return this.vehicles.get(vehicleId);
  }

  /**
   * Update vehicle status and location
   */
  public async updateVehicle(update: FleetUpdate): Promise<void> {
    if (this.status !== AgentStatus.ONLINE) {
      throw new CTAFleetError(
        'Cannot update vehicle: Agent is not online',
        'AGENT_OFFLINE'
      );
    }

    const vehicle = this.vehicles.get(update.vehicleId);
    if (!vehicle) {
      throw new CTAFleetError(
        `Vehicle ${update.vehicleId} not found`,
        'VEHICLE_NOT_FOUND'
      );
    }

    try {
      // Update vehicle data
      if (update.status) vehicle.status = update.status;
      if (update.location) vehicle.location = update.location;
      if (update.routeId) vehicle.routeId = update.routeId;
      vehicle.lastUpdated = update.timestamp;

      this.vehicles.set(update.vehicleId, vehicle);
      await this.syncUpdateToServer(update);
      console.log(`Updated vehicle ${update.vehicleId} at ${update.timestamp}`);
    } catch (error) {
      throw new CTAFleetError(
        `Failed to update vehicle ${update.vehicleId}: ${error.message}`,
        'UPDATE_ERROR'
      );
    }
  }

  /**
   * Sync update to central server (mock implementation)
   */
  private async syncUpdateToServer(update: FleetUpdate): Promise<void> {
    // In a real implementation, this would make an API call to the server
    console.log(`Syncing update for vehicle ${update.vehicleId} to server`);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  /**
   * Add a new vehicle to the fleet
   */
  public addVehicle(vehicle: Vehicle): void {
    if (this.vehicles.size >= this.maxVehicles) {
      throw new CTAFleetError(
        'Cannot add vehicle: Maximum capacity reached',
        'CAPACITY_EXCEEDED'
      );
    }

    if (this.vehicles.has(vehicle.id)) {
      throw new CTAFleetError(
        `Vehicle ${vehicle.id} already exists`,
        'DUPLICATE_VEHICLE'
      );
    }

    this.vehicles.set(vehicle.id, vehicle);
    console.log(`Added vehicle ${vehicle.id} to fleet`);
  }

  /**
   * Remove a vehicle from the fleet
   */
  public removeVehicle(vehicleId: string): void {
    if (!this.vehicles.has(vehicleId)) {
      throw new CTAFleetError(
        `Vehicle ${vehicleId} not found`,
        'VEHICLE_NOT_FOUND'
      );
    }

    this.vehicles.delete(vehicleId);
    console.log(`Removed vehicle ${vehicleId} from fleet`);
  }

  /**
   * Shutdown the agent gracefully
   */
  public async shutdown(): Promise<void> {
    this.status = AgentStatus.OFFLINE;
    console.log(`Agent ${this.agentId} is now ${this.status}`);
    // In a real implementation, close connections and save state
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// Example usage
async function demoCTAFleetAgent() {
  try {
    const agent = new CTAFleetAgent();

    // Wait for initialization
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check agent status
    console.log('Agent Status:', agent.getStatus());

    // List all vehicles
    console.log('Current Fleet:', agent.getVehicles());

    // Update a vehicle
    const update: FleetUpdate = {
      vehicleId: 'BUS_001',
      status: VehicleStatus.ACTIVE,
      location: { latitude: 41.8881, longitude: -87.6198 },
      timestamp: new Date(),
    };
    await agent.updateVehicle(update);

    // Add a new vehicle
    const newVehicle: Vehicle = {
      id: 'BUS_003',
      name: 'Bus 003',
      status: VehicleStatus.INACTIVE,
      location: { latitude: 41.8751, longitude: -87.6498 },
      lastUpdated: new Date(),
    };
    agent.addVehicle(newVehicle);

    // Remove a vehicle
    agent.removeVehicle('BUS_002');

    // Final fleet status
    console.log('Updated Fleet:', agent.getVehicles());

    // Shutdown agent
    await agent.shutdown();
  } catch (error) {
    console.error('Demo Error:', error);
  }
}

// Run the demo
demoCTAFleetAgent();
```

### Explanation of the Code

1. **Enums and Interfaces**:
   - `VehicleStatus` and `AgentStatus` enums define possible states for vehicles and the agent.
   - `Vehicle` and `FleetUpdate` interfaces structure the data for vehicles and updates.

2. **CTAFleetError Class**:
   - A custom error class for handling agent-specific errors with error codes.

3. **CTAFleetAgent Class**:
   - Manages a fleet of vehicles with a unique agent ID (39).
   - Maintains a `Map` of vehicles for efficient lookup.
   - Provides methods for initialization, vehicle management, updates, and shutdown.
   - Includes mock API calls (e.g., `fetchInitialFleetData`, `syncUpdateToServer`) which can be replaced with real HTTP requests using libraries like `axios`.

4. **Key Features**:
   - Vehicle tracking with status and location updates.
   - Error handling for various scenarios (agent offline, vehicle not found, etc.).
   - Capacity limits for the number of vehicles.
   - Asynchronous operations for API calls and initialization.
   - Logging for debugging and monitoring.

5. **Demo Function**:
   - Demonstrates the usage of the agent with initialization, vehicle updates, additions, removals, and shutdown.

### How to Use
1. Copy this code into a TypeScript file (e.g., `ctafleet-agent.ts`).
2. Ensure you have Node.js and TypeScript installed (`npm install -g typescript`).
3. Compile the code using `tsc ctafleet-agent.ts`.
4. Run the compiled JavaScript file with `node ctafleet-agent.js`.

### Notes
- This is a standalone implementation with mock API calls. In a real application, replace the mock data and API calls with actual endpoints (e.g., using `axios` or `fetch`).
- Add environment variables for configuration (e.g., API endpoint, agent ID) using a library like `dotenv`.
- Implement proper authentication and security measures for API communication.
- Add unit tests using a framework like `Jest` for production readiness.

If you have specific requirements for "CTAFleet Agent 39" (e.g., specific APIs, protocols, or features), please provide them, and I can adjust the code accordingly.
