//
//  AssignmentApprovalView.swift
//  Fleet Manager - iOS Native App
//
//  Manager approval queue for vehicle assignment requests
//

import SwiftUI

struct AssignmentApprovalView: View {
    let request: AssignmentRequest
    @ObservedObject var viewModel: VehicleAssignmentViewModel
    @Environment(\.dismiss) var dismiss

    @State private var selectedVehicle = ""
    @State private var reviewNotes = ""
    @State private var showApproveConfirmation = false
    @State private var showDenyConfirmation = false
    @State private var isProcessing = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Request Info Card
                RequestInfoCard(request: request)

                // Vehicle Selection (for approval)
                VStack(alignment: .leading, spacing: 12) {
                    Text("Assign Vehicle")
                        .font(.headline)

                    if let vehicleId = request.vehicleId {
                        HStack {
                            Image(systemName: "car.fill")
                                .foregroundColor(.blue)
                            Text("Requested: \(vehicleId)")
                                .font(.subheadline)
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color(.systemGray6))
                        )
                    } else {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Requested Type: \(request.vehicleType ?? "Any")")
                                .font(.subheadline)
                                .foregroundColor(.secondary)

                            TextField("Assign Vehicle ID", text: $selectedVehicle)
                                .textFieldStyle(RoundedBorderTextFieldStyle())
                                .textInputAutocapitalization(.characters)
                        }
                    }

                    // Availability Check
                    if !selectedVehicle.isEmpty || request.vehicleId != nil {
                        let vehicleToCheck = request.vehicleId ?? selectedVehicle
                        let isAvailable = viewModel.checkAvailability(
                            vehicleId: vehicleToCheck,
                            startDate: request.startDate,
                            endDate: request.endDate
                        )

                        HStack {
                            Image(systemName: isAvailable ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                                .foregroundColor(isAvailable ? .green : .red)
                            Text(isAvailable ? "Vehicle is available" : "Vehicle has conflicting assignments")
                                .font(.subheadline)
                        }
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(isAvailable ? Color.green.opacity(0.1) : Color.red.opacity(0.1))
                        )
                    }
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(.systemBackground))
                        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
                )

                // Review Notes
                VStack(alignment: .leading, spacing: 12) {
                    Text("Review Notes")
                        .font(.headline)

                    TextField("Add notes (optional)", text: $reviewNotes, axis: .vertical)
                        .lineLimit(3...5)
                        .textInputAutocapitalization(.sentences)
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 8)
                                .fill(Color(.systemGray6))
                        )
                }
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(.systemBackground))
                        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
                )

                // Action Buttons
                VStack(spacing: 12) {
                    Button(action: { showApproveConfirmation = true }) {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                            Text("Approve Request")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.green)
                        )
                    }
                    .disabled(request.vehicleId == nil && selectedVehicle.isEmpty)

                    Button(action: { showDenyConfirmation = true }) {
                        HStack {
                            Image(systemName: "xmark.circle.fill")
                            Text("Deny Request")
                        }
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.red)
                        )
                    }
                }
                .padding()
            }
            .padding()
        }
        .navigationTitle("Review Request")
        .navigationBarTitleDisplayMode(.inline)
        .overlay {
            if isProcessing {
                LoadingOverlay()
            }
        }
        .alert("Approve Request", isPresented: $showApproveConfirmation) {
            Button("Approve", role: .destructive) {
                approveRequest()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Are you sure you want to approve this vehicle assignment request?")
        }
        .alert("Deny Request", isPresented: $showDenyConfirmation) {
            Button("Deny", role: .destructive) {
                denyRequest()
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("Are you sure you want to deny this request? This action cannot be undone.")
        }
    }

    private func approveRequest() {
        isProcessing = true

        let assignmentId = UUID().uuidString // This would come from creating the actual assignment

        Task {
            let success = await viewModel.approveRequest(request, assignmentId: assignmentId)
            isProcessing = false

            if success {
                dismiss()
            }
        }
    }

    private func denyRequest() {
        isProcessing = true

        Task {
            let reason = reviewNotes.isEmpty ? "Request denied" : reviewNotes
            let success = await viewModel.denyRequest(request, reason: reason)
            isProcessing = false

            if success {
                dismiss()
            }
        }
    }
}

// MARK: - Request Info Card
struct RequestInfoCard: View {
    let request: AssignmentRequest

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Request from")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(request.requestedBy)
                        .font(.title3)
                        .fontWeight(.semibold)
                }

                Spacer()

                StatusBadge(status: request.status)
            }

            Divider()

            // Details Grid
            VStack(spacing: 12) {
                InfoRow(
                    icon: request.assignmentType.icon,
                    label: "Type",
                    value: request.assignmentType.displayName,
                    color: request.assignmentType.color
                )

                InfoRow(
                    icon: "text.alignleft",
                    label: "Purpose",
                    value: request.purpose,
                    color: .blue
                )

                if let vehicleId = request.vehicleId {
                    InfoRow(
                        icon: "car.fill",
                        label: "Vehicle",
                        value: vehicleId,
                        color: .purple
                    )
                } else if let vehicleType = request.vehicleType {
                    InfoRow(
                        icon: "car.fill",
                        label: "Vehicle Type",
                        value: vehicleType,
                        color: .purple
                    )
                }

                InfoRow(
                    icon: "calendar",
                    label: "Start Date",
                    value: formatDate(request.startDate),
                    color: .green
                )

                if let endDate = request.endDate {
                    InfoRow(
                        icon: "calendar",
                        label: "End Date",
                        value: formatDate(endDate),
                        color: .orange
                    )

                    let days = Calendar.current.dateComponents([.day], from: request.startDate, to: endDate).day ?? 0
                    InfoRow(
                        icon: "clock.fill",
                        label: "Duration",
                        value: "\(days) days",
                        color: .teal
                    )
                }

                InfoRow(
                    icon: "clock.arrow.circlepath",
                    label: "Requested",
                    value: formatRelativeDate(request.requestedAt),
                    color: .gray
                )
            }

            // Notes
            if let notes = request.notes {
                Divider()

                VStack(alignment: .leading, spacing: 4) {
                    Text("Notes")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(notes)
                        .font(.subheadline)
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.systemBackground))
                .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
        )
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }

    private func formatRelativeDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Info Row
struct InfoRow: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16))
                .foregroundColor(color)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(value)
                    .font(.subheadline)
            }

            Spacer()
        }
    }
}

// MARK: - Preview
#Preview {
    NavigationView {
        AssignmentApprovalView(
            request: .sample,
            viewModel: VehicleAssignmentViewModel()
        )
    }
}
