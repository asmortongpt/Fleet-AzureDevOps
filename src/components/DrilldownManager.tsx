/**
 * DrilldownManager - Global manager for drilldown system
 * Wraps app with provider, renders breadcrumbs and panel, handles keyboard shortcuts
 */

import React from 'react'

import { DrilldownBreadcrumbs } from '@/components/DrilldownBreadcrumbs'
import { DrilldownPanel } from '@/components/DrilldownPanel'
import {
  IncidentsDrilldown,
  SafetyScoreDetailDrilldown,
  VideoTelematicsDrilldown,
  DispatchDrilldown,
  RoutesDrilldown,
  TasksDrilldown,
  VendorsDrilldown,
  PartsInventoryDrilldown,
  PurchaseOrdersDrilldown,
  FuelPurchasingDrilldown
} from '@/components/drilldown/AdditionalHubDrilldowns'
import {
  SystemHealthDrilldown,
  AlertsDrilldown,
  FilesDrilldown
} from '@/components/drilldown/AdminHubDrilldowns'
import {
  AiAgentDrilldown,
  MessagesDrilldown,
  EmailDrilldown,
  HistoryDrilldown
} from '@/components/drilldown/CommunicationHubDrilldowns'
import {
  RegulationsDrilldown,
  GeofenceComplianceDrilldown,
  InspectionsDrilldown,
  IFTADrilldown,
  CSADrilldown
} from '@/components/drilldown/ComplianceHubDrilldowns'
import { DriverDetailPanel } from '@/components/drilldown/DriverDetailPanel'
import { DriverPerformanceView } from '@/components/drilldown/DriverPerformanceView'
import { DriverTripsView } from '@/components/drilldown/DriverTripsView'
import { EmailDetailPanel } from '@/components/drilldown/EmailDetailPanel'
import { FacilityDetailPanel } from '@/components/drilldown/FacilityDetailPanel'
import { FacilityVehiclesView } from '@/components/drilldown/FacilityVehiclesView'
import {
  FleetOverviewDrilldown,
  ActiveVehiclesDrilldown,
  MaintenanceDrilldown,
  FuelStatsDrilldown,
  PerformanceMetricsDrilldown,
  DriverStatsDrilldown,
  UtilizationDrilldown,
  SafetyScoreDrilldown,
  VehicleListDrilldown
} from '@/components/drilldown/FleetStatsDrilldowns'
import {
  DriversRosterDrilldown,
  DriverPerformanceDrilldown,
  DriverScorecardDrilldown,
  GarageDrilldown,
  PredictiveMaintenanceDrilldown,
  MaintenanceCalendarDrilldown,
  ExecutiveDashboardDrilldown,
  CostAnalysisDrilldown,
  FleetOptimizerDrilldown
} from '@/components/drilldown/HubDrilldowns'
import { LaborDetailsView } from '@/components/drilldown/LaborDetailsView'
import { PartsBreakdownView } from '@/components/drilldown/PartsBreakdownView'
import {
  AssetDetailPanel,
  InvoiceDetailPanel,
  RouteDetailPanel,
  TaskDetailPanel,
  IncidentDetailPanel,
  VendorDetailPanel,
  PartDetailPanel,
  PurchaseOrderDetailPanel,
  TripDetailPanel,
  InspectionDetailPanel,
} from '@/components/drilldown/RecordDetailPanels'
import { TripTelemetryView } from '@/components/drilldown/TripTelemetryView'
import { VehicleDetailPanel } from '@/components/drilldown/VehicleDetailPanel'
import { VehicleTripsList } from '@/components/drilldown/VehicleTripsList'
import { WorkOrderDetailPanel } from '@/components/drilldown/WorkOrderDetailPanel'
import { DrilldownProvider, useDrilldown } from '@/contexts/DrilldownContext'

// ============================================================================
// INLINE DETAIL COMPONENTS FOR COMMUNICATION DRILLDOWNS
// ============================================================================

function MessageDetailDrilldown() {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <h2 className="text-base font-bold">{data.content || 'Message'}</h2>
        <div className="text-sm text-muted-foreground">
          {data.channel && <span className="font-medium">{data.channel}</span>}
          {data.author && <span> • {data.author}</span>}
        </div>
      </div>
      <div className="bg-muted/30 rounded-lg p-2">
        <p className="text-sm">{data.content || 'Message content not available'}</p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {data.time && <span>Sent: {new Date(data.time).toLocaleString()}</span>}
        {data.reactions !== undefined && <span>Reactions: {data.reactions}</span>}
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md">Reply</button>
        <button className="px-3 py-1.5 text-sm border rounded-md">React</button>
        <button className="px-3 py-1.5 text-sm border rounded-md">Share</button>
      </div>
    </div>
  )
}

function ConversationDetailDrilldown() {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}

  const conversationMessages = Array.isArray(data.messages)
    ? data.messages
    : Array.isArray(data.conversation)
      ? data.conversation
      : []

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold">Conversation with {data.user || 'User'}</h2>
          <p className="text-sm text-muted-foreground">{data.topic}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded ${
          data.status === 'resolved' ? 'bg-green-100 text-green-800' :
          data.status === 'active' ? 'bg-blue-100 text-blue-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {data.status || 'unknown'}
        </span>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {conversationMessages.length === 0 && (
          <div className="text-sm text-muted-foreground">No conversation history available.</div>
        )}
        {conversationMessages.map((msg: any, index: number) => {
          const sender = msg.sender || msg.role || 'user'
          const content = msg.content || msg.message || ''
          return (
            <div key={msg.id || index} className={`flex ${sender === 'ai' || sender === 'assistant' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${
                sender === 'ai' || sender === 'assistant' ? 'bg-muted' : 'bg-primary text-primary-foreground'
              }`}>
                <p className="text-sm">{content || 'Message content not available'}</p>
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{data.messages || 0} messages</span>
        {data.satisfaction && <span>• Satisfaction: {data.satisfaction}/5 ⭐</span>}
      </div>
    </div>
  )
}

function EmailTemplateDrilldown() {
  const { currentLevel } = useDrilldown()
  const data = currentLevel?.data || {}

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-base font-bold">{data.name || 'Email Template'}</h2>
        <p className="text-sm text-muted-foreground">Used {data.usageCount || 0} times</p>
      </div>
      <div className="border rounded-lg p-2">
        <div className="mb-2">
          <label className="text-sm font-medium text-muted-foreground">Subject Line</label>
          <p className="mt-1">[{data.name}] - [Date]</p>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Template Body</label>
          <div className="mt-1 p-3 bg-muted/30 rounded text-sm">
            <p>Dear [Recipient],</p>
            <p className="mt-2">This is the template content for {data.name}.</p>
            <p className="mt-2">Please review the attached information and respond at your earliest convenience.</p>
            <p className="mt-2">Best regards,<br/>Fleet Management Team</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md">Use Template</button>
        <button className="px-3 py-1.5 text-sm border rounded-md">Edit</button>
        <button className="px-3 py-1.5 text-sm border rounded-md">Preview</button>
      </div>
    </div>
  )
}

function CampaignDetailDrilldown() {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}
  const campaign = data.campaign || {}

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-base font-bold">{campaign.name || 'Campaign'}</h2>
        <p className="text-sm text-muted-foreground">Email Campaign Performance</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-sm font-bold">{campaign.sent || 0}</div>
          <div className="text-sm text-muted-foreground">Sent</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-sm font-bold">{campaign.opened || 0}</div>
          <div className="text-sm text-muted-foreground">Opened</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-green-600">{campaign.rate || 0}%</div>
          <div className="text-sm text-muted-foreground">Open Rate</div>
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-2">Recipients</h3>
        <div className="space-y-2">
          {['fleet-managers@company.com', 'drivers@company.com', 'operations@company.com'].map((email, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-muted/20 rounded">
              <span className="text-sm">{email}</span>
              <span className="text-xs text-green-600">Opened</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md">Resend</button>
        <button className="px-3 py-1.5 text-sm border rounded-md">Export Report</button>
      </div>
    </div>
  )
}

// ============================================================================
// MAINTENANCE REQUESTS DRILLDOWN
// ============================================================================
function MaintenanceRequestsDrilldown() {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}

  const requestItems = Array.isArray(data.requests)
    ? data.requests
    : Array.isArray(data.items)
      ? data.items
      : []

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">{data.title || 'Maintenance Requests'}</h2>
        <span className="px-2 py-1 text-xs rounded bg-primary/20 text-primary">{requestItems.length} requests</span>
      </div>
      <div className="space-y-2">
        {requestItems.length === 0 && (
          <div className="text-sm text-muted-foreground">No maintenance requests available.</div>
        )}
        {requestItems.map((req: any, index: number) => {
          const id = req.id || `request-${index}`
          const type = req.type || req.title || req.reason || 'Request'
          const vehicle = req.vehicle || req.unit_number || req.vehicle_number || req.vehicle_id || 'Vehicle'
          const requestedBy = req.requestedBy || req.requested_by || req.requested_by_name || req.requested_by_id || 'Unknown'
          const priority = req.priority || 'normal'
          return (
          <div
            key={id}
            className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => push({ id, type: 'workOrder', label: type, data: { workOrderId: id, ...req } })}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{type}</p>
                <p className="text-sm text-muted-foreground">{vehicle} • Requested by {requestedBy}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  priority === 'high' ? 'bg-red-100 text-red-800' :
                  priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>{priority}</span>
                <span className="text-xs text-muted-foreground">→</span>
              </div>
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// SAFETY ALERTS DRILLDOWN
// ============================================================================
function SafetyAlertsDrilldown() {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}

  const alertItems = Array.isArray(data.alerts)
    ? data.alerts
    : Array.isArray(data.items)
      ? data.items
      : []

  const filtered = data.filter === 'critical'
    ? alertItems.filter((a: any) => a.severity === 'critical')
    : data.filter === 'acknowledged'
      ? alertItems.filter((a: any) => a.acknowledged)
      : alertItems

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">{data.title || 'Safety Alerts'}</h2>
        <span className="px-2 py-1 text-xs rounded bg-warning/20 text-warning">{filtered.length} alerts</span>
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-sm text-muted-foreground">No safety alerts available.</div>
        )}
        {filtered.map((alert: any, index: number) => {
          const id = alert.id || `alert-${index}`
          const type = alert.type || alert.title || 'Alert'
          const vehicle = alert.vehicle || alert.vehicle_number || alert.vehicle_id || 'Vehicle'
          const driver = alert.driver || alert.driver_name || alert.driver_id || 'Unknown'
          const severity = alert.severity || 'warning'
          const timeValue = alert.time || alert.timestamp || alert.created_at
          return (
            <div
              key={id}
              className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => push({ id, type: 'incident', label: type, data: { incidentId: id, ...alert } })}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="font-medium">{type}</p>
                    <p className="text-sm text-muted-foreground">{vehicle} • {driver}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{timeValue ? new Date(timeValue).toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// OPERATIONS CALENDAR DRILLDOWN
// ============================================================================
function OperationsCalendarDrilldown() {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}

  const calendarEvents = Array.isArray(data.events)
    ? data.events
    : Array.isArray(data.items)
      ? data.items
      : []

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">{data.title || 'Operations Calendar'}</h2>
        <span className="text-sm text-muted-foreground">{calendarEvents.length} scheduled</span>
      </div>
      <div className="space-y-2">
        {calendarEvents.length === 0 && (
          <div className="text-sm text-muted-foreground">No scheduled events available.</div>
        )}
        {calendarEvents.map((evt: any, index: number) => {
          const id = evt.id || `event-${index}`
          const title = evt.title || evt.name || 'Route'
          const time = evt.time || evt.start_time || evt.startTime || evt.date
          const driver = evt.driver || evt.driver_name || evt.driver_id || 'Unknown'
          const type = evt.type || evt.category || 'route'
          const status = evt.status || 'scheduled'
          return (
            <div
              key={id}
              className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => push({ id, type: 'route', label: title, data: { routeId: id, ...evt } })}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-muted-foreground">
                    {time ? new Date(time).toLocaleTimeString() : 'N/A'}
                  </span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-sm text-muted-foreground">{driver} • {type}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>{status}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// DRIVER SHIFTS DRILLDOWN
// ============================================================================
function DriverShiftsDrilldown() {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}

  const shiftItems = Array.isArray(data.shifts)
    ? data.shifts
    : Array.isArray(data.items)
      ? data.items
      : []

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Driver Shifts</h2>
        <span className="text-sm text-muted-foreground">{shiftItems.length} shifts today</span>
      </div>
      <div className="space-y-2">
        {shiftItems.length === 0 && (
          <div className="text-sm text-muted-foreground">No shifts scheduled.</div>
        )}
        {shiftItems.map((shift: any, index: number) => {
          const id = shift.id || `shift-${index}`
          const driver = shift.driver || shift.driver_name || shift.driverName || 'Driver'
          const driverId = shift.driverId || shift.driver_id || id
          const start = shift.startTime || shift.start_time || shift.start_datetime
          const end = shift.endTime || shift.end_time || shift.end_datetime
          const vehicle = shift.vehicle || shift.vehicle_number || shift.vehicle_id || 'Vehicle'
          const status = shift.status || 'scheduled'
          return (
            <div
              key={id}
              className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => push({ id: driverId, type: 'driver', label: driver, data: { driverId, driverName: driver } })}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold">
                    {String(driver).split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium">{driver}</p>
                    <p className="text-sm text-muted-foreground">
                      {start ? new Date(start).toLocaleTimeString() : 'N/A'} - {end ? new Date(end).toLocaleTimeString() : 'N/A'} • {vehicle}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>{status}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// ASSET VALUE DRILLDOWN
// ============================================================================
function AssetValueDrilldown() {
  const { currentLevel, push } = useDrilldown()
  const data = currentLevel?.data || {}

  const categories = [
    { name: 'Vehicles', count: 156, value: 2400000, depreciation: 180000 },
    { name: 'Heavy Equipment', count: 24, value: 1200000, depreciation: 90000 },
    { name: 'Trailers', count: 45, value: 450000, depreciation: 35000 },
    { name: 'Tools & Equipment', count: 31, value: 150000, depreciation: 15000 },
  ]

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-base font-bold">Asset Value Analysis</h2>
        <p className="text-sm text-muted-foreground">Total portfolio value and depreciation breakdown</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-sm font-bold">${((data.totalValue || 4200000) / 1000000).toFixed(1)}M</div>
          <div className="text-sm text-muted-foreground">Total Value</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-sm font-bold text-red-600">${((data.depreciation || 320000) / 1000).toFixed(0)}K</div>
          <div className="text-sm text-muted-foreground">YTD Depreciation</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2 text-center">
          <div className="text-sm font-bold">{data.avgAge || 3.4} yrs</div>
          <div className="text-sm text-muted-foreground">Avg Age</div>
        </div>
      </div>
      <div>
        <h3 className="font-medium mb-3">Value by Category</h3>
        <div className="space-y-2">
          {categories.map(cat => (
            <div
              key={cat.name}
              className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => push({ id: cat.name, type: 'asset', label: cat.name, data: { category: cat.name, filter: cat.name.toLowerCase() } })}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-sm text-muted-foreground">{cat.count} assets</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${(cat.value / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-red-500">-${(cat.depreciation / 1000).toFixed(0)}K/yr</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface DrilldownManagerProps {
  children: React.ReactNode
}

function DrilldownContent() {
  const { currentLevel } = useDrilldown()

  if (!currentLevel) return null

  // Render the appropriate component based on the current level type
  switch (currentLevel.type) {
    // ============================================
    // Fleet-Level Stats Drilldowns
    // ============================================
    case 'fleet-overview':
    case 'total-vehicles':
      return <FleetOverviewDrilldown />

    case 'active-vehicles':
      return <ActiveVehiclesDrilldown />

    case 'maintenance-stats':
    case 'maintenance':
      return <MaintenanceDrilldown />

    case 'fuel-stats':
    case 'fuel-today':
      return <FuelStatsDrilldown />

    case 'performance-metrics':
    case 'miles-day':
    case 'on-time':
    case 'idle-time':
    case 'mpg':
      return <PerformanceMetricsDrilldown />

    case 'drivers-stats':
      return <DriverStatsDrilldown />

    case 'utilization':
    case 'fleet-utilization':
      return <UtilizationDrilldown />

    case 'safety-score':
    case 'safety':
      return <SafetyScoreDrilldown />

    case 'vehicle-list':
      return <VehicleListDrilldown />

    // ============================================
    // Vehicle drilldown hierarchy
    // ============================================
    case 'vehicle':
      return <VehicleDetailPanel vehicleId={currentLevel.data?.vehicleId} />

    case 'vehicle-detail':
      return <VehicleDetailPanel vehicleId={currentLevel.data?.vehicleId} />

    case 'vehicle-trips':
      return (
        <VehicleTripsList
          vehicleId={currentLevel.data?.vehicleId}
          vehicleName={currentLevel.data?.vehicleName}
        />
      )

    case 'trip-telemetry':
      return (
        <TripTelemetryView
          tripId={currentLevel.data?.tripId}
          trip={currentLevel.data?.trip}
        />
      )

    // ============================================
    // Driver drilldown hierarchy
    // ============================================
    case 'driver':
      return <DriverDetailPanel driverId={currentLevel.data?.driverId} />

    case 'driver-detail':
      return <DriverDetailPanel driverId={currentLevel.data?.driverId} />

    case 'driver-performance':
      return (
        <DriverPerformanceView
          driverId={currentLevel.data?.driverId}
          driverName={currentLevel.data?.driverName}
        />
      )

    case 'driver-trips':
      return (
        <DriverTripsView
          driverId={currentLevel.data?.driverId}
          driverName={currentLevel.data?.driverName}
        />
      )

    // ============================================
    // Maintenance drilldown hierarchy
    // ============================================
    case 'workOrder':
      return <WorkOrderDetailPanel workOrderId={currentLevel.data?.workOrderId} />

    case 'work-order-detail':
      return <WorkOrderDetailPanel workOrderId={currentLevel.data?.workOrderId} />

    case 'work-order-parts':
      return (
        <PartsBreakdownView
          workOrderId={currentLevel.data?.workOrderId}
          workOrderNumber={currentLevel.data?.workOrderNumber}
        />
      )

    case 'work-order-labor':
      return (
        <LaborDetailsView
          workOrderId={currentLevel.data?.workOrderId}
          workOrderNumber={currentLevel.data?.workOrderNumber}
        />
      )


    // ============================================
    // Drivers Hub Drilldowns
    // ============================================
    case 'drivers-roster':
    case 'total-drivers':
    case 'on-duty':
      return <DriversRosterDrilldown />

    case 'driver-performance-hub':
    case 'top-performers':
    case 'needs-coaching':
      return <DriverPerformanceDrilldown />

    case 'driver-scorecard':
    case 'fleet-avg-score':
      return <DriverScorecardDrilldown />

    // ============================================
    // Maintenance Hub Drilldowns
    // ============================================
    case 'garage-overview':
    case 'work-orders':
    case 'bay-utilization':
    case 'in-progress':
      return <GarageDrilldown />

    case 'predictive-maintenance':
    case 'predictions-active':
      return <PredictiveMaintenanceDrilldown />

    case 'maintenance-calendar':
    case 'maintenance-today':
    case 'maintenance-overdue':
      return <MaintenanceCalendarDrilldown />

    case 'maintenance-requests':
      return <MaintenanceRequestsDrilldown />

    // ============================================
    // Analytics Hub Drilldowns
    // ============================================
    case 'executive-dashboard':
    case 'fleet-kpis':
      return <ExecutiveDashboardDrilldown />

    case 'cost-analysis':
    case 'total-tco':
    case 'fuel-cost':
      return <CostAnalysisDrilldown />

    case 'fleet-optimizer':
    case 'optimization-recommendations':
      return <FleetOptimizerDrilldown />

    // ============================================
    // Safety Hub Drilldowns
    // ============================================
    case 'incidents':
    case 'open-incidents':
    case 'under-review':
      return <IncidentsDrilldown />

    case 'safety-score-detail':
    case 'days-incident-free':
      return <SafetyScoreDetailDrilldown />

    case 'video-telematics':
    case 'cameras-online':
    case 'events-today':
      return <VideoTelematicsDrilldown />

    case 'safety-alerts':
      return <SafetyAlertsDrilldown />

    // ============================================
    // Operations Hub Drilldowns
    // ============================================
    case 'dispatch':
    case 'active-jobs':
    case 'in-transit':
    case 'delayed':
      return <DispatchDrilldown />

    case 'routes':
    case 'active-routes':
    case 'optimized-today':
      return <RoutesDrilldown />

    case 'tasks':
    case 'open-tasks':
    case 'overdue-tasks':
      return <TasksDrilldown />

    case 'operations-calendar':
      return <OperationsCalendarDrilldown />

    case 'driver-shifts':
      return <DriverShiftsDrilldown />

    // ============================================
    // Procurement Hub Drilldowns
    // ============================================
    case 'vendors':
    case 'active-vendors':
      return <VendorsDrilldown />

    case 'parts-inventory':
    case 'total-skus':
    case 'low-stock':
    case 'out-of-stock':
      return <PartsInventoryDrilldown />

    case 'purchase-orders':
    case 'open-pos':
    case 'in-transit-pos':
      return <PurchaseOrdersDrilldown />

    case 'fuel-purchasing':
    case 'fuel-cards':
      return <FuelPurchasingDrilldown />

    // ============================================
    // Communication Hub Drilldowns
    // ============================================
    case 'ai-agent':
    case 'ai-conversations':
    case 'ai-satisfaction':
      return <AiAgentDrilldown />

    case 'messages':
    case 'messages-today':
    case 'channels':
    case 'automations':
      return <MessagesDrilldown />

    case 'email':
    case 'email-templates':
    case 'open-rate':
    case 'scheduled-emails':
      return <EmailDrilldown />

    case 'communication-history':
    case 'flagged':
    case 'archived':
      return <HistoryDrilldown />

    // ============================================
    // Email/Message Detail Drilldowns (individual record views)
    // ============================================
    case 'email-detail':
      return <EmailDetailPanel emailId={currentLevel.data?.emailId} />

    case 'message-detail':
    case 'channel-messages':
      return <MessageDetailDrilldown />

    case 'ai-conversation-detail':
      return <ConversationDetailDrilldown />

    case 'email-template-detail':
      return <EmailTemplateDrilldown />

    case 'campaign-detail':
      return <CampaignDetailDrilldown />

    // ============================================
    // Compliance Hub Drilldowns
    // ============================================
    case 'regulations':
    case 'dot-compliance':
    case 'ifta-compliance':
      return <RegulationsDrilldown />

    case 'geofence-compliance':
    case 'compliant-zones':
    case 'attention-zones':
      return <GeofenceComplianceDrilldown />

    case 'inspections':
    case 'inspections-due':
    case 'hos-violations':
    case 'eld-status':
      return <InspectionsDrilldown />

    case 'ifta':
    case 'miles-tracked':
    case 'fuel-tax-due':
      return <IFTADrilldown />

    case 'csa':
    case 'csa-pending':
    case 'incidents-ytd':
    case 'days-safe':
      return <CSADrilldown />

    // ============================================
    // Admin Hub Drilldowns
    // ============================================
    case 'system-health':
    case 'active-sessions':
    case 'uptime':
      return <SystemHealthDrilldown />

    case 'system-alerts':
    case 'critical-alerts':
    case 'resolved-today':
    case 'suppressed':
      return <AlertsDrilldown />

    case 'files':
    case 'shared-files':
    case 'uploaded-today':
      return <FilesDrilldown />

    // ============================================
    // Facility drilldown hierarchy
    // ============================================
    case 'facility':
      return <FacilityDetailPanel facilityId={currentLevel.data?.facilityId} />

    case 'facility-detail':
      return <FacilityDetailPanel facilityId={currentLevel.data?.facilityId} />

    case 'facility-vehicles':
      return (
        <FacilityVehiclesView
          facilityId={currentLevel.data?.facilityId}
          facilityName={currentLevel.data?.facilityName}
        />
      )

    // ============================================
    // Asset drilldown hierarchy
    // ============================================
    case 'asset':
    case 'asset-detail':
    case 'equipment':
      return <AssetDetailPanel assetId={currentLevel.data?.assetId || currentLevel.data?.id} />

    case 'asset-value':
      return <AssetValueDrilldown />

    // ============================================
    // Invoice drilldown hierarchy
    // ============================================
    case 'invoice':
    case 'invoice-detail':
      return <InvoiceDetailPanel invoiceId={currentLevel.data?.invoiceId || currentLevel.data?.id} />

    // ============================================
    // Route drilldown hierarchy (single route detail)
    // ============================================
    case 'route':
    case 'route-detail':
      return <RouteDetailPanel routeId={currentLevel.data?.routeId || currentLevel.data?.id} />

    // ============================================
    // Task drilldown hierarchy (single task detail)
    // ============================================
    case 'task':
    case 'task-detail':
      return <TaskDetailPanel taskId={currentLevel.data?.taskId || currentLevel.data?.id} />

    // ============================================
    // Incident drilldown hierarchy (single incident detail)
    // ============================================
    case 'incident':
    case 'incident-detail':
      return <IncidentDetailPanel incidentId={currentLevel.data?.incidentId || currentLevel.data?.id} />

    // ============================================
    // Vendor drilldown hierarchy (single vendor detail)
    // ============================================
    case 'vendor':
    case 'vendor-detail':
      return <VendorDetailPanel vendorId={currentLevel.data?.vendorId || currentLevel.data?.id} />

    // ============================================
    // Part drilldown hierarchy
    // ============================================
    case 'part':
    case 'part-detail':
      return <PartDetailPanel partId={currentLevel.data?.partId || currentLevel.data?.id} />

    // ============================================
    // Purchase Order drilldown hierarchy (single PO detail)
    // ============================================
    case 'purchase-order':
    case 'purchase-order-detail':
      return <PurchaseOrderDetailPanel purchaseOrderId={currentLevel.data?.purchaseOrderId || currentLevel.data?.id} />

    // ============================================
    // Trip drilldown hierarchy (single trip detail)
    // ============================================
    case 'trip':
    case 'trip-detail':
      return <TripDetailPanel tripId={currentLevel.data?.tripId || currentLevel.data?.id} />

    // ============================================
    // Inspection drilldown hierarchy (single inspection detail)
    // ============================================
    case 'inspection':
    case 'inspection-detail':
      return <InspectionDetailPanel inspectionId={currentLevel.data?.inspectionId || currentLevel.data?.id} />

    // ============================================
    // Fallback for unknown types
    // ============================================
    default:
      return (
        <div className="p-3 text-center">
          <p className="text-muted-foreground">
            Unknown drilldown type: {currentLevel.type}
          </p>
        </div>
      )
  }
}

export function DrilldownManager({ children }: DrilldownManagerProps) {
  return (
    <DrilldownProvider>
      <div className="relative">
        {/* Breadcrumbs - fixed at top when drilldown is active */}
        <DrilldownBreadcrumbs />

        {/* Main content */}
        {children}

        {/* Drilldown Panel */}
        <DrilldownPanel>
          <DrilldownContent />
        </DrilldownPanel>
      </div>
    </DrilldownProvider>
  )
}

/**
 * Hook to access drilldown functionality in any component
 * Re-exported for convenience
 */
export { useDrilldown } from '@/contexts/DrilldownContext'
