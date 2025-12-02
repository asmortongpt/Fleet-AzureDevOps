//
//  DriverModels.swift
//  Fleet Manager - iOS Native App
//
//  Driver models for driver management, licensing, and performance tracking
//  Supports offline-first architecture with API sync
//

import Foundation
import SwiftUI

// MARK: - Driver Model
public struct Driver: Codable, Identifiable, Equatable {
    public let id: String
    public let tenantId: String
    public var employeeId: String
    public var firstName: String
    public var lastName: String
    public var email: String
    public var phone: String
    public var photoURL: String?
    public var status: DriverStatus
    public var license: DriverLicense
    public var assignedVehicles: [String] // Vehicle IDs
    public var department: String
    public var region: String
    public var hireDate: Date
    public var performanceMetrics: PerformanceMetrics
    public var schedule: DriverSchedule?
    public var certifications: [Certification]
    public var address: DriverAddress?
    public var emergencyContact: EmergencyContact?
    public var notes: String?
    public var tags: [String]?
    public var createdAt: Date
    public var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case tenantId = "tenant_id"
        case employeeId = "employee_id"
        case firstName = "first_name"
        case lastName = "last_name"
        case email
        case phone
        case photoURL = "photo_url"
        case status
        case license
        case assignedVehicles = "assigned_vehicles"
        case department
        case region
        case hireDate = "hire_date"
        case performanceMetrics = "performance_metrics"
        case schedule
        case certifications
        case address
        case emergencyContact = "emergency_contact"
        case notes
        case tags
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }

    // Computed properties
    public var fullName: String {
        "\(firstName) \(lastName)"
    }

    public var initials: String {
        let first = firstName.prefix(1)
        let last = lastName.prefix(1)
        return "\(first)\(last)".uppercased()
    }

    public var isLicenseExpiring: Bool {
        guard let expirationDate = license.expirationDate else { return false }
        let daysUntilExpiration = Calendar.current.dateComponents([.day], from: Date(), to: expirationDate).day ?? 0
        return daysUntilExpiration <= 30 && daysUntilExpiration >= 0
    }

    public var isLicenseExpired: Bool {
        guard let expirationDate = license.expirationDate else { return false }
        return expirationDate < Date()
    }

    public var hasMultipleVehicles: Bool {
        assignedVehicles.count > 1
    }
}

// MARK: - Driver Status
public enum DriverStatus: String, Codable, CaseIterable {
    case active
    case inactive
    case onLeave = "on_leave"
    case suspended
    case training
    case terminated

    public var displayName: String {
        switch self {
        case .active: return "Active"
        case .inactive: return "Inactive"
        case .onLeave: return "On Leave"
        case .suspended: return "Suspended"
        case .training: return "Training"
        case .terminated: return "Terminated"
        }
    }

    public var color: Color {
        switch self {
        case .active: return .green
        case .inactive: return .gray
        case .onLeave: return .blue
        case .suspended: return .orange
        case .training: return .purple
        case .terminated: return .red
        }
    }

    public var icon: String {
        switch self {
        case .active: return "checkmark.circle.fill"
        case .inactive: return "pause.circle.fill"
        case .onLeave: return "calendar.badge.clock"
        case .suspended: return "exclamationmark.triangle.fill"
        case .training: return "book.fill"
        case .terminated: return "xmark.circle.fill"
        }
    }
}

// MARK: - Driver License
public struct DriverLicense: Codable, Equatable {
    public var licenseNumber: String
    public var licenseClass: LicenseClass
    public var state: String
    public var country: String
    public var issueDate: Date?
    public var expirationDate: Date?
    public var endorsements: [String]
    public var restrictions: [String]
    public var status: LicenseStatus

    enum CodingKeys: String, CodingKey {
        case licenseNumber = "license_number"
        case licenseClass = "license_class"
        case state
        case country
        case issueDate = "issue_date"
        case expirationDate = "expiration_date"
        case endorsements
        case restrictions
        case status
    }

    public var daysUntilExpiration: Int? {
        guard let expirationDate = expirationDate else { return nil }
        return Calendar.current.dateComponents([.day], from: Date(), to: expirationDate).day
    }

    public var isValid: Bool {
        status == .valid && !(expirationDate ?? Date.distantFuture < Date())
    }
}

// MARK: - License Class
public enum LicenseClass: String, Codable, CaseIterable {
    case classA = "class_a"
    case classB = "class_b"
    case classC = "class_c"
    case classD = "class_d"
    case cdl = "cdl"
    case commercial
    case motorcycle

    public var displayName: String {
        switch self {
        case .classA: return "Class A"
        case .classB: return "Class B"
        case .classC: return "Class C"
        case .classD: return "Class D"
        case .cdl: return "CDL"
        case .commercial: return "Commercial"
        case .motorcycle: return "Motorcycle"
        }
    }
}

// MARK: - License Status
public enum LicenseStatus: String, Codable {
    case valid
    case expired
    case suspended
    case revoked
    case pending

    public var displayName: String {
        rawValue.capitalized
    }

    public var color: Color {
        switch self {
        case .valid: return .green
        case .expired: return .red
        case .suspended: return .orange
        case .revoked: return .red
        case .pending: return .blue
        }
    }
}

// MARK: - Performance Metrics
public struct PerformanceMetrics: Codable, Equatable {
    public var totalTrips: Int
    public var totalMiles: Double
    public var totalHours: Double
    public var averageSpeedMph: Double
    public var fuelEfficiencyMpg: Double
    public var safetyScore: Double // 0-100
    public var onTimeRate: Double // 0-1
    public var incidentCount: Int
    public var violationCount: Int
    public var lastTripDate: Date?
    public var rating: Double? // 1-5

    enum CodingKeys: String, CodingKey {
        case totalTrips = "total_trips"
        case totalMiles = "total_miles"
        case totalHours = "total_hours"
        case averageSpeedMph = "average_speed_mph"
        case fuelEfficiencyMpg = "fuel_efficiency_mpg"
        case safetyScore = "safety_score"
        case onTimeRate = "on_time_rate"
        case incidentCount = "incident_count"
        case violationCount = "violation_count"
        case lastTripDate = "last_trip_date"
        case rating
    }

    public var safetyGrade: String {
        switch safetyScore {
        case 90...100: return "A"
        case 80..<90: return "B"
        case 70..<80: return "C"
        case 60..<70: return "D"
        default: return "F"
        }
    }

    public var safetyGradeColor: Color {
        switch safetyScore {
        case 90...100: return .green
        case 80..<90: return .blue
        case 70..<80: return .yellow
        case 60..<70: return .orange
        default: return .red
        }
    }

    public var onTimePercentage: Int {
        Int(onTimeRate * 100)
    }

    public var hasIncidents: Bool {
        incidentCount > 0 || violationCount > 0
    }
}

// MARK: - Driver Schedule
public struct DriverSchedule: Codable, Equatable {
    public var availability: Availability
    public var shifts: [Shift]
    public var timeOff: [TimeOff]
    public var workingHoursPerWeek: Double

    enum CodingKeys: String, CodingKey {
        case availability
        case shifts
        case timeOff = "time_off"
        case workingHoursPerWeek = "working_hours_per_week"
    }
}

// MARK: - Availability
public enum Availability: String, Codable, CaseIterable {
    case available
    case busy
    case offDuty = "off_duty"
    case vacation
    case sick

    public var displayName: String {
        switch self {
        case .available: return "Available"
        case .busy: return "Busy"
        case .offDuty: return "Off Duty"
        case .vacation: return "Vacation"
        case .sick: return "Sick"
        }
    }

    public var color: Color {
        switch self {
        case .available: return .green
        case .busy: return .orange
        case .offDuty: return .gray
        case .vacation: return .blue
        case .sick: return .red
        }
    }
}

// MARK: - Shift
public struct Shift: Codable, Identifiable, Equatable {
    public let id: String
    public var startTime: Date
    public var endTime: Date
    public var type: ShiftType
    public var vehicleId: String?
    public var location: String?

    enum CodingKeys: String, CodingKey {
        case id
        case startTime = "start_time"
        case endTime = "end_time"
        case type
        case vehicleId = "vehicle_id"
        case location
    }

    public var duration: TimeInterval {
        endTime.timeIntervalSince(startTime)
    }

    public var durationHours: Double {
        duration / 3600
    }
}

// MARK: - Shift Type
public enum ShiftType: String, Codable, CaseIterable {
    case day
    case night
    case swing
    case split

    public var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - Time Off
public struct TimeOff: Codable, Identifiable, Equatable {
    public let id: String
    public var startDate: Date
    public var endDate: Date
    public var type: TimeOffType
    public var status: TimeOffStatus
    public var reason: String?

    enum CodingKeys: String, CodingKey {
        case id
        case startDate = "start_date"
        case endDate = "end_date"
        case type
        case status
        case reason
    }
}

// MARK: - Time Off Type
public enum TimeOffType: String, Codable, CaseIterable {
    case vacation
    case sick
    case personal
    case medical
    case emergency

    public var displayName: String {
        rawValue.capitalized
    }
}

// MARK: - Time Off Status
public enum TimeOffStatus: String, Codable {
    case pending
    case approved
    case denied
    case cancelled

    public var displayName: String {
        rawValue.capitalized
    }

    public var color: Color {
        switch self {
        case .pending: return .blue
        case .approved: return .green
        case .denied: return .red
        case .cancelled: return .gray
        }
    }
}

// MARK: - Certification
public struct Certification: Codable, Identifiable, Equatable {
    public let id: String
    public var name: String
    public var issuingAuthority: String
    public var certificationNumber: String?
    public var issueDate: Date?
    public var expirationDate: Date?
    public var status: CertificationStatus
    public var documentURL: String?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case issuingAuthority = "issuing_authority"
        case certificationNumber = "certification_number"
        case issueDate = "issue_date"
        case expirationDate = "expiration_date"
        case status
        case documentURL = "document_url"
    }

    public var isExpiringSoon: Bool {
        guard let expirationDate = expirationDate else { return false }
        let daysUntilExpiration = Calendar.current.dateComponents([.day], from: Date(), to: expirationDate).day ?? 0
        return daysUntilExpiration <= 30 && daysUntilExpiration >= 0
    }

    public var isExpired: Bool {
        guard let expirationDate = expirationDate else { return false }
        return expirationDate < Date()
    }
}

// MARK: - Certification Status
public enum CertificationStatus: String, Codable {
    case active
    case expired
    case pending
    case suspended

    public var displayName: String {
        rawValue.capitalized
    }

    public var color: Color {
        switch self {
        case .active: return .green
        case .expired: return .red
        case .pending: return .blue
        case .suspended: return .orange
        }
    }
}

// MARK: - Driver Address
public struct DriverAddress: Codable, Equatable {
    public var street: String
    public var city: String
    public var state: String
    public var zipCode: String
    public var country: String

    enum CodingKeys: String, CodingKey {
        case street
        case city
        case state
        case zipCode = "zip_code"
        case country
    }

    public var fullAddress: String {
        "\(street), \(city), \(state) \(zipCode), \(country)"
    }
}

// MARK: - Emergency Contact
public struct EmergencyContact: Codable, Equatable {
    public var name: String
    public var relationship: String
    public var phone: String
    public var alternatePhone: String?

    enum CodingKeys: String, CodingKey {
        case name
        case relationship
        case phone
        case alternatePhone = "alternate_phone"
    }
}

// MARK: - API Response Models
public struct DriversResponse: Codable {
    public let drivers: [Driver]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct DriverResponse: Codable {
    public let driver: Driver
}

// MARK: - Sample Data for Previews
extension Driver {
    public static var sample: Driver {
        Driver(
            id: "driver-001",
            tenantId: "tenant-001",
            employeeId: "EMP-12345",
            firstName: "John",
            lastName: "Smith",
            email: "john.smith@fleet.com",
            phone: "+1 (555) 123-4567",
            photoURL: nil,
            status: .active,
            license: DriverLicense.sample,
            assignedVehicles: ["vehicle-001", "vehicle-002"],
            department: "Operations",
            region: "Northeast",
            hireDate: Calendar.current.date(byAdding: .year, value: -3, to: Date())!,
            performanceMetrics: PerformanceMetrics.sample,
            schedule: DriverSchedule.sample,
            certifications: [Certification.sample],
            address: DriverAddress.sample,
            emergencyContact: EmergencyContact.sample,
            notes: "Excellent safety record",
            tags: ["senior", "trainer"],
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}

extension DriverLicense {
    public static var sample: DriverLicense {
        DriverLicense(
            licenseNumber: "D1234567",
            licenseClass: .classC,
            state: "CA",
            country: "USA",
            issueDate: Calendar.current.date(byAdding: .year, value: -4, to: Date()),
            expirationDate: Calendar.current.date(byAdding: .year, value: 1, to: Date()),
            endorsements: ["Passenger", "Tanker"],
            restrictions: [],
            status: .valid
        )
    }
}

extension PerformanceMetrics {
    public static var sample: PerformanceMetrics {
        PerformanceMetrics(
            totalTrips: 1245,
            totalMiles: 45678.5,
            totalHours: 2340.5,
            averageSpeedMph: 52.3,
            fuelEfficiencyMpg: 24.8,
            safetyScore: 92.5,
            onTimeRate: 0.96,
            incidentCount: 0,
            violationCount: 1,
            lastTripDate: Date(),
            rating: 4.7
        )
    }
}

extension DriverSchedule {
    public static var sample: DriverSchedule {
        DriverSchedule(
            availability: .available,
            shifts: [Shift.sample],
            timeOff: [],
            workingHoursPerWeek: 40
        )
    }
}

extension Shift {
    public static var sample: Shift {
        Shift(
            id: "shift-001",
            startTime: Calendar.current.date(bySettingHour: 8, minute: 0, second: 0, of: Date())!,
            endTime: Calendar.current.date(bySettingHour: 17, minute: 0, second: 0, of: Date())!,
            type: .day,
            vehicleId: "vehicle-001",
            location: "Central Depot"
        )
    }
}

extension Certification {
    public static var sample: Certification {
        Certification(
            id: "cert-001",
            name: "Hazmat Transportation",
            issuingAuthority: "DOT",
            certificationNumber: "HAZMAT-12345",
            issueDate: Calendar.current.date(byAdding: .year, value: -2, to: Date()),
            expirationDate: Calendar.current.date(byAdding: .year, value: 1, to: Date()),
            status: .active,
            documentURL: nil
        )
    }
}

extension DriverAddress {
    public static var sample: DriverAddress {
        DriverAddress(
            street: "123 Main Street",
            city: "San Francisco",
            state: "CA",
            zipCode: "94105",
            country: "USA"
        )
    }
}

extension EmergencyContact {
    public static var sample: EmergencyContact {
        EmergencyContact(
            name: "Jane Smith",
            relationship: "Spouse",
            phone: "+1 (555) 987-6543",
            alternatePhone: nil
        )
    }
}
