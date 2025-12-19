I'll provide a complete, working TypeScript code example for a CTAFleet Agent. This code assumes a fleet management system for tracking vehicles or agents in a transit authority context (like Chicago Transit Authority). The code includes interfaces, classes, and basic functionality for managing fleet agents.

```typescript
// Interfaces for type safety
interface ILocation {
    latitude: number;
    longitude: number;
    timestamp: Date;
}

interface IAgentStatus {
    isActive: boolean;
    lastUpdated: Date;
    batteryLevel: number; // Percentage (0-100)
    currentSpeed: number; // in mph
}

interface IVehicleInfo {
    id: string;
    type: string; // e.g., "Bus", "Train", "Maintenance Vehicle"
    route: string;
    capacity: number;
}

// Main CTAFleetAgent class
class CTAFleetAgent {
    private agentId: string;
    private vehicleInfo: IVehicleInfo;
    private status: IAgentStatus;
    private location: ILocation;
    private maintenanceLog: string[];

    constructor(agentId: string, vehicleType: string, route: string, capacity: number) {
        this.agentId = agentId;
        this.vehicleInfo = {
            id: agentId,
            type: vehicleType,
            route: route,
            capacity: capacity
        };
        this.status = {
            isActive: false,
            lastUpdated: new Date(),
            batteryLevel: 100,
            currentSpeed: 0
        };
        this.location = {
            latitude: 0,
            longitude: 0,
            timestamp: new Date()
        };
        this.maintenanceLog = [];
    }

    // Getters
    public getAgentId(): string {
        return this.agentId;
    }

    public getVehicleInfo(): IVehicleInfo {
        return { ...this.vehicleInfo };
    }

    public getStatus(): IAgentStatus {
        return { ...this.status };
    }

    public getLocation(): ILocation {
        return { ...this.location };
    }

    // Update Methods
    public updateLocation(latitude: number, longitude: number): void {
        this.location = {
            latitude,
            longitude,
            timestamp: new Date()
        };
        this.status.lastUpdated = new Date();
    }

    public updateStatus(isActive: boolean, batteryLevel: number, currentSpeed: number): void {
        this.status = {
            isActive,
            batteryLevel: Math.max(0, Math.min(100, batteryLevel)), // Ensure battery level is between 0-100
            currentSpeed: Math.max(0, currentSpeed), // Ensure speed is non-negative
            lastUpdated: new Date()
        };
    }

    public updateRoute(newRoute: string): void {
        this.vehicleInfo.route = newRoute;
        this.status.lastUpdated = new Date();
    }

    // Maintenance Methods
    public addMaintenanceRecord(record: string): void {
        this.maintenanceLog.push(`${new Date().toISOString()}: ${record}`);
    }

    public getMaintenanceHistory(): string[] {
        return [...this.maintenanceLog];
    }

    // Utility Methods
    public calculateDistanceTo(destination: ILocation): number {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (this.location.latitude * Math.PI) / 180;
        const φ2 = (destination.latitude * Math.PI) / 180;
        const Δφ = ((destination.latitude - this.location.latitude) * Math.PI) / 180;
        const Δλ = ((destination.longitude - this.location.longitude) * Math.PI) / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c) / 1609.34; // Convert to miles
    }

    public toString(): string {
        return `CTAFleetAgent ${this.agentId} (${this.vehicleInfo.type})
        Route: ${this.vehicleInfo.route}
        Status: ${this.status.isActive ? 'Active' : 'Inactive'}
        Location: (${this.location.latitude}, ${this.location.longitude})
        Speed: ${this.status.currentSpeed} mph
        Battery: ${this.status.batteryLevel}%
        Last Updated: ${this.status.lastUpdated.toISOString()}`;
    }
}

// Fleet Manager class to handle multiple agents
class CTAFleetManager {
    private agents: Map<string, CTAFleetAgent>;

    constructor() {
        this.agents = new Map();
    }

    public addAgent(agent: CTAFleetAgent): void {
        this.agents.set(agent.getAgentId(), agent);
    }

    public removeAgent(agentId: string): boolean {
        return this.agents.delete(agentId);
    }

    public getAgent(agentId: string): CTAFleetAgent | undefined {
        return this.agents.get(agentId);
    }

    public getAllAgents(): CTAFleetAgent[] {
        return Array.from(this.agents.values());
    }

    public getActiveAgents(): CTAFleetAgent[] {
        return Array.from(this.agents.values()).filter(agent => agent.getStatus().isActive);
    }
}

// Example usage
function demoCTAFleetSystem(): void {
    // Create a fleet manager
    const fleetManager = new CTAFleetManager();

    // Create some agents (vehicles)
    const bus1 = new CTAFleetAgent("BUS-001", "Bus", "Route 66", 40);
    const bus2 = new CTAFleetAgent("BUS-002", "Bus", "Route 22", 40);

    // Add agents to fleet
    fleetManager.addAgent(bus1);
    fleetManager.addAgent(bus2);

    // Update status and location for bus1
    bus1.updateLocation(41.8781, -87.6298); // Chicago coordinates
    bus1.updateStatus(true, 85, 25);
    bus1.addMaintenanceRecord("Oil change completed");

    // Update status and location for bus2
    bus2.updateLocation(41.8881, -87.6398);
    bus2.updateStatus(true, 92, 30);

    // Print fleet status
    console.log("Fleet Status:");
    fleetManager.getAllAgents().forEach(agent => {
        console.log(agent.toString());
        console.log("------------------------");
    });

    // Calculate distance between two buses
    const distance = bus1.calculateDistanceTo(bus2.getLocation());
    console.log(`Distance between BUS-001 and BUS-002: ${distance.toFixed(2)} miles`);
}

// Run the demo
demoCTAFleetSystem();

// Export for module usage
export { CTAFleetAgent, CTAFleetManager, ILocation, IAgentStatus, IVehicleInfo };
```

### Explanation of the Code

1. **Interfaces**: 
   - `ILocation`: Defines the structure for location data (latitude, longitude, timestamp).
   - `IAgentStatus`: Defines the status of an agent (active/inactive, battery level, speed).
   - `IVehicleInfo`: Defines vehicle-specific information (ID, type, route, capacity).

2. **CTAFleetAgent Class**:
   - Represents a single fleet agent (vehicle) with properties for ID, vehicle info, status, location, and maintenance logs.
   - Includes methods for updating location, status, and route, as well as calculating distances and logging maintenance.
   - Uses getters to provide read-only access to internal state.
   - Includes a `toString()` method for easy debugging and logging.

3. **CTAFleetManager Class**:
   - Manages a collection of `CTAFleetAgent` instances using a `Map` for efficient lookup.
   - Provides methods to add/remove agents and retrieve agents by ID or status.

4. **Demo Function**:
   - `demoCTAFleetSystem()` demonstrates the usage of the classes by creating a fleet, adding agents, updating their status, and calculating distances.
   - Outputs the fleet status to the console for verification.

5. **Features**:
   - Type safety with TypeScript interfaces.
   - Encapsulation of data with private properties and public methods.
   - Basic geolocation distance calculation using the Haversine formula.
   - Maintenance logging system.
   - Fleet management capabilities.

### How to Use
1. Save this code in a file named `CTAFleetAgent.ts`.
2. Compile it using the TypeScript compiler: `tsc CTAFleetAgent.ts`.
3. Run the resulting JavaScript file with Node.js: `node CTAFleetAgent.js`.
4. Alternatively, import and use it in a larger TypeScript project by importing the exported classes and interfaces.

### Output
When you run the demo, you'll see output similar to this:
```
Fleet Status:
CTAFleetAgent BUS-001 (Bus)
        Route: Route 66
        Status: Active
        Location: (41.8781, -87.6298)
        Speed: 25 mph
        Battery: 85%
        Last Updated: [timestamp]
------------------------
CTAFleetAgent BUS-002 (Bus)
        Route: Route 22
        Status: Active
        Location: (41.8881, -87.6398)
        Speed: 30 mph
        Battery: 92%
        Last Updated: [timestamp]
------------------------
Distance between BUS-001 and BUS-002: 0.84 miles
```

This code provides a solid foundation for a fleet management system and can be extended with additional features like real-time tracking, API integration, or more complex routing algorithms as needed. Let me know if you need modifications or additional functionality!
