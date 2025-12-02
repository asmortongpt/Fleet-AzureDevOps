# iOS Deployment Automation - Complete Setup

**Production-ready CI/CD automation for DCF Fleet Management iOS App**

## Overview

This directory contains a complete, production-ready deployment automation system for the iOS app, including:

- ✅ **Fastlane Configuration** - Complete build and deployment automation
- ✅ **GitHub Actions Workflows** - CI/CD pipelines with manual approval
- ✅ **Deployment Scripts** - Shell scripts for local operations
- ✅ **Code Signing Management** - Automated certificate handling
- ✅ **Comprehensive Documentation** - Full guides and quick starts

## Quick Start

### For First-Time Setup

```bash
# 1. Install dependencies
gem install fastlane
bundle install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Run tests to verify
fastlane test

# 4. Deploy to TestFlight
./scripts/deploy-testflight.sh
```

See [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md) for detailed 5-minute setup.

### For Production Deployment

```bash
# Deploy to App Store (requires approval in CI/CD)
./scripts/deploy-appstore.sh
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete documentation.

## File Structure

```
mobile-apps/ios-native/
│
├── fastlane/                           # Fastlane automation
│   ├── Fastfile                        # Main configuration with all lanes
│   ├── Appfile                         # App identification
│   ├── Matchfile                       # Code signing configuration
│   ├── Deliverfile                     # App Store metadata
│   └── metadata/                       # App Store assets
│       ├── age_rating.json
│       └── en-US/                      # Localized metadata
│
├── .github/                            # GitHub Actions CI/CD
│   └── workflows/
│       ├── ci.yml                      # Continuous Integration
│       ├── cd-staging.yml              # Staging deployment (auto)
│       └── cd-production.yml           # Production deployment (manual approval)
│
├── scripts/                            # Deployment scripts
│   ├── build.sh                        # Build automation
│   ├── test.sh                         # Test runner
│   ├── deploy-testflight.sh            # TestFlight deployment
│   ├── deploy-appstore.sh              # App Store deployment
│   └── generate-screenshots.sh         # Screenshot generation
│
├── DEPLOYMENT_GUIDE.md                 # Complete deployment guide
├── DEPLOYMENT_QUICKSTART.md            # 5-minute quick start
├── .env.example                        # Environment variables template
├── Gemfile                             # Ruby dependencies
└── .gitignore.deployment               # Deployment artifacts to ignore
```

## Deployment Workflows

### 1. Continuous Integration (CI)

**Triggers**: Pull requests to main, develop, or release branches

**What it does**:
- Runs SwiftLint code quality checks
- Performs security vulnerability scanning
- Builds the project
- Runs all tests with code coverage
- Analyzes app size
- Reports results on PR

**No deployment** - validation only

### 2. Staging Deployment (Automatic)

**Triggers**: Push to `staging` or `develop` branch

**What it does**:
1. Validates code and runs tests
2. Builds staging version
3. **Automatically deploys to TestFlight**
4. Notifies team via Slack (optional)

**Environment**: Staging (no approval required)

**Timeline**: ~15-20 minutes from push to TestFlight availability

### 3. Production Deployment (Manual Approval)

**Triggers**: Push to `main` or `master` branch

**What it does**:
1. Validates branch and git status
2. Runs comprehensive test suite
3. **Waits for manual approval** ⚠️
4. Builds production version
5. Uploads to App Store Connect
6. Creates git tag for release
7. Optionally submits for App Store review

**Environment**: Production (requires approval)

**Timeline**: ~20-30 minutes after approval

## Available Lanes

### Testing Lanes

```bash
fastlane test              # Run all tests with code coverage
fastlane test_unit         # Run unit tests only
fastlane test_ui           # Run UI tests only
```

### Build Lanes

```bash
fastlane build_staging     # Build staging version
fastlane build_production  # Build production version
fastlane build_dev         # Build development version
```

### Deployment Lanes

```bash
fastlane beta              # Deploy to TestFlight (staging)
fastlane release           # Deploy to App Store (production)
fastlane submit_review     # Submit current build for review
```

### Utility Lanes

```bash
fastlane lint              # Run SwiftLint
fastlane clean             # Clean build artifacts
fastlane screenshots       # Generate App Store screenshots
fastlane sync_certificates # Sync code signing certificates
fastlane version_bump      # Bump version number
```

## Available Scripts

### Build Script

```bash
./scripts/build.sh [configuration] [output_dir]

# Examples:
./scripts/build.sh Release ./builds
./scripts/build.sh Debug /tmp/builds
```

### Test Script

```bash
./scripts/test.sh [device] [coverage]

# Examples:
./scripts/test.sh "iPhone 15 Pro" true
./scripts/test.sh "iPhone SE (3rd generation)" false
```

### TestFlight Deployment

```bash
./scripts/deploy-testflight.sh [skip-tests]

# Examples:
./scripts/deploy-testflight.sh
./scripts/deploy-testflight.sh skip-tests
```

### App Store Deployment

```bash
./scripts/deploy-appstore.sh [submit-for-review]

# Examples:
./scripts/deploy-appstore.sh
./scripts/deploy-appstore.sh submit-for-review
```

### Screenshot Generation

```bash
./scripts/generate-screenshots.sh [language]

# Examples:
./scripts/generate-screenshots.sh en-US
./scripts/generate-screenshots.sh es-MX
```

## Environment Setup

### Required Environment Variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

**Minimum required**:
```bash
APPLE_ID=your-apple-id@example.com
FASTLANE_PASSWORD=xxxx-xxxx-xxxx-xxxx
TEAM_ID=FFC6NRQ5U5
```

**For CI/CD**:
```bash
APP_STORE_CONNECT_API_KEY_ID=...
APP_STORE_CONNECT_API_ISSUER_ID=...
APP_STORE_CONNECT_API_KEY_CONTENT=...
MATCH_PASSWORD=...
MATCH_GIT_URL=...
```

### GitHub Secrets

Configure these secrets in GitHub repository settings:

1. Go to: **Repository → Settings → Secrets and variables → Actions**
2. Add all secrets from `.env.example`
3. Configure production environment with required reviewers

## Code Signing

### Match Setup (First Time)

```bash
# Initialize Match
fastlane match init

# Generate certificates
fastlane match development
fastlane match appstore
```

### Sync Certificates

```bash
# Sync from Match repository
fastlane sync_certificates
```

### Register New Devices

```bash
# Add devices to devices.txt, then:
fastlane register_devices
```

## Common Tasks

### Deploy to TestFlight

```bash
# Using script (recommended)
./scripts/deploy-testflight.sh

# Using Fastlane
fastlane beta
```

### Deploy to App Store

```bash
# Using script (recommended)
./scripts/deploy-appstore.sh

# Using Fastlane
fastlane release
```

### Run Tests Locally

```bash
# Using script
./scripts/test.sh "iPhone 15 Pro" true

# Using Fastlane
fastlane test
```

### Generate Screenshots

```bash
# Using script
./scripts/generate-screenshots.sh en-US

# Using Fastlane
fastlane screenshots
```

### Bump Version

```bash
fastlane version_bump type:patch   # 1.0.0 → 1.0.1
fastlane version_bump type:minor   # 1.0.0 → 1.1.0
fastlane version_bump type:major   # 1.0.0 → 2.0.0
```

## CI/CD Environments

### Staging Environment

- **Branch**: `staging` or `develop`
- **Deployment**: Automatic
- **Destination**: TestFlight (Internal Testing)
- **Approval**: Not required
- **Use case**: Testing new features before production

### Production Environment

- **Branch**: `main` or `master`
- **Deployment**: Manual approval required
- **Destination**: App Store Connect
- **Approval**: Required from designated team members
- **Use case**: Production releases to App Store

## Release Process

### 1. Feature Development

```bash
git checkout -b feature/new-feature
# Develop feature
git push origin feature/new-feature
# Create PR → CI runs automatically
```

### 2. Staging Deployment

```bash
git checkout develop
git merge feature/new-feature
git push origin develop
# Automatic deployment to TestFlight
```

### 3. Production Release

```bash
# Update version
fastlane version_bump type:minor

# Merge to main
git checkout main
git merge develop
git push origin main

# GitHub Actions workflow triggered
# → Requires manual approval
# → Deploys to App Store
```

## Monitoring & Troubleshooting

### View Workflow Status

- GitHub Actions: Repository → Actions tab
- Check workflow logs for detailed information

### Common Issues

#### Code Signing Errors

```bash
# Re-sync certificates
fastlane sync_certificates

# Or regenerate if expired
fastlane match appstore --force
```

#### Build Failures

```bash
# Clean and rebuild
fastlane clean
rm -rf ~/Library/Developer/Xcode/DerivedData
pod deintegrate && pod install
fastlane build_staging
```

#### Authentication Failures

1. Verify app-specific password is current
2. Check GitHub Secrets are set correctly
3. Consider using App Store Connect API Key (more reliable)

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#troubleshooting) for detailed troubleshooting.

## Security Best Practices

### Never Commit:

- `.env` files
- `*.p8` API keys
- `*.p12` certificates
- `*.mobileprovision` profiles
- Any credentials or secrets

### Use GitHub Secrets:

- All credentials in GitHub Secrets
- Never hardcode in workflow files
- Rotate secrets periodically

### Code Signing:

- Use Match for certificate management
- Store certificates in private repository
- Encrypt with strong password

## Support & Documentation

### Documentation

- **Quick Start**: [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)
- **Complete Guide**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Environment Setup**: [.env.example](./.env.example)

### External Resources

- [Fastlane Documentation](https://docs.fastlane.tools/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Apple Developer Portal](https://developer.apple.com)

### Getting Help

1. Check documentation above
2. Review GitHub Actions logs
3. Check Fastlane logs: `fastlane/report.xml`
4. Contact DevOps team
5. File an issue on GitHub

## Features

### ✅ Automated Testing

- Unit tests with code coverage
- UI tests
- Integration tests
- Code quality checks (SwiftLint)
- Security vulnerability scanning

### ✅ Automated Building

- Debug builds
- Release builds
- Staging builds
- Production builds
- Symbol generation

### ✅ Automated Deployment

- TestFlight deployment
- App Store deployment
- Manual approval for production
- Automatic version tagging
- Changelog generation

### ✅ Code Signing

- Automated certificate management
- Match integration
- Development profiles
- Distribution profiles
- Ad-hoc profiles

### ✅ App Store Assets

- Screenshot generation
- Metadata management
- Multi-language support
- App Store descriptions
- Privacy policy

### ✅ CI/CD Integration

- GitHub Actions workflows
- Automatic PR validation
- Branch-based deployment
- Environment protection
- Slack notifications

## Version Information

- **App Name**: DCF Fleet Management
- **Bundle ID**: com.capitaltechalliance.fleetmanagement
- **Version**: 1.0
- **Build**: 2
- **Min iOS**: 15.0
- **Team ID**: FFC6NRQ5U5

## License

Copyright © 2025 Capital Tech Alliance. All rights reserved.

---

## Next Steps

1. ✅ **Setup**: Follow [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md)
2. ✅ **Deploy**: Use scripts or Fastlane lanes
3. ✅ **Configure CI/CD**: Add GitHub Secrets
4. ✅ **Deploy to production**: Push to main branch

**Ready to deploy?** Start with the [Quick Start Guide](./DEPLOYMENT_QUICKSTART.md)!
