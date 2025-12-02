//
//  LayerControlView.swift
//  Fleet Manager
//
//  Layer control panel for toggling visibility, opacity, and order
//

import SwiftUI

struct LayerControlView: View {
    @ObservedObject var viewModel: GISViewModel
    @Binding var isPresented: Bool
    @State private var editMode: EditMode = .inactive

    var body: some View {
        VStack(spacing: 0) {
            // Header
            header

            Divider()

            // Layer List
            ScrollView {
                LazyVStack(spacing: ModernTheme.Spacing.sm) {
                    ForEach(viewModel.layers) { layer in
                        layerRow(layer)
                    }
                }
                .padding()
            }
            .frame(maxHeight: UIScreen.main.bounds.height * 0.6)

            Divider()

            // Footer Actions
            footer
        }
        .background(ModernTheme.Colors.background)
        .cornerRadius(ModernTheme.CornerRadius.xl, corners: [.topLeft, .topRight])
        .shadow(color: ModernTheme.Shadow.elevated.color,
                radius: ModernTheme.Shadow.elevated.radius,
                x: ModernTheme.Shadow.elevated.x,
                y: ModernTheme.Shadow.elevated.y)
    }

    // MARK: - Header
    private var header: some View {
        HStack {
            Text("Layers")
                .font(ModernTheme.Typography.title2)

            Spacer()

            Button(action: {
                editMode = editMode == .active ? .inactive : .active
                ModernTheme.Haptics.light()
            }) {
                Text(editMode == .active ? "Done" : "Edit")
                    .font(ModernTheme.Typography.bodyBold)
                    .foregroundColor(ModernTheme.Colors.primary)
            }

            Button(action: {
                withAnimation {
                    isPresented = false
                }
            }) {
                Image(systemName: "xmark.circle.fill")
                    .font(.title2)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }
        }
        .padding()
    }

    // MARK: - Layer Row
    private func layerRow(_ layer: GISLayer) -> some View {
        VStack(spacing: ModernTheme.Spacing.sm) {
            HStack(spacing: ModernTheme.Spacing.md) {
                // Visibility Toggle
                Button(action: {
                    viewModel.toggleLayer(layer)
                    ModernTheme.Haptics.selection()
                }) {
                    Image(systemName: layer.visible ? "eye.fill" : "eye.slash.fill")
                        .font(.title3)
                        .foregroundColor(layer.visible ? ModernTheme.Colors.primary : ModernTheme.Colors.secondaryText)
                        .frame(width: 30)
                }

                // Layer Icon and Name
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Image(systemName: layer.type.iconName)
                            .foregroundColor(colorFromString(layer.color ?? layer.type.defaultColor))

                        Text(layer.name)
                            .font(ModernTheme.Typography.bodyBold)
                    }

                    Text(layer.type.displayName)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Spacer()

                // Z-Index Indicator
                if editMode == .active {
                    VStack {
                        Image(systemName: "line.3.horizontal")
                            .foregroundColor(ModernTheme.Colors.secondaryText)
                    }
                } else {
                    Text("\(Int(layer.opacity * 100))%")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }

            // Opacity Slider
            if layer.visible && editMode == .inactive {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("Opacity")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.secondaryText)

                        Spacer()

                        Text("\(Int(layer.opacity * 100))%")
                            .font(ModernTheme.Typography.caption1)
                            .foregroundColor(ModernTheme.Colors.primary)
                    }

                    Slider(
                        value: Binding(
                            get: { layer.opacity },
                            set: { newValue in
                                viewModel.updateLayerOpacity(layer, opacity: newValue)
                            }
                        ),
                        in: 0...1
                    )
                    .tint(ModernTheme.Colors.primary)
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(layer.visible ? ModernTheme.Colors.secondaryBackground : ModernTheme.Colors.tertiaryBackground)
        )
        .overlay(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .stroke(layer.visible ? ModernTheme.Colors.primary.opacity(0.3) : Color.clear, lineWidth: 1)
        )
    }

    // MARK: - Footer
    private var footer: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            Button(action: {
                enableAllLayers()
            }) {
                HStack {
                    Image(systemName: "eye.fill")
                    Text("Show All")
                }
                .font(ModernTheme.Typography.bodyBold)
                .foregroundColor(ModernTheme.Colors.primary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, ModernTheme.Spacing.md)
                .background(ModernTheme.Colors.secondaryBackground)
                .cornerRadius(ModernTheme.CornerRadius.md)
            }

            Button(action: {
                disableAllLayers()
            }) {
                HStack {
                    Image(systemName: "eye.slash.fill")
                    Text("Hide All")
                }
                .font(ModernTheme.Typography.bodyBold)
                .foregroundColor(ModernTheme.Colors.error)
                .frame(maxWidth: .infinity)
                .padding(.vertical, ModernTheme.Spacing.md)
                .background(ModernTheme.Colors.secondaryBackground)
                .cornerRadius(ModernTheme.CornerRadius.md)
            }
        }
        .padding()
    }

    // MARK: - Actions
    private func enableAllLayers() {
        for layer in viewModel.layers {
            if !layer.visible {
                viewModel.toggleLayer(layer)
            }
        }
        ModernTheme.Haptics.success()
    }

    private func disableAllLayers() {
        for layer in viewModel.layers {
            if layer.visible {
                viewModel.toggleLayer(layer)
            }
        }
        ModernTheme.Haptics.light()
    }

    // MARK: - Helper Methods
    private func colorFromString(_ colorString: String) -> Color {
        switch colorString.lowercased() {
        case "red": return .red
        case "blue": return .blue
        case "green": return .green
        case "orange": return .orange
        case "purple": return .purple
        case "yellow": return .yellow
        case "pink": return .pink
        default: return .gray
        }
    }
}

// MARK: - Corner Radius Extension
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

// MARK: - Preview
#Preview {
    ZStack {
        Color.black.opacity(0.3)
            .edgesIgnoringSafeArea(.all)

        VStack {
            Spacer()
            LayerControlView(
                viewModel: GISViewModel(),
                isPresented: .constant(true)
            )
        }
    }
}
