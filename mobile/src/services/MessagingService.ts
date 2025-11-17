/**
 * MessagingService
 * Service for sending emails, SMS, and Teams messages from mobile app
 * Supports offline queueing and delivery tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  SendEmailRequest,
  SendEmailResponse,
  SendSMSRequest,
  SendSMSResponse,
  SendTeamsMessageRequest,
  SendTeamsMessageResponse,
  MessageTemplate,
  Contact,
  QueuedMessage,
  DeliveryStatus,
  TeamsChannel,
  TeamsTeam,
  TeamsMessage,
  EmailDraft,
  SMSDraft,
} from '../types/messaging.types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const QUEUE_STORAGE_KEY = '@fleet_message_queue';
const DRAFTS_STORAGE_KEY = '@fleet_message_drafts';

export class MessagingService {
  private authToken: string | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Start processing queue
    this.processQueue();

    // Listen for network changes
    NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        this.processQueue();
      }
    });
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Get authentication headers
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
    };
  }

  // ============================================================================
  // Email Methods
  // ============================================================================

  /**
   * Send email via Microsoft Graph
   */
  async sendEmail(request: SendEmailRequest): Promise<SendEmailResponse> {
    try {
      const isOnline = await this.isOnline();

      if (!isOnline) {
        // Queue for later
        await this.queueMessage('email', request);
        return {
          success: true,
          messageId: 'queued',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/mobile/email/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      return {
        success: true,
        messageId: data.messageId,
        communicationId: data.communicationId,
      };
    } catch (error) {
      console.error('Failed to send email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  // ============================================================================
  // SMS Methods
  // ============================================================================

  /**
   * Send SMS via Twilio
   */
  async sendSMS(request: SendSMSRequest): Promise<SendSMSResponse> {
    try {
      const isOnline = await this.isOnline();

      if (!isOnline) {
        // Queue for later
        await this.queueMessage('sms', request);
        return {
          success: true,
          messageId: 'queued',
          status: 'queued',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/mobile/sms/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send SMS');
      }

      return {
        success: true,
        messageId: data.messageId,
        communicationId: data.communicationId,
        status: data.status,
      };
    } catch (error) {
      console.error('Failed to send SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS',
      };
    }
  }

  // ============================================================================
  // Teams Methods
  // ============================================================================

  /**
   * Send Teams message
   */
  async sendTeamsMessage(
    request: SendTeamsMessageRequest
  ): Promise<SendTeamsMessageResponse> {
    try {
      const isOnline = await this.isOnline();

      if (!isOnline) {
        // Queue for later
        await this.queueMessage('teams', request);
        return {
          success: true,
          messageId: 'queued',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/mobile/teams/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send Teams message');
      }

      return {
        success: true,
        messageId: data.messageId,
        communicationId: data.communicationId,
      };
    } catch (error) {
      console.error('Failed to send Teams message:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to send Teams message',
      };
    }
  }

  /**
   * Get Teams channels
   */
  async getTeamsChannel(
    teamId: string,
    channelId: string
  ): Promise<TeamsChannel> {
    const response = await fetch(
      `${API_BASE_URL}/api/teams/${teamId}/channels/${channelId}`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch channel');
    }

    const data = await response.json();
    return data.channel;
  }

  /**
   * Get Teams team info
   */
  async getTeamsTeam(teamId: string): Promise<TeamsTeam> {
    const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch team');
    }

    const data = await response.json();
    return data.team;
  }

  /**
   * Get Teams messages
   */
  async getTeamsMessages(
    teamId: string,
    channelId: string,
    limit: number = 50
  ): Promise<{ success: boolean; messages?: TeamsMessage[] }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/teams/${teamId}/channels/${channelId}/messages?limit=${limit}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      return {
        success: true,
        messages: data.messages || [],
      };
    } catch (error) {
      console.error('Failed to get Teams messages:', error);
      return {
        success: false,
      };
    }
  }

  // ============================================================================
  // Template Methods
  // ============================================================================

  /**
   * Get message templates
   */
  async getTemplates(
    type?: 'email' | 'sms' | 'teams'
  ): Promise<{ success: boolean; templates?: MessageTemplate[] }> {
    try {
      const url = type
        ? `${API_BASE_URL}/api/mobile/templates?type=${type}`
        : `${API_BASE_URL}/api/mobile/templates`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      return {
        success: true,
        templates: data.data || data.templates || [],
      };
    } catch (error) {
      console.error('Failed to get templates:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Create custom template
   */
  async createTemplate(template: Partial<MessageTemplate>): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/templates`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(template),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to create template:', error);
      return false;
    }
  }

  // ============================================================================
  // Contact Methods
  // ============================================================================

  /**
   * Get contact list
   */
  async getContacts(): Promise<{ success: boolean; contacts?: Contact[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/mobile/contacts`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }

      const data = await response.json();
      return {
        success: true,
        contacts: data.data || data.contacts || [],
      };
    } catch (error) {
      console.error('Failed to get contacts:', error);
      return {
        success: false,
      };
    }
  }

  // ============================================================================
  // Draft Methods
  // ============================================================================

  /**
   * Save message draft
   */
  async saveDraft(
    type: 'email' | 'sms',
    draft: EmailDraft | SMSDraft
  ): Promise<void> {
    try {
      const drafts = await this.getDrafts();
      const draftWithId = {
        ...draft,
        id: draft.id || Date.now().toString(),
        type,
        updatedAt: new Date(),
      };

      const existingIndex = drafts.findIndex((d) => d.id === draftWithId.id);
      if (existingIndex >= 0) {
        drafts[existingIndex] = draftWithId;
      } else {
        drafts.push(draftWithId);
      }

      await AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw error;
    }
  }

  /**
   * Get all drafts
   */
  async getDrafts(): Promise<any[]> {
    try {
      const draftsJson = await AsyncStorage.getItem(DRAFTS_STORAGE_KEY);
      return draftsJson ? JSON.parse(draftsJson) : [];
    } catch (error) {
      console.error('Failed to get drafts:', error);
      return [];
    }
  }

  /**
   * Delete draft
   */
  async deleteDraft(draftId: string): Promise<void> {
    try {
      const drafts = await this.getDrafts();
      const filtered = drafts.filter((d) => d.id !== draftId);
      await AsyncStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete draft:', error);
      throw error;
    }
  }

  // ============================================================================
  // Queue Methods (Offline Support)
  // ============================================================================

  /**
   * Queue message for sending when online
   */
  private async queueMessage(
    type: 'email' | 'sms' | 'teams',
    payload: any
  ): Promise<void> {
    try {
      const queue = await this.getQueue();
      const message: QueuedMessage = {
        id: Date.now().toString(),
        type,
        payload,
        status: 'pending',
        attempts: 0,
        createdAt: new Date(),
      };

      queue.push(message);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to queue message:', error);
      throw error;
    }
  }

  /**
   * Get message queue
   */
  private async getQueue(): Promise<QueuedMessage[]> {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      return queueJson ? JSON.parse(queueJson) : [];
    } catch (error) {
      console.error('Failed to get queue:', error);
      return [];
    }
  }

  /**
   * Process message queue
   */
  private async processQueue(): Promise<void> {
    try {
      const isOnline = await this.isOnline();
      if (!isOnline) return;

      const queue = await this.getQueue();
      const pendingMessages = queue.filter((m) => m.status === 'pending');

      for (const message of pendingMessages) {
        message.status = 'sending';
        message.attempts++;
        message.lastAttempt = new Date();

        try {
          let result;
          switch (message.type) {
            case 'email':
              result = await this.sendEmail(message.payload);
              break;
            case 'sms':
              result = await this.sendSMS(message.payload);
              break;
            case 'teams':
              result = await this.sendTeamsMessage(message.payload);
              break;
          }

          if (result && result.success) {
            message.status = 'sent';
          } else {
            message.status = message.attempts >= 3 ? 'failed' : 'pending';
            message.error = result?.error;
          }
        } catch (error) {
          message.status = message.attempts >= 3 ? 'failed' : 'pending';
          message.error =
            error instanceof Error ? error.message : 'Unknown error';
        }
      }

      // Remove sent messages, keep failed for review
      const updatedQueue = queue.filter((m) => m.status !== 'sent');
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueue));
    } catch (error) {
      console.error('Failed to process queue:', error);
    }
  }

  /**
   * Get failed messages from queue
   */
  async getFailedMessages(): Promise<QueuedMessage[]> {
    const queue = await this.getQueue();
    return queue.filter((m) => m.status === 'failed');
  }

  /**
   * Retry failed message
   */
  async retryMessage(messageId: string): Promise<void> {
    const queue = await this.getQueue();
    const message = queue.find((m) => m.id === messageId);
    if (message) {
      message.status = 'pending';
      message.attempts = 0;
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
      this.processQueue();
    }
  }

  /**
   * Clear failed messages
   */
  async clearFailedMessages(): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter((m) => m.status !== 'failed');
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(filtered));
  }

  // ============================================================================
  // Delivery Status Methods
  // ============================================================================

  /**
   * Get delivery status for a message
   */
  async getDeliveryStatus(
    messageId: string,
    type: 'email' | 'sms' | 'teams'
  ): Promise<DeliveryStatus | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/mobile/status/${type}/${messageId}`,
        {
          method: 'GET',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Failed to get delivery status:', error);
      return null;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Check if device is online
   */
  private async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  }
}

export default MessagingService;
