I'll provide a complete, working TypeScript code example for a CTAFleet Agent system. This code represents a fleet management agent (Agent 22) that could be used for tracking and managing vehicles in a fleet, such as for a transit authority like the Chicago Transit Authority (CTA). The code includes interfaces, classes, and basic functionality for vehicle tracking, status updates, and communication.

```typescript
// Interfaces for type safety
interface Vehicle {
  id: string;
  type: 'bus' | 'train' | 'maintenance';
  status: 'active' | 'inactive' | 'maintenance';
  location: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: Date;
}

interface AgentConfig {
  agentId: string;
  fleetSize: number;
  operationalArea: string;
}

// CTAFleet Agent Class for Agent 22
class CTAFleetAgent22 {
  private agentId: string;
  private fleet: Vehicle[] = [];
  private operationalArea: string;
  private isActive: boolean = false;
  private readonly MAX_FLEET_SIZE: number;

  constructor(config: AgentConfig) {
    this.agentId = config.agentId;
    this.operationalArea = config.operationalArea;
    this.MAX_FLEET_SIZE = config.fleetSize;
    console.log(`CTAFleet Agent ${this.agentId} initialized for ${this.operationalArea}`);
  }

  // Start the agent
  public start(): void {
    if (!this.isActive) {
      this.isActive = true;
      console.log(`Agent ${this.agentId} started successfully.`);
      this.initializeFleet();
    } else {
      console.log(`Agent ${this.agentId} is already running.`);
    }
  }

  // Stop the agent
  public stop(): void {
    if (this.isActive) {
      this.isActive = false;
      console.log(`Agent ${this.agentId} stopped.`);
    } else {
      console.log(`Agent ${this.agentId} is already stopped.`);
    }
  }

  // Initialize fleet with dummy data
  private initializeFleet(): void {
    if (this.fleet.length === 0) {
      for (let i = 0; i < this.MAX_FLEET_SIZE; i++) {
        const vehicle: Vehicle = {
          id: `V${this.agentId}-${i + 1}`,
          type: i % 2 === 0 ? 'bus' : 'train',
          status: 'active',
          location: {
            latitude: 41.8781 + (Math.random() * 0.1), // Random location near Chicago
            longitude: -87.6298 + (Math.random() * 0.1),
          },
          lastUpdated: new Date(),
        };
        this.fleet.push(vehicle);
      }
      console.log(`Fleet initialized with ${this.fleet.length} vehicles.`);
    }
  }

  // Update vehicle location
  public updateVehicleLocation(vehicleId: string, latitude: number, longitude: number): boolean {
    const vehicle = this.fleet.find((v) => v.id === vehicleId);
    if (vehicle) {
      vehicle.location = { latitude, longitude };
      vehicle.lastUpdated = new Date();
      console.log(`Updated location for vehicle ${vehicleId} to (${latitude}, ${longitude})`);
      return true;
    }
    console.error(`Vehicle ${vehicleId} not found.`);
    return false;
  }

  // Update vehicle status
  public updateVehicleStatus(vehicleId: string, status: Vehicle['status']): boolean {
    const vehicle = this.fleet.find((v) => v.id === vehicleId);
    if (vehicle) {
      vehicle.status = status;
      vehicle.lastUpdated = new Date();
      console.log(`Updated status for vehicle ${vehicleId} to ${status}`);
      return true;
    }
    console.error(`Vehicle ${vehicleId} not found.`);
    return false;
  }

  // Get fleet status report
  public getFleetStatus(): string {
    if (!this.isActive) {
      return `Agent ${this.agentId} is not active.`;
    }

    const activeCount = this.fleet.filter((v) => v.status === 'active').length;
    const inactiveCount = this.fleet.filter((v) => v.status === 'inactive').length;
    const maintenanceCount = this.fleet.filter((v) => v.status === 'maintenance').length;

    return `
      Fleet Status Report for Agent ${this.agentId}:
      Total Vehicles: ${this.fleet.length}
      Active: ${activeCount}
      Inactive: ${inactiveCount}
      Maintenance: ${maintenanceCount}
      Operational Area: ${this.operationalArea}
    `;
  }

  // Get specific vehicle details
  public getVehicleDetails(vehicleId: string): Vehicle | null {
    const vehicle = this.fleet.find((v) => v.id === vehicleId);
    return vehicle || null;
  }

  // Simulate periodic status check (async example)
  public async runPeriodicCheck(intervalMs: number): Promise<void> {
    if (!this.isActive) {
      throw new Error(`Agent ${this.agentId} is not active.`);
    }

    console.log(`Starting periodic check every ${intervalMs}ms...`);
    setInterval(() => {
      console.log(this.getFleetStatus());
      // Simulate random status update for a vehicle
      const randomVehicle = this.fleet[Math.floor(Math.random() * this.fleet.length)];
      if (randomVehicle) {
        const statuses: Vehicle['status'][] = ['active', 'inactive', 'maintenance'];
        const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
        this.updateVehicleStatus(randomVehicle.id, newStatus);
      }
    }, intervalMs);
  }
}

// Usage Example
async function main() {
  // Configure Agent 22
  const agentConfig: AgentConfig = {
    agentId: '22',
    fleetSize: 10,
    operationalArea: 'Downtown Chicago',
  };

  // Create instance of CTAFleetAgent22
  const agent22 = new CTAFleetAgent22(agentConfig);

  // Start the agent
  agent22.start();

  // Get initial fleet status
  console.log(agent22.getFleetStatus());

  // Update a specific vehicle
  agent22.updateVehicleLocation('V22-1', 41.8800, -87.6300);
  agent22.updateVehicleStatus('V22-1', 'maintenance');

  // Get details of a specific vehicle
  const vehicleDetails = agent22.getVehicleDetails('V22-1');
  if (vehicleDetails) {
    console.log('Vehicle Details:', vehicleDetails);
  }

  // Run periodic status check (every 5 seconds)
  await agent22.runPeriodicCheck(5000);

  // Note: The periodic check will keep running due to setInterval
  // In a real application, you'd want to handle stopping this gracefully
}

// Run the example
main().catch((error) => {
  console.error('Error in main:', error);
});
```

### Explanation of the Code

1. **Interfaces**:
   - `Vehicle`: Defines the structure for a vehicle in the fleet, including ID, type, status, location, and last updated timestamp.
   - `AgentConfig`: Defines the configuration structure for initializing the agent.

2. **CTAFleetAgent22 Class**:
   - Manages a fleet of vehicles for Agent 22.
   - Includes methods to start/stop the agent, update vehicle locations and statuses, get fleet status reports, and run periodic checks.
   - Maintains a private fleet array and operational status.

3. **Key Features**:
   - **Initialization**: Creates a fleet of vehicles with dummy data for demonstration.
   - **Status Updates**: Allows updating vehicle locations and statuses with validation.
   - **Reporting**: Provides detailed fleet status reports and individual vehicle details.
   - **Periodic Checks**: Simulates ongoing monitoring with asynchronous periodic status updates.

4. **Usage Example**:
   - The `main()` function demonstrates how to create an instance of the agent, start it, perform updates, and run periodic checks.
   - The agent is configured for "Downtown Chicago" with a fleet size of 10 vehicles.

### How to Run
1. Ensure you have Node.js and TypeScript installed.
2. Save this code in a file named `CTAFleetAgent22.ts`.
3. Compile the TypeScript code using:
   ```bash
   tsc CTAFleetAgent22.ts
   ```
4. Run the compiled JavaScript using:
   ```bash
   node CTAFleetAgent22.js
   ```

### Output
When you run the code, you'll see logs showing:
- Agent initialization and start.
- Fleet status reports.
- Vehicle updates.
- Periodic status checks every 5 seconds with random status updates for vehicles.

This code is a fully functional starting point for a fleet management agent system. You can extend it by adding:
- Real-time location tracking via APIs.
- Database integration for persistence.
- More sophisticated status monitoring logic.
- Error handling and recovery mechanisms.
- Communication with other agents or central systems.

Let me know if you'd like to add specific features or modify the code for a different use case!
