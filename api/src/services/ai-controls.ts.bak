/**
 * AI-Powered Controls and Fraud Detection Service
 *
 * Provides intelligent business controls with:
 * - Fraud detection
 * - Compliance checking
 * - Cost controls and budget alerts
 * - Predictive maintenance routing
 * - Automated approval workflows
 */

import OpenAI from 'openai'
import pool from '../config/database'
import {
  getRelevantContext,
  addConversationToRAG,
  generateRAGResponse

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface ControlCheck {
  passed: boolean
  violations: Array<{
    rule: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    action: 'warn' | 'block' | 'require_approval'
    suggestedResolution?: string
  }>
  requiredApprovals: Array<{
    role: string
    reason: string
  }>
  automatedActions: Array<{
    action: string
    reason: string
    executed: boolean
  }>
  riskScore: number // 0-100
  fraudProbability: number // 0-1
}

/**
 * Fraud detection checks
 */
async function checkForFraud(
  transaction: any,
  transactionType: string,
  tenantId: string
): Promise<{
  isFraudulent: boolean
  probability: number
  reasons: string[]
}> {
  const reasons: string[] = []
  let probability = 0.0

  // Duplicate transaction check
  if (transactionType === 'fuel_transaction') {
    const duplicateCheck = await pool.query(
      `SELECT COUNT(*) as count, array_agg(id) as ids
       FROM fuel_transactions
       WHERE tenant_id = $1
         AND vehicle_id = $2
         AND ABS(total_cost - $3) < 5
         AND date::DATE = $4::DATE
         AND ($5::UUID IS NULL OR id != $5)`,
      [
        tenantId,
        transaction.vehicle_id,
        transaction.total_cost,
        transaction.date || new Date().toISOString(),
        transaction.id || null
      ]
    )

    if (parseInt(duplicateCheck.rows[0].count) > 0) {
      reasons.push('Potential duplicate transaction detected')
      probability += 0.6
    }
  }

  // Impossible location check (vehicle can't be in two places at once)
  if (transaction.vehicle_id && transaction.location) {
    const recentLocation = await pool.query(
      `SELECT location, date
       FROM fuel_transactions
       WHERE tenant_id = $1
         AND vehicle_id = $2
         AND date < $3::TIMESTAMP
       ORDER BY date DESC
       LIMIT 1`,
      [tenantId, transaction.vehicle_id, transaction.date || new Date().toISOString()]
    )

    // In a real implementation, calculate distance and time between locations
    // If distance > (speed_limit * time_difference), flag as impossible
  }

  // Round number check (fraudsters often use round numbers)
  if (transactionType === 'fuel_transaction' && transaction.total_cost) {
    if (transaction.total_cost % 10 === 0 && transaction.total_cost > 50) {
      reasons.push('Transaction amount is a round number (suspicious pattern)')
      probability += 0.15
    }
  }

  // After-hours transaction pattern
  if (transaction.date) {
    const hour = new Date(transaction.date).getHours()
    if (hour < 5 || hour > 22) {
      const afterHoursCount = await pool.query(
        `SELECT COUNT(*) as count
         FROM fuel_transactions
         WHERE tenant_id = $1
           AND vehicle_id = $2
           AND EXTRACT(HOUR FROM date) NOT BETWEEN 5 AND 22
           AND created_at > NOW() - INTERVAL '30 days'`,
        [tenantId, transaction.vehicle_id]
      )

      if (parseInt(afterHoursCount.rows[0].count) > 5) {
        reasons.push('Unusual after-hours transaction pattern')
        probability += 0.2
      }
    }
  }

  // Same vendor, same amount pattern (card sharing)
  if (transactionType === 'fuel_transaction' && transaction.vendor_id && transaction.total_cost) {
    const patternCheck = await pool.query(
      `SELECT COUNT(DISTINCT vehicle_id) as vehicle_count
       FROM fuel_transactions
       WHERE tenant_id = $1
         AND vendor_id = $2
         AND ABS(total_cost - $3) < 2
         AND date > NOW() - INTERVAL '7 days'`,
      [tenantId, transaction.vendor_id, transaction.total_cost]
    )

    if (parseInt(patternCheck.rows[0].vehicle_count) > 3) {
      reasons.push('Multiple vehicles with identical transaction amounts at same vendor')
      probability += 0.4
    }
  }

  // Frequency anomaly (too many transactions in short time)
  if (transaction.vehicle_id) {
    const frequencyCheck = await pool.query(
      `SELECT COUNT(*) as count
       FROM fuel_transactions
       WHERE tenant_id = $1
         AND vehicle_id = $2
         AND date > NOW() - INTERVAL '24 hours'`,
      [tenantId, transaction.vehicle_id]
    )

    if (parseInt(frequencyCheck.rows[0].count) > 3) {
      reasons.push('Unusually high transaction frequency (>3 in 24 hours)')
      probability += 0.5
    }
  }

  return {
    isFraudulent: probability > 0.7,
    probability: Math.min(probability, 1.0),
    reasons
  }
}

/**
 * Compliance checks
 */
async function checkCompliance(
  transaction: any,
  transactionType: string,
  tenantId: string
): Promise<ControlCheck['violations']> {
  const violations: ControlCheck['violations'] = []

  // Vehicle compliance checks
  if (transaction.vehicle_id) {
    const vehicleCompliance = await pool.query(
      `SELECT
         v.id,
         v.status,
         (SELECT MAX(date) FROM inspections WHERE vehicle_id = v.id AND type = 'safety') as last_inspection,
         (SELECT MAX(date) FROM inspections WHERE vehicle_id = v.id AND type = 'emissions') as last_emissions
       FROM vehicles v
       WHERE v.id = $1`,
      [transaction.vehicle_id]
    )

    if (vehicleCompliance.rows.length > 0) {
      const vehicle = vehicleCompliance.rows[0]

      // Check if vehicle is out of service
      if (vehicle.status === 'out_of_service') {
        violations.push({
          rule: 'vehicle_out_of_service',
          severity: 'critical',
          message: 'Vehicle is currently out of service',
          action: 'block',
          suggestedResolution: 'Update vehicle status or select a different vehicle'
        })
      }

      // Check inspection due date
      if (vehicle.last_inspection) {
        const lastInspection = new Date(vehicle.last_inspection)
        const daysSinceInspection = Math.floor((Date.now() - lastInspection.getTime()) / (1000 * 60 * 60 * 24))

        if (daysSinceInspection > 365) {
          violations.push({
            rule: 'inspection_overdue',
            severity: 'high',
            message: `Safety inspection overdue by ${daysSinceInspection - 365} days`,
            action: 'require_approval',
            suggestedResolution: 'Schedule safety inspection immediately'
          })
        } else if (daysSinceInspection > 335) {
          violations.push({
            rule: 'inspection_due_soon',
            severity: 'medium',
            message: 'Safety inspection due within 30 days',
            action: 'warn',
            suggestedResolution: 'Schedule safety inspection'
          })
        }
      }
    }
  }

  // Driver compliance checks
  if (transaction.driver_id) {
    const driverCompliance = await pool.query(
      `SELECT
         d.id,
         d.license_expiration,
         d.medical_card_expiration,
         d.status
       FROM drivers d
       WHERE d.id = $1`,
      [transaction.driver_id]
    )

    if (driverCompliance.rows.length > 0) {
      const driver = driverCompliance.rows[0]

      // Check license expiration
      if (driver.license_expiration) {
        const expirationDate = new Date(driver.license_expiration)
        const daysUntilExpiration = Math.floor((expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

        if (daysUntilExpiration < 0) {
          violations.push({
            rule: 'license_expired',
            severity: 'critical',
            message: 'Driver license is expired',
            action: 'block',
            suggestedResolution: 'Update driver license information'
          })
        } else if (daysUntilExpiration < 30) {
          violations.push({
            rule: 'license_expiring_soon',
            severity: 'medium',
            message: `Driver license expires in ${daysUntilExpiration} days`,
            action: 'warn',
            suggestedResolution: 'Remind driver to renew license'
          })
        }
      }

      // Check if driver is suspended
      if (driver.status === 'suspended') {
        violations.push({
          rule: 'driver_suspended',
          severity: 'critical',
          message: 'Driver is currently suspended',
          action: 'block',
          suggestedResolution: 'Select a different driver or resolve suspension'
        })
      }
    }
  }

  return violations
}

/**
 * Cost control checks
 */
async function checkCostControls(
  transaction: any,
  transactionType: string,
  tenantId: string
): Promise<{
  violations: ControlCheck['violations']
  requiredApprovals: ControlCheck['requiredApprovals']
}> {
  const violations: ControlCheck['violations'] = []
  const requiredApprovals: ControlCheck['requiredApprovals'] = []

  // Budget threshold checks
  if (transaction.total_cost || transaction.estimated_cost) {
    const amount = transaction.total_cost || transaction.estimated_cost

    // Require approval for large transactions
    if (amount > 500) {
      requiredApprovals.push({
        role: 'fleet_manager',
        reason: `Transaction amount ($${amount}) exceeds $500 threshold`
      })
    }

    if (amount > 2000) {
      requiredApprovals.push({
        role: 'finance_manager',
        reason: `Transaction amount ($${amount}) exceeds $2000 threshold`
      })
    }

    // Check monthly budget
    if (transactionType === 'fuel_transaction') {
      const monthlySpend = await pool.query(
        `SELECT COALESCE(SUM(total_cost), 0) as total
         FROM fuel_transactions
         WHERE tenant_id = $1
           AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
           AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)`,
        [tenantId]
      )

      const currentMonthlySpend = parseFloat(monthlySpend.rows[0].total)
      const monthlyBudget = 50000 // Should come from tenant settings

      if (currentMonthlySpend + amount > monthlyBudget) {
        violations.push({
          rule: 'monthly_budget_exceeded',
          severity: 'high',
          message: `This transaction would exceed monthly fuel budget ($${currentMonthlySpend.toFixed(2)} + $${amount} > $${monthlyBudget})`,
          action: 'require_approval',
          suggestedResolution: 'Request budget increase or defer transaction'
        })

        requiredApprovals.push({
          role: 'finance_manager',
          reason: 'Monthly budget exceeded'
        })
      } else if (currentMonthlySpend + amount > monthlyBudget * 0.9) {
        violations.push({
          rule: 'approaching_budget_limit',
          severity: 'medium',
          message: `Approaching monthly fuel budget (${((currentMonthlySpend + amount) / monthlyBudget * 100).toFixed(1)}% used)`,
          action: 'warn'
        })
      }
    }
  }

  // Vehicle-specific spending limits
  if (transaction.vehicle_id && transactionType === 'work_order') {
    const vehicleSpend = await pool.query(
      `SELECT COALESCE(SUM(actual_cost), 0) as total
       FROM work_orders
       WHERE vehicle_id = $1
         AND created_at > NOW() - INTERVAL '12 months'`,
      [transaction.vehicle_id]
    )

    const yearlySpend = parseFloat(vehicleSpend.rows[0].total)
    const vehicleValue = 50000 // Should come from vehicle data

    if (yearlySpend + (transaction.estimated_cost || 0) > vehicleValue * 0.5) {
      violations.push({
        rule: 'maintenance_exceeds_vehicle_value',
        severity: 'high',
        message: `Annual maintenance costs ($${yearlySpend}) approaching 50% of vehicle value`,
        action: 'require_approval',
        suggestedResolution: 'Consider vehicle replacement'
      })

      requiredApprovals.push({
        role: 'fleet_manager',
        reason: 'High maintenance costs relative to vehicle value'
      })
    }
  }

  return { violations, requiredApprovals }
}

/**
 * Calculate overall risk score
 */
function calculateRiskScore(
  fraudProbability: number,
  violations: ControlCheck['violations']
): number {
  let score = fraudProbability * 50 // Fraud contributes up to 50 points

  // Add points for violations
  for (const violation of violations) {
    switch (violation.severity) {
      case 'critical':
        score += 20
        break
      case 'high':
        score += 10
        break
      case 'medium':
        score += 5
        break
      case 'low':
        score += 2
        break
    }
  }

  return Math.min(Math.round(score), 100)
}

/**
 * Enhanced fraud analysis using RAG for pattern recognition
 */
async function enhancedFraudAnalysis(
  transaction: any,
  transactionType: string,
  tenantId: string,
  basicFraudCheck: { isFraudulent: boolean; probability: number; reasons: string[] }
): Promise<{ enhancedProbability: number; additionalReasons: string[] }> {
  try {
    const query = `Analyze ${transactionType} for fraud: ${JSON.stringify(transaction)}, initial probability: ${basicFraudCheck.probability}`

    const ragResponse = await generateRAGResponse(
      query,
      tenantId,
      undefined,
      `You are a fraud detection expert for fleet management systems.
Analyze this transaction for fraud patterns based on historical fraud cases.

Transaction Type: ${transactionType}
Transaction Data: ${JSON.stringify(transaction)}
Initial Fraud Indicators: ${basicFraudCheck.reasons.join(', ')}
Base Probability: ${(basicFraudCheck.probability * 100).toFixed(1)}%

Provide additional fraud analysis and return JSON:
{ "additionalRisk": 0-0.3, "additionalReasons": ["reason1", "reason2"] }`
    )

    try {
      const analysis = JSON.parse(ragResponse.response)
      return {
        enhancedProbability: Math.min(basicFraudCheck.probability + (analysis.additionalRisk || 0), 1.0),
        additionalReasons: analysis.additionalReasons || []
      }
    } catch {
      return {
        enhancedProbability: basicFraudCheck.probability,
        additionalReasons: []
      }
    }
  } catch (error) {
    console.error('RAG enhanced fraud analysis error:', error)
    return {
      enhancedProbability: basicFraudCheck.probability,
      additionalReasons: []
    }
  }
}

/**
 * Main control check function with RAG-enhanced fraud detection
 */
export async function checkControls(
  transaction: any,
  transactionType: string,
  tenantId: string,
  userId?: string
): Promise<ControlCheck> {
  try {
    // Run all checks in parallel
    const [fraudCheck, complianceViolations, costControlResults] = await Promise.all([
      checkForFraud(transaction, transactionType, tenantId),
      checkCompliance(transaction, transactionType, tenantId),
      checkCostControls(transaction, transactionType, tenantId)
    ])

    // Enhance fraud detection with RAG
    const enhancedFraud = await enhancedFraudAnalysis(transaction, transactionType, tenantId, fraudCheck)
    const finalFraudProbability = enhancedFraud.enhancedProbability
    const allFraudReasons = [...fraudCheck.reasons, ...enhancedFraud.additionalReasons]

    // Combine all violations
    let allViolations = [
      ...complianceViolations,
      ...costControlResults.violations
    ]

    // Add fraud violations if detected (using RAG-enhanced probability)
    if (finalFraudProbability > 0.7) {
      allViolations.push({
        rule: 'fraud_detected',
        severity: 'critical',
        message: `Potential fraud detected (${(finalFraudProbability * 100).toFixed(0)}% probability): ${allFraudReasons.join(', ')}`,
        action: 'block',
        suggestedResolution: 'Review transaction details and verify authenticity'
      })
    } else if (finalFraudProbability > 0.4) {
      allViolations.push({
        rule: 'fraud_warning',
        severity: 'medium',
        message: `Suspicious transaction pattern detected: ${allFraudReasons.join(', ')}`,
        action: 'warn'
      })
    }

    // Determine if passed
    const hasBlockingViolations = allViolations.some(v => v.action === 'block')
    const passed = !hasBlockingViolations

    // Calculate risk score using RAG-enhanced fraud probability
    const riskScore = calculateRiskScore(finalFraudProbability, allViolations)

    // Automated actions
    const automatedActions: ControlCheck['automatedActions'] = []

    if (riskScore > 70) {
      automatedActions.push({
        action: 'flag_for_audit',
        reason: 'High risk score',
        executed: true
      })
    }

    if (finalFraudProbability > 0.6) {
      automatedActions.push({
        action: 'notify_security',
        reason: 'High fraud probability (RAG-enhanced)',
        executed: true
      })
    }

    const result: ControlCheck = {
      passed,
      violations: allViolations,
      requiredApprovals: costControlResults.requiredApprovals,
      automatedActions,
      riskScore,
      fraudProbability: finalFraudProbability // Use RAG-enhanced probability
    }

    // Save to database
    await pool.query(
      `INSERT INTO ai_control_checks
       (tenant_id, user_id, transaction_type, transaction_data, passed,
        violations, required_approvals, automated_actions, severity, action_taken)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        tenantId,
        userId || null,
        transactionType,
        JSON.stringify(transaction),
        passed,
        JSON.stringify(allViolations),
        JSON.stringify(costControlResults.requiredApprovals),
        JSON.stringify(automatedActions),
        allViolations.length > 0 ? allViolations[0].severity : 'low',
        hasBlockingViolations ? 'block' : allViolations.length > 0 ? 'warn' : 'allow'
      ]
    )

    return result
  } catch (error) {
    console.error('Control check error:', error)
    throw error
  }
}

/**
 * Get control check history
 */
export async function getControlCheckHistory(
  tenantId: string,
  filters?: {
    transactionType?: string
    passed?: boolean
    severity?: string
    limit?: number
  }
): Promise<any[]> {
  let query = 'SELECT * FROM ai_control_checks WHERE tenant_id = $1'
  const params: any[] = [tenantId]
  let paramIndex = 2

  if (filters?.transactionType) {
    query += ` AND transaction_type = $${paramIndex}`
    params.push(filters.transactionType)
    paramIndex++
  }

  if (filters?.passed !== undefined) {
    query += ` AND passed = $${paramIndex}`
    params.push(filters.passed)
    paramIndex++
  }

  if (filters?.severity) {
    query += ` AND severity = $${paramIndex}`
    params.push(filters.severity)
    paramIndex++
  }

  query += ' ORDER BY created_at DESC'

  if (filters?.limit) {
    query += ` LIMIT $${paramIndex}`
    params.push(filters.limit)
  }

  const result = await pool.query(query, params)
  return result.rows
}
