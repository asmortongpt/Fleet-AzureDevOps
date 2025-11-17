/**
 * Mobile Messaging Types
 * Type definitions for email, SMS, and Teams messaging in Fleet mobile app
 */

// ============================================================================
// Email Types
// ============================================================================

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  name: string;
  uri: string;
  type: string;
  size: number;
}

export interface EmailDraft {
  id?: string;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  body: string;
  bodyType: 'text' | 'html';
  attachments?: EmailAttachment[];
  importance?: 'low' | 'normal' | 'high';
  linkedEntityType?: string;
  linkedEntityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SendEmailRequest {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  bodyType?: 'text' | 'html';
  attachments?: EmailAttachment[];
  importance?: 'low' | 'normal' | 'high';
  replyTo?: string | string[];
  isDeliveryReceiptRequested?: boolean;
  isReadReceiptRequested?: boolean;
  saveToSentItems?: boolean;
  entityLinks?: Array<{
    entity_type: string;
    entity_id: string;
    link_type?: string;
  }>;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  communicationId?: string;
  error?: string;
}

// ============================================================================
// SMS Types
// ============================================================================

export interface SMSRecipient {
  phoneNumber: string;
  name?: string;
}

export interface SMSAttachment {
  uri: string;
  type: string;
  size: number;
}

export interface SMSDraft {
  id?: string;
  to: string;
  body: string;
  attachment?: SMSAttachment;
  linkedEntityType?: string;
  linkedEntityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SendSMSRequest {
  to: string;
  body: string;
  mediaUrl?: string;
  entityLinks?: Array<{
    entity_type: string;
    entity_id: string;
    link_type?: string;
  }>;
}

export interface SendSMSResponse {
  success: boolean;
  messageId?: string;
  communicationId?: string;
  status?: 'queued' | 'sent' | 'delivered' | 'failed';
  error?: string;
}

// ============================================================================
// Teams Types
// ============================================================================

export interface TeamsMessage {
  id: string;
  from: {
    userId: string;
    displayName: string;
  };
  body: string;
  createdAt: Date;
  isMyMessage: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    contentType: string;
    contentUrl?: string;
  }>;
}

export interface SendTeamsMessageRequest {
  teamId: string;
  channelId: string;
  message: string;
  contentType?: 'text' | 'html';
  mentions?: Array<{
    userId: string;
    displayName: string;
  }>;
  attachments?: any[];
  importance?: 'normal' | 'high' | 'urgent';
  entityLinks?: Array<{
    entity_type: string;
    entity_id: string;
    link_type?: string;
  }>;
}

export interface SendTeamsMessageResponse {
  success: boolean;
  messageId?: string;
  communicationId?: string;
  error?: string;
}

export interface TeamsChannel {
  id: string;
  displayName: string;
  description?: string;
}

export interface TeamsTeam {
  id: string;
  displayName: string;
  description?: string;
}

// ============================================================================
// Message Template Types
// ============================================================================

export interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  type: 'email' | 'sms' | 'teams';
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
}

export interface TemplateVariable {
  key: string;
  label: string;
  value: string;
  placeholder?: string;
}

// ============================================================================
// Contact Types
// ============================================================================

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  type: 'driver' | 'technician' | 'manager' | 'vendor' | 'other';
  avatarUrl?: string;
}

// ============================================================================
// Messaging Context Types
// ============================================================================

export interface MessagingContext {
  entityType: 'vehicle' | 'driver' | 'work_order' | 'damage_report' | 'inspection';
  entityId: string;
  entityName?: string;
  prefillData?: {
    subject?: string;
    body?: string;
    recipients?: string[];
  };
}

// ============================================================================
// Message Queue Types (for offline support)
// ============================================================================

export interface QueuedMessage {
  id: string;
  type: 'email' | 'sms' | 'teams';
  payload: SendEmailRequest | SendSMSRequest | SendTeamsMessageRequest;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  attempts: number;
  createdAt: Date;
  lastAttempt?: Date;
  error?: string;
}

// ============================================================================
// Delivery Status Types
// ============================================================================

export interface DeliveryStatus {
  messageId: string;
  type: 'email' | 'sms' | 'teams';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  error?: string;
}

// ============================================================================
// Rich Text Editor Types
// ============================================================================

export interface RichTextAction {
  type: 'bold' | 'italic' | 'underline' | 'bulletList' | 'numberedList' | 'link';
  isActive: boolean;
}

export interface RichTextContent {
  html: string;
  text: string;
}
