import SwiftUI

// MARK: - Main App Entry Point
@main
struct FleetManagementApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var navigationCoordinator = NavigationCoordinator()
    @StateObject private var networkManager = AzureNetworkManager()

    init() {
        configureAppearance()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(navigationCoordinator)
                .environmentObject(networkManager)
                .preferredColorScheme(navigationCoordinator.colorScheme)
                .onOpenURL { url in
                    navigationCoordinator.handleDeepLink(url)
                }
        }
    }

    // MARK: - App Appearance Configuration
    private func configureAppearance() {
        // Configure Tab Bar appearance
        let tabBarAppearance = UITabBarAppearance()
        tabBarAppearance.configureWithOpaqueBackground()
        tabBarAppearance.backgroundColor = .systemBackground

        // Configure tab bar item appearance
        tabBarAppearance.stackedLayoutAppearance.normal.iconColor = .systemGray
        tabBarAppearance.stackedLayoutAppearance.normal.titleTextAttributes = [
            .foregroundColor: UIColor.systemGray
        ]

        tabBarAppearance.stackedLayoutAppearance.selected.iconColor = .systemBlue
        tabBarAppearance.stackedLayoutAppearance.selected.titleTextAttributes = [
            .foregroundColor: UIColor.systemBlue
        ]

        UITabBar.appearance().standardAppearance = tabBarAppearance
        if #available(iOS 15.0, *) {
            UITabBar.appearance().scrollEdgeAppearance = tabBarAppearance
        }

        // Configure Navigation Bar appearance
        let navBarAppearance = UINavigationBarAppearance()
        navBarAppearance.configureWithOpaqueBackground()
        navBarAppearance.backgroundColor = .systemBackground
        navBarAppearance.titleTextAttributes = [
            .foregroundColor: UIColor.label,
            .font: UIFont.systemFont(ofSize: 18, weight: .semibold)
        ]
        navBarAppearance.largeTitleTextAttributes = [
            .foregroundColor: UIColor.label,
            .font: UIFont.systemFont(ofSize: 34, weight: .bold)
        ]

        UINavigationBar.appearance().standardAppearance = navBarAppearance
        UINavigationBar.appearance().compactAppearance = navBarAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navBarAppearance

        // Configure dark mode support
        UINavigationBar.appearance().tintColor = .systemBlue
    }
}

// MARK: - Environment Keys
struct AuthenticationManagerKey: EnvironmentKey {
    static let defaultValue: AuthenticationManager? = nil
}

extension EnvironmentValues {
    var authenticationManager: AuthenticationManager? {
        get { self[AuthenticationManagerKey.self] }
        set { self[AuthenticationManagerKey.self] = newValue }
    }
}

// MARK: - App Version Info
extension FleetManagementApp {
    static var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    }

    static var buildNumber: String {
        Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
    }

    static var fullVersion: String {
        "\(appVersion) (\(buildNumber))"
    }
}
