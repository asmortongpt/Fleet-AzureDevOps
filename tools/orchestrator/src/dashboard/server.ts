/**
 * Real-time Remediation Dashboard Server
 * Provides live updates on remediation progress via WebSocket
 */

import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

import express from 'express';
import { Server as SocketIOServer } from 'socket.io';

import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DashboardMetrics {
  timestamp: string;
  overview: {
    total_findings: number;
    remediated: number;
    in_progress: number;
    failed: number;
    remaining: number;
    success_rate: number;
  };
  by_severity: Record<string, {
    total: number;
    remediated: number;
    remaining: number;
  }>;
  by_type: Record<string, {
    total: number;
    remediated: number;
    remaining: number;
  }>;
  current_iteration: number;
  max_iterations: number;
  elapsed_time_ms: number;
  estimated_time_remaining_ms: number;
  current_activity: string;
  recent_fixes: Array<{
    id: string;
    title: string;
    severity: string;
    type: string;
    status: 'success' | 'failed' | 'in_progress';
    timestamp: string;
    duration_ms?: number;
  }>;
  gate_results: Array<{
    gate: string;
    passed: boolean;
    timestamp: string;
    errors?: string[];
  }>;
  risk_trend: Array<{
    iteration: number;
    total_risk_score: number;
    findings_count: number;
  }>;
}

export class DashboardServer {
  private app: express.Application;
  private httpServer: any;
  private io: SocketIOServer;
  private port: number;
  private metrics: DashboardMetrics;

  constructor(port: number = 3001) {
    this.port = port;
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.metrics = this.getInitialMetrics();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private getInitialMetrics(): DashboardMetrics {
    return {
      timestamp: new Date().toISOString(),
      overview: {
        total_findings: 0,
        remediated: 0,
        in_progress: 0,
        failed: 0,
        remaining: 0,
        success_rate: 0
      },
      by_severity: {},
      by_type: {},
      current_iteration: 0,
      max_iterations: 10,
      elapsed_time_ms: 0,
      estimated_time_remaining_ms: 0,
      current_activity: 'Initializing...',
      recent_fixes: [],
      gate_results: [],
      risk_trend: []
    };
  }

  private setupRoutes(): void {
    // Serve static dashboard HTML
    this.app.use(express.static(path.join(__dirname, 'public')));
    this.app.use(express.json());

    // API endpoint for current metrics
    this.app.get('/api/metrics', (_req, res) => {
      res.json(this.metrics);
    });

    // Health check
    this.app.get('/api/health', (_req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Root serves dashboard
    this.app.get('/', (_req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
  }

  private setupWebSocket(): void {
    this.io.on('connection', (socket) => {
      logger.info('Dashboard client connected', { socketId: socket.id });

      // Send current metrics on connection
      socket.emit('metrics', this.metrics);

      socket.on('disconnect', () => {
        logger.info('Dashboard client disconnected', { socketId: socket.id });
      });

      socket.on('request-metrics', () => {
        socket.emit('metrics', this.metrics);
      });
    });
  }

  /**
   * Update dashboard metrics and broadcast to all connected clients
   */
  public updateMetrics(updates: Partial<DashboardMetrics>): void {
    this.metrics = {
      ...this.metrics,
      ...updates,
      timestamp: new Date().toISOString()
    };

    // Broadcast to all connected clients
    this.io.emit('metrics', this.metrics);
  }

  /**
   * Update specific finding status
   */
  public updateFinding(findingId: string, status: 'success' | 'failed' | 'in_progress', details?: any): void {
    const existing = this.metrics.recent_fixes.find(f => f.id === findingId);

    if (existing) {
      existing.status = status;
      if (status !== 'in_progress' && existing.timestamp) {
        const startTime = new Date(existing.timestamp).getTime();
        existing.duration_ms = Date.now() - startTime;
      }
    } else if (details) {
      this.metrics.recent_fixes.unshift({
        id: findingId,
        title: details.title || findingId,
        severity: details.severity || 'unknown',
        type: details.type || 'unknown',
        status,
        timestamp: new Date().toISOString(),
        duration_ms: details.duration_ms
      });

      // Keep only last 50 fixes
      if (this.metrics.recent_fixes.length > 50) {
        this.metrics.recent_fixes = this.metrics.recent_fixes.slice(0, 50);
      }
    }

    // Update overview counts
    this.metrics.overview.in_progress = this.metrics.recent_fixes.filter(f => f.status === 'in_progress').length;
    this.metrics.overview.remediated = this.metrics.recent_fixes.filter(f => f.status === 'success').length;
    this.metrics.overview.failed = this.metrics.recent_fixes.filter(f => f.status === 'failed').length;
    this.metrics.overview.remaining = this.metrics.overview.total_findings - this.metrics.overview.remediated - this.metrics.overview.failed;

    if (this.metrics.overview.total_findings > 0) {
      this.metrics.overview.success_rate = (this.metrics.overview.remediated / this.metrics.overview.total_findings) * 100;
    }

    this.io.emit('metrics', this.metrics);
  }

  /**
   * Add gate result
   */
  public addGateResult(gate: string, passed: boolean, errors?: string[]): void {
    this.metrics.gate_results.unshift({
      gate,
      passed,
      timestamp: new Date().toISOString(),
      errors
    });

    // Keep only last 20 gate results
    if (this.metrics.gate_results.length > 20) {
      this.metrics.gate_results = this.metrics.gate_results.slice(0, 20);
    }

    this.io.emit('metrics', this.metrics);
  }

  /**
   * Update risk trend
   */
  public updateRiskTrend(iteration: number, totalRiskScore: number, findingsCount: number): void {
    this.metrics.risk_trend.push({
      iteration,
      total_risk_score: totalRiskScore,
      findings_count: findingsCount
    });

    this.io.emit('metrics', this.metrics);
  }

  /**
   * Set current activity status
   */
  public setActivity(activity: string): void {
    this.metrics.current_activity = activity;
    this.io.emit('metrics', this.metrics);
  }

  /**
   * Start the dashboard server
   */
  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.listen(this.port, () => {
        logger.info(`Dashboard server running at http://localhost:${this.port}`);
        console.log(`\n📊 Dashboard: http://localhost:${this.port}\n`);
        resolve();
      });
    });
  }

  /**
   * Stop the dashboard server
   */
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      this.io.close(() => {
        this.httpServer.close(() => {
          logger.info('Dashboard server stopped');
          resolve();
        });
      });
    });
  }

  /**
   * Get current metrics
   */
  public getMetrics(): DashboardMetrics {
    return this.metrics;
  }
}

// Singleton instance
let dashboardInstance: DashboardServer | null = null;

export function getDashboard(port?: number): DashboardServer {
  if (!dashboardInstance) {
    dashboardInstance = new DashboardServer(port);
  }
  return dashboardInstance;
}
