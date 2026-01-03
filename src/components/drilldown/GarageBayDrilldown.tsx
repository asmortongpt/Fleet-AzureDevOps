import React, { useState, useEffect } from 'react'
import { useDrilldown } from '@/contexts/DrilldownContext'
import { DrilldownPanel } from './DrilldownPanel'
import { DrilldownDataTable } from './DrilldownDataTable'
import { DrilldownCard } from './DrilldownCard'
import {
  Wrench,
  Clock,
  User,
  Phone,
  Mail,
  Truck,
  Package,
  Warning,
  CheckCircle,
  Calendar,
  ChartBar
} from '@phosphor-icons/react'

interface GarageBayWorkOrder {
  id: string
  bayNumber: string
  workOrderId: string
  workOrderType: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'scheduled' | 'in-progress' | 'awaiting-parts' | 'quality-check' | 'completed'

  startDate: string
  estimatedCompletion: string
  actualCompletion?: string
  hoursLogged: number
  hoursEstimated: number
  progressPercentage: number

  vehicleId: string
  vehicleNumber: string
  vehicleMake: string
  vehicleModel: string
  vehicleYear: number
  mileage?: number
  hours?: number
  licensePlate?: string
  assetTag?: string
  department: string

  assignedTechnicians: Array<{
    id: string
    name: string
    phone: string
    email: string
  }>
  supervisor: {
    id: string
    name: string
    phone: string
    email: string
  }
  completionContacts: Array<{
    name: string
    role: string
    phone: string
    email: string
    notifyOnCompletion: boolean
  }>

  parts: Array<{
    partNumber: string
    description: string
    quantity: number
    status: 'in-stock' | 'on-order' | 'backordered'
    estimatedArrival?: string
  }>

  materials: Array<{
    name: string
    quantity: number
    unit: string
  }>
}

export function GarageBayDrilldown({ bayNumber }: { bayNumber: string }) {
  const { popDrilldown } = useDrilldown()
  const [workOrder, setWorkOrder] = useState<GarageBayWorkOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGarageBayWorkOrder()
  }, [bayNumber])

  const fetchGarageBayWorkOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/garage-bays/${bayNumber}/work-order`)

      if (!response.ok) {
        throw new Error('Failed to fetch work order')
      }

      const data = await response.json()
      setWorkOrder(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <DrilldownPanel
        title={`Garage Bay ${bayNumber}`}
        onClose={popDrilldown}
      >
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </DrilldownPanel>
    )
  }

  if (error || !workOrder) {
    return (
      <DrilldownPanel
        title={`Garage Bay ${bayNumber}`}
        onClose={popDrilldown}
      >
        <div className="text-center py-8">
          <Warning className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || 'No work order found for this bay'}</p>
        </div>
      </DrilldownPanel>
    )
  }

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  }

  const statusColors = {
    scheduled: 'bg-gray-100 text-gray-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    'awaiting-parts': 'bg-yellow-100 text-yellow-800',
    'quality-check': 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800'
  }

  return (
    <DrilldownPanel
      title={`Garage Bay ${bayNumber} - Work Order #${workOrder.workOrderId}`}
      onClose={popDrilldown}
    >
      <div className="space-y-6">
        {/* Work Order Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DrilldownCard
            title="Work Type"
            value={workOrder.workOrderType}
            icon={Wrench}
          />
          <DrilldownCard
            title="Priority"
            value={
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${priorityColors[workOrder.priority]}`}>
                {workOrder.priority.toUpperCase()}
              </span>
            }
            icon={Warning}
          />
          <DrilldownCard
            title="Status"
            value={
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[workOrder.status]}`}>
                {workOrder.status.replace('-', ' ').toUpperCase()}
              </span>
            }
            icon={CheckCircle}
          />
        </div>

        {/* Description */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-2 text-gray-900">Work Description</h3>
          <p className="text-gray-700">{workOrder.description}</p>
        </div>

        {/* Timeline */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <Clock className="w-5 h-5" />
            Timeline & Progress
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="font-medium text-gray-900">{new Date(workOrder.startDate).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estimated Completion</p>
              <p className="font-medium text-gray-900">{new Date(workOrder.estimatedCompletion).toLocaleString()}</p>
            </div>
            {workOrder.actualCompletion && (
              <div>
                <p className="text-sm text-gray-600">Actual Completion</p>
                <p className="font-medium text-gray-900">{new Date(workOrder.actualCompletion).toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Hours (Logged / Estimated)</p>
              <p className="font-medium text-gray-900">{workOrder.hoursLogged} / {workOrder.hoursEstimated} hours</p>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700">Progress</span>
              <span className="font-medium text-gray-900">{workOrder.progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${workOrder.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Vehicle/Asset Information */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <Truck className="w-5 h-5" />
            Vehicle/Asset Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Vehicle Number</p>
              <p className="font-medium text-gray-900">{workOrder.vehicleNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Make/Model/Year</p>
              <p className="font-medium text-gray-900">
                {workOrder.vehicleMake} {workOrder.vehicleModel} {workOrder.vehicleYear}
              </p>
            </div>
            {workOrder.licensePlate && (
              <div>
                <p className="text-sm text-gray-600">License Plate</p>
                <p className="font-medium text-gray-900">{workOrder.licensePlate}</p>
              </div>
            )}
            {workOrder.assetTag && (
              <div>
                <p className="text-sm text-gray-600">Asset Tag</p>
                <p className="font-medium text-gray-900">{workOrder.assetTag}</p>
              </div>
            )}
            {workOrder.mileage && (
              <div>
                <p className="text-sm text-gray-600">Mileage</p>
                <p className="font-medium text-gray-900">{workOrder.mileage.toLocaleString()} miles</p>
              </div>
            )}
            {workOrder.hours && (
              <div>
                <p className="text-sm text-gray-600">Hours</p>
                <p className="font-medium text-gray-900">{workOrder.hours.toLocaleString()} hours</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Department</p>
              <p className="font-medium text-gray-900">{workOrder.department}</p>
            </div>
          </div>
        </div>

        {/* Personnel */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
            <User className="w-5 h-5" />
            Personnel & Contacts
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Assigned Technicians</p>
              {workOrder.assignedTechnicians.map(tech => (
                <div key={tech.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <span className="font-medium text-gray-900">{tech.name}</span>
                  <div className="flex gap-4 text-sm">
                    <a href={`tel:${tech.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {tech.phone}
                    </a>
                    <a href={`mailto:${tech.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {tech.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Supervisor</p>
              <div className="flex items-center justify-between py-2">
                <span className="font-medium text-gray-900">{workOrder.supervisor.name}</span>
                <div className="flex gap-4 text-sm">
                  <a href={`tel:${workOrder.supervisor.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {workOrder.supervisor.phone}
                  </a>
                  <a href={`mailto:${workOrder.supervisor.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {workOrder.supervisor.email}
                  </a>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Completion Notification Contacts</p>
              {workOrder.completionContacts.map((contact, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <span className="font-medium text-gray-900">{contact.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({contact.role})</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {contact.phone}
                    </a>
                    <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {contact.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Parts */}
        {workOrder.parts.length > 0 && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
              <Package className="w-5 h-5" />
              Parts Required
            </h3>
            <DrilldownDataTable
              data={workOrder.parts.map(part => ({
                'Part Number': part.partNumber,
                'Description': part.description,
                'Quantity': part.quantity,
                'Status': (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    part.status === 'in-stock' ? 'bg-green-100 text-green-800' :
                    part.status === 'on-order' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {part.status.replace('-', ' ').toUpperCase()}
                  </span>
                ),
                'Est. Arrival': part.estimatedArrival
                  ? new Date(part.estimatedArrival).toLocaleDateString()
                  : 'N/A'
              }))}
            />
          </div>
        )}

        {/* Materials */}
        {workOrder.materials.length > 0 && (
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h3 className="font-semibold mb-4 text-gray-900">Materials Used</h3>
            <DrilldownDataTable
              data={workOrder.materials.map(material => ({
                'Material': material.name,
                'Quantity': `${material.quantity} ${material.unit}`
              }))}
            />
          </div>
        )}
      </div>
    </DrilldownPanel>
  )
}
