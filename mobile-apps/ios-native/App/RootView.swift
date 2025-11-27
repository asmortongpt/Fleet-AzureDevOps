import SwiftUI

// MARK: - Root View with Authentication Gate
struct RootView: View {
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator
    @EnvironmentObject private var authManager: AuthenticationManager
    @State private var isLoading = true

    var body: some View {
        Group {
            if isLoading {
                loadingView
            } else if authManager.isAuthenticated {
                MainTabView()
                    .transition(AnyTransition.opacity)
            } else {
                LoginView()
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

    // MARK: - Authentication Check
    private func checkAuthenticationStatus() {
        Task {
            // Simulate loading delay for splash screen
            try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second

            await MainActor.run {
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
