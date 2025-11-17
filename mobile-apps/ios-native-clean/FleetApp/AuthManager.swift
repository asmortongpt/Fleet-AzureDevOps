import Foundation
import SwiftUI
import Combine

class AuthManager: ObservableObject {
    static let shared = AuthManager()

    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let baseURL = "https://fleet.capitaltechalliance.com/api"
    private let keychainKey = "com.capitaltechalliance.fleet.token"

    private init() {
        // Check for saved token on init
        checkAuthStatus()
    }

    func checkAuthStatus() {
        if let token = KeychainHelper.load(key: keychainKey) {
            // Validate token with backend
            Task {
                await validateToken(token)
            }
        }
    }

    @MainActor
    func login(email: String, password: String) async {
        isLoading = true
        errorMessage = nil

        do {
            let request = LoginRequest(email: email, password: password)
            let response: LoginResponse = try await APIClient.shared.post(
                endpoint: "/auth/login",
                body: request
            )

            // Save token to keychain
            KeychainHelper.save(key: keychainKey, data: response.token)

            // Update state
            currentUser = response.user
            isAuthenticated = true
            isLoading = false

            print("✅ Login successful: \(response.user.email)")
        } catch {
            errorMessage = error.localizedDescription
            isLoading = false
            print("❌ Login failed: \(error)")
        }
    }

    @MainActor
    func logout() {
        // Clear keychain
        KeychainHelper.delete(key: keychainKey)

        // Reset state
        isAuthenticated = false
        currentUser = nil

        print("👋 User logged out")
    }

    private func validateToken(_ token: String) async {
        // Validate token with backend
        // For now, just set authenticated
        await MainActor.run {
            self.isAuthenticated = true
        }
    }
}

// MARK: - Models
struct LoginRequest: Codable {
    let email: String
    let password: String
}

struct LoginResponse: Codable {
    let token: String
    let user: User
}

struct User: Codable, Identifiable {
    let id: String
    let email: String
    let name: String
    let role: String
}
