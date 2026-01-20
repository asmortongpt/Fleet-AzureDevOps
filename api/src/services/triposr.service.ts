import axios from 'axios';

import { damageReportRepository } from '../repositories/damage-report.repository';
import { TripoSRTask } from '../types/damage-report';

/**
 * TripoSR 3D Model Generation Service
 * Integrates with TripoSR API for 3D model generation from images
 */
export class TripoSRService {
  private apiKey: string;
  private apiEndpoint: string;
  private pollInterval: number = 5000; // 5 seconds

  constructor() {
    this.apiKey = process.env.TRIPOSR_API_KEY || '';
    this.apiEndpoint =
      process.env.TRIPOSR_API_ENDPOINT || 'https://api.tripo3d.ai/v1';
  }

  /**
   * Generate 3D model from damage report photos
   */
  async generate3DModel(
    tenantId: string,
    damageReportId: string,
    photos: string[]
  ): Promise<TripoSRTask> {
    if (!this.apiKey) {
      throw new Error('TripoSR API key not configured');
    }

    if (photos.length === 0) {
      throw new Error('At least one photo is required for 3D model generation');
    }

    try {
      // Update status to processing
      await damageReportRepository.updateTriposrStatus(
        tenantId,
        damageReportId,
        'processing'
      );

      // Call TripoSR API to generate 3D model
      const response = await axios.post(
        `${this.apiEndpoint}/generate`,
        {
          images: photos,
          format: 'glb', // GLB format for 3D models
          quality: 'high',
          metadata: {
            damage_report_id: damageReportId,
            tenant_id: tenantId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const taskId = response.data.task_id;

      // Update damage report with task ID
      await damageReportRepository.updateTriposrStatus(
        tenantId,
        damageReportId,
        'processing',
        taskId
      );

      // Start polling for completion in background
      this.pollTaskStatus(tenantId, damageReportId, taskId);

      return {
        task_id: taskId,
        status: 'processing',
        model_url: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
    } catch (error: any) {
      console.error('TripoSR generation failed:', error);

      // Update status to failed
      await damageReportRepository.updateTriposrStatus(
        tenantId,
        damageReportId,
        'failed'
      );

      throw new Error(`Failed to generate 3D model: ${error.message}`);
    }
  }

  /**
   * Poll TripoSR task status until completion
   */
  private async pollTaskStatus(
    tenantId: string,
    damageReportId: string,
    taskId: string
  ): Promise<void> {
    try {
      const response = await axios.get(`${this.apiEndpoint}/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const status = response.data.status;

      if (status === 'completed') {
        const modelUrl = response.data.model_url;

        // Update damage report with completed model
        await damageReportRepository.updateTriposrStatus(
          tenantId,
          damageReportId,
          'completed',
          taskId,
          modelUrl
        );

        console.log(
          `TripoSR task ${taskId} completed. Model URL: ${modelUrl}`
        );
      } else if (status === 'failed') {
        // Update damage report with failed status
        await damageReportRepository.updateTriposrStatus(
          tenantId,
          damageReportId,
          'failed',
          taskId
        );

        console.error(`TripoSR task ${taskId} failed`);
      } else if (status === 'processing') {
        // Continue polling
        setTimeout(() => {
          this.pollTaskStatus(tenantId, damageReportId, taskId);
        }, this.pollInterval);
      }
    } catch (error: any) {
      console.error(`Error polling TripoSR task ${taskId}:`, error);

      // Retry after interval
      setTimeout(() => {
        this.pollTaskStatus(tenantId, damageReportId, taskId);
      }, this.pollInterval);
    }
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<TripoSRTask> {
    if (!this.apiKey) {
      throw new Error('TripoSR API key not configured');
    }

    try {
      const response = await axios.get(`${this.apiEndpoint}/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return {
        task_id: taskId,
        status: response.data.status,
        model_url: response.data.model_url || null,
        created_at: new Date(response.data.created_at),
        updated_at: new Date(response.data.updated_at),
        error: response.data.error,
      };
    } catch (error: any) {
      throw new Error(`Failed to get task status: ${error.message}`);
    }
  }

  /**
   * Process pending 3D model generations
   * This can be called by a background job/cron
   */
  async processPendingGenerations(tenantId: string): Promise<void> {
    const pendingReports =
      await damageReportRepository.findPending3DGeneration(tenantId);

    console.log(
      `Processing ${pendingReports.length} pending 3D model generations`
    );

    for (const report of pendingReports) {
      try {
        if (report.photos && report.photos.length > 0) {
          await this.generate3DModel(tenantId, report.id, report.photos);
        }
      } catch (error: any) {
        console.error(
          `Failed to generate 3D model for report ${report.id}:`,
          error
        );
      }
    }
  }

  /**
   * Mock implementation for development/testing
   */
  async generate3DModelMock(
    tenantId: string,
    damageReportId: string,
    photos: string[]
  ): Promise<TripoSRTask> {
    if (photos.length === 0) {
      throw new Error('At least one photo is required for 3D model generation');
    }

    // Simulate processing
    await damageReportRepository.updateTriposrStatus(
      tenantId,
      damageReportId,
      'processing'
    );

    // Simulate async completion after 3 seconds
    setTimeout(async () => {
      const mockModelUrl = `https://storage.example.com/models/${damageReportId}.glb`;

      await damageReportRepository.updateTriposrStatus(
        tenantId,
        damageReportId,
        'completed',
        `mock-task-${damageReportId}`,
        mockModelUrl
      );

      console.log(
        `Mock 3D model generation completed for ${damageReportId}`
      );
    }, 3000);

    return {
      task_id: `mock-task-${damageReportId}`,
      status: 'processing',
      model_url: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }
}

export const triposrService = new TripoSRService();
