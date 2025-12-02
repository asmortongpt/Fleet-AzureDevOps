//
//  KeylessEntry.swift
//  Fleet Manager - Keyless Vehicle Entry
//
//  Bluetooth Low Energy and NFC-based keyless entry system
//  with encrypted keys and time-limited access
//

import Foundation
import CoreBluetooth
import CoreNFC
import CryptoKit

// MARK: - Keyless Entry Manager

class KeylessEntryManager: NSObject, ObservableObject {
    static let shared = KeylessEntryManager()

    @Published var isScanning = false
    @Published var nearbyVehicles: [VehicleBeacon] = []
    @Published var connectionStatus: ConnectionStatus = .disconnected
    @Published var unlockStatus: UnlockStatus = .locked

    private var centralManager: CBCentralManager!
    private var nfcSession: NFCNDEFReaderSession?
    private var connectedPeripheral: CBPeripheral?

    // Vehicle service UUID (custom UUID for fleet vehicles)
    private let vehicleServiceUUID = CBUUID(string: "12345678-1234-1234-1234-123456789ABC")
    private let unlockCharacteristicUUID = CBUUID(string: "12345678-1234-1234-1234-123456789ABD")
    private let statusCharacteristicUUID = CBUUID(string: "12345678-1234-1234-1234-123456789ABE")

    // Security
    private var vehicleKey: SymmetricKey?
    private var accessToken: String?
    private var tokenExpiry: Date?

    private override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
        loadStoredCredentials()
    }

    // MARK: - Credential Management

    private func loadStoredCredentials() {
        // Load encrypted vehicle key from keychain
        if let keyData = KeychainHelper.load(key: "vehicle_key") {
            vehicleKey = SymmetricKey(data: keyData)
        }

        // Load access token
        accessToken = UserDefaults.standard.string(forKey: "access_token")

        // Load token expiry
        if let expiryTimestamp = UserDefaults.standard.object(forKey: "token_expiry") as? TimeInterval {
            tokenExpiry = Date(timeIntervalSince1970: expiryTimestamp)
        }
    }

    func setVehicleCredentials(vehicleId: String, key: Data, token: String, expiryHours: Int = 24) {
        // Store encrypted vehicle key
        vehicleKey = SymmetricKey(data: key)
        KeychainHelper.save(key: "vehicle_key", data: key)

        // Store access token
        accessToken = token
        UserDefaults.standard.set(token, forKey: "access_token")

        // Set token expiry
        tokenExpiry = Date().addingTimeInterval(TimeInterval(expiryHours * 3600))
        UserDefaults.standard.set(tokenExpiry?.timeIntervalSince1970, forKey: "token_expiry")

        print("Vehicle credentials set for \(vehicleId), expires at \(tokenExpiry!)")
    }

    private func isTokenValid() -> Bool {
        guard let expiry = tokenExpiry else { return false }
        return Date() < expiry
    }

    // MARK: - Bluetooth Scanning

    func startScanning() {
        guard centralManager.state == .poweredOn else {
            print("Bluetooth not ready")
            return
        }

        guard isTokenValid() else {
            print("Access token expired")
            return
        }

        isScanning = true
        nearbyVehicles.removeAll()

        centralManager.scanForPeripherals(
            withServices: [vehicleServiceUUID],
            options: [CBCentralManagerScanOptionAllowDuplicatesKey: false]
        )

        print("Started scanning for vehicles...")
    }

    func stopScanning() {
        centralManager.stopScan()
        isScanning = false
        print("Stopped scanning")
    }

    // MARK: - Vehicle Connection

    func connect(to vehicle: VehicleBeacon) {
        guard let peripheral = vehicle.peripheral else { return }

        connectionStatus = .connecting
        centralManager.connect(peripheral, options: nil)
        print("Connecting to \(vehicle.name)...")
    }

    func disconnect() {
        if let peripheral = connectedPeripheral {
            centralManager.cancelPeripheralConnection(peripheral)
        }
    }

    // MARK: - Unlock/Lock Operations

    func unlockVehicle() {
        guard let peripheral = connectedPeripheral,
              let key = vehicleKey,
              let token = accessToken else {
            print("Not connected or missing credentials")
            return
        }

        // Create unlock command with encrypted payload
        let timestamp = Int(Date().timeIntervalSince1970)
        let command = UnlockCommand(
            action: "unlock",
            token: token,
            timestamp: timestamp
        )

        guard let commandData = try? JSONEncoder().encode(command) else { return }

        // Encrypt command
        guard let encryptedData = try? AES.GCM.seal(commandData, using: key) else {
            print("Encryption failed")
            return
        }

        // Send unlock command
        sendCommand(encryptedData.combined!, to: peripheral)

        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.unlockStatus = .unlocked
        }
    }

    func lockVehicle() {
        guard let peripheral = connectedPeripheral,
              let key = vehicleKey,
              let token = accessToken else {
            return
        }

        let timestamp = Int(Date().timeIntervalSince1970)
        let command = UnlockCommand(
            action: "lock",
            token: token,
            timestamp: timestamp
        )

        guard let commandData = try? JSONEncoder().encode(command),
              let encryptedData = try? AES.GCM.seal(commandData, using: key) else {
            return
        }

        sendCommand(encryptedData.combined!, to: peripheral)

        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.unlockStatus = .locked
        }
    }

    private func sendCommand(_ data: Data, to peripheral: CBPeripheral) {
        guard let service = peripheral.services?.first(where: { $0.uuid == vehicleServiceUUID }),
              let characteristic = service.characteristics?.first(where: { $0.uuid == unlockCharacteristicUUID }) else {
            print("Service or characteristic not found")
            return
        }

        peripheral.writeValue(data, for: characteristic, type: .withResponse)
        print("Command sent")
    }

    // MARK: - NFC Operations

    func startNFCSession() {
        guard NFCNDEFReaderSession.readingAvailable else {
            print("NFC not available on this device")
            return
        }

        guard isTokenValid() else {
            print("Access token expired")
            return
        }

        nfcSession = NFCNDEFReaderSession(delegate: self, queue: nil, invalidateAfterFirstRead: false)
        nfcSession?.alertMessage = "Hold your iPhone near the vehicle's NFC reader"
        nfcSession?.begin()
        print("NFC session started")
    }

    private func unlockViaNFC(vehicleId: String) {
        guard let key = vehicleKey,
              let token = accessToken else { return }

        // Create unlock command
        let timestamp = Int(Date().timeIntervalSince1970)
        let command = UnlockCommand(
            action: "unlock",
            token: token,
            timestamp: timestamp
        )

        guard let commandData = try? JSONEncoder().encode(command),
              let encryptedData = try? AES.GCM.seal(commandData, using: key) else {
            return
        }

        // In production, this would write to the NFC tag
        // For now, simulate successful unlock
        print("NFC unlock command sent for vehicle \(vehicleId)")

        DispatchQueue.main.async {
            self.unlockStatus = .unlocked
        }
    }

    // MARK: - Auto-lock

    func enableAutoLock(after seconds: Int = 30) {
        DispatchQueue.main.asyncAfter(deadline: .now() + .seconds(seconds)) { [weak self] in
            guard self?.unlockStatus == .unlocked else { return }
            self?.lockVehicle()
            print("Auto-locked after \(seconds) seconds")
        }
    }

    // MARK: - Cloud Backup

    func requestCloudUnlock(vehicleId: String, completion: @escaping (Bool) -> Void) {
        // Fallback cloud-based unlock if Bluetooth fails
        guard let token = accessToken else {
            completion(false)
            return
        }

        let url = URL(string: "https://api.fleet-manager.com/v1/vehicles/\(vehicleId)/unlock")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let httpResponse = response as? HTTPURLResponse,
               httpResponse.statusCode == 200 {
                DispatchQueue.main.async {
                    self.unlockStatus = .unlocked
                }
                completion(true)
            } else {
                print("Cloud unlock failed: \(error?.localizedDescription ?? "Unknown error")")
                completion(false)
            }
        }.resume()
    }
}

// MARK: - CBCentralManagerDelegate

extension KeylessEntryManager: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        switch central.state {
        case .poweredOn:
            print("Bluetooth ready")
        case .poweredOff:
            print("Bluetooth off")
        case .unsupported:
            print("Bluetooth not supported")
        default:
            break
        }
    }

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String: Any], rssi RSSI: NSNumber) {
        // Parse vehicle info from advertisement data
        let name = advertisementData[CBAdvertisementDataLocalNameKey] as? String ?? "Unknown Vehicle"
        let distance = calculateDistance(rssi: RSSI.doubleValue)

        let vehicle = VehicleBeacon(
            id: peripheral.identifier.uuidString,
            name: name,
            distance: distance,
            rssi: RSSI.intValue,
            peripheral: peripheral
        )

        if !nearbyVehicles.contains(where: { $0.id == vehicle.id }) {
            nearbyVehicles.append(vehicle)
            print("Discovered vehicle: \(name) at \(distance)m")
        }
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        print("Connected to \(peripheral.name ?? "vehicle")")
        connectionStatus = .connected
        connectedPeripheral = peripheral
        peripheral.delegate = self
        peripheral.discoverServices([vehicleServiceUUID])
    }

    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        print("Disconnected from vehicle")
        connectionStatus = .disconnected
        connectedPeripheral = nil
    }

    private func calculateDistance(rssi: Double) -> Double {
        // Simple distance estimation based on RSSI
        let txPower = -59.0 // Calibrated at 1 meter
        if rssi == 0 {
            return -1.0
        }

        let ratio = rssi / txPower
        if ratio < 1.0 {
            return pow(ratio, 10)
        } else {
            let distance = (0.89976) * pow(ratio, 7.7095) + 0.111
            return distance
        }
    }
}

// MARK: - CBPeripheralDelegate

extension KeylessEntryManager: CBPeripheralDelegate {
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard let services = peripheral.services else { return }

        for service in services where service.uuid == vehicleServiceUUID {
            peripheral.discoverCharacteristics(
                [unlockCharacteristicUUID, statusCharacteristicUUID],
                for: service
            )
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        guard let characteristics = service.characteristics else { return }

        for characteristic in characteristics {
            if characteristic.uuid == statusCharacteristicUUID {
                peripheral.readValue(for: characteristic)
                peripheral.setNotifyValue(true, for: characteristic)
            }
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        guard let data = characteristic.value else { return }

        if characteristic.uuid == statusCharacteristicUUID {
            // Parse vehicle status
            if let status = String(data: data, encoding: .utf8) {
                print("Vehicle status: \(status)")
                DispatchQueue.main.async {
                    self.unlockStatus = status == "unlocked" ? .unlocked : .locked
                }
            }
        }
    }
}

// MARK: - NFCNDEFReaderSessionDelegate

extension KeylessEntryManager: NFCNDEFReaderSessionDelegate {
    func readerSession(_ session: NFCNDEFReaderSession, didDetectNDEFs messages: [NFCNDEFMessage]) {
        for message in messages {
            for record in message.records {
                if let payload = String(data: record.payload, encoding: .utf8) {
                    // Parse vehicle ID from NFC tag
                    if payload.hasPrefix("FLEET:") {
                        let vehicleId = payload.replacingOccurrences(of: "FLEET:", with: "")
                        print("NFC detected vehicle: \(vehicleId)")
                        unlockViaNFC(vehicleId: vehicleId)
                    }
                }
            }
        }
    }

    func readerSession(_ session: NFCNDEFReaderSession, didInvalidateWithError error: Error) {
        print("NFC session invalidated: \(error.localizedDescription)")
    }
}

// MARK: - Supporting Types

struct VehicleBeacon: Identifiable {
    let id: String
    let name: String
    let distance: Double
    let rssi: Int
    let peripheral: CBPeripheral?
}

enum ConnectionStatus {
    case disconnected
    case connecting
    case connected
}

enum UnlockStatus {
    case locked
    case unlocking
    case unlocked
}

struct UnlockCommand: Codable {
    let action: String
    let token: String
    let timestamp: Int
}

// MARK: - Keychain Helper

class KeychainHelper {
    static func save(key: String, data: Data) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]

        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    static func load(key: String) -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        SecItemCopyMatching(query as CFDictionary, &result)

        return result as? Data
    }

    static func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]

        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - UI View

import SwiftUI

struct KeylessEntryView: View {
    @StateObject private var manager = KeylessEntryManager.shared

    var body: some View {
        VStack(spacing: 20) {
            // Connection status
            HStack {
                Circle()
                    .fill(manager.connectionStatus == .connected ? Color.green : Color.gray)
                    .frame(width: 12, height: 12)
                Text(statusText)
                    .font(.subheadline)
            }

            // Unlock button
            Button(action: {
                if manager.unlockStatus == .locked {
                    manager.unlockVehicle()
                } else {
                    manager.lockVehicle()
                }
            }) {
                VStack {
                    Image(systemName: manager.unlockStatus == .unlocked ? "lock.open.fill" : "lock.fill")
                        .font(.system(size: 60))
                    Text(manager.unlockStatus == .unlocked ? "Lock" : "Unlock")
                        .font(.headline)
                }
                .foregroundColor(.white)
                .frame(width: 150, height: 150)
                .background(manager.unlockStatus == .unlocked ? Color.green : Color.blue)
                .clipShape(Circle())
            }
            .disabled(manager.connectionStatus != .connected)

            // Nearby vehicles
            if manager.isScanning {
                ProgressView("Scanning...")
            } else {
                Button("Scan for Vehicles") {
                    manager.startScanning()
                }
            }

            List(manager.nearbyVehicles) { vehicle in
                HStack {
                    VStack(alignment: .leading) {
                        Text(vehicle.name)
                            .font(.headline)
                        Text("\(String(format: "%.1f", vehicle.distance))m away")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }

                    Spacer()

                    Button("Connect") {
                        manager.connect(to: vehicle)
                    }
                }
            }

            // NFC unlock button
            Button("Unlock via NFC") {
                manager.startNFCSession()
            }
            .padding()
            .background(Color.orange)
            .foregroundColor(.white)
            .cornerRadius(10)
        }
        .padding()
    }

    private var statusText: String {
        switch manager.connectionStatus {
        case .disconnected:
            return "Not Connected"
        case .connecting:
            return "Connecting..."
        case .connected:
            return "Connected"
        }
    }
}
