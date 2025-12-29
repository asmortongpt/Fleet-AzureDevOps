/**
 * Notification Job Processor
 *
 * Processes push notification jobs for mobile devices
 * Supports: FCM (Firebase Cloud Messaging), APNS (Apple Push Notification Service)
 */

import { Job } from 'bull'
import admin from 'firebase-admin'

import { pool } from '../../config/database'
import logger from '../../config/logger'

/**
 * Initialize Firebase Admin SDK
 */
let firebaseInitialized = false

function initializeFirebase() {
  if (firebaseInitialized) return

  try {
    // Initialize Firebase Admin with service account credentials
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
      firebaseInitialized = true
      logger.info('Firebase Admin SDK initialized successfully')
    } else {
      logger.warn('Firebase service account not configured, push notifications disabled')
    }
  } catch (error) {
    logger.error('Failed to initialize Firebase Admin SDK:', error)
  }
}

// Initialize on module load
initializeFirebase()

/**
 * Get user device tokens from database
 */
async function getUserDeviceTokens(userId: string | string[]): Promise<string[]> {
  const userIds = Array.isArray(userId) ? userId : [userId]

  const result = await pool.query(
    `SELECT device_token
     FROM user_devices
     WHERE user_id = ANY($1)
       AND device_token IS NOT NULL
       AND enabled = TRUE`,
    [userIds]
  )

  return result.rows.map((row) => row.device_token)
}

/**
 * Save notification to database
 */
async function saveNotificationLog(
  userId: string | string[],
  title: string,
  body: string,
  data: any,
  status: 'sent' | 'failed',
  error?: string
) {
  const userIds = Array.isArray(userId) ? userId : [userId]

  for (const uid of userIds) {
    await pool.query(
      `INSERT INTO notification_logs
       (user_id, title, body, data, status, error, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [uid, title, body, JSON.stringify(data), status, error]
    )
  }
}

/**
 * Process notification job
 */
export async function processNotificationJob(job: Job): Promise<any> {
  const { userId, title, body, data, badge, sound, channel, priority } = job.data

  logger.info(`Processing notification job ${job.id}`, {
    userId: Array.isArray(userId) ? userId.length : 1,
    title,
    priority,
  })

  if (!firebaseInitialized) {
    logger.warn('Firebase not initialized, skipping notification')
    await saveNotificationLog(userId, title, body, data, 'failed', 'Firebase not configured')
    return { success: false, reason: 'Firebase not configured' }
  }

  try {
    // Get device tokens for user(s)
    const tokens = await getUserDeviceTokens(userId)

    if (tokens.length === 0) {
      logger.warn(`No device tokens found for user(s)`)
      await saveNotificationLog(userId, title, body, data, 'failed', 'No device tokens')
      return { success: false, reason: 'No device tokens found' }
    }

    // Prepare notification message
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
      },
      data: data || {},
      android: {
        priority: priority === 'high' ? 'high' : 'normal',
        notification: {
          channelId: channel || 'fleet-alerts',
          sound: sound || 'default',
          priority: priority === 'high' ? 'max' : 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            badge: badge || 0,
            sound: sound || 'default',
            contentAvailable: true,
          },
        },
        headers: {
          'apns-priority': priority === 'high' ? '10' : '5',
        },
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
        },
      },
    }

    // Send notification to all devices
    const response = await admin.messaging().sendEachForMulticast(message)

    logger.info(`Notification sent: ${response.successCount}/${tokens.length} delivered`, {
      jobId: job.id,
      successCount: response.successCount,
      failureCount: response.failureCount,
    })

    // Handle failed tokens (e.g., remove invalid tokens)
    if (response.failureCount > 0) {
      const failedTokens: string[] = []
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx])
          logger.warn(`Failed to send to token ${tokens[idx]}:`, resp.error?.message)

          // Remove invalid tokens
          if (
            resp.error?.code === 'messaging/invalid-registration-token' ||
            resp.error?.code === 'messaging/registration-token-not-registered'
          ) {
            pool
              .query(`UPDATE user_devices SET enabled = FALSE WHERE device_token = $1`, [tokens[idx]])
              .catch((err) => logger.error('Failed to disable invalid token:', err))
          }
        }
      })
    }

    // Save successful notification log
    await saveNotificationLog(userId, title, body, data, 'sent')

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalTokens: tokens.length,
      sentAt: new Date().toISOString(),
    }
  } catch (error: any) {
    logger.error(`Failed to send notification in job ${job.id}:`, error)

    // Log failed notification
    await saveNotificationLog(userId, title, body, data, 'failed', error.message)

    throw error
  }
}

/**
 * Send notification to specific topic
 */
export async function sendTopicNotification(topic: string, title: string, body: string, data?: any): Promise<any> {
  if (!firebaseInitialized) {
    throw new Error('Firebase not initialized')
  }

  const message: admin.messaging.Message = {
    topic,
    notification: {
      title,
      body,
    },
    data: data || {},
    android: {
      priority: 'high',
      notification: {
        channelId: 'fleet-alerts',
        sound: 'default',
        priority: 'max',
      },
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title,
            body,
          },
          sound: 'default',
        },
      },
    },
  }

  const messageId = await admin.messaging().send(message)
  logger.info(`Topic notification sent: ${messageId} to topic ${topic}`)

  return { success: true, messageId, topic }
}

/**
 * Subscribe user devices to topic
 */
export async function subscribeToTopic(userId: string, topic: string): Promise<any> {
  const tokens = await getUserDeviceTokens(userId)

  if (tokens.length === 0) {
    return { success: false, reason: 'No device tokens found' }
  }

  if (!firebaseInitialized) {
    throw new Error('Firebase not initialized')
  }

  const response = await admin.messaging().subscribeToTopic(tokens, topic)

  logger.info(`Subscribed ${response.successCount} devices to topic ${topic}`, {
    userId,
    successCount: response.successCount,
    failureCount: response.failureCount,
  })

  return {
    success: true,
    successCount: response.successCount,
    failureCount: response.failureCount,
  }
}

/**
 * Unsubscribe user devices from topic
 */
export async function unsubscribeFromTopic(userId: string, topic: string): Promise<any> {
  const tokens = await getUserDeviceTokens(userId)

  if (tokens.length === 0) {
    return { success: false, reason: 'No device tokens found' }
  }

  if (!firebaseInitialized) {
    throw new Error('Firebase not initialized')
  }

  const response = await admin.messaging().unsubscribeFromTopic(tokens, topic)

  logger.info(`Unsubscribed ${response.successCount} devices from topic ${topic}`, {
    userId,
    successCount: response.successCount,
    failureCount: response.failureCount,
  })

  return {
    success: true,
    successCount: response.successCount,
    failureCount: response.failureCount,
  }
}

/**
 * Check if Firebase is initialized
 */
export function isFirebaseInitialized(): boolean {
  return firebaseInitialized
}
