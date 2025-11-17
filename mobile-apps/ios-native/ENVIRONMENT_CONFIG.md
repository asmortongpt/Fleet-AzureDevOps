# iOS Multi-Environment Configuration

## Overview
The Fleet Management iOS app now supports four distinct environments with automatic environment selection based on build configuration.

## Supported Environments

### 1. **Local Development** (LOCAL)
- **URL**: `http://localhost:3000`
- **Use Case**: Running backend locally on your development machine
- **When to use**: Active local development and debugging

### 2. **Development** (DEVELOPMENT)
- **URL**: `http://172.168.84.37`
- **Use Case**: Shared development/test backend server
- **When to use**: Testing with other team members, integration testing

### 3. **Staging** (STAGING)
- **URL**: `https://staging.fleet.capitaltechalliance.com`
- **Use Case**: Pre-production testing environment
- **When to use**: Final testing before production deployment, client demos

### 4. **Production** (PRODUCTION) - Default
- **URL**: `https://fleet.capitaltechalliance.com`
- **Use Case**: Live production environment
- **When to use**: App Store builds, production releases

## How to Switch Environments

### Method 1: Xcode Build Schemes (Recommended)

#### Step 1: Create Build Schemes
1. In Xcode, go to **Product** → **Scheme** → **Manage Schemes...**
2. Duplicate the "App" scheme 3 times and rename them:
   - `App - Local`
   - `App - Development`
   - `App - Staging`
   - `App - Production` (or keep original "App" for production)

#### Step 2: Configure Compiler Flags
For each scheme:
1. Select the scheme and click **Edit Scheme...**
2. Go to **Build** → **Pre-actions**
3. Under **Build Settings**, add the following compiler flags for each scheme:

**App - Local**:
```
OTHER_SWIFT_FLAGS = -DLOCAL
```

**App - Development**:
```
OTHER_SWIFT_FLAGS = -DDEVELOPMENT
```

**App - Staging**:
```
OTHER_SWIFT_FLAGS = -DSTAGING
```

**App - Production**:
```
OTHER_SWIFT_FLAGS = (leave empty or no flag - production is default)
```

#### Step 3: Select Scheme Before Building
- Choose the appropriate scheme from the scheme selector in Xcode's toolbar
- Build and run the app - it will automatically connect to the correct environment

### Method 2: Build Configurations (Alternative)

Create custom build configurations in Xcode:
1. Go to **Project Settings** → **Info** → **Configurations**
2. Duplicate **Debug** and **Release** configurations:
   - Debug-Local
   - Debug-Development
   - Debug-Staging
   - Release-Production

3. For each configuration, set the appropriate Swift compiler flag in **Build Settings**:
   - Search for "Other Swift Flags"
   - Add `-DLOCAL`, `-DDEVELOPMENT`, or `-DSTAGING` as needed

## Verifying Current Environment

The app provides helper properties to check the current environment:

```swift
// Get current environment name
print(APIConfiguration.environmentName)  // "Production", "Staging", "Development", or "Local Development"

// Check if production
if APIConfiguration.isProduction {
    // Production-specific behavior
}

// Get base URL
print(APIConfiguration.apiBaseURL)  // Full API URL for current environment
```

## Implementation Details

The environment selection is handled in `APIConfiguration.swift`:

```swift
static var current: APIEnvironment {
    #if LOCAL
        return .local
    #elseif DEVELOPMENT
        return .development
    #elseif STAGING
        return .staging
    #else
        return .production // Default for all builds without flags
    #endif
}
```

## Best Practices

1. **Never commit with LOCAL flag**: Local development should only be used on your machine
2. **Use DEVELOPMENT for team testing**: Share the development backend URL with the team
3. **Staging for client demos**: Always use staging for pre-production client presentations
4. **Production for releases**: App Store submissions should always use production environment
5. **Document backend URLs**: Keep this file updated if backend URLs change

## Backend Environment Setup

Each environment requires a corresponding backend deployment:

- **Local**: Run `npm run dev` in the Fleet API directory
- **Development**: Shared test server at 172.168.84.37
- **Staging**: Azure deployment at staging.fleet.capitaltechalliance.com
- **Production**: Azure production at fleet.capitaltechalliance.com

## Troubleshooting

### App connects to wrong environment
- Verify the correct scheme is selected in Xcode
- Check **Build Settings** → **Other Swift Flags** for the active configuration
- Clean build folder (**Product** → **Clean Build Folder**) and rebuild

### Cannot reach backend
- Ensure the backend server is running for the selected environment
- Check network connectivity (especially for local development)
- Verify firewall/VPN settings for remote environments

### Build errors after switching
- Clean derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
- Reinstall pods: `cd mobile-apps/ios-native && pod install`
- Restart Xcode

## Migration Notes

**Previous Setup**: The app was hardcoded to production environment only.

**New Setup**: Four environments with automatic selection based on build configuration.

**Breaking Changes**: None - defaults to production if no compiler flag is set.
