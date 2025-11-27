import SwiftUI
import Combine

class AuthenticationManager: ObservableObject {
    @Published var isAuthenticated: Bool = false
    @Published var currentUser: User?
    @Published var userRole: UserRole = .viewer

    init() {
        // Check if user was previously authenticated
        checkStoredAuthentication()
    }

    func login(role: UserRole, username: String) {
        // In a real app, this would validate against a backend
        // For demo purposes, we'll accept any login
        self.userRole = role
        self.currentUser = User(
            id: UUID(),
            username: username,
            email: "\(username)@fleet.com",
            role: role,
            firstName: username.capitalized,
            lastName: "User"
        )
        self.isAuthenticated = true

        // Store authentication state
        UserDefaults.standard.set(true, forKey: "isAuthenticated")
        UserDefaults.standard.set(role.rawValue, forKey: "userRole")
        UserDefaults.standard.set(username, forKey: "username")
    }

    func logout() {
        self.isAuthenticated = false
        self.currentUser = nil
        self.userRole = .viewer

        // Clear stored authentication
        UserDefaults.standard.removeObject(forKey: "isAuthenticated")
        UserDefaults.standard.removeObject(forKey: "userRole")
        UserDefaults.standard.removeObject(forKey: "username")
    }

    private func checkStoredAuthentication() {
        if UserDefaults.standard.bool(forKey: "isAuthenticated"),
           let roleString = UserDefaults.standard.string(forKey: "userRole"),
           let role = UserRole(rawValue: roleString),
           let username = UserDefaults.standard.string(forKey: "username") {
            // Restore previous session
            self.login(role: role, username: username)
        }
    }
}

struct User: Identifiable, Codable {
    let id: UUID
    let username: String
    let email: String
    let role: UserRole
    let firstName: String
    let lastName: String

    var fullName: String {
        "\(firstName) \(lastName)"
    }
}
