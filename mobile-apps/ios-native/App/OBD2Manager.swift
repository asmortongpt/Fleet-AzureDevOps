//
//  OBD2Manager.swift
//  Capital Tech Alliance Fleet Management
//
//  CoreBluetooth manager for OBD2 ELM327 device communication
//

import Foundation
import CoreBluetooth
import Combine

// MARK: - OBD2 Service UUIDs
struct OBD2ServiceUUIDs {
    // Standard ELM327 Bluetooth SPP (Serial Port Profile) UUIDs
    static let serialPortService = CBUUID(string: "FFE0")
    static let serialPortCharacteristic = CBUUID(string: "FFE1")

    // Alternative common OBD2 UUIDs
    static let obd2Service = CBUUID(string: "E7810A71-73AE-499D-8C15-FAA9AEF0C3F2")
    static let obd2Characteristic = CBUUID(string: "BEF8D6C9-9C21-4C9E-B632-BD58C1009F9F")

    static var allServices: [CBUUID] {
        return [serialPortService, obd2Service]
    }
}

// MARK: - OBD2 Manager Delegate
protocol OBD2ManagerDelegate: AnyObject {
    func didDiscoverDevice(_ device: CBPeripheral, rssi: NSNumber)
    func didConnectToDevice(_ device: CBPeripheral)
    func didDisconnectFromDevice(_ device: CBPeripheral, error: Error?)
    func didReceiveData(_ data: String, from device: CBPeripheral)
    func didFailToConnect(_ device: CBPeripheral, error: Error?)
}

// MARK: - OBD2 Manager
class OBD2Manager: NSObject, ObservableObject {

    // MARK: - Singleton
    static let shared = OBD2Manager()

    // MARK: - Properties
    weak var delegate: OBD2ManagerDelegate?

    @Published var isConnected: Bool = false

    private var centralManager: CBCentralManager!
    private var discoveredDevices: [UUID: CBPeripheral] = [:]
    private var connectedPeripheral: CBPeripheral?
    private var writeCharacteristic: CBCharacteristic?
    private var readCharacteristic: CBCharacteristic?

    private var isScanning: Bool = false
    private var pendingCommands: [String] = []
    private var currentCommand: String?
    private var responseBuffer: String = ""

    // ELM327 initialization commands
    private let initializationCommands = [
        "ATZ\r",      // Reset
        "ATE0\r",     // Echo off
        "ATL0\r",     // Linefeeds off
        "ATS0\r",     // Spaces off
        "ATH0\r",     // Headers off
        "ATSP0\r"     // Auto protocol detection
    ]

    private var initializationStep: Int = 0
    private var isInitialized: Bool = false

    // MARK: - Initialization
    private override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }

    // MARK: - Public Methods

    /// Start scanning for OBD2 devices
    func startScanning() {
        guard centralManager.state == .poweredOn else {
            print("❌ Bluetooth is not powered on")
            return
        }

        guard !isScanning else {
            print("⚠️ Already scanning")
            return
        }

        discoveredDevices.removeAll()
        isScanning = true

        print("🔍 Starting scan for OBD2 devices...")

        // Scan for devices with known OBD2 service UUIDs and allow duplicates for RSSI updates
        centralManager.scanForPeripherals(
            withServices: nil, // Scan for all devices - filter by name later
            options: [CBCentralManagerScanOptionAllowDuplicatesKey: true]
        )
    }

    /// Stop scanning for devices
    func stopScanning() {
        guard isScanning else { return }

        centralManager.stopScan()
        isScanning = false
        print("⏹ Stopped scanning")
    }

    /// Connect to a specific peripheral
    func connect(to peripheral: CBPeripheral) {
        stopScanning()

        peripheral.delegate = self
        centralManager.connect(peripheral, options: nil)

        print("🔗 Attempting to connect to \(peripheral.name ?? "Unknown Device")")
    }

    /// Disconnect from peripheral
    func disconnect(from peripheral: CBPeripheral) {
        if peripheral == connectedPeripheral {
            isInitialized = false
            initializationStep = 0
            writeCharacteristic = nil
            readCharacteristic = nil
            connectedPeripheral = nil
            pendingCommands.removeAll()
            currentCommand = nil
            responseBuffer = ""
        }

        centralManager.cancelPeripheralConnection(peripheral)
    }

    /// Send command to connected OBD2 device
    func sendCommand(_ command: String) {
        guard let peripheral = connectedPeripheral,
              let characteristic = writeCharacteristic else {
            print("❌ No connected device or characteristic")
            return
        }

        guard isInitialized else {
            print("⚠️ Device not initialized, queueing command: \(command)")
            pendingCommands.append(command)
            return
        }

        executeCommand(command, to: peripheral, characteristic: characteristic)
    }

    /// Request data for a specific PID
    func requestData(for pid: OBD2PID) {
        let command = OBD2DataParser.shared.generateCommand(for: pid)
        sendCommand(command)
    }

    /// Request diagnostic trouble codes
    func requestDiagnosticCodes() {
        let command = OBD2DataParser.shared.generateDTCCommand()
        sendCommand(command)
    }

    /// Clear diagnostic trouble codes
    func clearDiagnosticCodes() {
        let command = OBD2DataParser.shared.clearDTCCommand()
        sendCommand(command)
    }

    /// Request VIN
    func requestVIN() {
        let command = OBD2DataParser.shared.getVINCommand()
        sendCommand(command)
    }

    /// Get list of discovered devices
    func getDiscoveredDevices() -> [CBPeripheral] {
        return Array(discoveredDevices.values)
    }

    // MARK: - Private Methods

    private func executeCommand(_ command: String, to peripheral: CBPeripheral, characteristic: CBCharacteristic) {
        guard let data = command.data(using: .utf8) else {
            print("❌ Failed to convert command to data")
            return
        }

        currentCommand = command
        peripheral.writeValue(data, for: characteristic, type: .withResponse)

        print("📤 Sent: \(command.replacingOccurrences(of: "\r", with: "<CR>"))")
    }

    private func initializeDevice() {
        guard initializationStep < initializationCommands.count else {
            print("✅ OBD2 device initialized")
            isInitialized = true

            // Send any pending commands
            processPendingCommands()

            // Notify connection manager
            if let peripheral = connectedPeripheral {
                OBD2ConnectionManager.shared.handleConnectionSuccess()
            }

            return
        }

        let command = initializationCommands[initializationStep]
        print("🔧 Initialization step \(initializationStep + 1)/\(initializationCommands.count): \(command)")

        if let peripheral = connectedPeripheral,
           let characteristic = writeCharacteristic {
            executeCommand(command, to: peripheral, characteristic: characteristic)
        }
    }

    private func processPendingCommands() {
        guard !pendingCommands.isEmpty else { return }

        print("📋 Processing \(pendingCommands.count) pending commands")

        for command in pendingCommands {
            sendCommand(command)
        }

        pendingCommands.removeAll()
    }

    private func handleReceivedData(_ data: Data, from peripheral: CBPeripheral) {
        guard let string = String(data: data, encoding: .utf8) else {
            print("❌ Failed to decode data")
            return
        }

        print("📥 Received: \(string.replacingOccurrences(of: "\r", with: "<CR>").replacingOccurrences(of: "\n", with: "<LF>"))")

        // Append to response buffer
        responseBuffer += string

        // Check if response is complete (ends with '>' prompt)
        if responseBuffer.contains(">") {
            let response = responseBuffer
            responseBuffer = ""

            // Handle initialization responses
            if !isInitialized {
                initializationStep += 1
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
                    self?.initializeDevice()
                }
                return
            }

            // Parse and handle data response
            handleResponse(response, from: peripheral)
        }
    }

    private func handleResponse(_ response: String, from peripheral: CBPeripheral) {
        // Check for errors
        if OBD2DataParser.shared.isErrorResponse(response) {
            print("⚠️ Error response: \(response)")
            return
        }

        // Notify delegate
        delegate?.didReceiveData(response, from: peripheral)

        // Parse response based on current command
        if let command = currentCommand {
            parseResponse(response, for: command)
        }

        currentCommand = nil
    }

    private func parseResponse(_ response: String, for command: String) {
        // Extract mode and PID from command
        let cleanCommand = command.replacingOccurrences(of: "\r", with: "").trimmingCharacters(in: .whitespaces)

        // Check if this is a PID request
        if cleanCommand.count >= 4 {
            let mode = String(cleanCommand.prefix(2))
            let pidString = String(cleanCommand.dropFirst(2))

            if mode == "01", let pid = OBD2PID(rawValue: pidString) {
                if let value = OBD2DataParser.shared.parseResponse(response, for: pid) {
                    updateVehicleData(pid: pid, value: value)
                }
            }
        }

        // Check if this is a DTC request
        if cleanCommand == "03" {
            let dtcs = OBD2DataParser.shared.parseDTCResponse(response)
            print("🔧 Diagnostic Trouble Codes: \(dtcs.map { $0.code }.joined(separator: ", "))")
        }
    }

    private func updateVehicleData(pid: OBD2PID, value: Any) {
        var vehicleData = OBD2ConnectionManager.shared.currentVehicleData

        switch pid {
        case .engineRPM:
            vehicleData.engineRPM = value as? Int
        case .vehicleSpeed:
            vehicleData.vehicleSpeed = value as? Int
        case .fuelLevel:
            vehicleData.fuelLevel = value as? Int
        case .coolantTemp:
            vehicleData.coolantTemp = value as? Int
        case .engineLoad:
            vehicleData.engineLoad = value as? Int
        case .throttlePosition:
            vehicleData.throttlePosition = value as? Int
        case .intakeAirTemp:
            vehicleData.intakeAirTemp = value as? Int
        case .mafAirFlowRate:
            vehicleData.mafAirFlowRate = value as? Double
        case .controlModuleVoltage:
            vehicleData.controlModuleVoltage = value as? Double
        case .engineOilTemp:
            vehicleData.engineOilTemp = value as? Int
        case .engineFuelRate:
            vehicleData.engineFuelRate = value as? Double
        default:
            break
        }

        vehicleData.timestamp = Date()
        OBD2ConnectionManager.shared.updateVehicleData(vehicleData)
    }

    private func isOBD2Device(_ peripheral: CBPeripheral) -> Bool {
        guard let name = peripheral.name?.uppercased() else { return false }

        let obd2Keywords = ["OBD", "ELM327", "OBDII", "OBD2", "VLINK", "KONNWEI", "VEEPEAK"]
        return obd2Keywords.contains { name.contains($0) }
    }
}

// MARK: - CBCentralManagerDelegate
extension OBD2Manager: CBCentralManagerDelegate {

    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        print("📡 Bluetooth state: \(central.state.rawValue)")

        switch central.state {
        case .poweredOn:
            print("✅ Bluetooth is ready")
        case .poweredOff:
            print("❌ Bluetooth is powered off")
        case .unauthorized:
            print("❌ Bluetooth access denied")
        case .unsupported:
            print("❌ Bluetooth LE not supported")
        default:
            break
        }
    }

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String: Any], rssi RSSI: NSNumber) {

        // Filter for OBD2 devices
        guard isOBD2Device(peripheral) else { return }

        // Store discovered device
        if discoveredDevices[peripheral.identifier] == nil {
            discoveredDevices[peripheral.identifier] = peripheral
            print("📱 Discovered: \(peripheral.name ?? "Unknown") - RSSI: \(RSSI)")

            // Notify delegate
            delegate?.didDiscoverDevice(peripheral, rssi: RSSI)
            OBD2ConnectionManager.shared.delegate?.didDiscoverDevice(peripheral, rssi: RSSI)
        }
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        print("✅ Connected to: \(peripheral.name ?? "Unknown")")

        connectedPeripheral = peripheral
        peripheral.delegate = self
        isConnected = true

        // Discover services
        peripheral.discoverServices(OBD2ServiceUUIDs.allServices)

        // Notify delegate
        delegate?.didConnectToDevice(peripheral)
    }

    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        print("❌ Failed to connect: \(error?.localizedDescription ?? "Unknown error")")

        delegate?.didFailToConnect(peripheral, error: error)
        OBD2ConnectionManager.shared.handleConnectionFailure(error: .connectionTimeout)
    }

    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        print("❌ Disconnected: \(peripheral.name ?? "Unknown")")

        if let error = error {
            print("   Error: \(error.localizedDescription)")
        }

        // Clean up
        if peripheral == connectedPeripheral {
            connectedPeripheral = nil
            writeCharacteristic = nil
            readCharacteristic = nil
            isInitialized = false
            initializationStep = 0
            isConnected = false
        }

        // Notify delegate
        delegate?.didDisconnectFromDevice(peripheral, error: error)

        // Handle unexpected disconnection
        if error != nil {
            OBD2ConnectionManager.shared.handleUnexpectedDisconnection()
        }
    }
}

// MARK: - CBPeripheralDelegate
extension OBD2Manager: CBPeripheralDelegate {

    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        if let error = error {
            print("❌ Error discovering services: \(error.localizedDescription)")
            return
        }

        guard let services = peripheral.services else { return }

        print("🔎 Discovered \(services.count) service(s)")

        for service in services {
            print("   Service: \(service.uuid)")
            peripheral.discoverCharacteristics(nil, for: service)
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        if let error = error {
            print("❌ Error discovering characteristics: \(error.localizedDescription)")
            return
        }

        guard let characteristics = service.characteristics else { return }

        print("🔎 Discovered \(characteristics.count) characteristic(s) for service \(service.uuid)")

        for characteristic in characteristics {
            print("   Characteristic: \(characteristic.uuid)")
            print("   Properties: \(characteristic.properties)")

            // Check for write characteristic
            if characteristic.properties.contains(.write) || characteristic.properties.contains(.writeWithoutResponse) {
                writeCharacteristic = characteristic
                print("   ✅ Write characteristic found")
            }

            // Check for notify characteristic (for receiving data)
            if characteristic.properties.contains(.notify) || characteristic.properties.contains(.read) {
                readCharacteristic = characteristic
                peripheral.setNotifyValue(true, for: characteristic)
                print("   ✅ Read/Notify characteristic found")
            }
        }

        // Start initialization if we have both characteristics
        if writeCharacteristic != nil && readCharacteristic != nil {
            print("🚀 Starting device initialization...")
            initializeDevice()
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        if let error = error {
            print("❌ Error receiving data: \(error.localizedDescription)")
            return
        }

        guard let data = characteristic.value else { return }

        handleReceivedData(data, from: peripheral)
    }

    func peripheral(_ peripheral: CBPeripheral, didWriteValueFor characteristic: CBCharacteristic, error: Error?) {
        if let error = error {
            print("❌ Error writing data: \(error.localizedDescription)")
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateNotificationStateFor characteristic: CBCharacteristic, error: Error?) {
        if let error = error {
            print("❌ Error updating notification state: \(error.localizedDescription)")
            return
        }

        print("✅ Notifications enabled for characteristic: \(characteristic.uuid)")
    }
}
