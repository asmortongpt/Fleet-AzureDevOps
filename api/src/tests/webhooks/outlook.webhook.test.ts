/**
 * Outlook Webhook Tests
 *
 * Tests for Outlook webhook handling including:
 * - Webhook validation
 * - Processing email notifications
 * - Subscription management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';

// Mock Outlook webhook payload types
interface OutlookWebhookPayload {
  subscriptionId: string;
  clientState: string;
  changeType: string;
  resource: string;
  resourceData: {
    '@odata.type': string;
    '@odata.id': string;
    '@odata.etag': string;
    id: string;
  };
  subscriptionExpirationDateTime: string;
  tenantId: string;
}

// Mock Outlook Webhook Service
class OutlookWebhookService {
  private readonly webhookSecret: string;
  private readonly clientState: string;

  constructor(secret: string, clientState: string) {
    this.webhookSecret = secret;
    this.clientState = clientState;
  }

  validateSignature(payload: string, signature: string): boolean {
    const hmac = crypto.createHmac('sha256', this.webhookSecret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('base64');
    return signature === expectedSignature;
  }

  validateClientState(payload: OutlookWebhookPayload): boolean {
    return payload.clientState === this.clientState;
  }

  async handleValidationRequest(validationToken: string): Promise<string> {
    return validationToken;
  }

  async processNotification(payload: OutlookWebhookPayload): Promise<void> {
    if (!this.validateClientState(payload)) {
      throw new Error('Invalid client state');
    }

    switch (payload.changeType) {
      case 'created':
        await this.handleEmailReceived(payload);
        break;
      case 'updated':
        await this.handleEmailUpdated(payload);
        break;
      case 'deleted':
        await this.handleEmailDeleted(payload);
        break;
      default:
        console.log(`Unhandled change type: ${payload.changeType}`);
    }
  }

  private async handleEmailReceived(payload: OutlookWebhookPayload): Promise<void> {
    console.log('Email received:', payload.resourceData.id);
    // Here you would typically:
    // 1. Fetch the full email using Graph API
    // 2. Process attachments if any
    // 3. Apply AI analysis for receipt scanning
    // 4. Store in database
    // 5. Notify user via WebSocket
  }

  private async handleEmailUpdated(payload: OutlookWebhookPayload): Promise<void> {
    console.log('Email updated:', payload.resourceData.id);
  }

  private async handleEmailDeleted(payload: OutlookWebhookPayload): Promise<void> {
    console.log('Email deleted:', payload.resourceData.id);
  }

  async createSubscription(userEmail: string, callbackUrl: string): Promise<any> {
    return {
      id: 'sub_' + Date.now(),
      resource: `users/${userEmail}/messages`,
      changeType: 'created,updated,deleted',
      notificationUrl: callbackUrl,
      expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      clientState: this.clientState
    };
  }

  async renewSubscription(subscriptionId: string): Promise<any> {
    return {
      id: subscriptionId,
      expirationDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    console.log('Deleting subscription:', subscriptionId);
  }
}

describe('OutlookWebhookService', () => {
  let service: OutlookWebhookService;
  const mockSecret = 'outlook_webhook_secret_123';
  const mockClientState = 'outlook_client_state_456';

  beforeEach(() => {
    service = new OutlookWebhookService(mockSecret, mockClientState);
  });

  describe('Signature Verification', () => {
    it('should validate correct webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const hmac = crypto.createHmac('sha256', mockSecret);
      hmac.update(payload);
      const signature = hmac.digest('base64');

      const result = service.validateSignature(payload, signature);

      expect(result).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const invalidSignature = 'invalid_signature';

      const result = service.validateSignature(payload, invalidSignature);

      expect(result).toBe(false);
    });
  });

  describe('Client State Validation', () => {
    it('should validate correct client state', () => {
      const payload: OutlookWebhookPayload = {
        subscriptionId: 'sub_123',
        clientState: mockClientState,
        changeType: 'created',
        resource: 'users/user@example.com/messages/message_123',
        resourceData: {
          '@odata.type': '#Microsoft.Graph.Message',
          '@odata.id': 'users/user@example.com/messages/message_123',
          '@odata.etag': 'W/"etag_value"',
          id: 'message_123'
        },
        subscriptionExpirationDateTime: '2025-02-15T10:00:00Z',
        tenantId: 'tenant_123'
      };

      const result = service.validateClientState(payload);

      expect(result).toBe(true);
    });

    it('should reject invalid client state', () => {
      const payload: OutlookWebhookPayload = {
        subscriptionId: 'sub_123',
        clientState: 'wrong_state',
        changeType: 'created',
        resource: 'users/user@example.com/messages/message_123',
        resourceData: {
          '@odata.type': '#Microsoft.Graph.Message',
          '@odata.id': 'users/user@example.com/messages/message_123',
          '@odata.etag': 'W/"etag_value"',
          id: 'message_123'
        },
        subscriptionExpirationDateTime: '2025-02-15T10:00:00Z',
        tenantId: 'tenant_123'
      };

      const result = service.validateClientState(payload);

      expect(result).toBe(false);
    });
  });

  describe('Validation Request Handling', () => {
    it('should return validation token', async () => {
      const validationToken = 'outlook_validation_token';

      const result = await service.handleValidationRequest(validationToken);

      expect(result).toBe(validationToken);
    });
  });

  describe('Email Notification Processing', () => {
    const createMockPayload = (changeType: string): OutlookWebhookPayload => ({
      subscriptionId: 'sub_123',
      clientState: mockClientState,
      changeType,
      resource: 'users/user@example.com/messages/message_123',
      resourceData: {
        '@odata.type': '#Microsoft.Graph.Message',
        '@odata.id': 'users/user@example.com/messages/message_123',
        '@odata.etag': 'W/"etag_value"',
        id: 'message_123'
      },
      subscriptionExpirationDateTime: '2025-02-15T10:00:00Z',
      tenantId: 'tenant_123'
    });

    it('should process email received notification', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const payload = createMockPayload('created');

      await service.processNotification(payload);

      expect(consoleSpy).toHaveBeenCalledWith('Email received:', 'message_123');
      consoleSpy.mockRestore();
    });

    it('should process email updated notification', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const payload = createMockPayload('updated');

      await service.processNotification(payload);

      expect(consoleSpy).toHaveBeenCalledWith('Email updated:', 'message_123');
      consoleSpy.mockRestore();
    });

    it('should process email deleted notification', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const payload = createMockPayload('deleted');

      await service.processNotification(payload);

      expect(consoleSpy).toHaveBeenCalledWith('Email deleted:', 'message_123');
      consoleSpy.mockRestore();
    });

    it('should reject notification with invalid client state', async () => {
      const payload = createMockPayload('created');
      payload.clientState = 'invalid';

      await expect(service.processNotification(payload)).rejects.toThrow(
        'Invalid client state'
      );
    });
  });

  describe('Subscription Management', () => {
    it('should create a new subscription', async () => {
      const subscription = await service.createSubscription(
        'user@example.com',
        'https://example.com/webhooks/outlook'
      );

      expect(subscription.id).toMatch(/^sub_/);
      expect(subscription.resource).toContain('user@example.com');
      expect(subscription.changeType).toBe('created,updated,deleted');
      expect(subscription.notificationUrl).toBe('https://example.com/webhooks/outlook');
      expect(subscription.clientState).toBe(mockClientState);
    });

    it('should set expiration to 3 days from now', async () => {
      const beforeCreate = Date.now();
      const subscription = await service.createSubscription(
        'user@example.com',
        'https://example.com/webhooks/outlook'
      );
      const afterCreate = Date.now();

      const expiration = new Date(subscription.expirationDateTime).getTime();
      const expectedMin = beforeCreate + 3 * 24 * 60 * 60 * 1000 - 1000; // 1s tolerance
      const expectedMax = afterCreate + 3 * 24 * 60 * 60 * 1000 + 1000;

      expect(expiration).toBeGreaterThanOrEqual(expectedMin);
      expect(expiration).toBeLessThanOrEqual(expectedMax);
    });

    it('should renew existing subscription', async () => {
      const subscriptionId = 'sub_123';
      const beforeRenew = Date.now();
      const renewed = await service.renewSubscription(subscriptionId);
      const afterRenew = Date.now();

      expect(renewed.id).toBe(subscriptionId);

      const expiration = new Date(renewed.expirationDateTime).getTime();
      const expectedMin = beforeRenew + 3 * 24 * 60 * 60 * 1000 - 1000;
      const expectedMax = afterRenew + 3 * 24 * 60 * 60 * 1000 + 1000;

      expect(expiration).toBeGreaterThanOrEqual(expectedMin);
      expect(expiration).toBeLessThanOrEqual(expectedMax);
    });

    it('should delete subscription', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const subscriptionId = 'sub_123';

      await service.deleteSubscription(subscriptionId);

      expect(consoleSpy).toHaveBeenCalledWith('Deleting subscription:', subscriptionId);
      consoleSpy.mockRestore();
    });
  });
});
