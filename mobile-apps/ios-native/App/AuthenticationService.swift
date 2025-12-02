//
//  AuthenticationService.swift
//  Fleet Manager - Authentication API Service
//
//  Handles all authentication-related API calls with async/await
//  Integrates with existing APIConfiguration and Azure backend
//

import Foundation

// MARK: - Authentication Service

class AuthenticationService {
    static let shared = AuthenticationService()

    private let session: URLSession

    private init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: configuration)
    }

    // MARK: - Authentication Models

    struct LoginRequest: Codable {
        let email: String
        let password: String
        let deviceId: String
        let deviceName: String
    }

    struct LoginResponse: Codable {
        let success: Bool
        let user: User
        let accessToken: String
        let refreshToken: String?
        let expiresIn: Int

        enum CodingKeys: String, CodingKey {
            case success
            case user
            case accessToken = "access_token"
            case refreshToken = "refresh_token"
            case expiresIn = "expires_in"
        }
    }

    struct User: Codable {
        let id: Int
        let email: String
        let name: String
        let role: String
        let organizationId: Int?

        enum CodingKeys: String, CodingKey {
            case id
            case email
            case name
            case role
            case organizationId = "organization_id"
        }
    }

    struct RefreshTokenRequest: Codable {
        let refreshToken: String

        enum CodingKeys: String, CodingKey {
            case refreshToken = "refresh_token"
        }
    }

    struct RefreshTokenResponse: Codable {
        let accessToken: String
        let refreshToken: String?
        let expiresIn: Int

        enum CodingKeys: String, CodingKey {
            case accessToken = "access_token"
            case refreshToken = "refresh_token"
            case expiresIn = "expires_in"
        }
    }

    struct UserProfileResponse: Codable {
        let success: Bool
        let user: User
    }

    struct LogoutRequest: Codable {
        let deviceId: String

        enum CodingKeys: String, CodingKey {
            case deviceId = "device_id"
        }
    }

    struct ErrorResponse: Codable {
        let success: Bool
        let error: String
        let message: String?
    }

    // MARK: - Authentication Errors

    enum AuthError: Error, LocalizedError {
        case invalidCredentials
        case invalidResponse
        case networkError
        case serverError(String)
        case unauthorized
        case tokenExpired
        case unknown

        var errorDescription: String? {
            switch self {
            case .invalidCredentials:
                return "Invalid email or password"
            case .invalidResponse:
                return "Invalid server response"
            case .networkError:
                return "Network connection error. Please check your internet connection."
            case .serverError(let message):
                return message
            case .unauthorized:
                return "Unauthorized. Please log in again."
            case .tokenExpired:
                return "Your session has expired. Please log in again."
            case .unknown:
                return "An unknown error occurred"
            }
        }
    }

    // MARK: - Login

    /// Authenticate user with email and password
    func login(email: String, password: String) async throws -> LoginResponse {
        guard let url = URL(string: APIConfiguration.apiBaseURL + APIConfiguration.Endpoints.login) else {
            throw AuthError.invalidResponse
        }

        let request = LoginRequest(
            email: email,
            password: password,
            deviceId: APIConfiguration.deviceId,
            deviceName: APIConfiguration.deviceName
        )

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = HTTPMethod.POST.rawValue
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("iOS/Fleet-Management-App", forHTTPHeaderField: "User-Agent")
        urlRequest.setValue("application/json", forHTTPHeaderField: "Accept")

        do {
            urlRequest.httpBody = try JSONEncoder().encode(request)
        } catch {
            throw AuthError.invalidResponse
        }

        do {
            let (data, response) = try await session.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw AuthError.networkError
            }

            switch httpResponse.statusCode {
            case 200...299:
                let loginResponse = try JSONDecoder().decode(LoginResponse.self, from: data)

                if !loginResponse.success {
                    throw AuthError.invalidCredentials
                }

                return loginResponse

            case 401, 403:
                // Try to parse error message
                if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                    throw AuthError.serverError(errorResponse.message ?? errorResponse.error)
                }
                throw AuthError.invalidCredentials

            case 500...599:
                if let errorResponse = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                    throw AuthError.serverError(errorResponse.message ?? "Server error occurred")
                }
                throw AuthError.serverError("Server error occurred")

            default:
                throw AuthError.unknown
            }
        } catch let error as AuthError {
            throw error
        } catch {
            throw AuthError.networkError
        }
    }

    // MARK: - Token Refresh

    /// Refresh access token using refresh token
    func refreshToken(_ refreshToken: String) async throws -> RefreshTokenResponse {
        guard let url = URL(string: APIConfiguration.apiBaseURL + APIConfiguration.Endpoints.refresh) else {
            throw AuthError.invalidResponse
        }

        let request = RefreshTokenRequest(refreshToken: refreshToken)

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = HTTPMethod.POST.rawValue
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("iOS/Fleet-Management-App", forHTTPHeaderField: "User-Agent")

        do {
            urlRequest.httpBody = try JSONEncoder().encode(request)
        } catch {
            throw AuthError.invalidResponse
        }

        do {
            let (data, response) = try await session.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw AuthError.networkError
            }

            switch httpResponse.statusCode {
            case 200...299:
                return try JSONDecoder().decode(RefreshTokenResponse.self, from: data)

            case 401, 403:
                throw AuthError.tokenExpired

            default:
                throw AuthError.unknown
            }
        } catch let error as AuthError {
            throw error
        } catch {
            throw AuthError.networkError
        }
    }

    // MARK: - User Profile

    /// Fetch current user profile
    func fetchUserProfile(token: String) async throws -> User {
        guard let url = URL(string: APIConfiguration.apiBaseURL + APIConfiguration.Endpoints.me) else {
            throw AuthError.invalidResponse
        }

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = HTTPMethod.GET.rawValue
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        urlRequest.setValue("iOS/Fleet-Management-App", forHTTPHeaderField: "User-Agent")

        do {
            let (data, response) = try await session.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw AuthError.networkError
            }

            switch httpResponse.statusCode {
            case 200...299:
                let profileResponse = try JSONDecoder().decode(UserProfileResponse.self, from: data)
                return profileResponse.user

            case 401, 403:
                throw AuthError.unauthorized

            default:
                throw AuthError.unknown
            }
        } catch let error as AuthError {
            throw error
        } catch {
            throw AuthError.networkError
        }
    }

    // MARK: - Logout

    /// Logout user and invalidate tokens on server
    func logout(token: String) async throws {
        guard let url = URL(string: APIConfiguration.apiBaseURL + APIConfiguration.Endpoints.logout) else {
            throw AuthError.invalidResponse
        }

        let request = LogoutRequest(deviceId: APIConfiguration.deviceId)

        var urlRequest = URLRequest(url: url)
        urlRequest.httpMethod = HTTPMethod.POST.rawValue
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        urlRequest.setValue("iOS/Fleet-Management-App", forHTTPHeaderField: "User-Agent")

        do {
            urlRequest.httpBody = try JSONEncoder().encode(request)
        } catch {
            throw AuthError.invalidResponse
        }

        do {
            let (_, response) = try await session.data(for: urlRequest)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw AuthError.networkError
            }

            // Accept 200-299 and 401 (already logged out) as success
            guard (200...299).contains(httpResponse.statusCode) || httpResponse.statusCode == 401 else {
                throw AuthError.serverError("Failed to logout")
            }
        } catch let error as AuthError {
            throw error
        } catch {
            // Don't throw network errors on logout - continue with local cleanup
            print("Logout network error (continuing with local cleanup): \(error.localizedDescription)")
        }
    }

    // MARK: - Health Check

    /// Verify authentication service is reachable
    func healthCheck() async -> Bool {
        let status = await APIConfiguration.testConnection()
        return status.isConnected
    }
}

// MARK: - Device Info Extension

extension APIConfiguration {
    static var deviceId: String {
        if let uuid = UIDevice.current.identifierForVendor?.uuidString {
            return uuid
        }

        // Fallback: Generate and store a UUID
        let key = "fleet_device_id"
        if let stored = UserDefaults.standard.string(forKey: key) {
            return stored
        }

        let newUUID = UUID().uuidString
        UserDefaults.standard.set(newUUID, forKey: key)
        return newUUID
    }

    static var deviceName: String {
        return UIDevice.current.name
    }
}

// MARK: - UIDevice Import

import UIKit
