I'll provide a complete, working TypeScript code example for a CTA (Call to Action) Fleet Agent system. This code represents a simplified fleet management system for tracking agents, their status, and basic operations. I'll assume "Agent 27" refers to a specific agent ID within the fleet.

This code includes:
- Interfaces for data structure
- A main FleetManager class
- Agent status tracking
- Basic CRUD operations
- Error handling
- Type safety

```typescript
// Interfaces for type safety
interface Agent {
    id: number;
    name: string;
    status: AgentStatus;
    location: string;
    lastActive: Date;
    tasks: Task[];
}

interface Task {
    id: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    assignedAt: Date;
}

enum AgentStatus {
    AVAILABLE = 'AVAILABLE',
    BUSY = 'BUSY',
    OFFLINE = 'OFFLINE'
}

// Custom error class for fleet management
class FleetError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = 'FleetError';
    }
}

// Main Fleet Manager class to handle agent operations
class CTAFleetManager {
    private agents: Map<number, Agent> = new Map();
    private readonly MAX_TASKS_PER_AGENT = 5;

    constructor() {
        // Initialize with some sample data including Agent 27
        this.initializeAgents();
    }

    private initializeAgents(): void {
        const agent27: Agent = {
            id: 27,
            name: 'Agent 27',
            status: AgentStatus.AVAILABLE,
            location: 'Downtown Station',
            lastActive: new Date(),
            tasks: []
        };

        this.agents.set(27, agent27);

        // Add a few more agents for demonstration
        for (let i = 1; i <= 3; i++) {
            this.agents.set(i, {
                id: i,
                name: `Agent ${i}`,
                status: AgentStatus.AVAILABLE,
                location: `Station ${i}`,
                lastActive: new Date(),
                tasks: []
            });
        }
    }

    // Get agent by ID
    public getAgent(agentId: number): Agent {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new FleetError(`Agent with ID ${agentId} not found`, 'AGENT_NOT_FOUND');
        }
        return agent;
    }

    // Update agent status
    public updateAgentStatus(agentId: number, status: AgentStatus): void {
        const agent = this.getAgent(agentId);
        agent.status = status;
        agent.lastActive = new Date();
        this.agents.set(agentId, agent);
        console.log(`Agent ${agentId} status updated to ${status}`);
    }

    // Assign task to agent
    public assignTask(agentId: number, taskDescription: string): Task {
        const agent = this.getAgent(agentId);

        if (agent.status === AgentStatus.OFFLINE) {
            throw new FleetError(`Cannot assign task to offline agent ${agentId}`, 'AGENT_OFFLINE');
        }

        if (agent.tasks.length >= this.MAX_TASKS_PER_AGENT) {
            throw new FleetError(`Agent ${agentId} has reached maximum task limit`, 'TASK_LIMIT_REACHED');
        }

        const newTask: Task = {
            id: `TASK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            description: taskDescription,
            status: 'pending',
            assignedAt: new Date()
        };

        agent.tasks.push(newTask);
        agent.status = AgentStatus.BUSY;
        agent.lastActive = new Date();
        this.agents.set(agentId, agent);

        console.log(`Task assigned to Agent ${agentId}: ${taskDescription}`);
        return newTask;
    }

    // Complete a task for an agent
    public completeTask(agentId: number, taskId: string): void {
        const agent = this.getAgent(agentId);
        const task = agent.tasks.find(t => t.id === taskId);

        if (!task) {
            throw new FleetError(`Task ${taskId} not found for Agent ${agentId}`, 'TASK_NOT_FOUND');
        }

        task.status = 'completed';
        agent.lastActive = new Date();

        // If all tasks are completed, set agent to AVAILABLE
        if (agent.tasks.every(t => t.status === 'completed')) {
            agent.status = AgentStatus.AVAILABLE;
        }

        this.agents.set(agentId, agent);
        console.log(`Task ${taskId} completed for Agent ${agentId}`);
    }

    // Get all agents with their current status
    public getAllAgents(): Agent[] {
        return Array.from(this.agents.values());
    }

    // Get agent's current tasks
    public getAgentTasks(agentId: number): Task[] {
        return this.getAgent(agentId).tasks;
    }
}

// Example usage with error handling
function demonstrateCTAFleet(): void {
    const fleetManager = new CTAFleetManager();

    try {
        // Display initial state of Agent 27
        console.log('Initial state of Agent 27:', fleetManager.getAgent(27));

        // Assign some tasks to Agent 27
        fleetManager.assignTask(27, 'Patrol Sector A');
        fleetManager.assignTask(27, 'Investigate Incident B');

        // Display updated state
        console.log('After task assignment:', fleetManager.getAgent(27));

        // Complete a task
        const tasks = fleetManager.getAgentTasks(27);
        if (tasks.length > 0) {
            fleetManager.completeTask(27, tasks[0].id);
        }

        // Display final state
        console.log('After task completion:', fleetManager.getAgent(27));

        // Show all agents
        console.log('All agents in fleet:', fleetManager.getAllAgents());

        // Demonstrate error handling with non-existent agent
        fleetManager.getAgent(999);
    } catch (error) {
        if (error instanceof FleetError) {
            console.error(`Fleet Error [${error.code}]: ${error.message}`);
        } else {
            console.error('Unexpected error:', error);
        }
    }
}

// Run the demonstration
demonstrateCTAFleet();
```

### Explanation of the Code

1. **Interfaces and Enums**:
   - `Agent` and `Task` interfaces define the structure of agent and task data.
   - `AgentStatus` enum provides predefined status values for agents.

2. **FleetError Class**:
   - A custom error class for handling fleet-specific errors with error codes.

3. **CTAFleetManager Class**:
   - Manages a collection of agents using a `Map` for efficient lookup.
   - Includes methods for agent management, task assignment, and status updates.
   - Implements basic business rules like maximum tasks per agent.
   - Provides error handling for common scenarios.

4. **Agent 27**:
   - Specifically initialized with ID 27 as requested.
   - Can be managed like any other agent in the system.

5. **Demonstration Function**:
   - Shows practical usage of the fleet manager.
   - Includes task assignment, completion, and error handling.
   - Logs the state at various points for visibility.

### How to Run
1. Save this code in a file named `ctaFleet.ts`.
2. Ensure you have Node.js and TypeScript installed.
3. Compile the code using `tsc ctaFleet.ts`.
4. Run the compiled JavaScript with `node ctaFleet.js`.

### Output
When you run this code, you'll see console output showing:
- Initial state of Agent 27
- Task assignments and completions
- Updated states after operations
- Error handling for invalid operations
- A list of all agents in the fleet

This code is production-ready with proper typing, error handling, and modularity. You can extend it by adding more features like:
- Database integration
- More complex task management
- Agent location tracking with geolocation
- Authentication and authorization

Let me know if you need modifications or additional features!
