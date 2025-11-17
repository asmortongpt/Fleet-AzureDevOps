# iOS Deployment Guide

Complete guide for deploying the DCF Fleet Management iOS app to TestFlight and the App Store.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [CI/CD Configuration](#cicd-configuration)
5. [Fastlane Setup](#fastlane-setup)
6. [Code Signing](#code-signing)
7. [Deployment Workflows](#deployment-workflows)
8. [Manual Deployment](#manual-deployment)
9. [Scripts Reference](#scripts-reference)
10. [Troubleshooting](#troubleshooting)
11. [Release Checklist](#release-checklist)

---

## Overview

This project uses a complete CI/CD automation system for iOS deployments:

- **Fastlane**: Build automation and App Store submission
- **GitHub Actions**: Continuous Integration and Deployment
- **Match**: Code signing certificate management
- **Shell Scripts**: Local deployment tools

### Deployment Environments

- **Staging**: Automatic deployment to TestFlight for internal testing
- **Production**: Manual approval required for App Store releases

---

## Prerequisites

### Required Tools

1. **Xcode 15.0+**
   ```bash
   xcode-select --install
   xcodebuild -version
   ```

2. **Ruby 3.2+** (for Fastlane)
   ```bash
   ruby --version
   gem update --system
   ```

3. **Fastlane**
   ```bash
   gem install fastlane
   fastlane --version
   ```

4. **CocoaPods** (if using dependencies)
   ```bash
   gem install cocoapods
   pod --version
   ```

5. **xcpretty** (optional, for pretty build output)
   ```bash
   gem install xcpretty
   ```

### Apple Developer Account

- **Apple ID** with admin access to App Store Connect
- **App-Specific Password** generated from appleid.apple.com
- **Development Team ID** (found in Apple Developer Portal)
- **App Store Connect API Key** (recommended for CI/CD)

### App Store Connect Setup

1. **Create App** in App Store Connect
   - App Name: DCF Fleet Management
   - Bundle ID: com.capitaltechalliance.fleetmanagement
   - SKU: Choose unique identifier

2. **Configure App Information**
   - Privacy Policy URL
   - Support URL
   - Marketing URL
   - Age Rating
   - Copyright

3. **Add Internal Testers** (for TestFlight)
   - Create internal testing group
   - Add team members

---

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/fleet-management.git
cd fleet-management/mobile-apps/ios-native
```

### 2. Install Dependencies

```bash
# Install Ruby dependencies
bundle install

# Install CocoaPods dependencies (if needed)
pod install

# Verify Fastlane installation
fastlane --version
```

### 3. Configure Environment

Create a `.env` file in the project root:

```bash
# .env - DO NOT COMMIT THIS FILE
# Add to .gitignore

# Apple ID Configuration
APPLE_ID=your-apple-id@example.com
FASTLANE_USER=your-apple-id@example.com
FASTLANE_PASSWORD=your-app-specific-password
FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD=your-app-specific-password

# Team ID
TEAM_ID=FFC6NRQ5U5
ITC_TEAM_ID=FFC6NRQ5U5

# Match (Code Signing)
MATCH_PASSWORD=your-match-password
MATCH_GIT_URL=git@github.com:your-org/certificates.git
MATCH_GIT_BASIC_AUTHORIZATION=base64-encoded-credentials
MATCH_KEYCHAIN_NAME=fastlane_tmp_keychain
MATCH_KEYCHAIN_PASSWORD=temporary-password

# App Store Connect API (Recommended)
APP_STORE_CONNECT_API_KEY_ID=your-api-key-id
APP_STORE_CONNECT_API_ISSUER_ID=your-issuer-id
APP_STORE_CONNECT_API_KEY_CONTENT=your-api-key-content

# Optional
SLACK_WEBHOOK_URL=your-slack-webhook-url
```

### 4. Generate App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. Navigate to "Security" section
4. Under "App-Specific Passwords", click "Generate Password"
5. Enter label: "Fastlane CI/CD"
6. Copy the generated password and add to `.env`

### 5. Create App Store Connect API Key (Recommended)

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to "Users and Access" > "Keys"
3. Click "+" to generate new API key
4. Give it name: "Fastlane API"
5. Select role: "App Manager" or "Admin"
6. Download the `.p8` file
7. Note the Key ID and Issuer ID
8. Convert to base64:
   ```bash
   cat AuthKey_XXXXXXX.p8 | base64
   ```
9. Add to `.env` file

---

## CI/CD Configuration

### GitHub Actions Setup

The project includes three GitHub Actions workflows:

1. **ci.yml** - Continuous Integration (runs on PRs)
2. **cd-staging.yml** - Staging Deployment (deploys to TestFlight)
3. **cd-production.yml** - Production Deployment (deploys to App Store)

### Required GitHub Secrets

Go to GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

```
APPLE_ID                                    # Your Apple ID email
FASTLANE_PASSWORD                           # App-specific password
TEAM_ID                                     # Apple Developer Team ID
ITC_TEAM_ID                                 # iTunes Connect Team ID (usually same as TEAM_ID)

# Code Signing
MATCH_PASSWORD                              # Password to encrypt certificates
MATCH_GIT_URL                               # Git URL for certificates repo
MATCH_GIT_BASIC_AUTHORIZATION               # Base64 encoded git credentials
KEYCHAIN_PASSWORD                           # Temporary keychain password

# App Store Connect API (Recommended)
APP_STORE_CONNECT_API_KEY_ID                # API Key ID
APP_STORE_CONNECT_API_ISSUER_ID             # API Issuer ID
APP_STORE_CONNECT_API_KEY_CONTENT           # Base64 encoded .p8 file

# Optional
SLACK_WEBHOOK_URL                           # Slack webhook for notifications
```

### Environment Protection Rules

1. **Staging Environment**
   - No approval required
   - Auto-deploy on push to `staging` or `develop` branch

2. **Production Environment**
   - **Requires manual approval**
   - Only deploys from `main` or `master` branch
   - Set up in: Repository Settings → Environments → New environment

To configure production approval:

```
1. Go to Repository Settings
2. Click "Environments"
3. Create "production" environment
4. Enable "Required reviewers"
5. Add team members who can approve deployments
```

---

## Fastlane Setup

### Project Structure

```
mobile-apps/ios-native/
├── fastlane/
│   ├── Fastfile              # Main configuration
│   ├── Appfile               # App identification
│   ├── Matchfile             # Code signing config
│   ├── Deliverfile           # App Store metadata
│   └── metadata/
│       ├── age_rating.json
│       └── en-US/
│           ├── name.txt
│           ├── description.txt
│           └── ...
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── cd-staging.yml
│       └── cd-production.yml
└── scripts/
    ├── build.sh
    ├── test.sh
    ├── deploy-testflight.sh
    ├── deploy-appstore.sh
    └── generate-screenshots.sh
```

### Available Fastlane Lanes

#### Testing

```bash
# Run all tests with code coverage
fastlane test

# Run unit tests only
fastlane test_unit

# Run UI tests only
fastlane test_ui
```

#### Building

```bash
# Build for staging (TestFlight)
fastlane build_staging

# Build for production (App Store)
fastlane build_production

# Build for development
fastlane build_dev
```

#### Deployment

```bash
# Deploy to TestFlight (staging)
fastlane beta

# Deploy to App Store (production)
fastlane release

# Submit current build for App Store review
fastlane submit_review
```

#### Utilities

```bash
# Run SwiftLint
fastlane lint

# Clean build artifacts
fastlane clean

# Generate App Store screenshots
fastlane screenshots

# Sync code signing certificates
fastlane sync_certificates

# Register new devices
fastlane register_devices

# Bump version number
fastlane version_bump type:patch  # or minor, major

# Generate changelog
fastlane generate_changelog
```

---

## Code Signing

### Match Setup

Fastlane Match manages certificates and provisioning profiles in a private git repository.

#### First-Time Setup

1. **Create a private repository** for certificates:
   ```bash
   # On GitHub, create a new private repository: certificates
   git clone git@github.com:your-org/certificates.git
   ```

2. **Initialize Match**:
   ```bash
   fastlane match init
   ```

3. **Generate certificates**:
   ```bash
   # Development certificates
   fastlane match development

   # App Store certificates
   fastlane match appstore

   # Ad Hoc certificates (optional)
   fastlane match adhoc
   ```

4. **Store Match password securely**:
   - Add to 1Password, LastPass, or similar
   - Add to GitHub Secrets: `MATCH_PASSWORD`
   - Add to `.env` file (local only)

#### Certificate Management

```bash
# View certificates
fastlane match development --readonly

# Force regenerate certificates (if expired)
fastlane match development --force

# Add new device
fastlane register_devices
fastlane match development --force_for_new_devices
```

#### Troubleshooting Code Signing

If you encounter code signing issues:

1. **Revoke and regenerate**:
   ```bash
   fastlane match nuke development
   fastlane match nuke distribution
   fastlane match development
   fastlane match appstore
   ```

2. **Manual certificate management**:
   - Go to Apple Developer Portal
   - Certificates, Identifiers & Profiles
   - Revoke old certificates
   - Generate new ones using Match

---

## Deployment Workflows

### Continuous Integration (CI)

**Trigger**: Pull request to `main`, `develop`, or `release/*` branches

**Actions**:
1. Code quality checks (SwiftLint)
2. Security vulnerability scanning
3. Build project
4. Run all tests
5. Generate code coverage report
6. Analyze app size

**No deployment** - only validation

### Staging Deployment (CD-Staging)

**Trigger**: Push to `staging` or `develop` branch

**Actions**:
1. Pre-deployment checks
2. Run tests
3. Build staging version
4. **Automatic deployment to TestFlight**
5. Notify team

**Environment**: Staging (no approval required)

### Production Deployment (CD-Production)

**Trigger**: Push to `main` or `master` branch

**Actions**:
1. Validate branch and git status
2. Extract version and changelog
3. Run comprehensive tests
4. **Manual approval required** ⚠️
5. Build production version
6. Upload to App Store Connect
7. Create git tag
8. Optionally submit for review

**Environment**: Production (requires approval)

---

## Manual Deployment

### Using Scripts

#### 1. Build Locally

```bash
# Build for release
./scripts/build.sh Release ./builds

# Build and export IPA
./scripts/build.sh Release ./builds
# Follow prompts to export IPA
```

#### 2. Run Tests

```bash
# Run all tests with coverage
./scripts/test.sh "iPhone 15 Pro" true

# Run tests without coverage
./scripts/test.sh "iPhone 15 Pro" false
```

#### 3. Deploy to TestFlight

```bash
# Deploy with tests
./scripts/deploy-testflight.sh

# Deploy without tests (not recommended)
./scripts/deploy-testflight.sh skip-tests
```

#### 4. Deploy to App Store

```bash
# Upload to App Store (no auto-submit)
./scripts/deploy-appstore.sh

# Upload and submit for review
./scripts/deploy-appstore.sh submit-for-review
```

#### 5. Generate Screenshots

```bash
# Generate screenshots for English
./scripts/generate-screenshots.sh en-US

# Generate for other languages
./scripts/generate-screenshots.sh es-MX
```

### Using Fastlane Directly

#### TestFlight Deployment

```bash
# Complete deployment to TestFlight
fastlane beta

# Or step by step:
fastlane test                    # Run tests
fastlane build_staging           # Build staging
fastlane pilot upload           # Upload to TestFlight
```

#### App Store Deployment

```bash
# Complete deployment to App Store
fastlane release

# Or step by step:
fastlane test                    # Run tests
fastlane build_production        # Build production
fastlane deliver                 # Upload to App Store
```

### Using Xcode

1. **Open project**:
   ```bash
   open App.xcworkspace
   # or
   open App.xcodeproj
   ```

2. **Select scheme**: App

3. **Select device**: Any iOS Device (arm64)

4. **Archive**:
   - Product → Archive
   - Wait for archive to complete

5. **Distribute**:
   - Click "Distribute App"
   - Select "App Store Connect"
   - Select "Upload"
   - Choose options:
     - Include bitcode: NO
     - Upload symbols: YES
   - Click "Upload"

6. **Monitor processing**:
   - Go to App Store Connect
   - Wait for build to appear (5-15 minutes)

---

## Scripts Reference

### build.sh

Build the iOS app locally.

**Usage**:
```bash
./scripts/build.sh [configuration] [output_dir]
```

**Examples**:
```bash
# Build release version
./scripts/build.sh Release

# Build debug version to specific directory
./scripts/build.sh Debug /tmp/builds

# Build and export IPA
./scripts/build.sh Release ./builds
# Answer "yes" when prompted to export IPA
```

### test.sh

Run tests with code coverage.

**Usage**:
```bash
./scripts/test.sh [device] [coverage]
```

**Examples**:
```bash
# Run tests on iPhone 15 Pro with coverage
./scripts/test.sh "iPhone 15 Pro" true

# Run tests without coverage
./scripts/test.sh "iPhone 15 Pro" false

# Run tests on iPad
./scripts/test.sh "iPad Pro (12.9-inch) (6th generation)" true
```

### deploy-testflight.sh

Deploy to TestFlight for internal testing.

**Usage**:
```bash
./scripts/deploy-testflight.sh [skip-tests]
```

**Examples**:
```bash
# Deploy with tests
./scripts/deploy-testflight.sh

# Deploy without tests (not recommended)
./scripts/deploy-testflight.sh skip-tests
```

### deploy-appstore.sh

Deploy to App Store for production release.

**Usage**:
```bash
./scripts/deploy-appstore.sh [submit-for-review]
```

**Examples**:
```bash
# Upload to App Store (manual review submission)
./scripts/deploy-appstore.sh

# Upload and automatically submit for review
./scripts/deploy-appstore.sh submit-for-review
```

### generate-screenshots.sh

Generate App Store screenshots.

**Usage**:
```bash
./scripts/generate-screenshots.sh [language]
```

**Examples**:
```bash
# Generate English screenshots
./scripts/generate-screenshots.sh en-US

# Generate Spanish screenshots
./scripts/generate-screenshots.sh es-MX
```

---

## Troubleshooting

### Common Issues

#### 1. Code Signing Errors

**Problem**: "No signing certificate found"

**Solution**:
```bash
# Sync certificates from Match
fastlane match development --readonly
fastlane match appstore --readonly

# If expired, regenerate
fastlane match development --force
fastlane match appstore --force
```

#### 2. Build Failures

**Problem**: Build fails with compilation errors

**Solution**:
```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Clean project
xcodebuild clean

# Reinstall dependencies
pod deintegrate
pod install

# Rebuild
fastlane build_staging
```

#### 3. TestFlight Upload Fails

**Problem**: "Authentication failed"

**Solution**:
1. Verify app-specific password:
   ```bash
   echo $FASTLANE_PASSWORD
   ```

2. Regenerate app-specific password:
   - Go to appleid.apple.com
   - Generate new password
   - Update `.env` and GitHub Secrets

3. Use API Key instead:
   - Generate App Store Connect API Key
   - Add to environment variables

#### 4. Match Password Issues

**Problem**: "Decryption failed"

**Solution**:
```bash
# Verify Match password
echo $MATCH_PASSWORD

# Update Match repository
git clone $MATCH_GIT_URL
cd certificates
git pull origin main

# Re-run Match
fastlane match appstore --readonly
```

#### 5. Simulator Not Found

**Problem**: "Simulator not available"

**Solution**:
```bash
# List available simulators
xcrun simctl list devices available

# Create new simulator
xcrun simctl create "iPhone 15 Pro" "iPhone 15 Pro" "iOS17.0"

# Boot simulator
xcrun simctl boot "simulator-id"
```

#### 6. GitHub Actions Fails

**Problem**: CI/CD workflow fails

**Solution**:
1. Check GitHub Secrets are set correctly
2. Verify environment protection rules
3. Check workflow logs for specific errors
4. Ensure branch protection rules allow workflow runs

---

## Release Checklist

### Pre-Release (1-2 weeks before)

- [ ] All features complete and merged
- [ ] All tests passing (unit, integration, UI)
- [ ] Code review completed
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] App Store assets prepared (screenshots, descriptions)
- [ ] Privacy policy updated
- [ ] Support documentation updated
- [ ] Beta testing completed
- [ ] Bug fixes merged

### Version Preparation

- [ ] Update version number:
  ```bash
  fastlane version_bump type:minor
  ```
- [ ] Update CHANGELOG.md
- [ ] Update release notes in `fastlane/metadata/en-US/release_notes.txt`
- [ ] Commit version bump:
  ```bash
  git add .
  git commit -m "Bump version to X.Y.Z"
  git push origin develop
  ```

### Staging Deployment

- [ ] Merge to `staging` or `develop` branch
- [ ] Verify GitHub Actions workflow runs
- [ ] Wait for TestFlight upload (5-15 minutes)
- [ ] Test on TestFlight with internal team
- [ ] Verify all functionality
- [ ] Check crash reports
- [ ] Get team approval

### Production Deployment

- [ ] Create release branch:
  ```bash
  git checkout -b release/vX.Y.Z
  ```
- [ ] Final testing on release branch
- [ ] Merge to `main`:
  ```bash
  git checkout main
  git merge release/vX.Y.Z
  git push origin main
  ```
- [ ] Approve production deployment in GitHub Actions
- [ ] Wait for App Store upload (5-15 minutes)
- [ ] Verify build appears in App Store Connect
- [ ] Submit for App Store review
- [ ] Monitor review status

### Post-Release

- [ ] Create GitHub release with notes
- [ ] Tag release:
  ```bash
  git tag -a vX.Y.Z -m "Release vX.Y.Z"
  git push origin vX.Y.Z
  ```
- [ ] Announce release to team
- [ ] Update documentation
- [ ] Monitor crash reports
- [ ] Monitor user feedback
- [ ] Prepare hotfix branch if needed

### App Store Submission

- [ ] Complete App Information in App Store Connect
- [ ] Add screenshots (all required sizes)
- [ ] Write app description
- [ ] Set keywords
- [ ] Add privacy policy URL
- [ ] Add support URL
- [ ] Set age rating
- [ ] Configure in-app purchases (if any)
- [ ] Set pricing and availability
- [ ] Submit for review
- [ ] Respond to review questions promptly

### Monitoring

- [ ] Monitor App Store review status
- [ ] Check TestFlight feedback
- [ ] Monitor crash reports (Crashlytics/Sentry)
- [ ] Monitor analytics
- [ ] Review user ratings and reviews
- [ ] Prepare support responses
- [ ] Plan next release

---

## Useful Commands

### Fastlane

```bash
# View all available lanes
fastlane lanes

# Get help for specific lane
fastlane action deliver

# Update Fastlane
gem install fastlane

# Initialize Fastlane (first time)
fastlane init
```

### Xcode

```bash
# Select Xcode version
sudo xcode-select -s /Applications/Xcode.app

# View Xcode version
xcodebuild -version

# List schemes
xcodebuild -list

# List available simulators
xcrun simctl list devices
```

### CocoaPods

```bash
# Install dependencies
pod install

# Update dependencies
pod update

# Reinstall dependencies
pod deintegrate
pod install
```

### Git

```bash
# Create release branch
git checkout -b release/v1.0.0

# Tag release
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# View tags
git tag -l
```

---

## Additional Resources

### Documentation

- [Fastlane Documentation](https://docs.fastlane.tools/)
- [Match Documentation](https://docs.fastlane.tools/actions/match/)
- [Deliver Documentation](https://docs.fastlane.tools/actions/deliver/)
- [Snapshot Documentation](https://docs.fastlane.tools/actions/snapshot/)
- [Apple App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### Tools

- [App Store Connect](https://appstoreconnect.apple.com)
- [Apple Developer Portal](https://developer.apple.com)
- [TestFlight](https://testflight.apple.com)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### Support

For deployment issues:
1. Check this documentation
2. Review GitHub Actions logs
3. Check Fastlane logs: `fastlane/report.xml`
4. Contact DevOps team
5. File an issue on GitHub

---

## Security Notes

### Secrets Management

**Never commit these files**:
- `.env`
- `*.p8` (API keys)
- `*.p12` (certificates)
- `*.mobileprovision`
- `AuthKey_*.p8`

**Add to `.gitignore`**:
```gitignore
.env
.env.*
*.p8
*.p12
*.mobileprovision
fastlane/report.xml
fastlane/Preview.html
fastlane/screenshots
fastlane/test_output
builds/
test_output/
```

### GitHub Secrets

All sensitive data should be stored as GitHub Secrets, not in code.

### API Keys

Use App Store Connect API Keys instead of username/password for better security.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-11 | Initial deployment automation setup |

---

## License

Copyright © 2025 Capital Tech Alliance. All rights reserved.
