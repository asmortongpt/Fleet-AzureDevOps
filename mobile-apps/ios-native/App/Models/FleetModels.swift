//
//  FleetModels.swift
//  Fleet Manager
//
//  Complete data models for the Fleet Management app
//

import Foundation
import CoreLocation

// MARK: - Vehicle Models

struct Vehicle: Identifiable, Codable, Equatable {
    let id: String
    let tenantId: String
    let number: String
    let type: VehicleType
    let make: String
    let model: String
    let year: Int
    let vin: String
    let licensePlate: String
    let status: VehicleStatus
    let location: VehicleLocation
    let region: String
    let department: String
    let fuelLevel: Double
    let fuelType: FuelType
    let mileage: Double
    let hoursUsed: Double?
    let assignedDriver: String?
    let ownership: OwnershipType
    let lastService: Date
    let nextService: Date
    let alerts: [String]
    let customFields: [String: String]?
    let tags: [String]?
}

struct VehicleLocation: Codable, Equatable {
    let lat: Double
    let lng: Double
    let address: String

    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: lat, longitude: lng)
    }
}

// MARK: - Trip Models

struct Trip: Identifiable, Codable {
    let id: String
    let vehicleId: String
    let vehicleNumber: String
    let driverId: String
    let driverName: String
    let startTime: Date
    let endTime: Date?
    let startLocation: VehicleLocation
    let endLocation: VehicleLocation?
    let distance: Double
    let duration: TimeInterval
    let averageSpeed: Double
    let maxSpeed: Double
    let fuelUsed: Double
    let status: TripStatus
    let purpose: String?
    let route: [CLLocationCoordinate2D]
    let events: [TripEvent]
    let notes: String?
}

struct TripEvent: Codable {
    enum EventType: String, Codable {
        case start = "Start"
        case stop = "Stop"
        case hardBraking = "Hard Braking"
        case rapidAcceleration = "Rapid Acceleration"
        case speeding = "Speeding"
        case idle = "Idle"
        case geofenceEntry = "Geofence Entry"
        case geofenceExit = "Geofence Exit"
    }

    enum Severity: String, Codable {
        case low = "Low"
        case medium = "Medium"
        case high = "High"
    }

    let type: EventType
    let timestamp: Date
    let location: CLLocationCoordinate2D
    let severity: Severity
    let details: String?
}

// MARK: - Maintenance Models

struct MaintenanceRecord: Identifiable, Codable {
    let id: String
    let vehicleId: String
    let vehicleNumber: String
    let type: String
    let scheduledDate: Date
    let completedDate: Date?
    let mileageAtService: Double
    let cost: Double
    let provider: String
    let notes: String?
    let status: MaintenanceStatus
    let parts: [MaintenancePart]
    let laborHours: Double
    let warranty: Bool
    let nextServiceDue: Date?
}

struct MaintenancePart: Codable {
    let name: String
    let partNumber: String
    let quantity: Int
    let unitPrice: Double

    var totalPrice: Double {
        Double(quantity) * unitPrice
    }
}

// MARK: - Fuel Models

struct FuelRecord: Identifiable, Codable {
    let id: String
    let vehicleId: String
    let vehicleNumber: String
    let date: Date
    let station: String
    let location: VehicleLocation
    let gallons: Double
    let pricePerGallon: Double
    let totalCost: Double
    let odometer: Double
    let fuelType: FuelType
    let paymentMethod: String
    let receipt: String?
    let notes: String?

    var mpg: Double? {
        // Calculate MPG based on previous fuel record
        nil // Would need previous record to calculate
    }
}

// MARK: - Driver Models

struct Driver: Identifiable, Codable {
    let id: String
    let employeeId: String
    let name: String
    let email: String
    let phone: String
    let licenseNumber: String
    let licenseExpiry: Date
    let department: String
    let status: DriverStatus
    let vehicleAssignments: [String]
    let certifications: [DriverCertification]
    let performanceScore: Double
    let totalMiles: Double
    let totalTrips: Int
    let violations: [DriverViolation]
}

enum DriverStatus: String, Codable {
    case active = "Active"
    case inactive = "Inactive"
    case suspended = "Suspended"
    case onLeave = "On Leave"
}

struct DriverCertification: Codable {
    let type: String
    let issueDate: Date
    let expiryDate: Date
    let isValid: Bool
}

struct DriverViolation: Codable {
    let date: Date
    let type: String
    let severity: String
    let description: String
    let resolved: Bool
}

// MARK: - Incident Models

struct Incident: Identifiable, Codable {
    let id: String
    let vehicleId: String
    let driverId: String
    let date: Date
    let location: VehicleLocation
    let type: IncidentType
    let severity: IncidentSeverity
    let description: String
    let photos: [String]
    let witnesses: [String]
    let policeReportNumber: String?
    let insuranceClaimNumber: String?
    let estimatedCost: Double?
    let status: IncidentStatus
    let notes: String?
}

enum IncidentType: String, Codable {
    case collision = "Collision"
    case breakdown = "Breakdown"
    case theft = "Theft"
    case vandalism = "Vandalism"
    case weatherDamage = "Weather Damage"
    case other = "Other"
}

enum IncidentSeverity: String, Codable {
    case minor = "Minor"
    case moderate = "Moderate"
    case major = "Major"
    case critical = "Critical"
}

enum IncidentStatus: String, Codable {
    case reported = "Reported"
    case investigating = "Investigating"
    case resolved = "Resolved"
    case closed = "Closed"
}

// MARK: - Dashboard Models

struct DashboardStats {
    let totalVehicles: Int
    let activeVehicles: Int
    let totalTrips: Int
    let todayTrips: Int
    let alerts: Int
    let avgFuelLevel: Double
    let maintenanceDue: Int
    let totalMileage: Double
    let totalFuelCost: Double
    let fleetUtilization: Double
}

struct ActivityItem: Identifiable {
    let id = UUID()
    let timestamp: Date
    let type: ActivityType
    let title: String
    let description: String
    let vehicleId: String?
    let driverId: String?
}

enum ActivityType: String {
    case tripStarted = "Trip Started"
    case tripCompleted = "Trip Completed"
    case maintenanceScheduled = "Maintenance Scheduled"
    case maintenanceCompleted = "Maintenance Completed"
    case alert = "Alert"
    case incident = "Incident"
}

// MARK: - Report Models

struct Report: Identifiable {
    let id: String
    let name: String
    let type: ReportType
    let dateRange: DateRange
    let generatedDate: Date
    let format: ReportFormat
    let data: Data?
}

enum ReportType: String, CaseIterable {
    case fleetUtilization = "Fleet Utilization"
    case fuelConsumption = "Fuel Consumption"
    case maintenanceCost = "Maintenance Cost"
    case driverPerformance = "Driver Performance"
    case incidentSummary = "Incident Summary"
    case vehicleCost = "Vehicle Cost Analysis"
}

enum ReportFormat: String, CaseIterable {
    case pdf = "PDF"
    case excel = "Excel"
    case csv = "CSV"
}

struct DateRange {
    let start: Date
    let end: Date
}

// MARK: - Codable Extensions for CLLocationCoordinate2D

extension CLLocationCoordinate2D: Codable {
    enum CodingKeys: String, CodingKey {
        case latitude
        case longitude
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let latitude = try container.decode(Double.self, forKey: .latitude)
        let longitude = try container.decode(Double.self, forKey: .longitude)
        self.init(latitude: latitude, longitude: longitude)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(latitude, forKey: .latitude)
        try container.encode(longitude, forKey: .longitude)
    }
}