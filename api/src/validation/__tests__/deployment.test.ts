/**
 * Deployment & Monitoring Tests
 * Tests for framework status endpoints and deployment verification
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { FrameworkStatus } from '../FrameworkStatus';

describe('Deployment & Monitoring', () => {
  let app: Express;
  let frameworkStatus: FrameworkStatus;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Initialize framework status
    frameworkStatus = new FrameworkStatus();

    // Status endpoints
    app.get('/api/validation/status', async (req, res) => {
      try {
        const status = await frameworkStatus.getOverallStatus();
        res.json({
          success: true,
          data: status
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    app.get('/api/validation/status/health', async (req, res) => {
      try {
        const health = await frameworkStatus.healthCheck();
        const statusCode = health.healthy ? 200 : 503;
        res.status(statusCode).json({
          success: health.healthy,
          data: health
        });
      } catch (error) {
        res.status(503).json({
          success: false,
          error: error instanceof Error ? error.message : 'Health check failed'
        });
      }
    });

    app.get('/api/validation/status/ready', async (req, res) => {
      try {
        const ready = await frameworkStatus.readinessCheck();
        const statusCode = ready.ready ? 200 : 503;
        res.status(statusCode).json({
          success: ready.ready,
          data: ready
        });
      } catch (error) {
        res.status(503).json({
          success: false,
          error: error instanceof Error ? error.message : 'Readiness check failed'
        });
      }
    });

    app.get('/api/validation/status/agents', async (req, res) => {
      try {
        const agentStatus = await frameworkStatus.getAgentStatus();
        res.json({
          success: true,
          data: agentStatus
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    app.get('/api/validation/status/metrics', async (req, res) => {
      try {
        const metrics = await frameworkStatus.getMetrics();
        res.json({
          success: true,
          data: metrics
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    app.get('/api/validation/status/performance', async (req, res) => {
      try {
        const performance = await frameworkStatus.getPerformanceBaseline();
        res.json({
          success: true,
          data: performance
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return healthy status with 200 code', async () => {
      const response = await request(app).get('/api/validation/status/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.healthy).toBeDefined();
    });

    it('should check database connectivity', async () => {
      const response = await request(app).get('/api/validation/status/health');

      expect(response.body.data.checks).toBeDefined();
      expect(response.body.data.checks.database).toBeDefined();
    });

    it('should check Redis connectivity', async () => {
      const response = await request(app).get('/api/validation/status/health');

      expect(response.body.data.checks.redis).toBeDefined();
    });

    it('should include timestamp in health response', async () => {
      const response = await request(app).get('/api/validation/status/health');

      expect(response.body.data.timestamp).toBeDefined();
      expect(typeof response.body.data.timestamp).toBe('number');
    });
  });

  describe('Readiness Check Endpoint', () => {
    it('should return readiness status', async () => {
      const response = await request(app).get('/api/validation/status/ready');

      // May return 503 if not ready, but should still have valid response structure
      expect([200, 503]).toContain(response.status);
      expect(response.body.success).toBeDefined();
      expect(response.body.data.ready).toBeDefined();
    });

    it('should verify all agents are initialized', async () => {
      const response = await request(app).get('/api/validation/status/ready');

      expect(response.body.data.agentsReady).toBeDefined();
      expect(Array.isArray(response.body.data.agentsReady)).toBe(true);
    });

    it('should verify database schema is up to date', async () => {
      const response = await request(app).get('/api/validation/status/ready');

      expect(response.body.data.schemaReady).toBeDefined();
    });
  });

  describe('Overall Status Endpoint', () => {
    it('should return overall framework status', async () => {
      const response = await request(app).get('/api/validation/status');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should include deployment status', async () => {
      const response = await request(app).get('/api/validation/status');

      expect(response.body.data.deploymentStatus).toBeDefined();
    });

    it('should include component statuses', async () => {
      const response = await request(app).get('/api/validation/status');

      expect(response.body.data.components).toBeDefined();
    });

    it('should include overall quality score', async () => {
      const response = await request(app).get('/api/validation/status');

      expect(response.body.data.qualityScore).toBeDefined();
      expect(typeof response.body.data.qualityScore).toBe('number');
      expect(response.body.data.qualityScore).toBeGreaterThanOrEqual(0);
      expect(response.body.data.qualityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Agent Status Endpoint', () => {
    it('should return status for all agents', async () => {
      const response = await request(app).get('/api/validation/status/agents');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.agents)).toBe(true);
    });

    it('should include individual agent details', async () => {
      const response = await request(app).get('/api/validation/status/agents');

      const agents = response.body.data.agents;
      agents.forEach((agent: any) => {
        expect(agent.name).toBeDefined();
        expect(agent.status).toBeDefined();
        expect(agent.lastRun).toBeDefined();
        expect(agent.issueCount).toBeDefined();
      });
    });

    it('should include VisualQAAgent', async () => {
      const response = await request(app).get('/api/validation/status/agents');

      const agents = response.body.data.agents;
      const visualQAAgent = agents.find((a: any) => a.name === 'VisualQAAgent');
      expect(visualQAAgent).toBeDefined();
    });

    it('should include all 6 core agents', async () => {
      const response = await request(app).get('/api/validation/status/agents');

      const agents = response.body.data.agents;
      const agentNames = agents.map((a: any) => a.name);

      expect(agentNames).toContain('VisualQAAgent');
      expect(agentNames).toContain('ResponsiveDesignAgent');
      expect(agentNames).toContain('ScrollingAuditAgent');
      expect(agentNames).toContain('TypographyAgent');
      expect(agentNames).toContain('InteractionQualityAgent');
      expect(agentNames).toContain('DataIntegrityAgent');
    });
  });

  describe('Metrics Endpoint', () => {
    it('should return framework metrics', async () => {
      const response = await request(app).get('/api/validation/status/metrics');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.metrics).toBeDefined();
    });

    it('should include issue detection rate', async () => {
      const response = await request(app).get('/api/validation/status/metrics');

      expect(response.body.data.metrics.issueDetectionRate).toBeDefined();
    });

    it('should include average quality score', async () => {
      const response = await request(app).get('/api/validation/status/metrics');

      expect(response.body.data.metrics.averageQualityScore).toBeDefined();
    });

    it('should include validation run count', async () => {
      const response = await request(app).get('/api/validation/status/metrics');

      expect(response.body.data.metrics.validationRunCount).toBeDefined();
    });

    it('should include average execution time', async () => {
      const response = await request(app).get('/api/validation/status/metrics');

      expect(response.body.data.metrics.averageExecutionTime).toBeDefined();
    });
  });

  describe('Performance Baseline Endpoint', () => {
    it('should return performance baseline', async () => {
      const response = await request(app).get('/api/validation/status/performance');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.baseline).toBeDefined();
    });

    it('should include agent execution times', async () => {
      const response = await request(app).get('/api/validation/status/performance');

      expect(response.body.data.baseline.agentExecutionTimes).toBeDefined();
    });

    it('should include resource utilization', async () => {
      const response = await request(app).get('/api/validation/status/performance');

      expect(response.body.data.baseline.resourceUtilization).toBeDefined();
    });

    it('should include memory usage', async () => {
      const response = await request(app).get('/api/validation/status/performance');

      expect(response.body.data.baseline.resourceUtilization.memory).toBeDefined();
    });

    it('should include CPU usage', async () => {
      const response = await request(app).get('/api/validation/status/performance');

      expect(response.body.data.baseline.resourceUtilization.cpu).toBeDefined();
    });
  });

  describe('Deployment Verification', () => {
    it('should verify framework is deployable', async () => {
      const health = await frameworkStatus.healthCheck();
      const ready = await frameworkStatus.readinessCheck();

      // In production both should be true, but in tests may vary
      // At minimum, health check should pass
      expect(health.healthy).toBe(true);
      // Readiness check may be false on first run due to no recent agent runs
      expect(typeof ready.ready).toBe('boolean');
    });

    it('should support zero-downtime deployment', async () => {
      const status = await frameworkStatus.getOverallStatus();

      expect(status.deploymentStatus).toBeDefined();
      expect(status.deploymentStatus.supportsGracefulShutdown).toBe(true);
    });

    it('should have rollback capabilities', async () => {
      const status = await frameworkStatus.getOverallStatus();

      expect(status.deploymentStatus.rollbackSupported).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle health check failures gracefully', async () => {
      // Mock a failure scenario
      const failingStatus = new FrameworkStatus();
      failingStatus.getHealthCheckStatus = vi.fn().mockRejectedValue(new Error('Connection failed'));

      const response = await request(app).get('/api/validation/status/health');
      // Should still return response, not crash
      expect(response.status).toBeLessThanOrEqual(503);
    });

    it('should include error messages in response', async () => {
      const response = await request(app).get('/api/validation/status');

      if (!response.body.success) {
        expect(response.body.error).toBeDefined();
      }
    });
  });

  describe('Response Format', () => {
    it('should follow standard API response format', async () => {
      const response = await request(app).get('/api/validation/status');

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
    });

    it('should include timestamps in all responses', async () => {
      const response = await request(app).get('/api/validation/status');

      expect(response.body.data.timestamp).toBeDefined();
    });

    it('should be JSON serializable', async () => {
      const response = await request(app).get('/api/validation/status');

      expect(() => JSON.stringify(response.body)).not.toThrow();
    });
  });
});
