// Legacy import - moment not in package.json, using date-fns instead
// import moment from 'moment';
import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, View, Event } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  CalendarDays,
  CalendarCheck,
  Calendar as CalendarIcon,
  Plus,
  RefreshCw,
  User,
  Truck,
  Wrench,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  LogOut
} from 'lucide-react';

import { outlookCalendarService, CalendarEvent } from '../../services/outlookCalendarService';

import { format, addMinutes, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';

import EventCreateModal from './EventCreateModal';
import logger from '@/utils/logger';

// Using date-fns localizer instead of moment
const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

interface FleetEvent extends Event {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    type: 'maintenance' | 'reservation' | 'inspection' | 'meeting' | 'other';
    vehicleId?: string;
    driverId?: string;
    location?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    status?: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
    description?: string;
  };
}

const FleetCalendar: React.FC = () => {
  const [events, setEvents] = useState<FleetEvent[]>([]);
  const [view, setView] = useState<View>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<FleetEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    maintenance: true,
    reservation: true,
    inspection: true,
    meeting: true,
    other: true
  });

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
    loadLocalEvents();
  }, []);

  const checkAuthStatus = async () => {
    const signedIn = outlookCalendarService.isSignedIn();
    setIsSignedIn(signedIn);
    if (signedIn) {
      try {
        const profile = await outlookCalendarService.getUserProfile();
        setUserProfile(profile);
        await syncWithOutlook();
      } catch (error) {
        logger.error('Failed to get user profile:', error);
      }
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const success = await outlookCalendarService.signIn();
      if (success) {
        setIsSignedIn(true);
        const profile = await outlookCalendarService.getUserProfile();
        setUserProfile(profile);
        await syncWithOutlook();
      }
    } catch (error) {
      logger.error('Sign in failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await outlookCalendarService.signOut();
      setIsSignedIn(false);
      setUserProfile(null);
      loadLocalEvents(); // Revert to local events
    } catch (error) {
      logger.error('Sign out failed:', error);
    }
  };

  const syncWithOutlook = async () => {
    if (!isSignedIn) return;

    setLoading(true);
    try {
      const startDate = moment(selectedDate).startOf('month').subtract(1, 'week').toDate();
      const endDate = moment(selectedDate).endOf('month').add(1, 'week').toDate();

      const outlookEvents = await outlookCalendarService.getEvents(startDate, endDate);

      const formattedEvents: FleetEvent[] = outlookEvents.map(event => ({
        id: event.id,
        title: event.subject,
        start: new Date(event.start.dateTime),
        end: new Date(event.end.dateTime),
        resource: {
          type: determineEventType(event),
          vehicleId: event.vehicleId,
          driverId: event.driverId,
          location: event.location?.displayName,
          priority: event.importance as any || 'normal',
          status: 'scheduled',
          description: event.body?.content
        }
      }));

      setEvents(formattedEvents);
    } catch (error) {
      logger.error('Failed to sync with Outlook:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineEventType = (event: CalendarEvent): FleetEvent['resource']['type'] => {
    if (event.categories?.includes('Maintenance') || event.subject?.toLowerCase().includes('maintenance')) {
      return 'maintenance';
    }
    if (event.categories?.includes('Vehicle Reservation') || event.subject?.toLowerCase().includes('reservation')) {
      return 'reservation';
    }
    if (event.categories?.includes('Inspection') || event.subject?.toLowerCase().includes('inspection')) {
      return 'inspection';
    }
    if (event.categories?.includes('Meeting') || event.subject?.toLowerCase().includes('meeting')) {
      return 'meeting';
    }
    return 'other';
  };

  const loadLocalEvents = () => {
    // Sample local events
    const sampleEvents: FleetEvent[] = [
      {
        id: '1',
        title: 'Vehicle FL-001 Maintenance',
        start: addMinutes(new Date(), 60),
        end: addMinutes(new Date(), 180),
        resource: {
          type: 'maintenance',
          vehicleId: 'FL-001',
          priority: 'normal',
          status: 'scheduled',
          description: 'Routine maintenance check'
        }
      },
      {
        id: '2',
        title: 'Fleet Inspection - Tallahassee',
        start: addMinutes(new Date(), 1440),
        end: addMinutes(new Date(), 1560),
        resource: {
          type: 'inspection',
          location: 'Tallahassee Fleet Center',
          priority: 'high',
          status: 'scheduled',
          description: 'Quarterly fleet inspection'
        }
      },
      {
        id: '3',
        title: 'Vehicle Reservation - FL-045',
        start: addMinutes(new Date(), 2880),
        end: addMinutes(new Date(), 3060),
        resource: {
          type: 'reservation',
          vehicleId: 'FL-045',
          driverId: 'D-12345',
          location: 'Miami Office',
          priority: 'normal',
          status: 'scheduled'
        }
      }
    ];
    setEvents(sampleEvents);
  };

  const handleSelectEvent = (event: FleetEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedEvent({
      title: '',
      start,
      end,
      resource: {
        type: 'other',
        priority: 'normal',
        status: 'scheduled'
      }
    });
    setShowCreateModal(true);
  };

  const handleSaveEvent = (eventData: any) => {
    // Generate a unique ID for the new event
    const newEvent: FleetEvent = {
      id: Math.random().toString(36).substr(2, 9),
      ...eventData
    };

    // Add the new event to the events list
    setEvents(prevEvents => [...prevEvents, newEvent]);

    // If connected to Outlook, try to create the event there too
    if (isSignedIn) {
      try {
        outlookCalendarService.createEvent({
          subject: eventData.title,
          start: {
            dateTime: eventData.start.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: eventData.end.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          body: eventData.resource?.description ? {
            contentType: 'Text' as const,
            content: eventData.resource.description
          } : undefined,
          location: eventData.resource?.location ? {
            displayName: eventData.resource.location
          } : undefined,
          categories: [`Fleet Management`, eventData.resource?.type || 'other'],
          importance: eventData.resource?.priority === 'urgent' || eventData.resource?.priority === 'high' ? 'high' : 'normal',
          vehicleId: eventData.resource?.vehicleId,
          driverId: eventData.resource?.driverId
        });
      } catch (error) {
        logger.error('Failed to create event in Outlook:', error);
      }
    }
  };

  const eventStyleGetter = (event: FleetEvent) => {
    const type = event.resource?.type || 'other';
    const priority = event.resource?.priority || 'normal';

    const colors = {
      maintenance: { bg: '#f59e0b', border: '#d97706' },
      reservation: { bg: '#3b82f6', border: '#2563eb' },
      inspection: { bg: '#10b981', border: '#059669' },
      meeting: { bg: '#0f766e', border: '#0d9488' },
      other: { bg: '#6b7280', border: '#4b5563' }
    };

    const priorityOpacity = {
      low: 0.7,
      normal: 0.85,
      high: 1,
      urgent: 1
    };

    const color = colors[type];
    const opacity = priorityOpacity[priority];

    return {
      style: {
        backgroundColor: color.bg,
        borderLeft: `4px solid ${color.border}`,
        opacity,
        color: 'white',
        borderRadius: '4px',
        padding: '2px 5px'
      }
    };
  };

  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex items-center justify-between mb-2 p-2 bg-white rounded-lg shadow-sm">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
        <h2 className="text-base font-semibold text-gray-800">{label}</h2>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onView('month')}
          className={`px-3 py-2 rounded-lg transition-colors ${
            view === 'month' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
          }`}
        >
          Month
        </button>
        <button
          onClick={() => onView('week')}
          className={`px-3 py-2 rounded-lg transition-colors ${
            view === 'week' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
          }`}
        >
          Week
        </button>
        <button
          onClick={() => onView('day')}
          className={`px-3 py-2 rounded-lg transition-colors ${
            view === 'day' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
          }`}
        >
          Day
        </button>
        <button
          onClick={() => onView('agenda')}
          className={`px-3 py-2 rounded-lg transition-colors ${
            view === 'agenda' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
          }`}
        >
          Agenda
        </button>
      </div>
    </div>
  );

  const filteredEvents = events.filter(event => {
    const type = event.resource?.type || 'other';
    return filters[type];
  });

  return (
    <div className="h-full bg-gray-50 p-3">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <CalendarDays className="w-4 h-4 text-blue-800" />
            <h1 className="text-base font-bold text-gray-800">Fleet Calendar</h1>
          </div>

          <div className="flex items-center space-x-3">
            {/* Outlook Integration Status */}
            <div className="flex items-center space-x-2 px-2 py-2 bg-white rounded-lg shadow-sm">
              {isSignedIn ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-slate-700">Connected to Outlook</span>
                  <span className="text-sm font-medium">{userProfile?.displayName}</span>
                  <button
                    onClick={handleSignOut}
                    className="ml-2 p-1 hover:bg-gray-100 rounded"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-400 rounded-full" />
                  <span className="text-sm text-slate-700">Not connected</span>
                  <button
                    onClick={handleSignIn}
                    disabled={loading}
                    className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Connecting...' : 'Connect to Outlook'}
                  </button>
                </>
              )}
            </div>

            {isSignedIn && (
              <button
                onClick={syncWithOutlook}
                disabled={loading}
                className="p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              </button>
            )}

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>New Event</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 p-2 bg-white rounded-lg shadow-sm">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          {Object.entries(filters).map(([type, enabled]) => (
            <button
              key={type}
              onClick={() => setFilters({ ...filters, [type]: !enabled })}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                enabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'
              }`}
            >
              {type === 'maintenance' && <Wrench className="w-4 h-4" />}
              {type === 'reservation' && <Truck className="w-4 h-4" />}
              {type === 'inspection' && <CalendarCheck className="w-4 h-4" />}
              {type === 'meeting' && <User className="w-4 h-4" />}
              {type === 'other' && <CalendarIcon className="w-4 h-4" />}
              <span className="capitalize text-sm">{type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-lg shadow-sm p-2" style={{ height: 'calc(100vh - 280px)' }}>
        <Calendar
          localizer={localizer}
          events={filteredEvents}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={selectedDate}
          onNavigate={setSelectedDate}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          components={{
            toolbar: CustomToolbar
          }}
          className="fleet-calendar"
        />
      </div>

      {/* Event Details Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm w-full max-w-md p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold">{selectedEvent.title}</h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-slate-700">
                <Clock className="w-4 h-4" />
                <span>{format(selectedEvent.start, 'PPP p')} - {format(selectedEvent.end, 'p')}</span>
              </div>

              {selectedEvent.resource?.vehicleId && (
                <div className="flex items-center space-x-2 text-slate-700">
                  <Truck className="w-4 h-4" />
                  <span>Vehicle: {selectedEvent.resource.vehicleId}</span>
                </div>
              )}

              {selectedEvent.resource?.location && (
                <div className="flex items-center space-x-2 text-slate-700">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedEvent.resource.location}</span>
                </div>
              )}

              {selectedEvent.resource?.description && (
                <div className="mt-2 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700">{selectedEvent.resource.description}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => setShowEventModal(false)}
                className="px-2 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              <button className="px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Create Modal */}
      <EventCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleSaveEvent}
        initialData={selectedEvent}
      />
    </div>
  );
};

export default FleetCalendar;
