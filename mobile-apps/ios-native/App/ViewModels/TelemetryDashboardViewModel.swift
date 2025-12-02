//
//  TelemetryDashboardViewModel.swift
//  Fleet Manager
//
//  ViewModel for real-time telemetry monitoring with WebSocket support
//

import Foundation
import Combine
import SwiftUI

@MainActor
class TelemetryDashboardViewModel: RefreshableViewModel {
    // MARK: - Published Properties
    @Published var currentTelemetry: TelemetryData?
    @Published var vehicleHealth: VehicleHealth?
    @Published var activeDTCs: [DiagnosticTroubleCode] = []
    @Published var activeAlerts: [TelemetryAlert] = []
    @Published var historicalData: [TelemetryData] = []
    @Published var selectedVehicleId: String = ""
    @Published var isConnected: Bool = false
    @Published var selectedTimePeriod: TimePeriod = .hour
    @Published var showingDTCDetail: DiagnosticTroubleCode?
    @Published var showingAlertDetail: TelemetryAlert?

    // MARK: - Private Properties
    private var webSocketTask: URLSessionWebSocketTask?
    private var pollingTimer: Timer?
    private let apiConfig = APIConfiguration.shared
    private var reconnectAttempts = 0
    private let maxReconnectAttempts = 5

    // MARK: - Initialization
    override init() {
        super.init()
        setupAutoRefresh()
    }

    deinit {
        disconnectWebSocket()
        pollingTimer?.invalidate()
    }

    // MARK: - Auto Refresh
    private func setupAutoRefresh() {
        // Poll every 2 seconds if WebSocket is not connected
        pollingTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self = self, !self.isConnected else { return }
                await self.fetchLiveTelemetry()
            }
        }
    }

    // MARK: - WebSocket Connection
    func connectWebSocket() {
        guard !isConnected else { return }

        let wsURL = apiConfig.baseURL
            .replacingOccurrences(of: "https://", with: "wss://")
            .replacingOccurrences(of: "http://", with: "ws://")

        guard let url = URL(string: "\(wsURL)/api/v1/telemetry/live/\(selectedVehicleId)") else {
            handleErrorMessage("Invalid WebSocket URL")
            return
        }

        var request = URLRequest(url: url)
        request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")

        webSocketTask = URLSession.shared.webSocketTask(with: request)
        webSocketTask?.resume()
        isConnected = true

        receiveWebSocketMessage()
    }

    func disconnectWebSocket() {
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        isConnected = false
    }

    private func receiveWebSocketMessage() {
        webSocketTask?.receive { [weak self] result in
            Task { @MainActor [weak self] in
                guard let self = self else { return }

                switch result {
                case .success(let message):
                    switch message {
                    case .string(let text):
                        self.handleWebSocketMessage(text)
                    case .data(let data):
                        self.handleWebSocketData(data)
                    @unknown default:
                        break
                    }
                    // Continue receiving messages
                    self.receiveWebSocketMessage()

                case .failure(let error):
                    print("WebSocket error: \(error.localizedDescription)")
                    self.isConnected = false
                    self.attemptReconnect()
                }
            }
        }
    }

    private func handleWebSocketMessage(_ message: String) {
        guard let data = message.data(using: .utf8) else { return }
        handleWebSocketData(data)
    }

    private func handleWebSocketData(_ data: Data) {
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601

            // Try to decode as TelemetryData
            if let telemetry = try? decoder.decode(TelemetryData.self, from: data) {
                self.currentTelemetry = telemetry
                self.historicalData.append(telemetry)
                self.checkForAnomalies(telemetry)
                return
            }

            // Try to decode as VehicleHealth
            if let health = try? decoder.decode(VehicleHealth.self, from: data) {
                self.vehicleHealth = health
                return
            }

            // Try to decode as Alert
            if let alert = try? decoder.decode(TelemetryAlert.self, from: data) {
                self.handleNewAlert(alert)
                return
            }

        } catch {
            print("Failed to decode WebSocket data: \(error)")
        }
    }

    private func attemptReconnect() {
        guard reconnectAttempts < maxReconnectAttempts else {
            handleErrorMessage("Failed to connect after \(maxReconnectAttempts) attempts")
            return
        }

        reconnectAttempts += 1
        DispatchQueue.main.asyncAfter(deadline: .now() + Double(reconnectAttempts) * 2.0) { [weak self] in
            self?.connectWebSocket()
        }
    }

    // MARK: - API Calls
    func fetchLiveTelemetry() async {
        guard !selectedVehicleId.isEmpty else { return }

        do {
            guard let url = URL(string: "\(apiConfig.baseURL)/api/v1/telemetry/live/\(selectedVehicleId)") else {
                throw URLError(.badURL)
            }

            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw URLError(.badServerResponse)
            }

            guard httpResponse.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let telemetry = try decoder.decode(TelemetryData.self, from: data)

            await MainActor.run {
                self.currentTelemetry = telemetry
                self.checkForAnomalies(telemetry)
            }

        } catch {
            await MainActor.run {
                print("Failed to fetch live telemetry: \(error)")
            }
        }
    }

    func fetchHistoricalTelemetry() async {
        guard !selectedVehicleId.isEmpty else { return }

        do {
            startLoading()

            let period = selectedTimePeriod.timeInterval
            let endTime = Date()
            let startTime = endTime.addingTimeInterval(-period)

            guard let url = URL(string: "\(apiConfig.baseURL)/api/v1/telemetry/history/\(selectedVehicleId)?start=\(startTime.ISO8601Format())&end=\(endTime.ISO8601Format())") else {
                throw URLError(.badURL)
            }

            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw URLError(.badServerResponse)
            }

            guard httpResponse.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let history = try decoder.decode([TelemetryData].self, from: data)

            await MainActor.run {
                self.historicalData = history
                finishLoading()
            }

        } catch {
            await MainActor.run {
                handleError(error)
            }
        }
    }

    func fetchDiagnosticCodes() async {
        guard !selectedVehicleId.isEmpty else { return }

        do {
            guard let url = URL(string: "\(apiConfig.baseURL)/api/v1/telemetry/dtc/\(selectedVehicleId)") else {
                throw URLError(.badURL)
            }

            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw URLError(.badServerResponse)
            }

            guard httpResponse.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let dtcs = try decoder.decode([DiagnosticTroubleCode].self, from: data)

            await MainActor.run {
                self.activeDTCs = dtcs.filter { $0.isActive }
            }

        } catch {
            await MainActor.run {
                print("Failed to fetch DTCs: \(error)")
            }
        }
    }

    func fetchVehicleHealth() async {
        guard !selectedVehicleId.isEmpty else { return }

        do {
            guard let url = URL(string: "\(apiConfig.baseURL)/api/v1/telemetry/health/\(selectedVehicleId)") else {
                throw URLError(.badURL)
            }

            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let (data, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw URLError(.badServerResponse)
            }

            guard httpResponse.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }

            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let health = try decoder.decode(VehicleHealth.self, from: data)

            await MainActor.run {
                self.vehicleHealth = health
            }

        } catch {
            await MainActor.run {
                print("Failed to fetch vehicle health: \(error)")
            }
        }
    }

    func clearDiagnosticCode(_ dtc: DiagnosticTroubleCode) async {
        do {
            guard let url = URL(string: "\(apiConfig.baseURL)/api/v1/telemetry/dtc/\(dtc.id)/clear") else {
                throw URLError(.badURL)
            }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("Bearer \(apiConfig.authToken ?? "")", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let (_, response) = try await URLSession.shared.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw URLError(.badServerResponse)
            }

            guard httpResponse.statusCode == 200 else {
                throw URLError(.badServerResponse)
            }

            await MainActor.run {
                self.activeDTCs.removeAll { $0.id == dtc.id }
            }

        } catch {
            await MainActor.run {
                handleError(error)
            }
        }
    }

    func acknowledgeAlert(_ alert: TelemetryAlert) async {
        await MainActor.run {
            if let index = activeAlerts.firstIndex(where: { $0.id == alert.id }) {
                activeAlerts.remove(at: index)
            }
        }
    }

    // MARK: - Anomaly Detection
    private func checkForAnomalies(_ telemetry: TelemetryData) {
        var newAlerts: [TelemetryAlert] = []

        // Check for low fuel
        if telemetry.fuelLevel < 15 {
            let alert = TelemetryAlert(
                vehicleId: telemetry.vehicleId,
                type: .lowFuel,
                message: "Fuel level is low (\(Int(telemetry.fuelLevel))%)",
                severity: telemetry.fuelLevel < 10 ? .critical : .warning,
                value: telemetry.fuelLevel,
                threshold: 15
            )
            newAlerts.append(alert)
        }

        // Check for high temperature
        if telemetry.engineTemp > 220 {
            let alert = TelemetryAlert(
                vehicleId: telemetry.vehicleId,
                type: .highTemp,
                message: "Engine temperature is high (\(Int(telemetry.engineTemp))°F)",
                severity: telemetry.engineTemp > 240 ? .critical : .warning,
                value: telemetry.engineTemp,
                threshold: 220
            )
            newAlerts.append(alert)
        }

        // Check for low battery
        if telemetry.batteryVoltage < 12.0 {
            let alert = TelemetryAlert(
                vehicleId: telemetry.vehicleId,
                type: .batteryLow,
                message: "Battery voltage is low (\(String(format: "%.1f", telemetry.batteryVoltage))V)",
                severity: telemetry.batteryVoltage < 11.5 ? .critical : .warning,
                value: telemetry.batteryVoltage,
                threshold: 12.0
            )
            newAlerts.append(alert)
        }

        // Check for high RPM
        if telemetry.rpm > 5000 {
            let alert = TelemetryAlert(
                vehicleId: telemetry.vehicleId,
                type: .checkEngine,
                message: "RPM is very high (\(Int(telemetry.rpm)))",
                severity: telemetry.rpm > 6000 ? .critical : .warning,
                value: telemetry.rpm,
                threshold: 5000
            )
            newAlerts.append(alert)
        }

        // Add new alerts
        for alert in newAlerts {
            if !activeAlerts.contains(where: { $0.type == alert.type }) {
                activeAlerts.append(alert)
            }
        }
    }

    private func handleNewAlert(_ alert: TelemetryAlert) {
        if !activeAlerts.contains(where: { $0.id == alert.id }) {
            activeAlerts.append(alert)
        }
    }

    // MARK: - Data Export
    func exportTelemetryCSV() -> URL? {
        guard !historicalData.isEmpty else { return nil }

        var csvString = "Timestamp,Vehicle ID,Speed,RPM,Fuel Level,Engine Temp,Battery Voltage\n"

        for telemetry in historicalData {
            let row = "\(telemetry.timestamp.ISO8601Format()),\(telemetry.vehicleId),\(telemetry.speed),\(telemetry.rpm),\(telemetry.fuelLevel),\(telemetry.engineTemp),\(telemetry.batteryVoltage)\n"
            csvString.append(row)
        }

        let fileName = "telemetry_\(selectedVehicleId)_\(Date().ISO8601Format()).csv"
        let fileURL = FileManager.default.temporaryDirectory.appendingPathComponent(fileName)

        do {
            try csvString.write(to: fileURL, atomically: true, encoding: .utf8)
            return fileURL
        } catch {
            print("Failed to export CSV: \(error)")
            return nil
        }
    }

    // MARK: - Refresh Override
    override func refresh() async {
        startRefreshing()

        await fetchLiveTelemetry()
        await fetchHistoricalTelemetry()
        await fetchDiagnosticCodes()
        await fetchVehicleHealth()

        finishRefreshing()
    }

    // MARK: - Vehicle Selection
    func selectVehicle(_ vehicleId: String) {
        selectedVehicleId = vehicleId
        disconnectWebSocket()
        historicalData.removeAll()
        activeAlerts.removeAll()
        activeDTCs.removeAll()
        currentTelemetry = nil
        vehicleHealth = nil

        Task {
            await refresh()
            connectWebSocket()
        }
    }

    // MARK: - Time Period Selection
    func selectTimePeriod(_ period: TimePeriod) {
        selectedTimePeriod = period
        Task {
            await fetchHistoricalTelemetry()
        }
    }
}
