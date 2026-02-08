// Microsoft Integration - Outlook, Teams, Calendar
// Features: Email from app, Teams chat, Calendar sync
// Uses: Microsoft Graph API with existing credentials

import { Mail, MessageSquare, Calendar, Send } from 'lucide-react';
import React, { useState } from 'react';
import logger from '@/utils/logger';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

// Send Email via Outlook
export const OutlookEmailButton: React.FC<{
  to?: string;
  subject?: string;
  body?: string;
}> = ({ to = '', subject = '', body = '' }) => {
  const [sending, setSending] = useState(false);

  const sendEmail = async () => {
    setSending(true);
    try {
      const response = await apiClient.post('/api/outlook/send', {
        to,
        subject,
        body,
        bodyType: 'html'
      });

      if ((response as any)?.success !== false) {
        alert('Email sent successfully!');
      }
    } catch (error) {
      logger.error('Failed to send email:', error);
      alert('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      onClick={sendEmail}
      disabled={sending}
      className="flex items-center gap-2 px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
    >
      <Mail className="w-4 h-4" />
      {sending ? 'Sending...' : 'Send Email'}
    </button>
  );
};

// Start Teams Chat
export const TeamsChatButton: React.FC<{
  userEmail: string;
  message?: string;
}> = ({ userEmail, message = '' }) => {
  const startChat = async () => {
    try {
      // Open Teams chat (server-side integration can be added later if configured)
      window.open(`https://teams.microsoft.com/l/chat/0/0?users=${userEmail}`, '_blank');
    } catch (error) {
      logger.error('Failed to start Teams chat:', error);
    }
  };

  return (
    <button
      onClick={startChat}
      className="flex items-center gap-2 px-2 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
    >
      <MessageSquare className="w-4 h-4" />
      Teams Chat
    </button>
  );
};

// Calendar Event Creator
export const CalendarEventButton: React.FC<{
  subject: string;
  start: Date;
  end: Date;
  attendees?: string[];
}> = ({ subject, start, end, attendees = [] }) => {
  const [creating, setCreating] = useState(false);

  const createEvent = async () => {
    setCreating(true);
    try {
      const response = await apiClient.post('/api/calendar/events', {
        title: subject,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        attendees
      });

      if ((response as any)?.success !== false) {
        alert('Calendar event created!');
      }
    } catch (error) {
      logger.error('Failed to create event:', error);
      alert('Failed to create calendar event');
    } finally {
      setCreating(false);
    }
  };

  return (
    <button
      onClick={createEvent}
      disabled={creating}
      className="flex items-center gap-2 px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
    >
      <Calendar className="w-4 h-4" />
      {creating ? 'Creating...' : 'Add to Calendar'}
    </button>
  );
};

// Integrated Communication Panel
export const CommunicationPanel: React.FC<{
  context: {
    vehicleId?: string;
    driverId?: string;
    maintenanceId?: string;
  };
}> = ({ context }) => {
  const { user } = useAuth();
  const defaultEmail = user?.email || '';
  return (
    <div className="border border-border rounded-lg p-2 space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Send className="w-3 h-3" />
        Communication
      </h3>

      <div className="flex flex-wrap gap-2">
        {defaultEmail && (
          <OutlookEmailButton
            to={defaultEmail}
            subject={`Fleet Alert: ${context.vehicleId || 'General'}`}
            body={`<p>Regarding: ${JSON.stringify(context)}</p>`}
          />
        )}

        {defaultEmail && (
          <TeamsChatButton
            userEmail={defaultEmail}
            message={`Fleet notification: ${context.vehicleId || 'Alert'}`}
          />
        )}

        {defaultEmail && (
          <CalendarEventButton
            subject="Fleet Maintenance Review"
            start={new Date()}
            end={new Date(Date.now() + 3600000)}
            attendees={[defaultEmail]}
          />
        )}
      </div>
    </div>
  );
};
export default CommunicationPanel;
