//
//  HardwareQuickActionsView.swift
//  Fleet Management
//
//  Quick action buttons for hardware features
//  Can be embedded in VehiclesView, MaintenanceView, etc.
//

import SwiftUI

struct HardwareQuickActionsView: View {

    let vehicleId: String?
    @Binding var navigationPath: [NavigationDestination]

    var body: some View {
        VStack(spacing: 16) {
            Text("Quick Actions")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                QuickActionCard(
                    icon: "location.fill",
                    title: "Start Trip",
                    subtitle: "GPS Tracking",
                    color: .green,
                    action: {
                        navigationPath.append(.tripTracking(vehicleId: vehicleId))
                    }
                )

                QuickActionCard(
                    icon: "car.fill",
                    title: "OBD2",
                    subtitle: "Diagnostics",
                    color: .blue,
                    action: {
                        navigationPath.append(.obd2Diagnostics)
                    }
                )

                QuickActionCard(
                    icon: "speedometer",
                    title: "Odometer",
                    subtitle: "Photo + OCR",
                    color: .orange,
                    action: {
                        if let vehicleId = vehicleId {
                            navigationPath.append(.maintenancePhoto(vehicleId: vehicleId, type: "odometer"))
                        }
                    }
                )

                QuickActionCard(
                    icon: "fuelpump.fill",
                    title: "Fuel Level",
                    subtitle: "Photo + OCR",
                    color: .purple,
                    action: {
                        if let vehicleId = vehicleId {
                            navigationPath.append(.maintenancePhoto(vehicleId: vehicleId, type: "fuel"))
                        }
                    }
                )

                QuickActionCard(
                    icon: "exclamationmark.triangle.fill",
                    title: "Damage",
                    subtitle: "Document",
                    color: .red,
                    action: {
                        if let vehicleId = vehicleId {
                            navigationPath.append(.maintenancePhoto(vehicleId: vehicleId, type: "damage"))
                        }
                    }
                )

                QuickActionCard(
                    icon: "camera.fill",
                    title: "Photos",
                    subtitle: "General",
                    color: .teal,
                    action: {
                        if let vehicleId = vehicleId {
                            navigationPath.append(.photoCapture(vehicleId: vehicleId, photoType: "general"))
                        }
                    }
                )
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(radius: 2)
    }
}

// MARK: - Quick Action Card

struct QuickActionCard: View {
    let icon: String
    let title: String
    let subtitle: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title)
                    .foregroundColor(color)
                    .frame(height: 40)

                VStack(spacing: 2) {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)

                    Text(subtitle)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(color.opacity(0.1))
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(color.opacity(0.3), lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Floating Quick Actions Button

struct FloatingQuickActionsButton: View {

    @Binding var showingQuickActions: Bool

    var body: some View {
        Button(action: { showingQuickActions.toggle() }) {
            HStack(spacing: 8) {
                Image(systemName: "bolt.fill")
                Text("Quick Actions")
                    .font(.subheadline)
                    .fontWeight(.semibold)
            }
            .foregroundColor(.white)
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background(
                LinearGradient(
                    colors: [.blue, .purple],
                    startPoint: .leading,
                    endPoint: .trailing
                )
            )
            .cornerRadius(25)
            .shadow(radius: 5)
        }
    }
}

// MARK: - Feature Showcase Banner

struct FeatureShowcaseBanner: View {

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(.yellow)

                Text("New Hardware Features")
                    .font(.headline)

                Spacer()
            }

            Text("GPS trip tracking, OBD2 diagnostics, photo capture with OCR, and real-time weather integration are now available!")
                .font(.subheadline)
                .foregroundColor(.secondary)

            HStack(spacing: 12) {
                FeaturePill(icon: "location.fill", text: "GPS")
                FeaturePill(icon: "car.fill", text: "OBD2")
                FeaturePill(icon: "camera.fill", text: "OCR")
                FeaturePill(icon: "cloud.sun.fill", text: "Weather")
            }
        }
        .padding()
        .background(
            LinearGradient(
                colors: [.blue.opacity(0.1), .purple.opacity(0.1)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(
                    LinearGradient(
                        colors: [.blue.opacity(0.3), .purple.opacity(0.3)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1
                )
        )
    }
}

struct FeaturePill: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption2)

            Text(text)
                .font(.caption2)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }
}

// MARK: - Preview

struct HardwareQuickActionsView_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            FeatureShowcaseBanner()

            HardwareQuickActionsView(
                vehicleId: "vehicle-123",
                navigationPath: .constant([])
            )

            FloatingQuickActionsButton(showingQuickActions: .constant(false))
        }
        .padding()
        .background(Color(.systemGroupedBackground))
    }
}
