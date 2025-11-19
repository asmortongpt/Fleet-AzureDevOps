import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import customReportService from '../services/custom-report.service'
import reportScheduler from '../jobs/report-scheduler.job'
import fs from 'fs/promises'
import path from 'path'
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
      console.error('Get data sources error:', error)
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
      console.error('Get templates error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/custom-reports/from-template/:templateId - Create report from template
router.post(
  '/from-template/:templateId',
  requirePermission('report:generate:global'),
  auditLog({ action: 'CREATE', resourceType: 'custom_report' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { templateId } = req.params
      const { report_name } = req.body

      if (!report_name) {
        return res.status(400).json({ error: 'Report name is required' })
      }

      const report = await customReportService.createFromTemplate(
        templateId,
        req.user!.tenant_id,
        req.user!.id,
        report_name
      )

      res.status(201).json(report)
    } catch (error) {
      console.error('Create from template error:', error)
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
      console.error('List reports error:', error)
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
        return res.status(404).json({ error: 'Report not found' })
      }

      res.json(report)
    } catch (error) {
      console.error('Get report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/custom-reports - Create new report
router.post(
  '/',
  requirePermission('report:generate:global'),
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
      console.error('Create report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /api/custom-reports/:id - Update report
router.put(
  '/:id',
  requirePermission('report:generate:global'),
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
      console.error('Update report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /api/custom-reports/:id - Delete report
router.delete(
  '/:id',
  requirePermission('report:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'custom_report' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params

      await customReportService.deleteReport(id, req.user!.tenant_id)

      res.json({ message: 'Report deleted successfully' })
    } catch (error) {
      console.error('Delete report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/custom-reports/:id/execute - Execute report
router.post(
  '/:id/execute',
  requirePermission('report:generate:global'),
  auditLog({ action: 'EXECUTE', resourceType: 'custom_report' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const { format = 'csv' } = req.body

      if (!['xlsx', 'csv', 'pdf'].includes(format)) {
        return res.status(400).json({ error: 'Invalid format. Must be xlsx, csv, or pdf' })
      }

      const result = await customReportService.executeReport(
        id,
        req.user!.tenant_id,
        req.user!.id,
        format
      )

      res.json(result)
    } catch (error) {
      console.error('Execute report error:', error)
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
      console.error('Get execution history error:', error)
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
        return res.status(404).json({ error: 'Execution not found' })
      }

      if (executionRecord.status !== 'completed') {
        return res.status(400).json({ error: 'Report execution not completed' })
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
          console.error('Security violation - Path traversal attempt:', error.message)
          return res.status(403).json({ error: 'Access denied' })
        }
        console.error('File access error:', error)
        return res.status(404).json({ error: 'Report file not found' })
      }
    } catch (error) {
      console.error('Download report error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/custom-reports/:id/schedule - Schedule report
router.post(
  '/:id/schedule',
  requirePermission('report:generate:global'),
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
        return res.status(400).json({ error: 'Invalid format. Must be xlsx, csv, or pdf' })
      }

      if (!Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: 'Recipients must be a non-empty array of email addresses' })
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
      console.error('Schedule report error:', error)
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
      console.error('Get schedules error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /api/custom-reports/:id/schedules/:scheduleId - Update schedule
router.put(
  '/:id/schedules/:scheduleId',
  requirePermission('report:generate:global'),
  auditLog({ action: 'UPDATE', resourceType: 'report_schedule' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { scheduleId } = req.params
      const updates = req.body

      await reportScheduler.updateSchedule(scheduleId, updates)

      res.json({ message: 'Schedule updated successfully' })
    } catch (error) {
      console.error('Update schedule error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /api/custom-reports/:id/schedules/:scheduleId - Delete schedule
router.delete(
  '/:id/schedules/:scheduleId',
  requirePermission('report:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'report_schedule' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { scheduleId } = req.params

      await reportScheduler.deleteSchedule(scheduleId)

      res.json({ message: 'Schedule deleted successfully' })
    } catch (error) {
      console.error('Delete schedule error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
