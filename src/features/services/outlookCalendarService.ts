// Outlook Calendar Service - API-backed implementation for Fleet Calendar integration

import { secureFetch } from '@/hooks/use-api';
import logger from '@/utils/logger';

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
  userId?: string;
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
  attendees?: string[];
  isOnlineMeeting?: boolean;
}

export interface UserProfile {
  displayName: string;
  mail?: string;
  userPrincipalName?: string;
}

class OutlookCalendarService {
  private profile: UserProfile | null = null;

  isSignedIn(): boolean {
    return !!this.profile;
  }

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const response = await secureFetch('/api/auth/me', { method: 'GET' });
      if (!response.ok) {
        return null;
      }
      const payload = await response.json();
      const user = payload.data?.user || payload.user;
      if (!user) return null;
      this.profile = {
        displayName: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email,
        mail: user.email,
        userPrincipalName: user.email,
      };
      return this.profile;
    } catch (error) {
      logger.error('Failed to load user profile for calendar', error);
      return null;
    }
  }

  async signIn(): Promise<boolean> {
    window.location.href = '/api/auth/microsoft/login';
    return true;
  }

  async signOut(): Promise<void> {
    this.profile = null;
  }

  async getEvents(_startDate: Date, _endDate: Date): Promise<CalendarEvent[]> {
    const profile = this.profile || await this.getUserProfile();
    if (!profile?.userPrincipalName) {
      return [];
    }

    const params = new URLSearchParams({
      userId: profile.userPrincipalName,
      startDate: _startDate.toISOString(),
      endDate: _endDate.toISOString(),
    });

    const response = await secureFetch(`/api/calendar/events?${params.toString()}`, { method: 'GET' });
    if (!response.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const payload = await response.json();
    const events = payload.events || payload.data || [];
    return events;
  }

  async createEvent(event: CreateEventPayload): Promise<CalendarEvent | null> {
    const profile = this.profile || await this.getUserProfile();
    const userId = event.userId || profile?.userPrincipalName || profile?.mail;
    if (!userId) {
      throw new Error('Calendar user not available');
    }

    const response = await secureFetch('/api/calendar/events', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        subject: event.subject,
        start: event.start.dateTime,
        end: event.end.dateTime,
        attendees: event.attendees,
        location: event.location?.displayName,
        body: event.body?.content,
        isOnlineMeeting: event.isOnlineMeeting ?? false,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create calendar event');
    }

    const payload = await response.json();
    return payload.event || payload.data || null;
  }
}

export const outlookCalendarService = new OutlookCalendarService();
