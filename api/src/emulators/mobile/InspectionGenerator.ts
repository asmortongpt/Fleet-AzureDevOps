/**
 * InspectionGenerator - Generates realistic vehicle inspection reports from mobile app
 *
 * Inspection Types:
 * - Pre-trip (daily before first trip - DOT compliance)
 * - Post-trip (end of shift for commercial vehicles)
 * - Annual inspections
 * - DOT inspections (commercial vehicles)
 * - Custom inspections
 */

import { EventEmitter } from 'events'
import { PhotoGenerator, GeneratedPhoto } from './PhotoGenerator'

export interface InspectionChecklistItem {
  category: string
  item_name: string
  status: 'pass' | 'fail' | 'na'
  notes?: string
  photo_required: boolean
  photos?: GeneratedPhoto[]
  defect_severity?: 'minor' | 'major' | 'critical'
  estimated_repair_cost?: number
}

export interface VehicleInspection {
  id?: number
  tenant_id?: number
  vehicle_id: string
  driver_id: string
  inspector_name: string
  inspection_type: 'pre_trip' | 'post_trip' | 'maintenance' | 'annual' | 'dot' | 'custom'
  inspection_date: Date
  odometer_reading: number
  location: {
    lat: number
    lng: number
    address?: string
  }
  checklist: InspectionChecklistItem[]
  overall_result: 'pass' | 'fail' | 'pass_with_defects'
  defects_found: number
  critical_defects: number
  total_repair_cost_estimate: number
  inspector_notes?: string
  digital_signature?: string
  signature_timestamp?: Date
  next_inspection_due?: Date
  dot_compliant: boolean
  requires_immediate_attention: boolean
  linked_work_orders?: string[]
  submitted_via_mobile: boolean
  device_info: {
    platform: string
    os_version: string
    app_version: string
    network_type: string
  }
}

export class InspectionGenerator extends EventEmitter {
  private photoGenerator: PhotoGenerator

  // Standard DOT pre-trip inspection checklist
  private preTripChecklist = [
    { category: 'Exterior', item: 'Tire Condition & Tread Depth', photoRequired: false },
    { category: 'Exterior', item: 'Tire Pressure', photoRequired: false },
    { category: 'Exterior', item: 'Wheel Lug Nuts & Rims', photoRequired: false },
    { category: 'Lights', item: 'Headlights (High/Low Beam)', photoRequired: false },
    { category: 'Lights', item: 'Turn Signals', photoRequired: false },
    { category: 'Lights', item: 'Brake Lights', photoRequired: false },
    { category: 'Lights', item: 'Hazard Lights', photoRequired: false },
    { category: 'Lights', item: 'License Plate Lights', photoRequired: false },
    { category: 'Mirrors', item: 'Side Mirrors (Clean & Adjusted)', photoRequired: false },
    { category: 'Mirrors', item: 'Rear View Mirror', photoRequired: false },
    { category: 'Glass', item: 'Windshield (No Cracks)', photoRequired: true },
    { category: 'Glass', item: 'Side Windows', photoRequired: false },
    { category: 'Wipers', item: 'Windshield Wipers', photoRequired: false },
    { category: 'Wipers', item: 'Washer Fluid Level', photoRequired: false },
    { category: 'Brakes', item: 'Brake Pedal Feel', photoRequired: false },
    { category: 'Brakes', item: 'Parking Brake', photoRequired: false },
    { category: 'Fluids', item: 'Engine Oil Level', photoRequired: false },
    { category: 'Fluids', item: 'Coolant Level', photoRequired: false },
    { category: 'Fluids', item: 'Brake Fluid Level', photoRequired: false },
    { category: 'Belts & Hoses', item: 'Serpentine Belt Condition', photoRequired: false },
    { category: 'Belts & Hoses', item: 'Radiator Hoses', photoRequired: false },
    { category: 'Battery', item: 'Battery Terminals (Clean & Tight)', photoRequired: false },
    { category: 'Horn', item: 'Horn Operation', photoRequired: false },
    { category: 'Seatbelts', item: 'Driver Seatbelt', photoRequired: false },
    { category: 'Seatbelts', item: 'Passenger Seatbelts', photoRequired: false },
    { category: 'Interior', item: 'Dashboard Warning Lights', photoRequired: false },
    { category: 'Interior', item: 'Gauges (Fuel, Temp, Oil)', photoRequired: false },
    { category: 'Interior', item: 'Climate Controls', photoRequired: false },
    { category: 'Safety Equipment', item: 'Fire Extinguisher', photoRequired: false },
    { category: 'Safety Equipment', item: 'First Aid Kit', photoRequired: false },
    { category: 'Safety Equipment', item: 'Emergency Triangles', photoRequired: false },
    { category: 'Documents', item: 'Vehicle Registration', photoRequired: false },
    { category: 'Documents', item: 'Insurance Card', photoRequired: false },
    { category: 'Cargo', item: 'Cargo Secure (if applicable)', photoRequired: false },
    { category: 'Leaks', item: 'Check for Fluid Leaks', photoRequired: true }
  ]

  // Post-trip checklist (subset of pre-trip + additional wear items)
  private postTripChecklist = [
    { category: 'Exterior', item: 'Body Damage Assessment', photoRequired: true },
    { category: 'Exterior', item: 'Tire Wear Assessment', photoRequired: false },
    { category: 'Interior', item: 'Interior Cleanliness', photoRequired: false },
    { category: 'Interior', item: 'Dashboard Lights/Warnings', photoRequired: true },
    { category: 'Performance', item: 'Unusual Noises Noted', photoRequired: false },
    { category: 'Performance', item: 'Vibration or Handling Issues', photoRequired: false },
    { category: 'Fluids', item: 'Fuel Level', photoRequired: false },
    { category: 'Maintenance', item: 'Maintenance Needed (Y/N)', photoRequired: false }
  ]

  constructor() {
    super()
    this.photoGenerator = new PhotoGenerator()
  }

  /**
   * Generate a realistic vehicle inspection
   */
  public generateInspection(
    vehicleId: string,
    driverId: string,
    inspectorName: string,
    inspectionType: VehicleInspection['inspection_type'],
    currentLocation: { lat: number; lng: number },
    odometerReading: number
  ): VehicleInspection {
    // Select checklist based on inspection type
    const checklistTemplate = inspectionType === 'post_trip'
      ? this.postTripChecklist
      : this.preTripChecklist

    // Generate checklist items with realistic pass/fail rates
    const checklist: InspectionChecklistItem[] = []
    let defectsFound = 0
    let criticalDefects = 0
    let totalRepairCost = 0

    for (const template of checklistTemplate) {
      // Most items pass (85%), some fail (15%)
      const passProbability = Math.random()
      const status: 'pass' | 'fail' | 'na' = passProbability < 0.85 ? 'pass' : passProbability < 0.98 ? 'fail' : 'na'

      let defectSeverity: 'minor' | 'major' | 'critical' | undefined
      let repairCost: number | undefined
      let notes: string | undefined
      let photos: GeneratedPhoto[] | undefined

      if (status === 'fail') {
        defectsFound++

        // Determine severity (60% minor, 30% major, 10% critical)
        const severityRand = Math.random()
        defectSeverity = severityRand < 0.6 ? 'minor' : severityRand < 0.9 ? 'major' : 'critical'

        if (defectSeverity === 'critical') {
          criticalDefects++
        }

        // Estimate repair cost based on severity
        repairCost = defectSeverity === 'minor'
          ? Math.floor(Math.random() * 200) + 50 // $50-$250
          : defectSeverity === 'major'
          ? Math.floor(Math.random() * 800) + 300 // $300-$1100
          : Math.floor(Math.random() * 3000) + 1000 // $1000-$4000

        totalRepairCost += repairCost

        // Generate notes for failed items
        notes = this.generateDefectNotes(template.item, defectSeverity)

        // Generate photo if required or if it's a failed item
        if (template.photoRequired || Math.random() < 0.6) {
          const photo = this.photoGenerator.generateInspectionPhotos(
            inspectionType,
            template.item,
            false,
            currentLocation,
            new Date()
          )
          photos = [photo]
        }
      } else if (status === 'pass' && template.photoRequired) {
        // Generate photo for required pass items
        const photo = this.photoGenerator.generateInspectionPhotos(
          inspectionType,
          template.item,
          true,
          currentLocation,
          new Date()
        )
        photos = [photo]
      }

      checklist.push({
        category: template.category,
        item_name: template.item,
        status,
        notes,
        photo_required: template.photoRequired,
        photos,
        defect_severity: defectSeverity,
        estimated_repair_cost: repairCost
      })
    }

    // Overall result
    const overallResult: VehicleInspection['overall_result'] =
      criticalDefects > 0
        ? 'fail'
        : defectsFound > 0
        ? 'pass_with_defects'
        : 'pass'

    // DOT compliant if no critical defects
    const dotCompliant = criticalDefects === 0

    // Requires immediate attention if critical defects or too many major defects
    const requiresImmediateAttention = criticalDefects > 0 || (defectsFound > 5 && totalRepairCost > 2000)

    // Generate work orders for failed items (if any)
    const linkedWorkOrders: string[] = []
    if (defectsFound > 0) {
      const workOrderCount = Math.min(defectsFound, 3) // Max 3 work orders
      for (let i = 0; i < workOrderCount; i++) {
        linkedWorkOrders.push(`WO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`)
      }
    }

    // Inspector notes
    const inspectorNotes = this.generateInspectorNotes(overallResult, defectsFound, criticalDefects)

    // Digital signature simulation
    const digitalSignature = `SIG-${inspectorName.replace(/\s+/g, '')}-${Date.now()}`

    // Next inspection due (for annual: +1 year, for pre-trip: +1 day, post-trip: not applicable)
    let nextInspectionDue: Date | undefined
    if (inspectionType === 'annual' || inspectionType === 'dot') {
      nextInspectionDue = new Date()
      nextInspectionDue.setFullYear(nextInspectionDue.getFullYear() + 1)
    } else if (inspectionType === 'pre_trip') {
      nextInspectionDue = new Date()
      nextInspectionDue.setDate(nextInspectionDue.getDate() + 1)
    }

    // Device info
    const deviceInfo = {
      platform: Math.random() > 0.6 ? 'iOS' : 'Android',
      os_version: Math.random() > 0.6 ? '17.2' : '14',
      app_version: '2.5.1',
      network_type: Math.random() > 0.3 ? 'WiFi' : '4G'
    }

    return {
      vehicle_id: vehicleId,
      driver_id: driverId,
      inspector_name: inspectorName,
      inspection_type: inspectionType,
      inspection_date: new Date(),
      odometer_reading: odometerReading,
      location: {
        lat: currentLocation.lat,
        lng: currentLocation.lng
      },
      checklist,
      overall_result: overallResult,
      defects_found: defectsFound,
      critical_defects: criticalDefects,
      total_repair_cost_estimate: totalRepairCost,
      inspector_notes: inspectorNotes,
      digital_signature: digitalSignature,
      signature_timestamp: new Date(),
      next_inspection_due: nextInspectionDue,
      dot_compliant: dotCompliant,
      requires_immediate_attention: requiresImmediateAttention,
      linked_work_orders: linkedWorkOrders.length > 0 ? linkedWorkOrders : undefined,
      submitted_via_mobile: true,
      device_info: deviceInfo
    }
  }

  /**
   * Generate defect notes
   */
  private generateDefectNotes(itemName: string, severity: string): string {
    const severityDescriptions = {
      minor: 'needs attention soon',
      major: 'requires repair before next trip',
      critical: 'IMMEDIATE REPAIR REQUIRED - DO NOT OPERATE'
    }

    const itemSpecificNotes: Record<string, string> = {
      'Tire Condition & Tread Depth': `Tread depth below ${severity === 'critical' ? '2/32"' : '4/32"'}. ${severityDescriptions[severity as keyof typeof severityDescriptions]}`,
      'Headlights (High/Low Beam)': `${severity === 'critical' ? 'Both' : 'One'} headlight not functioning. ${severityDescriptions[severity as keyof typeof severityDescriptions]}`,
      'Brake Lights': `Brake light(s) not working. ${severityDescriptions[severity as keyof typeof severityDescriptions]}`,
      'Windshield (No Cracks)': `Crack in windshield ${severity === 'critical' ? 'obstructing driver view' : 'spreading'}. ${severityDescriptions[severity as keyof typeof severityDescriptions]}`,
      'Brake Pedal Feel': `Brake pedal feels ${severity === 'critical' ? 'spongy/goes to floor' : 'soft'}. ${severityDescriptions[severity as keyof typeof severityDescriptions]}`,
      'Engine Oil Level': `Oil level ${severity === 'critical' ? 'critically low' : 'below minimum'}. ${severityDescriptions[severity as keyof typeof severityDescriptions]}`,
      'Check for Fluid Leaks': `${severity === 'critical' ? 'Active' : 'Minor'} fluid leak detected under vehicle. ${severityDescriptions[severity as keyof typeof severityDescriptions]}`
    }

    return itemSpecificNotes[itemName] || `${itemName} failed inspection. ${severityDescriptions[severity as keyof typeof severityDescriptions]}`
  }

  /**
   * Generate inspector notes
   */
  private generateInspectorNotes(result: string, defects: number, critical: number): string {
    if (result === 'pass') {
      return 'Vehicle passed all inspection items. No defects found. Safe for operation.'
    }

    if (result === 'fail') {
      return `Vehicle FAILED inspection with ${critical} critical defect(s). DO NOT OPERATE until repairs are completed and re-inspection is passed. Work orders have been created.`
    }

    return `Vehicle passed inspection with ${defects} minor/major defect(s) noted. Repairs should be scheduled soon. Vehicle is safe for operation but monitor closely.`
  }

  /**
   * Generate daily pre-trip inspections for fleet
   */
  public generateDailyPreTripInspections(
    vehicles: Array<{
      id: string
      driverId: string
      driverName: string
      location: { lat: number; lng: number }
      odometer: number
    }>,
    percentage: number = 0.6 // 60% of fleet does pre-trip daily
  ): VehicleInspection[] {
    const inspections: VehicleInspection[] = []
    const vehiclesToInspect = Math.floor(vehicles.length * percentage)

    for (let i = 0; i < vehiclesToInspect; i++) {
      const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)]
      const inspection = this.generateInspection(
        vehicle.id,
        vehicle.driverId,
        vehicle.driverName,
        'pre_trip',
        vehicle.location,
        vehicle.odometer
      )
      inspections.push(inspection)
    }

    return inspections
  }
}
