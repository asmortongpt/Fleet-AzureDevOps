import SwiftUI

// MARK: - Root View with Authentication Gate
struct RootView: View {
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator
    @StateObject private var authManager = AuthenticationManager.shared
    @State private var isLoading = true
    @State private var email = ""
    @State private var password = ""

    var body: some View {
        Group {
            if isLoading {
                loadingView
            } else if authManager.isAuthenticated {
                MainTabView()
                    .environmentObject(authManager)
                    .transition(AnyTransition.opacity)
            } else {
                loginView
                    .transition(AnyTransition.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: isLoading)
        .animation(.easeInOut(duration: 0.3), value: authManager.isAuthenticated)
        .onAppear {
            checkAuthenticationStatus()
        }
        .onChange(of: authManager.isAuthenticated) { newValue in
            if newValue {
                navigationCoordinator.resetToHome()
            }
        }
    }

    // MARK: - Loading View
    private var loadingView: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.95, green: 0.96, blue: 0.98),
                    Color.white
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 24) {
                // App logo/icon
                Image(systemName: "car.2.fill")
                    .font(.system(size: 80))
                    .foregroundColor(.blue)
                    .symbolRenderingMode(.hierarchical)

                VStack(spacing: 8) {
                    Text("Fleet Manager")
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)

                    Text("Capital Tech Alliance")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                ProgressView()
                    .scaleEffect(1.2)
                    .progressViewStyle(CircularProgressViewStyle(tint: .blue))
                    .padding(.top, 16)
            }
        }
    }

    // MARK: - Login View Placeholder
    private var loginView: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.95, green: 0.96, blue: 0.98),
                    Color.white
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 32) {
                // App branding
                VStack(spacing: 16) {
                    Image(systemName: "car.2.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.blue)
                        .symbolRenderingMode(.hierarchical)

                    VStack(spacing: 8) {
                        Text("Fleet Manager")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)

                        Text("Capital Tech Alliance")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.bottom, 32)

                // Login form
                VStack(spacing: 16) {
                    Text("Sign In")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    // Email field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Email")
                            .font(.subheadline)
                            .foregroundColor(.secondary)

                        TextField("email@example.com", text: $email)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .textContentType(.emailAddress)
                            .autocapitalization(.none)
                            .keyboardType(.emailAddress)
                    }

                    // Password field
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Password")
                            .font(.subheadline)
                            .foregroundColor(.secondary)

                        SecureField("Password", text: $password)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .textContentType(.password)
                    }

                    // Error message
                    if let error = authManager.errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundColor(.red)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    // Login button
                    Button(action: {
                        Task {
                            let success = await authManager.login(email: email, password: password)
                            if success {
                                // Clear password on successful login
                                password = ""
                            }
                        }
                    }) {
                        HStack {
                            if authManager.isLoading {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            }
                            Text(authManager.isLoading ? "Signing In..." : "Sign In")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            LinearGradient(
                                gradient: Gradient(colors: [Color.blue, Color.blue.opacity(0.8)]),
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    .disabled(authManager.isLoading || email.isEmpty || password.isEmpty)
                    .padding(.top, 8)

                    // Biometric login option (if available)
                    if authManager.isBiometricEnabled {
                        Button(action: {
                            Task {
                                await authManager.loginWithBiometric()
                            }
                        }) {
                            HStack {
                                Image(systemName: authManager.biometricType == "Face ID" ? "faceid" : "touchid")
                                Text("Sign in with \(authManager.biometricType)")
                            }
                            .foregroundColor(.blue)
                            .font(.subheadline)
                        }
                        .padding(.top, 8)
                    }
                }
                .padding(.horizontal, 32)
                .padding(.vertical, 24)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(Color.white)
                        .shadow(color: Color.black.opacity(0.1), radius: 10, x: 0, y: 5)
                )
                .padding(.horizontal, 24)

                Spacer()

                // Version info
                Text("Version \(FleetManagementApp.fullVersion)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.bottom, 16)
            }
            .padding(.top, 60)
        }
    }

    // MARK: - Authentication Check
    private func checkAuthenticationStatus() {
        Task {
            // Simulate loading delay for splash screen
            try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second

            await MainActor.run {
                #if DEBUG
                // In DEBUG mode, automatically authenticate for development
                authManager.mockAuthentication()
                #endif

                // The AuthenticationManager automatically checks for existing session on init
                withAnimation {
                    isLoading = false
                }
            }
        }
    }
}

// MARK: - Preview Provider
struct RootView_Previews: PreviewProvider {
    static var previews: some View {
        RootView()
            .environmentObject(NavigationCoordinator())
            .environmentObject(AzureNetworkManager())
    }
}
