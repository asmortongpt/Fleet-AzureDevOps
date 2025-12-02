/**
 * ExportService.swift
 * Fleet Management Export Service
 *
 * Handles CSV export and import of vehicle data
 * Supports sharing via UIActivityViewController
 */

import Foundation
import UIKit

@MainActor
class ExportService {
    static let shared = ExportService()

    private init() {}

    // MARK: - Export Vehicles to CSV

    func exportVehiclesToCSV(_ vehicles: [Vehicle]) -> URL? {
        let csvString = generateCSV(from: vehicles)

        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyyMMdd_HHmmss"
        let timestamp = dateFormatter.string(from: Date())

        let fileName = "fleet_vehicles_\(timestamp).csv"
        let path = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)

        do {
            try csvString.write(to: path, atomically: true, encoding: .utf8)
            print("✅ Successfully exported \(vehicles.count) vehicles to: \(path.path)")
            return path
        } catch {
            print("❌ Error writing CSV: \(error.localizedDescription)")
            return nil
        }
    }

    // MARK: - Generate CSV String

    private func generateCSV(from vehicles: [Vehicle]) -> String {
        // CSV Header
        var csv = "Vehicle Number,Make,Model,Year,VIN,License Plate,Type,Status,Mileage,Fuel Level (%),Fuel Type,Department,Region,Ownership,Assigned Driver,Last Service,Next Service\n"

        // CSV Rows
        for vehicle in vehicles {
            let row = [
                escapeCSV(vehicle.number),
                escapeCSV(vehicle.make),
                escapeCSV(vehicle.model),
                String(vehicle.year),
                escapeCSV(vehicle.vin),
                escapeCSV(vehicle.licensePlate),
                escapeCSV(vehicle.type.rawValue),
                escapeCSV(vehicle.status.rawValue),
                String(format: "%.2f", vehicle.mileage),
                String(format: "%.0f", vehicle.fuelLevel * 100),
                escapeCSV(vehicle.fuelType.rawValue),
                escapeCSV(vehicle.department),
                escapeCSV(vehicle.region),
                escapeCSV(vehicle.ownership.rawValue),
                escapeCSV(vehicle.assignedDriver ?? ""),
                escapeCSV(vehicle.lastService),
                escapeCSV(vehicle.nextService)
            ].joined(separator: ",")

            csv += row + "\n"
        }

        return csv
    }

    // MARK: - CSV Field Escaping

    private func escapeCSV(_ field: String) -> String {
        // Escape fields containing commas, quotes, or newlines
        if field.contains(",") || field.contains("\"") || field.contains("\n") {
            let escaped = field.replacingOccurrences(of: "\"", with: "\"\"")
            return "\"\(escaped)\""
        }
        return field
    }

    // MARK: - Share CSV File

    func shareCSV(url: URL, from viewController: UIViewController) {
        let activityVC = UIActivityViewController(
            activityItems: [url],
            applicationActivities: nil
        )

        // For iPad support
        if let popover = activityVC.popoverPresentationController {
            popover.sourceView = viewController.view
            popover.sourceRect = CGRect(
                x: viewController.view.bounds.midX,
                y: viewController.view.bounds.midY,
                width: 0,
                height: 0
            )
            popover.permittedArrowDirections = []
        }

        viewController.present(activityVC, animated: true)
    }

    // MARK: - Import Vehicles from CSV

    func importVehiclesFromCSV(url: URL) -> ImportResult {
        do {
            let csvString = try String(contentsOf: url, encoding: .utf8)
            return parseCSV(csvString)
        } catch {
            print("❌ Error reading CSV: \(error.localizedDescription)")
            return ImportResult(vehicles: [], errors: ["Failed to read file: \(error.localizedDescription)"])
        }
    }

    // MARK: - Parse CSV String

    private func parseCSV(_ csv: String) -> ImportResult {
        var vehicles: [Vehicle] = []
        var errors: [String] = []

        let rows = csv.components(separatedBy: .newlines)
        guard rows.count > 1 else {
            return ImportResult(vehicles: [], errors: ["CSV file is empty or invalid"])
        }

        // Parse header to validate format
        let header = rows[0]
        guard header.contains("Vehicle Number") && header.contains("VIN") else {
            return ImportResult(vehicles: [], errors: ["Invalid CSV format: missing required columns"])
        }

        // Skip header row and process data rows
        for (index, row) in rows.dropFirst().enumerated() {
            guard !row.trimmingCharacters(in: .whitespaces).isEmpty else {
                continue // Skip empty rows
            }

            let columns = parseCSVRow(row)
            guard columns.count >= 17 else {
                errors.append("Row \(index + 2): Insufficient columns")
                continue
            }

            // Parse vehicle data with validation
            do {
                let vehicle = try parseVehicleFromColumns(columns, rowNumber: index + 2)
                vehicles.append(vehicle)
            } catch {
                errors.append("Row \(index + 2): \(error.localizedDescription)")
            }
        }

        print("✅ Successfully imported \(vehicles.count) vehicles from CSV")
        if !errors.isEmpty {
            print("⚠️ Encountered \(errors.count) errors during import")
        }

        return ImportResult(vehicles: vehicles, errors: errors)
    }

    // MARK: - Parse CSV Row (handles quoted fields)

    private func parseCSVRow(_ row: String) -> [String] {
        var columns: [String] = []
        var currentField = ""
        var insideQuotes = false

        for char in row {
            if char == "\"" {
                insideQuotes.toggle()
            } else if char == "," && !insideQuotes {
                columns.append(currentField)
                currentField = ""
            } else {
                currentField.append(char)
            }
        }

        // Add the last field
        columns.append(currentField)

        // Clean up quoted fields
        return columns.map { field in
            var cleaned = field.trimmingCharacters(in: .whitespaces)
            if cleaned.hasPrefix("\"") && cleaned.hasSuffix("\"") {
                cleaned = String(cleaned.dropFirst().dropLast())
                cleaned = cleaned.replacingOccurrences(of: "\"\"", with: "\"")
            }
            return cleaned
        }
    }

    // MARK: - Parse Vehicle from CSV Columns

    private func parseVehicleFromColumns(_ columns: [String], rowNumber: Int) throws -> Vehicle {
        // Extract and validate required fields
        let vehicleNumber = columns[0]
        guard !vehicleNumber.isEmpty else {
            throw ImportError.invalidField("Vehicle Number cannot be empty")
        }

        let make = columns[1]
        let model = columns[2]
        let yearString = columns[3]
        let vin = columns[4]

        guard !vin.isEmpty else {
            throw ImportError.invalidField("VIN cannot be empty")
        }

        // Parse year
        guard let year = Int(yearString), year >= 1900, year <= Calendar.current.component(.year, from: Date()) + 2 else {
            throw ImportError.invalidField("Invalid year: \(yearString)")
        }

        // Parse vehicle type
        let typeRaw = columns[6].lowercased()
        let vehicleType = VehicleType(rawValue: typeRaw) ?? .truck

        // Parse vehicle status
        let statusRaw = columns[7].lowercased()
        let status = VehicleStatus(rawValue: statusRaw) ?? .active

        // Parse mileage
        let mileageString = columns[8]
        let mileage = Double(mileageString) ?? 0.0

        // Parse fuel level (percentage to decimal)
        let fuelLevelString = columns[9]
        let fuelLevelPercent = Double(fuelLevelString) ?? 50.0
        let fuelLevel = min(max(fuelLevelPercent / 100.0, 0.0), 1.0)

        // Parse fuel type
        let fuelTypeRaw = columns[10].lowercased()
        let fuelType = FuelType(rawValue: fuelTypeRaw) ?? .gasoline

        // Parse ownership
        let ownershipRaw = columns[13].lowercased()
        let ownership = OwnershipType(rawValue: ownershipRaw) ?? .owned

        // Create vehicle with parsed data
        return Vehicle(
            id: UUID().uuidString,
            tenantId: "tenant-001", // Default tenant
            number: vehicleNumber,
            type: vehicleType,
            make: make,
            model: model,
            year: year,
            vin: vin,
            licensePlate: columns[5],
            status: status,
            location: VehicleLocation(
                lat: 38.9072,
                lng: -77.0369,
                address: "Fleet HQ"
            ),
            region: columns[12],
            department: columns[11],
            fuelLevel: fuelLevel,
            fuelType: fuelType,
            mileage: mileage,
            hoursUsed: nil,
            assignedDriver: columns[14].isEmpty ? nil : columns[14],
            ownership: ownership,
            lastService: columns[15],
            nextService: columns[16],
            alerts: [],
            customFields: nil,
            tags: nil
        )
    }
}

// MARK: - Import Result

struct ImportResult {
    let vehicles: [Vehicle]
    let errors: [String]

    var success: Bool {
        return !vehicles.isEmpty
    }

    var errorSummary: String? {
        guard !errors.isEmpty else { return nil }
        return errors.joined(separator: "\n")
    }
}

// MARK: - Import Errors

enum ImportError: LocalizedError {
    case invalidField(String)
    case missingRequiredField(String)

    var errorDescription: String? {
        switch self {
        case .invalidField(let message):
            return message
        case .missingRequiredField(let field):
            return "Missing required field: \(field)"
        }
    }
}
