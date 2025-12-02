//
//  MockDataGenerator.swift
//  Fleet Manager
//
//  Generate realistic mock data for testing and development
//

import Foundation
import CoreLocation

// MARK: - MockDataGenerator
final class MockDataGenerator {

    // MARK: - Singleton
    static let shared = MockDataGenerator()

    private init() {}

    // MARK: - Vehicle Data

    private let vehicleMakes = ["Ford", "Chevrolet", "RAM", "GMC", "Toyota", "Nissan", "Honda", "Mercedes-Benz", "Volvo", "Peterbilt"]
    private let vehicleModels = [
        "Ford": ["F-150", "F-250", "Transit", "Explorer", "Escape"],
        "Chevrolet": ["Silverado 1500", "Silverado 2500", "Express", "Tahoe", "Colorado"],
        "RAM": ["1500", "2500", "3500", "ProMaster"],
        "GMC": ["Sierra 1500", "Sierra 2500", "Savana", "Canyon"],
        "Toyota": ["Tacoma", "Tundra", "Highlander", "Camry", "Corolla"],
        "Nissan": ["Titan", "Frontier", "NV200", "Altima"],
        "Honda": ["Ridgeline", "Pilot", "CR-V", "Accord"],
        "Mercedes-Benz": ["Sprinter", "Metris", "GLE"],
        "Volvo": ["XC90", "XC60", "VNL"],
        "Peterbilt": ["579", "567", "389"]
    ]

    private let departments = ["Operations", "Sales", "Service", "Delivery", "Construction", "Maintenance", "Executive", "Field Service"]
    private let regions = ["North", "South", "East", "West", "Central", "Northeast", "Southeast", "Northwest", "Southwest"]

    func generateVehicles(count: Int = 25) -> [Vehicle] {
        (0..<count).map { index in
            let make = vehicleMakes.randomElement()!
            let model = vehicleModels[make]?.randomElement() ?? "Model \(index)"
            let year = Int.random(in: 2018...2024)
            let status = VehicleStatus.allCases.randomElement()!
            let mileage = Double.random(in: 5000...150000)
            let fuelLevel = Double.random(in: 10...100)

            return Vehicle(
                id: UUID().uuidString,
                tenantId: "tenant-001",
                number: String(format: "FL-%04d", index + 1),
                type: VehicleType.allCases.randomElement()!,
                make: make,
                model: model,
                year: year,
                vin: generateVIN(),
                licensePlate: generateLicensePlate(),
                status: status,
                location: generateLocation(),
                region: regions.randomElement()!,
                department: departments.randomElement()!,
                fuelLevel: fuelLevel,
                fuelType: FuelType.allCases.randomElement()!,
                mileage: mileage,
                hoursUsed: Double.random(in: 100...5000),
                assignedDriver: Bool.random() ? generateDriverName() : nil,
                ownership: OwnershipType.allCases.randomElement()!,
                lastService: Date().addingTimeInterval(-Double.random(in: 0...90) * 24 * 3600),
                nextService: Date().addingTimeInterval(Double.random(in: 1...90) * 24 * 3600),
                alerts: generateAlerts(),
                customFields: nil,
                tags: generateTags()
            )
        }
    }

    private func generateVIN() -> String {
        let chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"
        return String((0..<17).map { _ in chars.randomElement()! })
    }

    private func generateLicensePlate() -> String {
        let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        let numbers = "0123456789"
        return String((0..<3).map { _ in letters.randomElement()! }) + "-" +
               String((0..<4).map { _ in numbers.randomElement()! })
    }

    private func generateLocation() -> VehicleLocation {
        // Generate locations around major US cities
        let cities = [
            (lat: 40.7128, lng: -74.0060, city: "New York"),
            (lat: 34.0522, lng: -118.2437, city: "Los Angeles"),
            (lat: 41.8781, lng: -87.6298, city: "Chicago"),
            (lat: 29.7604, lng: -95.3698, city: "Houston"),
            (lat: 33.4484, lng: -112.0740, city: "Phoenix"),
            (lat: 39.7392, lng: -104.9903, city: "Denver"),
            (lat: 47.6062, lng: -122.3321, city: "Seattle"),
            (lat: 25.7617, lng: -80.1918, city: "Miami"),
            (lat: 42.3601, lng: -71.0589, city: "Boston"),
            (lat: 37.7749, lng: -122.4194, city: "San Francisco")
        ]

        let city = cities.randomElement()!
        let latOffset = Double.random(in: -0.1...0.1)
        let lngOffset = Double.random(in: -0.1...0.1)

        return VehicleLocation(
            lat: city.lat + latOffset,
            lng: city.lng + lngOffset,
            address: "\(Int.random(in: 100...9999)) \(["Main", "Oak", "Maple", "Elm", "First", "Second", "Park", "Washington"].randomElement()!) St, \(city.city)"
        )
    }

    private func generateDriverName() -> String {
        let firstNames = ["John", "Jane", "Mike", "Sarah", "David", "Emily", "Robert", "Lisa", "James", "Mary", "William", "Jennifer"]
        let lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
        return "\(firstNames.randomElement()!) \(lastNames.randomElement()!)"
    }

    private func generateAlerts() -> [String] {
        var alerts: [String] = []
        if Bool.random() { alerts.append("Maintenance due soon") }
        if Bool.random() { alerts.append("Low fuel") }
        if Bool.random() { alerts.append("Check engine light") }
        if Bool.random() { alerts.append("Tire pressure low") }
        return alerts
    }

    private func generateTags() -> [String] {
        let allTags = ["Heavy Duty", "Light Duty", "Emergency", "Executive", "Pool Vehicle", "Special Equipment", "4WD", "Hybrid", "Electric"]
        return Array(allTags.shuffled().prefix(Int.random(in: 0...3)))
    }

    // MARK: - Trip Data

    func generateTrips(count: Int = 50, vehicles: [Vehicle]) -> [Trip] {
        guard !vehicles.isEmpty else { return [] }

        return (0..<count).map { index in
            let vehicle = vehicles.randomElement()!
            let startTime = Date().addingTimeInterval(-Double.random(in: 0...30) * 24 * 3600)
            let duration = Double.random(in: 600...14400) // 10 minutes to 4 hours
            let endTime = startTime.addingTimeInterval(duration)
            let distance = Double.random(in: 5...200)

            return Trip(
                id: UUID().uuidString,
                vehicleId: vehicle.id,
                vehicleNumber: vehicle.number,
                driverId: generateDriverName(),
                driverName: generateDriverName(),
                startTime: startTime,
                endTime: endTime,
                startLocation: generateLocation(),
                endLocation: generateLocation(),
                distance: distance,
                duration: duration,
                averageSpeed: distance / (duration / 3600),
                maxSpeed: Double.random(in: 45...85),
                fuelUsed: distance * Double.random(in: 0.06...0.15),
                status: TripStatus.allCases.randomElement()!,
                purpose: ["Delivery", "Service Call", "Client Meeting", "Inspection", "Transport", "Emergency Response"].randomElement()!,
                route: generateRoute(),
                events: generateTripEvents(),
                notes: Bool.random() ? "Trip completed successfully" : nil
            )
        }
    }

    private func generateRoute() -> [CLLocationCoordinate2D] {
        let pointCount = Int.random(in: 5...20)
        let startLat = Double.random(in: 30...45)
        let startLng = Double.random(in: -120...(-75))

        return (0..<pointCount).map { i in
            CLLocationCoordinate2D(
                latitude: startLat + Double(i) * Double.random(in: -0.01...0.01),
                longitude: startLng + Double(i) * Double.random(in: -0.01...0.01)
            )
        }
    }

    private func generateTripEvents() -> [TripEvent] {
        var events: [TripEvent] = []

        if Bool.random() {
            events.append(TripEvent(
                type: .hardBraking,
                timestamp: Date(),
                location: CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060),
                severity: .medium,
                details: "Hard braking detected"
            ))
        }

        if Bool.random() {
            events.append(TripEvent(
                type: .rapidAcceleration,
                timestamp: Date(),
                location: CLLocationCoordinate2D(latitude: 40.7128, longitude: -74.0060),
                severity: .low,
                details: "Rapid acceleration detected"
            ))
        }

        return events
    }

    // MARK: - Maintenance Data

    func generateMaintenanceRecords(count: Int = 30, vehicles: [Vehicle]) -> [MaintenanceRecord] {
        guard !vehicles.isEmpty else { return [] }

        let serviceTypes = ["Oil Change", "Tire Rotation", "Brake Service", "Engine Service", "Transmission Service", "Battery Replacement", "Air Filter", "Coolant Flush"]
        let providers = ["Fleet Service Center", "Quick Lube Plus", "Dealer Service", "Mobile Mechanic", "Corporate Garage"]

        return (0..<count).map { _ in
            let vehicle = vehicles.randomElement()!
            let scheduledDate = Date().addingTimeInterval(Double.random(in: -90...90) * 24 * 3600)
            let isCompleted = scheduledDate < Date()

            return MaintenanceRecord(
                id: UUID().uuidString,
                vehicleId: vehicle.id,
                vehicleNumber: vehicle.number,
                type: serviceTypes.randomElement()!,
                scheduledDate: scheduledDate,
                completedDate: isCompleted ? scheduledDate.addingTimeInterval(3600) : nil,
                mileageAtService: vehicle.mileage + Double.random(in: -1000...1000),
                cost: Double.random(in: 50...1500),
                provider: providers.randomElement()!,
                notes: Bool.random() ? "Service completed as scheduled" : nil,
                status: isCompleted ? .completed : (Date() > scheduledDate ? .overdue : .scheduled),
                parts: generateParts(),
                laborHours: Double.random(in: 0.5...4),
                warranty: Bool.random(),
                nextServiceDue: scheduledDate.addingTimeInterval(90 * 24 * 3600)
            )
        }
    }

    private func generateParts() -> [MaintenancePart] {
        let parts = [
            ("Oil Filter", 25.99),
            ("Air Filter", 35.99),
            ("Brake Pads", 125.99),
            ("Battery", 145.99),
            ("Wiper Blades", 29.99),
            ("Spark Plugs", 45.99)
        ]

        let count = Int.random(in: 0...3)
        return (0..<count).map { _ in
            let part = parts.randomElement()!
            return MaintenancePart(
                name: part.0,
                partNumber: "PN-\(Int.random(in: 1000...9999))",
                quantity: Int.random(in: 1...4),
                unitPrice: part.1
            )
        }
    }

    // MARK: - Fuel Data

    func generateFuelRecords(count: Int = 40, vehicles: [Vehicle]) -> [FuelRecord] {
        guard !vehicles.isEmpty else { return [] }

        let stations = ["Shell", "Exxon", "BP", "Chevron", "Mobil", "Texaco", "Sunoco", "Marathon"]

        return (0..<count).map { _ in
            let vehicle = vehicles.randomElement()!
            let date = Date().addingTimeInterval(-Double.random(in: 0...30) * 24 * 3600)
            let gallons = Double.random(in: 10...30)
            let pricePerGallon = Double.random(in: 3.00...4.50)

            return FuelRecord(
                id: UUID().uuidString,
                vehicleId: vehicle.id,
                vehicleNumber: vehicle.number,
                date: date,
                station: stations.randomElement()!,
                location: generateLocation(),
                gallons: gallons,
                pricePerGallon: pricePerGallon,
                totalCost: gallons * pricePerGallon,
                odometer: vehicle.mileage + Double.random(in: 0...1000),
                fuelType: vehicle.fuelType,
                paymentMethod: ["Company Card", "Fleet Card", "Personal", "Cash"].randomElement()!,
                receipt: nil,
                notes: nil
            )
        }
    }

    // MARK: - Dashboard Stats

    func generateDashboardStats(vehicles: [Vehicle], trips: [Trip]) -> DashboardStats {
        let activeVehicles = vehicles.filter { $0.status == .active || $0.status == .moving }
        let alertCount = vehicles.flatMap { $0.alerts }.count
        let avgFuelLevel = vehicles.map { $0.fuelLevel }.reduce(0, +) / Double(vehicles.count)
        let todayTrips = trips.filter { Calendar.current.isDateInToday($0.startTime) }

        return DashboardStats(
            totalVehicles: vehicles.count,
            activeVehicles: activeVehicles.count,
            totalTrips: trips.count,
            todayTrips: todayTrips.count,
            alerts: alertCount,
            avgFuelLevel: avgFuelLevel,
            maintenanceDue: vehicles.filter { $0.nextService < Date().addingTimeInterval(7 * 24 * 3600) }.count,
            totalMileage: vehicles.map { $0.mileage }.reduce(0, +),
            totalFuelCost: Double.random(in: 5000...15000),
            fleetUtilization: Double(activeVehicles.count) / Double(vehicles.count) * 100
        )
    }

    // MARK: - Technician Data

    func generateTechnicians(count: Int = 8) -> [Technician] {
        let firstNames = ["Mike", "Sarah", "David", "Emily", "Robert", "Lisa", "James", "Maria"]
        let lastNames = ["Johnson", "Williams", "Brown", "Davis", "Martinez", "Garcia", "Miller", "Wilson"]
        let specializations = [
            ["Engine Repair", "Transmission"],
            ["Electrical Systems", "Diagnostics"],
            ["Brakes", "Suspension"],
            ["HVAC", "Fluid Systems"],
            ["Body Work", "Paint"],
            ["Tires", "Alignment"],
            ["Preventive Maintenance"],
            ["Diesel Engines", "Heavy Duty"]
        ]
        let certifications = ["ASE Master", "ASE Certified", "Manufacturer Certified", "State Licensed"]

        return (0..<count).map { index in
            let firstName = firstNames[index % firstNames.count]
            let lastName = lastNames[index % lastNames.count]

            return Technician(
                id: UUID().uuidString,
                name: "\(firstName) \(lastName)",
                email: "\(firstName.lowercased()).\(lastName.lowercased())@fleet.com",
                phone: String(format: "(%03d) %03d-%04d", Int.random(in: 200...999), Int.random(in: 200...999), Int.random(in: 1000...9999)),
                specialization: specializations[index % specializations.count],
                certifications: [certifications.randomElement()!],
                activeWorkOrders: Int.random(in: 0...5),
                isAvailable: Bool.random()
            )
        }
    }

    // MARK: - Work Order Data

    func generateWorkOrders(count: Int = 35, vehicles: [Vehicle], technicians: [Technician]) -> [WorkOrder] {
        guard !vehicles.isEmpty, !technicians.isEmpty else { return [] }

        var workOrders: [WorkOrder] = []
        let startWONumber = 1000

        for index in 0..<count {
            let vehicle = vehicles.randomElement()!
            let type = WorkOrderType.allCases.randomElement()!
            let priority = WorkOrderPriority.allCases.randomElement()!
            let status = WorkOrderStatus.allCases.randomElement()!
            let createdDate = Date().addingTimeInterval(-Double.random(in: 0...60) * 24 * 3600)

            var scheduledDate: Date? = nil
            var startedDate: Date? = nil
            var completedDate: Date? = nil
            var dueDate: Date? = nil

            // Set dates based on status
            switch status {
            case .open:
                dueDate = createdDate.addingTimeInterval(Double.random(in: 3...14) * 24 * 3600)
            case .assigned:
                scheduledDate = createdDate.addingTimeInterval(Double.random(in: 1...7) * 24 * 3600)
                dueDate = scheduledDate?.addingTimeInterval(Double.random(in: 1...7) * 24 * 3600)
            case .inProgress:
                scheduledDate = createdDate.addingTimeInterval(Double.random(in: 1...3) * 24 * 3600)
                startedDate = scheduledDate?.addingTimeInterval(Double.random(in: 0...2) * 24 * 3600)
                dueDate = startedDate?.addingTimeInterval(Double.random(in: 1...5) * 24 * 3600)
            case .onHold, .awaitingParts:
                scheduledDate = createdDate.addingTimeInterval(Double.random(in: 1...3) * 24 * 3600)
                startedDate = scheduledDate?.addingTimeInterval(Double.random(in: 0...1) * 24 * 3600)
            case .completed:
                scheduledDate = createdDate.addingTimeInterval(Double.random(in: 1...3) * 24 * 3600)
                startedDate = scheduledDate?.addingTimeInterval(Double.random(in: 0...1) * 24 * 3600)
                completedDate = startedDate?.addingTimeInterval(Double.random(in: 1...8) * 3600)
            case .cancelled:
                scheduledDate = createdDate.addingTimeInterval(Double.random(in: 1...7) * 24 * 3600)
            }

            let tech = status != .open ? technicians.randomElement() : nil
            let woNumber = String(format: "WO-%06d", startWONumber + index)

            let workOrder = WorkOrder(
                woNumber: woNumber,
                vehicleId: vehicle.id,
                vehicleNumber: vehicle.number,
                vehicleMake: vehicle.make,
                vehicleModel: vehicle.model,
                type: type,
                status: status,
                priority: priority,
                description: generateWorkOrderDescription(type: type),
                assignedTechId: tech?.id,
                assignedTechName: tech?.name,
                createdDate: createdDate,
                scheduledDate: scheduledDate,
                startedDate: startedDate,
                completedDate: completedDate,
                dueDate: dueDate,
                mileageAtStart: vehicle.mileage,
                mileageAtComplete: status == .completed ? vehicle.mileage + Double.random(in: 10...100) : nil,
                hoursWorked: status == .completed ? Double.random(in: 0.5...8.0) : Double.random(in: 0...4),
                laborRate: Double.random(in: 65...95),
                parts: generateWorkOrderParts(for: type),
                photos: [],
                notes: generateWorkOrderNotes(status: status),
                createdBy: "System Admin"
            )

            workOrders.append(workOrder)
        }

        return workOrders
    }

    private func generateWorkOrderDescription(type: WorkOrderType) -> String {
        switch type {
        case .preventiveMaintenance:
            return ["Scheduled 5,000 mile service", "Annual inspection and service", "Quarterly preventive maintenance"].randomElement()!
        case .repair:
            return ["Customer reported unusual noise", "Repair needed after inspection", "Emergency repair required"].randomElement()!
        case .inspection:
            return ["Pre-trip safety inspection", "DOT compliance inspection", "Annual vehicle inspection"].randomElement()!
        case .diagnostics:
            return ["Check engine light diagnostic", "Performance issue diagnosis", "Electrical system diagnostic"].randomElement()!
        case .bodyWork:
            return ["Minor body damage repair", "Paint touch-up needed", "Dent removal and paint"].randomElement()!
        case .electrical:
            return ["Electrical system malfunction", "Battery replacement needed", "Alternator repair"].randomElement()!
        case .engineWork:
            return ["Engine overheating issue", "Oil leak repair", "Engine performance tune-up"].randomElement()!
        case .transmission:
            return ["Transmission slipping", "Fluid leak repair", "Transmission service"].randomElement()!
        case .brakes:
            return ["Brake pad replacement", "Rotor resurfacing", "Brake system inspection"].randomElement()!
        case .tires:
            return ["Tire rotation and balance", "Replace worn tires", "Tire pressure monitoring"].randomElement()!
        case .hvac:
            return ["A/C not cooling properly", "Heater malfunction", "HVAC system service"].randomElement()!
        case .suspension:
            return ["Suspension noise investigation", "Shock absorber replacement", "Alignment needed"].randomElement()!
        case .recall:
            return ["Manufacturer recall - safety issue", "Recall service notification", "Factory recall repair"].randomElement()!
        case .modification:
            return ["Install equipment package", "Upfit modification", "Custom modification request"].randomElement()!
        case .other:
            return ["General maintenance", "Custom service request", "Miscellaneous repair"].randomElement()!
        }
    }

    private func generateWorkOrderParts(for type: WorkOrderType) -> [WorkOrderPart] {
        let partTemplates: [(String, String, Double)] = [
            ("OF-1234", "Oil Filter", 15.99),
            ("AF-5678", "Air Filter", 25.99),
            ("BP-9012", "Brake Pads (Front)", 89.99),
            ("BP-9013", "Brake Pads (Rear)", 79.99),
            ("BR-3456", "Brake Rotors", 125.99),
            ("BT-7890", "Battery", 145.99),
            ("WB-2345", "Wiper Blades", 29.99),
            ("SP-6789", "Spark Plugs (Set)", 65.99),
            ("TH-4567", "Thermostat", 45.99),
            ("WP-8901", "Water Pump", 185.99),
            ("AL-2468", "Alternator", 295.99),
            ("ST-1357", "Starter Motor", 225.99),
            ("TB-9753", "Timing Belt", 95.99),
            ("SS-8642", "Shock Absorber", 135.99)
        ]

        let partCount = Int.random(in: 0...4)
        var parts: [WorkOrderPart] = []

        for _ in 0..<partCount {
            let template = partTemplates.randomElement()!
            parts.append(WorkOrderPart(
                partNumber: template.0,
                name: template.1,
                description: "\(template.1) for vehicle",
                quantity: Int.random(in: 1...2),
                unitCost: template.2,
                supplier: ["AutoZone", "NAPA", "O'Reilly", "Advance Auto", "Dealer Parts"].randomElement()!,
                orderDate: Bool.random() ? Date().addingTimeInterval(-Double.random(in: 1...5) * 24 * 3600) : nil,
                receivedDate: Bool.random() ? Date().addingTimeInterval(-Double.random(in: 0...3) * 24 * 3600) : nil,
                warranty: Bool.random() ? "1 year / 12,000 miles" : nil
            ))
        }

        return parts
    }

    private func generateWorkOrderNotes(status: WorkOrderStatus) -> [WorkOrderNote] {
        var notes: [WorkOrderNote] = []

        switch status {
        case .open:
            notes.append(WorkOrderNote(
                text: "Work order created and pending assignment",
                author: "System",
                isSystemNote: true
            ))
        case .assigned:
            notes.append(WorkOrderNote(
                text: "Work order assigned to technician",
                timestamp: Date().addingTimeInterval(-Double.random(in: 1...3) * 24 * 3600),
                author: "System",
                isSystemNote: true
            ))
        case .inProgress:
            notes.append(WorkOrderNote(
                text: "Work started on vehicle",
                timestamp: Date().addingTimeInterval(-Double.random(in: 1...5) * 3600),
                author: "System",
                isSystemNote: true
            ))
            if Bool.random() {
                notes.append(WorkOrderNote(
                    text: "Additional issues found during inspection",
                    timestamp: Date().addingTimeInterval(-Double.random(in: 0...2) * 3600),
                    author: generateDriverName()
                ))
            }
        case .onHold:
            notes.append(WorkOrderNote(
                text: "Work paused - awaiting approval",
                timestamp: Date().addingTimeInterval(-Double.random(in: 1...24) * 3600),
                author: "System",
                isSystemNote: true
            ))
        case .awaitingParts:
            notes.append(WorkOrderNote(
                text: "Parts ordered and awaiting delivery",
                timestamp: Date().addingTimeInterval(-Double.random(in: 1...48) * 3600),
                author: "System",
                isSystemNote: true
            ))
        case .completed:
            notes.append(WorkOrderNote(
                text: "Work order completed successfully",
                timestamp: Date().addingTimeInterval(-Double.random(in: 1...24) * 3600),
                author: "System",
                isSystemNote: true
            ))
            notes.append(WorkOrderNote(
                text: "Vehicle test driven and verified",
                timestamp: Date().addingTimeInterval(-Double.random(in: 0...12) * 3600),
                author: generateDriverName()
            ))
        case .cancelled:
            notes.append(WorkOrderNote(
                text: "Work order cancelled - duplicate entry",
                timestamp: Date().addingTimeInterval(-Double.random(in: 1...24) * 3600),
                author: "System",
                isSystemNote: true
            ))
        }

        return notes
    }
}

// MARK: - Model Extensions
// Note: VehicleType, VehicleStatus, FuelType, OwnershipType are defined in App/Models/Vehicle.swift
// TripStatus, MaintenanceStatus are defined in App/Models/FleetModels.swift