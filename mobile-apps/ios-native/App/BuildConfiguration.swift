import Foundation

// MARK: - Build Configuration Manager
/// Provides access to build-time metadata and version information
struct BuildConfiguration {

    // MARK: - Bundle Information
    static var bundleIdentifier: String {
        return Bundle.main.bundleIdentifier ?? "com.capitaltechalliance.fleetmanagement"
    }

    static var bundleName: String {
        return Bundle.main.infoDictionary?["CFBundleName"] as? String ?? "Capital Tech Alliance Fleet"
    }

    static var displayName: String {
        return Bundle.main.infoDictionary?["CFBundleDisplayName"] as? String ?? "Capital Tech Alliance Fleet"
    }

    // MARK: - Version Information
    /// Full semantic version (e.g., "1.0.0")
    static var versionNumber: String {
        return Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }

    /// Build number (e.g., "2")
    static var buildNumber: String {
        return Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "0"
    }

    /// Combined version string (e.g., "1.0.0 (2)")
    static var versionString: String {
        return "\(versionNumber) (\(buildNumber))"
    }

    // MARK: - Build Information
    /// Build date and time
    static var buildDate: Date {
        // This would be set at build time by a build script
        // For now, return a sensible default
        if let buildDateString = Bundle.main.infoDictionary?["BuildDate"] as? String,
           let date = ISO8601DateFormatter().date(from: buildDateString) {
            return date
        }
        return Date()
    }

    /// Build date formatted as string
    static var buildDateString: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: buildDate)
    }

    /// Git commit SHA
    static var gitCommitSHA: String {
        return Bundle.main.infoDictionary?["GitCommitSHA"] as? String ?? "unknown"
    }

    /// Git commit SHA (short form, 7 characters)
    static var gitCommitSHAShort: String {
        let sha = gitCommitSHA
        if sha.count >= 7 {
            return String(sha.prefix(7))
        }
        return sha
    }

    /// Git branch name
    static var gitBranch: String {
        return Bundle.main.infoDictionary?["GitBranch"] as? String ?? "unknown"
    }

    // MARK: - Build Configuration
    /// Is this a debug build
    static var isDebugBuild: Bool {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }

    /// Is this a release build
    static var isReleaseBuild: Bool {
        return !isDebugBuild
    }

    /// Build configuration name
    static var buildConfiguration: String {
        return isDebugBuild ? "Debug" : "Release"
    }

    // MARK: - Platform Information
    /// iOS version
    static var iOSVersion: String {
        return UIDevice.current.systemVersion
    }

    /// Device model identifier
    static var deviceModel: String {
        return UIDevice.current.model
    }

    /// Device model name
    static var deviceModelName: String {
        var systemInfo = utsname()
        uname(&systemInfo)
        let machineMirror = Mirror(reflecting: systemInfo.machine)
        let identifier = machineMirror.children.reduce("") { identifier, element in
            guard let value = element.value as? Int8, value != 0 else {
                return identifier
            }
            return identifier + String(UnicodeScalar(UInt8(value)))
        }
        return identifier
    }

    /// Device name
    static var deviceName: String {
        return UIDevice.current.name
    }

    // MARK: - Capability Information
    /// Check if device supports 64-bit
    static var supports64bit: Bool {
        return MemoryLayout<Int>.size == 8
    }

    /// Available disk space in bytes
    static var availableDiskSpace: UInt64 {
        let fileManager = FileManager.default
        do {
            let attributes = try fileManager.attributesOfFileSystem(forPath: NSHomeDirectory())
            return attributes[FileAttributeKey.systemFreeSize] as? UInt64 ?? 0
        } catch {
            return 0
        }
    }

    /// Available disk space formatted as string
    static var availableDiskSpaceFormatted: String {
        return formatBytes(availableDiskSpace)
    }

    // MARK: - Localization
    /// Current locale identifier
    static var currentLocale: String {
        return Locale.current.identifier
    }

    /// Current language code
    static var currentLanguage: String {
        return Locale.current.language.minimalIdentifier
    }

    /// Current region code
    static var currentRegion: String {
        return Locale.current.region?.identifier ?? "Unknown"
    }

    // MARK: - Environment Detection
    /// Is running in simulator
    static var isSimulator: Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return false
        #endif
    }

    /// Is running with test coverage
    static var isTestBuild: Bool {
        return ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] != nil
    }

    // MARK: - Compile-Time Constants
    /// Minimum iOS version supported
    static let minimumIOSVersion = "15.0"

    /// Maximum iOS version tested
    static let maxTestedIOSVersion = "17.0"

    // MARK: - Helper Methods

    /// Get all build information as dictionary
    static var debugInfo: [String: Any] {
        return [
            "bundleIdentifier": bundleIdentifier,
            "bundleName": bundleName,
            "displayName": displayName,
            "versionNumber": versionNumber,
            "buildNumber": buildNumber,
            "versionString": versionString,
            "buildDate": buildDateString,
            "gitCommitSHA": gitCommitSHA,
            "gitCommitSHAShort": gitCommitSHAShort,
            "gitBranch": gitBranch,
            "isDebugBuild": isDebugBuild,
            "isReleaseBuild": isReleaseBuild,
            "buildConfiguration": buildConfiguration,
            "iOSVersion": iOSVersion,
            "deviceModel": deviceModel,
            "deviceModelName": deviceModelName,
            "deviceName": deviceName,
            "supports64bit": supports64bit,
            "availableDiskSpace": availableDiskSpaceFormatted,
            "currentLocale": currentLocale,
            "currentLanguage": currentLanguage,
            "currentRegion": currentRegion,
            "isSimulator": isSimulator,
            "isTestBuild": isTestBuild
        ]
    }

    /// Get build information as formatted string
    static var debugInfoString: String {
        let info = debugInfo
        var output = "=== Build Configuration ===\n"

        let sortedKeys = info.keys.sorted()
        for key in sortedKeys {
            if let value = info[key] {
                output += "\(key): \(value)\n"
            }
        }

        return output
    }

    // MARK: - Private Helpers

    private static func formatBytes(_ bytes: UInt64) -> String {
        let formatter = ByteCountFormatter()
        formatter.allowedUnits = [.useMB, .useGB, .useTB]
        formatter.countStyle = .file
        return formatter.string(fromByteCount: Int64(bytes))
    }
}

// MARK: - Build Metadata Protocol
protocol BuildMetadataProvider {
    var versionNumber: String { get }
    var buildNumber: String { get }
    var buildDate: Date { get }
    var gitCommitSHA: String { get }
}

// MARK: - Build Information Logger
struct BuildInfoLogger {

    static func logBuildInfo() {
        let logger = LoggingManager.shared
        logger.log(.info, "=== Build Information ===", category: .general)
        logger.log(.info, "Version: \(BuildConfiguration.versionString)", category: .general)
        logger.log(.info, "Build Date: \(BuildConfiguration.buildDateString)", category: .general)
        logger.log(.info, "Git Commit: \(BuildConfiguration.gitCommitSHAShort)", category: .general)
        logger.log(.info, "Git Branch: \(BuildConfiguration.gitBranch)", category: .general)
        logger.log(.info, "Configuration: \(BuildConfiguration.buildConfiguration)", category: .general)
        logger.log(.info, "iOS Version: \(BuildConfiguration.iOSVersion)", category: .general)
        logger.log(.info, "Device: \(BuildConfiguration.deviceModelName)", category: .general)
        logger.log(.info, "Available Disk: \(BuildConfiguration.availableDiskSpaceFormatted)", category: .general)
        logger.log(.info, "Locale: \(BuildConfiguration.currentLocale)", category: .general)
    }

    static func logWarningsIfNeeded() {
        let logger = LoggingManager.shared

        if BuildConfiguration.isDebugBuild {
            logger.log(.warning, "Running DEBUG build in production", category: .general)
        }

        if BuildConfiguration.isSimulator {
            logger.log(.warning, "Running in iOS Simulator", category: .general)
        }

        if BuildConfiguration.availableDiskSpace < 1_000_000_000 { // Less than 1GB
            logger.log(.warning, "Low disk space: \(BuildConfiguration.availableDiskSpaceFormatted)", category: .general)
        }
    }
}

// MARK: - Version Comparison
extension BuildConfiguration {

    /// Check if current version is newer than given version
    static func isVersionNewer(than otherVersion: String) -> Bool {
        return compareVersions(versionNumber, otherVersion) > 0
    }

    /// Check if current version is older than given version
    static func isVersionOlder(than otherVersion: String) -> Bool {
        return compareVersions(versionNumber, otherVersion) < 0
    }

    /// Check if current version equals given version
    static func isVersionEqual(to otherVersion: String) -> Bool {
        return compareVersions(versionNumber, otherVersion) == 0
    }

    /// Compare two semantic versions
    /// Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
    private static func compareVersions(_ v1: String, _ v2: String) -> Int {
        let components1 = v1.split(separator: ".").compactMap { Int($0) }
        let components2 = v2.split(separator: ".").compactMap { Int($0) }

        for i in 0..<max(components1.count, components2.count) {
            let c1 = i < components1.count ? components1[i] : 0
            let c2 = i < components2.count ? components2[i] : 0

            if c1 > c2 { return 1 }
            if c1 < c2 { return -1 }
        }

        return 0
    }
}
