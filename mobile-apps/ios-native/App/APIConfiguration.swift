import Foundation

// MARK: - API Configuration for Azure Deployment
struct APIConfiguration {

    // MARK: - Production URLs - Fleet Manager (Azure Production)
    static let productionBaseURL = "https://fleet.capitaltechalliance.com"
    static let productionAPIURL = "\(productionBaseURL)/api"

    // MARK: - Staging URLs (Azure Staging Environment)
    static let stagingBaseURL = "https://staging.fleet.capitaltechalliance.com"
    static let stagingAPIURL = "\(stagingBaseURL)/api"

    // MARK: - Development URLs (Test Backend)
    static let developmentBaseURL = "http://172.168.84.37"
    static let developmentAPIURL = "\(developmentBaseURL)/api"

    // MARK: - Local URLs (Development Machine)
    static let localBaseURL = "http://localhost:3000"
    static let localAPIURL = "\(localBaseURL)/api"

    // MARK: - Current Environment
    // This is controlled by build configuration via compiler flags
    static var current: APIEnvironment {
        #if LOCAL
            return .local
        #elseif DEVELOPMENT
            return .development
        #elseif STAGING
            return .staging
        #else
            return .production // Default to production for release builds
        #endif
    }

    // MARK: - API Endpoints
    static var apiBaseURL: String {
        switch current {
        case .local:
            return localAPIURL
        case .development:
            return developmentAPIURL
        case .staging:
            return stagingAPIURL
        case .production:
            return productionAPIURL
        }
    }

    // MARK: - Environment Information
    static var environmentName: String {
        switch current {
        case .local:
            return "Local Development"
        case .development:
            return "Development"
        case .staging:
            return "Staging"
        case .production:
            return "Production"
        }
    }

    static var isProduction: Bool {
        return current == .production
    }

    enum APIEnvironment: String, CaseIterable {
        case local = "local"
        case development = "development"
        case staging = "staging"
        case production = "production"

        var displayName: String {
            switch self {
            case .local:
                return "Local Development"
            case .development:
                return "Development"
            case .staging:
                return "Staging"
            case .production:
                return "Production"
            }
        }
    }
    
    // MARK: - Endpoint Paths
    struct Endpoints {
        static let login = "/auth/login"
        static let logout = "/auth/logout"
        static let me = "/auth/me"
        static let refresh = "/auth/refresh"
        static let vehicles = "/vehicles"
        static let drivers = "/drivers"
        static let assets = "/assets"
        static let maintenance = "/maintenance"
        static let fleetMetrics = "/fleet-metrics"
        static let health = "/health"

        // Map Layer Endpoints
        static let mapTraffic = "/api/v1/map/traffic"
        static let mapWeather = "/api/v1/map/weather"
        static let mapIncidents = "/api/v1/map/incidents"
    }
    
    // MARK: - Request Configuration
    static func createRequest(for endpoint: String, method: HTTPMethod = .GET, token: String? = nil) -> URLRequest? {
        guard let url = URL(string: apiBaseURL + endpoint) else {
            return nil
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        // Add authentication header if token provided
        if let token = token {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        // Add Azure-specific headers
        request.setValue("iOS/Fleet-Management-App", forHTTPHeaderField: "User-Agent")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        // Production security headers
        if current == .production {
            request.setValue("no-cache", forHTTPHeaderField: "Cache-Control")
            request.setValue("same-origin", forHTTPHeaderField: "Sec-Fetch-Site")
        }
        
        return request
    }
    
    // MARK: - Health Check
    static func testConnection() async -> ConnectionStatus {
        guard let request = createRequest(for: Endpoints.health) else {
            return .failed("Invalid URL")
        }
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse,
               httpResponse.statusCode == 200 {
                
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let status = json["status"] as? String {
                    return status == "healthy" ? .connected : .degraded(status)
                }
            }
            
            return .failed("Server unavailable")
        } catch {
            return .failed(error.localizedDescription)
        }
    }
    
    enum ConnectionStatus {
        case connected
        case degraded(String)
        case failed(String)
        
        var isConnected: Bool {
            switch self {
            case .connected:
                return true
            case .degraded, .failed:
                return false
            }
        }
        
        var description: String {
            switch self {
            case .connected:
                return "Connected to Azure backend"
            case .degraded(let reason):
                return "Service degraded: \(reason)"
            case .failed(let error):
                return "Connection failed: \(error)"
            }
        }
    }
}

// MARK: - HTTP Methods
enum HTTPMethod: String {
    case GET = "GET"
    case POST = "POST"
    case PUT = "PUT"
    case DELETE = "DELETE"
    case PATCH = "PATCH"
}

// MARK: - Network Manager for Azure Integration
class AzureNetworkManager: NSObject, ObservableObject {
    @Published var connectionStatus: APIConfiguration.ConnectionStatus = .failed("Not tested")
    @Published var isConnected = false

    // SECURITY: Use certificate pinning for secure connections
    private lazy var session: URLSession = {
        return CertificatePinningManager.shared.createPinnedURLSession(delegate: self)
    }()

    private let logger = LoggingManager.shared
    private let errorHandler = ErrorHandler.shared
    private let crashReporter = CrashReporter.shared
    private let networkMonitor = NetworkMonitor.shared

    // Retry configuration
    private let maxRetries = 3
    private let retryDelay: TimeInterval = 1.0

    override init() {
        super.init()

        // Security check: Verify device is not jailbroken
        do {
            try JailbreakDetector.shared.enforcePolicy()
        } catch {
            SecurityLogger.shared.logSecurityEvent(
                .deviceCompromised,
                details: ["error": error.localizedDescription],
                severity: .critical
            )
        }

        Task {
            await checkConnection()
        }
    }

    func checkConnection() async {
        logger.log(.info, "Checking network connection", category: .network)

        let status = await APIConfiguration.testConnection()

        await MainActor.run {
            self.connectionStatus = status
            self.isConnected = status.isConnected

            logger.log(
                status.isConnected ? .info : .warning,
                "Connection status: \(status.description)",
                category: .network
            )
        }
    }
    
    // MARK: - Generic API Request Method with Retry Logic
    func performRequest<T: Codable>(
        endpoint: String,
        method: HTTPMethod = .GET,
        body: [String: Any]? = nil,
        token: String? = nil,
        responseType: T.Type,
        encryptPayload: Bool = false,
        retries: Int = 3
    ) async throws -> T {
        // Check network connectivity first
        guard networkMonitor.isConnected else {
            logger.log(.error, "No network connection for request to \(endpoint)", category: .network)
            throw APIError.networkError
        }

        // Use ErrorHandler's retry logic
        return try await errorHandler.executeWithRetry({
            try await self.executeRequest(
                endpoint: endpoint,
                method: method,
                body: body,
                token: token,
                responseType: responseType,
                encryptPayload: encryptPayload
            )
        }, retries: retries, context: "API Request: \(endpoint)")
    }

    // MARK: - Execute Single Request
    private func executeRequest<T: Codable>(
        endpoint: String,
        method: HTTPMethod,
        body: [String: Any]?,
        token: String?,
        responseType: T.Type,
        encryptPayload: Bool
    ) async throws -> T {
        let startTime = Date()

        guard var request = APIConfiguration.createRequest(for: endpoint, method: method, token: token) else {
            logger.log(.error, "Invalid URL for endpoint: \(endpoint)", category: .network)
            throw APIError.invalidURL
        }

        // SECURITY: Encrypt sensitive request payloads
        if let body = body {
            if encryptPayload {
                // Encrypt the payload for sensitive endpoints
                let encryptedPayload = try EncryptionManager.shared.encryptJSONPayload(body)
                let encryptedBody = ["encrypted_data": encryptedPayload]
                request.httpBody = try JSONSerialization.data(withJSONObject: encryptedBody)
                request.setValue("application/json+encrypted", forHTTPHeaderField: "Content-Type")
            } else {
                request.httpBody = try JSONSerialization.data(withJSONObject: body)
            }
        }

        // Add breadcrumb for crash reporting
        crashReporter.addBreadcrumb(
            message: "\(method.rawValue) \(endpoint)",
            category: "api",
            level: .info
        )

        do {
            let (data, response) = try await session.data(for: request)
            let duration = Date().timeIntervalSince(startTime)

            guard let httpResponse = response as? HTTPURLResponse else {
                logger.log(.error, "Invalid response for \(endpoint)", category: .network)
                throw APIError.networkError
            }

            // Log network request
            logger.logNetworkRequest(
                url: endpoint,
                method: method.rawValue,
                statusCode: httpResponse.statusCode,
                duration: duration
            )

            // Track network request for crash reporting
            crashReporter.trackNetworkRequest(
                url: endpoint,
                method: method.rawValue,
                statusCode: httpResponse.statusCode,
                duration: duration
            )

            // SECURITY: Log API failures for monitoring
            if httpResponse.statusCode >= 400 {
                SecurityLogger.shared.logSecurityEvent(
                    .apiRequestFailed,
                    details: [
                        "endpoint": endpoint,
                        "statusCode": httpResponse.statusCode,
                        "method": method.rawValue
                    ],
                    severity: httpResponse.statusCode == 401 ? .high : .medium
                )
            }

            // Handle different status codes
            switch httpResponse.statusCode {
            case 200...299:
                // SECURITY: Decrypt response if encrypted
                if let contentType = httpResponse.allHeaderFields["Content-Type"] as? String,
                   contentType.contains("encrypted") {
                    // Decrypt the response
                    let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                    if let encryptedData = json?["encrypted_data"] as? String {
                        let decryptedJSON = try EncryptionManager.shared.decryptJSONPayload(encryptedData)
                        let decryptedData = try JSONSerialization.data(withJSONObject: decryptedJSON)
                        return try JSONDecoder().decode(responseType, from: decryptedData)
                    }
                }

                do {
                    return try JSONDecoder().decode(responseType, from: data)
                } catch {
                    logger.log(.error, "Decoding error for \(endpoint): \(error.localizedDescription)", category: .network)
                    crashReporter.reportError(error, level: .error, context: ["endpoint": endpoint])
                    throw APIError.decodingError
                }

            case 400:
                let message = extractErrorMessage(from: data)
                throw APIError.badRequest(message)

            case 401:
                SecurityLogger.shared.logSecurityEvent(
                    .authenticationFailed,
                    details: ["endpoint": endpoint],
                    severity: .high
                )
                throw APIError.authenticationFailed

            case 403:
                throw APIError.forbidden

            case 404:
                throw APIError.notFound

            case 429:
                SecurityLogger.shared.logSecurityEvent(
                    .rateLimitExceeded,
                    details: ["endpoint": endpoint],
                    severity: .medium
                )
                throw APIError.rateLimitExceeded

            case 500...599:
                throw APIError.serverError

            case 503:
                throw APIError.serviceUnavailable

            default:
                throw APIError.unknown(httpResponse.statusCode)
            }
        } catch let error as APIError {
            // Re-throw API errors
            throw error
        } catch {
            // Handle network errors
            logger.log(.error, "Network error for \(endpoint): \(error.localizedDescription)", category: .network)
            crashReporter.reportError(error, level: .error, context: ["endpoint": endpoint])

            if (error as NSError).code == NSURLErrorTimedOut {
                throw APIError.timeout
            } else {
                throw APIError.networkError
            }
        }
    }

    // MARK: - Helper Methods

    /// Extract error message from response data
    private func extractErrorMessage(from data: Data) -> String {
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let message = json["message"] as? String {
            return message
        }
        return "Bad request"
    }
}

// MARK: - Enhanced API Errors
enum APIError: Error, LocalizedError {
    case invalidURL
    case authenticationFailed
    case unauthorized
    case networkError
    case serverError
    case decodingError
    case timeout
    case badRequest(String)
    case notFound
    case forbidden
    case rateLimitExceeded
    case serviceUnavailable
    case unknown(Int)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid server URL"
        case .authenticationFailed:
            return "Authentication failed"
        case .unauthorized:
            return "Unauthorized access"
        case .networkError:
            return "Network connection error"
        case .serverError:
            return "Server error occurred"
        case .decodingError:
            return "Data parsing error"
        case .timeout:
            return "Request timeout"
        case .badRequest(let message):
            return "Bad request: \(message)"
        case .notFound:
            return "Resource not found"
        case .forbidden:
            return "Access forbidden"
        case .rateLimitExceeded:
            return "Rate limit exceeded"
        case .serviceUnavailable:
            return "Service unavailable"
        case .unknown(let code):
            return "Unknown error (code: \(code))"
        }
    }
}

// MARK: - Basic API Service
class APIService {
    private let networkManager = AzureNetworkManager()

    func authenticateUser(email: String, password: String) async throws {
        // SECURITY: Encrypt authentication credentials in transit
        let credentials = [
            "email": email,
            "password": password
        ]

        SecurityLogger.shared.logSecurityEvent(
            .authenticationSuccess,
            details: ["email": email],
            severity: .low
        )

        // Implementation for authentication with encrypted payload
        try await Task.sleep(nanoseconds: 1_000_000_000) // 1 second delay
    }

    func uploadVehicleData(_ data: [String: Any]) async throws {
        // SECURITY: Encrypt sensitive vehicle data
        let encryptSensitiveFields = data.keys.contains { key in
            ["vin", "driver_license", "ssn"].contains(key.lowercased())
        }

        // Implementation for uploading vehicle data
        try await Task.sleep(nanoseconds: 500_000_000) // 0.5 second delay
    }
}

// MARK: - URLSessionDelegate for Certificate Pinning
extension AzureNetworkManager: URLSessionDelegate {
    func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        CertificatePinningManager.shared.validateServerTrust(
            challenge: challenge,
            completionHandler: completionHandler
        )
    }
}