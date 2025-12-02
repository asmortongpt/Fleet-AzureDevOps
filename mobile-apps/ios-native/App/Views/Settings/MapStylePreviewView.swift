//
//  MapStylePreviewView.swift
//  Fleet Manager - Map Style Preview
//
//  Live preview interface for different map styles
//  with side-by-side comparison
//

import SwiftUI
import MapKit

// MARK: - Map Style Preview View

struct MapStylePreviewView: View {
    let provider: MapProvider
    let styles: [MapStyle]
    let selectedStyle: MapStyle
    let onSelectStyle: (MapStyle) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var previewStyle: MapStyle
    @State private var showingComparison = false
    @State private var comparisonStyle: MapStyle?

    init(provider: MapProvider, styles: [MapStyle], selectedStyle: MapStyle, onSelectStyle: @escaping (MapStyle) -> Void) {
        self.provider = provider
        self.styles = styles
        self.selectedStyle = selectedStyle
        self.onSelectStyle = onSelectStyle
        _previewStyle = State(initialValue: selectedStyle)
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Style Selector
                styleSelectorBar

                // Map Preview
                if showingComparison, let comparison = comparisonStyle {
                    // Side-by-side comparison
                    HStack(spacing: 0) {
                        stylePreviewMap(style: previewStyle)
                            .overlay(alignment: .topLeading) {
                                StyleLabel(style: previewStyle)
                                    .padding(8)
                            }

                        Divider()

                        stylePreviewMap(style: comparison)
                            .overlay(alignment: .topLeading) {
                                StyleLabel(style: comparison)
                                    .padding(8)
                            }
                    }
                } else {
                    // Single preview
                    stylePreviewMap(style: previewStyle)
                }

                // Style Details
                styleDetailsSection
            }
            .navigationTitle("Map Styles")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Apply") {
                        onSelectStyle(previewStyle)
                        dismiss()
                    }
                    .fontWeight(.semibold)
                    .disabled(previewStyle == selectedStyle)
                }
            }
        }
    }

    // MARK: - Style Selector Bar

    private var styleSelectorBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(styles) { style in
                    StyleSelectorButton(
                        style: style,
                        isSelected: style == previewStyle,
                        isComparison: style == comparisonStyle
                    ) {
                        if showingComparison && comparisonStyle == nil {
                            comparisonStyle = style
                        } else {
                            previewStyle = style
                            comparisonStyle = nil
                            showingComparison = false
                        }
                    }
                }
            }
            .padding(.horizontal)
            .padding(.vertical, 12)
        }
        .background(Color(.systemBackground))
        .shadow(color: Color.black.opacity(0.1), radius: 2, y: 2)
    }

    // MARK: - Style Preview Map

    @ViewBuilder
    private func stylePreviewMap(style: MapStyle) -> some View {
        StyleMapPreview(style: style, provider: provider)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Style Details Section

    private var styleDetailsSection: some View {
        VStack(spacing: 0) {
            Divider()

            HStack {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Image(systemName: previewStyle.icon)
                            .foregroundColor(.blue)
                        Text(previewStyle.displayName)
                            .font(.headline)
                    }

                    Text(previewStyle.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Compare Button
                Button {
                    if showingComparison {
                        showingComparison = false
                        comparisonStyle = nil
                    } else {
                        showingComparison = true
                        // Select first different style
                        comparisonStyle = styles.first { $0 != previewStyle }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: showingComparison ? "square.split.1x2.fill" : "square.split.1x2")
                        Text(showingComparison ? "Single" : "Compare")
                            .font(.subheadline)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color.blue.opacity(0.1))
                    .foregroundColor(.blue)
                    .cornerRadius(8)
                }
            }
            .padding()
            .background(Color(.secondarySystemBackground))
        }
    }
}

// MARK: - Style Selector Button

struct StyleSelectorButton: View {
    let style: MapStyle
    let isSelected: Bool
    let isComparison: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(isSelected ? Color.blue.opacity(0.2) : Color.gray.opacity(0.1))
                        .frame(width: 60, height: 60)

                    Image(systemName: style.icon)
                        .font(.title2)
                        .foregroundColor(isSelected ? .blue : .secondary)
                }
                .overlay(
                    RoundedRectangle(cornerRadius: 8)
                        .strokeBorder(isSelected ? Color.blue : Color.clear, lineWidth: 2)
                )

                Text(style.displayName)
                    .font(.caption)
                    .foregroundColor(isSelected ? .blue : .primary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .frame(width: 70)
            .overlay(alignment: .topTrailing) {
                if isComparison {
                    Circle()
                        .fill(Color.orange)
                        .frame(width: 8, height: 8)
                        .offset(x: 4, y: -4)
                }
            }
        }
    }
}

// MARK: - Style Label

struct StyleLabel: View {
    let style: MapStyle

    var body: some View {
        Text(style.displayName)
            .font(.caption)
            .fontWeight(.semibold)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(.ultraThinMaterial)
            .cornerRadius(6)
    }
}

// MARK: - Style Map Preview

struct StyleMapPreview: View {
    let style: MapStyle
    let provider: MapProvider

    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194), // San Francisco
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )

    var body: some View {
        Map(coordinateRegion: .constant(region), mapType: mapType)
            .disabled(true) // Prevent user interaction during preview
    }

    private var mapType: MKMapType {
        switch style {
        case .standard, .light, .navigation:
            return .standard
        case .satellite:
            return .satellite
        case .hybrid:
            return .hybrid
        case .terrain, .outdoors:
            return .mutedStandard
        case .dark, .custom:
            return .standard
        }
    }
}

// MARK: - Alternative Preview with Static Images

struct StyleStaticPreview: View {
    let style: MapStyle
    let provider: MapProvider

    var body: some View {
        ZStack {
            // Placeholder gradient based on style
            LinearGradient(
                gradient: Gradient(colors: gradientColors),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            VStack {
                Spacer()

                VStack(spacing: 4) {
                    Image(systemName: style.icon)
                        .font(.system(size: 40))
                        .foregroundColor(.white.opacity(0.8))

                    Text(style.displayName)
                        .font(.headline)
                        .foregroundColor(.white)
                }
                .padding()
                .background(.ultraThinMaterial)
                .cornerRadius(12)

                Spacer()
            }
        }
    }

    private var gradientColors: [Color] {
        switch style {
        case .standard:
            return [.blue.opacity(0.3), .green.opacity(0.3)]
        case .satellite:
            return [.blue.opacity(0.8), .green.opacity(0.6)]
        case .hybrid:
            return [.blue.opacity(0.6), .green.opacity(0.5)]
        case .terrain:
            return [.brown.opacity(0.4), .green.opacity(0.4)]
        case .dark:
            return [.gray.opacity(0.8), .black]
        case .light:
            return [.white, .gray.opacity(0.2)]
        case .outdoors:
            return [.green.opacity(0.5), .blue.opacity(0.3)]
        case .navigation:
            return [.blue.opacity(0.5), .purple.opacity(0.3)]
        case .custom:
            return [.purple.opacity(0.4), .pink.opacity(0.4)]
        }
    }
}

// MARK: - Preview

#if DEBUG
struct MapStylePreviewView_Previews: PreviewProvider {
    static var previews: some View {
        MapStylePreviewView(
            provider: .apple,
            styles: [.standard, .satellite, .hybrid, .terrain],
            selectedStyle: .standard
        ) { style in
            print("Selected style: \(style)")
        }

        MapStylePreviewView(
            provider: .google,
            styles: MapStyle.allCases,
            selectedStyle: .dark
        ) { style in
            print("Selected style: \(style)")
        }
    }
}
#endif
