import path from 'path'

import express, { Response } from 'express'

import logger from '../config/logger'; // Wave 21: Add Winston logger
import { NotFoundError, ValidationError } from '../errors/app-error'
import reportScheduler from '../jobs/report-scheduler.job'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import customReportService from '../services/custom-report.service'
import { getErrorMessage } from '../utils/error-handler'
import { safeReadFile, PathTraversalError } from '../utils/safe-file-operations'


const router = express.Router()
router.use(authenticateJWT)

// GET /api/custom-reports/data-sources - List available data sources
router.get(
  '/data-sources',
  requirePermission('report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const dataSources = await customReportService.getDataSources()
      res.json(dataSources)
    } catch (error) {
      logger.error('Get data sources error:', error) // Wave 21: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/custom-reports/templates - List report templates
router.get(
  '/templates',
  requirePermission('report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const templates = await customReportService.getTemplates(req.user!.tenant_id)
      res.json(templates)
    } catch (error) {
      logger.error('Get templates error:', error) // Wave 21: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/custom-reports/from-template/:templateId - Create report from template
router.post(
  '/from-template/:templateId',
 csrfProtection, requirePermission('report:generate:global'),
  auditLog({ action: 'CREATE', resourceType: 'custom_report' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { templateId } = req.params
      const { report_name } = req.body

      if (!report_name) {
        throw new ValidationError("Report name is required")
      }

      const report = await customReportService.createFromTemplate(
        templateId,
        req.user!.tenant_id,
        req.user!.id,
        report_name
      )

      res.status(201).json(report)
    } catch (error) {
      logger.error('Create from template error:', error) // Wave 21: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/custom-reports - List user's reports
router.get(
  '/',
  requirePermission('report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const reports = await customReportService.listReports(
        req.user!.tenant_id,
        req.user!.id
      )
      res.json(reports)
    } catch (error) {
      logger.error('List reports error:', error) // Wave 21: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/custom-reports/:id - Get report by ID
router.get(
  '/:id',
  requirePermission('report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params

      const report = await customReportService.getReportById(
        id,
        req.user!.tenant_id
      )

      if (!report) {
        throw new NotFoundError("Report not found")
      }

      res.json(report)
    } catch (error) {
      logger.error('Get report error:', error) // Wave 21: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/custom-reports - Create new report
router.post(
  '/',
 csrfProtection, requirePermission('report:generate:global'),
  auditLog({ action: 'CREATE', resourceType: 'custom_report' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const reportData = req.body

      if (!reportData.report_name || !reportData.data_sources || !reportData.columns) {
        return res.status(400).json({
          error: 'Missing required fields: report_name, data_sources, columns'
        })
      }

      const report = await customReportService.createReport(
        req.user!.tenant_id,
        req.user!.id,
        reportData
      )

      res.status(201).json(report)
    } catch (error) {
      logger.error('Create report error:', error) // Wave 21: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /api/custom-reports/:id - Update report
router.put(
  '/:id',
 csrfProtection,  csrfProtection, requirePermission('report:generate:global'),
  auditLog({ action: 'UPDATE', resourceType: 'custom_report' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const reportData = req.body

      const report = await customReportService.updateReport(
        id,
        req.user!.tenant_id,
        req.user!.id,
        reportData
      )

      res.json(report)
    } catch (error) {
      logger.error('Update report error:', error) // Wave 21: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /api/custom-reports/:id - Delete report
router.delete(
  '/:id',
 csrfProtection,  csrfProtection, requirePermission('report:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'custom_report' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params

      await customReportService.deleteReport(id, req.user!.tenant_id)

      res.json({ message: 'Report deleted successfully' })
    } catch (error) {
      logger.error('Delete report error:', error) // Wave 21: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/custom-reports/:id/execute - Execute report
router.post(
  '/:id/execute',
 csrfProtection,  csrfProtection, requirePermission('report:generate:global'),
  auditLog({ action: 'EXECUTE', resourceType: 'custom_report' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const { format = 'csv' } = req.body

      if (!['xlsx', 'csv', 'pdf'].includes(format)) {
        throw new ValidationError("Invalid format. Must be xlsx, csv, or pdf")
      }

      const result = await customReportService.executeReport(
        id,
        req.user!.tenant_id,
        req.user!.id,
        format
      )

      res.json(result)
    } catch (error) {
      logger.error('Execute report error:', error) // Wave 21: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/custom-reports/:id/history - Get execution history
router.get(
  '/:id/history',
  requirePermission('report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params

      const history = await customReportService.getExecutionHistory(
        id,
        req.user!.tenant_id
      )

      res.json(history)
    } catch (error) {
      logger.error('Get execution history error:', error) // Wave 21: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/custom-reports/:id/download/:executionId - Download report file
router.get(
  '/:id/download/:executionId',
  requirePermission('report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id, executionId } = req.params

      // Get execution details
      const execution = await customReportService.getExecutionHistory(id, req.user!.tenant_id)
      const executionRecord = execution.find(e => e.id === executionId)

      if (!executionRecord) {
        throw new NotFoundError("Execution not found")
      }

      if (executionRecord.status !== 'completed') {
        throw new ValidationError("Report execution not completed")
      }

      const filePath = executionRecord.file_url

      // SECURITY: Define allowed reports directory
      // Reports should be stored in a dedicated directory
      const reportsDirectory = process.env.REPORTS_DIR || path.join(process.cwd(), 'reports')

      // SECURITY: Safely read file using path validation
      try {
        const fileBuffer = await safeReadFile(filePath, reportsDirectory) as Buffer

        // Set appropriate content type
        const extension = path.extname(filePath).toLowerCase().substring(1)
        let contentType = 'application/octet-stream'

        if (extension === 'xlsx') {
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        } else if (extension === 'csv') {
          contentType = 'text/csv'
        } else if (extension === 'pdf') {
          contentType = 'application/pdf'
        }

        // Send file
        res.setHeader('Content-Type', contentType)
        res.setHeader('Content-Disposition', `attachment; filename="${executionRecord.id}.${extension}"`)
        res.send(fileBuffer)
      } catch (error) {
        if (error instanceof PathTraversalError) {
          logger.error(`Security violation - Path traversal attempt:`, getErrorMessage(error)) // Wave 21: Winston logger
          return res.status(403).json({ error: 'Access denied' })
        }
        logger.error('File access error:', error) // Wave 21: Winston logger
        throw new NotFoundError("Report file not found")
      }
    } catch (error) {
      logger.error('Download report error:', error) // Wave 21: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/custom-reports/:id/schedule - Schedule report
router.post(
  '/:id/schedule',
 csrfProtection, requirePermission('report:generate:global'),
  auditLog({ action: 'CREATE', resourceType: 'report_schedule' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const { schedule_type, schedule_config, recipients, format } = req.body

      if (!schedule_type || !schedule_config || !recipients || !format) {
        return res.status(400).json({
          error: 'Missing required fields: schedule_type, schedule_config, recipients, format'
        })
      }

      if (!['daily', 'weekly', 'monthly', 'quarterly', 'custom'].includes(schedule_type)) {
        return res.status(400).json({
          error: 'Invalid schedule_type. Must be daily, weekly, monthly, quarterly, or custom'
        })
      }

      if (!['xlsx', 'csv', 'pdf'].includes(format)) {
        throw new ValidationError("Invalid format. Must be xlsx, csv, or pdf")
      }

      if (!Array.isArray(recipients) || recipients.length === 0) {
        throw new ValidationError("Recipients must be a non-empty array of email addresses")
      }

      const scheduleId = await reportScheduler.createSchedule(
        id,
        schedule_type,
        schedule_config,
        recipients,
        format,
        req.user!.id
      )

      res.status(201).json({ scheduleId, message: 'Report scheduled successfully' })
    } catch (error) {
      logger.error('Schedule report error:', error) // Wave 21: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/custom-reports/:id/schedules - Get schedules for report
router.get(
  '/:id/schedules',
  requirePermission('report:view:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params

      const schedules = await reportScheduler.getSchedulesForReport(id)

      res.json(schedules)
    } catch (error) {
      logger.error('Get schedules error:', error) // Wave 21: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /api/custom-reports/:id/schedules/:scheduleId - Update schedule
router.put(
  '/:id/schedules/:scheduleId',
 csrfProtection, requirePermission('report:generate:global'),
  auditLog({ action: 'UPDATE', resourceType: 'report_schedule' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { scheduleId } = req.params
      const updates = req.body

      await reportScheduler.updateSchedule(scheduleId, updates)

      res.json({ message: 'Schedule updated successfully' })
    } catch (error) {
      logger.error('Update schedule error:', error) // Wave 21: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /api/custom-reports/:id/schedules/:scheduleId - Delete schedule
router.delete(
  '/:id/schedules/:scheduleId',
 csrfProtection, requirePermission('report:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'report_schedule' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { scheduleId } = req.params

      await reportScheduler.deleteSchedule(scheduleId)

      res.json({ message: 'Schedule deleted successfully' })
    } catch (error) {
      logger.error('Delete schedule error:', error) // Wave 21: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
