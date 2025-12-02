Below is a comprehensive production build script for iOS that meets the requirements you specified. This script is designed to be used in a macOS environment with Xcode and its command-line tools installed. It assumes that you have appropriate access to an Apple Developer account and that your machine is set up for code signing with the correct certificates and provisioning profiles.

### Prerequisites
- Xcode Command Line Tools
- Properly configured Xcode project with a valid `Info.plist` file.
- An App Store distribution provisioning profile and corresponding certificate installed.
- Environment variables set for CI/CD or a local `.env` file for manual execution.

### Environment Variables
- `PROJECT_DIR` - The directory of your Xcode project.
- `SCHEME_NAME` - The scheme to build.
- `EXPORT_OPTIONS_PLIST` - Path to the export options plist for App Store distribution.
- `APPLE_ID` - Apple ID for App Store Connect.
- `APP_SPECIFIC_PASSWORD` - App-specific password for altool authentication.
- `TEAM_ID` - Developer team ID.

### Build Script: `build_and_upload.sh`

```bash
#!/bin/bash

# Load environment variables from a file if present
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Setup
PROJECT_DIR=${PROJECT_DIR:-"."}
SCHEME_NAME=${SCHEME_NAME}
EXPORT_OPTIONS_PLIST=${EXPORT_OPTIONS_PLIST}
APPLE_ID=${APPLE_ID}
APP_SPECIFIC_PASSWORD=${APP_SPECIFIC_PASSWORD}
TEAM_ID=${TEAM_ID}

# Function to increment build number
increment_build_number() {
    echo "Incrementing build number..."
    plist="${PROJECT_DIR}/${SCHEME_NAME}/Info.plist"
    build_num=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "${plist}")
    build_num=$(($build_num + 1))
    /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $build_num" "${plist}"
}

# Clean Build Artifacts
echo "Cleaning build artifacts..."
xcodebuild clean -project "${PROJECT_DIR}/${SCHEME_NAME}.xcodeproj" -scheme "${SCHEME_NAME}" -configuration Release

# Update Build Number
increment_build_number

# Archive the App
echo "Archiving the app..."
archive_path="./build/${SCHEME_NAME}.xcarchive"
xcodebuild archive -project "${PROJECT_DIR}/${SCHEME_NAME}.xcodeproj" -scheme "${SCHEME_NAME}" -archivePath "${archive_path}" -sdk iphoneos -configuration Release | xcpretty

# Export IPA
echo "Exporting IPA..."
ipa_path="./build"
xcodebuild -exportArchive -archivePath "${archive_path}" -exportPath "${ipa_path}" -exportOptionsPlist "${EXPORT_OPTIONS_PLIST}" | xcpretty

# Validate IPA
echo "Validating IPA..."
ipa_file="${ipa_path}/${SCHEME_NAME}.ipa"
xcrun altool --validate-app -f "${ipa_file}" -t ios -u "${APPLE_ID}" -p "${APP_SPECIFIC_PASSWORD}" --output-format xml

# Upload to App Store Connect
echo "Uploading to App Store Connect..."
xcrun altool --upload-app -f "${ipa_file}" -t ios -u "${APPLE_ID}" -p "${APP_SPECIFIC_PASSWORD}" --output-format xml

# Error Handling
if [ $? -ne 0 ]; then
    echo "Error encountered. Exiting..."
    exit 1
else
    echo "Build and upload successful!"
fi
```

### Notes
1. **Logging**: The script uses `echo` for basic logging. For more sophisticated logging, consider integrating a logging framework or tool.
2. **Error Handling**: The script checks the exit status of commands using `$?` and exits if an error is encountered.
3. **Security**: Ensure that `.env` files and environment variables are secured, especially in CI/CD environments.
4. **CI/CD Integration**: For CI/CD, set the environment variables in the CI/CD pipeline configuration and ensure secure handling of credentials.

This script should be executable (`chmod +x build_and_upload.sh`) and can be run from the terminal or integrated into a CI/CD pipeline. Adjust paths and variables as necessary to fit your project structure and environment.