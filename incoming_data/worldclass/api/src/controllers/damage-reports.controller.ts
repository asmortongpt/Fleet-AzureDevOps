/**
 * Damage Reports Controller
 *
 * Handles all damage report operations including CRUD and 3D model generation
 *
 * @module controllers/damage-reports
 */

import { Request, Response, NextFunction } from 'express';
import { damageReportRepository } from '../repositories/damage-report.repository';
import { triposrService } from '../services/triposr.service';
import {
  CreateDamageReportDto,
  UpdateDamageReportDto,
  Generate3DModelDto,
} from '../types/damage-report';

export class DamageReportsController {
  /**
   * Get all damage reports with optional filters
   * GET /api/damage-reports
   */
  async getAllDamageReports(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user?.tenant_id || req.user?.tenantId || '1').toString();
      const filters = {
        vehicle_id: req.query.vehicle_id as string | undefined,
        severity: req.query.severity as string | undefined,
        status: req.query.status as string | undefined,
        from_date: req.query.from_date
          ? new Date(req.query.from_date as string)
          : undefined,
        to_date: req.query.to_date
          ? new Date(req.query.to_date as string)
          : undefined,
      };

      const reports = await damageReportRepository.findAll(tenantId, filters);

      res.status(200).json({
        success: true,
        data: reports,
        count: reports.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get damage report by ID
   * GET /api/damage-reports/:id
   */
  async getDamageReportById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user?.tenant_id || req.user?.tenantId || '1').toString();
      const { id } = req.params;

      const report = await damageReportRepository.findById(tenantId, id);

      if (!report) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Damage report with ID ${id} not found`,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detailed damage report by ID (using view with joins)
   * GET /api/damage-reports/:id/detailed
   */
  async getDetailedDamageReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user?.tenant_id || req.user?.tenantId || '1').toString();
      const { id } = req.params;

      const report = await damageReportRepository.findDetailedById(tenantId, id);

      if (!report) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Damage report with ID ${id} not found`,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get damage reports by vehicle ID
   * GET /api/damage-reports/vehicle/:vehicleId
   */
  async getDamageReportsByVehicle(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user?.tenant_id || req.user?.tenantId || '1').toString();
      const { vehicleId } = req.params;

      const reports = await damageReportRepository.findByVehicleId(
        tenantId,
        vehicleId
      );

      res.status(200).json({
        success: true,
        data: reports,
        count: reports.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new damage report
   * POST /api/damage-reports
   */
  async createDamageReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user?.tenant_id || req.user?.tenantId || '1').toString();
      const data: CreateDamageReportDto = req.body;

      // Validate required fields
      if (!data.vehicle_id) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'vehicle_id is required',
          },
        });
        return;
      }

      if (!data.reported_by) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'reported_by is required',
          },
        });
        return;
      }

      if (!data.damage_description) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'damage_description is required',
          },
        });
        return;
      }

      if (!data.damage_severity) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'damage_severity is required',
          },
        });
        return;
      }

      // Validate severity values
      const validSeverities = ['minor', 'moderate', 'severe'];
      if (!validSeverities.includes(data.damage_severity)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `damage_severity must be one of: ${validSeverities.join(', ')}`,
          },
        });
        return;
      }

      const report = await damageReportRepository.create(tenantId, data);

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update damage report
   * PATCH /api/damage-reports/:id
   */
  async updateDamageReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user?.tenant_id || req.user?.tenantId || '1').toString();
      const { id } = req.params;
      const data: UpdateDamageReportDto = req.body;

      // Validate severity if provided
      if (data.damage_severity) {
        const validSeverities = ['minor', 'moderate', 'severe'];
        if (!validSeverities.includes(data.damage_severity)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `damage_severity must be one of: ${validSeverities.join(', ')}`,
            },
          });
          return;
        }
      }

      // Validate triposr_status if provided
      if (data.triposr_status) {
        const validStatuses = ['pending', 'processing', 'completed', 'failed'];
        if (!validStatuses.includes(data.triposr_status)) {
          res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `triposr_status must be one of: ${validStatuses.join(', ')}`,
            },
          });
          return;
        }
      }

      const report = await damageReportRepository.update(tenantId, id, data);

      if (!report) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Damage report with ID ${id} not found`,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete damage report
   * DELETE /api/damage-reports/:id
   */
  async deleteDamageReport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user?.tenant_id || req.user?.tenantId || '1').toString();
      const { id } = req.params;

      const deleted = await damageReportRepository.delete(tenantId, id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Damage report with ID ${id} not found`,
          },
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate 3D model for damage report
   * POST /api/damage-reports/:id/generate-3d-model
   */
  async generate3DModel(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user?.tenant_id || req.user?.tenantId || '1').toString();
      const { id } = req.params;

      // Check if report exists
      const report = await damageReportRepository.findById(tenantId, id);

      if (!report) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Damage report with ID ${id} not found`,
          },
        });
        return;
      }

      // Validate photos exist
      if (!report.photos || report.photos.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Damage report must have at least one photo to generate 3D model',
          },
        });
        return;
      }

      // Generate 3D model
      const task = await triposrService.generate3DModel(
        tenantId,
        id,
        report.photos
      );

      res.status(200).json({
        success: true,
        data: task,
        message: '3D model generation started. The model will be available when processing is complete.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get 3D model generation status
   * GET /api/damage-reports/:id/3d-model-status
   */
  async get3DModelStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user?.tenant_id || req.user?.tenantId || '1').toString();
      const { id } = req.params;

      const report = await damageReportRepository.findById(tenantId, id);

      if (!report) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Damage report with ID ${id} not found`,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          status: report.triposr_status,
          task_id: report.triposr_task_id,
          model_url: report.triposr_model_url,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending 3D model generations
   * GET /api/damage-reports/pending-3d-generation
   */
  async getPending3DGenerations(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user?.tenant_id || req.user?.tenantId || '1').toString();

      const reports = await damageReportRepository.findPending3DGeneration(
        tenantId
      );

      res.status(200).json({
        success: true,
        data: reports,
        count: reports.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const damageReportsController = new DamageReportsController();


/**
 * Update damage annotations (world-space points + UV polygons) for a report.
 * Accepts an array of DamageAnnotation and optional DamageOverlay metadata.
 */
export async function updateDamageAnnotations(req: Request, res: Response) {
  const { id } = req.params;
  const { damage_annotations, damage_overlay } = req.body || {};

  if (!Array.isArray(damage_annotations)) {
    return res.status(400).json({ error: 'damage_annotations must be an array' });
  }

  const updated = await damageReportRepository.updateAnnotations(id, damage_annotations, damage_overlay || {});
  return res.json(updated);
}
