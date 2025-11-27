import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var selectedUserType: UserRole = .driver
    @State private var username: String = ""
    @State private var password: String = ""
    @State private var showingError = false
    @State private var errorMessage = ""

    var body: some View {
        NavigationView {
            ZStack {
                // Background gradient
                LinearGradient(
                    gradient: Gradient(colors: [Color.blue.opacity(0.6), Color.blue.opacity(0.3)]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 30) {
                        // Logo and title
                        VStack(spacing: 16) {
                            Image(systemName: "car.fill")
                                .resizable()
                                .scaledToFit()
                                .frame(width: 80, height: 80)
                                .foregroundColor(.white)

                            Text("Fleet Management")
                                .font(.system(size: 32, weight: .bold))
                                .foregroundColor(.white)

                            Text("Sign in to continue")
                                .font(.subheadline)
                                .foregroundColor(.white.opacity(0.8))
                        }
                        .padding(.top, 60)

                        // Login form
                        VStack(spacing: 20) {
                            // Username field
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Username")
                                    .font(.subheadline)
                                    .foregroundColor(.white.opacity(0.9))

                                TextField("Enter username", text: $username)
                                    .textFieldStyle(.plain)
                                    .padding()
                                    .background(Color.white.opacity(0.2))
                                    .cornerRadius(10)
                                    .foregroundColor(.white)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                            }

                            // Password field
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Password")
                                    .font(.subheadline)
                                    .foregroundColor(.white.opacity(0.9))

                                SecureField("Enter password", text: $password)
                                    .textFieldStyle(.plain)
                                    .padding()
                                    .background(Color.white.opacity(0.2))
                                    .cornerRadius(10)
                                    .foregroundColor(.white)
                            }

                            // User type selector
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Select User Type")
                                    .font(.subheadline)
                                    .foregroundColor(.white.opacity(0.9))

                                VStack(spacing: 12) {
                                    ForEach([UserRole.admin, UserRole.manager, UserRole.driver, UserRole.viewer], id: \.self) { role in
                                        UserTypeButton(
                                            role: role,
                                            isSelected: selectedUserType == role,
                                            action: { selectedUserType = role }
                                        )
                                    }
                                }
                            }

                            // Login button
                            Button(action: handleLogin) {
                                HStack {
                                    Text("Sign In")
                                        .fontWeight(.semibold)

                                    Image(systemName: "arrow.right")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white)
                                .foregroundColor(.blue)
                                .cornerRadius(10)
                            }
                            .padding(.top, 10)
                            .disabled(username.isEmpty || password.isEmpty)
                            .opacity(username.isEmpty || password.isEmpty ? 0.6 : 1.0)

                            // Demo credentials hint
                            VStack(spacing: 8) {
                                Text("Demo Credentials")
                                    .font(.caption)
                                    .foregroundColor(.white.opacity(0.7))

                                Text("Username: demo")
                                    .font(.caption2)
                                    .foregroundColor(.white.opacity(0.6))
                                Text("Password: demo123")
                                    .font(.caption2)
                                    .foregroundColor(.white.opacity(0.6))
                            }
                            .padding(.top, 10)
                        }
                        .padding(.horizontal, 30)
                        .padding(.top, 20)

                        Spacer()
                    }
                }
            }
            .navigationBarHidden(true)
            .alert("Login Failed", isPresented: $showingError) {
                Button("OK", role: .cancel) { }
            } message: {
                Text(errorMessage)
            }
        }
    }

    private func handleLogin() {
        // Simple demo authentication
        if username.lowercased() == "demo" && password == "demo123" {
            authManager.login(role: selectedUserType, username: username)
        } else {
            errorMessage = "Invalid credentials. Please use demo/demo123"
            showingError = true
        }
    }
}

struct UserTypeButton: View {
    let role: UserRole
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: iconName)
                    .font(.title3)
                    .frame(width: 30)

                VStack(alignment: .leading, spacing: 4) {
                    Text(role.displayName)
                        .font(.headline)
                    Text(roleDescription)
                        .font(.caption)
                        .opacity(0.8)
                }

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                        .font(.title3)
                }
            }
            .padding()
            .background(isSelected ? Color.white.opacity(0.3) : Color.white.opacity(0.15))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(isSelected ? Color.white.opacity(0.6) : Color.clear, lineWidth: 2)
            )
        }
        .foregroundColor(.white)
    }

    private var iconName: String {
        switch role {
        case .admin:
            return "person.badge.key.fill"
        case .manager:
            return "person.3.fill"
        case .driver:
            return "steeringwheel"
        case .viewer:
            return "eye.fill"
        }
    }

    private var roleDescription: String {
        switch role {
        case .admin:
            return "Full system access and control"
        case .manager:
            return "Manage fleet and drivers"
        case .driver:
            return "Track trips and view assignments"
        case .viewer:
            return "View-only access to reports"
        }
    }
}

#Preview {
    LoginView()
        .environmentObject(AuthenticationManager())
}
