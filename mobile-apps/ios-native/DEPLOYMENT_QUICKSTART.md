# iOS Deployment Quick Start

Fast-track guide to get your deployment automation running in minutes.

## Prerequisites

- [ ] Xcode 15.0+ installed
- [ ] Apple Developer Account with admin access
- [ ] Ruby 3.0+ installed
- [ ] Git configured

## 5-Minute Setup

### 1. Install Dependencies (2 minutes)

```bash
# Install Fastlane
gem install fastlane

# Install CocoaPods (if needed)
gem install cocoapods

# Install project dependencies
bundle install
pod install  # if using CocoaPods
```

### 2. Configure Environment (2 minutes)

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Required values**:
- `APPLE_ID`: Your Apple ID email
- `FASTLANE_PASSWORD`: App-specific password from appleid.apple.com
- `TEAM_ID`: Your Apple Developer Team ID

### 3. Test Setup (1 minute)

```bash
# Run tests to verify everything works
fastlane test

# Or use the script
./scripts/test.sh
```

## First Deployment

### Deploy to TestFlight (Staging)

```bash
# Option 1: Using script (recommended for first time)
./scripts/deploy-testflight.sh

# Option 2: Using Fastlane directly
fastlane beta
```

**What happens**:
1. Runs all tests
2. Builds staging version
3. Uploads to TestFlight
4. Available for internal testing in ~10 minutes

### Deploy to App Store (Production)

```bash
# Option 1: Using script (recommended)
./scripts/deploy-appstore.sh

# Option 2: Using Fastlane directly
fastlane release
```

**What happens**:
1. Runs comprehensive tests
2. Builds production version
3. Uploads to App Store Connect
4. Creates git tag
5. Ready for manual submission to App Store

## GitHub Actions Setup

### 1. Add Secrets to GitHub (5 minutes)

Go to: **Repository → Settings → Secrets and variables → Actions**

Add these secrets:

```
Required:
- APPLE_ID
- FASTLANE_PASSWORD
- TEAM_ID
- KEYCHAIN_PASSWORD (any secure password)

For code signing:
- MATCH_PASSWORD
- MATCH_GIT_URL
- MATCH_GIT_BASIC_AUTHORIZATION

Recommended:
- APP_STORE_CONNECT_API_KEY_ID
- APP_STORE_CONNECT_API_ISSUER_ID
- APP_STORE_CONNECT_API_KEY_CONTENT
```

### 2. Configure Production Environment

1. Go to **Repository → Settings → Environments**
2. Create environment: `production`
3. Enable **Required reviewers**
4. Add team members who can approve deployments

### 3. Test CI/CD

```bash
# Trigger CI by creating a PR
git checkout -b test-ci
git push origin test-ci
# Create PR on GitHub

# Trigger staging deployment
git checkout develop
git push origin develop
# Automatically deploys to TestFlight

# Trigger production deployment (requires approval)
git checkout main
git push origin main
# Wait for approval, then deploys to App Store
```

## Common Tasks

### Run Tests

```bash
fastlane test              # All tests
./scripts/test.sh          # Using script
```

### Build Locally

```bash
fastlane build_staging     # Staging build
fastlane build_production  # Production build
./scripts/build.sh Release # Using script
```

### Bump Version

```bash
fastlane version_bump type:patch   # 1.0.0 → 1.0.1
fastlane version_bump type:minor   # 1.0.0 → 1.1.0
fastlane version_bump type:major   # 1.0.0 → 2.0.0
```

### Generate Screenshots

```bash
fastlane screenshots               # Using Fastlane
./scripts/generate-screenshots.sh  # Using script
```

## Troubleshooting

### "No signing certificate found"

```bash
# Setup code signing (first time)
fastlane match development
fastlane match appstore

# Or sync existing certificates
fastlane sync_certificates
```

### "Authentication failed"

1. Verify app-specific password:
   - Go to appleid.apple.com
   - Generate new app-specific password
   - Update `.env` file

2. Or use API Key (recommended):
   - Go to App Store Connect → Users and Access → Keys
   - Generate API Key
   - Add to `.env`:
     ```
     APP_STORE_CONNECT_API_KEY_ID=...
     APP_STORE_CONNECT_API_ISSUER_ID=...
     APP_STORE_CONNECT_API_KEY_CONTENT=...
     ```

### "Tests failed"

```bash
# Clean and rebuild
fastlane clean
pod deintegrate
pod install
fastlane test
```

## Available Lanes

```bash
# Testing
fastlane test              # All tests with coverage
fastlane test_unit         # Unit tests only
fastlane test_ui           # UI tests only

# Building
fastlane build_staging     # Build staging
fastlane build_production  # Build production
fastlane build_dev         # Build for development

# Deployment
fastlane beta              # Deploy to TestFlight
fastlane release           # Deploy to App Store
fastlane submit_review     # Submit for review

# Utilities
fastlane lint              # Run SwiftLint
fastlane clean             # Clean build artifacts
fastlane screenshots       # Generate screenshots
fastlane sync_certificates # Sync code signing
```

## Available Scripts

```bash
./scripts/build.sh [config] [output]      # Build app
./scripts/test.sh [device] [coverage]     # Run tests
./scripts/deploy-testflight.sh [skip]    # Deploy to TestFlight
./scripts/deploy-appstore.sh [submit]    # Deploy to App Store
./scripts/generate-screenshots.sh [lang] # Generate screenshots
```

## Quick Reference

### Deploy to TestFlight
```bash
./scripts/deploy-testflight.sh
```

### Deploy to App Store
```bash
./scripts/deploy-appstore.sh
```

### Run All Tests
```bash
./scripts/test.sh "iPhone 15 Pro" true
```

### Generate Screenshots
```bash
./scripts/generate-screenshots.sh en-US
```

## Next Steps

1. ✅ Setup complete? Read the full [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
2. ✅ Ready to deploy? Check the [Release Checklist](./DEPLOYMENT_GUIDE.md#release-checklist)
3. ✅ Need help? See [Troubleshooting](./DEPLOYMENT_GUIDE.md#troubleshooting)

## Support

- Documentation: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- Fastlane Docs: https://docs.fastlane.tools
- GitHub Actions: https://docs.github.com/en/actions

---

**Questions?** Contact the DevOps team or file an issue on GitHub.
