//
//  AccessibleLoginView.swift
//  Fleet Manager - Fully Accessible Login Screen
//
//  Example of implementing comprehensive accessibility features
//  Demonstrates VoiceOver, Dynamic Type, Reduce Motion, and High Contrast support
//

import SwiftUI

// MARK: - Accessible Login View

struct AccessibleLoginView: View {
    @StateObject private var authManager = AuthenticationManager.shared
    @StateObject private var accessibilityManager = AccessibilityManager.shared
    @StateObject private var localizationManager = LocalizationManager.shared

    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    @State private var rememberMe = false
    @State private var showingBiometricPrompt = false
    @FocusState private var focusedField: Field?

    enum Field {
        case email
        case password
    }

    var body: some View {
        ZStack {
            // Background gradient
            backgroundGradient
                .ignoresSafeArea()
                .accessibilityHidden(true) // Decorative element

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
            .accessibilityElement(children: .contain)
            .accessibilityLabel("auth.welcome_back".localized)

            // Loading overlay
            if authManager.isLoading {
                AccessibleLoadingOverlay()
            }
        }
        .localizedEnvironment()
        .onAppear {
            loadSavedEmail()
            accessibilityManager.notifyScreenChanged()
            accessibilityManager.announceLocalized("auth.welcome_back")
        }
    }

    // MARK: - Background Gradient

    private var backgroundGradient: some View {
        LinearGradient(
            gradient: Gradient(colors: [
                Color(red: 0.1, green: 0.3, blue: 0.6),
                Color(red: 0.2, green: 0.5, blue: 0.8)
            ]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // MARK: - Header Section

    private var headerSection: some View {
        VStack(spacing: 16) {
            // App Icon
            Image(systemName: "car.2.fill")
                .font(.system(size: accessibilityManager.scaledFontSize(70)))
                .foregroundColor(.white)
                .symbolRenderingMode(.hierarchical)
                .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
                .accessibilityLabel("app.name".localized)
                .accessibilityAddTraits(.isImage)

            // Title
            Text("app.name".localized)
                .font(.system(
                    size: accessibilityManager.scaledFontSize(36),
                    weight: .bold,
                    design: .rounded
                ))
                .foregroundColor(.white)
                .accessibilityHeading(level: 1)

            // Subtitle
            Text("app.tagline".localized)
                .font(.system(
                    size: accessibilityManager.scaledFontSize(16),
                    weight: .medium
                ))
                .foregroundColor(.white.opacity(0.9))
        }
        .accessibilityElement(children: .combine)
    }

    // MARK: - Login Form Card

    private var loginFormCard: some View {
        VStack(spacing: 24) {
            // Welcome text
            VStack(spacing: 8) {
                Text("auth.welcome_back".localized)
                    .font(.system(
                        size: accessibilityManager.scaledFontSize(28),
                        weight: .bold
                    ))
                    .foregroundColor(.primary)
                    .accessibilityHeading(level: 2)

                Text("auth.sign_in_to_continue".localized)
                    .font(.system(size: accessibilityManager.scaledFontSize(15)))
                    .foregroundColor(.secondary)
            }
            .padding(.top, 8)

            // Error message
            if let errorMessage = authManager.errorMessage {
                AccessibleErrorBanner(message: errorMessage) {
                    authManager.clearError()
                }
            }

            // Email field
            VStack(alignment: localizationManager.horizontalAlignment, spacing: 8) {
                Label("auth.email".localized, systemImage: "envelope.fill")
                    .font(.system(
                        size: accessibilityManager.scaledFontSize(14),
                        weight: .semibold
                    ))
                    .foregroundColor(.secondary)

                TextField("auth.email_placeholder".localized, text: $email)
                    .textContentType(.emailAddress)
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                    .focused($focusedField, equals: .email)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(
                                focusedField == .email ? Color.blue : Color.blue.opacity(0.3),
                                lineWidth: focusedField == .email ? 2 : 1
                            )
                    )
                    .accessibilityLabel("auth.email".localized)
                    .accessibilityHint("accessibility.hint.tap_to_edit".localized)
                    .accessibilityValue(email.isEmpty ? "auth.email_placeholder".localized : email)
                    .accessibleTouchTarget()
            }

            // Password field
            VStack(alignment: localizationManager.horizontalAlignment, spacing: 8) {
                Label("auth.password".localized, systemImage: "lock.fill")
                    .font(.system(
                        size: accessibilityManager.scaledFontSize(14),
                        weight: .semibold
                    ))
                    .foregroundColor(.secondary)

                HStack {
                    Group {
                        if showPassword {
                            TextField("auth.password_placeholder".localized, text: $password)
                                .textContentType(.password)
                        } else {
                            SecureField("auth.password_placeholder".localized, text: $password)
                                .textContentType(.password)
                        }
                    }
                    .focused($focusedField, equals: .password)

                    Button(action: {
                        showPassword.toggle()
                        let announcement = showPassword ? "Password visible" : "Password hidden"
                        accessibilityManager.announce(announcement)
                    }) {
                        Image(systemName: showPassword ? "eye.slash.fill" : "eye.fill")
                            .foregroundColor(.secondary)
                            .frame(width: 44, height: 44) // Minimum touch target
                    }
                    .accessibilityLabel(showPassword ? "Hide password" : "Show password")
                    .accessibilityHint("accessibility.hint.double_tap_to_activate".localized)
                    .accessibilityAddTraits(.isButton)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(
                            focusedField == .password ? Color.blue : Color.blue.opacity(0.3),
                            lineWidth: focusedField == .password ? 2 : 1
                        )
                )
                .accessibilityElement(children: .contain)
                .accessibilityLabel("auth.password".localized)
                .accessibleTouchTarget()
            }

            // Remember me and forgot password
            HStack {
                Toggle(isOn: $rememberMe) {
                    Text("auth.remember_me".localized)
                        .font(.system(size: accessibilityManager.scaledFontSize(14)))
                        .foregroundColor(.secondary)
                }
                .toggleStyle(SwitchToggleStyle(tint: .blue))
                .accessibilityLabel("auth.remember_me".localized)
                .accessibilityValue(rememberMe ? "accessibility.value.checked".localized : "accessibility.value.unchecked".localized)
                .accessibleTouchTarget()

                Spacer()

                Button(action: {
                    accessibilityManager.announce("Opening forgot password")
                }) {
                    Text("auth.forgot_password".localized)
                        .font(.system(
                            size: accessibilityManager.scaledFontSize(14),
                            weight: .medium
                        ))
                        .foregroundColor(.blue)
                }
                .accessibilityLabel("auth.forgot_password".localized)
                .accessibilityHint("accessibility.hint.double_tap_to_activate".localized)
                .accessibilityAddTraits(.isButton)
                .accessibleTouchTarget()
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
                            .font(.system(size: accessibilityManager.scaledFontSize(20)))
                            .accessibilityHidden(true)
                    }
                    Text("auth.sign_in".localized)
                        .font(.system(
                            size: accessibilityManager.scaledFontSize(18),
                            weight: .semibold
                        ))
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
                        startPoint: localizationManager.isRTL ? .trailing : .leading,
                        endPoint: localizationManager.isRTL ? .leading : .trailing
                    )
                )
                .cornerRadius(12)
                .shadow(
                    color: .blue.opacity(0.3),
                    radius: accessibilityManager.isReduceMotionEnabled ? 4 : 8,
                    x: 0,
                    y: 4
                )
            }
            .disabled(authManager.isLoading || email.isEmpty || password.isEmpty)
            .opacity((authManager.isLoading || email.isEmpty || password.isEmpty) ? 0.6 : 1.0)
            .accessibilityLabel("auth.sign_in".localized)
            .accessibilityHint(email.isEmpty || password.isEmpty ? "Please enter email and password" : "accessibility.hint.double_tap_to_activate".localized)
            .accessibilityAddTraits(.isButton)
            .accessibleTouchTarget()

            // Biometric login button
            if authManager.isBiometricEnabled {
                Divider()
                    .padding(.vertical, 8)
                    .accessibilityHidden(true)

                Button(action: {
                    Task {
                        await performBiometricLogin()
                    }
                }) {
                    HStack {
                        Image(systemName: authManager.biometricType == "Face ID" ? "faceid" : "touchid")
                            .font(.system(size: accessibilityManager.scaledFontSize(20)))
                            .accessibilityHidden(true)
                        Text("auth.sign_in_with_biometric".localized(arguments: authManager.biometricType))
                            .font(.system(
                                size: accessibilityManager.scaledFontSize(16),
                                weight: .medium
                            ))
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
                .accessibilityLabel("auth.sign_in_with_biometric".localized(arguments: authManager.biometricType))
                .accessibilityHint("accessibility.hint.double_tap_to_activate".localized)
                .accessibilityAddTraits(.isButton)
                .accessibleTouchTarget()
            }
        }
        .padding(28)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(Color(.systemBackground))
                .shadow(
                    color: .black.opacity(0.1),
                    radius: accessibilityManager.isReduceMotionEnabled ? 10 : 20,
                    x: 0,
                    y: 10
                )
        )
        .accessibilityElement(children: .contain)
    }

    // MARK: - Footer Section

    private var footerSection: some View {
        VStack(spacing: 16) {
            // Connection status
            AccessibleConnectionStatus()

            // Version info
            Text("app.version".localized(arguments: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"))
                .font(.system(size: accessibilityManager.scaledFontSize(12)))
                .foregroundColor(.white.opacity(0.7))
                .accessibilityLabel("Version information")

            // Support link
            Button(action: {
                accessibilityManager.announce("Opening support")
            }) {
                Text("auth.need_help".localized)
                    .font(.system(
                        size: accessibilityManager.scaledFontSize(13),
                        weight: .medium
                    ))
                    .foregroundColor(.white.opacity(0.9))
                    .underline()
            }
            .accessibilityLabel("auth.need_help".localized)
            .accessibilityHint("accessibility.hint.double_tap_to_activate".localized)
            .accessibilityAddTraits(.isButton)
            .accessibleTouchTarget()
        }
    }

    // MARK: - Actions

    private func performLogin() async {
        // Hide keyboard
        focusedField = nil
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)

        accessibilityManager.announceLocalized("auth.signing_in", priority: .high)

        let success = await authManager.login(email: email, password: password)

        if success {
            // Save email if remember me is enabled
            if rememberMe {
                UserDefaults.standard.set(email, forKey: "saved_email")
            } else {
                UserDefaults.standard.removeObject(forKey: "saved_email")
            }

            accessibilityManager.announce("Sign in successful", priority: .high)

            // Offer to enable biometric authentication
            if !authManager.isBiometricEnabled {
                showingBiometricPrompt = true
            }
        } else {
            if let error = authManager.errorMessage {
                accessibilityManager.announce("Sign in failed: \(error)", priority: .high)
            }
        }
    }

    private func performBiometricLogin() async {
        accessibilityManager.announce("Starting biometric authentication", priority: .high)
        await authManager.loginWithBiometric()
    }

    private func loadSavedEmail() {
        if let savedEmail = UserDefaults.standard.string(forKey: "saved_email") {
            email = savedEmail
            rememberMe = true
        }
    }
}

// MARK: - Accessible Error Banner

struct AccessibleErrorBanner: View {
    let message: String
    let onDismiss: () -> Void
    @StateObject private var accessibilityManager = AccessibilityManager.shared
    @StateObject private var localizationManager = LocalizationManager.shared

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.red)
                .font(.system(size: accessibilityManager.scaledFontSize(20)))
                .accessibilityHidden(true)

            Text(message)
                .font(.system(size: accessibilityManager.scaledFontSize(14)))
                .foregroundColor(.primary)
                .multilineTextAlignment(localizationManager.textAlignment)

            Spacer()

            Button(action: {
                onDismiss()
                accessibilityManager.announce("Error dismissed")
            }) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.secondary)
                    .font(.system(size: accessibilityManager.scaledFontSize(20)))
                    .frame(width: 44, height: 44)
            }
            .accessibilityLabel("accessibility.dismiss".localized)
            .accessibilityHint("accessibility.hint.double_tap_to_activate".localized)
            .accessibilityAddTraits(.isButton)
        }
        .padding()
        .background(Color.red.opacity(0.1))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.red.opacity(0.3), lineWidth: 1)
        )
        .accessibilityElement(children: .contain)
        .accessibilityLabel("error".localized)
        .accessibilityValue(message)
        .onAppear {
            accessibilityManager.announce("Error: \(message)", priority: .high)
        }
    }
}

// MARK: - Accessible Loading Overlay

struct AccessibleLoadingOverlay: View {
    @StateObject private var accessibilityManager = AccessibilityManager.shared
    @StateObject private var localizationManager = LocalizationManager.shared

    var body: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()
                .accessibilityHidden(true)

            VStack(spacing: 20) {
                ProgressView()
                    .scaleEffect(1.5)
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    .accessibilityHidden(true)

                Text("auth.signing_in".localized)
                    .font(.system(
                        size: accessibilityManager.scaledFontSize(16),
                        weight: .medium
                    ))
                    .foregroundColor(.white)
            }
            .padding(40)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color(.systemGray))
                    .shadow(radius: accessibilityManager.isReduceMotionEnabled ? 10 : 20)
            )
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("auth.signing_in".localized)
        .onAppear {
            accessibilityManager.announceLocalized("auth.signing_in", priority: .high)
        }
    }
}

// MARK: - Accessible Connection Status

struct AccessibleConnectionStatus: View {
    @State private var isConnected = false
    @State private var isChecking = true
    @StateObject private var accessibilityManager = AccessibilityManager.shared
    @StateObject private var localizationManager = LocalizationManager.shared

    var body: some View {
        HStack(spacing: 8) {
            if isChecking {
                ProgressView()
                    .scaleEffect(0.7)
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    .accessibilityHidden(true)
            } else {
                Circle()
                    .fill(isConnected ? Color.green : Color.red)
                    .frame(width: 8, height: 8)
                    .accessibilityHidden(true)
            }

            Text(statusText)
                .font(.system(size: accessibilityManager.scaledFontSize(13)))
                .foregroundColor(.white.opacity(0.9))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(
            Capsule()
                .fill(Color.white.opacity(0.2))
        )
        .accessibilityElement(children: .combine)
        .accessibilityLabel(statusText)
        .onAppear {
            Task {
                await checkConnection()
            }
        }
    }

    private var statusText: String {
        if isChecking {
            return "connection.checking".localized
        } else {
            return isConnected ? "connection.connected".localized : "connection.disconnected".localized
        }
    }

    private func checkConnection() async {
        isChecking = true
        let status = await APIConfiguration.testConnection()
        isConnected = status.isConnected
        isChecking = false

        // Announce connection status to VoiceOver users
        accessibilityManager.announce(statusText)
    }
}

// MARK: - Preview

struct AccessibleLoginView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            AccessibleLoginView()
                .previewDisplayName("Light Mode")

            AccessibleLoginView()
                .preferredColorScheme(.dark)
                .previewDisplayName("Dark Mode")

            AccessibleLoginView()
                .environment(\.sizeCategory, .accessibilityExtraExtraExtraLarge)
                .previewDisplayName("Accessibility XXXLarge")

            AccessibleLoginView()
                .environment(\.layoutDirection, .rightToLeft)
                .previewDisplayName("RTL Layout")
        }
    }
}
