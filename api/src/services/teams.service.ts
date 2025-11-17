/**
 * Microsoft Teams Integration Service
 *
 * Full-featured Teams integration handling:
 * - Channels, messages, mentions, reactions, threading
 * - Adaptive Cards and rich formatting
 * - File attachments
 * - Communication logging to database
 *
 * Features:
 * - Send messages to Teams channels
 * - Retrieve messages and channel history
 * - Reply to messages (threading)
 * - Add emoji reactions
 * - Create and manage channels
 * - Parse and format @mentions
 * - Format Adaptive Cards
 * - Log all communications to database
 *
 * Business Value: Seamless Teams integration for fleet communications
 */

import microsoftGraphService from './microsoft-graph.service'
import { pool } from '../config/database'
import { logger } from '../config/logger'
import {
  Team,
  Channel,
  Message,
  SendMessageRequest,
  ReplyToMessageRequest,
  AddReactionRequest,
  CreateChannelRequest,
  UpdateMessageRequest,
  MentionInput,
  AdaptiveCard,
  CommunicationLog,
  CommunicationEntityLink,
  GraphApiResponse
} from '../types/teams.types'

class TeamsService {
  /**
   * Get all teams the user has access to
   */
  async getTeams(): Promise<Team[]> {
    try {
      logger.info('Fetching all teams from Microsoft Graph')

      const response = await microsoftGraphService.makeGraphRequest<GraphApiResponse<Team>>(
        '/teams',
        'GET'
      )

      const teams = response?.value || []
      logger.info(`Retrieved ${teams.length} teams`)

      return teams
    } catch (error) {
      logger.error('Failed to get teams', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw new Error('Failed to retrieve teams from Microsoft Graph')
    }
  }

  /**
   * Get all channels in a team
   */
  async getChannels(teamId: string): Promise<Channel[]> {
    try {
      logger.info('Fetching channels for team', { teamId })

      const response = await microsoftGraphService.makeGraphRequest<GraphApiResponse<Channel>>(
        `/teams/${teamId}/channels`,
        'GET'
      )

      const channels = response?.value || []
      logger.info(`Retrieved ${channels.length} channels for team ${teamId}`)

      return channels
    } catch (error) {
      logger.error('Failed to get channels', {
        teamId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw new Error(`Failed to retrieve channels for team ${teamId}`)
    }
  }

  /**
   * Get messages from a channel
   */
  async getMessages(teamId: string, channelId: string, limit: number = 50): Promise<Message[]> {
    try {
      logger.info('Fetching messages from channel', { teamId, channelId, limit })

      const response = await microsoftGraphService.makeGraphRequest<GraphApiResponse<Message>>(
        `/teams/${teamId}/channels/${channelId}/messages?$top=${limit}`,
        'GET'
      )

      const messages = response?.value || []
      logger.info(`Retrieved ${messages.length} messages from channel ${channelId}`)

      return messages
    } catch (error) {
      logger.error('Failed to get messages', {
        teamId,
        channelId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw new Error(`Failed to retrieve messages from channel ${channelId}`)
    }
  }

  /**
   * Send a message to a Teams channel
   * Also logs the communication to the database
   */
  async sendMessage(
    request: SendMessageRequest,
    userId?: number,
    entityLinks?: Partial<CommunicationEntityLink>[]
  ): Promise<{ message: Message; communicationId?: number }> {
    try {
      const { teamId, channelId, message, subject, contentType = 'html', mentions, attachments, importance = 'normal' } = request

      logger.info('Sending message to Teams channel', { teamId, channelId, subject })

      // Build message body
      const messageBody: any = {
        body: {
          contentType,
          content: message
        }
      }

      // Add subject if provided
      if (subject) {
        messageBody.subject = subject
      }

      // Add importance if not normal
      if (importance !== 'normal') {
        messageBody.importance = importance
      }

      // Add mentions if provided
      if (mentions && mentions.length > 0) {
        messageBody.mentions = mentions.map((mention, index) => ({
          id: index,
          mentionText: mention.mentionText || `@${mention.displayName}`,
          mentioned: {
            user: {
              id: mention.userId,
              displayName: mention.displayName,
              userIdentityType: 'aadUser'
            }
          }
        }))
      }

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        messageBody.attachments = attachments
      }

      // Send message via Graph API
      const sentMessage = await microsoftGraphService.makeGraphRequest<Message>(
        `/teams/${teamId}/channels/${channelId}/messages`,
        'POST',
        messageBody
      )

      logger.info('Message sent successfully', {
        messageId: sentMessage.id,
        teamId,
        channelId
      })

      // Log communication to database
      let communicationId: number | undefined
      if (userId) {
        communicationId = await this.logCommunication({
          communication_type: 'Chat',
          direction: 'Outbound',
          subject: subject || 'Teams Message',
          body: message,
          from_user_id: userId,
          communication_datetime: new Date(),
          thread_id: sentMessage.id,
          is_thread_start: true,
          attachments: attachments ? JSON.stringify(attachments) : null
        }, entityLinks)
      }

      return {
        message: sentMessage,
        communicationId
      }
    } catch (error) {
      logger.error('Failed to send message', {
        teamId: request.teamId,
        channelId: request.channelId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw new Error('Failed to send message to Teams channel')
    }
  }

  /**
   * Reply to a message (threading)
   */
  async replyToMessage(
    request: ReplyToMessageRequest,
    userId?: number
  ): Promise<{ message: Message; communicationId?: number }> {
    try {
      const { teamId, channelId, messageId, message, contentType = 'html', mentions, attachments } = request

      logger.info('Replying to Teams message', { teamId, channelId, messageId })

      // Build reply body
      const replyBody: any = {
        body: {
          contentType,
          content: message
        }
      }

      // Add mentions if provided
      if (mentions && mentions.length > 0) {
        replyBody.mentions = mentions.map((mention, index) => ({
          id: index,
          mentionText: mention.mentionText || `@${mention.displayName}`,
          mentioned: {
            user: {
              id: mention.userId,
              displayName: mention.displayName,
              userIdentityType: 'aadUser'
            }
          }
        }))
      }

      // Add attachments if provided
      if (attachments && attachments.length > 0) {
        replyBody.attachments = attachments
      }

      // Send reply via Graph API
      const sentReply = await microsoftGraphService.makeGraphRequest<Message>(
        `/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`,
        'POST',
        replyBody
      )

      logger.info('Reply sent successfully', {
        replyId: sentReply.id,
        parentMessageId: messageId
      })

      // Log communication to database
      let communicationId: number | undefined
      if (userId) {
        communicationId = await this.logCommunication({
          communication_type: 'Chat',
          direction: 'Outbound',
          subject: 'Teams Reply',
          body: message,
          from_user_id: userId,
          communication_datetime: new Date(),
          thread_id: messageId,
          is_thread_start: false,
          attachments: attachments ? JSON.stringify(attachments) : null
        })
      }

      return {
        message: sentReply,
        communicationId
      }
    } catch (error) {
      logger.error('Failed to reply to message', {
        teamId: request.teamId,
        channelId: request.channelId,
        messageId: request.messageId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw new Error('Failed to reply to Teams message')
    }
  }

  /**
   * Add an emoji reaction to a message
   */
  async addReaction(request: AddReactionRequest): Promise<void> {
    try {
      const { teamId, channelId, messageId, reactionType } = request

      logger.info('Adding reaction to message', { teamId, channelId, messageId, reactionType })

      // Note: Graph API endpoint for reactions
      // POST /teams/{teamId}/channels/{channelId}/messages/{messageId}/reactions
      await microsoftGraphService.makeGraphRequest(
        `/teams/${teamId}/channels/${channelId}/messages/${messageId}/reactions`,
        'POST',
        {
          reactionType
        }
      )

      logger.info('Reaction added successfully', { messageId, reactionType })
    } catch (error) {
      logger.error('Failed to add reaction', {
        teamId: request.teamId,
        channelId: request.channelId,
        messageId: request.messageId,
        reactionType: request.reactionType,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw new Error('Failed to add reaction to message')
    }
  }

  /**
   * Create a new channel in a team
   */
  async createChannel(request: CreateChannelRequest, userId?: number): Promise<Channel> {
    try {
      const { teamId, displayName, description, membershipType = 'standard' } = request

      logger.info('Creating new channel', { teamId, displayName, membershipType })

      const channelData: any = {
        displayName,
        membershipType
      }

      if (description) {
        channelData.description = description
      }

      const newChannel = await microsoftGraphService.makeGraphRequest<Channel>(
        `/teams/${teamId}/channels`,
        'POST',
        channelData
      )

      logger.info('Channel created successfully', {
        channelId: newChannel.id,
        teamId,
        displayName
      })

      return newChannel
    } catch (error) {
      logger.error('Failed to create channel', {
        teamId: request.teamId,
        displayName: request.displayName,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw new Error('Failed to create Teams channel')
    }
  }

  /**
   * Update/edit a message
   */
  async updateMessage(request: UpdateMessageRequest): Promise<Message> {
    try {
      const { teamId, channelId, messageId, content, contentType = 'html' } = request

      logger.info('Updating message', { teamId, channelId, messageId })

      const updatedMessage = await microsoftGraphService.makeGraphRequest<Message>(
        `/teams/${teamId}/channels/${channelId}/messages/${messageId}`,
        'PATCH',
        {
          body: {
            contentType,
            content
          }
        }
      )

      logger.info('Message updated successfully', { messageId })

      return updatedMessage
    } catch (error) {
      logger.error('Failed to update message', {
        teamId: request.teamId,
        channelId: request.channelId,
        messageId: request.messageId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw new Error('Failed to update Teams message')
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(teamId: string, channelId: string, messageId: string): Promise<void> {
    try {
      logger.info('Deleting message', { teamId, channelId, messageId })

      await microsoftGraphService.makeGraphRequest(
        `/teams/${teamId}/channels/${channelId}/messages/${messageId}`,
        'DELETE'
      )

      logger.info('Message deleted successfully', { messageId })
    } catch (error) {
      logger.error('Failed to delete message', {
        teamId,
        channelId,
        messageId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw new Error('Failed to delete Teams message')
    }
  }

  /**
   * Parse @mentions from message text
   * Returns array of mention inputs
   */
  getMentions(message: string): MentionInput[] {
    const mentions: MentionInput[] = []
    const mentionRegex = /@\[([^\]]+)\]\(([^\)]+)\)/g
    let match

    // Match format: @[Display Name](userId)
    while ((match = mentionRegex.exec(message)) !== null) {
      mentions.push({
        userId: match[2],
        displayName: match[1],
        mentionText: `@${match[1]}`
      })
    }

    return mentions
  }

  /**
   * Format data as an Adaptive Card
   */
  formatAdaptiveCard(data: {
    title?: string
    subtitle?: string
    text?: string
    facts?: { key: string; value: string }[]
    actions?: { title: string; url: string }[]
  }): AdaptiveCard {
    const body: any[] = []

    if (data.title) {
      body.push({
        type: 'TextBlock',
        text: data.title,
        weight: 'Bolder',
        size: 'Large'
      })
    }

    if (data.subtitle) {
      body.push({
        type: 'TextBlock',
        text: data.subtitle,
        spacing: 'None',
        isSubtle: true
      })
    }

    if (data.text) {
      body.push({
        type: 'TextBlock',
        text: data.text,
        wrap: true
      })
    }

    if (data.facts && data.facts.length > 0) {
      body.push({
        type: 'FactSet',
        facts: data.facts.map(fact => ({
          title: fact.key,
          value: fact.value
        }))
      })
    }

    const card: AdaptiveCard = {
      type: 'AdaptiveCard',
      version: '1.4',
      body,
      $schema: 'http://adaptivecards.io/schemas/adaptive-card.json'
    }

    if (data.actions && data.actions.length > 0) {
      card.actions = data.actions.map(action => ({
        type: 'Action.OpenUrl',
        title: action.title,
        url: action.url
      }))
    }

    return card
  }

  /**
   * Log communication to database
   * Integrates with the communications table from migration 021
   */
  private async logCommunication(
    communication: CommunicationLog,
    entityLinks?: Partial<CommunicationEntityLink>[]
  ): Promise<number> {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Insert communication record
      const result = await client.query(
        `INSERT INTO communications (
          communication_type, direction, subject, body,
          from_user_id, from_contact_name, from_contact_email,
          to_user_ids, to_contact_names, to_contact_emails,
          communication_datetime, thread_id, parent_communication_id,
          is_thread_start, attachments, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP)
        RETURNING id`,
        [
          communication.communication_type,
          communication.direction,
          communication.subject,
          communication.body,
          communication.from_user_id,
          communication.from_contact_name,
          communication.from_contact_email,
          communication.to_user_ids,
          communication.to_contact_names,
          communication.to_contact_emails,
          communication.communication_datetime,
          communication.thread_id,
          communication.parent_communication_id,
          communication.is_thread_start,
          communication.attachments
        ]
      )

      const communicationId = result.rows[0].id

      // Insert entity links if provided
      if (entityLinks && entityLinks.length > 0) {
        for (const link of entityLinks) {
          if (link.entity_type && link.entity_id) {
            await client.query(
              `INSERT INTO communication_entity_links (
                communication_id, entity_type, entity_id, link_type,
                relevance_score, auto_detected, manually_added, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
              ON CONFLICT (communication_id, entity_type, entity_id) DO NOTHING`,
              [
                communicationId,
                link.entity_type,
                link.entity_id,
                link.link_type || 'Related',
                link.relevance_score || 1.0,
                link.auto_detected || false,
                link.manually_added || true
              ]
            )
          }
        }
      }

      await client.query('COMMIT')

      logger.info('Communication logged to database', {
        communicationId,
        entityLinksCount: entityLinks?.length || 0
      })

      return communicationId
    } catch (error) {
      await client.query('ROLLBACK')
      logger.error('Failed to log communication to database', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    } finally {
      client.release()
    }
  }
}

export default new TeamsService()
