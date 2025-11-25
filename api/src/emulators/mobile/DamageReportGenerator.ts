/**
 * DamageReportGenerator - Generates realistic vehicle damage incident reports from mobile app
 *
 * Simulates:
 * - Minor damage (scratches, paint chips, small dents)
 * - Moderate damage (larger dents, broken lights, cracked windshield)
 * - Severe damage (collisions, structural damage, major repairs needed)
 * - Multiple photos per incident with annotations
 * - Auto-linked work orders
 */

import { EventEmitter } from 'events'
import { PhotoGenerator, GeneratedPhoto } from './PhotoGenerator'

export interface DamageReport {
  id?: number
  tenant_id?: number
  vehicle_id: string
  driver_id: string
  report_date: Date
  damage_description: string
  damage_type: string
  damage_severity: 'minor' | 'moderate' | 'severe'
  damage_location: string // 'front', 'rear', 'left_side', 'right_side', 'roof', 'interior'
  estimated_cost: number
  photos: GeneratedPhoto[]
  location: {
    lat: number
    lng: number
    address?: string
  }
  incident_details: {
    incident_type: string // 'collision', 'vandalism', 'weather', 'parking_lot', 'road_debris'
    occurred_at: Date
    discovered_at: Date
    driver_at_fault: boolean
    other_party_involved: boolean
    police_report_filed: boolean
    police_report_number?: string
    witness_count: number
  }
  reported_by: {
    name: string
    role: 'driver' | 'manager' | 'inspector'
  }
  linked_work_order_id?: string
  insurance_claim_number?: string
  status: 'reported' | 'under_review' | 'approved' | 'work_ordered' | 'repaired'
  submitted_via_mobile: boolean
  device_info: {
    platform: string
    os_version: string
    app_version: string
    network_type: string
  }
}

export class DamageReportGenerator extends EventEmitter {
  private photoGenerator: PhotoGenerator

  // Damage type definitions
  private damageTypes = {
    minor: [
      { type: 'scratch', location: ['left_side', 'right_side', 'front', 'rear'], cost: [150, 500] },
      { type: 'paint_chip', location: ['front', 'hood', 'door'], cost: [100, 350] },
      { type: 'small_dent', location: ['door', 'fender', 'quarter_panel'], cost: [200, 600] },
      { type: 'scuff_mark', location: ['bumper', 'door', 'wheel_well'], cost: [120, 400] }
    ],
    moderate: [
      { type: 'large_dent', location: ['door', 'fender', 'quarter_panel', 'hood'], cost: [600, 1500] },
      { type: 'broken_light', location: ['front', 'rear'], cost: [300, 800] },
      { type: 'cracked_windshield', location: ['front'], cost: [400, 1200] },
      { type: 'side_mirror_damage', location: ['left_side', 'right_side'], cost: [250, 700] },
      { type: 'bumper_damage', location: ['front', 'rear'], cost: [500, 1500] }
    ],
    severe: [
      { type: 'collision_damage', location: ['front', 'rear', 'side'], cost: [3000, 15000] },
      { type: 'frame_damage', location: ['undercarriage'], cost: [5000, 20000] },
      { type: 'multiple_panel_damage', location: ['multiple'], cost: [4000, 12000] },
      { type: 'rollover_damage', location: ['roof', 'multiple'], cost: [10000, 30000] },
      { type: 'fire_damage', location: ['engine', 'interior'], cost: [8000, 25000] }
    ]
  }

  private incidentTypes = [
    'collision_with_vehicle',
    'collision_with_object',
    'backing_incident',
    'parking_lot_incident',
    'vandalism',
    'weather_damage',
    'road_debris',
    'animal_strike',
    'unknown'
  ]

  constructor() {
    super()
    this.photoGenerator = new PhotoGenerator()
  }

  /**
   * Generate a random damage report
   */
  public generateDamageReport(
    vehicleId: string,
    driverId: string,
    driverName: string,
    currentLocation: { lat: number; lng: number },
    severity?: 'minor' | 'moderate' | 'severe'
  ): DamageReport {
    // Determine severity (70% minor, 20% moderate, 10% severe)
    if (!severity) {
      const rand = Math.random()
      severity = rand < 0.7 ? 'minor' : rand < 0.9 ? 'moderate' : 'severe'
    }

    // Select damage type based on severity
    const damageOptions = this.damageTypes[severity]
    const selectedDamage = damageOptions[Math.floor(Math.random() * damageOptions.length)]

    // Determine location
    const locationArray = Array.isArray(selectedDamage.location) ? selectedDamage.location : [selectedDamage.location]
    const damageLocation = locationArray[Math.floor(Math.random() * locationArray.length)]

    // Calculate estimated cost
    const [minCost, maxCost] = selectedDamage.cost
    const estimatedCost = Math.floor(Math.random() * (maxCost - minCost) + minCost)

    // Generate timestamps
    const now = new Date()
    const occurredAt = new Date(now.getTime() - Math.floor(Math.random() * 7200000)) // 0-2 hours ago
    const discoveredAt = new Date(occurredAt.getTime() + Math.floor(Math.random() * 1800000)) // 0-30 min after occurred

    // Select incident type
    const incidentType = this.incidentTypes[Math.floor(Math.random() * this.incidentTypes.length)]

    // Determine fault and other party
    const driverAtFault = Math.random() < 0.4 // 40% driver at fault
    const otherPartyInvolved = ['collision_with_vehicle', 'parking_lot_incident'].includes(incidentType)

    // Police report (30% chance for moderate/severe, 5% for minor)
    const policeReportFiled = severity === 'minor'
      ? Math.random() < 0.05
      : Math.random() < 0.3
    const policeReportNumber = policeReportFiled
      ? `RPT-${Math.floor(Math.random() * 1000000)}`
      : undefined

    // Witness count (0-3)
    const witnessCount = otherPartyInvolved ? Math.floor(Math.random() * 4) : 0

    // Generate description
    const description = this.generateDamageDescription(selectedDamage.type, damageLocation, severity, incidentType)

    // Generate photos (1-2 for minor, 3-4 for moderate, 4-6 for severe)
    const photoCount = severity === 'minor'
      ? Math.floor(Math.random() * 2) + 1
      : severity === 'moderate'
      ? Math.floor(Math.random() * 2) + 3
      : Math.floor(Math.random() * 3) + 4

    const photos = this.photoGenerator.generateDamagePhotos(
      severity,
      selectedDamage.type,
      currentLocation,
      discoveredAt,
      photoCount
    )

    // Generate work order ID (90% chance for moderate/severe, 30% for minor)
    const needsWorkOrder = severity === 'minor'
      ? Math.random() < 0.3
      : Math.random() < 0.9
    const linkedWorkOrderId = needsWorkOrder
      ? `WO-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
      : undefined

    // Insurance claim (60% for severe, 20% for moderate, 5% for minor)
    const needsInsurance = severity === 'severe'
      ? Math.random() < 0.6
      : severity === 'moderate'
      ? Math.random() < 0.2
      : Math.random() < 0.05
    const insuranceClaimNumber = needsInsurance
      ? `CLM-${Date.now()}-${Math.floor(Math.random() * 10000)}`
      : undefined

    // Status progression
    const statusOptions: DamageReport['status'][] = ['reported', 'under_review', 'approved', 'work_ordered']
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)]

    // Device info
    const deviceInfo = {
      platform: Math.random() > 0.6 ? 'iOS' : 'Android',
      os_version: Math.random() > 0.6 ? '17.2' : '14',
      app_version: '2.5.1',
      network_type: Math.random() > 0.4 ? 'WiFi' : '4G'
    }

    return {
      vehicle_id: vehicleId,
      driver_id: driverId,
      report_date: discoveredAt,
      damage_description: description,
      damage_type: selectedDamage.type,
      damage_severity: severity,
      damage_location: damageLocation,
      estimated_cost: estimatedCost,
      photos,
      location: {
        lat: currentLocation.lat,
        lng: currentLocation.lng
      },
      incident_details: {
        incident_type: incidentType,
        occurred_at: occurredAt,
        discovered_at: discoveredAt,
        driver_at_fault: driverAtFault,
        other_party_involved: otherPartyInvolved,
        police_report_filed: policeReportFiled,
        police_report_number: policeReportNumber,
        witness_count: witnessCount
      },
      reported_by: {
        name: driverName,
        role: 'driver'
      },
      linked_work_order_id: linkedWorkOrderId,
      insurance_claim_number: insuranceClaimNumber,
      status,
      submitted_via_mobile: true,
      device_info: deviceInfo
    }
  }

  /**
   * Generate realistic damage description
   */
  private generateDamageDescription(
    damageType: string,
    location: string,
    severity: string,
    incidentType: string
  ): string {
    const severityText = {
      minor: 'Minor',
      moderate: 'Moderate',
      severe: 'Severe'
    }[severity]

    const locationText = location.replace(/_/g, ' ')

    const descriptions = {
      scratch: `${severityText} scratch on ${locationText}. Damage appears to be from ${this.getIncidentContext(incidentType)}.`,
      paint_chip: `Paint chip on ${locationText} approximately 2-3 inches. ${this.getIncidentContext(incidentType)}.`,
      small_dent: `Small dent on ${locationText}, roughly the size of a baseball. ${this.getIncidentContext(incidentType)}.`,
      scuff_mark: `Black scuff mark on ${locationText}. ${this.getIncidentContext(incidentType)}.`,
      large_dent: `Large dent on ${locationText}, paint is cracked. ${this.getIncidentContext(incidentType)}. May require panel replacement.`,
      broken_light: `${locationText} light assembly is cracked/broken. Glass fragments present. ${this.getIncidentContext(incidentType)}.`,
      cracked_windshield: `Windshield has a crack approximately 8-12 inches long. ${this.getIncidentContext(incidentType)}. Requires replacement.`,
      side_mirror_damage: `${locationText} side mirror is damaged/broken. Glass shattered and housing cracked. ${this.getIncidentContext(incidentType)}.`,
      bumper_damage: `${locationText} bumper has significant damage with cracks and misalignment. ${this.getIncidentContext(incidentType)}.`,
      collision_damage: `Severe collision damage to ${locationText}. Multiple panels affected, structural components may be compromised. ${this.getIncidentContext(incidentType)}. Vehicle not driveable.`,
      frame_damage: `Possible frame damage detected during inspection. Vehicle requires professional assessment. ${this.getIncidentContext(incidentType)}.`,
      multiple_panel_damage: `Multiple panels damaged including ${locationText}. ${this.getIncidentContext(incidentType)}. Extensive repairs required.`,
      rollover_damage: `Vehicle rolled over causing damage to roof and multiple sides. ${this.getIncidentContext(incidentType)}. Total loss likely.`,
      fire_damage: `Fire damage to ${locationText}. Smoke damage throughout interior. ${this.getIncidentContext(incidentType)}. Vehicle may be total loss.`
    }

    return descriptions[damageType as keyof typeof descriptions] || `Damage to ${locationText}. ${this.getIncidentContext(incidentType)}.`
  }

  /**
   * Get incident context text
   */
  private getIncidentContext(incidentType: string): string {
    const contexts = {
      collision_with_vehicle: 'Occurred during collision with another vehicle',
      collision_with_object: 'Vehicle struck a stationary object',
      backing_incident: 'Damage occurred while backing up',
      parking_lot_incident: 'Incident occurred in parking lot',
      vandalism: 'Appears to be intentional vandalism',
      weather_damage: 'Caused by weather event (hail/debris)',
      road_debris: 'Hit road debris while driving',
      animal_strike: 'Vehicle struck an animal',
      unknown: 'Cause of damage unknown'
    }

    return contexts[incidentType as keyof typeof contexts] || 'Incident details under investigation'
  }

  /**
   * Generate multiple damage reports for a fleet (realistic daily incidents)
   */
  public generateDailyDamageReports(
    vehicles: Array<{ id: string; driverId: string; driverName: string; location: { lat: number; lng: number } }>,
    count: number = 5
  ): DamageReport[] {
    const reports: DamageReport[] = []

    for (let i = 0; i < count && i < vehicles.length; i++) {
      const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)]
      const report = this.generateDamageReport(
        vehicle.id,
        vehicle.driverId,
        vehicle.driverName,
        vehicle.location
      )
      reports.push(report)
    }

    return reports
  }
}
