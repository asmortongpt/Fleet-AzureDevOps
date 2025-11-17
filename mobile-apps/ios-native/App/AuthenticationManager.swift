//
//  AuthenticationManager.swift
//  Fleet Manager - Authentication Manager
//
//  Coordinates authentication flow, token management, session handling
//  Implements MVVM pattern with ObservableObject for SwiftUI integration
//

import Foundation
import Combine
import SwiftUI

// MARK: - Authentication Manager

@MainActor
class AuthenticationManager: ObservableObject {
    static let shared = AuthenticationManager()

    // MARK: - Published Properties

    @Published var isAuthenticated = false
    @Published var currentUser: AuthenticationService.User?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var isBiometricEnabled = false
    @Published var biometricType: String = "Biometric"

    // MARK: - Private Properties

    private let authService = AuthenticationService.shared
    private let keychainManager = KeychainManager.shared
    private var tokenRefreshTask: Task<Void, Never>?
    private var sessionCheckTimer: Timer?

    // MARK: - Initialization

    private init() {
        setupBiometricInfo()
        Task {
            await checkExistingSession()
        }
    }

    deinit {
        sessionCheckTimer?.invalidate()
    }

    // MARK: - Biometric Setup

    private func setupBiometricInfo() {
        let (available, _) = keychainManager.isBiometricAvailable()
        biometricType = keychainManager.getBiometricTypeName()
        isBiometricEnabled = available && keychainManager.exists(for: .biometricEnabled)
    }

    // MARK: - Session Management

    /// Check if user has existing valid session
    func checkExistingSession() async {
        isLoading = true
        defer { isLoading = false }

        do {
            // Try to get access token
            guard let token = try? await keychainManager.getAccessToken() else {
                isAuthenticated = false
                return
            }

            // Check if token is expired
            let isExpired = await keychainManager.isTokenExpired()

            if isExpired {
                // Try to refresh token
                await attemptTokenRefresh()
            } else {
                // Fetch user profile to validate session
                await fetchUserProfile(token: token)
            }
        }
    }

    /// Start periodic token refresh checks
    private func startSessionMonitoring() {
        sessionCheckTimer?.invalidate()

        sessionCheckTimer = Timer.scheduledTimer(withTimeInterval: 300, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                await self?.checkAndRefreshToken()
            }
        }
    }

    /// Stop session monitoring
    private func stopSessionMonitoring() {
        sessionCheckTimer?.invalidate()
        sessionCheckTimer = nil
    }

    // MARK: - Login

    /// Login with email and password
    func login(email: String, password: String) async -> Bool {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        do {
            // Validate inputs
            guard !email.isEmpty, !password.isEmpty else {
                errorMessage = "Please enter email and password"
                return false
            }

            guard isValidEmail(email) else {
                errorMessage = "Please enter a valid email address"
                return false
            }

            // Perform login
            let response = try await authService.login(email: email, password: password)

            // Save tokens to keychain
            try await keychainManager.saveTokens(
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                expiresIn: response.expiresIn
            )

            // Save user info
            try keychainManager.save(response.user.email, for: .userEmail)
            try keychainManager.save("\(response.user.id)", for: .userId)

            // Update state
            currentUser = response.user
            isAuthenticated = true

            // Start session monitoring
            startSessionMonitoring()

            // Schedule automatic token refresh
            scheduleTokenRefresh()

            return true

        } catch let error as AuthenticationService.AuthError {
            errorMessage = error.errorDescription
            return false
        } catch {
            errorMessage = "An unexpected error occurred: \(error.localizedDescription)"
            return false
        }
    }

    /// Login with biometric authentication
    func loginWithBiometric() async -> Bool {
        isLoading = true
        errorMessage = nil

        defer { isLoading = false }

        do {
            // Authenticate with biometrics
            let authenticated = try await keychainManager.authenticateWithBiometrics(
                reason: "Authenticate to access Fleet Manager"
            )

            guard authenticated else {
                errorMessage = "Biometric authentication failed"
                return false
            }

            // Get stored token
            guard let token = try? await keychainManager.getAccessToken() else {
                errorMessage = "No stored credentials found"
                isBiometricEnabled = false
                return false
            }

            // Check if token is expired
            let isExpired = await keychainManager.isTokenExpired()

            if isExpired {
                // Try to refresh token
                return await attemptTokenRefresh()
            } else {
                // Fetch user profile
                await fetchUserProfile(token: token)
                return isAuthenticated
            }

        } catch {
            errorMessage = "Biometric authentication failed"
            return false
        }
    }

    // MARK: - Logout

    /// Logout user and clear all session data
    func logout() async {
        isLoading = true
        defer { isLoading = false }

        // Stop session monitoring
        stopSessionMonitoring()

        // Cancel token refresh task
        tokenRefreshTask?.cancel()
        tokenRefreshTask = nil

        do {
            // Try to logout on server
            if let token = try? await keychainManager.getAccessToken() {
                try? await authService.logout(token: token)
            }
        } catch {
            print("Logout API error (continuing with local cleanup): \(error.localizedDescription)")
        }

        // Clear keychain data
        do {
            try keychainManager.clearAuthenticationData()
        } catch {
            print("Keychain cleanup error: \(error.localizedDescription)")
        }

        // Clear state
        isAuthenticated = false
        currentUser = nil
        errorMessage = nil
    }

    // MARK: - Token Management

    /// Check if token needs refresh and refresh if necessary
    private func checkAndRefreshToken() async {
        let isExpired = await keychainManager.isTokenExpired()

        if isExpired {
            await attemptTokenRefresh()
        }
    }

    /// Attempt to refresh access token
    @discardableResult
    private func attemptTokenRefresh() async -> Bool {
        do {
            guard let refreshToken = try await keychainManager.getRefreshToken() else {
                // No refresh token available - logout
                await logout()
                errorMessage = "Session expired. Please login again."
                return false
            }

            // Refresh token
            let response = try await authService.refreshToken(refreshToken)

            // Save new tokens
            try await keychainManager.saveTokens(
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                expiresIn: response.expiresIn
            )

            // Fetch updated user profile
            await fetchUserProfile(token: response.accessToken)

            // Schedule next refresh
            scheduleTokenRefresh()

            return true

        } catch {
            // Token refresh failed - logout
            await logout()
            errorMessage = "Session expired. Please login again."
            return false
        }
    }

    /// Schedule automatic token refresh before expiry
    private func scheduleTokenRefresh() {
        // Cancel existing task
        tokenRefreshTask?.cancel()

        tokenRefreshTask = Task {
            do {
                // Wait until 5 minutes before token expiry
                let expiryString = try await keychainManager.retrieve(for: .tokenExpiry)
                guard let expiryDate = ISO8601DateFormatter().date(from: expiryString) else {
                    return
                }

                let refreshTime = expiryDate.addingTimeInterval(-300) // 5 minutes before expiry
                let timeInterval = refreshTime.timeIntervalSinceNow

                if timeInterval > 0 {
                    try await Task.sleep(nanoseconds: UInt64(timeInterval * 1_000_000_000))

                    // Check if task was cancelled
                    guard !Task.isCancelled else { return }

                    // Refresh token
                    await attemptTokenRefresh()
                }
            } catch {
                print("Token refresh scheduling error: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - User Profile

    /// Fetch current user profile
    private func fetchUserProfile(token: String) async {
        do {
            let user = try await authService.fetchUserProfile(token: token)
            currentUser = user
            isAuthenticated = true
        } catch {
            // Profile fetch failed - logout
            await logout()
            errorMessage = "Failed to load user profile"
        }
    }

    /// Reload current user profile
    func reloadUserProfile() async {
        guard let token = try? await keychainManager.getAccessToken() else {
            return
        }

        await fetchUserProfile(token: token)
    }

    // MARK: - Biometric Management

    /// Enable biometric authentication
    func enableBiometric() async -> Bool {
        do {
            // Verify biometric authentication works
            let authenticated = try await keychainManager.authenticateWithBiometrics(
                reason: "Authenticate to enable \(biometricType)"
            )

            guard authenticated else {
                errorMessage = "Biometric authentication failed"
                return false
            }

            // Save preference
            try keychainManager.save("true", for: .biometricEnabled)
            isBiometricEnabled = true

            return true
        } catch {
            errorMessage = "Failed to enable \(biometricType)"
            return false
        }
    }

    /// Disable biometric authentication
    func disableBiometric() {
        do {
            try keychainManager.delete(for: .biometricEnabled)
            isBiometricEnabled = false
        } catch {
            print("Failed to disable biometric: \(error.localizedDescription)")
        }
    }

    // MARK: - Helper Methods

    /// Validate email format
    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }

    /// Get current access token (for API calls)
    func getAccessToken() async -> String? {
        // Check if token is expired
        let isExpired = await keychainManager.isTokenExpired()

        if isExpired {
            // Try to refresh token
            let refreshed = await attemptTokenRefresh()
            guard refreshed else { return nil }
        }

        // Return current token
        return try? await keychainManager.getAccessToken()
    }

    /// Clear error message
    func clearError() {
        errorMessage = nil
    }
}

// MARK: - Session State

extension AuthenticationManager {

    /// Session information for debugging/monitoring
    struct SessionInfo {
        let isAuthenticated: Bool
        let userEmail: String?
        let userId: String?
        let tokenExpiresAt: Date?
        let biometricEnabled: Bool
        let biometricType: String
    }

    /// Get current session information
    func getSessionInfo() async -> SessionInfo {
        let email = try? await keychainManager.retrieve(for: .userEmail)
        let userId = try? await keychainManager.retrieve(for: .userId)

        var expiryDate: Date?
        if let expiryString = try? await keychainManager.retrieve(for: .tokenExpiry) {
            expiryDate = ISO8601DateFormatter().date(from: expiryString)
        }

        return SessionInfo(
            isAuthenticated: isAuthenticated,
            userEmail: email,
            userId: userId,
            tokenExpiresAt: expiryDate,
            biometricEnabled: isBiometricEnabled,
            biometricType: biometricType
        )
    }

    #if DEBUG
    /// Mock authentication for development/testing
    func mockAuthentication() {
        isAuthenticated = true
        currentUser = AuthenticationService.User(
            id: 1,
            email: "dev@capitaltechalliance.com",
            name: "Development User",
            role: "admin",
            organizationId: 1
        )
        errorMessage = nil
    }
    #endif
}
