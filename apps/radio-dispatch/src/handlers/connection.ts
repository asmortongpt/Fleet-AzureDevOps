
import * as signalR from '@microsoft/signalr';

import { logger } from '../utils/logger';

interface QueuedMessage {
  type: string;
  data: any;
  timestamp: number;
}

export class ConnectionHandler {
  private connection: signalR.HubConnection;
  private messageQueue: QueuedMessage[] = [];
  private isReconnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(hubUrl: string) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff with jitter
          const baseDelay = Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          const jitter = Math.random() * 1000;
          return baseDelay + jitter;
        }
      })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.connection.onreconnecting((error) => {
      this.isReconnecting = true;
      this.reconnectAttempts++;
      logger.warn('SignalR reconnecting', {
        attempt: this.reconnectAttempts,
        error: error?.message
      });
    });

    this.connection.onreconnected((connectionId) => {
      this.isReconnecting = false;
      this.reconnectAttempts = 0;
      logger.info('SignalR reconnected', { connectionId });

      // Flush queued messages
      this.flushMessageQueue();
    });

    this.connection.onclose((error) => {
      logger.error('SignalR connection closed', { error: error?.message });

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        // Attempt manual reconnection
        setTimeout(() => this.start(), 5000);
      } else {
        // Notify user of permanent connection loss
        this.notifyConnectionLost();
      }
    });
  }

  async start() {
    try {
      await this.connection.start();
      logger.info('SignalR connected', {
        connectionId: this.connection.connectionId
      });
    } catch (error) {
      logger.error('SignalR connection failed', { error });
      throw error;
    }
  }

  async sendMessage(type: string, data: any) {
    // Queue message if disconnected
    if (this.connection.state !== signalR.HubConnectionState.Connected) {
      this.queueMessage(type, data);
      return;
    }

    try {
      await this.connection.send(type, data);
    } catch (error) {
      logger.error('Failed to send message', { type, error });
      // Queue message for retry
      this.queueMessage(type, data);
      throw error;
    }
  }

  private queueMessage(type: string, data: any) {
    const message: QueuedMessage = {
      type,
      data,
      timestamp: Date.now()
    };

    this.messageQueue.push(message);
    logger.debug('Message queued', { type, queueLength: this.messageQueue.length });

    // Limit queue size (keep last 100 messages)
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
  }

  private async flushMessageQueue() {
    if (this.messageQueue.length === 0) return;

    logger.info('Flushing message queue', { count: this.messageQueue.length });

    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messages) {
      try {
        await this.connection.send(message.type, message.data);
      } catch (error) {
        logger.error('Failed to flush queued message', { message, error });
        // Re-queue failed message
        this.messageQueue.push(message);
      }
    }
  }

  private notifyConnectionLost() {
    // Emit event or show UI notification
    window.dispatchEvent(new CustomEvent('signalr:connection-lost'));
  }

  async stop() {
    await this.connection.stop();
  }
}
