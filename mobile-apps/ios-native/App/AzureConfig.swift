import Foundation

// MARK: - Azure Deployment Configuration
struct AzureConfig {
    
    // MARK: - Azure App Service Configuration
    static let appServiceName = "cta-fleet-management"
    static let resourceGroup = "fleet-management-rg"

    // SECURITY FIX: Externalized from hardcoded value
    // TODO: Implement SecureConfigManager for production use
    static var subscriptionId: String {
        // Try to load from environment/configuration first
        if let envSubscriptionId = ProcessInfo.processInfo.environment["AZURE_SUBSCRIPTION_ID"], !envSubscriptionId.isEmpty {
            return envSubscriptionId
        }
        return "REPLACE_WITH_ACTUAL_SUBSCRIPTION_ID"
    }
    
    // MARK: - Production URLs
    static let productionBaseURL = "https://\(appServiceName).azurewebsites.net"
    static let productionAPIURL = "\(productionBaseURL)/api"
    
    // MARK: - Alternative Azure URLs (if using custom domain)
    static let customDomainURL = "https://fleet.capitaltechalliance.com/api"
    static let stagingURL = "https://\(appServiceName)-staging.azurewebsites.net/api"
    
    // MARK: - Environment Detection
    static var currentEnvironment: AppEnvironmentType {
        #if DEBUG
        return .development
        #else
        return .production
        #endif
    }

    // MARK: - API URL Selection
    static var apiURL: String {
        switch currentEnvironment {
        case .development:
            return "http://localhost:5555/api"
        case .staging:
            return stagingURL
        case .production:
            return productionAPIURL
        }
    }

    enum AppEnvironmentType {
        case development
        case staging
        case production
    }
    
    // MARK: - Azure-specific Headers
    static var azureHeaders: [String: String] {
        var headers: [String: String] = [
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "CTA-Fleet-iOS/1.0",
            "X-Client-Version": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        ]
        
        // Add Azure-specific headers for production
        if currentEnvironment == .production {
            headers["Cache-Control"] = "no-cache"
            headers["X-Azure-Client"] = "iOS-Native"
            headers["X-API-Version"] = "1.0"
        }
        
        return headers
    }
    
    // MARK: - Request Timeout Configuration
    static let requestTimeout: TimeInterval = currentEnvironment == .production ? 30.0 : 10.0
    
    // MARK: - Retry Configuration
    static let maxRetryAttempts = 3
    static let retryDelay: TimeInterval = 1.0
    
    // MARK: - Connection Test with Enhanced Error Handling
    static func testAzureConnection() async -> (isConnected: Bool, responseTime: TimeInterval, error: String?) {
        let logger = LoggingManager.shared
        let crashReporter = CrashReporter.shared
        let startTime = Date()

        logger.log(.info, "Testing Azure connection to \(apiURL)", category: .network)

        guard let url = URL(string: "\(apiURL)/health") else {
            logger.log(.error, "Invalid Azure URL", category: .network)
            return (false, 0, "Invalid URL")
        }

        var request = URLRequest(url: url, timeoutInterval: requestTimeout)

        // Add Azure headers
        for (key, value) in azureHeaders {
            request.setValue(value, forHTTPHeaderField: key)
        }

        // Add breadcrumb for crash reporting
        crashReporter.addBreadcrumb(
            message: "Testing Azure connection",
            category: "api",
            level: .info,
            data: ["url": apiURL]
        )

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            let responseTime = Date().timeIntervalSince(startTime)

            // Log response time
            logger.logNetworkRequest(
                url: "\(apiURL)/health",
                method: "GET",
                statusCode: (response as? HTTPURLResponse)?.statusCode,
                duration: responseTime
            )

            if let httpResponse = response as? HTTPURLResponse {
                if httpResponse.statusCode == 200 {
                    if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let status = json["status"] as? String,
                       status == "healthy" {
                        logger.log(.info, "Azure connection successful", category: .network, metadata: [
                            "responseTime": String(format: "%.3fs", responseTime)
                        ])
                        return (true, responseTime, nil)
                    }
                }

                let errorMsg = "Server returned status: \(httpResponse.statusCode)"
                logger.log(.warning, "Azure connection failed: \(errorMsg)", category: .network)

                // Report to crash reporter if serious error
                if httpResponse.statusCode >= 500 {
                    crashReporter.reportMessage(
                        "Azure health check failed with status \(httpResponse.statusCode)",
                        level: .warning,
                        context: ["statusCode": httpResponse.statusCode]
                    )
                }

                return (false, responseTime, errorMsg)
            }

            logger.log(.error, "Invalid response from Azure", category: .network)
            return (false, responseTime, "Invalid response")

        } catch {
            let responseTime = Date().timeIntervalSince(startTime)
            let errorMsg = error.localizedDescription

            logger.log(.error, "Azure connection error: \(errorMsg)", category: .network, metadata: [
                "responseTime": String(format: "%.3fs", responseTime)
            ])

            // Report error to crash reporter
            crashReporter.reportError(
                error,
                level: .error,
                context: ["operation": "Azure health check", "url": apiURL]
            )

            return (false, responseTime, errorMsg)
        }
    }
    
    // MARK: - Azure Resource URLs (for admin reference)
    static let azurePortalURL = "https://portal.azure.com/#@/resource/subscriptions/\(subscriptionId)/resourceGroups/\(resourceGroup)/providers/Microsoft.Web/sites/\(appServiceName)"
    static let azureLogsURL = "https://portal.azure.com/#@/resource/subscriptions/\(subscriptionId)/resourceGroups/\(resourceGroup)/providers/Microsoft.Web/sites/\(appServiceName)/logs"
    
    // MARK: - Database Configuration (for backend reference)
    struct Database {
        static let serverName = "\(appServiceName)-sqlserver"
        static let databaseName = "fleet_management"
        static let connectionString = "Server=tcp:\(serverName).database.windows.net,1433;Database=\(databaseName);Encrypt=true;TrustServerCertificate=false;Connection Timeout=30;"
    }
}