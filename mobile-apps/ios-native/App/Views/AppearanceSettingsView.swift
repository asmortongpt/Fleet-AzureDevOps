//
//  AppearanceSettingsView.swift
//  Fleet Manager
//
//  Theme and appearance customization
//

import SwiftUI

// MARK: - App Appearance Manager
class AppearanceManager: ObservableObject {
    static let shared = AppearanceManager()

    @AppStorage("selectedTheme") var selectedTheme: AppTheme = .system
    @AppStorage("accentColorIndex") var accentColorIndex: Int = 0
    @AppStorage("useDynamicType") var useDynamicType: Bool = true
    @AppStorage("reduceMotion") var reduceMotion: Bool = false
    @AppStorage("highContrast") var highContrast: Bool = false
    @AppStorage("compactMode") var compactMode: Bool = false

    let accentColors: [AccentColorOption] = [
        AccentColorOption(name: "Blue", color: .blue),
        AccentColorOption(name: "Green", color: .green),
        AccentColorOption(name: "Orange", color: .orange),
        AccentColorOption(name: "Purple", color: .purple),
        AccentColorOption(name: "Red", color: .red),
        AccentColorOption(name: "Teal", color: .teal),
        AccentColorOption(name: "Indigo", color: .indigo)
    ]

    var currentAccentColor: Color {
        guard accentColorIndex >= 0 && accentColorIndex < accentColors.count else {
            return .blue
        }
        return accentColors[accentColorIndex].color
    }

    func applyTheme() {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else { return }

        switch selectedTheme {
        case .light:
            window.overrideUserInterfaceStyle = .light
        case .dark:
            window.overrideUserInterfaceStyle = .dark
        case .system:
            window.overrideUserInterfaceStyle = .unspecified
        }
    }
}

// MARK: - Theme Options
enum AppTheme: String, CaseIterable {
    case system = "System"
    case light = "Light"
    case dark = "Dark"

    var icon: String {
        switch self {
        case .system: return "circle.lefthalf.filled"
        case .light: return "sun.max.fill"
        case .dark: return "moon.fill"
        }
    }
}

struct AccentColorOption: Identifiable {
    let id = UUID()
    let name: String
    let color: Color
}

// MARK: - Appearance Settings View
struct AppearanceSettingsView: View {
    @StateObject private var appearanceManager = AppearanceManager.shared
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Form {
            // Theme Section
            Section {
                ForEach(AppTheme.allCases, id: \.self) { theme in
                    ThemeRow(
                        theme: theme,
                        isSelected: appearanceManager.selectedTheme == theme
                    ) {
                        appearanceManager.selectedTheme = theme
                        appearanceManager.applyTheme()
                    }
                }
            } header: {
                Text("Theme")
            } footer: {
                Text("Choose how the app appears. System uses your device's appearance settings.")
            }

            // Accent Color Section
            Section("Accent Color") {
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 4), spacing: 16) {
                    ForEach(Array(appearanceManager.accentColors.enumerated()), id: \.offset) { index, option in
                        AccentColorButton(
                            color: option.color,
                            name: option.name,
                            isSelected: appearanceManager.accentColorIndex == index
                        ) {
                            appearanceManager.accentColorIndex = index
                        }
                    }
                }
                .padding(.vertical, 8)
            }

            // Text Size Section
            Section {
                Toggle(isOn: $appearanceManager.useDynamicType) {
                    Label("Dynamic Type", systemImage: "textformat.size")
                }

                if !appearanceManager.useDynamicType {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Text Size")
                            .font(.subheadline)
                            .foregroundColor(.secondary)

                        // Custom text size slider would go here
                        Text("Using system text size")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            } header: {
                Text("Text")
            } footer: {
                Text("Dynamic Type automatically adjusts text size based on your device settings.")
            }

            // Accessibility Section
            Section("Accessibility") {
                Toggle(isOn: $appearanceManager.reduceMotion) {
                    Label("Reduce Motion", systemImage: "figure.walk.motion")
                }

                Toggle(isOn: $appearanceManager.highContrast) {
                    Label("Increase Contrast", systemImage: "circle.lefthalf.fill")
                }
            }

            // Layout Section
            Section {
                Toggle(isOn: $appearanceManager.compactMode) {
                    Label("Compact Mode", systemImage: "rectangle.compress.vertical")
                }
            } header: {
                Text("Layout")
            } footer: {
                Text("Compact mode reduces spacing for more content on screen.")
            }

            // Preview Section
            Section("Preview") {
                PreviewCard()
            }

            // Reset Section
            Section {
                Button(action: resetToDefaults) {
                    HStack {
                        Image(systemName: "arrow.counterclockwise")
                        Text("Reset to Defaults")
                    }
                    .foregroundColor(.red)
                }
            }
        }
        .navigationTitle("Appearance")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func resetToDefaults() {
        appearanceManager.selectedTheme = .system
        appearanceManager.accentColorIndex = 0
        appearanceManager.useDynamicType = true
        appearanceManager.reduceMotion = false
        appearanceManager.highContrast = false
        appearanceManager.compactMode = false
        appearanceManager.applyTheme()
    }
}

// MARK: - Theme Row
struct ThemeRow: View {
    let theme: AppTheme
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: theme.icon)
                    .foregroundColor(isSelected ? .blue : .secondary)
                    .frame(width: 24)

                Text(theme.rawValue)
                    .foregroundColor(.primary)

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.blue)
                }
            }
        }
    }
}

// MARK: - Accent Color Button
struct AccentColorButton: View {
    let color: Color
    let name: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                ZStack {
                    Circle()
                        .fill(color)
                        .frame(width: 44, height: 44)

                    if isSelected {
                        Circle()
                            .stroke(Color.primary, lineWidth: 3)
                            .frame(width: 50, height: 50)

                        Image(systemName: "checkmark")
                            .font(.caption.bold())
                            .foregroundColor(.white)
                    }
                }

                Text(name)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Preview Card
struct PreviewCard: View {
    @StateObject private var appearanceManager = AppearanceManager.shared

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Circle()
                    .fill(appearanceManager.currentAccentColor)
                    .frame(width: 40, height: 40)

                VStack(alignment: .leading, spacing: 2) {
                    Text("Sample Title")
                        .font(.headline)
                    Text("Secondary text preview")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Text("Active")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.green)
                    .cornerRadius(6)
            }

            Divider()

            HStack(spacing: 16) {
                Label("12.5 mi", systemImage: "location.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Label("45 min", systemImage: "clock.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()
            }

            Button(action: {}) {
                Text("Sample Button")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
                    .background(appearanceManager.currentAccentColor)
                    .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Preview
#Preview {
    NavigationView {
        AppearanceSettingsView()
    }
}
