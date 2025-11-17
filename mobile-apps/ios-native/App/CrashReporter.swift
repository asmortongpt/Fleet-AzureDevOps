import Foundation
import UIKit

// MARK: - Crash Reporter
/// Crash reporting and analytics integration (Sentry-compatible)
class CrashReporter {

    // MARK: - Properties
    static let shared = CrashReporter()

    private let logger = LoggingManager.shared
    private var isInitialized = false
    private var sentryDSN: String?

    // User context
    private var userId: String?
    private var userEmail: String?
    private var userName: String?

    // App context
    private var environment: String
    private var release: String
    private var buildNumber: String

    // Breadcrumbs
    private var breadcrumbs: [Breadcrumb] = []
    private let maxBreadcrumbs = 100

    // MARK: - Sentry Configuration
    struct SentryConfig {
        let dsn: String
        let environment: String
        let release: String
        let tracesSampleRate: Double
        let enableAutoSessionTracking: Bool
        let attachScreenshot: Bool
        let attachViewHierarchy: Bool

        static let `default` = SentryConfig(
            dsn: "", // Add your Sentry DSN here
            environment: "production",
            release: "\(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0")",
            tracesSampleRate: 1.0,
            enableAutoSessionTracking: true,
            attachScreenshot: true,
            attachViewHierarchy: true
        )
    }

    // MARK: - Breadcrumb
    struct Breadcrumb {
        let message: String
        let category: String
        let level: Level
        let timestamp: Date
        let data: [String: Any]?

        enum Level: String {
            case debug
            case info
            case warning
            case error
            case fatal
        }
    }

    // MARK: - Error Level
    enum ErrorLevel: String {
        case fatal
        case error
        case warning
        case info
        case debug
    }

    // MARK: - Initialization
    private init() {
        // Get app info
        environment = {
            #if DEBUG
            return "development"
            #else
            return "production"
            #endif
        }()

        release = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"

        logger.log(.info, "CrashReporter initialized")
    }

    // MARK: - Setup

    /// Initialize crash reporter with configuration
    func initialize(config: SentryConfig = .default) {
        guard !isInitialized else {
            logger.log(.warning, "CrashReporter already initialized")
            return
        }

        self.sentryDSN = config.dsn

        // In a real implementation, you would initialize Sentry SDK here:
        // import Sentry
        // SentrySDK.start { options in
        //     options.dsn = config.dsn
        //     options.environment = config.environment
        //     options.releaseName = config.release
        //     options.tracesSampleRate = config.tracesSampleRate
        //     options.enableAutoSessionTracking = config.enableAutoSessionTracking
        //     options.attachScreenshot = config.attachScreenshot
        //     options.attachViewHierarchy = config.attachViewHierarchy
        // }

        isInitialized = true

        logger.log(.info, "CrashReporter initialized with DSN", metadata: [
            "environment": environment,
            "release": release
        ])

        // Add initial breadcrumb
        addBreadcrumb(
            message: "App started",
            category: "lifecycle",
            level: .info
        )
    }

    // MARK: - Error Reporting

    /// Report an error
    func reportError(
        _ error: Error,
        level: ErrorLevel = .error,
        context: [String: Any] = [:]
    ) {
        guard isInitialized else {
            logger.log(.warning, "CrashReporter not initialized, skipping error report")
            return
        }

        // Log the error
        logger.log(
            .error,
            "Reporting error: \(error.localizedDescription)",
            metadata: [
                "errorType": String(describing: type(of: error)),
                "level": level.rawValue
            ]
        )

        // In a real implementation, you would use:
        // SentrySDK.capture(error: error) { scope in
        //     scope.setLevel(convertToSentryLevel(level))
        //     scope.setContext(value: context, key: "custom")
        // }

        // Mock implementation - log to console and file
        logErrorReport(error: error, level: level, context: context)

        // Add breadcrumb for the error
        addBreadcrumb(
            message: "Error occurred: \(error.localizedDescription)",
            category: "error",
            level: .error,
            data: context
        )
    }

    /// Report a message
    func reportMessage(
        _ message: String,
        level: ErrorLevel = .info,
        context: [String: Any] = [:]
    ) {
        guard isInitialized else {
            logger.log(.warning, "CrashReporter not initialized, skipping message report")
            return
        }

        logger.log(.info, "Reporting message: \(message)", metadata: [
            "level": level.rawValue
        ])

        // In a real implementation:
        // SentrySDK.capture(message: message) { scope in
        //     scope.setLevel(convertToSentryLevel(level))
        //     scope.setContext(value: context, key: "custom")
        // }

        logMessageReport(message: message, level: level, context: context)
    }

    /// Report a crash
    func reportCrash(
        _ exception: NSException,
        context: [String: Any] = [:]
    ) {
        guard isInitialized else {
            return
        }

        logger.log(.error, "Reporting crash: \(exception.name.rawValue)")

        // In a real implementation:
        // SentrySDK.capture(exception: exception) { scope in
        //     scope.setContext(value: context, key: "custom")
        // }

        logCrashReport(exception: exception, context: context)
    }

    // MARK: - User Context

    /// Set user context
    func setUser(
        userId: String?,
        email: String? = nil,
        username: String? = nil,
        data: [String: Any]? = nil
    ) {
        self.userId = userId
        self.userEmail = email
        self.userName = username

        logger.log(.info, "User context set", metadata: [
            "hasUserId": String(userId != nil),
            "hasEmail": String(email != nil)
        ])

        // In a real implementation:
        // let user = User()
        // user.userId = userId
        // user.email = email
        // user.username = username
        // user.data = data
        // SentrySDK.setUser(user)

        addBreadcrumb(
            message: "User context updated",
            category: "user",
            level: .info
        )
    }

    /// Clear user context
    func clearUser() {
        self.userId = nil
        self.userEmail = nil
        self.userName = nil

        logger.log(.info, "User context cleared")

        // In a real implementation:
        // SentrySDK.setUser(nil)
    }

    // MARK: - Breadcrumbs

    /// Add breadcrumb for tracking user actions
    func addBreadcrumb(
        message: String,
        category: String,
        level: Breadcrumb.Level = .info,
        data: [String: Any]? = nil
    ) {
        let breadcrumb = Breadcrumb(
            message: message,
            category: category,
            level: level,
            timestamp: Date(),
            data: data
        )

        breadcrumbs.append(breadcrumb)

        // Limit breadcrumbs
        if breadcrumbs.count > maxBreadcrumbs {
            breadcrumbs.removeFirst()
        }

        // In a real implementation:
        // let sentryCrumb = Breadcrumb()
        // sentryCrumb.message = message
        // sentryCrumb.category = category
        // sentryCrumb.level = convertToSentryLevel(level)
        // sentryCrumb.data = data
        // SentrySDK.addBreadcrumb(crumb: sentryCrumb)

        logger.log(.debug, "Breadcrumb added: \(message)", category: .general, metadata: [
            "category": category,
            "level": level.rawValue
        ])
    }

    /// Get all breadcrumbs
    func getBreadcrumbs() -> [Breadcrumb] {
        return breadcrumbs
    }

    // MARK: - Context & Tags

    /// Set custom context
    func setContext(key: String, value: [String: Any]) {
        logger.log(.debug, "Context set: \(key)")

        // In a real implementation:
        // SentrySDK.configureScope { scope in
        //     scope.setContext(value: value, key: key)
        // }
    }

    /// Set tag
    func setTag(key: String, value: String) {
        logger.log(.debug, "Tag set: \(key)=\(value)")

        // In a real implementation:
        // SentrySDK.configureScope { scope in
        //     scope.setTag(value: value, key: key)
        // }
    }

    /// Set extra data
    func setExtra(key: String, value: Any) {
        logger.log(.debug, "Extra data set: \(key)")

        // In a real implementation:
        // SentrySDK.configureScope { scope in
        //     scope.setExtra(value: value, key: key)
        // }
    }

    // MARK: - Performance Monitoring

    /// Start a transaction for performance monitoring
    func startTransaction(
        name: String,
        operation: String
    ) -> Transaction {
        logger.log(.debug, "Starting transaction: \(name)", metadata: [
            "operation": operation
        ])

        // In a real implementation:
        // let transaction = SentrySDK.startTransaction(
        //     name: name,
        //     operation: operation
        // )
        // return Transaction(sentryTransaction: transaction)

        return Transaction(name: name, operation: operation)
    }

    // MARK: - Session Tracking

    /// Start a new session
    func startSession() {
        logger.log(.info, "Starting new session")

        // In a real implementation:
        // SentrySDK.startSession()

        addBreadcrumb(
            message: "Session started",
            category: "session",
            level: .info
        )
    }

    /// End the current session
    func endSession() {
        logger.log(.info, "Ending session")

        // In a real implementation:
        // SentrySDK.endSession()

        addBreadcrumb(
            message: "Session ended",
            category: "session",
            level: .info
        )
    }

    // MARK: - Network Breadcrumbs

    /// Track network request
    func trackNetworkRequest(
        url: String,
        method: String,
        statusCode: Int?,
        duration: TimeInterval,
        error: Error? = nil
    ) {
        let level: Breadcrumb.Level = {
            if let error = error {
                return .error
            }
            if let statusCode = statusCode, statusCode >= 400 {
                return .warning
            }
            return .info
        }()

        var data: [String: Any] = [
            "url": url,
            "method": method,
            "duration": duration
        ]

        if let statusCode = statusCode {
            data["statusCode"] = statusCode
        }

        if let error = error {
            data["error"] = error.localizedDescription
        }

        addBreadcrumb(
            message: "\(method) \(url)",
            category: "http",
            level: level,
            data: data
        )
    }

    // MARK: - UI Breadcrumbs

    /// Track screen view
    func trackScreenView(_ screenName: String) {
        addBreadcrumb(
            message: "Navigated to \(screenName)",
            category: "navigation",
            level: .info,
            data: ["screen": screenName]
        )
    }

    /// Track user action
    func trackUserAction(_ action: String, on element: String) {
        addBreadcrumb(
            message: "\(action) on \(element)",
            category: "ui.action",
            level: .info,
            data: ["action": action, "element": element]
        )
    }

    // MARK: - Private Methods

    /// Log error report (mock implementation)
    private func logErrorReport(
        error: Error,
        level: ErrorLevel,
        context: [String: Any]
    ) {
        var report = """

        ========================================
        ERROR REPORT
        ========================================
        Timestamp: \(Date())
        Level: \(level.rawValue)
        Environment: \(environment)
        Release: \(release) (\(buildNumber))

        Error Details:
        - Type: \(String(describing: type(of: error)))
        - Description: \(error.localizedDescription)
        """

        if let nsError = error as NSError? {
            report += """

            - Domain: \(nsError.domain)
            - Code: \(nsError.code)
            - User Info: \(nsError.userInfo)
            """
        }

        if let userId = userId {
            report += """

            User Context:
            - User ID: \(userId)
            """
            if let email = userEmail {
                report += "\n- Email: \(email)"
            }
            if let name = userName {
                report += "\n- Name: \(name)"
            }
        }

        if !context.isEmpty {
            report += """

            Custom Context:
            \(context.map { "- \($0.key): \($0.value)" }.joined(separator: "\n"))
            """
        }

        if !breadcrumbs.isEmpty {
            report += """

            Breadcrumbs (last 10):
            """
            for breadcrumb in breadcrumbs.suffix(10) {
                report += "\n[\(breadcrumb.timestamp)] [\(breadcrumb.level.rawValue)] \(breadcrumb.category): \(breadcrumb.message)"
            }
        }

        report += "\n========================================\n"

        print(report)
    }

    /// Log message report (mock implementation)
    private func logMessageReport(
        message: String,
        level: ErrorLevel,
        context: [String: Any]
    ) {
        var report = """

        ========================================
        MESSAGE REPORT
        ========================================
        Timestamp: \(Date())
        Level: \(level.rawValue)
        Message: \(message)
        """

        if !context.isEmpty {
            report += """

            Context:
            \(context.map { "- \($0.key): \($0.value)" }.joined(separator: "\n"))
            """
        }

        report += "\n========================================\n"

        print(report)
    }

    /// Log crash report (mock implementation)
    private func logCrashReport(
        exception: NSException,
        context: [String: Any]
    ) {
        let report = """

        ========================================
        CRASH REPORT
        ========================================
        Timestamp: \(Date())
        Exception: \(exception.name.rawValue)
        Reason: \(exception.reason ?? "Unknown")
        Symbols: \(exception.callStackSymbols.joined(separator: "\n  "))
        ========================================

        """

        print(report)

        // Write to crash log file
        if let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            let crashLogPath = documentsPath.appendingPathComponent("crash_logs.txt")
            try? report.write(to: crashLogPath, atomically: true, encoding: .utf8)
        }
    }
}

// MARK: - Transaction
/// Performance monitoring transaction
class Transaction {
    let name: String
    let operation: String
    let startTime: Date
    private var isFinished = false

    // Spans for sub-operations
    private var spans: [Span] = []

    init(name: String, operation: String) {
        self.name = name
        self.operation = operation
        self.startTime = Date()
    }

    /// Start a span within this transaction
    func startSpan(operation: String, description: String? = nil) -> Span {
        let span = Span(operation: operation, description: description)
        spans.append(span)
        return span
    }

    /// Finish the transaction
    func finish() {
        guard !isFinished else { return }

        let duration = Date().timeIntervalSince(startTime)

        LoggingManager.shared.log(
            .info,
            "Transaction finished: \(name)",
            metadata: [
                "operation": operation,
                "duration": String(format: "%.3fs", duration),
                "spanCount": String(spans.count)
            ]
        )

        isFinished = true

        // In a real implementation:
        // sentryTransaction?.finish()
    }

    /// Set transaction status
    func setStatus(_ status: String) {
        // In a real implementation:
        // sentryTransaction?.status = status
    }

    /// Set transaction data
    func setData(key: String, value: Any) {
        // In a real implementation:
        // sentryTransaction?.setData(value: value, key: key)
    }
}

// MARK: - Span
/// Performance monitoring span
class Span {
    let operation: String
    let description: String?
    let startTime: Date
    private var isFinished = false

    init(operation: String, description: String? = nil) {
        self.operation = operation
        self.description = description
        self.startTime = Date()
    }

    /// Finish the span
    func finish() {
        guard !isFinished else { return }

        let duration = Date().timeIntervalSince(startTime)

        LoggingManager.shared.log(
            .debug,
            "Span finished: \(operation)",
            metadata: [
                "duration": String(format: "%.3fs", duration)
            ]
        )

        isFinished = true

        // In a real implementation:
        // sentrySpan?.finish()
    }

    /// Set span status
    func setStatus(_ status: String) {
        // In a real implementation:
        // sentrySpan?.status = status
    }
}

// MARK: - Extension for Error Reporting
extension CrashReporter {

    /// Convenience method to report Fleet errors
    func reportFleetError(_ error: FleetError, context: [String: Any] = [:]) {
        var enrichedContext = context
        enrichedContext["fleetErrorType"] = String(describing: error)

        reportError(error, level: .error, context: enrichedContext)
    }

    /// Convenience method to report API errors
    func reportAPIError(_ error: APIError, context: [String: Any] = [:]) {
        var enrichedContext = context
        enrichedContext["apiErrorType"] = String(describing: error)

        let level: ErrorLevel = {
            switch error {
            case .serverError:
                return .error
            case .authenticationFailed, .unauthorized:
                return .warning
            default:
                return .error
            }
        }()

        reportError(error, level: level, context: enrichedContext)
    }
}
