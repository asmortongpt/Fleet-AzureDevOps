import SwiftUI

// MARK: - Modern Theme for iOS 17+
// Comprehensive design system with SF Symbols 5.0, dynamic colors, materials, and animations

struct ModernTheme {

    // MARK: - Colors
    struct Colors {
        // Primary Brand Colors
        static let primary = Color("PrimaryColor", bundle: nil) ?? Color.blue
        static let primaryVariant = Color("PrimaryVariantColor", bundle: nil) ?? Color.indigo
        static let secondary = Color("SecondaryColor", bundle: nil) ?? Color.orange
        static let accent = Color("AccentColor", bundle: nil) ?? Color.teal

        // Semantic Colors with Dynamic Support
        static let success = Color.green
        static let warning = Color.orange
        static let error = Color.red
        static let info = Color.blue

        // Status Colors for Vehicles
        static let active = Color.green
        static let idle = Color.gray
        static let charging = Color.blue
        static let service = Color.orange
        static let emergency = Color.red
        static let offline = Color(uiColor: .darkGray)

        // Background Colors
        static let background = Color(uiColor: .systemBackground)
        static let secondaryBackground = Color(uiColor: .secondarySystemBackground)
        static let tertiaryBackground = Color(uiColor: .tertiarySystemBackground)
        static let groupedBackground = Color(uiColor: .systemGroupedBackground)

        // Text Colors
        static let primaryText = Color(uiColor: .label)
        static let secondaryText = Color(uiColor: .secondaryLabel)
        static let tertiaryText = Color(uiColor: .tertiaryLabel)
        static let quaternaryText = Color(uiColor: .quaternaryLabel)

        // Separator Colors
        static let separator = Color(uiColor: .separator)
        static let opaqueSeparator = Color(uiColor: .opaqueSeparator)

        // Chart Colors (iOS 17+)
        static let chartColors: [Color] = [
            .blue, .green, .orange, .purple, .pink, .teal, .indigo, .cyan
        ]

        // Gradient Colors
        static let primaryGradient = LinearGradient(
            colors: [primary, primaryVariant],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let successGradient = LinearGradient(
            colors: [Color.green.opacity(0.8), Color.teal],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let warningGradient = LinearGradient(
            colors: [Color.orange.opacity(0.8), Color.yellow],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    // MARK: - Typography
    struct Typography {
        // Headings
        static let largeTitle = Font.largeTitle.weight(.bold)
        static let title1 = Font.title.weight(.bold)
        static let title2 = Font.title2.weight(.semibold)
        static let title3 = Font.title3.weight(.semibold)

        // Body
        static let body = Font.body
        static let bodyBold = Font.body.weight(.semibold)
        static let callout = Font.callout

        // Supporting
        static let headline = Font.headline
        static let subheadline = Font.subheadline
        static let footnote = Font.footnote
        static let caption1 = Font.caption
        static let caption2 = Font.caption2

        // Custom Sizes
        static func rounded(size: CGFloat, weight: Font.Weight = .regular) -> Font {
            .system(size: size, weight: weight, design: .rounded)
        }

        static func monospaced(size: CGFloat, weight: Font.Weight = .regular) -> Font {
            .system(size: size, weight: weight, design: .monospaced)
        }
    }

    // MARK: - Spacing
    struct Spacing {
        static let xxs: CGFloat = 2
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 20
        static let xxl: CGFloat = 24
        static let xxxl: CGFloat = 32

        // Grid spacing
        static let gridSpacing: CGFloat = 16
        static let cardPadding: CGFloat = 16
        static let sectionSpacing: CGFloat = 24
    }

    // MARK: - Corner Radius
    struct CornerRadius {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 12
        static let lg: CGFloat = 16
        static let xl: CGFloat = 20
        static let xxl: CGFloat = 24
        static let circle: CGFloat = .infinity
    }

    // MARK: - Shadows
    struct Shadow {
        static let small = ShadowStyle(
            color: Color.black.opacity(0.1),
            radius: 4,
            x: 0,
            y: 2
        )

        static let medium = ShadowStyle(
            color: Color.black.opacity(0.15),
            radius: 8,
            x: 0,
            y: 4
        )

        static let large = ShadowStyle(
            color: Color.black.opacity(0.2),
            radius: 16,
            x: 0,
            y: 8
        )

        static let elevated = ShadowStyle(
            color: Color.black.opacity(0.25),
            radius: 24,
            x: 0,
            y: 12
        )
    }

    struct ShadowStyle {
        let color: Color
        let radius: CGFloat
        let x: CGFloat
        let y: CGFloat
    }

    // MARK: - SF Symbols Configuration
    struct Symbols {
        // Variable Colors (iOS 17+)
        static func configured(_ name: String, renderingMode: SymbolRenderingMode = .hierarchical) -> Image {
            Image(systemName: name)
                .symbolRenderingMode(renderingMode)
        }

        static func variable(_ name: String, value: Double = 1.0) -> some View {
            Image(systemName: name)
                .symbolRenderingMode(.hierarchical)
        }

        // Common Fleet Icons
        static let dashboard = "chart.bar.fill"
        static let vehicle = "car.2.fill"
        static let trip = "location.fill"
        static let maintenance = "wrench.and.screwdriver.fill"
        static let settings = "gearshape.fill"
        static let profile = "person.circle.fill"
        static let notification = "bell.badge.fill"
        static let search = "magnifyingglass"
        static let filter = "line.3.horizontal.decrease.circle"
        static let sort = "arrow.up.arrow.down.circle"
        static let add = "plus.circle.fill"
        static let edit = "pencil.circle.fill"
        static let delete = "trash.fill"
        static let refresh = "arrow.clockwise"
        static let map = "map.fill"
        static let chart = "chart.line.uptrend.xyaxis"

        // Vehicle Status Icons
        static let active = "bolt.fill"
        static let idle = "powersleep"
        static let charging = "battery.100.bolt"
        static let service = "wrench.fill"
        static let emergency = "exclamationmark.triangle.fill"
        static let offline = "wifi.slash"
    }

    // MARK: - Animation Presets
    struct Animation {
        static let quick = SwiftUI.Animation.spring(response: 0.3, dampingFraction: 0.7)
        static let smooth = SwiftUI.Animation.spring(response: 0.4, dampingFraction: 0.8)
        static let bouncy = SwiftUI.Animation.spring(response: 0.5, dampingFraction: 0.6)
        static let gentle = SwiftUI.Animation.spring(response: 0.6, dampingFraction: 0.9)

        // Interactive animations
        static let interactive = SwiftUI.Animation.interactiveSpring(response: 0.3, dampingFraction: 0.7)

        // Timing curves
        static let easeInOut = SwiftUI.Animation.easeInOut(duration: 0.3)
        static let easeIn = SwiftUI.Animation.easeIn(duration: 0.25)
        static let easeOut = SwiftUI.Animation.easeOut(duration: 0.25)
    }

    // MARK: - Haptic Feedback
    struct Haptics {
        static func light() {
            let generator = UIImpactFeedbackGenerator(style: .light)
            generator.impactOccurred()
        }

        static func medium() {
            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()
        }

        static func heavy() {
            let generator = UIImpactFeedbackGenerator(style: .heavy)
            generator.impactOccurred()
        }

        static func success() {
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)
        }

        static func warning() {
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.warning)
        }

        static func error() {
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.error)
        }

        static func selection() {
            let generator = UISelectionFeedbackGenerator()
            generator.selectionChanged()
        }
    }

    // MARK: - Card Styles
    struct CardStyle: ViewModifier {
        var cornerRadius: CGFloat = CornerRadius.md
        var shadow: ShadowStyle = Shadow.medium
        var padding: CGFloat = Spacing.cardPadding

        func body(content: Content) -> some View {
            content
                .padding(padding)
                .background(
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .fill(Colors.background)
                )
                .shadow(color: shadow.color, radius: shadow.radius, x: shadow.x, y: shadow.y)
        }
    }

    // MARK: - Button Styles
    struct PrimaryButtonStyle: ButtonStyle {
        @Environment(\.isEnabled) private var isEnabled: Bool

        func makeBody(configuration: Configuration) -> some View {
            configuration.label
                .font(Typography.bodyBold)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.md)
                .background(
                    RoundedRectangle(cornerRadius: CornerRadius.md)
                        .fill(isEnabled ? Colors.primary : Colors.secondaryText)
                )
                .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
                .animation(Animation.quick, value: configuration.isPressed)
        }
    }

    struct SecondaryButtonStyle: ButtonStyle {
        func makeBody(configuration: Configuration) -> some View {
            configuration.label
                .font(Typography.bodyBold)
                .foregroundColor(Colors.primary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, Spacing.md)
                .background(
                    RoundedRectangle(cornerRadius: CornerRadius.md)
                        .stroke(Colors.primary, lineWidth: 2)
                )
                .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
                .animation(Animation.quick, value: configuration.isPressed)
        }
    }
}

// MARK: - View Extensions
extension View {
    func modernCard(cornerRadius: CGFloat = ModernTheme.CornerRadius.md,
                   shadow: ModernTheme.ShadowStyle = ModernTheme.Shadow.medium,
                   padding: CGFloat = ModernTheme.Spacing.cardPadding) -> some View {
        modifier(ModernTheme.CardStyle(cornerRadius: cornerRadius, shadow: shadow, padding: padding))
    }

    func primaryButton() -> some View {
        buttonStyle(ModernTheme.PrimaryButtonStyle())
    }

    func secondaryButton() -> some View {
        buttonStyle(ModernTheme.SecondaryButtonStyle())
    }

    // iOS 17+ Container Background
    @available(iOS 17.0, *)
    func modernContainer(alignment: Alignment = .center) -> some View {
        self.containerRelativeFrame([.horizontal, .vertical], alignment: alignment)
    }
}

// MARK: - Material Backgrounds (iOS 17+)
extension ShapeStyle where Self == Material {
    static var modernUltraThin: Material {
        .ultraThinMaterial
    }

    static var modernThin: Material {
        .thinMaterial
    }

    static var modernRegular: Material {
        .regularMaterial
    }

    static var modernThick: Material {
        .thickMaterial
    }

    static var modernUltraThick: Material {
        .ultraThickMaterial
    }
}

// MARK: - Status Color Helper
extension VehicleStatus {
    var themeColor: Color {
        switch self {
        case .active:
            return ModernTheme.Colors.active
        case .idle:
            return ModernTheme.Colors.idle
        case .charging:
            return ModernTheme.Colors.charging
        case .service:
            return ModernTheme.Colors.service
        case .emergency:
            return ModernTheme.Colors.emergency
        case .offline:
            return ModernTheme.Colors.offline
        }
    }

    var symbolName: String {
        switch self {
        case .active:
            return ModernTheme.Symbols.active
        case .idle:
            return ModernTheme.Symbols.idle
        case .charging:
            return ModernTheme.Symbols.charging
        case .service:
            return ModernTheme.Symbols.service
        case .emergency:
            return ModernTheme.Symbols.emergency
        case .offline:
            return ModernTheme.Symbols.offline
        }
    }
}

// MARK: - Device Detection
extension ModernTheme {
    static var isIPad: Bool {
        UIDevice.current.userInterfaceIdiom == .pad
    }

    static var isIPhone: Bool {
        UIDevice.current.userInterfaceIdiom == .phone
    }

    static var screenWidth: CGFloat {
        UIScreen.main.bounds.width
    }

    static var screenHeight: CGFloat {
        UIScreen.main.bounds.height
    }

    // Adaptive layout columns
    static var adaptiveColumns: [GridItem] {
        if isIPad {
            return Array(repeating: GridItem(.flexible(), spacing: Spacing.gridSpacing), count: 3)
        } else {
            return Array(repeating: GridItem(.flexible(), spacing: Spacing.gridSpacing), count: 2)
        }
    }
}
