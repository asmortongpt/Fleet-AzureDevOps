/**
 * Complete endpoint registry for the Fleet Management system
 * This file defines all available API endpoints and WebSocket connections
 */

import { EndpointCategory, SocketConnectionInfo, EndpointInfo } from '@/types/endpoint-monitor'

export const API_ENDPOINT_CATEGORIES: EndpointCategory[] = [
  {
    name: 'Authentication',
    endpoints: [
      { id: 'auth-login', category: 'Authentication', path: '/api/auth/login', method: 'POST', description: 'User login' },
      { id: 'auth-register', category: 'Authentication', path: '/api/auth/register', method: 'POST', description: 'User registration' },
      { id: 'auth-logout', category: 'Authentication', path: '/api/auth/logout', method: 'POST', description: 'User logout', requiresAuth: true },
      { id: 'auth-csrf', category: 'Authentication', path: '/api/csrf', method: 'GET', description: 'Get CSRF token' },
    ]
  },
  {
    name: 'Vehicles',
    endpoints: [
      { id: 'vehicles-list', category: 'Vehicles', path: '/api/vehicles', method: 'GET', description: 'List all vehicles', requiresAuth: true },
      { id: 'vehicles-get', category: 'Vehicles', path: '/api/vehicles/:id', method: 'GET', description: 'Get vehicle details', requiresAuth: true },
      { id: 'vehicles-create', category: 'Vehicles', path: '/api/vehicles', method: 'POST', description: 'Create vehicle', requiresAuth: true },
      { id: 'vehicles-update', category: 'Vehicles', path: '/api/vehicles/:id', method: 'PUT', description: 'Update vehicle', requiresAuth: true },
      { id: 'vehicles-delete', category: 'Vehicles', path: '/api/vehicles/:id', method: 'DELETE', description: 'Delete vehicle', requiresAuth: true },
      { id: 'vehicles-telemetry', category: 'Vehicles', path: '/api/vehicles/:id/telemetry', method: 'POST', description: 'Update telemetry', requiresAuth: true },
    ]
  },
  {
    name: 'Drivers',
    endpoints: [
      { id: 'drivers-list', category: 'Drivers', path: '/api/drivers', method: 'GET', description: 'List all drivers', requiresAuth: true },
      { id: 'drivers-get', category: 'Drivers', path: '/api/drivers/:id', method: 'GET', description: 'Get driver details', requiresAuth: true },
      { id: 'drivers-create', category: 'Drivers', path: '/api/drivers', method: 'POST', description: 'Create driver', requiresAuth: true },
      { id: 'drivers-update', category: 'Drivers', path: '/api/drivers/:id', method: 'PUT', description: 'Update driver', requiresAuth: true },
      { id: 'drivers-delete', category: 'Drivers', path: '/api/drivers/:id', method: 'DELETE', description: 'Delete driver', requiresAuth: true },
    ]
  },
  {
    name: 'Work Orders',
    endpoints: [
      { id: 'workorders-list', category: 'Work Orders', path: '/api/work-orders', method: 'GET', description: 'List work orders', requiresAuth: true },
      { id: 'workorders-get', category: 'Work Orders', path: '/api/work-orders/:id', method: 'GET', description: 'Get work order', requiresAuth: true },
      { id: 'workorders-create', category: 'Work Orders', path: '/api/work-orders', method: 'POST', description: 'Create work order', requiresAuth: true },
      { id: 'workorders-update', category: 'Work Orders', path: '/api/work-orders/:id', method: 'PUT', description: 'Update work order', requiresAuth: true },
      { id: 'workorders-delete', category: 'Work Orders', path: '/api/work-orders/:id', method: 'DELETE', description: 'Delete work order', requiresAuth: true },
    ]
  },
  {
    name: 'Maintenance',
    endpoints: [
      { id: 'maintenance-list', category: 'Maintenance', path: '/api/maintenance-schedules', method: 'GET', description: 'List schedules', requiresAuth: true },
      { id: 'maintenance-get', category: 'Maintenance', path: '/api/maintenance-schedules/:id', method: 'GET', description: 'Get schedule', requiresAuth: true },
      { id: 'maintenance-create', category: 'Maintenance', path: '/api/maintenance-schedules', method: 'POST', description: 'Create schedule', requiresAuth: true },
      { id: 'maintenance-update', category: 'Maintenance', path: '/api/maintenance-schedules/:id', method: 'PUT', description: 'Update schedule', requiresAuth: true },
      { id: 'maintenance-delete', category: 'Maintenance', path: '/api/maintenance-schedules/:id', method: 'DELETE', description: 'Delete schedule', requiresAuth: true },
    ]
  },
  {
    name: 'Fuel Transactions',
    endpoints: [
      { id: 'fuel-list', category: 'Fuel Transactions', path: '/api/fuel-transactions', method: 'GET', description: 'List transactions', requiresAuth: true },
      { id: 'fuel-get', category: 'Fuel Transactions', path: '/api/fuel-transactions/:id', method: 'GET', description: 'Get transaction', requiresAuth: true },
      { id: 'fuel-create', category: 'Fuel Transactions', path: '/api/fuel-transactions', method: 'POST', description: 'Create transaction', requiresAuth: true },
      { id: 'fuel-update', category: 'Fuel Transactions', path: '/api/fuel-transactions/:id', method: 'PUT', description: 'Update transaction', requiresAuth: true },
      { id: 'fuel-delete', category: 'Fuel Transactions', path: '/api/fuel-transactions/:id', method: 'DELETE', description: 'Delete transaction', requiresAuth: true },
    ]
  },
  {
    name: 'Routes',
    endpoints: [
      { id: 'routes-list', category: 'Routes', path: '/api/routes', method: 'GET', description: 'List routes', requiresAuth: true },
      { id: 'routes-get', category: 'Routes', path: '/api/routes/:id', method: 'GET', description: 'Get route', requiresAuth: true },
      { id: 'routes-create', category: 'Routes', path: '/api/routes', method: 'POST', description: 'Create route', requiresAuth: true },
      { id: 'routes-update', category: 'Routes', path: '/api/routes/:id', method: 'PUT', description: 'Update route', requiresAuth: true },
      { id: 'routes-delete', category: 'Routes', path: '/api/routes/:id', method: 'DELETE', description: 'Delete route', requiresAuth: true },
    ]
  },
  {
    name: 'Geofences',
    endpoints: [
      { id: 'geofences-list', category: 'Geofences', path: '/api/geofences', method: 'GET', description: 'List geofences', requiresAuth: true },
      { id: 'geofences-get', category: 'Geofences', path: '/api/geofences/:id', method: 'GET', description: 'Get geofence', requiresAuth: true },
      { id: 'geofences-create', category: 'Geofences', path: '/api/geofences', method: 'POST', description: 'Create geofence', requiresAuth: true },
      { id: 'geofences-update', category: 'Geofences', path: '/api/geofences/:id', method: 'PUT', description: 'Update geofence', requiresAuth: true },
      { id: 'geofences-delete', category: 'Geofences', path: '/api/geofences/:id', method: 'DELETE', description: 'Delete geofence', requiresAuth: true },
    ]
  },
  {
    name: 'Inspections',
    endpoints: [
      { id: 'inspections-list', category: 'Inspections', path: '/api/inspections', method: 'GET', description: 'List inspections', requiresAuth: true },
      { id: 'inspections-get', category: 'Inspections', path: '/api/inspections/:id', method: 'GET', description: 'Get inspection', requiresAuth: true },
      { id: 'inspections-create', category: 'Inspections', path: '/api/inspections', method: 'POST', description: 'Create inspection', requiresAuth: true },
      { id: 'inspections-update', category: 'Inspections', path: '/api/inspections/:id', method: 'PUT', description: 'Update inspection', requiresAuth: true },
      { id: 'inspections-delete', category: 'Inspections', path: '/api/inspections/:id', method: 'DELETE', description: 'Delete inspection', requiresAuth: true },
    ]
  },
  {
    name: 'Safety Incidents',
    endpoints: [
      { id: 'incidents-list', category: 'Safety Incidents', path: '/api/safety-incidents', method: 'GET', description: 'List incidents', requiresAuth: true },
      { id: 'incidents-get', category: 'Safety Incidents', path: '/api/safety-incidents/:id', method: 'GET', description: 'Get incident', requiresAuth: true },
      { id: 'incidents-create', category: 'Safety Incidents', path: '/api/safety-incidents', method: 'POST', description: 'Create incident', requiresAuth: true },
      { id: 'incidents-update', category: 'Safety Incidents', path: '/api/safety-incidents/:id', method: 'PUT', description: 'Update incident', requiresAuth: true },
      { id: 'incidents-delete', category: 'Safety Incidents', path: '/api/safety-incidents/:id', method: 'DELETE', description: 'Delete incident', requiresAuth: true },
    ]
  },
  {
    name: 'Charging Stations',
    endpoints: [
      { id: 'charging-list', category: 'Charging Stations', path: '/api/charging-stations', method: 'GET', description: 'List stations', requiresAuth: true },
      { id: 'charging-get', category: 'Charging Stations', path: '/api/charging-stations/:id', method: 'GET', description: 'Get station', requiresAuth: true },
      { id: 'charging-create', category: 'Charging Stations', path: '/api/charging-stations', method: 'POST', description: 'Create station', requiresAuth: true },
      { id: 'charging-update', category: 'Charging Stations', path: '/api/charging-stations/:id', method: 'PUT', description: 'Update station', requiresAuth: true },
      { id: 'charging-delete', category: 'Charging Stations', path: '/api/charging-stations/:id', method: 'DELETE', description: 'Delete station', requiresAuth: true },
    ]
  },
  {
    name: 'Purchase Orders',
    endpoints: [
      { id: 'po-list', category: 'Purchase Orders', path: '/api/purchase-orders', method: 'GET', description: 'List purchase orders', requiresAuth: true },
      { id: 'po-get', category: 'Purchase Orders', path: '/api/purchase-orders/:id', method: 'GET', description: 'Get purchase order', requiresAuth: true },
      { id: 'po-create', category: 'Purchase Orders', path: '/api/purchase-orders', method: 'POST', description: 'Create purchase order', requiresAuth: true },
      { id: 'po-update', category: 'Purchase Orders', path: '/api/purchase-orders/:id', method: 'PUT', description: 'Update purchase order', requiresAuth: true },
      { id: 'po-delete', category: 'Purchase Orders', path: '/api/purchase-orders/:id', method: 'DELETE', description: 'Delete purchase order', requiresAuth: true },
    ]
  },
  {
    name: 'Facilities',
    endpoints: [
      { id: 'facilities-list', category: 'Facilities', path: '/api/facilities', method: 'GET', description: 'List facilities', requiresAuth: true },
      { id: 'facilities-get', category: 'Facilities', path: '/api/facilities/:id', method: 'GET', description: 'Get facility', requiresAuth: true },
      { id: 'facilities-create', category: 'Facilities', path: '/api/facilities', method: 'POST', description: 'Create facility', requiresAuth: true },
      { id: 'facilities-update', category: 'Facilities', path: '/api/facilities/:id', method: 'PUT', description: 'Update facility', requiresAuth: true },
      { id: 'facilities-delete', category: 'Facilities', path: '/api/facilities/:id', method: 'DELETE', description: 'Delete facility', requiresAuth: true },
    ]
  },
  {
    name: 'Vendors',
    endpoints: [
      { id: 'vendors-list', category: 'Vendors', path: '/api/vendors', method: 'GET', description: 'List vendors', requiresAuth: true },
      { id: 'vendors-get', category: 'Vendors', path: '/api/vendors/:id', method: 'GET', description: 'Get vendor', requiresAuth: true },
      { id: 'vendors-create', category: 'Vendors', path: '/api/vendors', method: 'POST', description: 'Create vendor', requiresAuth: true },
      { id: 'vendors-update', category: 'Vendors', path: '/api/vendors/:id', method: 'PUT', description: 'Update vendor', requiresAuth: true },
      { id: 'vendors-delete', category: 'Vendors', path: '/api/vendors/:id', method: 'DELETE', description: 'Delete vendor', requiresAuth: true },
    ]
  },
  {
    name: 'Telemetry',
    endpoints: [
      { id: 'telemetry-list', category: 'Telemetry', path: '/api/telemetry', method: 'GET', description: 'List telemetry data', requiresAuth: true },
      { id: 'telemetry-get', category: 'Telemetry', path: '/api/telemetry/:id', method: 'GET', description: 'Get telemetry', requiresAuth: true },
      { id: 'telemetry-create', category: 'Telemetry', path: '/api/telemetry', method: 'POST', description: 'Create telemetry', requiresAuth: true },
    ]
  },
  {
    name: 'AI Services',
    endpoints: [
      { id: 'ai-query', category: 'AI Services', path: '/api/ai/query', method: 'POST', description: 'AI query', requiresAuth: true },
      { id: 'ai-assistant', category: 'AI Services', path: '/api/ai/assistant', method: 'POST', description: 'AI assistant', requiresAuth: true },
      { id: 'ai-receipt', category: 'AI Services', path: '/api/ai/receipt', method: 'POST', description: 'Process receipt', requiresAuth: true },
    ]
  },
  {
    name: 'Traffic Cameras',
    endpoints: [
      { id: 'cameras-list', category: 'Traffic Cameras', path: '/api/traffic-cameras', method: 'GET', description: 'List cameras', requiresAuth: true },
      { id: 'cameras-get', category: 'Traffic Cameras', path: '/api/traffic-cameras/:id', method: 'GET', description: 'Get camera', requiresAuth: true },
      { id: 'cameras-nearby', category: 'Traffic Cameras', path: '/api/traffic-cameras/nearby', method: 'GET', description: 'Find nearby cameras', requiresAuth: true },
      { id: 'cameras-sources', category: 'Traffic Cameras', path: '/api/traffic-cameras/sources/list', method: 'GET', description: 'List sources', requiresAuth: true },
      { id: 'cameras-sync', category: 'Traffic Cameras', path: '/api/traffic-cameras/sync', method: 'POST', description: 'Sync all cameras', requiresAuth: true },
      { id: 'cameras-sync-source', category: 'Traffic Cameras', path: '/api/traffic-cameras/sources/:id/sync', method: 'POST', description: 'Sync source', requiresAuth: true },
    ]
  },
  {
    name: 'ArcGIS Layers',
    endpoints: [
      { id: 'arcgis-list', category: 'ArcGIS Layers', path: '/api/arcgis-layers', method: 'GET', description: 'List layers', requiresAuth: true },
      { id: 'arcgis-get', category: 'ArcGIS Layers', path: '/api/arcgis-layers/:id', method: 'GET', description: 'Get layer', requiresAuth: true },
      { id: 'arcgis-enabled', category: 'ArcGIS Layers', path: '/api/arcgis-layers/enabled/list', method: 'GET', description: 'List enabled layers', requiresAuth: true },
      { id: 'arcgis-create', category: 'ArcGIS Layers', path: '/api/arcgis-layers', method: 'POST', description: 'Create layer', requiresAuth: true },
      { id: 'arcgis-update', category: 'ArcGIS Layers', path: '/api/arcgis-layers/:id', method: 'PUT', description: 'Update layer', requiresAuth: true },
      { id: 'arcgis-delete', category: 'ArcGIS Layers', path: '/api/arcgis-layers/:id', method: 'DELETE', description: 'Delete layer', requiresAuth: true },
    ]
  },
  {
    name: 'Microsoft Teams',
    endpoints: [
      { id: 'teams-list', category: 'Microsoft Teams', path: '/api/teams', method: 'GET', description: 'List teams', requiresAuth: true },
      { id: 'teams-get', category: 'Microsoft Teams', path: '/api/teams/:id', method: 'GET', description: 'Get team', requiresAuth: true },
      { id: 'teams-channels', category: 'Microsoft Teams', path: '/api/teams/:id/channels', method: 'GET', description: 'List channels', requiresAuth: true },
      { id: 'teams-messages', category: 'Microsoft Teams', path: '/api/teams/:teamId/channels/:channelId/messages', method: 'GET', description: 'List messages', requiresAuth: true },
      { id: 'teams-send', category: 'Microsoft Teams', path: '/api/teams/:teamId/channels/:channelId/messages', method: 'POST', description: 'Send message', requiresAuth: true },
    ]
  },
  {
    name: 'Outlook',
    endpoints: [
      { id: 'outlook-folders', category: 'Outlook', path: '/api/outlook/folders', method: 'GET', description: 'List folders', requiresAuth: true },
      { id: 'outlook-messages', category: 'Outlook', path: '/api/outlook/messages', method: 'GET', description: 'List messages', requiresAuth: true },
      { id: 'outlook-send', category: 'Outlook', path: '/api/outlook/send', method: 'POST', description: 'Send email', requiresAuth: true },
      { id: 'outlook-search', category: 'Outlook', path: '/api/outlook/messages/search', method: 'GET', description: 'Search messages', requiresAuth: true },
    ]
  },
  {
    name: 'Calendar',
    endpoints: [
      { id: 'calendar-events', category: 'Calendar', path: '/api/calendar/events', method: 'GET', description: 'List events', requiresAuth: true },
      { id: 'calendar-create', category: 'Calendar', path: '/api/calendar/events', method: 'POST', description: 'Create event', requiresAuth: true },
      { id: 'calendar-accept', category: 'Calendar', path: '/api/calendar/events/:id/accept', method: 'POST', description: 'Accept event', requiresAuth: true },
      { id: 'calendar-decline', category: 'Calendar', path: '/api/calendar/events/:id/decline', method: 'POST', description: 'Decline event', requiresAuth: true },
      { id: 'calendar-find', category: 'Calendar', path: '/api/calendar/findMeetingTimes', method: 'POST', description: 'Find meeting times', requiresAuth: true },
    ]
  },
  {
    name: 'Adaptive Cards',
    endpoints: [
      { id: 'cards-maintenance', category: 'Adaptive Cards', path: '/api/adaptive-cards/maintenance', method: 'POST', description: 'Send maintenance card', requiresAuth: true },
      { id: 'cards-workorder', category: 'Adaptive Cards', path: '/api/adaptive-cards/work-order', method: 'POST', description: 'Send work order card', requiresAuth: true },
      { id: 'cards-approval', category: 'Adaptive Cards', path: '/api/adaptive-cards/approval', method: 'POST', description: 'Send approval card', requiresAuth: true },
      { id: 'cards-inspection', category: 'Adaptive Cards', path: '/api/adaptive-cards/inspection', method: 'POST', description: 'Send inspection card', requiresAuth: true },
    ]
  },
  {
    name: 'Presence',
    endpoints: [
      { id: 'presence-get', category: 'Presence', path: '/api/presence/:userId', method: 'GET', description: 'Get user presence', requiresAuth: true },
      { id: 'presence-set', category: 'Presence', path: '/api/presence', method: 'POST', description: 'Set presence', requiresAuth: true },
    ]
  },
  {
    name: 'Personal Use',
    endpoints: [
      { id: 'personal-policies', category: 'Personal Use', path: '/api/personal-use-policies', method: 'GET', description: 'Get policies', requiresAuth: true },
      { id: 'personal-trip-usage', category: 'Personal Use', path: '/api/trip-usage', method: 'GET', description: 'List trip usage', requiresAuth: true },
      { id: 'personal-mark-trip', category: 'Personal Use', path: '/api/trips/:id/mark', method: 'POST', description: 'Mark trip', requiresAuth: true },
    ]
  },
  {
    name: 'Asset Relationships',
    endpoints: [
      { id: 'relationships-list', category: 'Asset Relationships', path: '/api/asset-relationships', method: 'GET', description: 'List relationships', requiresAuth: true },
      { id: 'relationships-active', category: 'Asset Relationships', path: '/api/asset-relationships/active', method: 'GET', description: 'List active', requiresAuth: true },
      { id: 'relationships-get', category: 'Asset Relationships', path: '/api/asset-relationships/:id', method: 'GET', description: 'Get relationship', requiresAuth: true },
      { id: 'relationships-create', category: 'Asset Relationships', path: '/api/asset-relationships', method: 'POST', description: 'Create relationship', requiresAuth: true },
      { id: 'relationships-update', category: 'Asset Relationships', path: '/api/asset-relationships/:id', method: 'PUT', description: 'Update relationship', requiresAuth: true },
      { id: 'relationships-delete', category: 'Asset Relationships', path: '/api/asset-relationships/:id', method: 'DELETE', description: 'Delete relationship', requiresAuth: true },
    ]
  },
  {
    name: 'OBD2 Emulator',
    endpoints: [
      { id: 'obd2-start', category: 'OBD2 Emulator', path: '/api/obd2-emulator/start', method: 'POST', description: 'Start emulator', requiresAuth: true },
      { id: 'obd2-stop', category: 'OBD2 Emulator', path: '/api/obd2-emulator/stop/:id', method: 'POST', description: 'Stop emulator', requiresAuth: true },
    ]
  }
]

export const WEBSOCKET_CONNECTIONS: SocketConnectionInfo[] = [
  {
    id: 'obd2-emulator',
    category: 'OBD2 Emulator',
    url: 'ws://localhost:8000/ws/obd2/',
    description: 'Real-time OBD2 telemetry data',
    status: 'disconnected',
    lastMessageTime: null,
    messageCount: 0,
    reconnectAttempts: 0
  },
  {
    id: 'radio-socket',
    category: 'Radio Dispatch',
    url: import.meta.env.VITE_RADIO_SOCKET_URL || 'http://localhost:8000',
    description: 'Radio transmissions and policy triggers',
    status: 'disconnected',
    lastMessageTime: null,
    messageCount: 0,
    reconnectAttempts: 0
  },
  {
    id: 'dispatch-socket',
    category: 'Dispatch System',
    url: import.meta.env.VITE_DISPATCH_SOCKET_URL || 'http://localhost:8000',
    description: 'Dispatch events and unit status',
    status: 'disconnected',
    lastMessageTime: null,
    messageCount: 0,
    reconnectAttempts: 0
  },
  {
    id: 'general-websocket',
    category: 'General Events',
    url: '/api/dispatch/ws',
    description: 'Teams and Outlook events',
    status: 'disconnected',
    lastMessageTime: null,
    messageCount: 0,
    reconnectAttempts: 0
  }
]

// Helper to get all endpoints as a flat array
export const getAllEndpoints = (): EndpointInfo[] => {
  return API_ENDPOINT_CATEGORIES.flatMap(category => category.endpoints)
}

// Helper to get total endpoint count
export const getTotalEndpointCount = (): number => {
  return getAllEndpoints().length
}
