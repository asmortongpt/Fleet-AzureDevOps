import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { pool } from '../../../config/database';
import logger from '../../../utils/logger';

/**
 * Policy Violations Controller
 * Handles CRUD operations and specialized queries for policy violations
 */

export class PolicyViolationsController {
  /**
   * GET /api/policy-violations
   * Get all violations with optional filters
   */
  static async getViolations(req: Request, res: Response): Promise<void> {
    try {
      const {
        tenantId,
        violationType,
        severity,
        status,
        vehicleId,
        driverId,
        dateFrom,
        dateTo,
        search,
        limit = 100,
        offset = 0,
      } = req.query;

      let query = `
        SELECT
          id, tenant_id, violation_type, severity, policy_name, policy_id,
          description, violation_details, vehicle_id, vehicle_number,
          driver_id, driver_name, user_id, user_name, threshold_value,
          actual_value, difference, unit, location_lat, location_lng,
          location_address, geofence_id, geofence_name, occurred_at,
          detected_at, status, resolution, resolution_notes, resolved_at,
          resolved_by, resolved_by_name, override_requested, override_approved,
          override_requested_by, override_requested_at, override_approved_by,
          override_approved_at, override_reason, notification_sent,
          notification_sent_at, notification_recipients, escalation_sent,
          escalation_sent_at, request_id, work_order_id, fuel_transaction_id,
          metadata, created_at, updated_at
        FROM policy_violations
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramCount = 1;

      if (tenantId) {
        query += ` AND tenant_id = $${paramCount}`;
        params.push(tenantId);
        paramCount++;
      }

      if (violationType) {
        const types = Array.isArray(violationType) ? violationType : [violationType];
        query += ` AND violation_type = ANY($${paramCount}::text[])`;
        params.push(types);
        paramCount++;
      }

      if (severity) {
        const severities = Array.isArray(severity) ? severity : [severity];
        query += ` AND severity = ANY($${paramCount}::text[])`;
        params.push(severities);
        paramCount++;
      }

      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        query += ` AND status = ANY($${paramCount}::text[])`;
        params.push(statuses);
        paramCount++;
      }

      if (vehicleId) {
        query += ` AND vehicle_id = $${paramCount}`;
        params.push(vehicleId);
        paramCount++;
      }

      if (driverId) {
        query += ` AND driver_id = $${paramCount}`;
        params.push(driverId);
        paramCount++;
      }

      if (dateFrom) {
        query += ` AND occurred_at >= $${paramCount}`;
        params.push(dateFrom);
        paramCount++;
      }

      if (dateTo) {
        query += ` AND occurred_at <= $${paramCount}`;
        params.push(dateTo);
        paramCount++;
      }

      if (search) {
        query += ` AND (
          description ILIKE $${paramCount} OR
          vehicle_number ILIKE $${paramCount} OR
          driver_name ILIKE $${paramCount}
        )`;
        params.push(`%${search}%`);
        paramCount++;
      }

      query += ` ORDER BY occurred_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      // Convert snake_case to camelCase
      const violations = result.rows.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        violationType: row.violation_type,
        severity: row.severity,
        policyName: row.policy_name,
        policyId: row.policy_id,
        description: row.description,
        violationDetails: row.violation_details,
        vehicleId: row.vehicle_id,
        vehicleNumber: row.vehicle_number,
        driverId: row.driver_id,
        driverName: row.driver_name,
        userId: row.user_id,
        userName: row.user_name,
        thresholdValue: row.threshold_value,
        actualValue: row.actual_value,
        difference: row.difference,
        unit: row.unit,
        locationLat: row.location_lat,
        locationLng: row.location_lng,
        locationAddress: row.location_address,
        geofenceId: row.geofence_id,
        geofenceName: row.geofence_name,
        occurredAt: row.occurred_at,
        detectedAt: row.detected_at,
        status: row.status,
        resolution: row.resolution,
        resolutionNotes: row.resolution_notes,
        resolvedAt: row.resolved_at,
        resolvedBy: row.resolved_by,
        resolvedByName: row.resolved_by_name,
        overrideRequested: row.override_requested,
        overrideApproved: row.override_approved,
        overrideRequestedBy: row.override_requested_by,
        overrideRequestedAt: row.override_requested_at,
        overrideApprovedBy: row.override_approved_by,
        overrideApprovedAt: row.override_approved_at,
        overrideReason: row.override_reason,
        notificationSent: row.notification_sent,
        notificationSentAt: row.notification_sent_at,
        notificationRecipients: row.notification_recipients,
        escalationSent: row.escalation_sent,
        escalationSentAt: row.escalation_sent_at,
        requestId: row.request_id,
        workOrderId: row.work_order_id,
        fuelTransactionId: row.fuel_transaction_id,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      res.json({
        success: true,
        data: violations,
        pagination: {
          limit: Number(limit),
          offset: Number(offset),
          total: result.rowCount,
        },
      });
    } catch (error) {
      logger.error('Error fetching violations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch violations',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/policy-violations/statistics
   * Get violation statistics for a tenant
   */
  static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, days = 30 } = req.query;

      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID is required' });
        return;
      }

      const result = await pool.query(
        'SELECT * FROM get_violation_stats($1, $2)',
        [tenantId, days]
      );

      const stats = result.rows[0] || {};

      res.json({
        success: true,
        data: {
          totalViolations: Number(stats.total_violations || 0),
          openViolations: Number(stats.open_violations || 0),
          resolvedViolations: Number(stats.resolved_violations || 0),
          criticalViolations: Number(stats.critical_violations || 0),
          avgResolutionHours: Number(stats.avg_resolution_hours || 0),
          topViolationType: stats.top_violation_type,
          topViolatingVehicle: stats.top_violating_vehicle,
          topViolatingDriver: stats.top_violating_driver,
        },
      });
    } catch (error) {
      logger.error('Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/policy-violations/:id
   * Get a single violation by ID
   */
  static async getViolationById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        'SELECT * FROM policy_violations WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Violation not found' });
        return;
      }

      const row = result.rows[0];
      const violation = {
        id: row.id,
        tenantId: row.tenant_id,
        violationType: row.violation_type,
        severity: row.severity,
        policyName: row.policy_name,
        policyId: row.policy_id,
        description: row.description,
        violationDetails: row.violation_details,
        vehicleId: row.vehicle_id,
        vehicleNumber: row.vehicle_number,
        driverId: row.driver_id,
        driverName: row.driver_name,
        userId: row.user_id,
        userName: row.user_name,
        thresholdValue: row.threshold_value,
        actualValue: row.actual_value,
        difference: row.difference,
        unit: row.unit,
        locationLat: row.location_lat,
        locationLng: row.location_lng,
        locationAddress: row.location_address,
        geofenceId: row.geofence_id,
        geofenceName: row.geofence_name,
        occurredAt: row.occurred_at,
        detectedAt: row.detected_at,
        status: row.status,
        resolution: row.resolution,
        resolutionNotes: row.resolution_notes,
        resolvedAt: row.resolved_at,
        resolvedBy: row.resolved_by,
        resolvedByName: row.resolved_by_name,
        overrideRequested: row.override_requested,
        overrideApproved: row.override_approved,
        overrideRequestedBy: row.override_requested_by,
        overrideRequestedAt: row.override_requested_at,
        overrideApprovedBy: row.override_approved_by,
        overrideApprovedAt: row.override_approved_at,
        overrideReason: row.override_reason,
        notificationSent: row.notification_sent,
        notificationSentAt: row.notification_sent_at,
        notificationRecipients: row.notification_recipients,
        escalationSent: row.escalation_sent,
        escalationSentAt: row.escalation_sent_at,
        requestId: row.request_id,
        workOrderId: row.work_order_id,
        fuelTransactionId: row.fuel_transaction_id,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      res.json({ success: true, data: violation });
    } catch (error) {
      logger.error('Error fetching violation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch violation',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/policy-violations
   * Create a new violation
   */
  static async createViolation(req: Request, res: Response): Promise<void> {
    try {
      const violation = req.body;

      const result = await pool.query(
        `INSERT INTO policy_violations (
          id, tenant_id, violation_type, severity, policy_name, policy_id,
          description, violation_details, vehicle_id, vehicle_number,
          driver_id, driver_name, user_id, user_name, threshold_value,
          actual_value, difference, unit, location_lat, location_lng,
          location_address, geofence_id, geofence_name, occurred_at,
          detected_at, status, request_id, work_order_id, fuel_transaction_id,
          metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
        ) RETURNING *`,
        [
          uuidv4(),
          violation.tenantId,
          violation.violationType,
          violation.severity,
          violation.policyName,
          violation.policyId || null,
          violation.description,
          violation.violationDetails || {},
          violation.vehicleId || null,
          violation.vehicleNumber || null,
          violation.driverId || null,
          violation.driverName || null,
          violation.userId || null,
          violation.userName || null,
          violation.thresholdValue || null,
          violation.actualValue || null,
          violation.difference || null,
          violation.unit || null,
          violation.locationLat || null,
          violation.locationLng || null,
          violation.locationAddress || null,
          violation.geofenceId || null,
          violation.geofenceName || null,
          violation.occurredAt || new Date().toISOString(),
          new Date().toISOString(),
          'open',
          violation.requestId || null,
          violation.workOrderId || null,
          violation.fuelTransactionId || null,
          violation.metadata || {},
        ]
      );

      logger.info('Violation created:', result.rows[0].id);

      res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error creating violation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create violation',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/policy-violations/:id/resolve
   * Resolve a violation
   */
  static async resolveViolation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { resolutionNotes, resolvedBy, resolvedByName } = req.body;

      const result = await pool.query(
        `UPDATE policy_violations
         SET status = 'resolved',
             resolution = 'Resolved',
             resolution_notes = $1,
             resolved_at = NOW(),
             resolved_by = $2,
             resolved_by_name = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [resolutionNotes, resolvedBy, resolvedByName, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Violation not found' });
        return;
      }

      logger.info('Violation resolved:', id);

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Violation resolved successfully',
      });
    } catch (error) {
      logger.error('Error resolving violation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resolve violation',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/policy-violations/:id/override
   * Request override for a violation
   */
  static async requestOverride(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason, requestedBy } = req.body;

      const result = await pool.query(
        `UPDATE policy_violations
         SET override_requested = true,
             override_requested_by = $1,
             override_requested_at = NOW(),
             override_reason = $2,
             status = 'under_review',
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [requestedBy, reason, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Violation not found' });
        return;
      }

      logger.info('Override requested for violation:', id);

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Override request submitted successfully',
      });
    } catch (error) {
      logger.error('Error requesting override:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to request override',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/policy-violations/:id/approve-override
   * Approve override request (admin only)
   */
  static async approveOverride(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { approvedBy, approvedByName } = req.body;

      const result = await pool.query(
        `UPDATE policy_violations
         SET override_approved = true,
             override_approved_by = $1,
             override_approved_at = NOW(),
             status = 'approved_override',
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [approvedBy, id]
      );

      if (result.rows.length === 0) {
        res.status(404).json({ success: false, error: 'Violation not found' });
        return;
      }

      logger.info('Override approved for violation:', id);

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Override approved successfully',
      });
    } catch (error) {
      logger.error('Error approving override:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to approve override',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/policy-violations/:id/comments
   * Get comments for a violation
   */
  static async getComments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `SELECT id, violation_id, user_id, user_name, comment_text, is_internal, created_at
         FROM policy_violation_comments
         WHERE violation_id = $1
         ORDER BY created_at DESC`,
        [id]
      );

      const comments = result.rows.map(row => ({
        id: row.id,
        violationId: row.violation_id,
        userId: row.user_id,
        userName: row.user_name,
        commentText: row.comment_text,
        isInternal: row.is_internal,
        createdAt: row.created_at,
      }));

      res.json({ success: true, data: comments });
    } catch (error) {
      logger.error('Error fetching comments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch comments',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/policy-violations/:id/comments
   * Add a comment to a violation
   */
  static async addComment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { commentText, userId, userName, isInternal = false } = req.body;

      const result = await pool.query(
        `INSERT INTO policy_violation_comments (
          id, violation_id, user_id, user_name, comment_text, is_internal
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [uuidv4(), id, userId, userName, commentText, isInternal]
      );

      const comment = {
        id: result.rows[0].id,
        violationId: result.rows[0].violation_id,
        userId: result.rows[0].user_id,
        userName: result.rows[0].user_name,
        commentText: result.rows[0].comment_text,
        isInternal: result.rows[0].is_internal,
        createdAt: result.rows[0].created_at,
      };

      logger.info('Comment added to violation:', id);

      res.status(201).json({
        success: true,
        data: comment,
        message: 'Comment added successfully',
      });
    } catch (error) {
      logger.error('Error adding comment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add comment',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/policy-violations/trends
   * Get violation trends over time
   */
  static async getTrends(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.query;

      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID is required' });
        return;
      }

      const result = await pool.query(
        `SELECT
          violation_date, violation_type, severity, violation_count,
          resolved_count, open_count, avg_resolution_hours, override_count
         FROM policy_violation_trends
         WHERE tenant_id = $1
         ORDER BY violation_date DESC
         LIMIT 90`,
        [tenantId]
      );

      const trends = result.rows.map(row => ({
        violationDate: row.violation_date,
        violationType: row.violation_type,
        severity: row.severity,
        violationCount: Number(row.violation_count),
        resolvedCount: Number(row.resolved_count),
        openCount: Number(row.open_count),
        avgResolutionHours: Number(row.avg_resolution_hours),
        overrideCount: Number(row.override_count),
      }));

      res.json({ success: true, data: trends });
    } catch (error) {
      logger.error('Error fetching trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch trends',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/policy-violations/export
   * Export violations to CSV, PDF, or Excel
   */
  static async exportViolations(req: Request, res: Response): Promise<void> {
    try {
      const { format, tenantId, filters, includeResolved, includeComments, groupBy } = req.body;

      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Tenant ID is required' });
        return;
      }

      const ViolationExportService = (await import('../services/violation-export.service')).default;

      const options = {
        format,
        tenantId,
        filters,
        includeResolved,
        includeComments,
        groupBy,
      };

      let result: Buffer | string;
      let contentType: string;
      let fileName: string;

      switch (format) {
        case 'csv':
          result = await ViolationExportService.exportToCSV(options);
          contentType = 'text/csv';
          fileName = `violations-${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'pdf':
          result = await ViolationExportService.exportToPDF(options);
          contentType = 'application/pdf';
          fileName = `violations-${new Date().toISOString().split('T')[0]}.pdf`;
          break;

        case 'excel':
          result = await ViolationExportService.exportToExcel(options);
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileName = `violations-${new Date().toISOString().split('T')[0]}.xlsx`;
          break;

        default:
          res.status(400).json({ success: false, error: 'Invalid format. Use csv, pdf, or excel.' });
          return;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(result);

      logger.info('Violations exported', { format, tenantId });
    } catch (error) {
      logger.error('Error exporting violations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export violations',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/policy-violations/compliance-report
   * Generate comprehensive compliance report
   */
  static async generateComplianceReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, reportType, startDate, endDate } = req.body;

      if (!tenantId || !reportType || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters: tenantId, reportType, startDate, endDate',
        });
        return;
      }

      const ViolationExportService = (await import('../services/violation-export.service')).default;

      const report = await ViolationExportService.generateComplianceReport({
        tenantId,
        reportType,
        startDate,
        endDate,
      });

      const fileName = `compliance-report-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(report);

      logger.info('Compliance report generated', { tenantId, reportType });
    } catch (error) {
      logger.error('Error generating compliance report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate compliance report',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default PolicyViolationsController;
