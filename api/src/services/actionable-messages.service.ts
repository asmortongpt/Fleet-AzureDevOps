import pool from '../config/database'
import { updateAdaptiveCard } from './adaptive-cards.service'
import { createAuditLog } from '../middleware/audit'

interface CardAction {
  action: string
  cardId?: string
  workOrderId?: string
  vehicleId?: string
  incidentId?: string
  approvalId?: string
  receiptId?: string
  inspectionId?: string
  driverId?: string
  alertId?: string
  itemType?: string
  itemId?: string
  [key: string]: any
}

/**
 * Handle card action submission
 */
export async function handleCardAction(
  action: CardAction,
  userId: string,
  cardId: string,
  teamId?: string,
  channelId?: string,
  messageId?: string
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    let result: any

    // Route to appropriate handler based on action type
    switch (action.action) {
      // Work Order Actions
      case 'accept_work_order':
        result = await handleAcceptWorkOrder(action, userId)
        break
      case 'reject_work_order':
        result = await handleRejectWorkOrder(action, userId)
        break
      case 'start_work':
        result = await handleStartWork(action, userId)
        break
      case 'complete_work':
        result = await handleCompleteWork(action, userId)
        break
      case 'update_progress':
        result = await handleUpdateProgress(action, userId)
        break

      // Approval Actions
      case 'approve':
        result = await handleApprove(action, userId)
        break
      case 'reject':
        result = await handleReject(action, userId)
        break
      case 'approve_conditional':
        result = await handleApproveConditional(action, userId)
        break
      case 'request_info':
        result = await handleRequestInfo(action, userId)
        break

      // Incident Actions
      case 'approve_incident':
        result = await handleApproveIncident(action, userId)
        break
      case 'assign_investigator':
        result = await handleAssignInvestigator(action, userId)
        break
      case 'close_incident':
        result = await handleCloseIncident(action, userId)
        break

      // Maintenance Actions
      case 'schedule_maintenance':
        result = await handleScheduleMaintenance(action, userId)
        break
      case 'acknowledge':
        result = await handleAcknowledge(action, userId)
        break
      case 'add_note':
        result = await handleAddNote(action, userId)
        break

      // Fuel Receipt Actions
      case 'approve_receipt':
        result = await handleApproveReceipt(action, userId)
        break
      case 'flag_receipt':
        result = await handleFlagReceipt(action, userId)
        break

      // Inspection Actions
      case 'submit_inspection':
        result = await handleSubmitInspection(action, userId)
        break
      case 'report_critical_issue':
        result = await handleReportCriticalIssue(action, userId)
        break

      // Driver Performance Actions
      case 'schedule_training':
        result = await handleScheduleTraining(action, userId)
        break
      case 'send_recognition':
        result = await handleSendRecognition(action, userId)
        break
      case 'add_coaching_note':
        result = await handleAddCoachingNote(action, userId)
        break

      default:
        result = {
          success: false,
          message: `Unknown action: ${action.action}`
        }
    }

    // Log the action in the database
    await logCardAction(cardId, action, userId, result.success ? 'success' : 'failed')

    // Update the card if we have the necessary information
    if (result.success && teamId && channelId && messageId && result.updatedCard) {
      await updateAdaptiveCard(teamId, channelId, messageId, result.updatedCard)
    }

    // Send notification about the action result
    if (result.success && result.notifyUsers) {
      await sendActionNotification(action, result, result.notifyUsers)
    }

    return result
  } catch (error: any) {
    console.error('Error handling card action:', error.message)

    await logCardAction(cardId, action, userId, 'error')

    return {
      success: false,
      message: `Error processing action: ${error.message}`
    }
  }
}

/**
 * Handle accepting a work order
 */
async function handleAcceptWorkOrder(action: CardAction, userId: string): Promise<any> {
  const { workOrderId } = action

  await pool.query(
    `UPDATE work_orders
     SET status = 'accepted', assigned_to = $1, updated_at = NOW()
     WHERE id = $2',
    [userId, workOrderId]
  )

  return {
    success: true,
    message: 'Work order accepted successfully',
    notifyUsers: ['supervisor'],
    data: { workOrderId, status: 'accepted' }
  }
}

/**
 * Handle rejecting a work order
 */
async function handleRejectWorkOrder(action: CardAction, userId: string): Promise<any> {
  const { workOrderId, rejectionReason } = action

  await pool.query(
    `UPDATE work_orders
     SET status = 'rejected', rejection_reason = $1, updated_at = NOW()
     WHERE id = $2',
    [rejectionReason || 'No reason provided', workOrderId]
  )

  return {
    success: true,
    message: 'Work order rejected',
    notifyUsers: ['supervisor'],
    data: { workOrderId, status: 'rejected', reason: rejectionReason }
  }
}

/**
 * Handle starting work
 */
async function handleStartWork(action: CardAction, userId: string): Promise<any> {
  const { workOrderId } = action

  await pool.query(
    `UPDATE work_orders
     SET status = 'in_progress', started_at = NOW(), updated_at = NOW()
     WHERE id = $1',
    [workOrderId]
  )

  return {
    success: true,
    message: 'Work started',
    data: { workOrderId, status: 'in_progress' }
  }
}

/**
 * Handle completing work
 */
async function handleCompleteWork(action: CardAction, userId: string): Promise<any> {
  const { workOrderId } = action

  await pool.query(
    `UPDATE work_orders
     SET status = 'completed', completed_at = NOW(), updated_at = NOW()
     WHERE id = $1',
    [workOrderId]
  )

  return {
    success: true,
    message: 'Work completed successfully',
    notifyUsers: ['supervisor'],
    data: { workOrderId, status: 'completed' }
  }
}

/**
 * Handle updating work progress
 */
async function handleUpdateProgress(action: CardAction, userId: string): Promise<any> {
  const { workOrderId, progressPercentage, progressNote } = action

  await pool.query(
    `UPDATE work_orders
     SET progress_percentage = $1, progress_notes = $2, updated_at = NOW()
     WHERE id = $3',
    [progressPercentage, progressNote, workOrderId]
  )

  return {
    success: true,
    message: `Progress updated to ${progressPercentage}%`,
    data: { workOrderId, progress: progressPercentage }
  }
}

/**
 * Handle approval
 */
async function handleApprove(action: CardAction, userId: string): Promise<any> {
  const { approvalId, itemType, itemId } = action

  // Get user details for audit log
  const userResult = await pool.query('SELECT tenant_id FROM users WHERE id = $1', [userId])
  const tenantId = userResult.rows[0]?.tenant_id

  await pool.query(
    `UPDATE approvals
     SET status = 'approved', approved_by = $1, approved_at = NOW(), updated_at = NOW()
     WHERE id = $2',
    [userId, approvalId]
  )

  // Log the approval
  if (tenantId) {
    await createAuditLog(
      tenantId,
      userId,
      'APPROVE',
      'approvals',
      approvalId,
      { itemType, itemId },
      null,
      null,
      'success',
      'Approval granted via Adaptive Card'
    )
  }

  return {
    success: true,
    message: 'Approval granted',
    notifyUsers: ['requester'],
    data: { approvalId, status: 'approved' }
  }
}

/**
 * Handle rejection
 */
async function handleReject(action: CardAction, userId: string): Promise<any> {
  const { approvalId, itemType, itemId, rejectionReason } = action

  const userResult = await pool.query('SELECT tenant_id FROM users WHERE id = $1', [userId])
  const tenantId = userResult.rows[0]?.tenant_id

  await pool.query(
    `UPDATE approvals
     SET status = 'rejected', approved_by = $1, rejection_reason = $2, approved_at = NOW(), updated_at = NOW()
     WHERE id = $3',
    [userId, rejectionReason || 'No reason provided', approvalId]
  )

  if (tenantId) {
    await createAuditLog(
      tenantId,
      userId,
      'REJECT',
      'approvals',
      approvalId,
      { itemType, itemId, reason: rejectionReason },
      null,
      null,
      'success',
      'Approval rejected via Adaptive Card'
    )
  }

  return {
    success: true,
    message: 'Approval rejected',
    notifyUsers: ['requester'],
    data: { approvalId, status: 'rejected', reason: rejectionReason }
  }
}

/**
 * Handle conditional approval
 */
async function handleApproveConditional(action: CardAction, userId: string): Promise<any> {
  const { approvalId, approvalConditions, approvedAmount } = action

  await pool.query(
    `UPDATE approvals
     SET status = 'approved_conditional',
         approved_by = $1,
         approval_conditions = $2,
         approved_amount = $3,
         approved_at = NOW(),
         updated_at = NOW()
     WHERE id = $4`,
    [userId, approvalConditions, approvedAmount, approvalId]
  )

  return {
    success: true,
    message: 'Approval granted with conditions',
    notifyUsers: ['requester'],
    data: { approvalId, status: 'approved_conditional', conditions: approvalConditions }
  }
}

/**
 * Handle request for more information
 */
async function handleRequestInfo(action: CardAction, userId: string): Promise<any> {
  const { approvalId, infoRequest } = action

  await pool.query(
    `UPDATE approvals
     SET status = 'info_requested',
         info_requested = $1,
         updated_at = NOW()
     WHERE id = $2',
    [infoRequest, approvalId]
  )

  return {
    success: true,
    message: 'Information requested',
    notifyUsers: ['requester'],
    data: { approvalId, status: 'info_requested' }
  }
}

/**
 * Handle incident approval
 */
async function handleApproveIncident(action: CardAction, userId: string): Promise<any> {
  const { incidentId } = action

  await pool.query(
    `UPDATE incidents
     SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW()
     WHERE id = $2',
    [userId, incidentId]
  )

  return {
    success: true,
    message: 'Incident report approved',
    data: { incidentId, status: 'approved' }
  }
}

/**
 * Handle assigning investigator
 */
async function handleAssignInvestigator(action: CardAction, userId: string): Promise<any> {
  const { incidentId, investigatorId, investigationNotes } = action

  await pool.query(
    `UPDATE incidents
     SET investigator_id = $1, investigation_notes = $2, status = 'investigating', updated_at = NOW()
     WHERE id = $3',
    [investigatorId, investigationNotes, incidentId]
  )

  return {
    success: true,
    message: 'Investigator assigned',
    notifyUsers: ['investigator'],
    data: { incidentId, investigatorId }
  }
}

/**
 * Handle closing incident
 */
async function handleCloseIncident(action: CardAction, userId: string): Promise<any> {
  const { incidentId, resolution, closureNotes } = action

  await pool.query(
    `UPDATE incidents
     SET status = 'closed', resolution = $1, closure_notes = $2, closed_at = NOW(), updated_at = NOW()
     WHERE id = $3',
    [resolution, closureNotes, incidentId]
  )

  return {
    success: true,
    message: 'Incident closed',
    data: { incidentId, status: 'closed', resolution }
  }
}

/**
 * Handle scheduling maintenance
 */
async function handleScheduleMaintenance(action: CardAction, userId: string): Promise<any> {
  const { vehicleId, maintenanceType } = action

  // This would integrate with the calendar service to schedule maintenance
  // For now, we'll just create a placeholder

  return {
    success: true,
    message: 'Maintenance scheduling initiated',
    data: { vehicleId, maintenanceType }
  }
}

/**
 * Handle acknowledging alert
 */
async function handleAcknowledge(action: CardAction, userId: string): Promise<any> {
  const { alertId, vehicleId } = action

  await pool.query(
    `UPDATE alerts
     SET acknowledged = true, acknowledged_by = $1, acknowledged_at = NOW()
     WHERE id = $2',
    [userId, alertId]
  )

  return {
    success: true,
    message: 'Alert acknowledged',
    data: { alertId, vehicleId }
  }
}

/**
 * Handle adding a note
 */
async function handleAddNote(action: CardAction, userId: string): Promise<any> {
  const { vehicleId, alertId, maintenanceNote, receiptNote } = action
  const note = maintenanceNote || receiptNote

  // Store note in a generic notes table or appropriate entity
  await pool.query(
    `INSERT INTO notes (entity_type, entity_id, user_id, note_text, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [vehicleId ? 'vehicle' : 'alert', vehicleId || alertId, userId, note]
  )

  return {
    success: true,
    message: 'Note added',
    data: { note }
  }
}

/**
 * Handle approving fuel receipt
 */
async function handleApproveReceipt(action: CardAction, userId: string): Promise<any> {
  const { receiptId } = action

  await pool.query(
    `UPDATE fuel_receipts
     SET status = 'approved', approved_by = $1, approved_at = NOW()
     WHERE id = $2',
    [userId, receiptId]
  )

  return {
    success: true,
    message: 'Receipt approved',
    data: { receiptId, status: 'approved' }
  }
}

/**
 * Handle flagging receipt for review
 */
async function handleFlagReceipt(action: CardAction, userId: string): Promise<any> {
  const { receiptId } = action

  await pool.query(
    `UPDATE fuel_receipts
     SET status = 'flagged', flagged_by = $1, flagged_at = NOW()
     WHERE id = $2',
    [userId, receiptId]
  )

  return {
    success: true,
    message: 'Receipt flagged for review',
    notifyUsers: ['supervisor'],
    data: { receiptId, status: 'flagged' }
  }
}

/**
 * Handle submitting inspection
 */
async function handleSubmitInspection(action: CardAction, userId: string): Promise<any> {
  const { inspectionId, vehicleId, driverId, ...checklistData } = action

  // Save inspection checklist results
  await pool.query(
    `INSERT INTO vehicle_inspections (
      vehicle_id, driver_id, inspection_data, vehicle_condition, status, created_at
    ) VALUES ($1, $2, $3, $4, 'submitted', NOW())
    RETURNING id`,
    [vehicleId, driverId, JSON.stringify(checklistData), checklistData.vehicleCondition]
  )

  return {
    success: true,
    message: 'Inspection submitted',
    data: { inspectionId, vehicleId }
  }
}

/**
 * Handle reporting critical issue
 */
async function handleReportCriticalIssue(action: CardAction, userId: string): Promise<any> {
  const { inspectionId, vehicleId } = action

  // Create a high-priority alert
  await pool.query(
    `INSERT INTO alerts (
      vehicle_id, alert_type, severity, message, created_at
    ) VALUES ($1, 'critical_inspection_issue', 'critical', 'Critical issue reported during inspection', NOW())`,
    [vehicleId]
  )

  return {
    success: true,
    message: 'Critical issue reported',
    notifyUsers: ['supervisor', 'maintenance'],
    data: { vehicleId }
  }
}

/**
 * Handle scheduling training
 */
async function handleScheduleTraining(action: CardAction, userId: string): Promise<any> {
  const { driverId } = action

  // This would integrate with the calendar service
  // For now, create a placeholder

  return {
    success: true,
    message: 'Training scheduling initiated',
    data: { driverId }
  }
}

/**
 * Handle sending recognition
 */
async function handleSendRecognition(action: CardAction, userId: string): Promise<any> {
  const { driverId } = action

  // Create a recognition record
  await pool.query(
    `INSERT INTO driver_recognitions (driver_id, recognized_by, recognition_type, created_at)
     VALUES ($1, $2, 'excellent_performance', NOW())`,
    [driverId, userId]
  )

  return {
    success: true,
    message: 'Recognition sent',
    notifyUsers: ['driver'],
    data: { driverId }
  }
}

/**
 * Handle adding coaching note
 */
async function handleAddCoachingNote(action: CardAction, userId: string): Promise<any> {
  const { driverId, coachingNote } = action

  await pool.query(
    `INSERT INTO coaching_notes (driver_id, coach_id, note, created_at)
     VALUES ($1, $2, $3, NOW())`,
    [driverId, userId, coachingNote]
  )

  return {
    success: true,
    message: 'Coaching note added',
    data: { driverId }
  }
}

/**
 * Log card action in the database
 */
async function logCardAction(
  cardId: string,
  action: CardAction,
  userId: string,
  result: string
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO adaptive_card_actions (card_id, action_type, action_data, user_id, result, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [cardId, action.action, JSON.stringify(action), userId, result]
    )
  } catch (error: any) {
    console.error('Error logging card action:', error.message)
  }
}

/**
 * Send notification about action result
 */
async function sendActionNotification(
  action: CardAction,
  result: any,
  notifyUserRoles: string[]
): Promise<void> {
  // This would send notifications to relevant users
  // Implementation depends on your notification system
  console.log('Sending action notification:', { action: action.action, result: result.message, roles: notifyUserRoles })
}

export default {
  handleCardAction,
  logCardAction,
  sendActionNotification
}
