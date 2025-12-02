import Foundation
import OSLog

// MARK: - Logging Manager
/// Structured logging system with privacy-safe logging and log rotation
class LoggingManager {

    // MARK: - Properties
    static let shared = LoggingManager()

    private let subsystem = "com.fleet.management"
    private let maxLogFileSize: UInt64 = 10_485_760 // 10 MB
    private let maxLogFiles = 5

    // Log categories
    private lazy var generalLogger = Logger(subsystem: subsystem, category: "general")
    private lazy var networkLogger = Logger(subsystem: subsystem, category: "network")
    private lazy var authLogger = Logger(subsystem: subsystem, category: "authentication")
    private lazy var dataLogger = Logger(subsystem: subsystem, category: "data")
    private lazy var uiLogger = Logger(subsystem: subsystem, category: "ui")

    // File logging
    private let logQueue = DispatchQueue(label: "com.fleet.logging", qos: .utility)
    private var logFileHandle: FileHandle?
    private let dateFormatter: DateFormatter

    // MARK: - Log Level
    enum LogLevel: String, Comparable {
        case debug = "DEBUG"
        case info = "INFO"
        case warning = "WARNING"
        case error = "ERROR"

        var osLogType: OSLogType {
            switch self {
            case .debug:
                return .debug
            case .info:
                return .info
            case .warning:
                return .default
            case .error:
                return .error
            }
        }

        static func < (lhs: LogLevel, rhs: LogLevel) -> Bool {
            let order: [LogLevel] = [.debug, .info, .warning, .error]
            guard let lhsIndex = order.firstIndex(of: lhs),
                  let rhsIndex = order.firstIndex(of: rhs) else {
                return false
            }
            return lhsIndex < rhsIndex
        }
    }

    // MARK: - Log Category
    enum LogCategory {
        case general
        case network
        case authentication
        case data
        case ui
        case security

        var logger: Logger? {
            switch self {
            case .general:
                return LoggingManager.shared.generalLogger
            case .network:
                return LoggingManager.shared.networkLogger
            case .authentication:
                return LoggingManager.shared.authLogger
            case .data:
                return LoggingManager.shared.dataLogger
            case .ui:
                return LoggingManager.shared.uiLogger
            case .security:
                return nil // Security logs use SecurityLogger
            }
        }
    }

    // MARK: - Initialization
    private init() {
        // Setup date formatter
        dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd HH:mm:ss.SSS"
        dateFormatter.timeZone = TimeZone.current

        // Initialize file logging
        setupFileLogging()

        // Setup log rotation
        setupLogRotation()

        // NOTE: Cannot log during initialization due to circular dependency
        // LoggingManager is ready for use after init completes
    }

    // MARK: - Public Logging Methods

    /// Log a message with default general category
    /// - Parameters:
    ///   - level: Log level
    ///   - message: Log message
    ///   - metadata: Additional metadata (privacy-safe)
    ///   - file: Source file
    ///   - function: Source function
    ///   - line: Source line
    func log(
        _ level: LogLevel,
        _ message: String,
        metadata: [String: String] = [:],
        file: String = #file,
        function: String = #function,
        line: Int = #line
    ) {
        log(level, message, category: .general, metadata: metadata, file: file, function: function, line: line)
    }

    /// Log a message with specific category
    /// - Parameters:
    ///   - level: Log level
    ///   - message: Log message
    ///   - category: Log category
    ///   - metadata: Additional metadata (privacy-safe)
    ///   - file: Source file
    ///   - function: Source function
    ///   - line: Source line
    func log(
        _ level: LogLevel,
        _ message: String,
        category: LogCategory,
        metadata: [String: String] = [:],
        file: String = #file,
        function: String = #function,
        line: Int = #line
    ) {
        let fileName = (file as NSString).lastPathComponent
        let sanitizedMessage = sanitizeMessage(message)

        // Log to OS Logger
        if let logger = category.logger {
            let logMessage = "\(fileName):\(line) \(function) - \(sanitizedMessage)"
            logger.log(level: level.osLogType, "\(logMessage)")
        }

        // Log to file
        logToFile(
            level: level,
            message: sanitizedMessage,
            category: category,
            metadata: metadata,
            file: fileName,
            function: function,
            line: line
        )

        // Console output in debug mode
        #if DEBUG
        printToConsole(
            level: level,
            message: sanitizedMessage,
            category: category,
            metadata: metadata,
            file: fileName,
            function: function,
            line: line
        )
        #endif
    }

    /// Log network request
    /// - Parameters:
    ///   - url: Request URL
    ///   - method: HTTP method
    ///   - statusCode: Response status code
    ///   - duration: Request duration in seconds
    func logNetworkRequest(
        url: String,
        method: String,
        statusCode: Int?,
        duration: TimeInterval
    ) {
        let sanitizedURL = sanitizeURL(url)

        var metadata: [String: String] = [
            "url": sanitizedURL,
            "method": method,
            "duration": String(format: "%.3fs", duration)
        ]

        if let statusCode = statusCode {
            metadata["statusCode"] = String(statusCode)
        }

        let level: LogLevel = {
            if let statusCode = statusCode {
                if statusCode >= 500 {
                    return .error
                } else if statusCode >= 400 {
                    return .warning
                } else {
                    return .info
                }
            }
            return .error
        }()

        log(level, "Network request: \(method) \(sanitizedURL)", category: .network, metadata: metadata)
    }

    /// Log authentication event
    /// - Parameters:
    ///   - event: Authentication event description
    ///   - success: Whether authentication was successful
    ///   - userId: User identifier (will be hashed for privacy)
    func logAuthentication(event: String, success: Bool, userId: String? = nil) {
        var metadata: [String: String] = [
            "success": String(success)
        ]

        if let userId = userId {
            // Hash user ID for privacy
            metadata["userIdHash"] = hashForPrivacy(userId)
        }

        let level: LogLevel = success ? .info : .warning

        log(level, "Authentication: \(event)", category: .authentication, metadata: metadata)
    }

    /// Log data operation
    /// - Parameters:
    ///   - operation: Operation description
    ///   - entityType: Type of entity
    ///   - success: Whether operation was successful
    func logDataOperation(operation: String, entityType: String, success: Bool) {
        let metadata: [String: String] = [
            "operation": operation,
            "entityType": entityType,
            "success": String(success)
        ]

        let level: LogLevel = success ? .info : .error

        log(level, "Data operation: \(operation) on \(entityType)", category: .data, metadata: metadata)
    }

    /// Log UI event
    /// - Parameters:
    ///   - event: UI event description
    ///   - screen: Screen name
    func logUIEvent(event: String, screen: String) {
        let metadata: [String: String] = [
            "event": event,
            "screen": screen
        ]

        log(.info, "UI: \(event)", category: .ui, metadata: metadata)
    }

    // MARK: - Log Management

    /// Get current log file path
    func getCurrentLogFilePath() -> URL? {
        return getLogFileURL(index: 0)
    }

    /// Get all log file paths
    func getAllLogFilePaths() -> [URL] {
        var paths: [URL] = []

        for i in 0..<maxLogFiles {
            if let url = getLogFileURL(index: i),
               FileManager.default.fileExists(atPath: url.path) {
                paths.append(url)
            }
        }

        return paths
    }

    /// Export logs as string
    func exportLogs() -> String? {
        var allLogs = ""

        for logFileURL in getAllLogFilePaths() {
            if let content = try? String(contentsOf: logFileURL, encoding: .utf8) {
                allLogs += content
                allLogs += "\n\n--- Next Log File ---\n\n"
            }
        }

        return allLogs.isEmpty ? nil : allLogs
    }

    /// Clear all log files
    func clearLogs() {
        logQueue.async { [weak self] in
            guard let self = self else { return }

            // Close current log file
            self.logFileHandle?.closeFile()
            self.logFileHandle = nil

            // Delete all log files
            for logFileURL in self.getAllLogFilePaths() {
                try? FileManager.default.removeItem(at: logFileURL)
            }

            // Reinitialize logging
            self.setupFileLogging()

            // NOTE: Cannot log here to avoid potential recursion
        }
    }

    // MARK: - Private Methods

    /// Setup file logging
    private func setupFileLogging() {
        guard let logFileURL = getLogFileURL(index: 0) else {
            print("Failed to get log file URL")
            return
        }

        // Create logs directory if needed
        let logsDirectory = logFileURL.deletingLastPathComponent()
        if !FileManager.default.fileExists(atPath: logsDirectory.path) {
            try? FileManager.default.createDirectory(at: logsDirectory, withIntermediateDirectories: true)
        }

        // Create log file if it doesn't exist
        if !FileManager.default.fileExists(atPath: logFileURL.path) {
            FileManager.default.createFile(atPath: logFileURL.path, contents: nil)
        }

        // Open file handle
        logFileHandle = try? FileHandle(forWritingTo: logFileURL)
        logFileHandle?.seekToEndOfFile()
    }

    /// Setup log rotation
    private func setupLogRotation() {
        guard let logFileURL = getLogFileURL(index: 0) else { return }

        // Check if rotation is needed
        if let attributes = try? FileManager.default.attributesOfItem(atPath: logFileURL.path),
           let fileSize = attributes[.size] as? UInt64,
           fileSize > maxLogFileSize {
            rotateLogFiles()
        }
    }

    /// Rotate log files
    private func rotateLogFiles() {
        logQueue.async { [weak self] in
            guard let self = self else { return }

            // Close current log file
            self.logFileHandle?.closeFile()
            self.logFileHandle = nil

            // Rotate files (move log.0 to log.1, log.1 to log.2, etc.)
            for i in stride(from: self.maxLogFiles - 1, through: 0, by: -1) {
                if let currentURL = self.getLogFileURL(index: i),
                   FileManager.default.fileExists(atPath: currentURL.path) {

                    if i == self.maxLogFiles - 1 {
                        // Delete oldest log
                        try? FileManager.default.removeItem(at: currentURL)
                    } else if let nextURL = self.getLogFileURL(index: i + 1) {
                        // Move to next index
                        try? FileManager.default.moveItem(at: currentURL, to: nextURL)
                    }
                }
            }

            // Create new log file
            self.setupFileLogging()

            // NOTE: Cannot log here to avoid potential recursion during rotation
        }
    }

    /// Get log file URL for index
    private func getLogFileURL(index: Int) -> URL? {
        guard let documentsDirectory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
            return nil
        }

        let logsDirectory = documentsDirectory.appendingPathComponent("Logs", isDirectory: true)
        let fileName = index == 0 ? "app.log" : "app.\(index).log"

        return logsDirectory.appendingPathComponent(fileName)
    }

    /// Log to file
    private func logToFile(
        level: LogLevel,
        message: String,
        category: LogCategory,
        metadata: [String: String],
        file: String,
        function: String,
        line: Int
    ) {
        logQueue.async { [weak self] in
            guard let self = self else { return }

            let timestamp = self.dateFormatter.string(from: Date())
            var logLine = "[\(timestamp)] [\(level.rawValue)] [\(category)] \(file):\(line) - \(message)"

            if !metadata.isEmpty {
                let metadataString = metadata.map { "\($0.key)=\($0.value)" }.joined(separator: ", ")
                logLine += " | \(metadataString)"
            }

            logLine += "\n"

            if let data = logLine.data(using: .utf8) {
                self.logFileHandle?.write(data)

                // Check if rotation is needed
                if let currentURL = self.getLogFileURL(index: 0),
                   let attributes = try? FileManager.default.attributesOfItem(atPath: currentURL.path),
                   let fileSize = attributes[.size] as? UInt64,
                   fileSize > self.maxLogFileSize {
                    self.rotateLogFiles()
                }
            }
        }
    }

    /// Print to console
    private func printToConsole(
        level: LogLevel,
        message: String,
        category: LogCategory,
        metadata: [String: String],
        file: String,
        function: String,
        line: Int
    ) {
        let timestamp = dateFormatter.string(from: Date())
        let icon = levelIcon(for: level)

        var logMessage = "\(icon) [\(timestamp)] [\(level.rawValue)] [\(category)] \(file):\(line) - \(message)"

        if !metadata.isEmpty {
            let metadataString = metadata.map { "\($0.key)=\($0.value)" }.joined(separator: ", ")
            logMessage += " | \(metadataString)"
        }

        print(logMessage)
    }

    /// Get icon for log level
    private func levelIcon(for level: LogLevel) -> String {
        switch level {
        case .debug:
            return "🔍"
        case .info:
            return "ℹ️"
        case .warning:
            return "⚠️"
        case .error:
            return "❌"
        }
    }

    /// Sanitize message to remove sensitive data
    private func sanitizeMessage(_ message: String) -> String {
        var sanitized = message

        // Remove potential tokens
        let tokenPattern = "Bearer\\s+[A-Za-z0-9-._~+/]+=*"
        sanitized = sanitized.replacingOccurrences(
            of: tokenPattern,
            with: "Bearer [REDACTED]",
            options: .regularExpression
        )

        // Remove potential passwords
        let passwordPattern = "password[\"']?\\s*[:=]\\s*[\"'][^\"']+[\"']"
        sanitized = sanitized.replacingOccurrences(
            of: passwordPattern,
            with: "password: [REDACTED]",
            options: [.regularExpression, .caseInsensitive]
        )

        // Remove potential API keys
        let apiKeyPattern = "api[_-]?key[\"']?\\s*[:=]\\s*[\"'][^\"']+[\"']"
        sanitized = sanitized.replacingOccurrences(
            of: apiKeyPattern,
            with: "api_key: [REDACTED]",
            options: [.regularExpression, .caseInsensitive]
        )

        // Remove potential email addresses (keep domain for debugging)
        let emailPattern = "([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+)"
        sanitized = sanitized.replacingOccurrences(
            of: emailPattern,
            with: "[EMAIL]@$2",
            options: .regularExpression
        )

        return sanitized
    }

    /// Sanitize URL to remove query parameters with sensitive data
    private func sanitizeURL(_ url: String) -> String {
        guard let urlComponents = URLComponents(string: url) else {
            return url
        }

        var components = urlComponents

        // Remove sensitive query parameters
        if var queryItems = components.queryItems {
            queryItems = queryItems.map { item in
                let sensitiveParams = ["token", "api_key", "password", "secret", "auth"]
                if sensitiveParams.contains(where: { item.name.lowercased().contains($0) }) {
                    return URLQueryItem(name: item.name, value: "[REDACTED]")
                }
                return item
            }
            components.queryItems = queryItems
        }

        return components.url?.absoluteString ?? url
    }

    /// Hash string for privacy
    private func hashForPrivacy(_ string: String) -> String {
        guard let data = string.data(using: .utf8) else {
            return "hash_error"
        }

        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes {
            _ = CC_SHA256($0.baseAddress, CC_LONG(data.count), &hash)
        }

        return hash.map { String(format: "%02x", $0) }.joined().prefix(16).description
    }
}

// MARK: - CommonCrypto Import
import CommonCrypto

// MARK: - Logger Extension
extension Logger {
    static let general = Logger(subsystem: "com.fleet.management", category: "general")
    static let network = Logger(subsystem: "com.fleet.management", category: "network")
    static let auth = Logger(subsystem: "com.fleet.management", category: "authentication")
    static let data = Logger(subsystem: "com.fleet.management", category: "data")
    static let ui = Logger(subsystem: "com.fleet.management", category: "ui")
}
