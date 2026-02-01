/**
 * Microsoft Office Integration Types
 * TypeScript definitions for Teams, Outlook, Calendar, and Adaptive Cards
 */

// ========== Teams Types ==========

export interface Team {
  id: string
  name: string
  description?: string
  isArchived: boolean
  memberCount: number
}

export interface TeamsChannel {
  id: string
  teamId: string
  name: string
  description?: string
  memberCount: number
  unreadCount?: number
}

export interface TeamsMessage {
  id: string
  channelId: string
  teamId: string
  subject?: string
  content: string
  contentType: 'text' | 'html'
  author: {
    id: string
    name: string
    email?: string
  }
  createdAt: string
  lastModified?: string
  attachments?: TeamsAttachment[]
  mentions?: TeamsMention[]
  reactions?: TeamsReaction[]
  replyToId?: string
  importance?: 'normal' | 'high' | 'urgent'
  deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'failed'
}

export interface TeamsAttachment {
  id: string
  name: string
  contentType: string
  contentUrl?: string
  content?: any
  size?: number
}

export interface TeamsMention {
  id: string
  userId: string
  displayName: string
  mentionText: string
}

export interface TeamsReaction {
  reactionType: string
  createdAt: string
  user: {
    id: string
    name: string
  }
}

// ========== Outlook Types ==========

export interface OutlookEmail {
  id: string
  conversationId?: string
  subject: string
  bodyPreview: string
  body: {
    contentType: 'text' | 'html'
    content: string
  }
  from: EmailAddress
  toRecipients: EmailAddress[]
  ccRecipients?: EmailAddress[]
  bccRecipients?: EmailAddress[]
  replyTo?: EmailAddress[]
  sentDateTime: string
  receivedDateTime: string
  hasAttachments: boolean
  attachments?: EmailAttachment[]
  importance: 'low' | 'normal' | 'high'
  isRead: boolean
  isDraft: boolean
  flag?: EmailFlag
  categories?: string[]
  inferredCategory?: 'receipts' | 'vendors' | 'maintenance' | 'fleet' | 'other'
}

export interface EmailAddress {
  name?: string
  address: string
}

export interface EmailAttachment {
  id: string
  name: string
  contentType: string
  size: number
  isInline: boolean
  contentBytes?: string
  contentUrl?: string
}

export interface EmailFlag {
  flagStatus: 'notFlagged' | 'complete' | 'flagged'
  startDate?: string
  dueDate?: string
  completedDate?: string
}

export interface OutlookFolder {
  id: string
  displayName: string
  parentFolderId?: string
  childFolderCount: number
  unreadItemCount: number
  totalItemCount: number
}

export interface EmailDraft {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  bodyType?: 'text' | 'html'
  importance?: 'low' | 'normal' | 'high'
  attachments?: File[]
}

// ========== Calendar Types ==========

export interface CalendarEvent {
  id: string
  subject: string
  bodyPreview?: string
  body?: {
    contentType: 'text' | 'html'
    content: string
  }
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  location?: EventLocation
  attendees?: Attendee[]
  organizer: {
    name: string
    email: string
  }
  isAllDay: boolean
  isCancelled: boolean
  isOrganizer: boolean
  responseRequested: boolean
  responseStatus?: {
    response: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded'
    time: string
  }
  recurrence?: RecurrencePattern
  reminderMinutesBeforeStart?: number
  onlineMeetingUrl?: string
  categories?: string[]
}

export interface EventLocation {
  displayName: string
  locationType?: 'default' | 'conferenceRoom' | 'homeAddress' | 'businessAddress' | 'geoCoordinates' | 'streetAddress' | 'hotel' | 'restaurant' | 'localBusiness' | 'postalAddress'
  uniqueId?: string
  uniqueIdType?: string
  address?: {
    street?: string
    city?: string
    state?: string
    countryOrRegion?: string
    postalCode?: string
  }
  coordinates?: {
    latitude: number
    longitude: number
  }
}

export interface Attendee {
  emailAddress: EmailAddress
  status?: {
    response: 'none' | 'organizer' | 'tentativelyAccepted' | 'accepted' | 'declined' | 'notResponded'
    time?: string
  }
  type: 'required' | 'optional' | 'resource'
}

export interface RecurrencePattern {
  pattern: {
    type: 'daily' | 'weekly' | 'absoluteMonthly' | 'relativeMonthly' | 'absoluteYearly' | 'relativeYearly'
    interval: number
    daysOfWeek?: ('sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday')[]
    dayOfMonth?: number
    month?: number
    index?: 'first' | 'second' | 'third' | 'fourth' | 'last'
  }
  range: {
    type: 'endDate' | 'noEnd' | 'numbered'
    startDate: string
    endDate?: string
    numberOfOccurrences?: number
  }
}

export interface MeetingTimeCandidate {
  meetingTimeSlot: {
    start: {
      dateTime: string
      timeZone: string
    }
    end: {
      dateTime: string
      timeZone: string
    }
  }
  confidence: number
  organizerAvailability: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown'
  attendeeAvailability: Array<{
    attendee: EmailAddress
    availability: 'free' | 'tentative' | 'busy' | 'oof' | 'workingElsewhere' | 'unknown'
  }>
}

// ========== Adaptive Cards Types ==========

export interface AdaptiveCard {
  type: 'AdaptiveCard'
  version: string
  body: AdaptiveCardElement[]
  actions?: AdaptiveCardAction[]
  fallbackText?: string
  backgroundImage?: string | AdaptiveCardImage
  minHeight?: string
  speak?: string
}

export interface AdaptiveCardElement {
  type: string
  [key: string]: any
}

export interface AdaptiveCardAction {
  type: 'Action.Submit' | 'Action.OpenUrl' | 'Action.ShowCard' | 'Action.ToggleVisibility'
  title: string
  data?: any
  url?: string
  card?: AdaptiveCard
}

export interface AdaptiveCardImage {
  url: string
  fillMode?: 'cover' | 'repeatHorizontally' | 'repeatVertically' | 'repeat'
  horizontalAlignment?: 'left' | 'center' | 'right'
  verticalAlignment?: 'top' | 'center' | 'bottom'
}

export interface AdaptiveCardActionResponse {
  cardId: string
  actionType: string
  data: any
  submittedBy: string
  submittedAt: string
}

// ========== Presence Types ==========

export interface UserPresence {
  id: string
  availability: 'Available' | 'AvailableIdle' | 'Away' | 'BeRightBack' | 'Busy' | 'BusyIdle' | 'DoNotDisturb' | 'Offline' | 'PresenceUnknown'
  activity: 'Available' | 'Away' | 'BeRightBack' | 'Busy' | 'DoNotDisturb' | 'InACall' | 'InAConferenceCall' | 'Inactive' | 'InAMeeting' | 'Offline' | 'OffWork' | 'OutOfOffice' | 'PresenceUnknown' | 'Presenting' | 'UrgentInterruptionsOnly'
}

// ========== API Response Types ==========

export interface TeamsAPIResponse<T> {
  value?: T[]
  '@odata.nextLink'?: string
  '@odata.count'?: number
}

export interface OutlookAPIResponse<T> {
  value?: T[]
  '@odata.nextLink'?: string
  '@odata.deltaLink'?: string
  '@odata.count'?: number
}

// ========== WebSocket Event Types ==========

export interface WebSocketEvent {
  type: string
  timestamp: string
  data: any
}

export interface TeamsMessageEvent extends WebSocketEvent {
  type: 'teams:new-message' | 'teams:message-updated' | 'teams:message-deleted'
  data: {
    teamId: string
    channelId: string
    message: TeamsMessage
  }
}

export interface OutlookEmailEvent extends WebSocketEvent {
  type: 'outlook:new-email' | 'outlook:email-updated' | 'outlook:email-read'
  data: {
    email: OutlookEmail
  }
}

export interface CommunicationEvent extends WebSocketEvent {
  type: 'communication:new'
  data: {
    communicationType: 'teams' | 'email' | 'phone' | 'sms'
    relatedEntityType?: 'vehicle' | 'driver' | 'workOrder' | 'vendor'
    relatedEntityId?: string
  }
}

// ========== Notification Types ==========

export interface NotificationSettings {
  enabled: boolean
  sound: boolean
  desktop: boolean
  teams: {
    allMessages: boolean
    mentions: boolean
    directMessages: boolean
  }
  email: {
    all: boolean
    important: boolean
    fromVendors: boolean
  }
  quietHours: {
    enabled: boolean
    start: string // HH:mm format
    end: string // HH:mm format
  }
}

export interface PushNotification {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}
