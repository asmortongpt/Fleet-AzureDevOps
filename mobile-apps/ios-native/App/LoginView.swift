//
//  LoginView.swift
//  Fleet Manager - Login Screen
//
//  Modern SwiftUI login interface with biometric authentication support
//  Integrates with AuthenticationManager following MVVM pattern
//

import SwiftUI

// MARK: - Login View

struct LoginView: View {
    @StateObject private var authManager = AuthenticationManager.shared
    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var rememberMe = false
    @State private var showingBiometricPrompt = false

    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.1, green: 0.3, blue: 0.6),
                    Color(red: 0.2, green: 0.5, blue: 0.8)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            ScrollView {
                VStack(spacing: 0) {
                    Spacer()
                        .frame(height: 60)

                    // Logo and header
                    headerSection

                    Spacer()
                        .frame(height: 50)

                    // Login form card
                    loginFormCard

                    Spacer()
                        .frame(height: 30)

                    // Footer
                    footerSection

                    Spacer()
                        .frame(height: 40)
                }
                .padding(.horizontal, 24)
            }

            // Loading overlay
            if authManager.isLoading {
                LoadingOverlay()
            }
        }
        .onAppear {
            loadSavedEmail()
        }
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(spacing: 16) {
            // App Icon
            Image(systemName: "car.2.fill")
                .font(.system(size: 70))
                .foregroundColor(.white)
                .symbolRenderingMode(.hierarchical)
                .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)

            // Title
            Text("Fleet Manager")
                .font(.system(size: 36, weight: .bold, design: .rounded))
                .foregroundColor(.white)

            // Subtitle
            Text("Capital Tech Alliance")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.white.opacity(0.9))
        }
    }

    // MARK: - Login Form Card

    private var loginFormCard: some View {
        VStack(spacing: 24) {
            // Welcome text
            VStack(spacing: 8) {
                Text("Welcome Back")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundColor(.primary)

                Text("Sign in to continue")
                    .font(.system(size: 15))
                    .foregroundColor(.secondary)
            }
            .padding(.top, 8)

            // Error message
            if let errorMessage = authManager.errorMessage {
                ErrorBanner(message: errorMessage) {
                    authManager.clearError()
                }
            }

            // Email field
            VStack(alignment: .leading, spacing: 8) {
                Label("Email", systemImage: "envelope.fill")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.secondary)

                TextField("you@company.com", text: $email)
                    .textContentType(.emailAddress)
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.blue.opacity(0.3), lineWidth: 1)
                    )
            }

            // Password field
            VStack(alignment: .leading, spacing: 8) {
                Label("Password", systemImage: "lock.fill")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.secondary)

                HStack {
                    if showPassword {
                        TextField("Enter password", text: $password)
                            .textContentType(.password)
                    } else {
                        SecureField("Enter password", text: $password)
                            .textContentType(.password)
                    }

                    Button(action: { showPassword.toggle() }) {
                        Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                            .foregroundColor(.secondary)
                    }
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.blue.opacity(0.3), lineWidth: 1)
                )
            }

            // Remember me
            HStack {
                Toggle(isOn: $rememberMe) {
                    Text("Remember me")
                        .font(.system(size: 14))
                        .foregroundColor(.secondary)
                }
                .toggleStyle(SwitchToggleStyle(tint: .blue))

                Spacer()

                Button(action: {
                    // Forgot password action
                }) {
                    Text("Forgot Password?")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.blue)
                }
            }

            // Login button
            Button(action: {
                Task {
                    await performLogin()
                }
            }) {
                HStack {
                    if !authManager.isLoading {
                        Image(systemName: "arrow.right.circle.fill")
                            .font(.system(size: 20))
                    }
                    Text("Sign In")
                        .font(.system(size: 18, weight: .semibold))
                }
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(
                    LinearGradient(
                        gradient: Gradient(colors: [
                            Color.blue,
                            Color.blue.opacity(0.8)
                        ]),
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(12)
                .shadow(color: .blue.opacity(0.3), radius: 8, x: 0, y: 4)
            }
            .disabled(authManager.isLoading || email.isEmpty || password.isEmpty)
            .opacity((authManager.isLoading || email.isEmpty || password.isEmpty) ? 0.6 : 1.0)

            // Biometric login button
            if authManager.isBiometricEnabled {
                Divider()
                    .padding(.vertical, 8)

                Button(action: {
                    Task {
                        await performBiometricLogin()
                    }
                }) {
                    HStack {
                        Image(systemName: authManager.biometricType == "Face ID" ? "faceid" : "touchid")
                            .font(.system(size: 20))
                        Text("Sign in with \(authManager.biometricType)")
                            .font(.system(size: 16, weight: .medium))
                    }
                    .foregroundColor(.blue)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.blue.opacity(0.3), lineWidth: 1.5)
                    )
                }
                .disabled(authManager.isLoading)
            }
        }
        .padding(28)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.1), radius: 20, x: 0, y: 10)
        )
    }

    // MARK: - Footer Section

    private var footerSection: some View {
        VStack(spacing: 16) {
            // Connection status
            ConnectionStatusIndicator()

            // Version info
            Text("Version \(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0")")
                .font(.system(size: 12))
                .foregroundColor(.white.opacity(0.7))

            // Support link
            Button(action: {
                // Support action
            }) {
                Text("Need help? Contact Support")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.white.opacity(0.9))
                    .underline()
            }
        }
    }

    // MARK: - Actions

    private func performLogin() async {
        // Hide keyboard
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)

        let success = await authManager.login(email: email, password: password)

        if success {
            // Save email if remember me is enabled
            if rememberMe {
                UserDefaults.standard.set(email, forKey: "saved_email")
            } else {
                UserDefaults.standard.removeObject(forKey: "saved_email")
            }

            // Offer to enable biometric authentication
            if !authManager.isBiometricEnabled {
                showingBiometricPrompt = true
            }
        }
    }

    private func performBiometricLogin() async {
        await authManager.loginWithBiometric()
    }

    private func loadSavedEmail() {
        if let savedEmail = UserDefaults.standard.string(forKey: "saved_email") {
            email = savedEmail
            rememberMe = true
        }
    }
}

// MARK: - Error Banner

struct ErrorBanner: View {
    let message: String
    let onDismiss: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.red)
                .font(.system(size: 20))

            Text(message)
                .font(.system(size: 14))
                .foregroundColor(.primary)
                .multilineTextAlignment(.leading)

            Spacer()

            Button(action: onDismiss) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.secondary)
                    .font(.system(size: 20))
            }
        }
        .padding()
        .background(Color.red.opacity(0.1))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.red.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - Loading Overlay

struct LoadingOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()

            VStack(spacing: 20) {
                ProgressView()
                    .scaleEffect(1.5)
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))

                Text("Signing in...")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundColor(.white)
            }
            .padding(40)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color(.systemGray))
                    .shadow(radius: 20)
            )
        }
    }
}

// MARK: - Connection Status Indicator

struct ConnectionStatusIndicator: View {
    @State private var isConnected = false
    @State private var isChecking = true

    var body: some View {
        HStack(spacing: 8) {
            if isChecking {
                ProgressView()
                    .scaleEffect(0.7)
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
            } else {
                Circle()
                    .fill(isConnected ? Color.green : Color.red)
                    .frame(width: 8, height: 8)
            }

            Text(statusText)
                .font(.system(size: 13))
                .foregroundColor(.white.opacity(0.9))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(
            Capsule()
                .fill(Color.white.opacity(0.2))
        )
        .onAppear {
            Task {
                await checkConnection()
            }
        }
    }

    private var statusText: String {
        if isChecking {
            return "Checking connection..."
        } else {
            return isConnected ? "Connected to Fleet services" : "No connection"
        }
    }

    private func checkConnection() async {
        isChecking = true
        let status = await APIConfiguration.testConnection()
        isConnected = status.isConnected
        isChecking = false
    }
}

// MARK: - Preview

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            LoginView()
                .preferredColorScheme(.light)
                .previewDisplayName("Light Mode")

            LoginView()
                .preferredColorScheme(.dark)
                .previewDisplayName("Dark Mode")
        }
    }
}

// MARK: - Main App Integration Example

struct AuthenticatedAppView: View {
    @StateObject private var authManager = AuthenticationManager.shared

    var body: some View {
        Group {
            if authManager.isAuthenticated {
                // Main app content goes here
                MainAppContent()
            } else {
                LoginView()
            }
        }
    }
}

struct MainAppContent: View {
    @StateObject private var authManager = AuthenticationManager.shared

    var body: some View {
        NavigationView {
            VStack {
                if let user = authManager.currentUser {
                    Text("Welcome, \(user.name)")
                        .font(.title)
                        .padding()

                    Text("Email: \(user.email)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Text("Role: \(user.role)")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Spacer()

                    // Logout button
                    Button(action: {
                        Task {
                            await authManager.logout()
                        }
                    }) {
                        HStack {
                            Image(systemName: "arrow.right.square.fill")
                            Text("Sign Out")
                        }
                        .foregroundColor(.white)
                        .font(.headline)
                        .padding(.horizontal, 32)
                        .padding(.vertical, 14)
                        .background(Color.red)
                        .cornerRadius(12)
                    }
                    .padding()
                }
            }
            .navigationTitle("Fleet Manager")
        }
    }
}
