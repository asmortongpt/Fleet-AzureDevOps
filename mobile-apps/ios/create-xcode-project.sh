#!/bin/bash

echo "Creating native iOS app project structure..."

# Go to a clean directory
cd /tmp
rm -rf FleetManager 2>/dev/null

# Create new iOS app project using xcodebuild
mkdir -p FleetManager/FleetManager

cat > FleetManager/FleetManager/FleetManagerApp.swift << 'SWIFT'
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
SWIFT

cat > FleetManager/FleetManager/Info.plist << 'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>$(DEVELOPMENT_LANGUAGE)</string>
    <key>CFBundleExecutable</key>
    <string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key>
    <string>com.capitaltechalliance.fleet</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>Fleet Manager</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>LSRequiresIPhoneOS</key>
    <true/>
    <key>UILaunchStoryboardName</key>
    <string>LaunchScreen</string>
    <key>UIRequiredDeviceCapabilities</key>
    <array>
        <string>armv7</string>
    </array>
    <key>UISupportedInterfaceOrientations</key>
    <array>
        <string>UIInterfaceOrientationPortrait</string>
        <string>UIInterfaceOrientationLandscapeLeft</string>
        <string>UIInterfaceOrientationLandscapeRight</string>
    </array>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <false/>
        <key>NSExceptionDomains</key>
        <dict>
            <key>fleet.capitaltechalliance.com</key>
            <dict>
                <key>NSIncludesSubdomains</key>
                <true/>
                <key>NSTemporaryExceptionAllowsInsecureHTTPLoads</key>
                <false/>
                <key>NSTemporaryExceptionMinimumTLSVersion</key>
                <string>TLSv1.2</string>
            </dict>
        </dict>
    </dict>
    <key>NSCameraUsageDescription</key>
    <string>Fleet Manager needs camera access for receipt scanning and damage reporting</string>
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Fleet Manager needs location access for GPS tracking and mileage calculation</string>
    <key>NSPhotoLibraryUsageDescription</key>
    <string>Fleet Manager needs photo library access to save and upload images</string>
</dict>
</plist>
PLIST

echo "✅ Project structure created at /tmp/FleetManager"
echo ""
echo "Next steps:"
echo "1. Open Xcode"
echo "2. File → New → Project"
echo "3. Choose iOS → App"
echo "4. Use these settings:"
echo "   - Product Name: FleetManager"
echo "   - Bundle ID: com.capitaltechalliance.fleet"
echo "   - Interface: SwiftUI"
echo "   - Language: Swift"
echo "5. Save anywhere, then replace the generated files with:"
echo "   /tmp/FleetManager/FleetManager/FleetManagerApp.swift"
echo "   /tmp/FleetManager/FleetManager/Info.plist"
echo "6. Select iPhone simulator and press ▶ Run"
