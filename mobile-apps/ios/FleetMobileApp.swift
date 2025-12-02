import SwiftUI
import WebKit

// MARK: - Main App Entry Point
@main
struct FleetMobileApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.light)
        }
    }
}

// MARK: - Main Content View
struct ContentView: View {
    @StateObject private var viewModel = FleetAppViewModel()

    var body: some View {
        NavigationView {
            ZStack {
                // Professional background
                LinearGradient(
                    gradient: Gradient(colors: [
                        Color(red: 0.95, green: 0.96, blue: 0.98),
                        Color.white
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                VStack(spacing: 0) {
                    // Professional header
                    headerView

                    // Main content area
                    if viewModel.hasNetworkError {
                        errorStateView
                    } else {
                        FleetWebView(viewModel: viewModel)
                    }
                }
            }
        }
        .navigationViewStyle(StackNavigationViewStyle())
    }

    // MARK: - Header View
    private var headerView: some View {
        HStack {
            // App icon and title
            HStack(spacing: 12) {
                Image(systemName: "car.2.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
                    .symbolRenderingMode(.hierarchical)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Fleet Manager")
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)

                    Text("Capital Tech Alliance")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            // Status indicators
            HStack(spacing: 8) {
                // Network status
                Circle()
                    .fill(viewModel.isConnected ? Color.green : Color.red)
                    .frame(width: 8, height: 8)
                    .animation(.easeInOut(duration: 0.3), value: viewModel.isConnected)

                // Loading indicator
                if viewModel.isLoading {
                    ProgressView()
                        .scaleEffect(0.7)
                        .progressViewStyle(CircularProgressViewStyle(tint: .blue))
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(
            Color.white
                .shadow(color: Color.black.opacity(0.05), radius: 1, x: 0, y: 1)
        )
    }

    // MARK: - Error State View
    private var errorStateView: some View {
        VStack(spacing: 24) {
            Image(systemName: "wifi.exclamationmark")
                .font(.system(size: 60))
                .foregroundColor(.orange)
                .symbolRenderingMode(.hierarchical)

            VStack(spacing: 8) {
                Text("Connection Error")
                    .font(.title2)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)

                Text("Unable to connect to Fleet services. Please check your network connection and try again.")
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)
                    .font(.body)
                    .padding(.horizontal)
            }

            Button(action: {
                viewModel.retryConnection()
            }) {
                HStack {
                    Image(systemName: "arrow.clockwise")
                    Text("Retry Connection")
                }
                .foregroundColor(.white)
                .font(.headline)
                .padding(.horizontal, 24)
                .padding(.vertical, 12)
                .background(
                    LinearGradient(
                        gradient: Gradient(colors: [Color.blue, Color.blue.opacity(0.8)]),
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .cornerRadius(10)
            }
            .buttonStyle(PlainButtonStyle())
        }
        .padding(40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Fleet Web View
struct FleetWebView: UIViewRepresentable {
    @ObservedObject var viewModel: FleetAppViewModel

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()

        // Enable modern web features
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.allowsPictureInPictureMediaPlayback = true

        // User content controller for JavaScript communication
        let userContentController = WKUserContentController()
        config.userContentController = userContentController

        // Create web view
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = true

        // Enable debugging in development
        #if DEBUG
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
        #endif

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        // PRODUCTION URL - points to production Fleet app
        guard let url = URL(string: "https://fleet.capitaltechalliance.com") else {
            viewModel.setError(true)
            return
        }

        var request = URLRequest(url: url)
        request.setValue("FleetMobile/1.0 (iOS)", forHTTPHeaderField: "User-Agent")
        request.cachePolicy = .reloadIgnoringLocalCacheData
        webView.load(request)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(viewModel)
    }

    // MARK: - WebView Coordinator
    class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let viewModel: FleetAppViewModel

        init(_ viewModel: FleetAppViewModel) {
            self.viewModel = viewModel
        }

        // MARK: - Navigation Delegate
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.viewModel.setLoading(true)
                self.viewModel.setError(false)
                self.viewModel.setConnected(false)
            }
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.viewModel.setLoading(false)
                self.viewModel.setConnected(true)
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async {
                self.viewModel.setLoading(false)
                self.viewModel.setError(true)
                self.viewModel.setConnected(false)
            }
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            DispatchQueue.main.async {
                self.viewModel.setLoading(false)
                self.viewModel.setError(true)
                self.viewModel.setConnected(false)
            }
        }

        // MARK: - UI Delegate
        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            let alert = UIAlertController(
                title: "Fleet Manager",
                message: message,
                preferredStyle: .alert
            )

            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
                completionHandler()
            })

            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first,
               let rootViewController = window.rootViewController {
                rootViewController.present(alert, animated: true)
            }
        }

        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            let alert = UIAlertController(
                title: "Fleet Manager",
                message: message,
                preferredStyle: .alert
            )

            alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in
                completionHandler(false)
            })

            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
                completionHandler(true)
            })

            if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
               let window = windowScene.windows.first,
               let rootViewController = window.rootViewController {
                rootViewController.present(alert, animated: true)
            }
        }
    }
}

// MARK: - View Model
class FleetAppViewModel: ObservableObject {
    @Published var isLoading: Bool = true
    @Published var hasNetworkError: Bool = false
    @Published var isConnected: Bool = false

    func setLoading(_ loading: Bool) {
        isLoading = loading
    }

    func setError(_ error: Bool) {
        hasNetworkError = error
    }

    func setConnected(_ connected: Bool) {
        isConnected = connected
    }

    func retryConnection() {
        hasNetworkError = false
        isLoading = true

        // Add small delay for better UX
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            // The web view will handle actual reconnection
        }
    }
}

// MARK: - Preview
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .previewDevice("iPhone 15")
    }
}
