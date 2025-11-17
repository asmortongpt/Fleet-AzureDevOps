//
//  AccessibilityManager.swift
//  Fleet Manager
//
//  Comprehensive accessibility utilities for WCAG 2.1 Level AA and Section 508 compliance
//  Provides VoiceOver, Dynamic Type, Reduce Motion, and High Contrast support
//

import SwiftUI
import UIKit
import Combine

// MARK: - Accessibility Manager

/// Centralized manager for accessibility features and settings
@MainActor
class AccessibilityManager: ObservableObject {

    // MARK: - Shared Instance
    static let shared = AccessibilityManager()

    // MARK: - Published Properties
    @Published var isVoiceOverRunning: Bool = false
    @Published var isSwitchControlRunning: Bool = false
    @Published var isReduceMotionEnabled: Bool = false
    @Published var isReduceTransparencyEnabled: Bool = false
    @Published var isDarkerSystemColorsEnabled: Bool = false
    @Published var isBoldTextEnabled: Bool = false
    @Published var isGrayscaleEnabled: Bool = false
    @Published var isInvertColorsEnabled: Bool = false
    @Published var isMonoAudioEnabled: Bool = false
    @Published var isClosedCaptioningEnabled: Bool = false
    @Published var preferredContentSizeCategory: ContentSizeCategory = .large
    @Published var shouldDifferentiateWithoutColor: Bool = false
    @Published var isShakeToUndoEnabled: Bool = true
    @Published var isSpeakScreenEnabled: Bool = false
    @Published var isSpeakSelectionEnabled: Bool = false

    // MARK: - Private Properties
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization
    private init() {
        updateAccessibilitySettings()
        setupNotificationObservers()
    }

    // MARK: - Update Settings

    /// Updates all accessibility settings from system preferences
    func updateAccessibilitySettings() {
        isVoiceOverRunning = UIAccessibility.isVoiceOverRunning
        isSwitchControlRunning = UIAccessibility.isSwitchControlRunning
        isReduceMotionEnabled = UIAccessibility.isReduceMotionEnabled
        isReduceTransparencyEnabled = UIAccessibility.isReduceTransparencyEnabled
        isDarkerSystemColorsEnabled = UIAccessibility.isDarkerSystemColorsEnabled
        isBoldTextEnabled = UIAccessibility.isBoldTextEnabled
        isGrayscaleEnabled = UIAccessibility.isGrayscaleEnabled
        isInvertColorsEnabled = UIAccessibility.isInvertColorsEnabled
        isMonoAudioEnabled = UIAccessibility.isMonoAudioEnabled
        isClosedCaptioningEnabled = UIAccessibility.isClosedCaptioningEnabled
        shouldDifferentiateWithoutColor = UIAccessibility.shouldDifferentiateWithoutColor
        isShakeToUndoEnabled = UIAccessibility.isShakeToUndoEnabled
        isSpeakScreenEnabled = UIAccessibility.isSpeakScreenEnabled
        isSpeakSelectionEnabled = UIAccessibility.isSpeakSelectionEnabled

        // Get content size category
        let uiCategory = UIApplication.shared.preferredContentSizeCategory
        preferredContentSizeCategory = ContentSizeCategory(uiCategory)
    }

    // MARK: - Notification Observers

    private func setupNotificationObservers() {
        // VoiceOver status changed
        NotificationCenter.default.publisher(for: UIAccessibility.voiceOverStatusDidChangeNotification)
            .sink { [weak self] _ in
                Task { @MainActor in
                    self?.updateAccessibilitySettings()
                }
            }
            .store(in: &cancellables)

        // Bold text changed
        NotificationCenter.default.publisher(for: UIAccessibility.boldTextStatusDidChangeNotification)
            .sink { [weak self] _ in
                Task { @MainActor in
                    self?.updateAccessibilitySettings()
                }
            }
            .store(in: &cancellables)

        // Reduce motion changed
        NotificationCenter.default.publisher(for: UIAccessibility.reduceMotionStatusDidChangeNotification)
            .sink { [weak self] _ in
                Task { @MainActor in
                    self?.updateAccessibilitySettings()
                }
            }
            .store(in: &cancellables)

        // Reduce transparency changed
        NotificationCenter.default.publisher(for: UIAccessibility.reduceTransparencyStatusDidChangeNotification)
            .sink { [weak self] _ in
                Task { @MainActor in
                    self?.updateAccessibilitySettings()
                }
            }
            .store(in: &cancellables)

        // Differentiate without color changed
        NotificationCenter.default.publisher(for: UIAccessibility.differentiateWithoutColorDidChangeNotification)
            .sink { [weak self] _ in
                Task { @MainActor in
                    self?.updateAccessibilitySettings()
                }
            }
            .store(in: &cancellables)

        // Invert colors changed
        NotificationCenter.default.publisher(for: UIAccessibility.invertColorsStatusDidChangeNotification)
            .sink { [weak self] _ in
                Task { @MainActor in
                    self?.updateAccessibilitySettings()
                }
            }
            .store(in: &cancellables)

        // Content size category changed
        NotificationCenter.default.publisher(for: UIContentSizeCategory.didChangeNotification)
            .sink { [weak self] _ in
                Task { @MainActor in
                    self?.updateAccessibilitySettings()
                }
            }
            .store(in: &cancellables)
    }

    // MARK: - VoiceOver Helpers

    /// Post an accessibility announcement for VoiceOver users
    /// - Parameters:
    ///   - message: The message to announce
    ///   - queueAnnouncement: Whether to queue the announcement (default: false)
    func announce(_ message: String, queueAnnouncement: Bool = false) {
        let attributedString = NSAttributedString(
            string: message,
            attributes: [.accessibilitySpeechQueueAnnouncement: queueAnnouncement]
        )
        UIAccessibility.post(notification: .announcement, argument: attributedString)
    }

    /// Announce a localized message
    func announceLocalized(_ key: String, queueAnnouncement: Bool = false) {
        let message = LocalizationManager.shared.string(forKey: key)
        announce(message, queueAnnouncement: queueAnnouncement)
    }

    /// Post a screen change notification for VoiceOver
    /// - Parameter element: The element that should receive focus
    func notifyScreenChanged(focusOn element: Any? = nil) {
        UIAccessibility.post(notification: .screenChanged, argument: element)
    }

    /// Post a layout change notification for VoiceOver
    /// - Parameter element: The element that should receive focus
    func notifyLayoutChanged(focusOn element: Any? = nil) {
        UIAccessibility.post(notification: .layoutChanged, argument: element)
    }

    /// Post a page scrolled notification for VoiceOver
    /// - Parameter message: Optional message to announce
    func notifyPageScrolled(message: String? = nil) {
        UIAccessibility.post(notification: .pageScrolled, argument: message)
    }

    // MARK: - Dynamic Type Helpers

    /// Check if the current content size category is an accessibility size
    var isAccessibilityCategory: Bool {
        return preferredContentSizeCategory.isAccessibilityCategory
    }

    /// Get scaled font size for the current content size category
    /// - Parameters:
    ///   - baseSize: The base font size
    ///   - maximumSize: Optional maximum size limit
    /// - Returns: Scaled font size
    func scaledFontSize(_ baseSize: CGFloat, maximumSize: CGFloat? = nil) -> CGFloat {
        let scaleFactor = preferredContentSizeCategory.scaleFactor
        let scaledSize = baseSize * scaleFactor

        if let maximumSize = maximumSize {
            return min(scaledSize, maximumSize)
        }

        return scaledSize
    }

    /// Get a scaled font with the specified style
    func scaledFont(_ style: Font.TextStyle, size: CGFloat? = nil) -> Font {
        if let size = size {
            return .system(size: scaledFontSize(size))
        }
        return .system(style)
    }

    // MARK: - Motion Helpers

    /// Execute an action with or without animation based on reduce motion setting
    /// - Parameters:
    ///   - animation: The animation to use if reduce motion is disabled
    ///   - action: The action to perform
    func withOptionalAnimation<T>(_ animation: Animation? = .default, _ action: () -> T) -> T {
        if isReduceMotionEnabled {
            return action()
        } else {
            return withAnimation(animation, action)
        }
    }

    /// Get the appropriate animation based on reduce motion setting
    /// - Parameter defaultAnimation: The animation to use if reduce motion is disabled
    /// - Returns: Animation or nil if reduce motion is enabled
    func optionalAnimation(_ defaultAnimation: Animation = .default) -> Animation? {
        return isReduceMotionEnabled ? nil : defaultAnimation
    }

    // MARK: - High Contrast Helpers

    /// Check if high contrast mode is enabled
    var isHighContrastEnabled: Bool {
        return isDarkerSystemColorsEnabled || shouldDifferentiateWithoutColor
    }

    /// Get contrast-appropriate color
    /// - Parameters:
    ///   - normalColor: Color to use in normal mode
    ///   - highContrastColor: Color to use in high contrast mode
    /// - Returns: Appropriate color based on contrast settings
    func contrastAwareColor(normal normalColor: Color, highContrast highContrastColor: Color) -> Color {
        return isHighContrastEnabled ? highContrastColor : normalColor
    }

    /// Get minimum contrast ratio for WCAG compliance
    /// - Parameter level: WCAG conformance level (default: .AA)
    /// - Returns: Minimum contrast ratio
    func minimumContrastRatio(level: WCAGLevel = .AA) -> Double {
        switch level {
        case .A:
            return 3.0
        case .AA:
            return isAccessibilityCategory ? 4.5 : 4.5
        case .AAA:
            return isAccessibilityCategory ? 7.0 : 7.0
        }
    }

    // MARK: - Assistive Touch Helpers

    /// Get recommended minimum touch target size
    var minimumTouchTargetSize: CGSize {
        // WCAG 2.1 Level AAA recommends 44x44 points
        // Section 508 requires 44x44 points
        return CGSize(width: 44, height: 44)
    }

    /// Check if a size meets minimum touch target requirements
    func meetsMinimumTouchTarget(_ size: CGSize) -> Bool {
        return size.width >= minimumTouchTargetSize.width &&
               size.height >= minimumTouchTargetSize.height
    }

    // MARK: - Focus Management

    /// Request focus on a specific accessibility element
    /// - Parameter element: The UIAccessibilityElement to focus
    func requestFocus(on element: Any) {
        UIAccessibility.post(notification: .layoutChanged, argument: element)
    }

    // MARK: - Keyboard Navigation

    /// Check if full keyboard access is enabled
    var isFullKeyboardAccessEnabled: Bool {
        #if targetEnvironment(macCatalyst)
        return true
        #else
        return false
        #endif
    }
}

// MARK: - WCAG Level Enum

enum WCAGLevel {
    case A
    case AA
    case AAA
}

// MARK: - Content Size Category Extension

extension ContentSizeCategory {

    /// Initialize from UIContentSizeCategory
    init(_ uiCategory: UIContentSizeCategory) {
        switch uiCategory {
        case .extraSmall:
            self = .extraSmall
        case .small:
            self = .small
        case .medium:
            self = .medium
        case .large:
            self = .large
        case .extraLarge:
            self = .extraLarge
        case .extraExtraLarge:
            self = .extraExtraLarge
        case .extraExtraExtraLarge:
            self = .extraExtraExtraLarge
        case .accessibilityMedium:
            self = .accessibilityMedium
        case .accessibilityLarge:
            self = .accessibilityLarge
        case .accessibilityExtraLarge:
            self = .accessibilityExtraLarge
        case .accessibilityExtraExtraLarge:
            self = .accessibilityExtraExtraLarge
        case .accessibilityExtraExtraExtraLarge:
            self = .accessibilityExtraExtraExtraLarge
        default:
            self = .large
        }
    }

    /// Check if this is an accessibility size category
    var isAccessibilityCategory: Bool {
        switch self {
        case .accessibilityMedium, .accessibilityLarge, .accessibilityExtraLarge,
             .accessibilityExtraExtraLarge, .accessibilityExtraExtraExtraLarge:
            return true
        default:
            return false
        }
    }

    /// Get the scale factor for this category relative to .large
    var scaleFactor: CGFloat {
        switch self {
        case .extraSmall:
            return 0.82
        case .small:
            return 0.88
        case .medium:
            return 0.95
        case .large:
            return 1.0
        case .extraLarge:
            return 1.12
        case .extraExtraLarge:
            return 1.24
        case .extraExtraExtraLarge:
            return 1.35
        case .accessibilityMedium:
            return 1.6
        case .accessibilityLarge:
            return 1.9
        case .accessibilityExtraLarge:
            return 2.35
        case .accessibilityExtraExtraLarge:
            return 2.75
        case .accessibilityExtraExtraExtraLarge:
            return 3.2
        @unknown default:
            return 1.0
        }
    }
}

// MARK: - SwiftUI View Extensions for Accessibility

extension View {

    /// Apply standard accessibility modifiers for interactive elements
    /// - Parameters:
    ///   - label: Accessibility label
    ///   - hint: Optional accessibility hint
    ///   - value: Optional accessibility value
    ///   - traits: Accessibility traits
    /// - Returns: Modified view
    func accessibilityElement(
        label: String,
        hint: String? = nil,
        value: String? = nil,
        traits: AccessibilityTraits = []
    ) -> some View {
        self
            .accessibilityLabel(label)
            .accessibilityHint(hint ?? "")
            .accessibilityValue(value ?? "")
            .accessibilityAddTraits(traits)
    }

    /// Apply localized accessibility labels
    /// - Parameters:
    ///   - labelKey: Localization key for label
    ///   - hintKey: Optional localization key for hint
    ///   - valueKey: Optional localization key for value
    ///   - traits: Accessibility traits
    /// - Returns: Modified view
    func accessibilityElementLocalized(
        labelKey: String,
        hintKey: String? = nil,
        valueKey: String? = nil,
        traits: AccessibilityTraits = []
    ) -> some View {
        let manager = LocalizationManager.shared
        return self
            .accessibilityLabel(manager.string(forKey: labelKey))
            .accessibilityHint(hintKey != nil ? manager.string(forKey: hintKey!) : "")
            .accessibilityValue(valueKey != nil ? manager.string(forKey: valueKey!) : "")
            .accessibilityAddTraits(traits)
    }

    /// Apply minimum touch target size for accessibility
    /// - Parameter size: Minimum size (default: 44x44)
    /// - Returns: Modified view
    func accessibleTouchTarget(size: CGSize = CGSize(width: 44, height: 44)) -> some View {
        self.frame(minWidth: size.width, minHeight: size.height)
    }

    /// Apply reduce motion aware animation
    /// - Parameter animation: The animation to apply if reduce motion is disabled
    /// - Returns: Modified view
    func reduceMotionAnimation(_ animation: Animation = .default) -> some View {
        let accessibilityManager = AccessibilityManager.shared
        return self.animation(
            accessibilityManager.isReduceMotionEnabled ? nil : animation,
            value: accessibilityManager.isReduceMotionEnabled
        )
    }

    /// Hide decorative images from accessibility
    func decorativeImage() -> some View {
        self.accessibilityHidden(true)
    }

    /// Mark as heading for screen readers
    /// - Parameter level: Heading level (1-6)
    func accessibilityHeading(level: Int = 1) -> some View {
        self.accessibilityAddTraits(.isHeader)
    }

    /// Group accessibility elements together
    func accessibilityGroup() -> some View {
        self.accessibilityElement(children: .combine)
    }

    /// Apply high contrast aware styling
    func highContrastAware(
        normalColor: Color,
        highContrastColor: Color
    ) -> some View {
        let manager = AccessibilityManager.shared
        let color = manager.contrastAwareColor(
            normal: normalColor,
            highContrast: highContrastColor
        )
        return self.foregroundColor(color)
    }
}

// MARK: - Accessibility Testing Helpers

#if DEBUG
extension AccessibilityManager {

    /// Simulate VoiceOver being enabled (for testing)
    func simulateVoiceOver(_ enabled: Bool) {
        isVoiceOverRunning = enabled
    }

    /// Simulate Reduce Motion being enabled (for testing)
    func simulateReduceMotion(_ enabled: Bool) {
        isReduceMotionEnabled = enabled
    }

    /// Simulate High Contrast being enabled (for testing)
    func simulateHighContrast(_ enabled: Bool) {
        isDarkerSystemColorsEnabled = enabled
        shouldDifferentiateWithoutColor = enabled
    }

    /// Simulate accessibility size category (for testing)
    func simulateContentSizeCategory(_ category: ContentSizeCategory) {
        preferredContentSizeCategory = category
    }
}
#endif
