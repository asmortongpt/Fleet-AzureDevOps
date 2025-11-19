import { Client } from '@microsoft/microsoft-graph-client'
import axios from 'axios'
import pool from '../config/database'
import { validateURL, SSRFError } from '../utils/safe-http-request'

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

export interface PresenceInfo {
  id: string
  availability: 'Available' | 'AvailableIdle' | 'Away' | 'BeRightBack' | 'Busy' | 'BusyIdle' | 'DoNotDisturb' | 'Offline' | 'PresenceUnknown'
  activity: string
  statusMessage?: {
    message?: {
      content?: string
      contentType?: string
    }
    publishedDateTime?: string
  }
}

/**
 * Get presence information for a user
 */
export async function getPresence(userId: string): Promise<PresenceInfo> {
  try {
    const client = await getGraphClient()

    const presence = await client
      .api(`/users/${userId}/presence`)
      .get()

    return presence
  } catch (error: any) {
    console.error('Error getting user presence:', error.message)

    // Return default presence if API call fails
    return {
      id: userId,
      availability: 'PresenceUnknown',
      activity: 'Unknown'
    }
  }
}

/**
 * Set presence for the current user (requires delegated permissions)
 */
export async function setPresence(
  userId: string,
  availability: string,
  activity: string,
  expirationDuration?: string,
  statusMessage?: string
): Promise<void> {
  try {
    const client = await getGraphClient()

    const presenceUpdate: any = {
      sessionId: `fleet-${Date.now()}`,
      availability,
      activity,
      expirationDuration: expirationDuration || 'PT1H' // Default 1 hour
    }

    await client
      .api(`/users/${userId}/presence/setPresence`)
      .post(presenceUpdate)

    // Optionally set status message
    if (statusMessage) {
      await client
        .api(`/users/${userId}/presence/setStatusMessage`)
        .post({
          statusMessage: {
            message: {
              content: statusMessage,
              contentType: 'text'
            }
          }
        })
    }

    console.log('Presence updated for user:', userId)
  } catch (error: any) {
    console.error('Error setting user presence:', error.message)
    throw error
  }
}

/**
 * Get presence for multiple users in a single request
 */
export async function getBatchPresence(userIds: string[]): Promise<PresenceInfo[]> {
  try {
    const client = await getGraphClient()

    const requestBody = {
      ids: userIds
    }

    const response = await client
      .api('/communications/getPresencesByUserId')
      .post(requestBody)

    return response.value || []
  } catch (error: any) {
    console.error('Error getting batch presence:', error.message)

    // Return default presence for all users if API call fails
    return userIds.map(id => ({
      id,
      availability: 'PresenceUnknown' as const,
      activity: 'Unknown'
    }))
  }
}

/**
 * Subscribe to presence updates for users
 * Note: This requires setting up webhooks/subscriptions
 */
export async function subscribeToPresence(userIds: string[], webhookUrl: string): Promise<any> {
  try {
    // SSRF Protection: Validate webhook URL
    // Only allow webhooks to our own application domain
    const allowedWebhookDomains = [
      process.env.WEBHOOK_BASE_URL?.replace(/^https?:\/\//, '').split('/')[0] || 'localhost',
      'fleet.capitaltechalliance.com',
      // Add other trusted webhook receiver domains here
    ].filter(Boolean)

    try {
      validateURL(webhookUrl, {
        allowedDomains: allowedWebhookDomains
      })
    } catch (error) {
      if (error instanceof SSRFError) {
        console.error(`SSRF Protection blocked webhook URL: ${webhookUrl}`, {
          reason: error.reason
        })
        throw new Error(`Invalid webhook URL: ${error.reason}. Only application webhook endpoints are allowed.`)
      }
      throw error
    }

    const client = await getGraphClient()

    const subscription = {
      changeType: 'updated',
      notificationUrl: webhookUrl,
      resource: `/communications/presences?$filter=id in (${userIds.map(id => `'${id}'`).join(',')})`,
      expirationDateTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      clientState: 'fleet-presence-subscription'
    }

    const response = await client
      .api('/subscriptions')
      .post(subscription)

    console.log('Presence subscription created:', response.id)
    return response
  } catch (error: any) {
    console.error('Error subscribing to presence:', error.message)
    throw error
  }
}

/**
 * Get driver availability based on presence
 */
export async function getDriverAvailability(driverId: string): Promise<{
  available: boolean
  status: string
  presence?: PresenceInfo
}> {
  try {
    // Get driver's Microsoft user ID
    const driverResult = await pool.query(
      'SELECT email, sso_provider_id FROM users WHERE id = $1 AND role = $2',
      [driverId, 'driver']
    )

    if (driverResult.rows.length === 0) {
      return {
        available: false,
        status: 'Driver not found'
      }
    }

    const driver = driverResult.rows[0]

    // If driver doesn't have Microsoft SSO, check alternative availability indicators
    if (!driver.sso_provider_id) {
      // Check if driver has any active assignments
      const assignmentResult = await pool.query(
        `SELECT COUNT(*) as active_count
         FROM work_orders
         WHERE assigned_to = $1 AND status = 'in_progress'`,
        [driverId]
      )

      const hasActiveWork = parseInt(assignmentResult.rows[0].active_count) > 0

      return {
        available: !hasActiveWork,
        status: hasActiveWork ? 'Working on assignment' : 'Available'
      }
    }

    // Get presence from Microsoft Graph
    const presence = await getPresence(driver.sso_provider_id)

    // Determine availability based on presence
    const availableStatuses = ['Available', 'AvailableIdle']
    const busyStatuses = ['Busy', 'BusyIdle', 'DoNotDisturb']

    let available = false
    let status = presence.availability

    if (availableStatuses.includes(presence.availability)) {
      available = true
      status = 'Available'
    } else if (busyStatuses.includes(presence.availability)) {
      available = false
      status = 'Busy'
    } else if (presence.availability === 'Away' || presence.availability === 'BeRightBack') {
      available = false
      status = 'Away'
    } else if (presence.availability === 'Offline') {
      available = false
      status = 'Offline'
    }

    return {
      available,
      status,
      presence
    }
  } catch (error: any) {
    console.error('Error getting driver availability:', error.message)
    return {
      available: false,
      status: 'Error checking availability'
    }
  }
}

/**
 * Get availability for all drivers
 */
export async function getAllDriversAvailability(tenantId?: number): Promise<any[]> {
  try {
    // Get all drivers with Microsoft SSO
    const query = tenantId
      ? 'SELECT id, email, first_name, last_name, sso_provider_id FROM users WHERE role = $1 AND tenant_id = $2'
      : 'SELECT id, email, first_name, last_name, sso_provider_id FROM users WHERE role = $1'

    const params = tenantId ? ['driver', tenantId] : ['driver']
    const driversResult = await pool.query(query, params)

    const drivers = driversResult.rows

    // Get Microsoft user IDs for drivers with SSO
    const microsoftUserIds = drivers
      .filter(d => d.sso_provider_id)
      .map(d => d.sso_provider_id)

    // Get presence for all drivers in batch
    let presenceMap: Record<string, PresenceInfo> = {}
    if (microsoftUserIds.length > 0) {
      const presences = await getBatchPresence(microsoftUserIds)
      presenceMap = Object.fromEntries(
        presences.map(p => [p.id, p])
      )
    }

    // Build availability response
    const availability = await Promise.all(
      drivers.map(async (driver) => {
        if (driver.sso_provider_id && presenceMap[driver.sso_provider_id]) {
          const presence = presenceMap[driver.sso_provider_id]
          const availableStatuses = ['Available', 'AvailableIdle']

          return {
            driverId: driver.id,
            name: `${driver.first_name} ${driver.last_name}`,
            email: driver.email,
            available: availableStatuses.includes(presence.availability),
            status: presence.availability,
            activity: presence.activity,
            statusMessage: presence.statusMessage?.message?.content
          }
        } else {
          // Check alternative availability indicators
          const assignmentResult = await pool.query(
            `SELECT COUNT(*) as active_count
             FROM work_orders
             WHERE assigned_to = $1 AND status = 'in_progress'`,
            [driver.id]
          )

          const hasActiveWork = parseInt(assignmentResult.rows[0].active_count) > 0

          return {
            driverId: driver.id,
            name: `${driver.first_name} ${driver.last_name}`,
            email: driver.email,
            available: !hasActiveWork,
            status: hasActiveWork ? 'Working' : 'Available',
            activity: hasActiveWork ? 'On assignment' : 'Available'
          }
        }
      })
    )

    return availability
  } catch (error: any) {
    console.error('Error getting all drivers availability:', error.message)
    throw error
  }
}

/**
 * Find available drivers for urgent tasks
 */
export async function findAvailableDrivers(tenantId?: number): Promise<any[]> {
  const allDrivers = await getAllDriversAvailability(tenantId)
  return allDrivers.filter(driver => driver.available)
}

/**
 * Check if a user should be disturbed based on presence
 * Returns true if it's OK to send notifications/messages
 */
export function shouldNotifyUser(presence: PresenceInfo): boolean {
  // Don't disturb users who are in Do Not Disturb mode or in a meeting
  const doNotDisturbStatuses = ['DoNotDisturb', 'Presenting', 'InAMeeting']

  if (doNotDisturbStatuses.includes(presence.availability)) {
    return false
  }

  // Don't disturb offline users (they won't see it anyway)
  if (presence.availability === 'Offline') {
    return false
  }

  return true
}

/**
 * Get intelligent routing suggestion based on presence
 */
export async function getIntelligentRoutingSuggestion(
  taskPriority: 'low' | 'medium' | 'high' | 'critical',
  candidateUserIds: string[]
): Promise<{
  suggestedUserId?: string
  reason: string
  allCandidates: Array<{ userId: string; score: number; presence: PresenceInfo }>
}> {
  try {
    const presences = await getBatchPresence(candidateUserIds)

    // Score each candidate
    const scoredCandidates = presences.map(presence => {
      let score = 0

      // Availability scoring
      switch (presence.availability) {
        case 'Available':
          score += 100
          break
        case 'AvailableIdle':
          score += 90
          break
        case 'BeRightBack':
          score += 70
          break
        case 'Away':
          score += 50
          break
        case 'Busy':
          score += 30
          break
        case 'BusyIdle':
          score += 20
          break
        case 'DoNotDisturb':
          score += 5
          break
        case 'Offline':
          score += 0
          break
      }

      return {
        userId: presence.id,
        score,
        presence
      }
    })

    // Sort by score (highest first)
    scoredCandidates.sort((a, b) => b.score - a.score)

    const topCandidate = scoredCandidates[0]

    // For critical tasks, suggest the top candidate even if they're busy
    // For other tasks, only suggest if they have a reasonable score
    const minimumScore = taskPriority === 'critical' ? 0 : taskPriority === 'high' ? 30 : 70

    if (topCandidate.score >= minimumScore) {
      return {
        suggestedUserId: topCandidate.userId,
        reason: `User is ${topCandidate.presence.availability.toLowerCase()}`,
        allCandidates: scoredCandidates
      }
    } else {
      return {
        reason: 'No users are currently available',
        allCandidates: scoredCandidates
      }
    }
  } catch (error: any) {
    console.error('Error getting intelligent routing suggestion:', error.message)
    return {
      reason: 'Error determining availability',
      allCandidates: []
    }
  }
}

export default {
  getPresence,
  setPresence,
  getBatchPresence,
  subscribeToPresence,
  getDriverAvailability,
  getAllDriversAvailability,
  findAvailableDrivers,
  shouldNotifyUser,
  getIntelligentRoutingSuggestion
}
