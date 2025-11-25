/**
 * Setup Microsoft Graph Webhooks
 *
 * This script creates webhook subscriptions for Teams and Outlook notifications.
 * Run during deployment to ensure webhooks are properly configured.
 *
 * Usage: npm run setup:webhooks
 */

import dotenv from 'dotenv';

dotenv.config();

interface Subscription {
  changeType: string;
  notificationUrl: string;
  resource: string;
  expirationDateTime: string;
  clientState: string;
}

class WebhookSetup {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly tenantId: string;
  private readonly webhookUrl: string;
  private readonly clientState: string;
  private accessToken: string | null = null;

  constructor() {
    this.clientId = process.env.MS_GRAPH_CLIENT_ID || '';
    this.clientSecret = process.env.MS_GRAPH_CLIENT_SECRET || '';
    this.tenantId = process.env.MS_GRAPH_TENANT_ID || '';
    this.webhookUrl = process.env.MS_GRAPH_WEBHOOK_URL || '';
    this.clientState = process.env.MS_GRAPH_CLIENT_STATE || 'fleet-management-secret';

    this.validateConfig();
  }

  private validateConfig(): void {
    const required = ['clientId', 'clientSecret', 'tenantId', 'webhookUrl'];
    const missing = required.filter(key => !this[key as keyof this]);

    if (missing.length > 0) {
      throw new Error('Missing required configuration: ${missing.join(', ')}');
    }

    if (!this.webhookUrl.startsWith('https://')) {
      throw new Error('Webhook URL must use HTTPS');
    }
  }

  async acquireToken(): Promise<string> {
    const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`Failed to acquire token: ${response.statusText}`);
    }

    const data = await response.json() as { access_token: string };
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  async createSubscription(subscription: Subscription): Promise<any> {
    if (!this.accessToken) {
      await this.acquireToken();
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create subscription: ${JSON.stringify(error)}`);
    }

    return response.json() as Promise<any>;
  }

  async listSubscriptions(): Promise<any[]> {
    if (!this.accessToken) {
      await this.acquireToken();
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/subscriptions', {
      headers: {
        'Authorization': 'Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list subscriptions: ${response.statusText}`);
    }

    const data = await response.json() as { value?: any[] };
    return data.value || [];
  }

  async deleteSubscription(subscriptionId: string): Promise<void> {
    if (!this.accessToken) {
      await this.acquireToken();
    }

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/subscriptions/${subscriptionId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ${this.accessToken}`
        }
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to delete subscription: ${response.statusText}`);
    }
  }

  async setupTeamsWebhook(teamId: string, channelId: string): Promise<any> {
    const expirationDateTime = new Date();
    expirationDateTime.setDate(expirationDateTime.getDate() + 3); // 3 days

    const subscription: Subscription = {
      changeType: 'created,updated',
      notificationUrl: `${this.webhookUrl}/teams`,
      resource: `/teams/${teamId}/channels/${channelId}/messages`,
      expirationDateTime: expirationDateTime.toISOString(),
      clientState: this.clientState
    };

    console.log('Creating Teams webhook subscription...');
    const result = await this.createSubscription(subscription);
    console.log('✓ Teams webhook created:', result.id);
    return result;
  }

  async setupOutlookWebhook(userEmail: string): Promise<any> {
    const expirationDateTime = new Date();
    expirationDateTime.setDate(expirationDateTime.getDate() + 3);

    const subscription: Subscription = {
      changeType: 'created,updated',
      notificationUrl: `${this.webhookUrl}/outlook`,
      resource: `/users/${userEmail}/messages`,
      expirationDateTime: expirationDateTime.toISOString(),
      clientState: this.clientState
    };

    console.log('Creating Outlook webhook subscription...');
    const result = await this.createSubscription(subscription);
    console.log('✓ Outlook webhook created:', result.id);
    return result;
  }

  async cleanupOldSubscriptions(): Promise<void> {
    console.log('Cleaning up old subscriptions...');
    const subscriptions = await this.listSubscriptions();

    for (const sub of subscriptions) {
      if (sub.notificationUrl.includes(this.webhookUrl)) {
        console.log(`Deleting old subscription: ${sub.id}`);
        await this.deleteSubscription(sub.id);
      }
    }

    console.log('✓ Cleanup complete');
  }
}

// Main execution
async function main() {
  try {
    console.log('=== Microsoft Graph Webhook Setup ===\n');

    const setup = new WebhookSetup();

    // Cleanup old subscriptions
    await setup.cleanupOldSubscriptions();

    // Setup new webhooks
    const teamId = process.env.DEFAULT_TEAM_ID;
    const channelId = process.env.DEFAULT_CHANNEL_ID;
    const userEmail = process.env.DEFAULT_USER_EMAIL;

    if (teamId && channelId) {
      await setup.setupTeamsWebhook(teamId, channelId);
    } else {
      console.log('⚠ Skipping Teams webhook (DEFAULT_TEAM_ID or DEFAULT_CHANNEL_ID not set)');
    }

    if (userEmail) {
      await setup.setupOutlookWebhook(userEmail);
    } else {
      console.log('⚠ Skipping Outlook webhook (DEFAULT_USER_EMAIL not set)');
    }

    console.log('\n✓ Webhook setup complete!');
    console.log('Remember to renew subscriptions before they expire (every 3 days)');

  } catch (error: any) {
    console.error('✗ Webhook setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { WebhookSetup };
