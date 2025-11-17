/**
 * Microsoft Teams Service Tests
 *
 * Tests for Teams integration including:
 * - Sending messages to Teams channels
 * - Fetching channels and messages
 * - Reply functionality
 * - @mentions parsing
 * - Reactions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Teams API responses
const mockTeam = {
  id: 'team_123',
  displayName: 'Fleet Management Team',
  description: 'Team for fleet operations'
};

const mockChannel = {
  id: 'channel_456',
  displayName: 'General',
  description: 'General channel'
};

const mockMessage = {
  id: 'message_789',
  createdDateTime: '2025-01-15T10:00:00Z',
  from: {
    user: {
      id: 'user_123',
      displayName: 'Test User'
    }
  },
  body: {
    content: 'Hello, this is a test message',
    contentType: 'text'
  },
  mentions: []
};

const mockAdaptiveCard = {
  type: 'message',
  attachments: [
    {
      contentType: 'application/vnd.microsoft.card.adaptive',
      content: {
        type: 'AdaptiveCard',
        body: [
          {
            type: 'TextBlock',
            text: 'Test Card'
          }
        ],
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.4'
      }
    }
  ]
};

// Mock Teams Service
class TeamsService {
  constructor(private graphService: any) {}

  async sendMessage(teamId: string, channelId: string, message: string): Promise<any> {
    return this.graphService.makeGraphRequest(
      `/teams/${teamId}/channels/${channelId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({
          body: {
            content: message,
            contentType: 'text'
          }
        })
      }
    );
  }

  async sendAdaptiveCard(teamId: string, channelId: string, card: any): Promise<any> {
    return this.graphService.makeGraphRequest(
      `/teams/${teamId}/channels/${channelId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify(card)
      }
    );
  }

  async getChannels(teamId: string): Promise<any[]> {
    const response = await this.graphService.makeGraphRequest(
      `/teams/${teamId}/channels`
    );
    return response.value || [];
  }

  async getMessages(teamId: string, channelId: string, limit: number = 50): Promise<any[]> {
    const response = await this.graphService.makeGraphRequest(
      `/teams/${teamId}/channels/${channelId}/messages?$top=${limit}`
    );
    return response.value || [];
  }

  async replyToMessage(
    teamId: string,
    channelId: string,
    messageId: string,
    reply: string
  ): Promise<any> {
    return this.graphService.makeGraphRequest(
      `/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`,
      {
        method: 'POST',
        body: JSON.stringify({
          body: {
            content: reply,
            contentType: 'text'
          }
        })
      }
    );
  }

  async addReaction(
    teamId: string,
    channelId: string,
    messageId: string,
    reactionType: string
  ): Promise<void> {
    await this.graphService.makeGraphRequest(
      `/teams/${teamId}/channels/${channelId}/messages/${messageId}/reactions`,
      {
        method: 'POST',
        body: JSON.stringify({
          reactionType
        })
      }
    );
  }

  parseMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  formatMentionForTeams(userId: string, displayName: string): string {
    return `<at id="${userId}">${displayName}</at>`;
  }
}

describe('TeamsService', () => {
  let service: TeamsService;
  let mockGraphService: any;

  beforeEach(() => {
    mockGraphService = {
      makeGraphRequest: vi.fn()
    };
    service = new TeamsService(mockGraphService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Sending Messages', () => {
    it('should send a text message to Teams channel', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(mockMessage);

      const result = await service.sendMessage('team_123', 'channel_456', 'Test message');

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/teams/team_123/channels/channel_456/messages',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test message')
        })
      );
      expect(result).toEqual(mockMessage);
    });

    it('should send an Adaptive Card to Teams channel', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(mockAdaptiveCard);

      const result = await service.sendAdaptiveCard('team_123', 'channel_456', mockAdaptiveCard);

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/teams/team_123/channels/channel_456/messages',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('AdaptiveCard')
        })
      );
      expect(result).toEqual(mockAdaptiveCard);
    });

    it('should handle send message failure', async () => {
      mockGraphService.makeGraphRequest.mockRejectedValue(new Error('Failed to send'));

      await expect(
        service.sendMessage('team_123', 'channel_456', 'Test message')
      ).rejects.toThrow('Failed to send');
    });
  });

  describe('Fetching Channels and Messages', () => {
    it('should fetch all channels for a team', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue({
        value: [mockChannel]
      });

      const channels = await service.getChannels('team_123');

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith('/teams/team_123/channels');
      expect(channels).toHaveLength(1);
      expect(channels[0]).toEqual(mockChannel);
    });

    it('should fetch messages from a channel', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue({
        value: [mockMessage]
      });

      const messages = await service.getMessages('team_123', 'channel_456');

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/teams/team_123/channels/channel_456/messages?$top=50'
      );
      expect(messages).toHaveLength(1);
      expect(messages[0]).toEqual(mockMessage);
    });

    it('should respect message limit parameter', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue({ value: [] });

      await service.getMessages('team_123', 'channel_456', 25);

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/teams/team_123/channels/channel_456/messages?$top=25'
      );
    });

    it('should handle empty channel list', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue({ value: [] });

      const channels = await service.getChannels('team_123');

      expect(channels).toEqual([]);
    });
  });

  describe('Reply Functionality', () => {
    it('should reply to a message', async () => {
      const replyMessage = { ...mockMessage, id: 'reply_123' };
      mockGraphService.makeGraphRequest.mockResolvedValue(replyMessage);

      const result = await service.replyToMessage(
        'team_123',
        'channel_456',
        'message_789',
        'This is a reply'
      );

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/teams/team_123/channels/channel_456/messages/message_789/replies',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('This is a reply')
        })
      );
      expect(result).toEqual(replyMessage);
    });

    it('should handle reply failure', async () => {
      mockGraphService.makeGraphRequest.mockRejectedValue(new Error('Reply failed'));

      await expect(
        service.replyToMessage('team_123', 'channel_456', 'message_789', 'Reply')
      ).rejects.toThrow('Reply failed');
    });
  });

  describe('@Mentions Parsing', () => {
    it('should parse mentions from message content', () => {
      const content = 'Hey @john, can you help @jane with this?';
      const mentions = service.parseMentions(content);

      expect(mentions).toEqual(['john', 'jane']);
    });

    it('should handle message with no mentions', () => {
      const content = 'No mentions in this message';
      const mentions = service.parseMentions(content);

      expect(mentions).toEqual([]);
    });

    it('should handle duplicate mentions', () => {
      const content = '@john, please check with @john again';
      const mentions = service.parseMentions(content);

      expect(mentions).toEqual(['john', 'john']);
    });

    it('should format mention for Teams', () => {
      const formatted = service.formatMentionForTeams('user_123', 'John Doe');

      expect(formatted).toBe('<at id="user_123">John Doe</at>');
    });
  });

  describe('Reactions', () => {
    it('should add a reaction to a message', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(undefined);

      await service.addReaction('team_123', 'channel_456', 'message_789', 'like');

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/teams/team_123/channels/channel_456/messages/message_789/reactions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('like')
        })
      );
    });

    it('should handle different reaction types', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(undefined);

      const reactions = ['like', 'heart', 'laugh', 'surprised', 'sad', 'angry'];

      for (const reaction of reactions) {
        await service.addReaction('team_123', 'channel_456', 'message_789', reaction);
      }

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledTimes(reactions.length);
    });

    it('should handle reaction failure', async () => {
      mockGraphService.makeGraphRequest.mockRejectedValue(new Error('Reaction failed'));

      await expect(
        service.addReaction('team_123', 'channel_456', 'message_789', 'like')
      ).rejects.toThrow('Reaction failed');
    });
  });
});
