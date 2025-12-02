import SwiftUI

@main
struct FleetApp: App {
    @StateObject private var authManager = AuthManager.shared

    init() {
        // Configure app on launch
        configureApp()
    }

    var body: some Scene {
        WindowGroup {
            if authManager.isAuthenticated {
                MainTabView()
                    .environmentObject(authManager)
            } else {
                LoginView()
                    .environmentObject(authManager)
            }
        }
    }

    private func configureApp() {
        // Configure URLSession cache
        let cache = URLCache(memoryCapacity: 50_000_000, diskCapacity: 100_000_000)
        URLCache.shared = cache

        // Print app launch info
        print("🚀 Fleet Management App Launched")
        print("📱 Version: 1.0.0")
        print("🔧 Build: \(Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "Unknown")")
    }
}
