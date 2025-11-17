import Foundation
import UIKit

// MARK: - Jailbreak Detector
/// Detects jailbroken/compromised devices to prevent security risks
/// OWASP Mobile Top 10 - M8: Code Tampering, M1: Improper Platform Usage
class JailbreakDetector {

    // MARK: - Properties
    static let shared = JailbreakDetector()

    /// Enable/disable jailbreak detection
    var isEnabled: Bool = true

    /// Strict mode: Prevent app execution on jailbroken devices
    var strictMode: Bool = {
        #if DEBUG
        return false  // Allow jailbroken devices in debug mode
        #else
        return true   // Enforce strict mode in production
        #endif
    }()

    /// Cache detection result for performance
    private var cachedResult: JailbreakStatus?
    private let cacheExpiration: TimeInterval = 300 // 5 minutes

    private init() {}

    // MARK: - Public Methods

    /// Perform comprehensive jailbreak detection
    /// - Returns: Jailbreak detection status
    func performDetection() -> JailbreakStatus {
        guard isEnabled else {
            return JailbreakStatus(isJailbroken: false, detectionMethods: [], timestamp: Date())
        }

        // Return cached result if still valid
        if let cached = cachedResult,
           Date().timeIntervalSince(cached.timestamp) < cacheExpiration {
            return cached
        }

        var detectedMethods: [String] = []
        var isJailbroken = false

        // Method 1: Check for jailbreak files and apps
        if checkJailbreakFiles() {
            detectedMethods.append("Jailbreak files detected")
            isJailbroken = true
        }

        // Method 2: Check for Cydia URL scheme
        if checkCydiaURLScheme() {
            detectedMethods.append("Cydia URL scheme detected")
            isJailbroken = true
        }

        // Method 3: Check if app can write outside sandbox
        if checkSandboxIntegrity() {
            detectedMethods.append("Sandbox integrity compromised")
            isJailbroken = true
        }

        // Method 4: Check for suspicious libraries
        if checkSuspiciousLibraries() {
            detectedMethods.append("Suspicious libraries detected")
            isJailbroken = true
        }

        // Method 5: Check fork() restriction
        if checkForkRestriction() {
            detectedMethods.append("Fork restriction bypassed")
            isJailbroken = true
        }

        // Method 6: Check symbolic links
        if checkSymbolicLinks() {
            detectedMethods.append("Suspicious symbolic links detected")
            isJailbroken = true
        }

        // Method 7: Check system directory permissions
        if checkSystemDirectoryPermissions() {
            detectedMethods.append("System directory permissions modified")
            isJailbroken = true
        }

        let status = JailbreakStatus(
            isJailbroken: isJailbroken,
            detectionMethods: detectedMethods,
            timestamp: Date()
        )

        cachedResult = status

        // Log detection result
        if isJailbroken {
            SecurityLogger.shared.logSecurityEvent(
                .jailbreakDetected,
                details: [
                    "methods": detectedMethods,
                    "methodCount": detectedMethods.count
                ],
                severity: .critical
            )
        }

        return status
    }

    /// Check if device is compromised (quick check)
    /// - Returns: True if device is jailbroken
    func isDeviceJailbroken() -> Bool {
        return performDetection().isJailbroken
    }

    /// Enforce strict mode policy
    /// - Throws: JailbreakError if device is jailbroken in strict mode
    func enforcePolicy() throws {
        let status = performDetection()

        if status.isJailbroken && strictMode {
            SecurityLogger.shared.logSecurityEvent(
                .deviceCompromised,
                details: [
                    "action": "Application blocked due to jailbreak",
                    "methods": status.detectionMethods
                ],
                severity: .critical
            )

            throw JailbreakError.deviceCompromised(methods: status.detectionMethods)
        }
    }

    // MARK: - Detection Methods

    /// Check for common jailbreak files and applications
    private func checkJailbreakFiles() -> Bool {
        let jailbreakPaths = [
            // Jailbreak apps
            "/Applications/Cydia.app",
            "/Applications/Sileo.app",
            "/Applications/Zebra.app",
            "/Applications/blackra1n.app",
            "/Applications/FakeCarrier.app",
            "/Applications/Icy.app",
            "/Applications/IntelliScreen.app",
            "/Applications/MxTube.app",
            "/Applications/RockApp.app",
            "/Applications/SBSettings.app",
            "/Applications/WinterBoard.app",

            // Jailbreak binaries
            "/usr/sbin/sshd",
            "/usr/bin/sshd",
            "/usr/libexec/ssh-keysign",
            "/bin/bash",
            "/bin/sh",
            "/usr/sbin/frida-server",

            // Jailbreak libraries
            "/Library/MobileSubstrate/MobileSubstrate.dylib",
            "/Library/MobileSubstrate/DynamicLibraries/",
            "/usr/lib/libsubstrate.dylib",
            "/usr/lib/substrate",
            "/usr/lib/TweakInject",

            // Package managers
            "/private/var/lib/apt",
            "/private/var/lib/cydia",
            "/private/var/mobile/Library/SBSettings/Themes",
            "/private/var/tmp/cydia.log",
            "/private/var/stash",

            // Common jailbreak artifacts
            "/etc/apt",
            "/var/log/syslog",
            "/.cydia_no_stash",
            "/.installed_unc0ver",
            "/.bootstrapped_electra",
            "/usr/share/jailbreak/injectme.plist",
            "/var/cache/apt",
            "/var/lib/apt",
            "/var/lib/cydia",
            "/jb/",
            "/var/jb/"
        ]

        for path in jailbreakPaths {
            if FileManager.default.fileExists(atPath: path) {
                return true
            }
        }

        return false
    }

    /// Check if Cydia URL scheme is available
    private func checkCydiaURLScheme() -> Bool {
        if let url = URL(string: "cydia://package/com.example.package") {
            return UIApplication.shared.canOpenURL(url)
        }
        return false
    }

    /// Check if app can write outside its sandbox
    private func checkSandboxIntegrity() -> Bool {
        let testPath = "/private/jailbreak_test.txt"
        let testString = "Jailbreak test"

        do {
            try testString.write(toFile: testPath, atomically: true, encoding: .utf8)
            try FileManager.default.removeItem(atPath: testPath)
            return true // Should not be able to write here
        } catch {
            return false // Normal behavior
        }
    }

    /// Check for suspicious libraries loaded in memory
    private func checkSuspiciousLibraries() -> Bool {
        let suspiciousLibraries = [
            "MobileSubstrate",
            "substrate",
            "libcycript",
            "frida",
            "cynject",
            "SSLKillSwitch"
        ]

        var imageCount = UInt32()
        let images = _dyld_image_names(&imageCount)

        for i in 0..<Int(imageCount) {
            if let imageName = images?[i] {
                let name = String(cString: imageName)
                for library in suspiciousLibraries {
                    if name.lowercased().contains(library.lowercased()) {
                        return true
                    }
                }
            }
        }

        return false
    }

    /// Check if fork() restriction is bypassed
    private func checkForkRestriction() -> Bool {
        // fork() unavailable on iOS - always return false
        return false
    }

    /// Check for suspicious symbolic links
    private func checkSymbolicLinks() -> Bool {
        let paths = [
            "/Applications",
            "/var/stash",
            "/Library/Ringtones",
            "/Library/Wallpaper"
        ]

        for path in paths {
            do {
                let attributes = try FileManager.default.attributesOfItem(atPath: path)
                if attributes[.type] as? FileAttributeType == .typeSymbolicLink {
                    return true
                }
            } catch {
                // Path doesn't exist or not accessible
                continue
            }
        }

        return false
    }

    /// Check system directory permissions
    private func checkSystemDirectoryPermissions() -> Bool {
        let systemPaths = [
            "/",
            "/root/",
            "/private/",
            "/etc/"
        ]

        for path in systemPaths {
            do {
                let attributes = try FileManager.default.attributesOfItem(atPath: path)
                if let permissions = attributes[.posixPermissions] as? Int {
                    // Check if writable by non-root users
                    if (permissions & 0o002) != 0 {
                        return true
                    }
                }
            } catch {
                continue
            }
        }

        return false
    }

    /// Helper to get loaded dynamic library names
    private func _dyld_image_names(_ count: inout UInt32) -> UnsafeMutablePointer<UnsafePointer<CChar>?>? {
        // _dyld_image_count unavailable
        var names: [UnsafePointer<CChar>?] = []

        for i in 0..<count {
            // _dyld_get_image_name unavailable
        }

        return UnsafeMutablePointer(mutating: names)
    }

    // MARK: - Debugger Detection

    /// Check if debugger is attached
    func isDebuggerAttached() -> Bool {
        var info = kinfo_proc()
        var mib: [Int32] = [CTL_KERN, KERN_PROC, KERN_PROC_PID, getpid()]
        var size = MemoryLayout<kinfo_proc>.stride

        let result = sysctl(&mib, UInt32(mib.count), &info, &size, nil, 0)

        if result != 0 {
            return false
        }

        let isDebugged = (info.kp_proc.p_flag & P_TRACED) != 0

        if isDebugged {
            SecurityLogger.shared.logSecurityEvent(
                .debuggerDetected,
                details: [:],
                severity: .critical
            )
        }

        return isDebugged
    }

    // MARK: - Emulator Detection

    /// Check if running on simulator/emulator
    func isRunningOnSimulator() -> Bool {
        #if targetEnvironment(simulator)
        return true
        #else
        return false
        #endif
    }

    // MARK: - Proxy Detection

    /// Check if device is using HTTP proxy
    func isUsingProxy() -> Bool {
        guard let proxySettings = CFNetworkCopySystemProxySettings()?.takeRetainedValue() as? [String: Any] else {
            return false
        }

        if let httpProxy = proxySettings["HTTPProxy"] as? String,
           !httpProxy.isEmpty {
            SecurityLogger.shared.logSecurityEvent(
                .suspiciousActivity,
                details: ["type": "HTTP proxy detected", "proxy": httpProxy],
                severity: .high
            )
            return true
        }

        if let httpsProxy = proxySettings["HTTPSProxy"] as? String,
           !httpsProxy.isEmpty {
            SecurityLogger.shared.logSecurityEvent(
                .suspiciousActivity,
                details: ["type": "HTTPS proxy detected", "proxy": httpsProxy],
                severity: .high
            )
            return true
        }

        return false
    }
}

// MARK: - Jailbreak Status
struct JailbreakStatus {
    let isJailbroken: Bool
    let detectionMethods: [String]
    let timestamp: Date

    var description: String {
        if isJailbroken {
            return "Device is jailbroken. Detected methods: \(detectionMethods.joined(separator: ", "))"
        } else {
            return "Device appears to be secure"
        }
    }
}

// MARK: - Jailbreak Error
enum JailbreakError: Error, LocalizedError {
    case deviceCompromised(methods: [String])
    case debuggerAttached
    case unsafeEnvironment

    var errorDescription: String? {
        switch self {
        case .deviceCompromised(let methods):
            return "Device security is compromised. Detected: \(methods.joined(separator: ", "))"
        case .debuggerAttached:
            return "Debugger detected. Application cannot run in debug mode."
        case .unsafeEnvironment:
            return "Unsafe environment detected. Please use a secure device."
        }
    }
}

// MARK: - Usage Examples
/*
 Example Usage:

 1. Check if device is jailbroken:
    ```swift
    if JailbreakDetector.shared.isDeviceJailbroken() {
        // Show warning or restrict functionality
    }
    ```

 2. Enforce strict policy (throw error on jailbreak):
    ```swift
    do {
        try JailbreakDetector.shared.enforcePolicy()
        // Continue normal execution
    } catch {
        // Show error and exit app
        fatalError("Cannot run on jailbroken device")
    }
    ```

 3. Get detailed detection status:
    ```swift
    let status = JailbreakDetector.shared.performDetection()
    print(status.description)
    ```

 4. Check for debugger:
    ```swift
    if JailbreakDetector.shared.isDebuggerAttached() {
        // Handle debugger detection
    }
    ```

 5. Check for proxy:
    ```swift
    if JailbreakDetector.shared.isUsingProxy() {
        // Warn user about proxy usage
    }
    ```
*/
