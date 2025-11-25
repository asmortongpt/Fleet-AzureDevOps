//
//  HeatmapSettingsView.swift
//  Fleet Manager
//
//  Configure heatmap radius, gradient colors, and intensity settings
//

import SwiftUI

struct HeatmapSettingsView: View {
    @ObservedObject var viewModel: GISViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var selectedGradient: GradientPreset = .default

    var body: some View {
        NavigationView {
            Form {
                // Radius Section
                radiusSection

                // Opacity Section
                opacitySection

                // Gradient Section
                gradientSection

                // Preview Section
                previewSection

                // Actions Section
                actionsSection
            }
            .navigationTitle("Heatmap Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Apply") {
                        applySettings()
                        dismiss()
                    }
                    .fontWeight(.bold)
                }
            }
        }
    }

    // MARK: - Radius Section
    private var radiusSection: some View {
        Section {
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                HStack {
                    Text("Radius")
                        .font(ModernTheme.Typography.bodyBold)

                    Spacer()

                    Text("\(Int(viewModel.heatmapRadius)) meters")
                        .font(ModernTheme.Typography.body)
                        .foregroundColor(ModernTheme.Colors.primary)
                }

                Slider(
                    value: $viewModel.heatmapRadius,
                    in: 10...100,
                    step: 5
                ) {
                    Text("Radius")
                } minimumValueLabel: {
                    Text("10m")
                        .font(ModernTheme.Typography.caption1)
                } maximumValueLabel: {
                    Text("100m")
                        .font(ModernTheme.Typography.caption1)
                }
                .tint(ModernTheme.Colors.primary)

                Text("Controls the spread of heat intensity around each point")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }
            .padding(.vertical, ModernTheme.Spacing.sm)
        } header: {
            Label("Point Radius", systemImage: "circle.dashed")
        }
    }

    // MARK: - Opacity Section
    private var opacitySection: some View {
        Section {
            VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                HStack {
                    Text("Opacity")
                        .font(ModernTheme.Typography.bodyBold)

                    Spacer()

                    Text("\(Int(viewModel.heatmapOpacity * 100))%")
                        .font(ModernTheme.Typography.body)
                        .foregroundColor(ModernTheme.Colors.primary)
                }

                Slider(
                    value: $viewModel.heatmapOpacity,
                    in: 0.1...1.0,
                    step: 0.1
                ) {
                    Text("Opacity")
                } minimumValueLabel: {
                    Text("10%")
                        .font(ModernTheme.Typography.caption1)
                } maximumValueLabel: {
                    Text("100%")
                        .font(ModernTheme.Typography.caption1)
                }
                .tint(ModernTheme.Colors.primary)

                Text("Controls the transparency of the heatmap overlay")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }
            .padding(.vertical, ModernTheme.Spacing.sm)
        } header: {
            Label("Layer Opacity", systemImage: "eye")
        }
    }

    // MARK: - Gradient Section
    private var gradientSection: some View {
        Section {
            VStack(spacing: ModernTheme.Spacing.md) {
                ForEach(GradientPreset.allCases, id: \.self) { preset in
                    gradientOption(preset)
                }
            }
            .padding(.vertical, ModernTheme.Spacing.sm)
        } header: {
            Label("Color Gradient", systemImage: "paintpalette")
        } footer: {
            Text("Select a color gradient to represent heat intensity")
                .font(ModernTheme.Typography.caption1)
        }
    }

    private func gradientOption(_ preset: GradientPreset) -> some View {
        Button(action: {
            selectedGradient = preset
            viewModel.updateHeatmapGradient(preset.gradient)
            ModernTheme.Haptics.selection()
        }) {
            HStack(spacing: ModernTheme.Spacing.md) {
                // Gradient Preview
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.sm)
                    .fill(preset.linearGradient)
                    .frame(width: 100, height: 30)

                VStack(alignment: .leading, spacing: 4) {
                    Text(preset.displayName)
                        .font(ModernTheme.Typography.bodyBold)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    Text(preset.description)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Spacer()

                if selectedGradient == preset {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(ModernTheme.Colors.primary)
                        .font(.title3)
                }
            }
            .padding(ModernTheme.Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                    .fill(selectedGradient == preset ? ModernTheme.Colors.primary.opacity(0.1) : ModernTheme.Colors.secondaryBackground)
            )
            .overlay(
                RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                    .stroke(selectedGradient == preset ? ModernTheme.Colors.primary : Color.clear, lineWidth: 2)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }

    // MARK: - Preview Section
    private var previewSection: some View {
        Section {
            VStack(spacing: ModernTheme.Spacing.md) {
                Text("Preview")
                    .font(ModernTheme.Typography.headline)

                ZStack {
                    // Background
                    RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                        .fill(Color.gray.opacity(0.1))

                    // Sample heatmap visualization
                    Canvas { context, size in
                        let center = CGPoint(x: size.width / 2, y: size.height / 2)
                        let maxRadius = CGFloat(viewModel.heatmapRadius * 2)

                        for i in stride(from: maxRadius, to: 0, by: -10) {
                            let opacity = (maxRadius - i) / maxRadius * viewModel.heatmapOpacity
                            let color = interpolateGradientColor(progress: Double(opacity))

                            context.fill(
                                Circle().path(in: CGRect(
                                    x: center.x - i / 2,
                                    y: center.y - i / 2,
                                    width: i,
                                    height: i
                                )),
                                with: .color(color.opacity(opacity))
                            )
                        }
                    }
                }
                .frame(height: 150)

                Text("This preview shows how the heatmap will appear with your current settings")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .multilineTextAlignment(.center)
            }
            .padding(.vertical, ModernTheme.Spacing.sm)
        }
    }

    // MARK: - Actions Section
    private var actionsSection: some View {
        Section {
            Button(action: {
                resetToDefaults()
            }) {
                HStack {
                    Image(systemName: "arrow.counterclockwise")
                    Text("Reset to Defaults")
                }
                .font(ModernTheme.Typography.bodyBold)
                .foregroundColor(ModernTheme.Colors.error)
                .frame(maxWidth: .infinity)
            }
        }
    }

    // MARK: - Actions
    private func applySettings() {
        viewModel.updateHeatmapRadius(viewModel.heatmapRadius)
        viewModel.updateHeatmapOpacity(viewModel.heatmapOpacity)
        ModernTheme.Haptics.success()

        Task {
            await viewModel.loadHeatmap()
        }
    }

    private func resetToDefaults() {
        viewModel.heatmapRadius = 30.0
        viewModel.heatmapOpacity = 0.6
        selectedGradient = .default
        viewModel.updateHeatmapGradient(.default)
        ModernTheme.Haptics.light()
    }

    // MARK: - Helper Methods
    private func interpolateGradientColor(progress: Double) -> Color {
        let colors = selectedGradient.colors
        guard !colors.isEmpty else { return .red }

        if progress <= 0 { return colors.first! }
        if progress >= 1 { return colors.last! }

        let scaledProgress = progress * Double(colors.count - 1)
        let index = Int(scaledProgress)
        let remainder = scaledProgress - Double(index)

        guard index < colors.count - 1 else { return colors.last! }

        // Simple linear interpolation between two colors
        return colors[index]
    }
}

// MARK: - Gradient Presets
enum GradientPreset: String, CaseIterable {
    case `default` = "default"
    case fire = "fire"
    case cool = "cool"
    case rainbow = "rainbow"

    var displayName: String {
        switch self {
        case .default: return "Default"
        case .fire: return "Fire"
        case .cool: return "Cool"
        case .rainbow: return "Rainbow"
        }
    }

    var description: String {
        switch self {
        case .default: return "Blue to red gradient"
        case .fire: return "Black to white through red"
        case .cool: return "White to dark blue"
        case .rainbow: return "Full spectrum colors"
        }
    }

    var gradient: HeatmapGradient {
        switch self {
        case .default: return .default
        case .fire: return .fire
        case .cool: return .cool
        case .rainbow:
            return HeatmapGradient(
                colors: ["#FF0000", "#FF7F00", "#FFFF00", "#00FF00", "#0000FF", "#4B0082", "#9400D3"],
                positions: [0.0, 0.16, 0.33, 0.5, 0.66, 0.83, 1.0]
            )
        }
    }

    var colors: [Color] {
        switch self {
        case .default:
            return [.blue, .cyan, .green, .yellow, .red]
        case .fire:
            return [.black, .red, .orange, .yellow, .white]
        case .cool:
            return [.white, .cyan, .blue, Color(red: 0, green: 0, blue: 0.5)]
        case .rainbow:
            return [.red, .orange, .yellow, .green, .blue, .purple]
        }
    }

    var linearGradient: LinearGradient {
        LinearGradient(
            colors: colors,
            startPoint: .leading,
            endPoint: .trailing
        )
    }
}

// MARK: - Filter Sheet View (Supporting)
struct FilterSheetView: View {
    @ObservedObject var viewModel: GISViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Vehicle Types") {
                    // Add vehicle type filters here
                    Text("Vehicle type filters coming soon")
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Section("Status Filters") {
                    // Add status filters here
                    Text("Status filters coming soon")
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Section {
                    Button("Clear All Filters") {
                        viewModel.clearFilters()
                        dismiss()
                    }
                    .foregroundColor(ModernTheme.Colors.error)
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Export Options View (Supporting)
struct ExportOptionsView: View {
    @ObservedObject var viewModel: GISViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                Button(action: {
                    // Export as PNG
                    dismiss()
                }) {
                    Label("Export as PNG", systemImage: "photo")
                }

                Button(action: {
                    // Export as PDF
                    dismiss()
                }) {
                    Label("Export as PDF", systemImage: "doc")
                }

                Button(action: {
                    // Export data as CSV
                    dismiss()
                }) {
                    Label("Export Data (CSV)", systemImage: "tablecells")
                }
            }
            .navigationTitle("Export Options")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Preview
#Preview {
    HeatmapSettingsView(viewModel: GISViewModel())
}
