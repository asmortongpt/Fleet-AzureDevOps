//
//  ChecklistNotificationView.swift
//  Fleet Manager
//
//  Full-screen notification when a checklist is triggered
//

import SwiftUI

struct ChecklistNotificationView: View {
    let checklist: ChecklistInstance
    let onStart: () -> Void
    let onSkip: (() -> Void)?

    @State private var showSkipReason = false
    @State private var skipReason = ""
    @Environment(\.presentationMode) var presentationMode

    private var template: ChecklistTemplate? {
        ChecklistService.shared.templates.first { $0.id == checklist.templateId }
    }

    var body: some View {
        ZStack {
            // Blurred background
            Color.black.opacity(0.7)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Alert card
                alertCard

                Spacer()
            }
        }
        .alert("Skip Checklist", isPresented: $showSkipReason) {
            TextField("Reason for skipping", text: $skipReason)
            Button("Cancel", role: .cancel) {
                skipReason = ""
            }
            Button("Skip", role: .destructive) {
                handleSkip()
            }
        } message: {
            Text("Please provide a reason for skipping this checklist")
        }
    }

    private var alertCard: some View {
        VStack(spacing: 24) {
            // Icon
            categoryIcon

            // Title
            VStack(spacing: 8) {
                Text("Checklist Required")
                    .font(.title2)
                    .fontWeight(.bold)

                Text(checklist.templateName)
                    .font(.headline)
                    .multilineTextAlignment(.center)
            }

            // Description
            if let description = template?.description {
                Text(description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
            }

            // Details
            detailsSection

            // Timeout warning
            if let expiresAt = checklist.expiresAt {
                timeoutWarning(expiresAt: expiresAt)
            }

            // Actions
            actionButtons
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.3), radius: 20, y: 10)
        )
        .padding(.horizontal, 32)
    }

    private var categoryIcon: some View {
        ZStack {
            Circle()
                .fill(categoryColor.opacity(0.2))
                .frame(width: 80, height: 80)

            Image(systemName: checklist.category.icon)
                .font(.system(size: 36))
                .foregroundColor(categoryColor)
        }
    }

    private var detailsSection: some View {
        VStack(spacing: 12) {
            detailRow(icon: "mappin.circle", text: checklist.locationName ?? "Current Location")
            detailRow(icon: "list.bullet", text: "\(checklist.items.count) items to complete")

            if checklist.isRequired {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.caption)
                    Text("Required - Cannot be skipped")
                        .font(.caption)
                        .fontWeight(.medium)
                }
                .foregroundColor(.orange)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private func detailRow(icon: String, text: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(.secondary)
                .frame(width: 20)

            Text(text)
                .font(.subheadline)

            Spacer()
        }
    }

    private func timeoutWarning(expiresAt: Date) -> some View {
        let timeRemaining = expiresAt.timeIntervalSinceNow
        let minutes = Int(timeRemaining / 60)

        return HStack(spacing: 8) {
            Image(systemName: "clock.fill")
            Text("Must complete within \(minutes) minutes")
                .font(.caption)
                .fontWeight(.medium)
        }
        .foregroundColor(.orange)
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(Color.orange.opacity(0.1))
        .cornerRadius(8)
    }

    private var actionButtons: some View {
        VStack(spacing: 12) {
            // Start button
            Button(action: {
                onStart()
            }) {
                HStack {
                    Image(systemName: "play.fill")
                    Text("Start Checklist")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(categoryColor)
                .foregroundColor(.white)
                .cornerRadius(12)
            }

            // Skip button (if allowed)
            if let onSkip = onSkip, template?.allowSkip == true {
                Button(action: {
                    showSkipReason = true
                }) {
                    Text("Skip for Now")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
            }
        }
    }

    private var categoryColor: Color {
        switch checklist.category {
        case .osha: return .red
        case .preTripInspection: return .blue
        case .postTripInspection: return .green
        case .siteArrival: return .purple
        case .siteDeparture: return .orange
        case .taskCompletion: return .teal
        case .resourceCheck: return .cyan
        case .mileageReport: return .indigo
        case .fuelReport: return .yellow
        case .deliveryConfirmation: return .mint
        case .pickupConfirmation: return .pink
        case .incidentReport: return .red
        case .maintenance: return .orange
        case .custom: return .gray
        }
    }

    private func handleSkip() {
        guard !skipReason.isEmpty else { return }
        onSkip?()
        presentationMode.wrappedValue.dismiss()
    }
}

// MARK: - Preview

#Preview {
    ChecklistNotificationView(
        checklist: ChecklistInstance(
            id: "1",
            templateId: "osha-site-safety",
            templateName: "OSHA Site Safety Checklist",
            category: .osha,
            status: .pending,
            triggeredBy: .geofenceEntry,
            triggeredAt: Date(),
            startedAt: nil,
            completedAt: nil,
            expiresAt: Date().addingTimeInterval(900),
            driverId: "driver1",
            driverName: "John Doe",
            vehicleId: nil,
            vehicleNumber: nil,
            locationCoordinate: nil,
            locationName: "Construction Site Alpha",
            tripId: nil,
            taskId: nil,
            items: [],
            attachments: [],
            signature: nil,
            notes: nil,
            submittedAt: nil,
            approvedBy: nil,
            approvedAt: nil
        ),
        onStart: {
            print("Start checklist")
        },
        onSkip: {
            print("Skip checklist")
        }
    )
}
