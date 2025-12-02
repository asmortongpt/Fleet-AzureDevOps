//
//  BluetoothPermissionManager.swift
//  Capital Tech Alliance Fleet Management
//
//  Manages Bluetooth permissions and authorization states
//

import Foundation
import CoreBluetooth
import UIKit

enum BluetoothPermissionStatus {
    case notDetermined
    case denied
    case authorized
    case restricted
    case unsupported
}

protocol BluetoothPermissionDelegate: AnyObject {
    func bluetoothPermissionDidChange(status: BluetoothPermissionStatus)
}

class BluetoothPermissionManager: NSObject {

    // MARK: - Singleton
    static let shared = BluetoothPermissionManager()

    // MARK: - Properties
    weak var delegate: BluetoothPermissionDelegate?
    private var centralManager: CBCentralManager?
    private var permissionCheckCompletion: ((BluetoothPermissionStatus) -> Void)?

    var currentStatus: BluetoothPermissionStatus {
        guard let manager = centralManager else {
            return .notDetermined
        }

        return status(from: manager.state)
    }

    // MARK: - Initialization
    private override init() {
        super.init()
        // Delayed initialization to prevent immediate permission prompt
    }

    // MARK: - Public Methods

    /// Initialize Bluetooth manager (will trigger permission request if needed)
    func initializeBluetoothManager() {
        if centralManager == nil {
            centralManager = CBCentralManager(delegate: self, queue: nil)
        }
    }

    /// Request Bluetooth permission
    func requestPermission(completion: @escaping (BluetoothPermissionStatus) -> Void) {
        permissionCheckCompletion = completion
        initializeBluetoothManager()

        // If already determined, call completion immediately
        if let manager = centralManager, manager.state != .unknown {
            let status = self.status(from: manager.state)
            completion(status)
        }
    }

    /// Check if Bluetooth is available and authorized
    func isBluetoothAvailable() -> Bool {
        guard let manager = centralManager else { return false }
        return manager.state == .poweredOn
    }

    /// Get user-friendly status message
    func statusMessage() -> String {
        switch currentStatus {
        case .notDetermined:
            return "Bluetooth permission not determined. Tap to request access."
        case .denied:
            return "Bluetooth access denied. Please enable in Settings."
        case .authorized:
            return isBluetoothAvailable() ? "Bluetooth is ready" : "Please turn on Bluetooth"
        case .restricted:
            return "Bluetooth access is restricted on this device."
        case .unsupported:
            return "This device does not support Bluetooth LE."
        }
    }

    /// Open app settings
    func openSettings() {
        if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
            if UIApplication.shared.canOpenURL(settingsUrl) {
                UIApplication.shared.open(settingsUrl)
            }
        }
    }

    // MARK: - Private Methods

    private func status(from state: CBManagerState) -> BluetoothPermissionStatus {
        switch state {
        case .unknown:
            return .notDetermined
        case .resetting:
            return .notDetermined
        case .unsupported:
            return .unsupported
        case .unauthorized:
            return .denied
        case .poweredOff:
            return .authorized // Authorized but turned off
        case .poweredOn:
            return .authorized
        @unknown default:
            return .notDetermined
        }
    }
}

// MARK: - CBCentralManagerDelegate
extension BluetoothPermissionManager: CBCentralManagerDelegate {

    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        let status = self.status(from: central.state)

        print("📡 Bluetooth state updated: \(central.state.rawValue)")

        // Notify delegate
        delegate?.bluetoothPermissionDidChange(status: status)

        // Call completion if waiting for permission
        if let completion = permissionCheckCompletion {
            completion(status)
            permissionCheckCompletion = nil
        }
    }
}

// MARK: - CBManagerState Extension
// Note: CBManagerState already conforms to CustomStringConvertible in CoreBluetooth
// This extension is commented out to avoid duplicate conformance
/*
extension CBManagerState: CustomStringConvertible {
    public var description: String {
        switch self {
        case .unknown: return "Unknown"
        case .resetting: return "Resetting"
        case .unsupported: return "Unsupported"
        case .unauthorized: return "Unauthorized"
        case .poweredOff: return "Powered Off"
        case .poweredOn: return "Powered On"
        @unknown default: return "Unknown State"
        }
    }
}
*/
