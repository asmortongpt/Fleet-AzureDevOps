// Microsoft Integration - Outlook, Teams, Calendar
// Features: Email from app, Teams chat, Calendar sync
// Uses: Microsoft Graph API with existing credentials

import { Mail, MessageSquare, Calendar, Send } from 'lucide-react';
import React, { useState } from 'react';

// Microsoft Graph API configuration
const GRAPH_CONFIG = {
  clientId: process.env.VITE_AZURE_AD_CLIENT_ID || 'baae0851-0c24-4214-8587-e3fabc46bd4a',
  tenantId: process.env.VITE_AZURE_AD_TENANT_ID || '0ec14b81-7b82-45ee-8f3d-cbc31ced5347',
  scopes: ['Mail.Send', 'Chat.ReadWrite', 'Calendars.ReadWrite']
};

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
      const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            subject,
            body: {
              contentType: 'HTML',
              content: body
            },
            toRecipients: [{ emailAddress: { address: to } }]
          }
        })
      });

      if (response.ok) {
        alert('Email sent successfully!');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
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
      // Create Teams chat
      const response = await fetch('https://graph.microsoft.com/v1.0/chats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatType: 'oneOnOne',
          members: [
            {
              '@odata.type': '#microsoft.graph.aadUserConversationMember',
              roles: ['owner'],
              'user@odata.bind': `https://graph.microsoft.com/v1.0/users('${userEmail}')`
            }
          ]
        })
      });

      const chat = await response.json();

      // Send initial message if provided
      if (message && chat.id) {
        await fetch(`https://graph.microsoft.com/v1.0/chats/${chat.id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${await getAccessToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            body: {
              content: message
            }
          })
        });
      }

      // Open Teams
      window.open(`https://teams.microsoft.com/l/chat/0/0?users=${userEmail}`, '_blank');

    } catch (error) {
      console.error('Failed to start Teams chat:', error);
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
      const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject,
          start: {
            dateTime: start.toISOString(),
            timeZone: 'UTC'
          },
          end: {
            dateTime: end.toISOString(),
            timeZone: 'UTC'
          },
          attendees: attendees.map(email => ({
            emailAddress: { address: email },
            type: 'required'
          }))
        })
      });

      if (response.ok) {
        alert('Calendar event created!');
      }
    } catch (error) {
      console.error('Failed to create event:', error);
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
  return (
    <div className="border border-border rounded-lg p-2 space-y-3">
      <h3 className="font-semibold flex items-center gap-2">
        <Send className="w-3 h-3" />
        Communication
      </h3>

      <div className="flex flex-wrap gap-2">
        <OutlookEmailButton
          to="andrew.m@capitaltechalliance.com"
          subject={`Fleet Alert: ${context.vehicleId || 'General'}`}
          body={`<p>Regarding: ${JSON.stringify(context)}</p>`}
        />

        <TeamsChatButton
          userEmail="andrew.m@capitaltechalliance.com"
          message={`Fleet notification: ${context.vehicleId || 'Alert'}`}
        />

        <CalendarEventButton
          subject="Fleet Maintenance Review"
          start={new Date()}
          end={new Date(Date.now() + 3600000)}
          attendees={['andrew.m@capitaltechalliance.com']}
        />
      </div>
    </div>
  );
};

// Helper function to get Microsoft Graph access token
async function getAccessToken(): Promise<string> {
  // In production, this would use MSAL (Microsoft Authentication Library)
  // For now, return a placeholder - implement proper OAuth flow
  return 'YOUR_ACCESS_TOKEN_HERE';
}

export default CommunicationPanel;
