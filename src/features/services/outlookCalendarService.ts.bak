// Outlook Calendar Service - Stub implementation for Fleet Calendar integration
// This provides the interface for Microsoft Graph Calendar API integration

export interface CalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  categories?: string[];
  vehicleId?: string;
  driverId?: string;
  location?: {
    displayName?: string;
  };
  importance?: 'low' | 'normal' | 'high';
  body?: {
    contentType?: 'Text' | 'HTML';
    content?: string;
  };
}

export interface CreateEventPayload {
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  body?: {
    contentType: 'Text' | 'HTML';
    content: string;
  };
  location?: {
    displayName: string;
  };
  categories?: string[];
  importance?: 'low' | 'normal' | 'high';
  vehicleId?: string;
  driverId?: string;
}

export interface UserProfile {
  displayName: string;
  mail?: string;
  userPrincipalName?: string;
}

class OutlookCalendarService {
  private signedIn = false;
  private profile: UserProfile | null = null;

  isSignedIn(): boolean {
    return this.signedIn;
  }

  async getUserProfile(): Promise<UserProfile | null> {
    return this.profile;
  }

  async signIn(): Promise<boolean> {
    // Stub: In production, this would authenticate via MSAL
    console.log('Outlook sign-in requested - stub implementation');
    this.signedIn = true;
    this.profile = {
      displayName: 'Fleet User',
      mail: 'fleet.user@example.com'
    };
    return true;
  }

  async signOut(): Promise<void> {
    this.signedIn = false;
    this.profile = null;
  }

  async getEvents(_startDate: Date, _endDate: Date): Promise<CalendarEvent[]> {
    // Stub: In production, this would fetch from Microsoft Graph API
    console.log('Fetching Outlook events - stub implementation');
    return [];
  }

  async createEvent(event: CreateEventPayload): Promise<CalendarEvent | null> {
    // Stub: In production, this would create an event via Microsoft Graph API
    console.log('Creating Outlook event - stub implementation', event);
    return {
      id: Math.random().toString(36).substr(2, 9),
      subject: event.subject,
      start: event.start,
      end: event.end,
      categories: event.categories,
      location: event.location,
      importance: event.importance,
      body: event.body,
      vehicleId: event.vehicleId,
      driverId: event.driverId
    };
  }
}

export const outlookCalendarService = new OutlookCalendarService();
