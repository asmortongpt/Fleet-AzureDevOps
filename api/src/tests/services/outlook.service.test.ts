/**
 * Microsoft Outlook Service Tests
 *
 * Tests for Outlook integration including:
 * - Sending emails
 * - Fetching emails with filters
 * - Reply/forward functionality
 * - Attachment handling
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Outlook API responses
const mockEmail = {
  id: 'email_123',
  subject: 'Test Email',
  from: {
    emailAddress: {
      name: 'Test Sender',
      address: 'sender@example.com'
    }
  },
  toRecipients: [
    {
      emailAddress: {
        name: 'Test Recipient',
        address: 'recipient@example.com'
      }
    }
  ],
  body: {
    contentType: 'HTML',
    content: '<p>This is a test email</p>'
  },
  receivedDateTime: '2025-01-15T10:00:00Z',
  hasAttachments: false,
  isRead: false
};

const mockAttachment = {
  '@odata.type': '#microsoft.graph.fileAttachment',
  id: 'attachment_123',
  name: 'document.pdf',
  contentType: 'application/pdf',
  size: 102400,
  contentBytes: 'BASE64_ENCODED_CONTENT'
};

const mockFolder = {
  id: 'folder_123',
  displayName: 'Inbox',
  totalItemCount: 10,
  unreadItemCount: 5
};

// Mock Outlook Service
class OutlookService {
  constructor(private graphService: any) {}

  async sendEmail(to: string[], subject: string, body: string, attachments?: any[]): Promise<any> {
    const message = {
      subject,
      body: {
        contentType: 'HTML',
        content: body
      },
      toRecipients: to.map(email => ({
        emailAddress: { address: email }
      })),
      attachments: attachments || []
    };

    return this.graphService.makeGraphRequest('/me/sendMail', {
      method: 'POST',
      body: JSON.stringify({ message, saveToSentItems: true })
    });
  }

  async getEmails(folderId: string = 'inbox', filters?: {
    unreadOnly?: boolean;
    from?: string;
    hasAttachments?: boolean;
    top?: number;
  }): Promise<any[]> {
    let queryParams: string[] = [];

    if (filters?.unreadOnly) {
      queryParams.push('$filter=isRead eq false');
    }

    if (filters?.from) {
      const filterStr = `from/emailAddress/address eq '${filters.from}'`;
      queryParams.push(
        queryParams.length > 0
          ? `and ${filterStr}`
          : `$filter=${filterStr}`
      );
    }

    if (filters?.hasAttachments) {
      const filterStr = 'hasAttachments eq true';
      queryParams.push(
        queryParams.length > 0
          ? `and ${filterStr}`
          : `$filter=${filterStr}`
      );
    }

    if (filters?.top) {
      queryParams.push(`$top=${filters.top}`);
    }

    const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    const response = await this.graphService.makeGraphRequest(
      `/me/mailFolders/${folderId}/messages${query}`
    );

    return response.value || [];
  }

  async replyToEmail(messageId: string, comment: string): Promise<void> {
    await this.graphService.makeGraphRequest(`/me/messages/${messageId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ comment })
    });
  }

  async forwardEmail(messageId: string, toRecipients: string[], comment?: string): Promise<void> {
    await this.graphService.makeGraphRequest(`/me/messages/${messageId}/forward`, {
      method: 'POST',
      body: JSON.stringify({
        comment: comment || '',
        toRecipients: toRecipients.map(email => ({
          emailAddress: { address: email }
        }))
      })
    });
  }

  async getAttachments(messageId: string): Promise<any[]> {
    const response = await this.graphService.makeGraphRequest(
      `/me/messages/${messageId}/attachments`
    );
    return response.value || [];
  }

  async downloadAttachment(messageId: string, attachmentId: string): Promise<any> {
    return this.graphService.makeGraphRequest(
      `/me/messages/${messageId}/attachments/${attachmentId}`
    );
  }

  async createFolder(displayName: string, parentFolderId?: string): Promise<any> {
    const endpoint = parentFolderId
      ? `/me/mailFolders/${parentFolderId}/childFolders`
      : '/me/mailFolders';

    return this.graphService.makeGraphRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ displayName })
    });
  }

  async markAsRead(messageId: string, isRead: boolean = true): Promise<void> {
    await this.graphService.makeGraphRequest(`/me/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ isRead })
    });
  }

  async deleteEmail(messageId: string): Promise<void> {
    await this.graphService.makeGraphRequest(`/me/messages/${messageId}`, {
      method: 'DELETE'
    });
  }
}

describe('OutlookService', () => {
  let service: OutlookService;
  let mockGraphService: any;

  beforeEach(() => {
    mockGraphService = {
      makeGraphRequest: vi.fn()
    };
    service = new OutlookService(mockGraphService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Sending Emails', () => {
    it('should send a simple email', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(undefined);

      await service.sendEmail(
        ['recipient@example.com'],
        'Test Subject',
        '<p>Test Body</p>'
      );

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/me/sendMail',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Test Subject')
        })
      );
    });

    it('should send email to multiple recipients', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(undefined);

      await service.sendEmail(
        ['recipient1@example.com', 'recipient2@example.com'],
        'Test Subject',
        '<p>Test Body</p>'
      );

      const callArgs = mockGraphService.makeGraphRequest.mock.calls[0];
      const bodyData = JSON.parse(callArgs[1].body);

      expect(bodyData.message.toRecipients).toHaveLength(2);
    });

    it('should send email with attachments', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(undefined);

      await service.sendEmail(
        ['recipient@example.com'],
        'Test Subject',
        '<p>Test Body</p>',
        [mockAttachment]
      );

      const callArgs = mockGraphService.makeGraphRequest.mock.calls[0];
      const bodyData = JSON.parse(callArgs[1].body);

      expect(bodyData.message.attachments).toHaveLength(1);
    });

    it('should handle send email failure', async () => {
      mockGraphService.makeGraphRequest.mockRejectedValue(new Error('Send failed'));

      await expect(
        service.sendEmail(['recipient@example.com'], 'Test', 'Body')
      ).rejects.toThrow('Send failed');
    });
  });

  describe('Fetching Emails', () => {
    it('should fetch emails from inbox', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue({
        value: [mockEmail]
      });

      const emails = await service.getEmails('inbox');

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/me/mailFolders/inbox/messages'
      );
      expect(emails).toHaveLength(1);
      expect(emails[0]).toEqual(mockEmail);
    });

    it('should filter unread emails only', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue({
        value: [mockEmail]
      });

      await service.getEmails('inbox', { unreadOnly: true });

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        expect.stringContaining('isRead eq false')
      );
    });

    it('should filter emails by sender', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue({
        value: [mockEmail]
      });

      await service.getEmails('inbox', { from: 'sender@example.com' });

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        expect.stringContaining("from/emailAddress/address eq 'sender@example.com'")
      );
    });

    it('should filter emails with attachments', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue({
        value: [mockEmail]
      });

      await service.getEmails('inbox', { hasAttachments: true });

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        expect.stringContaining('hasAttachments eq true')
      );
    });

    it('should limit number of emails returned', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue({
        value: [mockEmail]
      });

      await service.getEmails('inbox', { top: 10 });

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        expect.stringContaining('$top=10')
      );
    });

    it('should combine multiple filters', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue({
        value: [mockEmail]
      });

      await service.getEmails('inbox', {
        unreadOnly: true,
        hasAttachments: true,
        top: 5
      });

      const endpoint = mockGraphService.makeGraphRequest.mock.calls[0][0];
      expect(endpoint).toContain('isRead eq false');
      expect(endpoint).toContain('hasAttachments eq true');
      expect(endpoint).toContain('$top=5');
    });
  });

  describe('Reply/Forward Functionality', () => {
    it('should reply to an email', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(undefined);

      await service.replyToEmail('email_123', 'This is my reply');

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/me/messages/email_123/reply',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('This is my reply')
        })
      );
    });

    it('should forward an email', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(undefined);

      await service.forwardEmail(
        'email_123',
        ['forward@example.com'],
        'FYI'
      );

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/me/messages/email_123/forward',
        expect.objectContaining({
          method: 'POST'
        })
      );

      const callArgs = mockGraphService.makeGraphRequest.mock.calls[0];
      const bodyData = JSON.parse(callArgs[1].body);
      expect(bodyData.toRecipients).toHaveLength(1);
      expect(bodyData.comment).toBe('FYI');
    });

    it('should forward to multiple recipients', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(undefined);

      await service.forwardEmail('email_123', [
        'forward1@example.com',
        'forward2@example.com'
      ]);

      const callArgs = mockGraphService.makeGraphRequest.mock.calls[0];
      const bodyData = JSON.parse(callArgs[1].body);
      expect(bodyData.toRecipients).toHaveLength(2);
    });
  });

  describe('Attachment Handling', () => {
    it('should get all attachments for an email', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue({
        value: [mockAttachment]
      });

      const attachments = await service.getAttachments('email_123');

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/me/messages/email_123/attachments'
      );
      expect(attachments).toHaveLength(1);
      expect(attachments[0]).toEqual(mockAttachment);
    });

    it('should download a specific attachment', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(mockAttachment);

      const attachment = await service.downloadAttachment('email_123', 'attachment_123');

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/me/messages/email_123/attachments/attachment_123'
      );
      expect(attachment).toEqual(mockAttachment);
    });

    it('should handle emails with no attachments', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue({
        value: []
      });

      const attachments = await service.getAttachments('email_123');

      expect(attachments).toEqual([]);
    });
  });

  describe('Folder Management', () => {
    it('should create a mail folder', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(mockFolder);

      const folder = await service.createFolder('Archive');

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/me/mailFolders',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Archive')
        })
      );
      expect(folder).toEqual(mockFolder);
    });

    it('should create a child folder', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(mockFolder);

      await service.createFolder('Subfolder', 'parent_folder_123');

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/me/mailFolders/parent_folder_123/childFolders',
        expect.any(Object)
      );
    });
  });

  describe('Email Operations', () => {
    it('should mark email as read', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(undefined);

      await service.markAsRead('email_123', true);

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/me/messages/email_123',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('true')
        })
      );
    });

    it('should mark email as unread', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(undefined);

      await service.markAsRead('email_123', false);

      const callArgs = mockGraphService.makeGraphRequest.mock.calls[0];
      const bodyData = JSON.parse(callArgs[1].body);
      expect(bodyData.isRead).toBe(false);
    });

    it('should delete an email', async () => {
      mockGraphService.makeGraphRequest.mockResolvedValue(undefined);

      await service.deleteEmail('email_123');

      expect(mockGraphService.makeGraphRequest).toHaveBeenCalledWith(
        '/me/messages/email_123',
        expect.objectContaining({
          method: 'DELETE'
        })
      );
    });

    it('should handle delete failure', async () => {
      mockGraphService.makeGraphRequest.mockRejectedValue(new Error('Delete failed'));

      await expect(service.deleteEmail('email_123')).rejects.toThrow('Delete failed');
    });
  });
});
