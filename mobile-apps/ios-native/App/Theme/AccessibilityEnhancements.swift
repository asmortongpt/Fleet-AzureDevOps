import SwiftUI

// MARK: - Accessibility Enhancements
// Complete accessibility support with VoiceOver, Dynamic Type, Reduce Motion,
// High Contrast, and Accessibility Inspector compatibility

// MARK: - Accessibility Environment
struct AccessibilityEnvironment {
    // Accessibility Features
    @Environment(\.accessibilityReduceMotion) var reduceMotion: Bool
    @Environment(\.accessibilityReduceTransparency) var reduceTransparency: Bool
    @Environment(\.accessibilityDifferentiateWithoutColor) var differentiateWithoutColor: Bool
    @Environment(\.accessibilityInvertColors) var invertColors: Bool
    @Environment(\.accessibilityShowButtonShapes) var showButtonShapes: Bool
    @Environment(\.accessibilityEnabled) var accessibilityEnabled: Bool

    // Dynamic Type
    @Environment(\.dynamicTypeSize) var dynamicTypeSize: DynamicTypeSize
    @Environment(\.sizeCategory) var sizeCategory: ContentSizeCategory

    // Color Scheme
    @Environment(\.colorScheme) var colorScheme: ColorScheme
    @Environment(\.colorSchemeContrast) var colorSchemeContrast: ColorSchemeContrast

    // Check if large text is enabled
    var isLargeTextEnabled: Bool {
        dynamicTypeSize >= .accessibility1
    }

    // Check if high contrast is needed
    var needsHighContrast: Bool {
        colorSchemeContrast == .increased
    }

    // Get appropriate animation
    var animation: Animation {
        reduceMotion ? .easeInOut(duration: 0.01) : FleetAnimations.Spring.smooth
    }
}

// MARK: - Accessibility Labels Generator
struct AccessibilityLabels {
    // Vehicle status labels
    static func vehicleStatus(_ status: VehicleStatus) -> String {
        switch status {
        case .active:
            return "Active - Vehicle is currently in use"
        case .idle:
            return "Idle - Vehicle is parked and available"
        case .charging:
            return "Charging - Electric vehicle is charging"
        case .service:
            return "In Service - Vehicle is being maintained"
        case .emergency:
            return "Emergency - Vehicle requires immediate attention"
        case .offline:
            return "Offline - Vehicle is not connected"
        }
    }

    // Fuel level labels
    static func fuelLevel(_ level: Double) -> String {
        let percentage = Int(level * 100)
        if percentage < 25 {
            return "Fuel level \(percentage)% - Low fuel warning"
        } else if percentage < 50 {
            return "Fuel level \(percentage)% - Below half tank"
        } else {
            return "Fuel level \(percentage)%"
        }
    }

    // Trip duration labels
    static func tripDuration(_ seconds: TimeInterval) -> String {
        let hours = Int(seconds) / 3600
        let minutes = (Int(seconds) % 3600) / 60

        if hours > 0 {
            return "Trip duration: \(hours) hours and \(minutes) minutes"
        } else {
            return "Trip duration: \(minutes) minutes"
        }
    }

    // Distance labels
    static func distance(_ miles: Double) -> String {
        if miles < 1 {
            let feet = Int(miles * 5280)
            return "Distance: \(feet) feet"
        } else {
            return String(format: "Distance: %.1f miles", miles)
        }
    }

    // Speed labels
    static func speed(_ mph: Double) -> String {
        String(format: "Speed: %.0f miles per hour", mph)
    }
}

// MARK: - Accessibility Hints Generator
struct AccessibilityHints {
    static let vehicleCard = "Double tap to view vehicle details"
    static let tripCard = "Double tap to view trip details"
    static let maintenanceCard = "Double tap to view maintenance details"
    static let refreshButton = "Double tap to refresh data"
    static let filterButton = "Double tap to open filter options"
    static let sortButton = "Double tap to change sort order"
    static let searchField = "Enter text to search"
    static let mapView = "Use two fingers to pan, pinch to zoom"
    static let closeButton = "Double tap to close"
    static let deleteButton = "Double tap to delete, requires confirmation"
}

// MARK: - View Modifiers for Accessibility
struct AccessibleCardModifier: ViewModifier {
    let label: String
    let hint: String?
    let value: String?
    let traits: AccessibilityTraits

    @Environment(\.accessibilityReduceMotion) var reduceMotion: Bool
    @Environment(\.accessibilityDifferentiateWithoutColor) var differentiateWithoutColor: Bool

    func body(content: Content) -> some View {
        content
            .accessibilityElement(children: .combine)
            .accessibilityLabel(label)
            .if(hint != nil) { view in
                view.accessibilityHint(hint!)
            }
            .if(value != nil) { view in
                view.accessibilityValue(value!)
            }
            .accessibilityAddTraits(traits)
            .if(differentiateWithoutColor) { view in
                view.overlay(
                    RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                        .stroke(ModernTheme.Colors.primary, lineWidth: 2)
                        .opacity(0.3)
                )
            }
    }
}

struct AccessibleButtonModifier: ViewModifier {
    let label: String
    let hint: String?
    let role: String?

    @Environment(\.accessibilityShowButtonShapes) var showButtonShapes: Bool

    func body(content: Content) -> some View {
        content
            .accessibilityLabel(label)
            .if(hint != nil) { view in
                view.accessibilityHint(hint!)
            }
            .accessibilityAddTraits(.isButton)
            .if(showButtonShapes) { view in
                view.overlay(
                    RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                        .stroke(Color.primary, lineWidth: 1)
                )
            }
    }
}

struct DynamicTypeModifier: ViewModifier {
    let baseSize: CGFloat
    let maxSize: CGFloat?

    @Environment(\.dynamicTypeSize) var dynamicTypeSize: DynamicTypeSize

    func body(content: Content) -> some View {
        let scaleFactor = dynamicTypeSize.scaleFactor
        let scaledSize = baseSize * scaleFactor

        content
            .font(.system(size: min(scaledSize, maxSize ?? .infinity)))
    }
}

// MARK: - Conditional View Modifier
extension View {
    @ViewBuilder
    func `if`<Content: View>(_ condition: Bool, transform: (Self) -> Content) -> some View {
        if condition {
            transform(self)
        } else {
            self
        }
    }
}

// MARK: - Accessibility Extensions
extension View {
    // Make a card accessible
    func accessibleCard(
        label: String,
        hint: String? = nil,
        value: String? = nil,
        traits: AccessibilityTraits = []
    ) -> some View {
        modifier(AccessibleCardModifier(label: label, hint: hint, value: value, traits: traits))
    }

    // Make a button accessible
    func accessibleButton(
        label: String,
        hint: String? = nil,
        role: String? = nil
    ) -> some View {
        modifier(AccessibleButtonModifier(label: label, hint: hint, role: role))
    }

    // Support dynamic type
    func dynamicTypeSize(baseSize: CGFloat, maxSize: CGFloat? = nil) -> some View {
        modifier(DynamicTypeModifier(baseSize: baseSize, maxSize: maxSize))
    }

    // Reduce motion safe animation
    func reduceMotionSafe<V: Equatable>(
        _ animation: Animation,
        value: V
    ) -> some View {
        modifier(ReduceMotionModifier(animation: animation, value: value))
    }

    // High contrast borders
    func highContrastBorder(color: Color = .primary) -> some View {
        modifier(HighContrastBorderModifier(color: color))
    }
}

// MARK: - Reduce Motion Modifier
struct ReduceMotionModifier<V: Equatable>: ViewModifier {
    @Environment(\.accessibilityReduceMotion) var reduceMotion: Bool
    let animation: Animation
    let value: V

    func body(content: Content) -> some View {
        content
            .animation(
                reduceMotion ? .easeInOut(duration: 0.01) : animation,
                value: value
            )
    }
}

// MARK: - High Contrast Border Modifier
struct HighContrastBorderModifier: ViewModifier {
    @Environment(\.colorSchemeContrast) var colorSchemeContrast: ColorSchemeContrast
    let color: Color

    func body(content: Content) -> some View {
        content
            .if(colorSchemeContrast == .increased) { view in
                view.overlay(
                    RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                        .stroke(color, lineWidth: 2)
                )
            }
    }
}

// MARK: - Dynamic Type Scale Factor
extension DynamicTypeSize {
    var scaleFactor: CGFloat {
        switch self {
        case .xSmall:
            return 0.8
        case .small:
            return 0.9
        case .medium:
            return 1.0
        case .large:
            return 1.1
        case .xLarge:
            return 1.2
        case .xxLarge:
            return 1.3
        case .xxxLarge:
            return 1.4
        case .accessibility1:
            return 1.6
        case .accessibility2:
            return 1.8
        case .accessibility3:
            return 2.0
        case .accessibility4:
            return 2.2
        case .accessibility5:
            return 2.4
        @unknown default:
            return 1.0
        }
    }
}

// MARK: - Accessible Components

// Accessible Status Badge
struct AccessibleStatusBadge: View {
    let status: VehicleStatus
    @Environment(\.accessibilityReduceMotion) var reduceMotion: Bool

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(status.themeColor)
                .frame(width: 8, height: 8)

            Text(status.displayName)
                .font(.caption)
                .fontWeight(.medium)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            Capsule()
                .fill(status.themeColor.opacity(0.15))
        )
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(AccessibilityLabels.vehicleStatus(status))
    }
}

// Accessible Icon Button
struct AccessibleIconButton: View {
    let icon: String
    let label: String
    let hint: String?
    let action: () -> Void

    @Environment(\.accessibilityShowButtonShapes) var showButtonShapes: Bool

    var body: some View {
        Button(action: {
            ModernTheme.Haptics.light()
            action()
        }) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(ModernTheme.Colors.primary)
                .frame(width: 44, height: 44)
                .if(showButtonShapes) { view in
                    view.background(
                        Circle()
                            .stroke(ModernTheme.Colors.primary, lineWidth: 1)
                    )
                }
        }
        .accessibleButton(label: label, hint: hint)
    }
}

// Accessible Progress Indicator
struct AccessibleProgressView: View {
    let value: Double
    let total: Double
    let label: String

    var percentage: Int {
        Int((value / total) * 100)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 8)
                        .cornerRadius(4)

                    Rectangle()
                        .fill(ModernTheme.Colors.primary)
                        .frame(width: geometry.size.width * (value / total), height: 8)
                        .cornerRadius(4)
                }
            }
            .frame(height: 8)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label): \(percentage)% complete")
        .accessibilityValue("\(Int(value)) of \(Int(total))")
    }
}

// Accessible Toggle
struct AccessibleToggle: View {
    let label: String
    let icon: String?
    @Binding var isOn: Bool

    var body: some View {
        HStack {
            if let icon = icon {
                Image(systemName: icon)
                    .foregroundColor(ModernTheme.Colors.primary)
                    .accessibilityHidden(true)
            }

            Text(label)
                .font(.body)

            Spacer()

            Toggle("", isOn: $isOn)
                .labelsHidden()
        }
        .padding()
        .accessibilityElement(children: .combine)
        .accessibilityLabel(label)
        .accessibilityValue(isOn ? "On" : "Off")
        .accessibilityHint("Double tap to toggle")
        .accessibilityAddTraits(.isButton)
    }
}

// Accessible Section Header
struct AccessibleSectionHeader: View {
    let title: String
    let icon: String?

    var body: some View {
        HStack {
            if let icon = icon {
                Image(systemName: icon)
                    .foregroundColor(ModernTheme.Colors.primary)
                    .accessibilityHidden(true)
            }

            Text(title)
                .font(.headline)
                .foregroundColor(.primary)
        }
        .accessibilityAddTraits(.isHeader)
    }
}

// MARK: - Accessibility Testing Helper
struct AccessibilityPreview<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                Group {
                    Text("Default")
                        .font(.headline)
                    content
                }

                Divider()

                Group {
                    Text("Large Text")
                        .font(.headline)
                    content
                        .environment(\.dynamicTypeSize, .accessibility3)
                }

                Divider()

                Group {
                    Text("High Contrast")
                        .font(.headline)
                    content
                        .accessibilityElement(children: .contain)
                }

                Divider()

                Group {
                    Text("Dark Mode")
                        .font(.headline)
                    content
                        .preferredColorScheme(.dark)
                }
            }
            .padding()
        }
    }
}

// MARK: - VoiceOver Order Helper
extension View {
    func accessibilityOrder(_ order: Int) -> some View {
        self.accessibilitySortPriority(Double(order))
    }
}

// MARK: - Accessibility Announcements
struct AccessibilityAnnouncer {
    static func announce(_ message: String, delay: Double = 0.5) {
        DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
            UIAccessibility.post(notification: .announcement, argument: message)
        }
    }

    static func screenChanged(to element: Any? = nil) {
        UIAccessibility.post(notification: .screenChanged, argument: element)
    }

    static func layoutChanged(to element: Any? = nil) {
        UIAccessibility.post(notification: .layoutChanged, argument: element)
    }
}

// MARK: - Smart Invert Colors Support
extension View {
    func smartInvertSupport() -> some View {
        self.accessibilityIgnoresInvertColors()
    }
}
