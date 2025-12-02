/**
 * Microsoft Teams Integration Types
 *
 * Comprehensive type definitions for Teams channels, messages, mentions, reactions, and more
 */

// ============================================================================
// Core Teams Entities
// ============================================================================

export interface Team {
  id: string
  displayName: string
  description?: string
  visibility?: 'private' | 'public'
  webUrl?: string
  isArchived?: boolean
  memberSettings?: {
    allowCreateUpdateChannels?: boolean
    allowDeleteChannels?: boolean
    allowAddRemoveApps?: boolean
    allowCreateUpdateRemoveTabs?: boolean
    allowCreateUpdateRemoveConnectors?: boolean
  }
  guestSettings?: {
    allowCreateUpdateChannels?: boolean
    allowDeleteChannels?: boolean
  }
  messagingSettings?: {
    allowUserEditMessages?: boolean
    allowUserDeleteMessages?: boolean
    allowOwnerDeleteMessages?: boolean
    allowTeamMentions?: boolean
    allowChannelMentions?: boolean
  }
  funSettings?: {
    allowGiphy?: boolean
    giphyContentRating?: string
    allowStickersAndMemes?: boolean
    allowCustomMemes?: boolean
  }
}

export interface Channel {
  id: string
  displayName: string
  description?: string
  email?: string
  webUrl?: string
  membershipType?: 'standard' | 'private' | 'shared'
  isFavoriteByDefault?: boolean
  createdDateTime?: string
}

export interface Message {
  id: string
  replyToId?: string
  etag?: string
  messageType?: 'message' | 'chatMessage' | 'systemEventMessage'
  createdDateTime: string
  lastModifiedDateTime?: string
  lastEditedDateTime?: string
  deletedDateTime?: string
  subject?: string
  summary?: string
  chatId?: string
  importance?: 'normal' | 'high' | 'urgent'
  locale?: string
  webUrl?: string
  policyViolation?: any
  eventDetail?: any
  from: {
    user?: {
      id: string
      displayName: string
      userIdentityType?: string
    }
    application?: {
      id: string
      displayName: string
      applicationIdentityType?: string
    }
    device?: {
      id: string
      displayName: string
    }
    conversation?: {
      id: string
      displayName: string
      conversationIdentityType?: string
    }
  }
  body: {
    contentType: 'text' | 'html'
    content: string
  }
  attachments?: Attachment[]
  mentions?: Mention[]
  reactions?: Reaction[]
}

export interface Mention {
  id: number
  mentionText: string
  mentioned: {
    user?: {
      id: string
      displayName: string
      userIdentityType?: string
    }
    conversation?: {
      id: string
      displayName: string
      conversationIdentityType?: string
    }
  }
}

export interface Reaction {
  reactionType: string
  createdDateTime: string
  user: {
    user?: {
      id: string
      displayName: string
      userIdentityType?: string
    }
  }
}

export interface Attachment {
  id: string
  contentType: string
  contentUrl?: string
  content?: string
  name?: string
  thumbnailUrl?: string
}

// ============================================================================
// Adaptive Card Types
// ============================================================================

export interface AdaptiveCard {
  type: 'AdaptiveCard'
  version: string
  body: AdaptiveCardElement[]
  actions?: AdaptiveCardAction[]
  $schema?: string
}

export interface AdaptiveCardElement {
  type: string
  [key: string]: any
}

export interface AdaptiveCardAction {
  type: string
  title: string
  [key: string]: any
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface SendMessageRequest {
  teamId: string
  channelId: string
  message: string
  subject?: string
  contentType?: 'text' | 'html'
  mentions?: MentionInput[]
  attachments?: AttachmentInput[]
  importance?: 'normal' | 'high' | 'urgent'
}

export interface MentionInput {
  userId: string
  displayName: string
  mentionText?: string
}

export interface AttachmentInput {
  contentType: string
  contentUrl?: string
  content?: string
  name?: string
}

export interface ReplyToMessageRequest {
  teamId: string
  channelId: string
  messageId: string
  message: string
  contentType?: 'text' | 'html'
  mentions?: MentionInput[]
  attachments?: AttachmentInput[]
}

export interface AddReactionRequest {
  teamId: string
  channelId: string
  messageId: string
  reactionType: string
}

export interface CreateChannelRequest {
  teamId: string
  displayName: string
  description?: string
  membershipType?: 'standard' | 'private'
}

export interface UpdateMessageRequest {
  teamId: string
  channelId: string
  messageId: string
  content: string
  contentType?: 'text' | 'html'
}

// ============================================================================
// Communication Log Integration Types
// ============================================================================

export interface CommunicationLog {
  communication_type: 'Chat'
  direction: 'Outbound' | 'Inbound' | 'Internal'
  subject?: string
  body: string
  from_user_id?: number
  from_contact_name?: string
  from_contact_email?: string
  to_user_ids?: number[]
  to_contact_names?: string[]
  to_contact_emails?: string[]
  communication_datetime: Date
  ai_detected_category?: string
  ai_detected_priority?: string
  ai_detected_sentiment?: string
  thread_id?: string
  parent_communication_id?: number
  is_thread_start: boolean
  attachments?: any
  created_by?: number
}

export interface CommunicationEntityLink {
  communication_id: number
  entity_type: 'vehicle' | 'driver' | 'work_order' | 'maintenance' | 'incident' | 'invoice'
  entity_id: number
  link_type: 'Primary Subject' | 'Related' | 'Referenced'
  relevance_score?: number
  auto_detected: boolean
  manually_added: boolean
}

// ============================================================================
// Response Types
// ============================================================================

export interface TeamsApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface GetTeamsResponse extends TeamsApiResponse<Team[]> {
  data?: Team[]
}

export interface GetChannelsResponse extends TeamsApiResponse<Channel[]> {
  data?: Channel[]
}

export interface GetMessagesResponse extends TeamsApiResponse<{
  messages: Message[]
  nextLink?: string
}> {}

export interface SendMessageResponse extends TeamsApiResponse<{
  message: Message
  communicationId?: number
}> {}

export interface CreateChannelResponse extends TeamsApiResponse<Channel> {}

// ============================================================================
// Microsoft Graph API Response Types
// ============================================================================

export interface GraphApiResponse<T> {
  '@odata.context'?: string
  '@odata.nextLink'?: string
  '@odata.count'?: number
  value: T[]
}

export interface GraphApiError {
  error: {
    code: string
    message: string
    innerError?: {
      'request-id': string
      date: string
    }
  }
}
