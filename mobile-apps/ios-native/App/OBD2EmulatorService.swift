import Foundation
import Combine

// MARK: - OBD2 Emulator Service
/// Service for connecting to the backend OBD2 emulator via HTTP/WebSocket
class OBD2EmulatorService: NSObject, ObservableObject {

    // MARK: - Singleton
    static let shared = OBD2EmulatorService()

    // MARK: - Published Properties
    @Published var isConnected: Bool = false
    @Published var isLoading: Bool = false
    @Published var error: String?
    @Published var sessionId: String?
    @Published var currentData: EmulatedOBD2Data?

    // MARK: - Configuration
    private var baseURL: String {
        // Use environment variable or default to localhost
        ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:3000"
    }

    // MARK: - Private Properties
    private var webSocketTask: URLSessionWebSocketTask?
    private var pingTimer: Timer?
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization
    private override init() {
        super.init()
    }

    // MARK: - Public Methods

    /// Start a new emulator session
    func startEmulator(
        vehicleId: Int = 1,
        profile: VehicleProfile = .sedan,
        scenario: DrivingScenario = .city,
        completion: @escaping (Result<EmulatorSession, Error>) -> Void
    ) {
        isLoading = true
        error = nil

        guard let url = URL(string: "\(baseURL)/api/obd2-emulator/start") else {
            completion(.failure(EmulatorError.invalidURL))
            isLoading = false
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "vehicleId": vehicleId,
            "profile": profile.rawValue,
            "scenario": scenario.rawValue,
            "updateIntervalMs": 1000
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        } catch {
            completion(.failure(error))
            isLoading = false
            return
        }

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                self?.isLoading = false

                if let error = error {
                    self?.error = error.localizedDescription
                    completion(.failure(error))
                    return
                }

                guard let data = data else {
                    let error = EmulatorError.noData
                    self?.error = error.localizedDescription
                    completion(.failure(error))
                    return
                }

                do {
                    let session = try JSONDecoder().decode(EmulatorSession.self, from: data)
                    self?.sessionId = session.sessionId
                    self?.connectWebSocket(sessionId: session.sessionId)
                    completion(.success(session))
                } catch {
                    self?.error = error.localizedDescription
                    completion(.failure(error))
                }
            }
        }.resume()
    }

    /// Stop the current emulator session
    func stopEmulator(completion: ((Result<Void, Error>) -> Void)? = nil) {
        guard let sessionId = sessionId else {
            completion?(.failure(EmulatorError.noSession))
            return
        }

        guard let url = URL(string: "\(baseURL)/api/obd2-emulator/stop/\(sessionId)") else {
            completion?(.failure(EmulatorError.invalidURL))
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"

        URLSession.shared.dataTask(with: request) { [weak self] _, _, error in
            DispatchQueue.main.async {
                if let error = error {
                    self?.error = error.localizedDescription
                    completion?(.failure(error))
                    return
                }

                self?.disconnectWebSocket()
                self?.sessionId = nil
                self?.currentData = nil
                completion?(.success(()))
            }
        }.resume()
    }

    /// Get sample data without starting a session
    func getSampleData(profile: VehicleProfile = .sedan, completion: @escaping (Result<EmulatedOBD2Data, Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/api/obd2-emulator/sample-data?profile=\(profile.rawValue)") else {
            completion(.failure(EmulatorError.invalidURL))
            return
        }

        URLSession.shared.dataTask(with: url) { data, _, error in
            DispatchQueue.main.async {
                if let error = error {
                    completion(.failure(error))
                    return
                }

                guard let data = data else {
                    completion(.failure(EmulatorError.noData))
                    return
                }

                do {
                    let obd2Data = try JSONDecoder().decode(EmulatedOBD2Data.self, from: data)
                    completion(.success(obd2Data))
                } catch {
                    completion(.failure(error))
                }
            }
        }.resume()
    }

    // MARK: - WebSocket Connection

    private func connectWebSocket(sessionId: String) {
        let wsScheme = baseURL.hasPrefix("https") ? "wss" : "ws"
        let host = baseURL
            .replacingOccurrences(of: "https://", with: "")
            .replacingOccurrences(of: "http://", with: "")

        guard let url = URL(string: "\(wsScheme)://\(host)/ws/obd2/\(sessionId)") else {
            error = "Invalid WebSocket URL"
            return
        }

        let session = URLSession(configuration: .default)
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()

        isConnected = true
        receiveMessage()
        startPingTimer()

        print("🔌 Connected to OBD2 Emulator WebSocket")
    }

    private func disconnectWebSocket() {
        pingTimer?.invalidate()
        pingTimer = nil
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        isConnected = false

        print("🔌 Disconnected from OBD2 Emulator WebSocket")
    }

    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self?.handleMessage(text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self?.handleMessage(text)
                    }
                @unknown default:
                    break
                }

                // Continue receiving messages
                self?.receiveMessage()

            case .failure(let error):
                DispatchQueue.main.async {
                    self?.error = error.localizedDescription
                    self?.isConnected = false
                }
            }
        }
    }

    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8) else { return }

        do {
            let message = try JSONDecoder().decode(WebSocketMessage.self, from: data)

            DispatchQueue.main.async { [weak self] in
                switch message.type {
                case "obd2_data":
                    if let obd2Data = message.data {
                        self?.currentData = obd2Data
                    }
                case "error":
                    self?.error = message.message
                case "connected", "subscribed":
                    print("📡 \(message.message ?? "Connected")")
                default:
                    break
                }
            }
        } catch {
            print("❌ Failed to decode WebSocket message: \(error)")
        }
    }

    private func startPingTimer() {
        pingTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { [weak self] _ in
            self?.sendPing()
        }
    }

    private func sendPing() {
        let message = WebSocketMessage(type: "ping", message: nil, sessionId: nil, data: nil)
        if let data = try? JSONEncoder().encode(message),
           let text = String(data: data, encoding: .utf8) {
            webSocketTask?.send(.string(text)) { error in
                if let error = error {
                    print("❌ Ping failed: \(error)")
                }
            }
        }
    }
}

// MARK: - Models

enum VehicleProfile: String, CaseIterable, Identifiable {
    case sedan = "sedan"
    case truck = "truck"
    case electric = "electric"
    case diesel = "diesel"
    case sports = "sports"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .sedan: return "Standard Sedan"
        case .truck: return "Work Truck"
        case .electric: return "Electric Vehicle"
        case .diesel: return "Diesel Engine"
        case .sports: return "Sports Car"
        }
    }
}

enum DrivingScenario: String, CaseIterable, Identifiable {
    case idle = "idle"
    case city = "city"
    case highway = "highway"
    case aggressive = "aggressive"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .idle: return "Idle"
        case .city: return "City Driving"
        case .highway: return "Highway Cruising"
        case .aggressive: return "Aggressive Driving"
        }
    }
}

struct EmulatorSession: Codable {
    let success: Bool
    let sessionId: String
    let vehicleId: Int
    let adapterId: Int
    let profile: String
    let scenario: String
    let message: String
    let wsUrl: String
}

struct EmulatedOBD2Data: Codable, Identifiable {
    var id: String { sessionId }

    let timestamp: String
    let sessionId: String
    let vehicleId: Int
    let adapterId: Int

    let engineRpm: Int
    let vehicleSpeed: Int
    let throttlePosition: Int
    let engineLoad: Int

    let engineCoolantTemp: Int
    let intakeAirTemp: Int
    let catalystTemperature: Int
    let engineOilTemp: Int

    let fuelLevel: Int
    let fuelPressure: Int
    let fuelConsumptionRate: Double
    let shortTermFuelTrim: Int
    let longTermFuelTrim: Int

    let mafAirFlowRate: Double
    let intakeManifoldPressure: Int

    let batteryVoltage: Double
    let controlModuleVoltage: Double

    let timingAdvance: Int

    let estimatedMpg: Double
    let distanceTraveled: Double
    let tripTime: Int

    let location: LocationData?
}

struct LocationData: Codable {
    let latitude: Double
    let longitude: Double
    let altitude: Double
    let speed: Double
    let heading: Double
}

struct WebSocketMessage: Codable {
    let type: String
    let message: String?
    let sessionId: String?
    let data: EmulatedOBD2Data?
}

enum EmulatorError: LocalizedError {
    case invalidURL
    case noData
    case noSession
    case connectionFailed

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .noData: return "No data received"
        case .noSession: return "No active session"
        case .connectionFailed: return "Connection failed"
        }
    }
}
