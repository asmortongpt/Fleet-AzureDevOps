import { Client } from '@microsoft/microsoft-graph-client'
import fs from 'fs'
import path from 'path'
import pool from '../config/database'

// Azure AD Configuration
const AZURE_AD_CONFIG = {
  clientId: process.env.AZURE_AD_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID || '',
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET || '',
  tenantId: process.env.AZURE_AD_TENANT_ID || process.env.MICROSOFT_TENANT_ID || ''
}

/**
 * Get Microsoft Graph client with app-only authentication
 */
async function getGraphClient(): Promise<Client> {
  const axios = require('axios')

  // Get access token using client credentials flow
  const tokenResponse = await axios.post(
    `https://login.microsoftonline.com/${AZURE_AD_CONFIG.tenantId}/oauth2/v2.0/token`,
    new URLSearchParams({
      client_id: AZURE_AD_CONFIG.clientId,
      client_secret: AZURE_AD_CONFIG.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  )

  const accessToken = tokenResponse.data.access_token

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken)
    }
  })
}

/**
 * Load and parse an Adaptive Card template
 */
function loadTemplate(templateName: string): any {
  const templatePath = path.join(__dirname, '../templates/adaptive-cards', `${templateName}.json`)
  const templateContent = fs.readFileSync(templatePath, 'utf-8')
  return JSON.parse(templateContent)
}

/**
 * Replace template variables with actual values
 */
function replaceTemplateVariables(template: any, data: Record<string, any>): any {
  let templateString = JSON.stringify(template)

  // Replace all ${variable} patterns with actual values
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
    const replacement = typeof value === 'string' ? value : JSON.stringify(value)
    templateString = templateString.replace(regex, replacement)
  }

  return JSON.parse(templateString)
}

/**
 * Create a vehicle maintenance alert card
 */
export async function createVehicleMaintenanceCard(vehicle: any, maintenance: any): Promise<any> {
  const template = loadTemplate('vehicle-maintenance')

  const data = {
    urgencyLevel: maintenance.priority === 'critical' ? 'URGENT' : maintenance.priority === 'high' ? 'HIGH PRIORITY' : 'ROUTINE',
    vehicleNumber: vehicle.vehicle_number,
    vehicleMake: vehicle.make,
    vehicleModel: vehicle.model,
    vehicleVin: vehicle.vin,
    currentMileage: vehicle.current_mileage?.toLocaleString() || '0',
    maintenanceType: maintenance.type,
    dueDate: new Date(maintenance.due_date).toLocaleDateString(),
    estimatedCost: maintenance.estimated_cost?.toLocaleString() || '0',
    priority: maintenance.priority.toUpperCase(),
    description: maintenance.description || 'Scheduled maintenance required',
    recommendedAction: maintenance.recommended_action || 'Please schedule service at your earliest convenience',
    vehicleUrl: `${process.env.FRONTEND_URL || 'http://68.220.148.2'}/vehicles/${vehicle.id}`,
    vehicleId: vehicle.id,
    alertId: maintenance.id
  }

  return replaceTemplateVariables(template, data)
}

/**
 * Create a work order card
 */
export async function createWorkOrderCard(workOrder: any): Promise<any> {
  const template = loadTemplate('work-order')

  // Determine status color
  let statusColor = 'default'
  switch (workOrder.status?.toLowerCase()) {
    case 'completed':
      statusColor = 'good'
      break
    case 'in_progress':
      statusColor = 'accent'
      break
    case 'pending':
      statusColor = 'warning'
      break
    case 'cancelled':
      statusColor = 'attention'
      break
  }

  const data = {
    workOrderNumber: workOrder.work_order_number || workOrder.id,
    status: (workOrder.status || 'Pending').replace('_', ' ').toUpperCase(),
    statusColor,
    assignedTo: workOrder.assigned_to_name || 'Unassigned',
    vehicleNumber: workOrder.vehicle_number,
    vehicleMake: workOrder.vehicle_make,
    vehicleModel: workOrder.vehicle_model,
    workType: workOrder.work_type || 'General Maintenance',
    priority: (workOrder.priority || 'normal').toUpperCase(),
    dueDate: workOrder.due_date ? new Date(workOrder.due_date).toLocaleDateString() : 'Not set',
    location: workOrder.location || 'Main Facility',
    estimatedDuration: workOrder.estimated_duration || 'TBD',
    description: workOrder.description || 'No description provided',
    partsRequired: workOrder.parts_required || 'None specified',
    hasPartsRequired: !!workOrder.parts_required,
    workOrderUrl: `${process.env.FRONTEND_URL || 'http://68.220.148.2'}/work-orders/${workOrder.id}`,
    workOrderId: workOrder.id,
    canStartWork: workOrder.status === 'pending' || workOrder.status === 'assigned',
    canCompleteWork: workOrder.status === 'in_progress'
  }

  return replaceTemplateVariables(template, data)
}

/**
 * Create an incident report card
 */
export async function createIncidentCard(incident: any): Promise<any> {
  const template = loadTemplate('incident-report')

  // Determine severity color
  let severityColor = 'default'
  switch (incident.severity?.toLowerCase()) {
    case 'critical':
      severityColor = 'attention'
      break
    case 'high':
      severityColor = 'warning'
      break
    case 'medium':
      severityColor = 'accent'
      break
    case 'low':
      severityColor = 'good'
      break
  }

  const photos = incident.photos || []
  const photoImages = photos.map((url: string) => ({ type: 'Image', url }))

  const data = {
    incidentNumber: incident.incident_number || incident.id,
    severity: (incident.severity || 'Unknown').toUpperCase(),
    severityColor,
    incidentDateTime: new Date(incident.incident_date).toLocaleString(),
    driverName: incident.driver_name || 'Unknown',
    vehicleNumber: incident.vehicle_number,
    vehicleMake: incident.vehicle_make,
    vehicleModel: incident.vehicle_model,
    location: incident.location || 'Unknown location',
    incidentType: incident.incident_type || 'Unknown',
    hasInjuries: incident.has_injuries ? 'Yes' : 'No',
    estimatedDamage: incident.estimated_damage?.toLocaleString() || '0',
    reportedBy: incident.reported_by_name || 'Unknown',
    description: incident.description || 'No description provided',
    witnesses: incident.witnesses || 'None reported',
    hasWitnesses: !!incident.witnesses,
    photos: photoImages,
    incidentUrl: `${process.env.FRONTEND_URL || 'http://68.220.148.2'}/incidents/${incident.id}`,
    incidentId: incident.id,
    investigators: [] // This should be populated with actual investigators from DB
  }

  return replaceTemplateVariables(template, data)
}

/**
 * Create an approval request card
 */
export async function createApprovalCard(item: any, approver: any): Promise<any> {
  const template = loadTemplate('approval-request')

  const data = {
    approvalType: item.approval_type || 'Purchase Request',
    requestedBy: item.requested_by_name || 'Unknown',
    requestDate: new Date(item.request_date || Date.now()).toLocaleDateString(),
    amount: item.amount?.toLocaleString() || '0',
    budgetCode: item.budget_code || 'N/A',
    department: item.department || 'Fleet Operations',
    priority: (item.priority || 'normal').toUpperCase(),
    itemDescription: item.description || 'No description provided',
    justification: item.justification || 'No justification provided',
    currentBudget: item.current_budget?.toLocaleString() || '0',
    spentToDate: item.spent_to_date?.toLocaleString() || '0',
    remaining: item.remaining_budget?.toLocaleString() || '0',
    afterApproval: item.after_approval_budget?.toLocaleString() || '0',
    detailsUrl: `${process.env.FRONTEND_URL || 'http://68.220.148.2'}/approvals/${item.id}`,
    approvalId: item.id,
    itemType: item.item_type || 'purchase',
    itemId: item.item_id || item.id
  }

  return replaceTemplateVariables(template, data)
}

/**
 * Create a driver performance card
 */
export async function createDriverPerformanceCard(driver: any, metrics: any): Promise<any> {
  const template = loadTemplate('driver-performance')

  // Determine score color based on safety score
  let scoreColor = 'default'
  if (metrics.safetyScore >= 90) scoreColor = 'good'
  else if (metrics.safetyScore >= 75) scoreColor = 'accent'
  else if (metrics.safetyScore >= 60) scoreColor = 'warning'
  else scoreColor = 'attention'

  // Calculate trend
  const trend = metrics.safetyScore - (metrics.previousScore || metrics.safetyScore)
  const scoreTrend = trend > 0 ? `+${trend}` : trend.toString()
  const trendColor = trend > 0 ? 'good' : trend < 0 ? 'attention' : 'default'

  const data = {
    driverName: `${driver.first_name} ${driver.last_name}`,
    period: metrics.period || 'Last 30 Days',
    safetyScore: metrics.safetyScore || 0,
    scoreColor,
    scoreTrend,
    trendColor,
    milesDriven: metrics.milesDriven?.toLocaleString() || '0',
    hoursDriven: metrics.hoursDriven?.toLocaleString() || '0',
    tripsCompleted: metrics.tripsCompleted?.toLocaleString() || '0',
    onTimePercentage: metrics.onTimePercentage || '0',
    fuelEfficiency: metrics.fuelEfficiency?.toFixed(1) || '0.0',
    idleTime: metrics.idleTime?.toFixed(1) || '0.0',
    hardBraking: metrics.hardBraking || 0,
    hardBrakingColor: metrics.hardBraking > 10 ? 'attention' : 'good',
    harshAcceleration: metrics.harshAcceleration || 0,
    harshAccelColor: metrics.harshAcceleration > 10 ? 'attention' : 'good',
    speedingEvents: metrics.speedingEvents || 0,
    speedingColor: metrics.speedingEvents > 5 ? 'attention' : 'good',
    distractedDriving: metrics.distractedDriving || 0,
    distractedColor: metrics.distractedDriving > 3 ? 'attention' : 'good',
    recommendations: metrics.recommendations || 'Continue safe driving practices.',
    dashboardUrl: `${process.env.FRONTEND_URL || 'http://68.220.148.2'}/drivers/${driver.id}/performance`,
    driverId: driver.id,
    needsTraining: metrics.safetyScore < 75,
    excellentPerformance: metrics.safetyScore >= 95
  }

  return replaceTemplateVariables(template, data)
}

/**
 * Create a fuel receipt card
 */
export async function createFuelReceiptCard(receipt: any): Promise<any> {
  const template = loadTemplate('fuel-receipt')

  // Calculate price comparison
  const marketAverage = receipt.market_average || receipt.price_per_gallon
  const priceDifference = receipt.price_per_gallon - marketAverage
  const priceColor = priceDifference <= 0 ? 'good' : priceDifference < 0.10 ? 'warning' : 'attention'
  const differenceColor = priceDifference <= 0 ? 'good' : 'attention'

  const data = {
    receiptNumber: receipt.receipt_number || receipt.id,
    totalAmount: receipt.total_amount?.toFixed(2) || '0.00',
    purchaseDateTime: new Date(receipt.purchase_date).toLocaleString(),
    driverName: receipt.driver_name || 'Unknown',
    vehicleNumber: receipt.vehicle_number,
    vehicleMake: receipt.vehicle_make,
    vehicleModel: receipt.vehicle_model,
    stationName: receipt.station_name || 'Unknown Station',
    stationAddress: receipt.station_address || 'Unknown Address',
    fuelType: receipt.fuel_type || 'Regular',
    gallons: receipt.gallons?.toFixed(2) || '0.00',
    pricePerGallon: receipt.price_per_gallon?.toFixed(3) || '0.000',
    currentOdometer: receipt.odometer?.toLocaleString() || '0',
    milesSinceLastFill: receipt.miles_since_last_fill?.toLocaleString() || 'N/A',
    calculatedMPG: receipt.calculated_mpg?.toFixed(1) || 'N/A',
    paymentMethod: receipt.payment_method || 'Fleet Card',
    cardLast4: receipt.card_last_4 || '****',
    marketAverage: marketAverage?.toFixed(3) || '0.000',
    priceColor,
    priceDifference: priceDifference >= 0 ? `+$${priceDifference.toFixed(3)}` : `-$${Math.abs(priceDifference).toFixed(3)}`,
    differenceColor,
    receiptImageUrl: receipt.image_url || '',
    hasReceiptImage: !!receipt.image_url,
    receiptUrl: `${process.env.FRONTEND_URL || 'http://68.220.148.2'}/fuel-receipts/${receipt.id}`,
    receiptId: receipt.id
  }

  return replaceTemplateVariables(template, data)
}

/**
 * Create an inspection checklist card
 */
export async function createInspectionChecklistCard(inspection: any): Promise<any> {
  const template = loadTemplate('inspection-checklist')

  const data = {
    inspectionType: inspection.inspection_type || 'Pre-Trip Inspection',
    driverName: inspection.driver_name || 'Unknown',
    vehicleNumber: inspection.vehicle_number,
    vehicleMake: inspection.vehicle_make,
    vehicleModel: inspection.vehicle_model,
    inspectionDate: new Date(inspection.inspection_date || Date.now()).toLocaleString(),
    location: inspection.location || 'Unknown',
    odometer: inspection.odometer?.toLocaleString() || '0',
    inspectionId: inspection.id || 'new',
    vehicleId: inspection.vehicle_id,
    driverId: inspection.driver_id
  }

  return replaceTemplateVariables(template, data)
}

/**
 * Send an Adaptive Card to a Teams channel
 */
export async function sendAdaptiveCard(
  teamId: string,
  channelId: string,
  card: any,
  message?: string
): Promise<any> {
  try {
    const client = await getGraphClient()

    const chatMessage = {
      body: {
        contentType: 'html',
        content: message || 'New notification from Fleet Management System'
      },
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: card
        }
      ]
    }

    const response = await client
      .api(`/teams/${teamId}/channels/${channelId}/messages`)
      .post(chatMessage)

    console.log('Adaptive Card sent successfully:', response.id)
    return response
  } catch (error: any) {
    console.error('Error sending Adaptive Card:', error.message)
    throw error
  }
}

/**
 * Update an existing Adaptive Card message
 */
export async function updateAdaptiveCard(
  teamId: string,
  channelId: string,
  messageId: string,
  card: any,
  message?: string
): Promise<any> {
  try {
    const client = await getGraphClient()

    const chatMessage = {
      body: {
        contentType: 'html',
        content: message || 'Updated notification from Fleet Management System'
      },
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: card
        }
      ]
    }

    const response = await client
      .api(`/teams/${teamId}/channels/${channelId}/messages/${messageId}`)
      .patch(chatMessage)

    console.log('Adaptive Card updated successfully:', response.id)
    return response
  } catch (error: any) {
    console.error('Error updating Adaptive Card:', error.message)
    throw error
  }
}

/**
 * Send Adaptive Card to a user via chat
 */
export async function sendAdaptiveCardToUser(
  userId: string,
  card: any,
  message?: string
): Promise<any> {
  try {
    const client = await getGraphClient()

    // First, create or get the chat with the user
    const chat = await client
      .api('/chats')
      .post({
        chatType: 'oneOnOne',
        members: [
          {
            '@odata.type': '#microsoft.graph.aadUserConversationMember',
            roles: ['owner'],
            'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${userId}')`
          }
        ]
      })

    // Send the message with adaptive card
    const chatMessage = {
      body: {
        contentType: 'html',
        content: message || 'New notification from Fleet Management System'
      },
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          contentUrl: null,
          content: card
        }
      ]
    }

    const response = await client
      .api(`/chats/${chat.id}/messages`)
      .post(chatMessage)

    console.log('Adaptive Card sent to user successfully:', response.id)
    return response
  } catch (error: any) {
    console.error('Error sending Adaptive Card to user:', error.message)
    throw error
  }
}

/**
 * Validate Adaptive Card schema
 */
export function validateAdaptiveCard(card: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!card.type || card.type !== 'AdaptiveCard') {
    errors.push('Card must have type "AdaptiveCard"')
  }

  if (!card.version) {
    errors.push('Card must have a version')
  }

  if (!card.body || !Array.isArray(card.body)) {
    errors.push('Card must have a body array')
  }

  // Additional validation can be added here

  return {
    valid: errors.length === 0,
    errors
  }
}

export default {
  createVehicleMaintenanceCard,
  createWorkOrderCard,
  createIncidentCard,
  createApprovalCard,
  createDriverPerformanceCard,
  createFuelReceiptCard,
  createInspectionChecklistCard,
  sendAdaptiveCard,
  updateAdaptiveCard,
  sendAdaptiveCardToUser,
  validateAdaptiveCard
}
