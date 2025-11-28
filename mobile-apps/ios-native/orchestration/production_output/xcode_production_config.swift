To create a Swift script that programmatically configures an Xcode project for production, we'll need to interact with the project's files and settings, typically managed by Xcode project files (`*.xcodeproj`) and `Info.plist`. This script will be executed as a pre-build step in Xcode. We'll use Swift along with some command-line utilities available on macOS.

### Step-by-Step Swift Script

#### 1. Preparation
First, ensure you have Swift installed on your macOS, which is typically available if you have Xcode installed. You'll also need to install `xcodeproj` command-line tool to modify the project file, which can be installed via [Homebrew](https://brew.sh/) with CocoaPods:

```bash
brew install cocoapods
gem install xcodeproj
```

#### 2. Create the Swift Script
Create a Swift file, e.g., `ConfigureProduction.swift`, and start scripting:

```swift
import Foundation

// MARK: - Constants
let projectPath = "path/to/YourProject.xcodeproj"
let plistPath = "path/to/YourProject/Info.plist"
let entitlementsPath = "path/to/YourProject/YourApp.entitlements"

// MARK: - Helper Functions
func shell(_ command: String) -> String {
    let task = Process()
    let pipe = Pipe()

    task.standardOutput = pipe
    task.standardError = pipe
    task.arguments = ["-c", command]
    task.launchPath = "/bin/zsh"
    task.launch()

    let data = pipe.fileHandleForReading.readDataToEndOfFile()
    return String(data: data, encoding: .utf8) ?? ""
}

func updatePlist(with values: [String: Any], path: String) {
    let plistURL = URL(fileURLWithPath: path)
    if var plistData = NSDictionary(contentsOf: plistURL) as? [String: Any] {
        for (key, value) in values {
            plistData[key] = value
        }
        (plistData as NSDictionary).write(to: plistURL, atomically: true)
    }
}

// MARK: - Configuration Steps

// Update Info.plist with production values
let productionValues: [String: Any] = [
    "CFBundleIdentifier": "com.yourcompany.yourapp",
    "CFBundleName": "YourApp Production",
    "APIEndpoint": "https://api.yourproductionurl.com"
]
updatePlist(with: productionValues, path: plistPath)

// Configure build settings
let buildSettingsCommands = [
    "xcodebuild -project \(projectPath) -target 'YourTarget' -configuration Release set GCC_OPTIMIZATION_LEVEL=s",
    "xcodebuild -project \(projectPath) -target 'YourTarget' -configuration Release set ENABLE_BITCODE=YES"
]
buildSettingsCommands.forEach { shell($0) }

// Set proper app identifiers and bundle IDs
shell("xcrun agvtool new-version -all 1.0.0")

// Configure entitlements for production
let entitlements: [String: Any] = [
    "aps-environment": "production"
]
updatePlist(with: entitlements, path: entitlementsPath)

// Set up code signing for distribution
shell("xcodebuild -project \(projectPath) -target 'YourTarget' -configuration Release CODE_SIGN_IDENTITY='iPhone Distribution: Your Company (ID)' PROVISIONING_PROFILE_SPECIFIER='Your Production Profile'")

// Configure push notification certificates
// Normally handled in the Apple Developer Portal and Xcode, not scriptable

// Enable production API endpoints
// Already set in Info.plist update step

// Set proper security flags
// Typically handled via Xcode project settings or Info.plist

print("Production configuration completed.")
```

#### 3. Running the Script
To run this script as part of the Xcode build process:

1. Open your Xcode project.
2. Go to the target’s build phases.
3. Add a new "Run Script" phase.
4. Write command to run the Swift script:
   ```bash
   swift path/to/ConfigureProduction.swift
   ```

#### 4. Security and Error Handling
Ensure that the script does not expose sensitive information, such as API endpoints and keys, within the source code repository. Handle errors in shell commands and file manipulations gracefully, checking for the existence of files and command success.

This script provides a basic framework and should be customized based on specific project requirements and environments. Always test scripts in a controlled environment before integrating them into production build processes.