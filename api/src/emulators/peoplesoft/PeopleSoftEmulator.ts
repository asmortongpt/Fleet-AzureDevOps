/**
 * PeopleSoft Emulator API
 *
 * Realistic simulation of PeopleSoft Finance interfaces for AssetWorks replacement integration testing
 *
 * Features:
 * - Chartfield validation (dept/fund/account/project)
 * - GL journal posting and tracking
 * - AP voucher posting (optional)
 * - Async callback confirmation to AMS
 * - Configurable failure scenarios
 *
 * @see Documentation: Section 1 - PeopleSoft Emulator API
 */

import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'

// ==================== TYPE DEFINITIONS ====================

export interface Chartfield {
  business_unit: string
  company: string
  department: string
  fund: string
  account: string
  operating_unit: string
  program?: string
  project_id?: string
  activity_id?: string
}

export interface ChartfieldValidationRequest {
  business_unit: string
  company: string
  department: string
  fund: string
  account: string
  operating_unit: string
  program?: string
  project_id?: string
  activity_id?: string
}

export interface ChartfieldValidationResponse {
  is_valid: boolean
  normalized?: Chartfield
  warnings: ValidationIssue[]
  errors: ValidationIssue[]
}

export interface ValidationIssue {
  field: string
  code: string
  message: string
}

export interface JournalLine {
  line_nbr: number
  account: string
  deptid: string
  fund_code: string
  operating_unit: string
  project_id?: string
  activity_id?: string
  amount: number
  dr_cr: 'DR' | 'CR'
  reference?: {
    work_order_number?: string
    equipment_key?: string
    transaction_date?: string
    [key: string]: any
  }
}

export interface JournalHeader {
  business_unit: string
  journal_date: string
  source: string
  reference: string
  description: string
  posting_mode: 'SYNC' | 'ASYNC'
}

export interface JournalPostRequest {
  journal_header: JournalHeader
  lines: JournalLine[]
}

export interface JournalPostResponse {
  journal_id: string | null
  status: 'POSTED' | 'PROCESSING' | 'REJECTED'
  accepted_timestamp?: string
  posted_timestamp?: string
  errors?: JournalError[]
}

export interface JournalError {
  line_nbr?: number
  code: string
  message: string
  field?: string
}

export interface JournalStatus {
  journal_id: string
  status: 'POSTED' | 'PROCESSING' | 'REJECTED'
  header: JournalHeader
  line_count: number
  posted_timestamp?: string
  errors: JournalError[]
}

export interface APVoucherRequest {
  vendor_id: string
  invoice_id: string
  invoice_date: string
  gross_amount: number
  distribution: APDistribution[]
}

export interface APDistribution {
  account: string
  deptid: string
  fund_code: string
  amount: number
  reference?: {
    work_order_number?: string
    sublet_vendor?: string
    [key: string]: any
  }
}

export interface APVoucherResponse {
  voucher_id: string
  status: 'APPROVED' | 'PENDING' | 'REJECTED'
  errors?: JournalError[]
}

export interface EmulatorScenario {
  scenario: string
  enabled: boolean
  params?: Record<string, any>
}

// ==================== PEOPLESOFT EMULATOR CLASS ====================

export class PeopleSoftEmulator {
  private chartfields: Map<string, Chartfield> = new Map()
  private journals: Map<string, JournalStatus> = new Map()
  private vouchers: Map<string, APVoucherResponse> = new Map()
  private idempotencyKeys: Map<string, any> = new Map()
  private scenarios: Map<string, EmulatorScenario> = new Map()
  private journalCounter: number = 456
  private voucherCounter: number = 9911

  constructor() {
    this.seedChartfields()
    this.initializeScenarios()
  }

  // ==================== SEED DATA ====================

  private seedChartfields(): void {
    // Import Tallahassee seed data
    const { TALLAHASSEE_CHARTFIELDS // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    } = require('./tallahassee-seed-data')

    // Load all valid City of Tallahassee chartfield combinations
    TALLAHASSEE_CHARTFIELDS.forEach((tallyChartfield: any) => {
      if (!tallyChartfield.is_active) return

      const chartfield: Chartfield = {
        business_unit: tallyChartfield.business_unit,
        company: tallyChartfield.company,
        department: tallyChartfield.department,
        fund: tallyChartfield.fund,
        account: tallyChartfield.account,
        operating_unit: tallyChartfield.operating_unit,
        program: tallyChartfield.program,
        project_id: tallyChartfield.project_id,
        activity_id: tallyChartfield.activity_id
      }

      const key = this.getChartfieldKey(chartfield)
      this.chartfields.set(key, chartfield)
    })

    console.log(`[PeopleSoft Emulator] Loaded ${this.chartfields.size} City of Tallahassee chartfield combinations`)
  }

  private initializeScenarios(): void {
    this.scenarios.set('CLOSED_PERIOD', { scenario: 'CLOSED_PERIOD', enabled: false })
    this.scenarios.set('INVALID_GL_ACCOUNT', { scenario: 'INVALID_GL_ACCOUNT', enabled: false })
    this.scenarios.set('INVALID_DEPARTMENT', { scenario: 'INVALID_DEPARTMENT', enabled: false })
    this.scenarios.set('PROJECT_REQUIRED', { scenario: 'PROJECT_REQUIRED', enabled: false })
    this.scenarios.set('ASYNC_DELAY', { scenario: 'ASYNC_DELAY', enabled: false })
    this.scenarios.set('RATE_LIMITING', { scenario: 'RATE_LIMITING', enabled: false })
  }

  private getChartfieldKey(cf: ChartfieldValidationRequest): string {
    return `${cf.business_unit}:${cf.company}:${cf.department}:${cf.fund}:${cf.account}`
  }

  // ==================== VALIDATION METHODS ====================

  validateChartfields(request: ChartfieldValidationRequest): ChartfieldValidationResponse {
    const errors: ValidationIssue[] = []
    const warnings: ValidationIssue[] = []

    // Check for enabled scenarios
    if (this.scenarios.get('INVALID_DEPARTMENT')?.enabled && request.department === '17020') {
      errors.push({
        field: 'department',
        code: 'INACTIVE_VALUE',
        message: 'Department is inactive'
      })
    }

    if (this.scenarios.get('INVALID_GL_ACCOUNT')?.enabled) {
      errors.push({
        field: 'account',
        code: 'INVALID_VALUE',
        message: 'Account not found'
      })
    }

    if (this.scenarios.get('PROJECT_REQUIRED')?.enabled && !request.project_id) {
      errors.push({
        field: 'project_id',
        code: 'REQUIRED_FIELD',
        message: 'Project ID is required for this account'
      })
    }

    // Check if chartfield exists in seed data
    const key = this.getChartfieldKey(request)
    const exists = this.chartfields.has(key)

    if (!exists && errors.length === 0) {
      errors.push({
        field: 'chartfield',
        code: 'INVALID_COMBINATION',
        message: 'Chartfield combination not found'
      })
    }

    const is_valid = errors.length === 0

    return {
      is_valid,
      normalized: is_valid ? this.chartfields.get(key) : undefined,
      warnings,
      errors
    }
  }

  // ==================== JOURNAL POSTING METHODS ====================

  postJournal(request: JournalPostRequest, idempotencyKey?: string): JournalPostResponse {
    // Check idempotency
    if (idempotencyKey && this.idempotencyKeys.has(idempotencyKey)) {
      return this.idempotencyKeys.get(idempotencyKey)
    }

    // Check for closed period scenario
    if (this.scenarios.get('CLOSED_PERIOD')?.enabled) {
      const scenario = this.scenarios.get('CLOSED_PERIOD')!
      const journalDate = new Date(request.journal_header.journal_date)
      const start = scenario.params?.start ? new Date(scenario.params.start) : null
      const end = scenario.params?.end ? new Date(scenario.params.end) : null

      if (start && end && journalDate >= start && journalDate <= end) {
        const response: JournalPostResponse = {
          journal_id: null,
          status: 'REJECTED',
          errors: [{
            code: 'PERIOD_CLOSED',
            message: `Period ${request.journal_header.journal_date} is closed for posting`
          }]
        }

        if (idempotencyKey) {
          this.idempotencyKeys.set(idempotencyKey, response)
        }

        return response
      }
    }

    // Validate journal lines
    const lineErrors: JournalError[] = []

    request.lines.forEach((line) => {
      const cfRequest: ChartfieldValidationRequest = {
        business_unit: request.journal_header.business_unit,
        company: 'FLEET',
        department: line.deptid,
        fund: line.fund_code,
        account: line.account,
        operating_unit: line.operating_unit,
        project_id: line.project_id,
        activity_id: line.activity_id
      }

      const validation = this.validateChartfields(cfRequest)

      if (!validation.is_valid) {
        validation.errors.forEach((error) => {
          lineErrors.push({
            line_nbr: line.line_nbr,
            code: error.code,
            message: error.message,
            field: error.field
          })
        })
      }
    })

    // If validation errors, reject
    if (lineErrors.length > 0) {
      const response: JournalPostResponse = {
        journal_id: null,
        status: 'REJECTED',
        errors: lineErrors
      }

      if (idempotencyKey) {
        this.idempotencyKeys.set(idempotencyKey, response)
      }

      return response
    }

    // Generate journal ID
    const journal_id = `JRNL${String(this.journalCounter++).padStart(6, '0')}`
    const timestamp = new Date().toISOString()

    // Handle posting mode
    if (request.journal_header.posting_mode === 'ASYNC') {
      const response: JournalPostResponse = {
        journal_id,
        status: 'PROCESSING',
        accepted_timestamp: timestamp
      }

      // Store journal status
      this.journals.set(journal_id, {
        journal_id,
        status: 'PROCESSING',
        header: request.journal_header,
        line_count: request.lines.length,
        errors: []
      })

      if (idempotencyKey) {
        this.idempotencyKeys.set(idempotencyKey, response)
      }

      // Simulate async processing
      const delay = this.scenarios.get('ASYNC_DELAY')?.enabled ?
        (this.scenarios.get('ASYNC_DELAY')!.params?.delay || 5000) : 2000

      setTimeout(() => {
        this.completeAsyncJournal(journal_id, request)
      }, delay)

      return response
    } else {
      // SYNC mode - post immediately
      const response: JournalPostResponse = {
        journal_id,
        status: 'POSTED',
        posted_timestamp: timestamp
      }

      this.journals.set(journal_id, {
        journal_id,
        status: 'POSTED',
        header: request.journal_header,
        line_count: request.lines.length,
        posted_timestamp: timestamp,
        errors: []
      })

      if (idempotencyKey) {
        this.idempotencyKeys.set(idempotencyKey, response)
      }

      return response
    }
  }

  private completeAsyncJournal(journal_id: string, request: JournalPostRequest): void {
    const journal = this.journals.get(journal_id)
    if (!journal) return

    journal.status = 'POSTED'
    journal.posted_timestamp = new Date().toISOString()

    // TODO: Send callback to AMS
    // This would be configured via environment variable for AMS_BASE_URL
    console.log(`[PeopleSoft Emulator] Journal ${journal_id} posted - callback would be sent to AMS`)
  }

  getJournalStatus(journal_id: string): JournalStatus | null {
    return this.journals.get(journal_id) || null
  }

  // ==================== AP VOUCHER METHODS ====================

  postAPVoucher(request: APVoucherRequest, idempotencyKey?: string): APVoucherResponse {
    // Check idempotency
    if (idempotencyKey && this.idempotencyKeys.has(idempotencyKey)) {
      return this.idempotencyKeys.get(idempotencyKey)
    }

    // Validate distributions
    const errors: JournalError[] = []

    request.distribution.forEach((dist, idx) => {
      const cfRequest: ChartfieldValidationRequest = {
        business_unit: 'CITY',
        company: 'FLEET',
        department: dist.deptid,
        fund: dist.fund_code,
        account: dist.account,
        operating_unit: 'FLEET'
      }

      const validation = this.validateChartfields(cfRequest)

      if (!validation.is_valid) {
        validation.errors.forEach((error) => {
          errors.push({
            line_nbr: idx + 1,
            code: error.code,
            message: error.message,
            field: error.field
          })
        })
      }
    })

    if (errors.length > 0) {
      const response: APVoucherResponse = {
        voucher_id: '',
        status: 'REJECTED',
        errors
      }

      if (idempotencyKey) {
        this.idempotencyKeys.set(idempotencyKey, response)
      }

      return response
    }

    // Create voucher
    const voucher_id = `VCHR${String(this.voucherCounter++).padStart(6, '0')}`

    const response: APVoucherResponse = {
      voucher_id,
      status: 'APPROVED'
    }

    this.vouchers.set(voucher_id, response)

    if (idempotencyKey) {
      this.idempotencyKeys.set(idempotencyKey, response)
    }

    return response
  }

  // ==================== SCENARIO CONTROL ====================

  setScenario(scenarioRequest: EmulatorScenario): void {
    this.scenarios.set(scenarioRequest.scenario, scenarioRequest)
  }

  getScenario(scenario: string): EmulatorScenario | undefined {
    return this.scenarios.get(scenario)
  }

  getAllScenarios(): EmulatorScenario[] {
    return Array.from(this.scenarios.values())
  }
}

// ==================== EXPRESS ROUTER ====================

export function createPeopleSoftRouter(): Router {
  const router = Router()
  const emulator = new PeopleSoftEmulator()

  // ==================== AUTH ENDPOINTS ====================

  router.post('/v1/auth/token', (req: Request, res: Response) => {
    const { client_id, client_secret, grant_type } = req.body

    if (!client_id || !client_secret || grant_type !== 'client_credentials') {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Invalid token request'
      })
    }

    res.json({
      access_token: `ps_${uuidv4()}`,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'finance.write finance.read'
    })
  })

  // ==================== CHARTFIELD VALIDATION ====================

  router.post('/v1/finance/chartfields/validate', (req: Request, res: Response) => {
    try {
      const validation = emulator.validateChartfields(req.body)
      res.json(validation)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  })

  // ==================== JOURNAL POSTING ====================

  router.post('/v1/finance/gl/journals', (req: Request, res: Response) => {
    try {
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined
      const result = emulator.postJournal(req.body, idempotencyKey)

      if (result.status === 'REJECTED') {
        return res.status(400).json(result)
      }

      res.status(result.status === 'POSTED' ? 200 : 202).json(result)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    }
  })

  router.get('/v1/finance/gl/journals/:journal_id', (req: Request, res: Response) => {
    try {
      const journal = emulator.getJournalStatus(req.params.journal_id)

      if (!journal) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Journal not found'
          }
        })
      }

      res.json(journal)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  })

  // ==================== AP VOUCHER POSTING ====================

  router.post('/v1/ap/vouchers', (req: Request, res: Response) => {
    try {
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined
      const result = emulator.postAPVoucher(req.body, idempotencyKey)

      if (result.status === 'REJECTED') {
        return res.status(400).json(result)
      }

      res.json(result)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  })

  // ==================== EMULATOR CONTROL ====================

  router.post('/v1/emulator/control', (req: Request, res: Response) => {
    try {
      emulator.setScenario(req.body)
      res.json({ status: 'SUCCESS', scenario: req.body.scenario })
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to set scenario'
        }
      })
    }
  })

  router.get('/v1/emulator/control', (req: Request, res: Response) => {
    try {
      const scenarios = emulator.getAllScenarios()
      res.json({ scenarios })
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get scenarios'
        }
      })
    }
  })

  router.get('/v1/emulator/control/:scenario', (req: Request, res: Response) => {
    try {
      const scenario = emulator.getScenario(req.params.scenario)

      if (!scenario) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Scenario not found'
          }
        })
      }

      res.json(scenario)
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get scenario'
        }
      })
    }
  })

  return router
}

export default {
  PeopleSoftEmulator,
  createPeopleSoftRouter
}
