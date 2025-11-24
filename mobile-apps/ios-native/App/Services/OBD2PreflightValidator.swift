/**
 * OBD2 Pre-Flight Validator
 * Phase 1: Comprehensive Pre-Flight Validation System
 *
 * Validates 7 critical prerequisites before attempting OBD2 connection:
 * 1. Bluetooth hardware status
 * 2. Bluetooth permissions
 * 3. Location permissions (required for BLE scanning on iOS 13+)
 * 4. Background modes
 * 5. Battery level
 * 6. Network connectivity (for WiFi OBD2)
 * 7. Previous connection history
 *
 * Target: Prevent 85% of connection failures before they happen
 */

import Foundation
import CoreBluetooth
import CoreLocation
import SystemConfiguration
import UIKit

@MainActor
class OBD2PreflightValidator: ObservableObject {

    enum ValidationResult: Equatable {
        case passed
        case failed(issue: String, solution: String, confidence: Double)

        static func == (lhs: ValidationResult, rhs: ValidationResult) -> Bool {
            switch (lhs, rhs) {
            case (.passed, .passed):
                return true
            case (.failed(let lIssue, let lSolution, let lConfidence),
                  .failed(let rIssue, let rSolution, let rConfidence)):
                return lIssue == rIssue && lSolution == rSolution && lConfidence == rConfidence
            default:
                return false
            }
        }
    }

    @Published var validationInProgress = false
    @Published var lastValidationResults: [ValidationResult] = []

    // MARK: - Comprehensive Pre-Flight Checks

    func validateAllPrerequisites() async -> [ValidationResult] {
        validationInProgress = true
        defer { validationInProgress = false }

        var results: [ValidationResult] = []

        // 1. Bluetooth Hardware Check
        results.append(await validateBluetoothHardware())

        // 2. Bluetooth Permissions Check
        results.append(await validateBluetoothPermissions())

        // 3. Location Permissions Check (required for BLE scanning on iOS 13+)
        results.append(await validateLocationPermissions())

        // 4. Background Modes Check
        results.append(validateBackgroundModes())

        // 5. Battery Level Check
        results.append(validateBatteryLevel())

        // 6. Network Connectivity Check (for WiFi OBD2)
        results.append(await validateNetworkConnectivity())

        // 7. Previous Connection History Check
        results.append(checkPreviousConnectionHistory())

        lastValidationResults = results
        return results
    }

    // MARK: - Individual Validators

    private func validateBluetoothHardware() async -> ValidationResult {
        // Check CBManager authorization
        if #available(iOS 13.1, *) {
            switch CBManager.authorization {
            case .allowedAlways:
                // Check if powered on
                let manager = CBCentralManager()
                try? await Task.sleep(nanoseconds: 100_000_000) // Brief delay for state update

                switch manager.state {
                case .poweredOn:
                    return .passed
                case .poweredOff:
                    return .failed(
                        issue: "Bluetooth is turned off",
                        solution: "Turn on Bluetooth in Settings → Bluetooth",
                        confidence: 0.98
                    )
                case .unsupported:
                    return .failed(
                        issue: "This device doesn't support Bluetooth LE",
                        solution: "Use a device with Bluetooth 4.0 or later",
                        confidence: 1.0
                    )
                default:
                    return .failed(
                        issue: "Bluetooth state is unknown",
                        solution: "Wait a moment for Bluetooth to initialize",
                        confidence: 0.70
                    )
                }

            case .denied, .restricted:
                return .failed(
                    issue: "Bluetooth permission denied or restricted",
                    solution: "Enable Bluetooth permission in Settings → Fleet Management → Bluetooth",
                    confidence: 0.95
                )

            case .notDetermined:
                return .failed(
                    issue: "Bluetooth permission not determined",
                    solution: "Grant Bluetooth permission when prompted",
                    confidence: 0.85
                )

            @unknown default:
                return .failed(
                    issue: "Unknown Bluetooth authorization status",
                    solution: "Restart the app and grant Bluetooth permission",
                    confidence: 0.60
                )
            }
        } else {
            // iOS 13.0 and earlier
            let manager = CBCentralManager()
            try? await Task.sleep(nanoseconds: 100_000_000)

            switch manager.state {
            case .poweredOn:
                return .passed
            case .poweredOff:
                return .failed(
                    issue: "Bluetooth is turned off",
                    solution: "Turn on Bluetooth in Settings",
                    confidence: 0.98
                )
            default:
                return .failed(
                    issue: "Bluetooth not available",
                    solution: "Enable Bluetooth to continue",
                    confidence: 0.80
                )
            }
        }
    }

    private func validateBluetoothPermissions() async -> ValidationResult {
        if #available(iOS 13.1, *) {
            switch CBManager.authorization {
            case .allowedAlways:
                return .passed
            case .denied:
                return .failed(
                    issue: "Bluetooth permission denied",
                    solution: "Go to Settings → Fleet Management → Bluetooth and enable access",
                    confidence: 0.95
                )
            case .restricted:
                return .failed(
                    issue: "Bluetooth is restricted by device policy",
                    solution: "Check Screen Time or MDM restrictions",
                    confidence: 0.90
                )
            case .notDetermined:
                return .failed(
                    issue: "Bluetooth permission not yet requested",
                    solution: "Permission will be requested when you scan for devices",
                    confidence: 0.75
                )
            @unknown default:
                return .passed
            }
        }
        return .passed
    }

    private func validateLocationPermissions() async -> ValidationResult {
        let manager = CLLocationManager()
        let status = manager.authorizationStatus

        switch status {
        case .authorizedWhenInUse, .authorizedAlways:
            return .passed
        case .denied:
            return .failed(
                issue: "Location permission denied",
                solution: "Enable Location Services in Settings → Fleet Management → Location → While Using the App",
                confidence: 0.95
            )
        case .restricted:
            return .failed(
                issue: "Location services are restricted",
                solution: "Check Screen Time restrictions or parental controls",
                confidence: 0.90
            )
        case .notDetermined:
            return .failed(
                issue: "Location permission not determined",
                solution: "Grant location permission when prompted (required for Bluetooth scanning)",
                confidence: 0.85
            )
        @unknown default:
            return .failed(
                issue: "Unknown location permission status",
                solution: "Restart app and grant location permission",
                confidence: 0.60
            )
        }
    }

    private func validateBackgroundModes() -> ValidationResult {
        // Check if bluetooth-central background mode is enabled
        guard let backgroundModes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String] else {
            return .failed(
                issue: "No background modes configured",
                solution: "Contact support - app configuration issue",
                confidence: 0.70
            )
        }

        if backgroundModes.contains("bluetooth-central") {
            return .passed
        } else {
            return .failed(
                issue: "Bluetooth background mode not enabled",
                solution: "Update app to latest version for background connectivity",
                confidence: 0.75
            )
        }
    }

    private func validateBatteryLevel() -> ValidationResult {
        UIDevice.current.isBatteryMonitoringEnabled = true
        let batteryLevel = UIDevice.current.batteryLevel

        // batteryLevel returns -1.0 if battery monitoring is not enabled or not available
        guard batteryLevel >= 0 else {
            return .passed // Can't determine, assume OK
        }

        if batteryLevel < 0.10 { // Less than 10% - critical
            return .failed(
                issue: "Critical battery level (\(Int(batteryLevel * 100))%)",
                solution: "Charge your device immediately. Bluetooth connections may fail below 10%",
                confidence: 0.95
            )
        } else if batteryLevel < 0.15 { // Less than 15% - warning
            return .failed(
                issue: "Low battery level (\(Int(batteryLevel * 100))%)",
                solution: "Charge your device to at least 20% for reliable Bluetooth connectivity",
                confidence: 0.80
            )
        }

        return .passed
    }

    private func validateNetworkConnectivity() async -> ValidationResult {
        var zeroAddress = sockaddr_in()
        zeroAddress.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
        zeroAddress.sin_family = sa_family_t(AF_INET)

        guard let reachability = withUnsafePointer(to: &zeroAddress, {
            $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
                SCNetworkReachabilityCreateWithAddress(nil, $0)
            }
        }) else {
            return .passed // Can't determine, assume OK
        }

        var flags: SCNetworkReachabilityFlags = []
        if !SCNetworkReachabilityGetFlags(reachability, &flags) {
            return .passed
        }

        let isReachable = flags.contains(.reachable)
        let needsConnection = flags.contains(.connectionRequired)
        let isNetworkReachable = (isReachable && !needsConnection)

        if !isNetworkReachable {
            return .failed(
                issue: "No network connectivity",
                solution: "WiFi OBD2 adapters require network access. Connect to WiFi or enable cellular data.",
                confidence: 0.90
            )
        }

        return .passed
    }

    private func checkPreviousConnectionHistory() -> ValidationResult {
        // Check UserDefaults for previous connection failures
        let failureCount = UserDefaults.standard.integer(forKey: "obd2_consecutive_failures")

        if failureCount >= 5 {
            return .failed(
                issue: "Multiple previous connection failures detected (\(failureCount))",
                solution: "Try resetting the OBD2 adapter by unplugging it for 30 seconds",
                confidence: 0.75
            )
        }

        return .passed
    }

    // MARK: - Helper Methods

    func hasAnyFailures(_ results: [ValidationResult]) -> Bool {
        return results.contains(where: {
            if case .failed = $0 { return true }
            return false
        })
    }

    func getFailures(_ results: [ValidationResult]) -> [(issue: String, solution: String, confidence: Double)] {
        return results.compactMap { result in
            if case .failed(let issue, let solution, let confidence) = result {
                return (issue, solution, confidence)
            }
            return nil
        }
    }

    func getMostCriticalFailure(_ results: [ValidationResult]) -> (issue: String, solution: String, confidence: Double)? {
        let failures = getFailures(results)
        return failures.max(by: { $0.confidence < $1.confidence })
    }
}
