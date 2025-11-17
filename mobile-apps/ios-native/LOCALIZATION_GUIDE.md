# Localization (i18n) Guide

## Overview

This guide provides comprehensive instructions for implementing, maintaining, and testing localization (internationalization/i18n) in the Fleet Manager iOS native application. The app currently supports English and Spanish, with the infrastructure to easily add more languages.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture](#architecture)
3. [Supported Languages](#supported-languages)
4. [Adding New Strings](#adding-new-strings)
5. [Adding New Languages](#adding-new-languages)
6. [Pluralization](#pluralization)
7. [Date and Time Formatting](#date-and-time-formatting)
8. [Number and Currency Formatting](#number-and-currency-formatting)
9. [RTL Language Support](#rtl-language-support)
10. [Testing Localized Versions](#testing-localized-versions)
11. [Translation Workflow](#translation-workflow)
12. [Best Practices](#best-practices)
13. [Common Issues](#common-issues)

---

## Quick Start

### Using Localized Strings

The simplest way to use localized strings:

```swift
// Direct localization
Text("auth.welcome_back".localized)

// With format arguments
Text("auth.sign_in_with_biometric".localized(arguments: "Face ID"))

// Using LocalizationManager
let manager = LocalizationManager.shared
Text(manager.string(forKey: "dashboard.title"))
```

### Checking Current Language

```swift
let localization = LocalizationManager.shared

// Get current language
let currentLang = localization.currentLanguage // .english or .spanish

// Check if RTL
if localization.isRTL {
    // Apply RTL-specific layout
}
```

### Changing Language

```swift
let localization = LocalizationManager.shared

// Change to Spanish
localization.setLanguage(.spanish)

// The app will automatically update all visible strings
```

---

## Architecture

### Component Overview

The localization system consists of three main components:

1. **LocalizationManager.swift**
   - Centralized manager for all localization features
   - Handles language switching
   - Provides formatting utilities
   - Manages date, time, number, and currency formatting

2. **Localizable.strings Files**
   - `en.lproj/Localizable.strings` - English translations
   - `es.lproj/Localizable.strings` - Spanish translations
   - Key-value pairs for all user-facing text

3. **String Extensions**
   - Convenience methods for easy localization
   - Integration with SwiftUI views

### File Structure

```
App/
├── Resources/
│   ├── en.lproj/
│   │   └── Localizable.strings
│   └── es.lproj/
│       └── Localizable.strings
└── Utilities/
    └── LocalizationManager.swift
```

---

## Supported Languages

Currently supported languages:

| Language | Code | Locale | Status |
|----------|------|--------|--------|
| English | `en` | `en_US` | ✅ Complete |
| Spanish | `es` | `es_US` | ✅ Complete |

### Language Detection

The app automatically detects the user's system language on first launch:

```swift
private func detectSystemLanguage() -> AppLanguage {
    let preferredLanguage = Locale.preferredLanguages.first ?? "en"

    if preferredLanguage.hasPrefix("es") {
        return .spanish
    } else {
        return .english
    }
}
```

---

## Adding New Strings

### 1. Define String Keys

Use descriptive, hierarchical keys:

```
// Good keys
"auth.welcome_back"
"vehicle.status.active"
"dashboard.loading"
"error.network"

// Bad keys
"string1"
"text"
"label"
```

### 2. Add to English Localizable.strings

```swift
// App/Resources/en.lproj/Localizable.strings

// MARK: - New Feature
"feature.title" = "New Feature";
"feature.description" = "This is a new feature";
"feature.button.action" = "Take Action";
```

### 3. Add to Spanish Localizable.strings

```swift
// App/Resources/es.lproj/Localizable.strings

// MARK: - New Feature
"feature.title" = "Nueva Característica";
"feature.description" = "Esta es una nueva característica";
"feature.button.action" = "Tomar Acción";
```

### 4. Use in Code

```swift
// In SwiftUI View
Text("feature.title".localized)

// With button
Button("feature.button.action".localized) {
    // Action
}
```

### String Key Naming Conventions

Use this format: `<category>.<subcategory>.<element>`

Examples:
- `auth.sign_in` - Authentication, Sign In
- `vehicle.detail.title` - Vehicle, Detail, Title
- `error.network` - Error, Network
- `settings.appearance` - Settings, Appearance

---

## Adding New Languages

### Step 1: Add Language to AppLanguage Enum

Edit `LocalizationManager.swift`:

```swift
enum AppLanguage: String, CaseIterable, Identifiable {
    case english = "en"
    case spanish = "es"
    case french = "fr"  // New language

    var localeIdentifier: String {
        switch self {
        case .english:
            return "en_US"
        case .spanish:
            return "es_US"
        case .french:
            return "fr_FR"  // New locale
        }
    }

    var displayName: String {
        switch self {
        case .english:
            return "English"
        case .spanish:
            return "Español"
        case .french:
            return "Français"  // New display name
        }
    }

    var nativeName: String {
        switch self {
        case .english:
            return "English"
        case .spanish:
            return "Español"
        case .french:
            return "Français"  // New native name
        }
    }

    var isRTL: Bool {
        switch self {
        case .french:
            return false  // French is LTR
        default:
            return false
        }
    }

    var defaultCurrencyCode: String {
        switch self {
        case .english, .spanish:
            return "USD"
        case .french:
            return "EUR"  // New currency
        }
    }
}
```

### Step 2: Create Language Directory

```bash
mkdir -p App/Resources/fr.lproj
```

### Step 3: Create Localizable.strings File

Copy the English file as a template:

```bash
cp App/Resources/en.lproj/Localizable.strings App/Resources/fr.lproj/Localizable.strings
```

### Step 4: Translate Strings

Edit `App/Resources/fr.lproj/Localizable.strings` and translate all strings:

```swift
// MARK: - General
"app.name" = "Gestionnaire de Flotte";
"app.tagline" = "Capital Tech Alliance";
"ok" = "OK";
"cancel" = "Annuler";
// ... etc
```

### Step 5: Update Language Detection

Update the `detectSystemLanguage()` method:

```swift
private func detectSystemLanguage() -> AppLanguage {
    let preferredLanguage = Locale.preferredLanguages.first ?? "en"

    if preferredLanguage.hasPrefix("es") {
        return .spanish
    } else if preferredLanguage.hasPrefix("fr") {
        return .french
    } else {
        return .english
    }
}
```

### Step 6: Add to Xcode Project

1. Open Xcode
2. Select `Localizable.strings` in Project Navigator
3. Open File Inspector (⌥⌘1)
4. Click "Localize..."
5. Select the new language
6. Repeat for each language directory

### Step 7: Test the New Language

```swift
// In app
LocalizationManager.shared.setLanguage(.french)
```

---

## Pluralization

### Plural Rules

Different languages have different plural rules. The app uses a simple zero/one/other system:

```swift
// English
"vehicles.count.zero" = "No vehicles";
"vehicles.count.one" = "1 vehicle";
"vehicles.count.other" = "%d vehicles";

// Spanish
"vehicles.count.zero" = "Sin vehículos";
"vehicles.count.one" = "1 vehículo";
"vehicles.count.other" = "%d vehículos";
```

### Using Plural Strings

```swift
let count = 5
let text = LocalizationManager.shared.pluralString(
    forKey: "vehicles.count",
    count: count
)
// Returns: "5 vehicles" or "5 vehículos"
```

### Common Pluralization Examples

```swift
// Trips
"trips.count.zero" = "No trips";
"trips.count.one" = "1 trip";
"trips.count.other" = "%d trips";

// Alerts
"alerts.count.zero" = "No alerts";
"alerts.count.one" = "1 alert";
"alerts.count.other" = "%d alerts";

// Days
"days.count.zero" = "0 days";
"days.count.one" = "1 day";
"days.count.other" = "%d days";
```

---

## Date and Time Formatting

### Formatting Dates

The LocalizationManager provides locale-aware date formatting:

```swift
let manager = LocalizationManager.shared
let date = Date()

// Format date
let dateString = manager.formatDate(date)
// English: "Nov 11, 2025"
// Spanish: "11 nov 2025"

// Format time
let timeString = manager.formatTime(date)
// English: "3:30 PM"
// Spanish: "15:30"

// Format date and time
let dateTimeString = manager.formatDateTime(date)
// English: "Nov 11, 2025 at 3:30 PM"
// Spanish: "11 nov 2025, 15:30"
```

### Relative Date Formatting

```swift
let manager = LocalizationManager.shared
let yesterday = Date().addingTimeInterval(-86400)

let relativeString = manager.formatRelativeDate(yesterday)
// English: "Yesterday"
// Spanish: "Ayer"

let twoHoursAgo = Date().addingTimeInterval(-7200)
let relativeString2 = manager.formatRelativeDate(twoHoursAgo)
// English: "2 hours ago"
// Spanish: "Hace 2 horas"
```

### Date Extension Methods

```swift
let date = Date()

// Localized date
let dateStr = date.localizedDate()

// Localized time
let timeStr = date.localizedTime()

// Localized date and time
let dateTimeStr = date.localizedDateTime()

// Relative date
let relativeStr = date.localizedRelativeDate()
```

### Custom Date Formats

```swift
let formatter = DateFormatter()
formatter.locale = LocalizationManager.shared.currentLocale
formatter.dateFormat = "EEEE, MMMM d, yyyy"

let customDate = formatter.string(from: Date())
// English: "Monday, November 11, 2025"
// Spanish: "lunes, 11 de noviembre de 2025"
```

---

## Number and Currency Formatting

### Number Formatting

```swift
let manager = LocalizationManager.shared

// Format number
let number = 1234.56
let formatted = manager.formatNumber(number)
// English: "1,234.56"
// Spanish: "1.234,56"

// Format integer
let count = 1000
let formattedInt = manager.formatInteger(count)
// English: "1,000"
// Spanish: "1.000"

// Specific decimal places
let precise = manager.formatNumber(3.14159, decimals: 2)
// English: "3.14"
// Spanish: "3,14"
```

### Currency Formatting

```swift
let manager = LocalizationManager.shared

// Format as currency (default)
let amount = 1234.50
let currency = manager.formatCurrency(amount)
// English: "$1,234.50"
// Spanish: "US$ 1.234,50"

// Specific currency code
let euros = manager.formatCurrency(amount, currencyCode: "EUR")
// English: "€1,234.50"
// Spanish: "1.234,50 €"
```

### Percentage Formatting

```swift
let manager = LocalizationManager.shared

// Format as percentage
let percent = 0.85
let formatted = manager.formatPercent(percent)
// English: "85%"
// Spanish: "85 %"
```

### Extension Methods

```swift
// Numbers
let num = 1234.56
let str = num.localizedNumber()

// Currency
let amount = 99.99
let currencyStr = amount.localizedCurrency()
let euroStr = amount.localizedCurrency(currencyCode: "EUR")

// Percentage
let percent = 0.75
let percentStr = percent.localizedPercent()
```

### Distance and Measurement

```swift
let manager = LocalizationManager.shared

// Miles
let miles = 45000.0
let milesStr = manager.formatMiles(miles)
// "45,000 mi" or "45.000 mi"

// Hours
let hours = 125.5
let hoursStr = manager.formatHours(hours)
// "125.5 hrs"

// Using extensions
let distance = 100.0
let distStr = distance.localizedMiles()

let time = 50.0
let timeStr = time.localizedHours()
```

---

## RTL Language Support

### Current Status

English and Spanish are both LTR (left-to-right) languages. The infrastructure is in place to support RTL (right-to-left) languages like Arabic and Hebrew.

### Adding RTL Language

When adding an RTL language, update the `isRTL` property:

```swift
enum AppLanguage {
    case arabic = "ar"

    var isRTL: Bool {
        switch self {
        case .arabic, .hebrew:
            return true
        default:
            return false
        }
    }
}
```

### RTL-Aware Layouts

#### Using Layout Direction

```swift
let manager = LocalizationManager.shared

VStack(alignment: manager.horizontalAlignment) {
    // Content aligns to leading in LTR, trailing in RTL
}

Text("Hello")
    .multilineTextAlignment(manager.textAlignment)
```

#### Custom RTL Padding

```swift
Text("Content")
    .paddingRTL(leading: 16, trailing: 8)
    // LTR: 16pt leading, 8pt trailing
    // RTL: 8pt leading, 16pt trailing
```

#### Environment-Based RTL

```swift
struct MyView: View {
    @Environment(\.layoutDirection) var layoutDirection

    var body: some View {
        HStack {
            if layoutDirection == .rightToLeft {
                // RTL layout
                icon
                text
            } else {
                // LTR layout
                text
                icon
            }
        }
    }
}
```

#### Natural Alignment

SwiftUI's `leading` and `trailing` automatically flip for RTL:

```swift
// Automatically RTL-aware
HStack {
    Image(systemName: "star")
        .frame(maxWidth: .infinity, alignment: .leading)

    Text("Rating")

    Text("4.5")
        .frame(maxWidth: .infinity, alignment: .trailing)
}
```

### RTL Testing

Test RTL layouts without adding a full language:

1. In Xcode: Product → Scheme → Edit Scheme
2. Select Run → Options
3. Set "App Language" to "Right-to-Left Pseudolanguage"
4. Run the app

Or in code:

```swift
// Force RTL in preview
struct MyView_Previews: PreviewProvider {
    static var previews: some View {
        MyView()
            .environment(\.layoutDirection, .rightToLeft)
    }
}
```

---

## Testing Localized Versions

### Manual Testing in Simulator

#### Method 1: Change Simulator Language

1. Open Settings app in Simulator
2. Go to General → Language & Region
3. Add Language → Select language
4. Make it primary language
5. Restart app

#### Method 2: Edit Scheme

1. Product → Scheme → Edit Scheme (⌘<)
2. Select Run → Options
3. Set "Application Language" to desired language
4. Run app

#### Method 3: In-App Language Switcher

If you have a settings screen:

```swift
struct LanguageSettingsView: View {
    @StateObject private var localization = LocalizationManager.shared

    var body: some View {
        List {
            ForEach(localization.availableLanguages) { language in
                Button(action: {
                    localization.setLanguage(language)
                }) {
                    HStack {
                        Text(language.nativeName)
                        Spacer()
                        if localization.currentLanguage == language {
                            Image(systemName: "checkmark")
                                .foregroundColor(.blue)
                        }
                    }
                }
            }
        }
        .navigationTitle("settings.language".localized)
    }
}
```

### Automated Testing

#### Unit Tests for Localization

```swift
import XCTest

class LocalizationTests: XCTestCase {

    func testEnglishStrings() {
        let manager = LocalizationManager.shared
        manager.setLanguage(.english)

        XCTAssertEqual(
            manager.string(forKey: "app.name"),
            "Fleet Manager"
        )

        XCTAssertEqual(
            manager.string(forKey: "auth.sign_in"),
            "Sign In"
        )
    }

    func testSpanishStrings() {
        let manager = LocalizationManager.shared
        manager.setLanguage(.spanish)

        XCTAssertEqual(
            manager.string(forKey: "app.name"),
            "Gestor de Flota"
        )

        XCTAssertEqual(
            manager.string(forKey: "auth.sign_in"),
            "Iniciar Sesión"
        )
    }

    func testPluralization() {
        let manager = LocalizationManager.shared
        manager.setLanguage(.english)

        XCTAssertEqual(
            manager.pluralString(forKey: "vehicles.count", count: 0),
            "No vehicles"
        )

        XCTAssertEqual(
            manager.pluralString(forKey: "vehicles.count", count: 1),
            "1 vehicle"
        )

        XCTAssertEqual(
            manager.pluralString(forKey: "vehicles.count", count: 5),
            "5 vehicles"
        )
    }

    func testDateFormatting() {
        let manager = LocalizationManager.shared
        manager.setLanguage(.english)

        let date = Date(timeIntervalSince1970: 1699747200) // Nov 12, 2023
        let formatted = manager.formatDate(date)

        XCTAssertTrue(formatted.contains("Nov"))
        XCTAssertTrue(formatted.contains("2023"))
    }
}
```

#### UI Tests for Localization

```swift
func testSpanishLocalization() {
    let app = XCUIApplication()
    app.launchArguments = ["-AppleLanguages", "(es)"]
    app.launch()

    // Verify Spanish text appears
    XCTAssertTrue(app.staticTexts["Gestor de Flota"].exists)
    XCTAssertTrue(app.buttons["Iniciar Sesión"].exists)
}
```

### Screenshots for App Store

Generate screenshots for all supported languages:

```swift
func testGenerateScreenshots() {
    let app = XCUIApplication()

    for language in ["en", "es"] {
        app.launchArguments = ["-AppleLanguages", "(\(language))"]
        app.launch()

        // Take screenshots
        snapshot("01_Login_\(language)")

        // Navigate and take more screenshots
        app.buttons["auth.sign_in".localized].tap()
        snapshot("02_Dashboard_\(language)")

        app.terminate()
    }
}
```

---

## Translation Workflow

### 1. Extract Strings for Translation

Create a script to extract all localization keys:

```bash
#!/bin/bash

# Extract strings from Localizable.strings
grep -o '"[^"]*"' App/Resources/en.lproj/Localizable.strings | \
    sort | uniq > strings_to_translate.txt
```

### 2. Prepare Translation File

Export English strings to a spreadsheet:

| Key | English | Spanish | Notes |
|-----|---------|---------|-------|
| auth.welcome_back | Welcome Back | Bienvenido de Nuevo | Login screen |
| auth.sign_in | Sign In | Iniciar Sesión | Button label |

### 3. Send for Translation

- Share spreadsheet with translators
- Provide context for each string
- Include screenshots when helpful
- Specify character limits if applicable

### 4. Review Translations

Checklist:
- [ ] All strings translated
- [ ] No English text in other languages
- [ ] Formatting placeholders preserved (`%@`, `%d`)
- [ ] Tone is appropriate
- [ ] Technical terms are correct
- [ ] No truncation in UI

### 5. Import Translations

Update the appropriate `Localizable.strings` file with translated text.

### 6. Test in App

- Load translated strings
- Check for layout issues
- Verify text fits in UI
- Test all screens
- Check pluralization
- Verify date/number formatting

### 7. Quality Assurance

- Native speaker review
- Context verification
- Consistency check
- Spelling and grammar
- Cultural appropriateness

---

## Best Practices

### String Keys

✅ **DO**:
- Use descriptive, hierarchical keys
- Use dots for namespacing
- Keep keys in English
- Use lowercase with underscores

❌ **DON'T**:
- Use vague keys like "text1", "label"
- Mix languages in keys
- Use camelCase or spaces

### String Values

✅ **DO**:
- Write complete sentences
- Use proper punctuation
- Include context in comments
- Keep strings short when possible

❌ **DON'T**:
- Concatenate strings
- Hard-code text in UI
- Use abbreviations without context
- Assume word order

### Formatting

✅ **DO**:
```swift
// Use format specifiers
"vehicle.count" = "%d vehicles found";

// In code
let count = 5
Text(String(format: "vehicle.count".localized, count))
```

❌ **DON'T**:
```swift
// Don't concatenate
Text("vehicles.found".localized + " \(count)")
```

### Context

✅ **DO**:
```swift
// Provide context with comments
/* Login screen - Main sign in button */
"auth.sign_in" = "Sign In";

/* Dashboard - Metric card for total vehicles */
"metrics.total_vehicles" = "Total Vehicles";
```

❌ **DON'T**:
```swift
// No context
"button" = "Click here";
```

### Layout

✅ **DO**:
- Design for text expansion (30-40% for some languages)
- Use flexible layouts
- Test with longest language
- Allow text wrapping

❌ **DON'T**:
- Use fixed widths for text
- Assume text length
- Truncate important information
- Force single-line text

### Images with Text

✅ **DO**:
- Separate text from images
- Use system symbols when possible
- Localize images with text if necessary

❌ **DON'T**:
- Embed text in images
- Use language-specific icons
- Assume cultural symbols are universal

---

## Common Issues

### Issue: Missing Translation

**Symptom**: English text appears in Spanish version.

**Solution**:
- Check that key exists in `es.lproj/Localizable.strings`
- Verify the key spelling matches exactly
- Rebuild the app

### Issue: Wrong Language Loads

**Symptom**: App shows wrong language on launch.

**Solution**:
```swift
// Check system language
print(Locale.preferredLanguages)

// Force language (for testing)
LocalizationManager.shared.setLanguage(.spanish)
```

### Issue: Text Truncated

**Symptom**: Text is cut off in translated version.

**Solution**:
```swift
// Allow text to expand
Text("long.text".localized)
    .lineLimit(nil)
    .fixedSize(horizontal: false, vertical: true)

// Or increase container size
.frame(minHeight: 60)
```

### Issue: Format Specifiers Don't Work

**Symptom**: `%d` or `%@` appears literally in text.

**Solution**:
```swift
// Wrong
Text("vehicle.count".localized)

// Correct
Text(String(format: "vehicle.count".localized, 5))

// Or use helper
Text("vehicle.count".localized(arguments: 5))
```

### Issue: Dates Show Wrong Format

**Symptom**: Dates appear in wrong format for language.

**Solution**:
```swift
// Don't use hardcoded format
let formatter = DateFormatter()
formatter.dateFormat = "MM/dd/yyyy" // ❌

// Use LocalizationManager
let dateStr = LocalizationManager.shared.formatDate(date) // ✅

// Or use locale-aware formatter
formatter.locale = LocalizationManager.shared.currentLocale
formatter.dateStyle = .medium
```

### Issue: Numbers Show Wrong Separators

**Symptom**: Numbers use wrong decimal/thousand separators.

**Solution**:
```swift
// Don't format manually
let numStr = "\(1234.56)" // ❌

// Use LocalizationManager
let numStr = LocalizationManager.shared.formatNumber(1234.56) // ✅
```

### Issue: Plurals Don't Work Correctly

**Symptom**: Shows "1 vehicles" or "5 vehicle".

**Solution**:
```swift
// Use pluralString helper
let text = LocalizationManager.shared.pluralString(
    forKey: "vehicles.count",
    count: vehicleCount
)
```

---

## Resources

### Apple Documentation

- [Localization Guide](https://developer.apple.com/localization/)
- [Internationalization and Localization](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPInternational/)
- [NSLocalizedString](https://developer.apple.com/documentation/foundation/nslocalizedstring)

### Tools

- **Xcode**: Built-in localization tools
- **Localise.biz**: Translation management platform
- **POEditor**: Collaborative translation
- **Phrase**: Localization management
- **Google Translate**: Machine translation (needs review)

### Testing

- **Pseudolocalization**: Test string length and encoding
- **Right-to-Left Preview**: Test RTL layouts
- **Language Switching**: Test in-app language changes

---

## Checklist for New Features

When adding a new feature, ensure:

- [ ] All user-facing text uses localization keys
- [ ] Keys are added to all `Localizable.strings` files
- [ ] Keys follow naming conventions
- [ ] Context comments are added
- [ ] Format specifiers are used correctly
- [ ] Pluralization is handled properly
- [ ] Dates use locale-aware formatting
- [ ] Numbers use locale-aware formatting
- [ ] Layout adapts to text length
- [ ] RTL layout is considered
- [ ] Translations are reviewed by native speakers
- [ ] UI is tested with all supported languages
- [ ] Screenshots are updated for all languages

---

## Support

For localization questions or issues:

**Email**: i18n@capitaltechalliance.com
**Documentation**: https://docs.capitaltechalliance.com/localization
**Translation Portal**: https://translate.capitaltechalliance.com

---

*Last Updated: 2025-11-11*
*Version: 1.0.0*
