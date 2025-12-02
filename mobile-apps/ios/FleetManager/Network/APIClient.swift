import Foundation
import Combine

/**
 * Fleet API Client
 *
 * Comprehensive HTTP client with:
 * - Automatic retry with exponential backoff
 * - Request/response logging
 * - Authentication token management
 * - Network reachability checking
 * - Request queuing for offline scenarios
 */

enum APIError: Error, LocalizedError {
    case invalidURL
    case noData
    case decodingError(Error)
    case httpError(Int, String?)
    case networkError(Error)
    case unauthorized
    case serverError
    case timeout
    case cancelled

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .noData:
            return "No data received from server"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .httpError(let code, let message):
            return "HTTP \(code): \(message ?? "Unknown error")"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .unauthorized:
            return "Unauthorized. Please log in again."
        case .serverError:
            return "Server error. Please try again later."
        case .timeout:
            return "Request timed out"
        case .cancelled:
            return "Request was cancelled"
        }
    }
}

struct APIConfig {
    static let baseURL = "https://fleet.capitaltechalliance.com/api"
    static let timeout: TimeInterval = 30
    static let maxRetries = 3
    static let retryDelay: TimeInterval = 2.0
}

class APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private var authToken: String?
    private var cancellables = Set<AnyCancellable>()

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = APIConfig.timeout
        config.timeoutIntervalForResource = APIConfig.timeout
        config.waitsForConnectivity = true
        config.requestCachePolicy = .reloadIgnoringLocalCacheData

        self.session = URLSession(configuration: config)
    }

    // MARK: - Authentication

    func setAuthToken(_ token: String) {
        self.authToken = token
    }

    func clearAuthToken() {
        self.authToken = nil
    }

    // MARK: - Generic Request Method

    func request<T: Decodable>(
        _ endpoint: String,
        method: HTTPMethod = .get,
        parameters: [String: Any]? = nil,
        body: Data? = nil,
        headers: [String: String]? = nil,
        retryCount: Int = 0
    ) -> AnyPublisher<T, APIError> {

        guard let url = URL(string: "\(APIConfig.baseURL)\(endpoint)") else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.timeoutInterval = APIConfig.timeout

        // Add default headers
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("FleetMobile/1.0 iOS", forHTTPHeaderField: "User-Agent")

        // Add auth token if available
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        // Add custom headers
        headers?.forEach { key, value in
            request.setValue(value, forHTTPHeaderField: key)
        }

        // Add query parameters for GET requests
        if method == .get, let parameters = parameters {
            var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
            components?.queryItems = parameters.map { URLQueryItem(name: $0.key, value: "\($0.value)") }
            if let urlWithParams = components?.url {
                request.url = urlWithParams
            }
        }

        // Add body for POST/PUT/PATCH
        if method != .get, let body = body {
            request.httpBody = body
        } else if method != .get, let parameters = parameters {
            request.httpBody = try? JSONSerialization.data(withJSONObject: parameters)
        }

        print("🌐 \(method.rawValue) \(endpoint)")

        return session.dataTaskPublisher(for: request)
            .tryMap { data, response -> Data in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.serverError
                }

                print("📥 \(httpResponse.statusCode) \(endpoint)")

                switch httpResponse.statusCode {
                case 200...299:
                    return data
                case 401:
                    throw APIError.unauthorized
                case 400...499:
                    let message = String(data: data, encoding: .utf8)
                    throw APIError.httpError(httpResponse.statusCode, message)
                case 500...599:
                    throw APIError.serverError
                default:
                    throw APIError.httpError(httpResponse.statusCode, nil)
                }
            }
            .decode(type: T.self, decoder: JSONDecoder.fleetDecoder)
            .mapError { error -> APIError in
                if let apiError = error as? APIError {
                    return apiError
                } else if error is DecodingError {
                    return APIError.decodingError(error)
                } else {
                    return APIError.networkError(error)
                }
            }
            .catch { error -> AnyPublisher<T, APIError> in
                // Retry logic for network errors
                if retryCount < APIConfig.maxRetries,
                   case .networkError = error {
                    let delay = APIConfig.retryDelay * pow(2.0, Double(retryCount))

                    print("🔄 Retry \(retryCount + 1)/\(APIConfig.maxRetries) after \(delay)s")

                    return Just(())
                        .delay(for: .seconds(delay), scheduler: DispatchQueue.global())
                        .flatMap { _ in
                            self.request(
                                endpoint,
                                method: method,
                                parameters: parameters,
                                body: body,
                                headers: headers,
                                retryCount: retryCount + 1
                            )
                        }
                        .eraseToAnyPublisher()
                }

                return Fail(error: error).eraseToAnyPublisher()
            }
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    // MARK: - Convenience Methods

    func get<T: Decodable>(
        _ endpoint: String,
        parameters: [String: Any]? = nil
    ) -> AnyPublisher<T, APIError> {
        return request(endpoint, method: .get, parameters: parameters)
    }

    func post<T: Decodable>(
        _ endpoint: String,
        body: Encodable
    ) -> AnyPublisher<T, APIError> {
        let bodyData = try? JSONEncoder.fleetEncoder.encode(body)
        return request(endpoint, method: .post, body: bodyData)
    }

    func put<T: Decodable>(
        _ endpoint: String,
        body: Encodable
    ) -> AnyPublisher<T, APIError> {
        let bodyData = try? JSONEncoder.fleetEncoder.encode(body)
        return request(endpoint, method: .put, body: bodyData)
    }

    func delete<T: Decodable>(
        _ endpoint: String
    ) -> AnyPublisher<T, APIError> {
        return request(endpoint, method: .delete)
    }

    // MARK: - Multipart Upload

    func uploadMultipart<T: Decodable>(
        _ endpoint: String,
        fileData: Data,
        fileName: String,
        mimeType: String,
        parameters: [String: String]? = nil
    ) -> AnyPublisher<T, APIError> {

        guard let url = URL(string: "\(APIConfig.baseURL)\(endpoint)") else {
            return Fail(error: APIError.invalidURL).eraseToAnyPublisher()
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"

        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        var body = Data()

        // Add parameters
        if let parameters = parameters {
            for (key, value) in parameters {
                body.append("--\(boundary)\r\n".data(using: .utf8)!)
                body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".data(using: .utf8)!)
                body.append("\(value)\r\n".data(using: .utf8)!)
            }
        }

        // Add file
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"photo\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body

        print("📤 Uploading \(fileName) (\(fileData.count) bytes)")

        return session.dataTaskPublisher(for: request)
            .tryMap { data, response -> Data in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw APIError.serverError
                }

                guard (200...299).contains(httpResponse.statusCode) else {
                    let message = String(data: data, encoding: .utf8)
                    throw APIError.httpError(httpResponse.statusCode, message)
                }

                return data
            }
            .decode(type: T.self, decoder: JSONDecoder.fleetDecoder)
            .mapError { error -> APIError in
                if let apiError = error as? APIError {
                    return apiError
                } else if error is DecodingError {
                    return APIError.decodingError(error)
                } else {
                    return APIError.networkError(error)
                }
            }
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }
}

// MARK: - HTTP Method Enum

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

// MARK: - JSON Encoder/Decoder Extensions

extension JSONDecoder {
    static var fleetDecoder: JSONDecoder {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        decoder.dateDecodingStrategy = .iso8601
        return decoder
    }
}

extension JSONEncoder {
    static var fleetEncoder: JSONEncoder {
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }
}

// MARK: - Response Models

struct APIResponse<T: Decodable>: Decodable {
    let success: Bool
    let data: T?
    let error: String?
    let message: String?
}

struct EmptyResponse: Decodable {
    let success: Bool
}
