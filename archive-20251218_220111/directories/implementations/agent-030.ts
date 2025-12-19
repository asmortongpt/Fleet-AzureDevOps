I'll provide a complete, working TypeScript code for a CTAFleet Agent system. This code will include interfaces, classes, and basic functionality for managing a fleet of agents for a Call-to-Action (CTA) system. I'll assume this is for a system that manages field agents who handle customer interactions or tasks.

This code includes agent management, task assignment, status tracking, and basic error handling. I'll structure it as a modular system that can be extended.

```typescript
// Interfaces for type safety
interface IAgent {
    id: string;
    name: string;
    status: AgentStatus;
    location: string;
    tasks: ITask[];
    maxTasks: number;
}

interface ITask {
    id: string;
    description: string;
    priority: TaskPriority;
    status: TaskStatus;
    assignedTo?: string;
    createdAt: Date;
    completedAt?: Date;
}

enum AgentStatus {
    AVAILABLE = 'AVAILABLE',
    BUSY = 'BUSY',
    OFFLINE = 'OFFLINE'
}

enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH'
}

enum TaskStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

// Custom Error class for fleet management
class FleetError extends Error {
    constructor(message: string, public readonly code: string) {
        super(message);
        this.name = 'FleetError';
    }
}

// Agent class implementing IAgent interface
class Agent implements IAgent {
    id: string;
    name: string;
    status: AgentStatus;
    location: string;
    tasks: ITask[];
    maxTasks: number;

    constructor(id: string, name: string, location: string, maxTasks: number = 5) {
        this.id = id;
        this.name = name;
        this.status = AgentStatus.AVAILABLE;
        this.location = location;
        this.tasks = [];
        this.maxTasks = maxTasks;
    }

    canAcceptTask(): boolean {
        return this.status === AgentStatus.AVAILABLE && this.tasks.length < this.maxTasks;
    }

    assignTask(task: ITask): void {
        if (!this.canAcceptTask()) {
            throw new FleetError(
                `Cannot assign task to agent ${this.name}. Agent is either busy or at max capacity.`,
                'AGENT_UNAVAILABLE'
            );
        }
        this.tasks.push(task);
        task.assignedTo = this.id;
        task.status = TaskStatus.IN_PROGRESS;
        this.status = this.tasks.length >= this.maxTasks ? AgentStatus.BUSY : AgentStatus.AVAILABLE;
    }

    completeTask(taskId: string): void {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            throw new FleetError(`Task ${taskId} not found for agent ${this.name}`, 'TASK_NOT_FOUND');
        }
        task.status = TaskStatus.COMPLETED;
        task.completedAt = new Date();
        this.status = this.tasks.length >= this.maxTasks ? AgentStatus.BUSY : AgentStatus.AVAILABLE;
    }
}

// FleetManager class to manage all agents and tasks
class CTAFleetManager {
    private agents: Map<string, Agent> = new Map();
    private tasks: Map<string, ITask> = new Map();

    // Add a new agent to the fleet
    addAgent(agent: Agent): void {
        this.agents.set(agent.id, agent);
    }

    // Remove an agent from the fleet
    removeAgent(agentId: string): void {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new FleetError(`Agent ${agentId} not found`, 'AGENT_NOT_FOUND');
        }
        if (agent.tasks.length > 0) {
            throw new FleetError(`Cannot remove agent ${agentId} with active tasks`, 'AGENT_HAS_TASKS');
        }
        this.agents.delete(agentId);
    }

    // Create a new task
    createTask(description: string, priority: TaskPriority): ITask {
        const taskId = `TASK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const task: ITask = {
            id: taskId,
            description,
            priority,
            status: TaskStatus.PENDING,
            createdAt: new Date()
        };
        this.tasks.set(taskId, task);
        return task;
    }

    // Assign task to the best available agent based on location and availability
    assignTaskToAgent(taskId: string, preferredLocation?: string): void {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new FleetError(`Task ${taskId} not found`, 'TASK_NOT_FOUND');
        }
        if (task.assignedTo) {
            throw new FleetError(`Task ${taskId} already assigned`, 'TASK_ALREADY_ASSIGNED');
        }

        let availableAgent: Agent | undefined;
        if (preferredLocation) {
            availableAgent = Array.from(this.agents.values())
                .filter(agent => agent.location === preferredLocation && agent.canAcceptTask())
                .sort((a, b) => a.tasks.length - b.tasks.length)[0];
        }

        if (!availableAgent) {
            availableAgent = Array.from(this.agents.values())
                .filter(agent => agent.canAcceptTask())
                .sort((a, b) => a.tasks.length - b.tasks.length)[0];
        }

        if (!availableAgent) {
            throw new FleetError('No available agents to assign task', 'NO_AVAILABLE_AGENTS');
        }

        availableAgent.assignTask(task);
    }

    // Get agent status and tasks
    getAgentStatus(agentId: string): IAgent {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new FleetError(`Agent ${agentId} not found`, 'AGENT_NOT_FOUND');
        }
        return agent;
    }

    // Get task status
    getTaskStatus(taskId: string): ITask {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new FleetError(`Task ${taskId} not found`, 'TASK_NOT_FOUND');
        }
        return task;
    }

    // Get all agents
    getAllAgents(): Agent[] {
        return Array.from(this.agents.values());
    }

    // Get all tasks
    getAllTasks(): ITask[] {
        return Array.from(this.tasks.values());
    }
}

// Example usage
function demoCTAFleet() {
    try {
        const fleetManager = new CTAFleetManager();

        // Create some agents
        const agent1 = new Agent('AGENT1', 'John Doe', 'New York', 3);
        const agent2 = new Agent('AGENT2', 'Jane Smith', 'Los Angeles', 2);
        fleetManager.addAgent(agent1);
        fleetManager.addAgent(agent2);

        // Create some tasks
        const task1 = fleetManager.createTask('Handle customer complaint', TaskPriority.HIGH);
        const task2 = fleetManager.createTask('Follow up on lead', TaskPriority.MEDIUM);

        // Assign tasks to agents
        fleetManager.assignTaskToAgent(task1.id, 'New York');
        fleetManager.assignTaskToAgent(task2.id, 'Los Angeles');

        // Log status
        console.log('All Agents:', fleetManager.getAllAgents());
        console.log('All Tasks:', fleetManager.getAllTasks());

        // Complete a task
        agent1.completeTask(task1.id);
        console.log('After completing task1:', fleetManager.getAgentStatus('AGENT1'));
        console.log('Task1 status:', fleetManager.getTaskStatus(task1.id));

    } catch (error) {
        if (error instanceof FleetError) {
            console.error(`Fleet Error [${error.code}]: ${error.message}`);
        } else {
            console.error('Unexpected error:', error);
        }
    }
}

// Run the demo
demoCTAFleet();
```

### Explanation of the Code

1. **Interfaces and Enums**:
   - `IAgent` and `ITask` define the structure for agents and tasks.
   - Enums (`AgentStatus`, `TaskPriority`, `TaskStatus`) provide type-safe status values.

2. **Custom Error Handling**:
   - `FleetError` class extends `Error` to provide specific error codes and messages for fleet operations.

3. **Agent Class**:
   - Manages individual agent data, task assignments, and status updates.
   - Includes logic to check if an agent can accept tasks and to complete tasks.

4. **CTAFleetManager Class**:
   - Central management class for the fleet system.
   - Handles agent and task creation, task assignment (with location preference), and status tracking.
   - Uses `Map` for efficient storage and retrieval of agents and tasks.

5. **Task Assignment Logic**:
   - Tasks are assigned to agents based on availability and location preference.
   - If no agent is available in the preferred location, it falls back to any available agent.
   - Agents have a maximum task capacity to prevent overloading.

6. **Demo Function**:
   - Provides a working example of how to use the system.
   - Creates agents, tasks, assigns tasks, and demonstrates status updates and error handling.

### How to Run
- Copy this code into a `.ts` file (e.g., `ctaFleet.ts`).
- Ensure you have Node.js and TypeScript installed.
- Compile with `tsc ctaFleet.ts`.
- Run with `node ctaFleet.js`.

### Features
- Type-safe with TypeScript interfaces and enums.
- Error handling for common scenarios (no available agents, task already assigned, etc.).
- Location-based task assignment.
- Task and agent status tracking.
- Scalable design for adding more features (e.g., notifications, metrics).

This code provides a solid foundation for a CTA fleet management system and can be extended with additional features like persistence (database integration), real-time updates, or more complex assignment algorithms. Let me know if you need specific modifications or additional functionality!
