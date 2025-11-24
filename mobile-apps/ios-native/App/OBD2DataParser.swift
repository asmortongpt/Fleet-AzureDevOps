//
//  OBD2DataParser.swift
//  Capital Tech Alliance Fleet Management
//
//  Parses ELM327 OBD2 protocol responses and extracts vehicle data
//

import Foundation

// MARK: - OBD2 PIDs (Parameter IDs)
enum OBD2PID: String, CaseIterable {
    // Mode 01 - Current Data
    case engineLoad = "04"              // Calculated engine load (%)
    case coolantTemp = "05"             // Engine coolant temperature (°C)
    case fuelPressure = "0A"            // Fuel pressure (kPa)
    case intakeManifoldPressure = "0B"  // Intake manifold absolute pressure (kPa)
    case engineRPM = "0C"               // Engine RPM
    case vehicleSpeed = "0D"            // Vehicle speed (km/h)
    case timingAdvance = "0E"           // Timing advance (° before TDC)
    case intakeAirTemp = "0F"           // Intake air temperature (°C)
    case mafAirFlowRate = "10"          // MAF air flow rate (g/s)
    case throttlePosition = "11"        // Throttle position (%)
    case oxygenSensor1 = "14"           // Oxygen sensor 1 voltage
    case oxygenSensor2 = "15"           // Oxygen sensor 2 voltage
    case fuelLevel = "2F"               // Fuel tank level input (%)
    case distanceSinceDTC = "31"        // Distance traveled since codes cleared (km)
    case barometricPressure = "33"      // Absolute barometric pressure (kPa)
    case controlModuleVoltage = "42"    // Control module voltage (V)
    case absoluteLoadValue = "43"       // Absolute load value (%)
    case ambientAirTemp = "46"          // Ambient air temperature (°C)
    case fuelRailPressure = "59"        // Fuel rail pressure (kPa)
    case engineOilTemp = "5C"           // Engine oil temperature (°C)
    case fuelInjectionTiming = "5D"     // Fuel injection timing (°)
    case engineFuelRate = "5E"          // Engine fuel rate (L/h)

    var mode: String { return "01" }

    var description: String {
        switch self {
        case .engineLoad: return "Engine Load"
        case .coolantTemp: return "Coolant Temperature"
        case .fuelPressure: return "Fuel Pressure"
        case .intakeManifoldPressure: return "Intake Manifold Pressure"
        case .engineRPM: return "Engine RPM"
        case .vehicleSpeed: return "Vehicle Speed"
        case .timingAdvance: return "Timing Advance"
        case .intakeAirTemp: return "Intake Air Temperature"
        case .mafAirFlowRate: return "MAF Air Flow Rate"
        case .throttlePosition: return "Throttle Position"
        case .oxygenSensor1: return "Oxygen Sensor 1"
        case .oxygenSensor2: return "Oxygen Sensor 2"
        case .fuelLevel: return "Fuel Level"
        case .distanceSinceDTC: return "Distance Since DTC Cleared"
        case .barometricPressure: return "Barometric Pressure"
        case .controlModuleVoltage: return "Control Module Voltage"
        case .absoluteLoadValue: return "Absolute Load Value"
        case .ambientAirTemp: return "Ambient Air Temperature"
        case .fuelRailPressure: return "Fuel Rail Pressure"
        case .engineOilTemp: return "Engine Oil Temperature"
        case .fuelInjectionTiming: return "Fuel Injection Timing"
        case .engineFuelRate: return "Engine Fuel Rate"
        }
    }
}

// MARK: - Vehicle Data Model
struct OBD2VehicleData {
    var engineRPM: Int?
    var vehicleSpeed: Int?
    var fuelLevel: Int?
    var coolantTemp: Int?
    var engineLoad: Int?
    var throttlePosition: Int?
    var intakeAirTemp: Int?
    var mafAirFlowRate: Double?
    var controlModuleVoltage: Double?
    var engineOilTemp: Int?
    var engineFuelRate: Double?
    var odometer: Double?
    var timestamp: Date = Date()

    var isDriving: Bool {
        return (vehicleSpeed ?? 0) > 0
    }
}

// MARK: - Diagnostic Trouble Code
struct DiagnosticTroubleCode {
    let code: String
    let description: String
    let severity: DTCSeverity

    enum DTCSeverity {
        case pending
        case confirmed
        case permanent

        var displayName: String {
            switch self {
            case .pending: return "Pending"
            case .confirmed: return "Confirmed"
            case .permanent: return "Permanent"
            }
        }
    }
}

// MARK: - OBD2 Data Parser
class OBD2DataParser {

    // MARK: - Singleton
    static let shared = OBD2DataParser()

    private init() {}

    // MARK: - Command Generation

    /// Generate ELM327 command for a specific PID
    func generateCommand(for pid: OBD2PID) -> String {
        return "\(pid.mode)\(pid.rawValue)\r"
    }

    /// Generate command to read diagnostic trouble codes
    func generateDTCCommand() -> String {
        return "03\r" // Mode 03: Request trouble codes
    }

    /// Generate command to clear diagnostic trouble codes
    func clearDTCCommand() -> String {
        return "04\r" // Mode 04: Clear trouble codes
    }

    /// Generate command to get VIN
    func getVINCommand() -> String {
        return "0902\r" // Mode 09, PID 02: Vehicle Identification Number
    }

    // MARK: - Response Parsing

    /// Parse ELM327 response for a specific PID
    func parseResponse(_ response: String, for pid: OBD2PID) -> Any? {
        let cleanedResponse = cleanResponse(response)

        guard cleanedResponse.count >= 4 else {
            print("⚠️ Response too short: \(cleanedResponse)")
            return nil
        }

        // Extract data bytes (skip mode and PID echo)
        let dataStart = cleanedResponse.index(cleanedResponse.startIndex, offsetBy: 4)
        let dataBytes = String(cleanedResponse[dataStart...])

        return parseDataBytes(dataBytes, for: pid)
    }

    /// Parse data bytes for specific PID
    private func parseDataBytes(_ bytes: String, for pid: OBD2PID) -> Any? {
        let byteArray = bytes.split(separator: " ").compactMap { UInt8($0, radix: 16) }

        guard !byteArray.isEmpty else { return nil }

        switch pid {
        case .engineRPM:
            guard byteArray.count >= 2 else { return nil }
            return ((Int(byteArray[0]) * 256) + Int(byteArray[1])) / 4

        case .vehicleSpeed:
            return Int(byteArray[0])

        case .coolantTemp:
            return Int(byteArray[0]) - 40

        case .engineLoad:
            return (Int(byteArray[0]) * 100) / 255

        case .throttlePosition:
            return (Int(byteArray[0]) * 100) / 255

        case .fuelLevel:
            return (Int(byteArray[0]) * 100) / 255

        case .intakeAirTemp:
            return Int(byteArray[0]) - 40

        case .engineOilTemp:
            return Int(byteArray[0]) - 40

        case .mafAirFlowRate:
            guard byteArray.count >= 2 else { return nil }
            return Double((Int(byteArray[0]) * 256) + Int(byteArray[1])) / 100.0

        case .controlModuleVoltage:
            guard byteArray.count >= 2 else { return nil }
            return Double((Int(byteArray[0]) * 256) + Int(byteArray[1])) / 1000.0

        case .engineFuelRate:
            guard byteArray.count >= 2 else { return nil }
            return Double((Int(byteArray[0]) * 256) + Int(byteArray[1])) / 20.0

        case .intakeManifoldPressure:
            return Int(byteArray[0])

        case .timingAdvance:
            return (Int(byteArray[0]) / 2) - 64

        case .fuelPressure:
            return Int(byteArray[0]) * 3

        case .barometricPressure:
            return Int(byteArray[0])

        case .absoluteLoadValue:
            guard byteArray.count >= 2 else { return nil }
            return ((Int(byteArray[0]) * 256) + Int(byteArray[1])) * 100 / 255

        case .ambientAirTemp:
            return Int(byteArray[0]) - 40

        case .fuelRailPressure:
            guard byteArray.count >= 2 else { return nil }
            return ((Int(byteArray[0]) * 256) + Int(byteArray[1])) * 10

        case .fuelInjectionTiming:
            guard byteArray.count >= 2 else { return nil }
            return (Double((Int(byteArray[0]) * 256) + Int(byteArray[1])) - 26880.0) / 128.0

        case .distanceSinceDTC:
            guard byteArray.count >= 2 else { return nil }
            return (Int(byteArray[0]) * 256) + Int(byteArray[1])

        case .oxygenSensor1, .oxygenSensor2:
            return Double(byteArray[0]) / 200.0
        }
    }

    /// Parse diagnostic trouble codes from response
    func parseDTCResponse(_ response: String) -> [DiagnosticTroubleCode] {
        let cleanedResponse = cleanResponse(response)
        var dtcs: [DiagnosticTroubleCode] = []

        // DTC format: 4 hex characters per code
        let dtcPattern = "[0-9A-F]{4}"
        let regex = try? NSRegularExpression(pattern: dtcPattern)
        let range = NSRange(cleanedResponse.startIndex..., in: cleanedResponse)

        regex?.enumerateMatches(in: cleanedResponse, range: range) { match, _, _ in
            guard let match = match, let range = Range(match.range, in: cleanedResponse) else { return }
            let hexCode = String(cleanedResponse[range])

            if let dtc = decodeDTC(hexCode) {
                dtcs.append(dtc)
            }
        }

        return dtcs
    }

    /// Decode DTC from hex code
    private func decodeDTC(_ hexCode: String) -> DiagnosticTroubleCode? {
        guard hexCode.count == 4,
              let firstByte = UInt8(hexCode.prefix(2), radix: 16) else {
            return nil
        }

        // Determine prefix based on first two bits
        let prefixBits = (firstByte >> 6) & 0x03
        let prefix: String

        switch prefixBits {
        case 0: prefix = "P0" // Powertrain - ISO/SAE
        case 1: prefix = "P1" // Powertrain - Manufacturer
        case 2: prefix = "P2" // Powertrain - ISO/SAE
        case 3: prefix = "P3" // Powertrain - ISO/SAE
        default: prefix = "P0"
        }

        let codeNumber = hexCode.suffix(3)
        let fullCode = prefix + codeNumber

        return DiagnosticTroubleCode(
            code: fullCode,
            description: getDTCDescription(fullCode),
            severity: .confirmed
        )
    }

    /// Get human-readable DTC description
    private func getDTCDescription(_ code: String) -> String {
        // Common DTC descriptions (simplified set)
        let descriptions: [String: String] = [
            "P0100": "Mass or Volume Air Flow Circuit Malfunction",
            "P0101": "Mass or Volume Air Flow Circuit Range/Performance Problem",
            "P0102": "Mass or Volume Air Flow Circuit Low Input",
            "P0103": "Mass or Volume Air Flow Circuit High Input",
            "P0171": "System Too Lean (Bank 1)",
            "P0172": "System Too Rich (Bank 1)",
            "P0300": "Random/Multiple Cylinder Misfire Detected",
            "P0301": "Cylinder 1 Misfire Detected",
            "P0302": "Cylinder 2 Misfire Detected",
            "P0303": "Cylinder 3 Misfire Detected",
            "P0304": "Cylinder 4 Misfire Detected",
            "P0420": "Catalyst System Efficiency Below Threshold (Bank 1)",
            "P0442": "Evaporative Emission Control System Leak Detected (Small Leak)",
            "P0500": "Vehicle Speed Sensor Malfunction"
        ]

        return descriptions[code] ?? "Unknown diagnostic code"
    }

    /// Parse VIN from response
    func parseVIN(_ response: String) -> String? {
        let cleanedResponse = cleanResponse(response)

        // VIN is typically 17 characters, encoded in ASCII
        let hexBytes = cleanedResponse.split(separator: " ")
        let asciiChars = hexBytes.compactMap { byte -> Character? in
            guard let value = UInt8(byte, radix: 16) else { return nil }
            return Character(UnicodeScalar(value))
        }

        let vin = String(asciiChars)
        return vin.count == 17 ? vin : nil
    }

    // MARK: - Helper Methods

    /// Clean ELM327 response by removing prompt characters and extra whitespace
    private func cleanResponse(_ response: String) -> String {
        return response
            .replacingOccurrences(of: ">", with: "")
            .replacingOccurrences(of: "\r", with: "")
            .replacingOccurrences(of: "\n", with: "")
            .trimmingCharacters(in: .whitespaces)
            .uppercased()
    }

    /// Check if response indicates an error
    func isErrorResponse(_ response: String) -> Bool {
        let errors = ["ERROR", "NO DATA", "UNABLE TO CONNECT", "BUS INIT", "?"]
        return errors.contains { response.uppercased().contains($0) }
    }

    /// Get all supported PIDs for continuous monitoring
    static var monitoringPIDs: [OBD2PID] {
        return [
            .engineRPM,
            .vehicleSpeed,
            .fuelLevel,
            .coolantTemp,
            .engineLoad,
            .throttlePosition
        ]
    }
}
