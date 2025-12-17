I'll provide a complete, working TypeScript code example for a CTAFleet Agent system. This code represents a fleet management agent (Agent 34) that could be used for tracking and managing vehicles in a transit system like the Chicago Transit Authority (CTA). The code includes interfaces, classes, error handling, and basic functionality for vehicle tracking and status reporting.

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

interface FleetReport {
    agentId: string;
    timestamp: Date;
    totalVehicles: number;
    activeVehicles: number;
    inactiveVehicles: number;
    maintenanceVehicles: number;
}

// Custom error class for fleet management errors
class FleetError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = 'FleetError';
    }
}

// Main CTAFleet Agent class
class CTAFleetAgent34 {
    private readonly agentId: string = 'AGENT_34';
    private vehicles: Map<string, Vehicle> = new Map();
    private readonly MAX_VEHICLES: number = 100;

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

            this.vehicles.set(vehicle.id, vehicle);
            console.log(`Vehicle ${vehicle.id} added to fleet`);
        } catch (error) {
            if (error instanceof FleetError) {
                console.error(`Fleet Error [${error.code}]: ${error.message}`);
            } else {
                console.error('Unexpected error:', error);
            }
            throw error;
        }
    }

    // Update vehicle location
    public updateVehicleLocation(
        vehicleId: string,
        latitude: number,
        longitude: number
    ): void {
        try {
            const vehicle = this.vehicles.get(vehicleId);
            if (!vehicle) {
                throw new FleetError(
                    `Vehicle ${vehicleId} not found`,
                    'VEHICLE_NOT_FOUND'
                );
            }

            vehicle.location = { latitude, longitude };
            vehicle.lastUpdated = new Date();
            console.log(`Updated location for vehicle ${vehicleId}`);
        } catch (error) {
            if (error instanceof FleetError) {
                console.error(`Fleet Error [${error.code}]: ${error.message}`);
            } else {
                console.error('Unexpected error:', error);
            }
            throw error;
        }
    }

    // Update vehicle status
    public updateVehicleStatus(
        vehicleId: string,
        status: 'active' | 'inactive' | 'maintenance'
    ): void {
        try {
            const vehicle = this.vehicles.get(vehicleId);
            if (!vehicle) {
                throw new FleetError(
                    `Vehicle ${vehicleId} not found`,
                    'VEHICLE_NOT_FOUND'
                );
            }

            vehicle.status = status;
            vehicle.lastUpdated = new Date();
            console.log(`Updated status for vehicle ${vehicleId} to ${status}`);
        } catch (error) {
            if (error instanceof FleetError) {
                console.error(`Fleet Error [${error.code}]: ${error.message}`);
            } else {
                console.error('Unexpected error:', error);
            }
            throw error;
        }
    }

    // Generate fleet status report
    public generateFleetReport(): FleetReport {
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
            agentId: this.agentId,
            timestamp: new Date(),
            totalVehicles: this.vehicles.size,
            activeVehicles: active,
            inactiveVehicles: inactive,
            maintenanceVehicles: maintenance,
        };
    }

    // Get vehicle details
    public getVehicle(vehicleId: string): Vehicle | undefined {
        return this.vehicles.get(vehicleId);
    }

    // Get all vehicles
    public getAllVehicles(): Vehicle[] {
        return Array.from(this.vehicles.values());
    }
}

// Example usage
function demoCTAFleetAgent() {
    const agent = new CTAFleetAgent34();

    // Add sample vehicles
    try {
        agent.addVehicle({
            id: 'BUS_001',
            route: 'Route 66',
            status: 'active',
            location: { latitude: 41.8781, longitude: -87.6298 },
            lastUpdated: new Date(),
        });

        agent.addVehicle({
            id: 'BUS_002',
            route: 'Route 22',
            status: 'inactive',
            location: { latitude: 41.8955, longitude: -87.6226 },
            lastUpdated: new Date(),
        });

        // Update vehicle location and status
        agent.updateVehicleLocation('BUS_001', 41.8800, -87.6300);
        agent.updateVehicleStatus('BUS_002', 'maintenance');

        // Generate and display fleet report
        const report = agent.generateFleetReport();
        console.log('\nFleet Status Report:');
        console.log(`Agent ID: ${report.agentId}`);
        console.log(`Timestamp: ${report.timestamp}`);
        console.log(`Total Vehicles: ${report.totalVehicles}`);
        console.log(`Active Vehicles: ${report.activeVehicles}`);
        console.log(`Inactive Vehicles: ${report.inactiveVehicles}`);
        console.log(`Maintenance Vehicles: ${report.maintenanceVehicles}`);

        // Display all vehicles
        console.log('\nAll Vehicles:');
        agent.getAllVehicles().forEach((vehicle) => {
            console.log(`Vehicle ${vehicle.id}: ${vehicle.status} on ${vehicle.route}`);
            console.log(`Location: (${vehicle.location.latitude}, ${vehicle.location.longitude})`);
        });
    } catch (error) {
        console.error('Demo failed:', error);
    }
}

// Run the demo
demoCTAFleetAgent();
```

### Explanation of the Code

1. **Interfaces**:
   - `Vehicle`: Defines the structure for vehicle data including ID, route, status, location, and last updated timestamp.
   - `FleetReport`: Defines the structure for fleet status reports.

2. **Custom Error Class**:
   - `FleetError`: A custom error class for handling fleet-specific errors with error codes.

3. **CTAFleetAgent34 Class**:
   - Manages a fleet of vehicles using a `Map` for efficient lookups.
   - Includes methods for adding vehicles, updating locations and statuses, generating reports, and retrieving vehicle information.
   - Implements error handling for common scenarios like duplicate vehicles or capacity limits.

4. **Key Features**:
   - Vehicle management (add, update location/status).
   - Fleet reporting with status breakdowns.
   - Error handling for invalid operations.
   - Type safety with TypeScript interfaces.

5. **Demo Function**:
   - `demoCTAFleetAgent()`: Demonstrates the usage of the agent by adding vehicles, updating their data, and generating a fleet report.

### How to Run
1. Save this code in a file named `CTAFleetAgent34.ts`.
2. Ensure you have Node.js and TypeScript installed.
3. Compile the TypeScript code to JavaScript using:
   ```bash
   tsc CTAFleetAgent34.ts
   ```
4. Run the compiled JavaScript file using:
   ```bash
   node CTAFleetAgent34.js
   ```

### Output
When you run the code, you'll see output similar to this:
```
CTAFleet Agent AGENT_34 initialized
Vehicle BUS_001 added to fleet
Vehicle BUS_002 added to fleet
Updated location for vehicle BUS_001
Updated status for vehicle BUS_002 to maintenance

Fleet Status Report:
Agent ID: AGENT_34
Timestamp: [current timestamp]
Total Vehicles: 2
Active Vehicles: 1
Inactive Vehicles: 0
Maintenance Vehicles: 1

All Vehicles:
Vehicle BUS_001: active on Route 66
Location: (41.88, -87.63)
Vehicle BUS_002: maintenance on Route 22
Location: (41.8955, -87.6226)
```

This code provides a solid foundation for a fleet management system and can be extended with additional features like API integration, real-time tracking, or database persistence as needed. Let me know if you'd like to add specific functionality or modify the existing code!
