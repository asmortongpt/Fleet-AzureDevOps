import SwiftUI
import WebKit

@main
struct FleetManagerApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    @StateObject private var viewModel = WebViewModel()
    
    var body: some View {
        VStack(spacing: 0) {
            // Native header
            HStack {
                Image(systemName: "car.fill")
                    .foregroundColor(.blue)
                Text("Fleet Manager")
                    .font(.headline)
                    .fontWeight(.bold)
                Spacer()
                Circle()
                    .fill(viewModel.isLoading ? Color.orange : Color.green)
                    .frame(width: 8, height: 8)
            }
            .padding()
            .background(Color(UIColor.systemBackground))
            .shadow(radius: 2)
            
            // WebView
            WebView(viewModel: viewModel)
                .edgesIgnoringSafeArea(.bottom)
        }
    }
}

class WebViewModel: ObservableObject {
    @Published var isLoading = true
    @Published var error: Error?
}

struct WebView: UIViewRepresentable {
    @ObservedObject var viewModel: WebViewModel
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        
        if let url = URL(string: "https://fleet.capitaltechalliance.com") {
            let request = URLRequest(url: url)
            webView.load(request)
        }
        
        return webView
    }
    
    func updateUIView(_ webView: WKWebView, context: Context) {}
    
    class Coordinator: NSObject, WKNavigationDelegate {
        var parent: WebView
        
        init(_ parent: WebView) {
            self.parent = parent
        }
        
        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.viewModel.isLoading = true
        }
        
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.viewModel.isLoading = false
        }
        
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.viewModel.isLoading = false
            parent.viewModel.error = error
        }
    }
}
