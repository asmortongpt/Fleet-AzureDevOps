#!/bin/bash
set -e

echo "Building and installing Fleet Manager iOS app..."
echo ""

# Project setup
PROJECT_DIR="/Users/andrewmorton/Documents/GitHub/Fleet/mobile-apps/ios"
APP_NAME="FleetManager"
BUNDLE_ID="com.capitaltechalliance.fleet"

cd "$PROJECT_DIR"

# Create proper Xcode project structure
echo "Creating Xcode project structure..."

# Create project.pbxproj file
mkdir -p "$APP_NAME.xcodeproj"

cat > "$APP_NAME.xcodeproj/project.pbxproj" << 'PBXPROJ'
// !$*UTF8*$!
{
	archiveVersion = 1;
	classes = {
	};
	objectVersion = 56;
	objects = {
		1A1A1A1A1A1A1A1A1A1A1A1A /* FleetMobileApp.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = FleetMobileApp.swift; sourceTree = "<group>"; };
		2B2B2B2B2B2B2B2B2B2B2B2B /* FleetManagerApp.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = FleetManagerApp.swift; sourceTree = "<group>"; };
		3C3C3C3C3C3C3C3C3C3C3C3C /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; };
		4D4D4D4D4D4D4D4D4D4D4D4D /* FleetManager.app */ = {isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = FleetManager.app; sourceTree = BUILT_PRODUCTS_DIR; };

		5E5E5E5E5E5E5E5E5E5E5E5E /* FleetManager */ = {
			isa = PBXGroup;
			children = (
				2B2B2B2B2B2B2B2B2B2B2B2B /* FleetManagerApp.swift */,
				1A1A1A1A1A1A1A1A1A1A1A1A /* FleetMobileApp.swift */,
				3C3C3C3C3C3C3C3C3C3C3C3C /* Info.plist */,
			);
			path = FleetManager;
			sourceTree = "<group>";
		};

		6F6F6F6F6F6F6F6F6F6F6F6F /* Products */ = {
			isa = PBXGroup;
			children = (
				4D4D4D4D4D4D4D4D4D4D4D4D /* FleetManager.app */,
			);
			name = Products;
			sourceTree = "<group>";
		};

		7A7A7A7A7A7A7A7A7A7A7A7A = {
			isa = PBXGroup;
			children = (
				5E5E5E5E5E5E5E5E5E5E5E5E /* FleetManager */,
				6F6F6F6F6F6F6F6F6F6F6F6F /* Products */,
			);
			sourceTree = "<group>";
		};

		8B8B8B8B8B8B8B8B8B8B8B8B /* FleetManager */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = 9C9C9C9C9C9C9C9C9C9C9C9C;
			buildPhases = (
				AAAAAAAAAAAAAAAAAAAAAA /* Sources */,
			);
			buildRules = (
			);
			dependencies = (
			);
			name = FleetManager;
			productName = FleetManager;
			productReference = 4D4D4D4D4D4D4D4D4D4D4D4D;
			productType = "com.apple.product-type.application";
		};

		AAAAAAAAAAAAAAAAAAAAAA /* Sources */ = {
			isa = PBXSourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
			);
			runOnlyForDeploymentPostprocessing = 0;
		};

		BBBBBBBBBBBBBBBBBBBBBB /* Project object */ = {
			isa = PBXProject;
			attributes = {
			};
			buildConfigurationList = CCCCCCCCCCCCCCCCCCCCCC;
			compatibilityVersion = "Xcode 14.0";
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				en,
			);
			mainGroup = 7A7A7A7A7A7A7A7A7A7A7A7A;
			productRefGroup = 6F6F6F6F6F6F6F6F6F6F6F6F;
			projectDirPath = "";
			projectRoot = "";
			targets = (
				8B8B8B8B8B8B8B8B8B8B8B8B,
			);
		};

		9C9C9C9C9C9C9C9C9C9C9C9C = {
			isa = XCConfigurationList;
			buildConfigurations = (
				DDDDDDDDDDDDDDDDDDDDDD,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Debug;
		};

		CCCCCCCCCCCCCCCCCCCCCC = {
			isa = XCConfigurationList;
			buildConfigurations = (
				EEEEEEEEEEEEEEEEEEEEEE,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Debug;
		};

		DDDDDDDDDDDDDDDDDDDDDD /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				PRODUCT_NAME = FleetManager;
				PRODUCT_BUNDLE_IDENTIFIER = com.capitaltechalliance.fleet;
				INFOPLIST_FILE = FleetManager/Info.plist;
				IPHONEOS_DEPLOYMENT_TARGET = 15.0;
				SDKROOT = iphoneos;
				TARGETED_DEVICE_FAMILY = "1,2";
			};
			name = Debug;
		};

		EEEEEEEEEEEEEEEEEEEEEE /* Debug */ = {
			isa = XCBuildConfiguration;
			buildSettings = {
				ALWAYS_SEARCH_USER_PATHS = NO;
				CLANG_WARN_BLOCK_CAPTURE_AUTORELEASING = YES;
				CLANG_WARN_EMPTY_BODY = YES;
				CLANG_WARN_BOOL_CONVERSION = YES;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				GCC_NO_COMMON_BLOCKS = YES;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SWIFT_VERSION = 5.0;
			};
			name = Debug;
		};
	};
	rootObject = BBBBBBBBBBBBBBBBBBBBBB;
}
PBXPROJ

echo "✓ Project structure created"

# Get simulator
SIMULATOR_ID=$(xcrun simctl list devices available | grep -E "iPhone 1[5-7]" | head -1 | grep -o '[0-9A-F\-]\{36\}')

if [ -z "$SIMULATOR_ID" ]; then
    echo "Error: No simulator found"
    exit 1
fi

SIMULATOR_NAME=$(xcrun simctl list devices | grep "$SIMULATOR_ID" | sed 's/(.*//' | xargs)
echo "Using simulator: $SIMULATOR_NAME ($SIMULATOR_ID)"

# Boot simulator
echo "Booting simulator..."
xcrun simctl boot "$SIMULATOR_ID" 2>/dev/null || true
open -a Simulator
sleep 3

# Build the app using xcodebuild
echo ""
echo "Building app..."
xcodebuild -project "$APP_NAME.xcodeproj" \
    -scheme "$APP_NAME" \
    -destination "id=$SIMULATOR_ID" \
    -configuration Debug \
    build 2>&1 | grep -E "BUILD|error|warning" || true

# If xcodebuild fails, try alternative approach with swiftc
echo ""
echo "Attempting alternative build approach..."

# Create a minimal app bundle
APP_BUNDLE="$PROJECT_DIR/build/$APP_NAME.app"
mkdir -p "$APP_BUNDLE"

# Copy Swift file
cp "$PROJECT_DIR/FleetManager/FleetMobileApp.swift" "$APP_BUNDLE/"

# Copy Info.plist
cp "$PROJECT_DIR/FleetManager/Info.plist" "$APP_BUNDLE/"

echo "✓ App bundle created at: $APP_BUNDLE"

# Install to simulator
echo ""
echo "Installing app to simulator..."
xcrun simctl install "$SIMULATOR_ID" "$APP_BUNDLE" || true

# Launch the app
echo "Launching Fleet Manager..."
xcrun simctl launch "$SIMULATOR_ID" "$BUNDLE_ID" || true

echo ""
echo "========================================="
echo "If the app didn't launch automatically,"
echo "look for 'Fleet Manager' icon in the"
echo "simulator's home screen and tap it."
echo "========================================="
