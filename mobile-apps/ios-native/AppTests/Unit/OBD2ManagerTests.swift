//
//  OBD2ManagerTests.swift
//  Fleet Management App Tests
//
//  Unit tests for OBD2 data parsing and Bluetooth communication mocking
//

import XCTest
import CoreBluetooth
@testable import App

class OBD2ManagerTests: XCTestCase {

    var obd2Parser: OBD2DataParser!

    override func setUpWithError() throws {
        try super.setUpWithError()
        obd2Parser = OBD2DataParser.shared
    }

    override func tearDownWithError() throws {
        obd2Parser = nil
        try super.tearDownWithError()
    }

    // MARK: - Command Generation Tests

    func testGenerateEngineRPMCommand() throws {
        // Given / When
        let command = obd2Parser.generateCommand(for: .engineRPM)

        // Then
        XCTAssertEqual(command, "010C\r")
    }

    func testGenerateVehicleSpeedCommand() throws {
        // Given / When
        let command = obd2Parser.generateCommand(for: .vehicleSpeed)

        // Then
        XCTAssertEqual(command, "010D\r")
    }

    func testGenerateFuelLevelCommand() throws {
        // Given / When
        let command = obd2Parser.generateCommand(for: .fuelLevel)

        // Then
        XCTAssertEqual(command, "012F\r")
    }

    func testGenerateCoolantTempCommand() throws {
        // Given / When
        let command = obd2Parser.generateCommand(for: .coolantTemp)

        // Then
        XCTAssertEqual(command, "0105\r")
    }

    func testGenerateDTCCommand() throws {
        // Given / When
        let command = obd2Parser.generateDTCCommand()

        // Then
        XCTAssertEqual(command, "03\r")
    }

    func testClearDTCCommand() throws {
        // Given / When
        let command = obd2Parser.clearDTCCommand()

        // Then
        XCTAssertEqual(command, "04\r")
    }

    func testGetVINCommand() throws {
        // Given / When
        let command = obd2Parser.getVINCommand()

        // Then
        XCTAssertEqual(command, "0902\r")
    }

    // MARK: - Response Parsing Tests

    func testParseEngineRPM() throws {
        // Given
        let response = "41 0C 1A F8" // Example: 1726 RPM

        // When
        let rpm = obd2Parser.parseResponse(response, for: .engineRPM) as? Int

        // Then
        XCTAssertNotNil(rpm)
        XCTAssertEqual(rpm, 1726)
    }

    func testParseVehicleSpeed() throws {
        // Given
        let response = "41 0D 3C" // 60 km/h

        // When
        let speed = obd2Parser.parseResponse(response, for: .vehicleSpeed) as? Int

        // Then
        XCTAssertNotNil(speed)
        XCTAssertEqual(speed, 60)
    }

    func testParseCoolantTemp() throws {
        // Given
        let response = "41 05 69" // 65°C (105 - 40)

        // When
        let temp = obd2Parser.parseResponse(response, for: .coolantTemp) as? Int

        // Then
        XCTAssertNotNil(temp)
        XCTAssertEqual(temp, 65)
    }

    func testParseFuelLevel() throws {
        // Given
        let response = "41 2F 80" // 50% (128/255 * 100)

        // When
        let fuelLevel = obd2Parser.parseResponse(response, for: .fuelLevel) as? Int

        // Then
        XCTAssertNotNil(fuelLevel)
        XCTAssertGreaterThan(fuelLevel!, 49)
        XCTAssertLessThan(fuelLevel!, 51)
    }

    func testParseEngineLoad() throws {
        // Given
        let response = "41 04 7F" // ~50% load

        // When
        let load = obd2Parser.parseResponse(response, for: .engineLoad) as? Int

        // Then
        XCTAssertNotNil(load)
        XCTAssertGreaterThan(load!, 49)
        XCTAssertLessThan(load!, 51)
    }

    func testParseThrottlePosition() throws {
        // Given
        let response = "41 11 BF" // ~75% throttle

        // When
        let throttle = obd2Parser.parseResponse(response, for: .throttlePosition) as? Int

        // Then
        XCTAssertNotNil(throttle)
        XCTAssertGreaterThan(throttle!, 74)
        XCTAssertLessThan(throttle!, 76)
    }

    func testParseMAFAirFlowRate() throws {
        // Given
        let response = "41 10 03 E8" // 10.0 g/s (1000/100)

        // When
        let maf = obd2Parser.parseResponse(response, for: .mafAirFlowRate) as? Double

        // Then
        XCTAssertNotNil(maf)
        XCTAssertEqual(maf, 10.0, accuracy: 0.1)
    }

    func testParseControlModuleVoltage() throws {
        // Given
        let response = "41 42 34 50" // 13.392V (13392/1000)

        // When
        let voltage = obd2Parser.parseResponse(response, for: .controlModuleVoltage) as? Double

        // Then
        XCTAssertNotNil(voltage)
        XCTAssertEqual(voltage, 13.392, accuracy: 0.01)
    }

    // MARK: - DTC Parsing Tests

    func testParseSingleDTC() throws {
        // Given
        let response = "43 01 01 71" // P0171

        // When
        let dtcs = obd2Parser.parseDTCResponse(response)

        // Then
        XCTAssertEqual(dtcs.count, 1)
        XCTAssertTrue(dtcs.first?.code.contains("71") ?? false)
    }

    func testParseMultipleDTCs() throws {
        // Given
        let response = "43 03 01 71 03 00 04 42"

        // When
        let dtcs = obd2Parser.parseDTCResponse(response)

        // Then
        XCTAssertGreaterThan(dtcs.count, 0)
    }

    func testParseNoDTCs() throws {
        // Given
        let response = "43 00"

        // When
        let dtcs = obd2Parser.parseDTCResponse(response)

        // Then
        XCTAssertEqual(dtcs.count, 0)
    }

    // MARK: - Error Response Tests

    func testErrorResponse() throws {
        // Given
        let errorResponses = [
            "ERROR",
            "NO DATA",
            "UNABLE TO CONNECT",
            "BUS INIT",
            "?"
        ]

        // When / Then
        for response in errorResponses {
            XCTAssertTrue(obd2Parser.isErrorResponse(response))
        }
    }

    func testValidResponse() throws {
        // Given
        let response = "41 0C 1A F8"

        // When
        let isError = obd2Parser.isErrorResponse(response)

        // Then
        XCTAssertFalse(isError)
    }

    // MARK: - PID Description Tests

    func testPIDDescriptions() throws {
        XCTAssertEqual(OBD2PID.engineRPM.description, "Engine RPM")
        XCTAssertEqual(OBD2PID.vehicleSpeed.description, "Vehicle Speed")
        XCTAssertEqual(OBD2PID.fuelLevel.description, "Fuel Level")
        XCTAssertEqual(OBD2PID.coolantTemp.description, "Coolant Temperature")
        XCTAssertEqual(OBD2PID.engineLoad.description, "Engine Load")
        XCTAssertEqual(OBD2PID.throttlePosition.description, "Throttle Position")
    }

    // MARK: - Vehicle Data Model Tests

    func testOBD2VehicleDataIsDriving() throws {
        // Given
        var data = OBD2VehicleData()
        data.vehicleSpeed = 60

        // When / Then
        XCTAssertTrue(data.isDriving)
    }

    func testOBD2VehicleDataNotDriving() throws {
        // Given
        var data = OBD2VehicleData()
        data.vehicleSpeed = 0

        // When / Then
        XCTAssertFalse(data.isDriving)
    }

    func testOBD2VehicleDataNilSpeed() throws {
        // Given
        let data = OBD2VehicleData()

        // When / Then
        XCTAssertFalse(data.isDriving)
    }

    // MARK: - Monitoring PIDs Tests

    func testMonitoringPIDs() throws {
        // Given
        let monitoringPIDs = OBD2DataParser.monitoringPIDs

        // Then
        XCTAssertTrue(monitoringPIDs.contains(.engineRPM))
        XCTAssertTrue(monitoringPIDs.contains(.vehicleSpeed))
        XCTAssertTrue(monitoringPIDs.contains(.fuelLevel))
        XCTAssertTrue(monitoringPIDs.contains(.coolantTemp))
        XCTAssertTrue(monitoringPIDs.contains(.engineLoad))
        XCTAssertTrue(monitoringPIDs.contains(.throttlePosition))
    }

    // MARK: - Edge Cases

    func testParseEmptyResponse() throws {
        // Given
        let response = ""

        // When
        let rpm = obd2Parser.parseResponse(response, for: .engineRPM)

        // Then
        XCTAssertNil(rpm)
    }

    func testParseShortResponse() throws {
        // Given
        let response = "41"

        // When
        let rpm = obd2Parser.parseResponse(response, for: .engineRPM)

        // Then
        XCTAssertNil(rpm)
    }

    func testParseMalformedResponse() throws {
        // Given
        let response = "41 0C XX YY"

        // When
        let rpm = obd2Parser.parseResponse(response, for: .engineRPM)

        // Then
        XCTAssertNil(rpm)
    }

    func testParseZeroRPM() throws {
        // Given
        let response = "41 0C 00 00"

        // When
        let rpm = obd2Parser.parseResponse(response, for: .engineRPM) as? Int

        // Then
        XCTAssertNotNil(rpm)
        XCTAssertEqual(rpm, 0)
    }

    func testParseMaxRPM() throws {
        // Given
        let response = "41 0C FF FF" // Maximum value

        // When
        let rpm = obd2Parser.parseResponse(response, for: .engineRPM) as? Int

        // Then
        XCTAssertNotNil(rpm)
        XCTAssertGreaterThan(rpm!, 0)
    }

    func testParseNegativeTemperature() throws {
        // Given
        let response = "41 05 14" // 20 - 40 = -20°C

        // When
        let temp = obd2Parser.parseResponse(response, for: .coolantTemp) as? Int

        // Then
        XCTAssertNotNil(temp)
        XCTAssertEqual(temp, -20)
    }

    // MARK: - Performance Tests

    func testParsePerformance() throws {
        // Given
        let response = "41 0C 1A F8"

        // When / Then
        measure {
            for _ in 0..<1000 {
                _ = obd2Parser.parseResponse(response, for: .engineRPM)
            }
        }
    }

    func testCommandGenerationPerformance() throws {
        measure {
            for _ in 0..<1000 {
                _ = obd2Parser.generateCommand(for: .engineRPM)
                _ = obd2Parser.generateCommand(for: .vehicleSpeed)
                _ = obd2Parser.generateCommand(for: .fuelLevel)
            }
        }
    }

    // MARK: - DTC Severity Tests

    func testDTCSeverityDisplayNames() throws {
        XCTAssertEqual(DiagnosticTroubleCode.DTCSeverity.pending.displayName, "Pending")
        XCTAssertEqual(DiagnosticTroubleCode.DTCSeverity.confirmed.displayName, "Confirmed")
        XCTAssertEqual(DiagnosticTroubleCode.DTCSeverity.permanent.displayName, "Permanent")
    }
}

// MARK: - Mock Bluetooth Manager

class MockBluetoothManager {
    var isConnected = false
    var connectedDevice: MockBluetoothDevice?
    var discoveredDevices: [MockBluetoothDevice] = []

    var onScan: (() -> Void)?
    var onConnect: ((MockBluetoothDevice) -> Void)?
    var onDisconnect: (() -> Void)?
    var onSendCommand: ((String) -> Void)?

    func startScanning() {
        onScan?()
    }

    func connect(to device: MockBluetoothDevice) {
        connectedDevice = device
        isConnected = true
        onConnect?(device)
    }

    func disconnect() {
        connectedDevice = nil
        isConnected = false
        onDisconnect?()
    }

    func sendCommand(_ command: String) {
        onSendCommand?(command)
    }
}

// MARK: - Mock Bluetooth Device

class MockBluetoothDevice {
    let name: String
    let uuid: String
    var rssi: Int

    init(name: String, uuid: String = UUID().uuidString, rssi: Int = -50) {
        self.name = name
        self.uuid = uuid
        self.rssi = rssi
    }
}

// MARK: - Bluetooth Manager Tests

class BluetoothManagerTests: XCTestCase {

    var mockBluetoothManager: MockBluetoothManager!

    override func setUpWithError() throws {
        try super.setUpWithError()
        mockBluetoothManager = MockBluetoothManager()
    }

    override func tearDownWithError() throws {
        mockBluetoothManager = nil
        try super.tearDownWithError()
    }

    func testStartScanning() throws {
        // Given
        var scanCalled = false
        mockBluetoothManager.onScan = {
            scanCalled = true
        }

        // When
        mockBluetoothManager.startScanning()

        // Then
        XCTAssertTrue(scanCalled)
    }

    func testConnectToDevice() throws {
        // Given
        let device = MockBluetoothDevice(name: "OBD2 Scanner")
        var connectCalled = false

        mockBluetoothManager.onConnect = { connectedDevice in
            connectCalled = true
            XCTAssertEqual(connectedDevice.name, "OBD2 Scanner")
        }

        // When
        mockBluetoothManager.connect(to: device)

        // Then
        XCTAssertTrue(connectCalled)
        XCTAssertTrue(mockBluetoothManager.isConnected)
        XCTAssertEqual(mockBluetoothManager.connectedDevice?.name, "OBD2 Scanner")
    }

    func testDisconnectFromDevice() throws {
        // Given
        let device = MockBluetoothDevice(name: "OBD2 Scanner")
        mockBluetoothManager.connect(to: device)
        var disconnectCalled = false

        mockBluetoothManager.onDisconnect = {
            disconnectCalled = true
        }

        // When
        mockBluetoothManager.disconnect()

        // Then
        XCTAssertTrue(disconnectCalled)
        XCTAssertFalse(mockBluetoothManager.isConnected)
        XCTAssertNil(mockBluetoothManager.connectedDevice)
    }

    func testSendCommand() throws {
        // Given
        let device = MockBluetoothDevice(name: "OBD2 Scanner")
        mockBluetoothManager.connect(to: device)
        var sentCommand: String?

        mockBluetoothManager.onSendCommand = { command in
            sentCommand = command
        }

        // When
        mockBluetoothManager.sendCommand("010C\r")

        // Then
        XCTAssertEqual(sentCommand, "010C\r")
    }

    func testDeviceRSSI() throws {
        // Given
        let nearDevice = MockBluetoothDevice(name: "Near Scanner", rssi: -30)
        let farDevice = MockBluetoothDevice(name: "Far Scanner", rssi: -80)

        // Then
        XCTAssertGreaterThan(nearDevice.rssi, farDevice.rssi)
    }
}
