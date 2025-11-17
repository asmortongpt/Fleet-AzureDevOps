# Files to Create for Enhanced Settings & Emergency Features

This is a quick reference of all new files that need to be created. The full implementation code is provided in the main implementation document.

## Required New Files

### Models Directory
1. **App/Models/UserPreferences.swift** (289 lines)
   - All preference structures
   - Theme, Language, UnitSystem enums
   - Security, Privacy, Advanced settings

2. **App/Models/Emergency.swift** (253 lines)
   - Emergency types and contacts
   - Crash detection data structures
   - Emergency events and responses

### Managers Directory (Create directory first)
```bash
mkdir -p App/Managers
```

3. **App/Managers/SettingsManager.swift** (205 lines)
   - Singleton settings manager
   - Persistence and sync
   - Export/import functionality

4. **App/Managers/CrashDetectionManager.swift** (219 lines)
   - CoreMotion crash detection
   - Countdown and auto-alert
   - User action handlers

### Services Directory
5. **App/Services/EmergencyService.swift** (305 lines)
   - Emergency contact management
   - Panic button and alerts
   - Location sharing

6. **App/Services/BiometricAuthService.swift** (241 lines)
   - Face ID / Touch ID
   - Biometric authentication
   - Fallback to passcode

### Settings Views Directory (Create directory first)
```bash
mkdir -p App/Views/Settings
```

7. **App/Views/Settings/EnhancedSettingsView.swift** (164 lines)
   - Main settings container
   - Tab-based interface

8. **App/Views/Settings/UserProfileView.swift** (327 lines)
   - Profile editing
   - Photo upload
   - Password change

9. **App/Views/Settings/AppPreferencesView.swift** (65 lines)
   - Theme, language, units
   - Map provider, date format

10. **App/Views/Settings/NotificationSettingsView.swift** (96 lines)
    - Notification toggles
    - Quiet hours

11. **App/Views/Settings/SecurityPrivacyView.swift** (134 lines)
    - Security settings
    - Privacy controls
    - Data export

12. **App/Views/Settings/AdvancedSettingsView.swift** (102 lines)
    - Developer mode
    - Debug features
    - System info

### Emergency Views Directory (Create directory first)
```bash
mkdir -p App/Views/Emergency
```

13. **App/Views/Emergency/EmergencyView.swift** (279 lines)
    - Panic button
    - Quick actions
    - Emergency contacts list

14. **App/Views/Emergency/CrashDetectedView.swift** (96 lines)
    - Full-screen crash alert
    - Countdown timer
    - Action buttons

## Files Already Modified

The following files were already modified in place:
- ✅ App/Models/UserRole.swift (added emergency permissions)
- ✅ App/SettingsView.swift (redirects to Enhanced)
- ✅ App/NavigationCoordinator.swift (added destinations)
- ✅ App/MainTabView.swift (added routing)
- ✅ App/MoreView.swift (added emergency menu)

## Creation Instructions

### Option 1: Manual Creation
Copy the code from ENHANCED_SETTINGS_EMERGENCY_IMPLEMENTATION.md for each file and create them manually in Xcode.

### Option 2: Script Creation
Use the implementation agent to create all files programmatically.

### Option 3: Template Files
The full source code for all 14 new files is available in the implementation document with proper:
- File headers
- Import statements
- Documentation comments
- Implementation code
- Preview providers

## Adding to Xcode Project

After creating the files, add them to the Xcode project:

1. Right-click on appropriate folders in Xcode
2. Choose "Add Files to App..."
3. Select the new files
4. Ensure "Copy items if needed" is checked
5. Ensure target membership includes "App"

## Verification

After adding all files, verify:
- [ ] All 14 new files compile without errors
- [ ] No import errors
- [ ] Navigation flows work
- [ ] Settings tabs display
- [ ] Emergency view accessible from More tab

## Dependencies

These files depend on existing code:
- AuthenticationManager
- KeychainManager
- ModernTheme.Haptics
- ModernTheme.Colors
- ModernTheme.Spacing
- AuthenticationService.User

All dependencies should already exist in the project.

---

Total new code: ~2,875 lines across 14 files
Total modified code: ~100 lines across 5 files
