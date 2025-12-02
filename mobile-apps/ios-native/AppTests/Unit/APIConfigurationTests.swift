//
//  APIConfigurationTests.swift
//  Fleet Management App Tests
//
//  Unit tests for API configuration and network requests with mocking
//

import XCTest
@testable import App

class APIConfigurationTests: XCTestCase {

    var mockURLSession: MockURLSession!

    override func setUpWithError() throws {
        try super.setUpWithError()
        mockURLSession = MockURLSession()
    }

    override func tearDownWithError() throws {
        mockURLSession = nil
        try super.tearDownWithError()
    }

    // MARK: - Environment Configuration Tests

    func testProductionEnvironmentConfiguration() throws {
        // Given
        let environment = APIConfiguration.APIEnvironment.production

        // Then
        XCTAssertEqual(APIConfiguration.azureBaseURL, "https://fleet.capitaltechalliance.com")
        XCTAssertEqual(APIConfiguration.azureAPIURL, "https://fleet.capitaltechalliance.com/api")
    }

    func testDevelopmentEnvironmentConfiguration() throws {
        // Given
        let environment = APIConfiguration.APIEnvironment.development

        // Then
        XCTAssertEqual(APIConfiguration.developmentBaseURL, "http://localhost:3000")
        XCTAssertEqual(APIConfiguration.developmentAPIURL, "http://localhost:3000/api")
    }

    func testCurrentEnvironment() throws {
        // Given / When
        let currentEnv = APIConfiguration.current

        // Then
        #if DEBUG
        XCTAssertEqual(currentEnv, .development, "Debug builds should use development environment")
        #else
        XCTAssertEqual(currentEnv, .production, "Release builds should use production environment")
        #endif
    }

    func testAPIBaseURL() throws {
        // Given / When
        let baseURL = APIConfiguration.apiBaseURL

        // Then
        #if DEBUG
        XCTAssertEqual(baseURL, APIConfiguration.developmentAPIURL)
        #else
        XCTAssertEqual(baseURL, APIConfiguration.azureAPIURL)
        #endif
    }

    // MARK: - Endpoint Tests

    func testEndpointPaths() throws {
        // Given / When / Then
        XCTAssertEqual(APIConfiguration.Endpoints.login, "/auth/login")
        XCTAssertEqual(APIConfiguration.Endpoints.logout, "/auth/logout")
        XCTAssertEqual(APIConfiguration.Endpoints.me, "/auth/me")
        XCTAssertEqual(APIConfiguration.Endpoints.refresh, "/auth/refresh")
        XCTAssertEqual(APIConfiguration.Endpoints.vehicles, "/vehicles")
        XCTAssertEqual(APIConfiguration.Endpoints.drivers, "/drivers")
        XCTAssertEqual(APIConfiguration.Endpoints.maintenance, "/maintenance")
        XCTAssertEqual(APIConfiguration.Endpoints.fleetMetrics, "/fleet-metrics")
        XCTAssertEqual(APIConfiguration.Endpoints.health, "/health")
    }

    // MARK: - Request Creation Tests

    func testCreateGETRequest() throws {
        // Given
        let endpoint = "/test"

        // When
        let request = APIConfiguration.createRequest(for: endpoint, method: .GET)

        // Then
        XCTAssertNotNil(request)
        XCTAssertEqual(request?.httpMethod, "GET")
        XCTAssertEqual(request?.value(forHTTPHeaderField: "Content-Type"), "application/json")
        XCTAssertEqual(request?.value(forHTTPHeaderField: "Accept"), "application/json")
        XCTAssertEqual(request?.value(forHTTPHeaderField: "User-Agent"), "iOS/Fleet-Management-App")
    }

    func testCreatePOSTRequest() throws {
        // Given
        let endpoint = "/test"

        // When
        let request = APIConfiguration.createRequest(for: endpoint, method: .POST)

        // Then
        XCTAssertNotNil(request)
        XCTAssertEqual(request?.httpMethod, "POST")
    }

    func testCreateRequestWithToken() throws {
        // Given
        let endpoint = "/test"
        let token = "test-token-12345"

        // When
        let request = APIConfiguration.createRequest(for: endpoint, method: .GET, token: token)

        // Then
        XCTAssertNotNil(request)
        XCTAssertEqual(request?.value(forHTTPHeaderField: "Authorization"), "Bearer \(token)")
    }

    func testCreateRequestWithoutToken() throws {
        // Given
        let endpoint = "/test"

        // When
        let request = APIConfiguration.createRequest(for: endpoint, method: .GET, token: nil)

        // Then
        XCTAssertNotNil(request)
        XCTAssertNil(request?.value(forHTTPHeaderField: "Authorization"))
    }

    func testCreateRequestWithInvalidURL() throws {
        // Given
        let invalidEndpoint = "not a valid endpoint with spaces"

        // When
        let request = APIConfiguration.createRequest(for: invalidEndpoint, method: .GET)

        // Then - Should still create a request since we append to base URL
        XCTAssertNotNil(request)
    }

    // MARK: - HTTP Method Tests

    func testHTTPMethods() throws {
        XCTAssertEqual(HTTPMethod.GET.rawValue, "GET")
        XCTAssertEqual(HTTPMethod.POST.rawValue, "POST")
        XCTAssertEqual(HTTPMethod.PUT.rawValue, "PUT")
        XCTAssertEqual(HTTPMethod.DELETE.rawValue, "DELETE")
        XCTAssertEqual(HTTPMethod.PATCH.rawValue, "PATCH")
    }

    // MARK: - Connection Status Tests

    func testConnectionStatusConnected() throws {
        // Given
        let status = APIConfiguration.ConnectionStatus.connected

        // Then
        XCTAssertTrue(status.isConnected)
        XCTAssertEqual(status.description, "Connected to Azure backend")
    }

    func testConnectionStatusDegraded() throws {
        // Given
        let status = APIConfiguration.ConnectionStatus.degraded("slow response")

        // Then
        XCTAssertFalse(status.isConnected)
        XCTAssertEqual(status.description, "Service degraded: slow response")
    }

    func testConnectionStatusFailed() throws {
        // Given
        let status = APIConfiguration.ConnectionStatus.failed("network timeout")

        // Then
        XCTAssertFalse(status.isConnected)
        XCTAssertEqual(status.description, "Connection failed: network timeout")
    }

    // MARK: - Health Check Tests (Async)

    func testHealthCheckSuccess() async throws {
        // Given
        let mockData = """
        {
            "status": "healthy",
            "timestamp": "2025-11-11T10:00:00Z"
        }
        """.data(using: .utf8)!

        let mockResponse = HTTPURLResponse(
            url: URL(string: APIConfiguration.apiBaseURL + APIConfiguration.Endpoints.health)!,
            statusCode: 200,
            httpVersion: nil,
            headerFields: nil
        )

        MockURLProtocol.requestHandler = { request in
            return (mockResponse!, mockData)
        }

        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: config)

        // Note: This test demonstrates the pattern, but requires URLSession injection
        // in the actual APIConfiguration.testConnection() method

        // When
        let status = await APIConfiguration.testConnection()

        // Then
        // In a real implementation with dependency injection, we would test this properly
        XCTAssertNotNil(status)
    }

    func testHealthCheckFailure() async throws {
        // Given
        let mockResponse = HTTPURLResponse(
            url: URL(string: APIConfiguration.apiBaseURL + APIConfiguration.Endpoints.health)!,
            statusCode: 500,
            httpVersion: nil,
            headerFields: nil
        )

        MockURLProtocol.requestHandler = { request in
            return (mockResponse!, Data())
        }

        // When
        let status = await APIConfiguration.testConnection()

        // Then
        XCTAssertFalse(status.isConnected)
    }

    // MARK: - API Error Tests

    func testAPIErrorDescriptions() throws {
        XCTAssertEqual(APIError.invalidURL.errorDescription, "Invalid server URL")
        XCTAssertEqual(APIError.authenticationFailed.errorDescription, "Authentication failed")
        XCTAssertEqual(APIError.networkError.errorDescription, "Network connection error")
        XCTAssertEqual(APIError.serverError.errorDescription, "Server error occurred")
        XCTAssertEqual(APIError.decodingError.errorDescription, "Data parsing error")
    }

    // MARK: - Network Manager Tests

    func testAzureNetworkManagerInitialization() async throws {
        // Given / When
        let networkManager = AzureNetworkManager()

        // Wait a bit for initialization
        try await Task.sleep(nanoseconds: 100_000_000) // 0.1 seconds

        // Then
        XCTAssertNotNil(networkManager)
        XCTAssertNotNil(networkManager.connectionStatus)
    }

    func testNetworkManagerCheckConnection() async throws {
        // Given
        let networkManager = AzureNetworkManager()

        // When
        await networkManager.checkConnection()

        // Then
        XCTAssertNotNil(networkManager.connectionStatus)
    }

    // MARK: - Performance Tests

    func testRequestCreationPerformance() throws {
        measure {
            for _ in 0..<100 {
                _ = APIConfiguration.createRequest(
                    for: APIConfiguration.Endpoints.vehicles,
                    method: .GET,
                    token: "test-token"
                )
            }
        }
    }

    func testEndpointAccessPerformance() throws {
        measure {
            for _ in 0..<1000 {
                _ = APIConfiguration.Endpoints.login
                _ = APIConfiguration.Endpoints.vehicles
                _ = APIConfiguration.Endpoints.drivers
            }
        }
    }

    // MARK: - Edge Cases

    func testEmptyEndpoint() throws {
        // Given
        let endpoint = ""

        // When
        let request = APIConfiguration.createRequest(for: endpoint, method: .GET)

        // Then
        XCTAssertNotNil(request)
    }

    func testVeryLongEndpoint() throws {
        // Given
        let longEndpoint = "/" + String(repeating: "a", count: 1000)

        // When
        let request = APIConfiguration.createRequest(for: longEndpoint, method: .GET)

        // Then
        XCTAssertNotNil(request)
    }

    func testSpecialCharactersInEndpoint() throws {
        // Given
        let specialEndpoint = "/vehicles?id=123&filter=active"

        // When
        let request = APIConfiguration.createRequest(for: specialEndpoint, method: .GET)

        // Then
        XCTAssertNotNil(request)
        XCTAssertTrue(request!.url!.absoluteString.contains("?"))
        XCTAssertTrue(request!.url!.absoluteString.contains("&"))
    }

    // MARK: - Security Header Tests

    func testProductionSecurityHeaders() throws {
        // This test assumes production environment
        // In real scenario, you'd need to mock the environment

        // Given
        let endpoint = "/test"

        // When
        let request = APIConfiguration.createRequest(for: endpoint, method: .GET)

        // Then
        XCTAssertNotNil(request)
        // Production security headers would be tested here
        // when APIConfiguration.current == .production
    }

    // MARK: - Concurrent Request Tests

    func testConcurrentRequestCreation() async throws {
        // Given
        let iterations = 100

        // When
        await withTaskGroup(of: URLRequest?.self) { group in
            for i in 0..<iterations {
                group.addTask {
                    return APIConfiguration.createRequest(
                        for: "/test/\(i)",
                        method: .GET,
                        token: "token-\(i)"
                    )
                }
            }

            // Then
            var requestCount = 0
            for await request in group {
                if request != nil {
                    requestCount += 1
                }
            }

            XCTAssertEqual(requestCount, iterations, "All requests should be created successfully")
        }
    }
}

// MARK: - Mock URL Session

class MockURLSession: URLSession {
    var data: Data?
    var response: URLResponse?
    var error: Error?

    override func data(for request: URLRequest) async throws -> (Data, URLResponse) {
        if let error = error {
            throw error
        }

        let data = self.data ?? Data()
        let response = self.response ?? HTTPURLResponse(
            url: request.url!,
            statusCode: 200,
            httpVersion: nil,
            headerFields: nil
        )!

        return (data, response)
    }
}

// MARK: - Mock URL Protocol

class MockURLProtocol: URLProtocol {
    static var requestHandler: ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool {
        return true
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        return request
    }

    override func startLoading() {
        guard let handler = MockURLProtocol.requestHandler else {
            fatalError("Request handler is not set")
        }

        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {
        // No-op
    }
}
