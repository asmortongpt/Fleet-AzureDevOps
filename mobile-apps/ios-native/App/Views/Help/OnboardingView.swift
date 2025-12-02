//
//  OnboardingView.swift
//  Fleet Management iOS App
//
//  First-time user onboarding with feature highlights and permissions
//  WCAG 2.1 AA compliant with VoiceOver support
//

import SwiftUI

// MARK: - Onboarding Main View

struct OnboardingView: View {
    @StateObject private var viewModel = OnboardingViewModel()
    @Binding var isPresented: Bool
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            // Background gradient
            backgroundGradient

            // Content
            VStack(spacing: 0) {
                // Skip button
                skipButton
                    .padding(.top, ModernTheme.Spacing.lg)
                    .padding(.horizontal, ModernTheme.Spacing.lg)

                // Page content
                TabView(selection: $viewModel.currentPage) {
                    ForEach(OnboardingPage.allPages.indices, id: \.self) { index in
                        OnboardingPageView(page: OnboardingPage.allPages[index])
                            .tag(index)
                    }
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
                .animation(.easeInOut, value: viewModel.currentPage)

                // Page indicators and navigation
                VStack(spacing: ModernTheme.Spacing.xl) {
                    pageIndicators

                    navigationButtons
                }
                .padding(.horizontal, ModernTheme.Spacing.xl)
                .padding(.bottom, ModernTheme.Spacing.xxxl)
            }
        }
        .ignoresSafeArea()
    }

    // MARK: - Background Gradient

    private var backgroundGradient: some View {
        LinearGradient(
            gradient: Gradient(colors: [
                Color.blue.opacity(0.1),
                Color.purple.opacity(0.05),
                Color.white
            ]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // MARK: - Skip Button

    private var skipButton: some View {
        HStack {
            Spacer()

            Button(action: {
                completeOnboarding()
            }) {
                Text("Skip")
                    .font(ModernTheme.Typography.bodyBold)
                    .foregroundColor(ModernTheme.Colors.primary)
            }
            .accessibilityLabel("Skip onboarding")
            .accessibilityHint("Double tap to skip the introduction and start using the app")
        }
    }

    // MARK: - Page Indicators

    private var pageIndicators: some View {
        HStack(spacing: ModernTheme.Spacing.sm) {
            ForEach(0..<OnboardingPage.allPages.count, id: \.self) { index in
                Circle()
                    .fill(index == viewModel.currentPage ? ModernTheme.Colors.primary : Color.gray.opacity(0.3))
                    .frame(width: 8, height: 8)
                    .scaleEffect(index == viewModel.currentPage ? 1.2 : 1.0)
                    .animation(.spring(), value: viewModel.currentPage)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Page \(viewModel.currentPage + 1) of \(OnboardingPage.allPages.count)")
    }

    // MARK: - Navigation Buttons

    private var navigationButtons: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            if viewModel.currentPage > 0 {
                Button(action: {
                    withAnimation {
                        viewModel.previousPage()
                    }
                }) {
                    HStack {
                        Image(systemName: "chevron.left")
                        Text("Back")
                    }
                    .font(ModernTheme.Typography.bodyBold)
                    .foregroundColor(ModernTheme.Colors.primary)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.white)
                    .cornerRadius(ModernTheme.CornerRadius.md)
                    .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
                }
                .accessibilityLabel("Go back to previous page")
                .transition(.move(edge: .leading).combined(with: .opacity))
            }

            Button(action: {
                if viewModel.isLastPage {
                    completeOnboarding()
                } else {
                    withAnimation {
                        viewModel.nextPage()
                    }
                }
            }) {
                HStack {
                    Text(viewModel.isLastPage ? "Get Started" : "Next")
                    if !viewModel.isLastPage {
                        Image(systemName: "chevron.right")
                    }
                }
                .font(ModernTheme.Typography.bodyBold)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding()
                .background(ModernTheme.Colors.primary)
                .cornerRadius(ModernTheme.CornerRadius.md)
                .shadow(color: ModernTheme.Colors.primary.opacity(0.3), radius: 8, x: 0, y: 4)
            }
            .accessibilityLabel(viewModel.isLastPage ? "Get started with Fleet Management" : "Go to next page")
        }
        .frame(height: 50)
    }

    // MARK: - Helper Methods

    private func completeOnboarding() {
        viewModel.completeOnboarding()
        isPresented = false
    }
}

// MARK: - Onboarding Page View

struct OnboardingPageView: View {
    let page: OnboardingPage
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ScrollView {
            VStack(spacing: ModernTheme.Spacing.xxxl) {
                // Illustration
                illustrationView

                // Content
                VStack(spacing: ModernTheme.Spacing.lg) {
                    Text(page.title)
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(ModernTheme.Colors.primaryText)
                        .multilineTextAlignment(.center)
                        .accessibilityAddTraits(.isHeader)

                    Text(page.description)
                        .font(ModernTheme.Typography.body)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                        .multilineTextAlignment(.center)
                        .lineSpacing(4)

                    // Feature highlights
                    if !page.features.isEmpty {
                        featuresList
                    }

                    // Permission request
                    if let permission = page.permission {
                        permissionCard(permission)
                    }
                }
                .padding(.horizontal, ModernTheme.Spacing.xl)
            }
            .padding(.top, ModernTheme.Spacing.xxxl)
            .padding(.bottom, ModernTheme.Spacing.xl)
        }
    }

    // MARK: - Illustration View

    private var illustrationView: some View {
        ZStack {
            // Background circle
            Circle()
                .fill(
                    LinearGradient(
                        colors: [page.color.opacity(0.2), page.color.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 250, height: 250)
                .blur(radius: 20)

            // Icon
            Image(systemName: page.icon)
                .font(.system(size: 100, weight: .light))
                .foregroundStyle(
                    LinearGradient(
                        colors: [page.color, page.color.opacity(0.7)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .symbolRenderingMode(.hierarchical)
                .scaleEffect(reduceMotion ? 1.0 : 1.0)
                .animation(
                    reduceMotion ? nil : Animation.easeInOut(duration: 2.0).repeatForever(autoreverses: true),
                    value: UUID()
                )
        }
        .frame(height: 280)
        .accessibilityHidden(true)
    }

    // MARK: - Features List

    private var featuresList: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            ForEach(page.features, id: \.self) { feature in
                HStack(alignment: .top, spacing: ModernTheme.Spacing.sm) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.title3)
                        .foregroundColor(page.color)
                        .accessibilityHidden(true)

                    Text(feature)
                        .font(ModernTheme.Typography.subheadline)
                        .foregroundColor(ModernTheme.Colors.primaryText)
                        .multilineTextAlignment(.leading)
                }
            }
        }
        .padding(.top, ModernTheme.Spacing.md)
    }

    // MARK: - Permission Card

    private func permissionCard(_ permission: PermissionType) -> some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            HStack {
                Image(systemName: permission.icon)
                    .font(.title2)
                    .foregroundColor(permission.color)
                    .frame(width: 40, height: 40)
                    .background(permission.color.opacity(0.1))
                    .cornerRadius(ModernTheme.CornerRadius.sm)

                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xxs) {
                    Text(permission.title)
                        .font(ModernTheme.Typography.headline)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    Text(permission.description)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Spacer()
            }

            Button(action: {
                permission.requestPermission()
            }) {
                Text("Enable \(permission.title)")
                    .font(ModernTheme.Typography.bodyBold)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(permission.color)
                    .cornerRadius(ModernTheme.CornerRadius.md)
            }
            .accessibilityLabel("Enable \(permission.title)")
            .accessibilityHint(permission.accessibilityHint)
        }
        .padding(ModernTheme.Spacing.lg)
        .background(Color(.systemBackground))
        .cornerRadius(ModernTheme.CornerRadius.lg)
        .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 4)
        .padding(.top, ModernTheme.Spacing.lg)
    }
}

// MARK: - Onboarding View Model

class OnboardingViewModel: ObservableObject {
    @Published var currentPage = 0

    var isLastPage: Bool {
        currentPage == OnboardingPage.allPages.count - 1
    }

    func nextPage() {
        guard currentPage < OnboardingPage.allPages.count - 1 else { return }
        currentPage += 1
    }

    func previousPage() {
        guard currentPage > 0 else { return }
        currentPage -= 1
    }

    func completeOnboarding() {
        UserDefaults.standard.set(true, forKey: "hasCompletedOnboarding")
        // Additional completion logic
    }
}

// MARK: - Onboarding Page Model

struct OnboardingPage {
    let title: String
    let description: String
    let icon: String
    let color: Color
    let features: [String]
    let permission: PermissionType?

    static let allPages: [OnboardingPage] = [
        // Page 1: Welcome
        OnboardingPage(
            title: "Welcome to Fleet Management",
            description: "The complete solution for managing your fleet, tracking trips, and maintaining vehicles—all from your iPhone or iPad.",
            icon: "car.2.fill",
            color: .blue,
            features: [
                "Real-time vehicle tracking",
                "Comprehensive maintenance scheduling",
                "Detailed trip history and analytics",
                "OBD2 diagnostics integration",
                "Offline mode support"
            ],
            permission: nil
        ),

        // Page 2: Dashboard & Vehicles
        OnboardingPage(
            title: "Monitor Your Fleet",
            description: "Get a real-time overview of your entire fleet with the Dashboard. Track active vehicles, trips, and maintenance—all at a glance.",
            icon: "chart.bar.fill",
            color: .green,
            features: [
                "Live fleet metrics and charts",
                "Vehicle status monitoring",
                "Quick access to common actions",
                "Customizable views and filters",
                "Smart alerts and notifications"
            ],
            permission: nil
        ),

        // Page 3: Trip Tracking
        OnboardingPage(
            title: "Track Every Journey",
            description: "Automatically record trips with GPS tracking. Perfect for mileage reimbursement, route optimization, and usage analysis.",
            icon: "location.fill",
            color: .orange,
            features: [
                "Automatic GPS route recording",
                "Distance and duration tracking",
                "Pause and resume functionality",
                "Export for reimbursement",
                "Works offline with sync"
            ],
            permission: .location
        ),

        // Page 4: Vehicle Inspections & OBD2
        OnboardingPage(
            title: "Ensure Safety & Compliance",
            description: "Conduct thorough inspections with photo documentation. Connect OBD2 adapters for real-time diagnostics.",
            icon: "checkmark.shield.fill",
            color: .purple,
            features: [
                "Comprehensive inspection checklists",
                "Photo documentation",
                "OBD2 diagnostic code reading",
                "Real-time engine data",
                "Automatic maintenance alerts"
            ],
            permission: .camera
        ),

        // Page 5: Maintenance & Notifications
        OnboardingPage(
            title: "Never Miss Scheduled Maintenance",
            description: "Schedule maintenance, track costs, and receive timely reminders. Keep your fleet in top condition.",
            icon: "wrench.and.screwdriver.fill",
            color: .indigo,
            features: [
                "Smart maintenance scheduling",
                "Cost tracking and budgeting",
                "Service history records",
                "Calendar and list views",
                "Customizable reminder notifications"
            ],
            permission: .notifications
        )
    ]
}

// MARK: - Permission Type

enum PermissionType {
    case location
    case camera
    case bluetooth
    case notifications

    var title: String {
        switch self {
        case .location:
            return "Location Services"
        case .camera:
            return "Camera"
        case .bluetooth:
            return "Bluetooth"
        case .notifications:
            return "Notifications"
        }
    }

    var description: String {
        switch self {
        case .location:
            return "Required for trip tracking and vehicle location monitoring"
        case .camera:
            return "Take photos during inspections and document vehicle condition"
        case .bluetooth:
            return "Connect to OBD2 adapters for vehicle diagnostics"
        case .notifications:
            return "Receive maintenance reminders and important alerts"
        }
    }

    var icon: String {
        switch self {
        case .location:
            return "location.fill"
        case .camera:
            return "camera.fill"
        case .bluetooth:
            return "antenna.radiowaves.left.and.right"
        case .notifications:
            return "bell.fill"
        }
    }

    var color: Color {
        switch self {
        case .location:
            return .blue
        case .camera:
            return .green
        case .bluetooth:
            return .purple
        case .notifications:
            return .orange
        }
    }

    var accessibilityHint: String {
        switch self {
        case .location:
            return "Double tap to enable location services for trip tracking"
        case .camera:
            return "Double tap to enable camera access for inspections"
        case .bluetooth:
            return "Double tap to enable Bluetooth for OBD2 connectivity"
        case .notifications:
            return "Double tap to enable notifications for maintenance reminders"
        }
    }

    func requestPermission() {
        switch self {
        case .location:
            LocationManager.shared.requestLocationPermission()
        case .camera:
            CameraManager.shared.requestCameraPermission()
        case .bluetooth:
            BluetoothPermissionManager.shared.requestPermission { status in
                print("Bluetooth permission: \(status)")
            }
        case .notifications:
            PushNotificationManager.shared.requestAuthorization()
        }
    }
}

// MARK: - Onboarding Entry Point

extension View {
    func showOnboardingIfNeeded() -> some View {
        modifier(OnboardingModifier())
    }
}

struct OnboardingModifier: ViewModifier {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @State private var showOnboarding = false

    func body(content: Content) -> some View {
        content
            .fullScreenCover(isPresented: $showOnboarding) {
                OnboardingView(isPresented: $showOnboarding)
            }
            .onAppear {
                // Small delay to ensure app is fully loaded
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    if !hasCompletedOnboarding {
                        showOnboarding = true
                    }
                }
            }
    }
}

// MARK: - Animated Feature Row (Optional Enhancement)

struct AnimatedFeatureRow: View {
    let icon: String
    let text: String
    let color: Color
    let delay: Double
    @State private var isVisible = false
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        HStack(alignment: .top, spacing: ModernTheme.Spacing.sm) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)
                .accessibilityHidden(true)

            Text(text)
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.primaryText)
                .multilineTextAlignment(.leading)
        }
        .opacity(reduceMotion ? 1.0 : (isVisible ? 1.0 : 0.0))
        .offset(x: reduceMotion ? 0 : (isVisible ? 0 : -20))
        .animation(
            reduceMotion ? nil : .spring(response: 0.6, dampingFraction: 0.8).delay(delay),
            value: isVisible
        )
        .onAppear {
            isVisible = true
        }
    }
}

// MARK: - Custom Page Indicator

struct CustomPageIndicator: View {
    let pageCount: Int
    let currentPage: Int

    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<pageCount, id: \.self) { index in
                Capsule()
                    .fill(index == currentPage ? ModernTheme.Colors.primary : Color.gray.opacity(0.3))
                    .frame(width: index == currentPage ? 24 : 8, height: 8)
                    .animation(.spring(response: 0.3, dampingFraction: 0.7), value: currentPage)
            }
        }
    }
}

// MARK: - Permission Status Checker

class PermissionStatusChecker: ObservableObject {
    @Published var locationStatus: PermissionStatus = .notDetermined
    @Published var cameraStatus: PermissionStatus = .notDetermined
    @Published var bluetoothStatus: PermissionStatus = .notDetermined
    @Published var notificationStatus: PermissionStatus = .notDetermined

    enum PermissionStatus {
        case notDetermined
        case granted
        case denied
        case restricted
    }

    func checkAllPermissions() {
        checkLocationPermission()
        checkCameraPermission()
        checkBluetoothPermission()
        checkNotificationPermission()
    }

    private func checkLocationPermission() {
        // Implementation using LocationManager
    }

    private func checkCameraPermission() {
        // Implementation using AVCaptureDevice
    }

    private func checkBluetoothPermission() {
        // Implementation using BluetoothPermissionManager
    }

    private func checkNotificationPermission() {
        // Implementation using UNUserNotificationCenter
    }
}

// MARK: - Onboarding Completion Handler

struct OnboardingCompletionHandler {
    static func complete() {
        UserDefaults.standard.set(true, forKey: "hasCompletedOnboarding")
        UserDefaults.standard.set(Date(), forKey: "onboardingCompletionDate")

        // Log analytics event
        AnalyticsManager.shared.logEvent("onboarding_completed")

        // Schedule welcome notification
        scheduleWelcomeNotification()
    }

    private static func scheduleWelcomeNotification() {
        let content = UNMutableNotificationContent()
        content.title = "Welcome to Fleet Management!"
        content.body = "Start by adding your first vehicle to get the most out of the app."
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 3600, repeats: false) // 1 hour later

        let request = UNNotificationRequest(
            identifier: "welcome_notification",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request)
    }
}

// MARK: - Preview

struct OnboardingView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            OnboardingView(isPresented: .constant(true))
                .previewDisplayName("Onboarding - Light")

            OnboardingView(isPresented: .constant(true))
                .preferredColorScheme(.dark)
                .previewDisplayName("Onboarding - Dark")

            OnboardingPageView(page: OnboardingPage.allPages[0])
                .previewDisplayName("Page 1 - Welcome")

            OnboardingPageView(page: OnboardingPage.allPages[2])
                .previewDisplayName("Page 3 - Trip Tracking")
        }
    }
}
