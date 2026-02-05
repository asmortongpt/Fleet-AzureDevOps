/**
 * Microsoft Teams Routes
 *
 * RESTful API endpoints for Teams integration:
 * - List teams and channels
 * - Send and retrieve messages
 * - Reply to messages (threading)
 * - Add reactions
 * - Create channels
 * - Update and delete messages
 *
 * All routes require authentication
 */


import { Router, Response } from 'express'

import logger from '../config/logger'
import { pool } from '../config/database'
import { authenticateJWT, AuthRequest } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import teamsService from '../services/teams.service'
import {
  SendMessageRequest,
  ReplyToMessageRequest,
  AddReactionRequest,
  CreateChannelRequest,
  UpdateMessageRequest
} from '../types/teams.types'
import { getErrorMessage } from '../utils/error-handler'

const router = Router()

function resolveTeamsSource(req: AuthRequest): 'local' | 'graph' {
  const q = String(req.query.source || '').toLowerCase()
  const env = String(process.env.TEAMS_SOURCE || '').toLowerCase()
  const source = (q || env || 'local').trim()
  return source === 'graph' ? 'graph' : 'local'
}

function getTenantId(req: AuthRequest): string | null {
  return (req.user as any)?.tenant_id || (req.user as any)?.tenantId || null
}

// Apply authentication middleware to all routes
router.use(authenticateJWT)

/**
 * @openapi
 * /api/teams:
 *   get:
 *     summary: Get all teams
 *     description: Returns list of all Microsoft Teams the user has access to
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of teams
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 teams:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       description:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const useLocal = resolveTeamsSource(req) === 'local'
    if (useLocal) {
      const tenantId = getTenantId(req)
      if (!tenantId) return res.status(401).json({ success: false, error: 'Missing tenant context' })
      const result = await pool.query(
        `SELECT id, name AS "displayName", description
         FROM teams
         WHERE tenant_id = $1 AND is_active = true
         ORDER BY name`,
        [tenantId]
      )
      return res.json({ success: true, teams: result.rows })
    }

    const teams = await teamsService.getTeams()

    res.json({
      success: true,
      teams
    })
  } catch (error) {
    logger.error('Error getting teams', {
      error: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
      userId: req.user?.id
    })

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve teams'
    })
  }
})

// ----------------------------------------------------------------------------
// Legacy/query-param aliases (avoid /:teamId catching /channels, /messages, /files)
// ----------------------------------------------------------------------------

router.get('/channels', async (req: AuthRequest, res: Response) => {
  try {
    const teamId = String(req.query.teamId || '')
    if (!teamId) return res.status(400).json({ success: false, error: 'teamId is required' })

    const useLocal = resolveTeamsSource(req) === 'local'
    if (useLocal) {
      const tenantId = getTenantId(req)
      if (!tenantId) return res.status(401).json({ success: false, error: 'Missing tenant context' })
      const result = await pool.query(
        `SELECT channel_id AS id, display_name AS "displayName", description
         FROM teams_channels
         WHERE tenant_id = $1 AND team_id = $2
         ORDER BY display_name`,
        [tenantId, teamId]
      )
      return res.json({ success: true, channels: result.rows })
    }

    const channels = await teamsService.getChannels(teamId)
    return res.json({ success: true, channels })
  } catch (error) {
    logger.error('Error getting channels (alias)', {
      error: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
      userId: req.user?.id
    })
    return res.status(500).json({ success: false, error: 'Failed to retrieve channels' })
  }
})

router.get('/messages', async (req: AuthRequest, res: Response) => {
  try {
    const teamId = String(req.query.teamId || '')
    const channelId = String(req.query.channelId || '')
    if (!teamId || !channelId) {
      return res.status(400).json({ success: false, error: 'teamId and channelId are required' })
    }
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)))

    const useLocal = resolveTeamsSource(req) === 'local'
    if (useLocal) {
      const tenantId = getTenantId(req)
      if (!tenantId) return res.status(401).json({ success: false, error: 'Missing tenant context' })
      const result = await pool.query(
        `SELECT
           message_id AS id,
           sender_name,
           body,
           sent_at,
           metadata
         FROM teams_messages
         WHERE tenant_id = $1 AND team_id = $2 AND channel_id = $3
         ORDER BY sent_at DESC NULLS LAST, created_at DESC
         LIMIT $4`,
        [tenantId, teamId, channelId, limit]
      )
      return res.json({ success: true, messages: result.rows })
    }

    const messages = await teamsService.getMessages(teamId, channelId, limit)
    return res.json({ success: true, messages })
  } catch (error) {
    logger.error('Error getting messages (alias)', {
      error: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
      userId: req.user?.id
    })
    return res.status(500).json({ success: false, error: 'Failed to retrieve messages' })
  }
})

router.get('/files', async (_req: AuthRequest, res: Response) => {
  // Avoid throwing from route fall-through. File operations require Graph/SharePoint wiring.
  return res.status(501).json({ success: false, error: 'Teams files not implemented for local demo mode' })
})

/**
 * @openapi
 * /api/teams/{teamId}:
 *   get:
 *     summary: Get a single team
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team details
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:teamId', async (req: AuthRequest, res: Response) => {
  try {
    const { teamId } = req.params
    const useLocal = resolveTeamsSource(req) === 'local'
    if (useLocal) {
      const tenantId = getTenantId(req)
      if (!tenantId) return res.status(401).json({ success: false, error: 'Missing tenant context' })
      const result = await pool.query(
        `SELECT id, name AS "displayName", description
         FROM teams
         WHERE tenant_id = $1 AND id = $2
         LIMIT 1`,
        [tenantId, teamId]
      )
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Team not found' })
      }
      return res.json({ success: true, team: result.rows[0] })
    }

    const team = await teamsService.getTeam(teamId)

    res.json({
      success: true,
      team
    })
  } catch (error) {
    logger.error('Error getting team', {
      error: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
      teamId: req.params.teamId,
      userId: req.user?.id
    })

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve team'
    })
  }
})

/**
 * @openapi
 * /api/teams/{teamId}/channels:
 *   get:
 *     summary: Get all channels in a team
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: The team ID
 *     responses:
 *       200:
 *         description: List of channels
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:teamId/channels', async (req: AuthRequest, res: Response) => {
  try {
    const { teamId } = req.params

    const useLocal = resolveTeamsSource(req) === 'local'
    if (useLocal) {
      const tenantId = getTenantId(req)
      if (!tenantId) return res.status(401).json({ success: false, error: 'Missing tenant context' })
      const result = await pool.query(
        `SELECT channel_id AS id, display_name AS "displayName", description
         FROM teams_channels
         WHERE tenant_id = $1 AND team_id = $2
         ORDER BY display_name`,
        [tenantId, teamId]
      )
      return res.json({ success: true, channels: result.rows })
    }

    const channels = await teamsService.getChannels(teamId)

    res.json({
      success: true,
      channels
    })
  } catch (error) {
    logger.error('Error getting channels', {
      error: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
      teamId: req.params.teamId,
      userId: req.user?.id
    })

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve channels'
    })
  }
})

/**
 * @openapi
 * /api/teams/{teamId}/channels/{channelId}/messages:
 *   get:
 *     summary: Get messages from a channel
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of messages
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:teamId/channels/:channelId/messages', async (req: AuthRequest, res: Response) => {
  try {
    const { teamId, channelId } = req.params
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50))

    const useLocal = resolveTeamsSource(req) === 'local'
    if (useLocal) {
      const tenantId = getTenantId(req)
      if (!tenantId) return res.status(401).json({ success: false, error: 'Missing tenant context' })
      const result = await pool.query(
        `SELECT
           message_id AS id,
           sender_name,
           body,
           sent_at,
           metadata
         FROM teams_messages
         WHERE tenant_id = $1 AND team_id = $2 AND channel_id = $3
         ORDER BY sent_at DESC NULLS LAST, created_at DESC
         LIMIT $4`,
        [tenantId, teamId, channelId, limit]
      )
      return res.json({ success: true, messages: result.rows })
    }

    const messages = await teamsService.getMessages(teamId, channelId, limit)

    res.json({
      success: true,
      messages
    })
  } catch (error) {
    logger.error('Error getting messages', {
      error: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
      teamId: req.params.teamId,
      channelId: req.params.channelId,
      userId: req.user?.id
    })

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve messages'
    })
  }
})

/**
 * @openapi
 * /api/teams/{teamId}/channels/{channelId}/messages:
 *   post:
 *     summary: Send a message to a Teams channel
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: The message content
 *               subject:
 *                 type: string
 *                 description: Optional message subject
 *               contentType:
 *                 type: string
 *                 enum: [text, html]
 *                 default: html
 *               mentions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     displayName:
 *                       type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *               importance:
 *                 type: string
 *                 enum: [normal, high, urgent]
 *                 default: normal
 *               entityLinks:
 *                 type: array
 *                 description: Links to related entities (vehicle, driver, work order, etc.)
 *                 items:
 *                   type: object
 *                   properties:
 *                     entity_type:
 *                       type: string
 *                     entity_id:
 *                       type: integer
 *                     link_type:
 *                       type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:teamId/channels/:channelId/messages',csrfProtection, async (req: AuthRequest, res: Response) => {
  try {
    const { teamId, channelId } = req.params
    const { message, subject, contentType, mentions, attachments, importance, entityLinks } = req.body

    // Validate input
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      })
    }

    const request: SendMessageRequest = {
      teamId,
      channelId,
      message,
      subject,
      contentType,
      mentions,
      attachments,
      importance
    }

    const userId = req.user?.id ? parseInt(req.user.id) : undefined
    const result = await teamsService.sendMessage(request, userId, entityLinks)

    res.json({
      success: true,
      message: result.message,
      communicationId: result.communicationId
    })
  } catch (error) {
    logger.error('Error sending message', {
      error: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
      teamId: req.params.teamId,
      channelId: req.params.channelId,
      userId: req.user?.id
    })

    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    })
  }
})

/**
 * @openapi
 * /api/teams/{teamId}/channels/{channelId}/messages/{messageId}/replies:
 *   post:
 *     summary: Reply to a message (threading)
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               contentType:
 *                 type: string
 *                 enum: [text, html]
 *               mentions:
 *                 type: array
 *               attachments:
 *                 type: array
 *     responses:
 *       200:
 *         description: Reply sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:teamId/channels/:channelId/messages/:messageId/replies',csrfProtection, async (req: AuthRequest, res: Response) => {
  try {
    const { teamId, channelId, messageId } = req.params
    const { message, contentType, mentions, attachments } = req.body

    // Validate input
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      })
    }

    const request: ReplyToMessageRequest = {
      teamId,
      channelId,
      messageId,
      message,
      contentType,
      mentions,
      attachments
    }

    const userId = req.user?.id ? parseInt(req.user.id) : undefined
    const result = await teamsService.replyToMessage(request, userId)

    res.json({
      success: true,
      message: result.message,
      communicationId: result.communicationId
    })
  } catch (error) {
    logger.error('Error replying to message', {
      error: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
      teamId: req.params.teamId,
      channelId: req.params.channelId,
      messageId: req.params.messageId,
      userId: req.user?.id
    })

    res.status(500).json({
      success: false,
      error: 'Failed to reply to message'
    })
  }
})

/**
 * @openapi
 * /api/teams/{teamId}/channels/{channelId}/messages/{messageId}/reactions:
 *   post:
 *     summary: Add a reaction to a message
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reactionType
 *             properties:
 *               reactionType:
 *                 type: string
 *                 description: Emoji reaction type (e.g., 'like', 'heart', 'laugh')
 *     responses:
 *       200:
 *         description: Reaction added successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:teamId/channels/:channelId/messages/:messageId/reactions',csrfProtection, async (req: AuthRequest, res: Response) => {
  try {
    const { teamId, channelId, messageId } = req.params
    const { reactionType } = req.body

    // Validate input
    if (!reactionType) {
      return res.status(400).json({
        success: false,
        error: 'Reaction type is required'
      })
    }

    const request: AddReactionRequest = {
      teamId,
      channelId,
      messageId,
      reactionType
    }

    await teamsService.addReaction(request)

    res.json({
      success: true,
      message: 'Reaction added successfully'
    })
  } catch (error) {
    logger.error('Error adding reaction', {
      error: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
      teamId: req.params.teamId,
      channelId: req.params.channelId,
      messageId: req.params.messageId,
      userId: req.user?.id
    })

    res.status(500).json({
      success: false,
      error: 'Failed to add reaction'
    })
  }
})

/**
 * @openapi
 * /api/teams/{teamId}/channels:
 *   post:
 *     summary: Create a new channel in a team
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - displayName
 *             properties:
 *               displayName:
 *                 type: string
 *               description:
 *                 type: string
 *               membershipType:
 *                 type: string
 *                 enum: [standard, private]
 *                 default: standard
 *     responses:
 *       201:
 *         description: Channel created successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/:teamId/channels',csrfProtection, async (req: AuthRequest, res: Response) => {
  try {
    const { teamId } = req.params
    const { displayName, description, membershipType } = req.body

    // Validate input
    if (!displayName) {
      return res.status(400).json({
        success: false,
        error: 'Display name is required'
      })
    }

    const request: CreateChannelRequest = {
      teamId,
      displayName,
      description,
      membershipType
    }

    const userId = req.user?.id ? parseInt(req.user.id) : undefined
    const channel = await teamsService.createChannel(request, userId)

    res.status(201).json({
      success: true,
      channel
    })
  } catch (error) {
    logger.error('Error creating channel', {
      error: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
      teamId: req.params.teamId,
      userId: req.user?.id
    })

    res.status(500).json({
      success: false,
      error: 'Failed to create channel'
    })
  }
})

/**
 * @openapi
 * /api/teams/{teamId}/channels/{channelId}/messages/{messageId}:
 *   patch:
 *     summary: Update/edit a message
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               contentType:
 *                 type: string
 *                 enum: [text, html]
 *                 default: html
 *     responses:
 *       200:
 *         description: Message updated successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch('/:teamId/channels/:channelId/messages/:messageId',csrfProtection, async (req: AuthRequest, res: Response) => {
  try {
    const { teamId, channelId, messageId } = req.params
    const { content, contentType } = req.body

    // Validate input
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      })
    }

    const request: UpdateMessageRequest = {
      teamId,
      channelId,
      messageId,
      content,
      contentType
    }

    const message = await teamsService.updateMessage(request)

    res.json({
      success: true,
      message
    })
  } catch (error) {
    logger.error('Error updating message', {
      error: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
      teamId: req.params.teamId,
      channelId: req.params.channelId,
      messageId: req.params.messageId,
      userId: req.user?.id
    })

    res.status(500).json({
      success: false,
      error: 'Failed to update message'
    })
  }
})

/**
 * @openapi
 * /api/teams/{teamId}/channels/{channelId}/messages/{messageId}:
 *   delete:
 *     summary: Delete a message
 *     tags:
 *       - Teams
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.delete('/:teamId/channels/:channelId/messages/:messageId',csrfProtection, async (req: AuthRequest, res: Response) => {
  try {
    const { teamId, channelId, messageId } = req.params

    await teamsService.deleteMessage(teamId, channelId, messageId)

    res.json({
      success: true,
      message: 'Message deleted successfully'
    })
  } catch (error) {
    logger.error('Error deleting message', {
      error: error instanceof Error ? getErrorMessage(error) : 'Unknown error',
      teamId: req.params.teamId,
      channelId: req.params.channelId,
      messageId: req.params.messageId,
      userId: req.user?.id
    })

    res.status(500).json({
      success: false,
      error: 'Failed to delete message'
    })
  }
})

export default router
