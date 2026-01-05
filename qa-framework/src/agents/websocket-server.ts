import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import http from 'http';

export interface AgentStatusUpdate {
  agentId: string;
  status: 'idle' | 'busy' | 'error' | 'offline';
  currentTask?: string;
  taskType?: string;
  progress?: number;
  lastHeartbeat: Date;
}

export interface MetricsUpdate {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  queuedTasks: number;
  throughput: number;
  errorRate: number;
  avgTaskTime: number;
  estimatedCompletion?: Date;
}

export interface TaskUpdate {
  taskId: string;
  type: string;
  priority: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  assignedAgent?: string;
  file?: string;
  startTime?: Date;
  completedTime?: Date;
  error?: string;
}

export class AgentMonitoringServer extends EventEmitter {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private server: http.Server;
  private port: number;

  constructor(port: number = 8080) {
    super();
    this.port = port;

    // Create HTTP server
    this.server = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy', clients: this.clients.size }));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    // Create WebSocket server
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      // Send welcome message
      this.sendToClient(ws, {
        type: 'connected',
        message: 'Connected to Agent Monitoring Server',
        timestamp: new Date().toISOString()
      });

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('Failed to parse client message:', error);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`Agent Monitoring WebSocket Server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      this.wss.close(() => {
        this.server.close(() => {
          console.log('Agent Monitoring Server stopped');
          resolve();
        });
      });
    });
  }

  private handleClientMessage(ws: WebSocket, data: any) {
    switch (data.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;
      case 'subscribe':
        // Client can subscribe to specific event types
        console.log('Client subscribed to:', data.events);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private sendToClient(ws: WebSocket, data: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  private broadcast(data: any) {
    const message = JSON.stringify(data);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Public methods for broadcasting updates

  broadcastAgentStatus(update: AgentStatusUpdate) {
    this.broadcast({
      type: 'agent-status',
      data: update,
      timestamp: new Date().toISOString()
    });
  }

  broadcastMetrics(metrics: MetricsUpdate) {
    this.broadcast({
      type: 'metrics',
      data: metrics,
      timestamp: new Date().toISOString()
    });
  }

  broadcastTaskUpdate(task: TaskUpdate) {
    this.broadcast({
      type: 'task-update',
      data: task,
      timestamp: new Date().toISOString()
    });
  }

  broadcastAlert(alert: {
    level: 'info' | 'warning' | 'error' | 'success';
    message: string;
    agentId?: string;
    taskId?: string;
  }) {
    this.broadcast({
      type: 'alert',
      data: alert,
      timestamp: new Date().toISOString()
    });
  }

  broadcastAnalysisComplete(report: {
    totalFiles: number;
    totalIssues: number;
    criticalIssues: number;
    recommendations: string[];
    duration: number;
  }) {
    this.broadcast({
      type: 'analysis-complete',
      data: report,
      timestamp: new Date().toISOString()
    });
  }
}
