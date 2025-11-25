import SwiftUI

struct AssetDetailView: View {
    let asset: Asset
    @ObservedObject var viewModel: AssetViewModel
    @State private var showingEditSheet = false
    @State private var showingDeleteAlert = false
    @State private var showingAssignSheet = false
    @State private var showingPhotoSheet = false
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header Section
                headerSection

                // Quick Actions
                quickActionsSection

                // Asset Information
                assetInformationSection

                // Location & Assignment
                locationAssignmentSection

                // Condition Section
                conditionSection

                // Inspection Section
                inspectionSection

                // Specifications Section
                specificationsSection

                // Maintenance History
                maintenanceSection

                // Delete Button
                deleteButton
            }
            .padding()
        }
        .navigationTitle(asset.number)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button("Edit") {
                    showingEditSheet = true
                }
            }
        }
        .sheet(isPresented: $showingEditSheet) {
            EditAssetView(asset: asset, viewModel: viewModel)
        }
        .alert("Delete Asset", isPresented: $showingDeleteAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                Task {
                    try? await viewModel.deleteAsset(id: asset.id)
                    presentationMode.wrappedValue.dismiss()
                }
            }
        } message: {
            Text("Are you sure you want to delete this asset? This action cannot be undone.")
        }
    }

    // MARK: - Header Section
    private var headerSection: some View {
        VStack(spacing: 12) {
            // Asset Icon
            ZStack {
                Circle()
                    .fill(Color(asset.statusColor).opacity(0.2))
                    .frame(width: 100, height: 100)

                Image(systemName: asset.type.icon)
                    .font(.system(size: 48))
                    .foregroundColor(Color(asset.statusColor))
            }

            Text(asset.name)
                .font(.title2)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)

            // Status Badge
            HStack(spacing: 4) {
                Image(systemName: asset.status.icon)
                Text(asset.status.displayName)
            }
            .font(.subheadline)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color(asset.statusColor).opacity(0.2))
            .foregroundColor(Color(asset.statusColor))
            .cornerRadius(20)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Quick Actions
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)

            HStack(spacing: 12) {
                QuickActionButton(
                    icon: "arrow.right.circle",
                    title: "Assign",
                    color: .blue
                ) {
                    showingAssignSheet = true
                }

                QuickActionButton(
                    icon: "camera",
                    title: "Photo",
                    color: .green
                ) {
                    showingPhotoSheet = true
                }

                QuickActionButton(
                    icon: "wrench",
                    title: "Service",
                    color: .orange
                ) {
                    // Schedule maintenance action
                }

                QuickActionButton(
                    icon: "doc.text",
                    title: "Docs",
                    color: .purple
                ) {
                    // View documents action
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Asset Information Section
    private var assetInformationSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Asset Information")
                .font(.headline)

            InfoRow(label: "Asset Number", value: asset.number)
            InfoRow(label: "Type", value: asset.type.displayName)

            if let serialNumber = asset.serialNumber {
                InfoRow(label: "Serial Number", value: serialNumber)
            }

            if let make = asset.make {
                InfoRow(label: "Make", value: make)
            }

            if let model = asset.model {
                InfoRow(label: "Model", value: model)
            }

            if let description = asset.description {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Description")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(description)
                        .font(.body)
                }
            }

            if let purchaseDate = asset.purchaseDate {
                InfoRow(label: "Purchase Date", value: formatDate(purchaseDate))
            }

            if let purchaseCost = asset.purchaseCost {
                InfoRow(label: "Purchase Cost", value: "$\(String(format: "%.2f", purchaseCost))")
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Location & Assignment Section
    private var locationAssignmentSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Location & Assignment")
                .font(.headline)

            InfoRow(
                label: "Location",
                value: asset.location.displayText,
                icon: "location.fill"
            )

            if let assignment = asset.assignedTo {
                InfoRow(
                    label: "Assigned To",
                    value: assignment.displayText,
                    icon: "person.fill"
                )
                InfoRow(
                    label: "Assignment Date",
                    value: formatDate(assignment.date)
                )
            } else {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                    Text("Not Assigned (Available)")
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Condition Section
    private var conditionSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Condition")
                .font(.headline)

            HStack {
                Image(systemName: asset.condition.icon)
                    .font(.title2)
                    .foregroundColor(Color(asset.conditionColor))

                VStack(alignment: .leading, spacing: 4) {
                    Text(asset.condition.displayName)
                        .font(.headline)
                    Text("Overall Condition")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Inspection Section
    private var inspectionSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Inspections")
                .font(.headline)

            if let lastInspection = asset.lastInspection {
                InfoRow(
                    label: "Last Inspection",
                    value: formatDate(lastInspection),
                    icon: "checkmark.circle.fill",
                    iconColor: .green
                )
            } else {
                InfoRow(
                    label: "Last Inspection",
                    value: "Never",
                    icon: "exclamationmark.circle.fill",
                    iconColor: .orange
                )
            }

            if let nextInspection = asset.nextInspection {
                let isDue = asset.isInspectionDue
                InfoRow(
                    label: "Next Inspection",
                    value: formatDate(nextInspection),
                    icon: isDue ? "exclamationmark.triangle.fill" : "calendar",
                    iconColor: isDue ? .red : .blue
                )
            } else {
                InfoRow(
                    label: "Next Inspection",
                    value: "Not Scheduled",
                    icon: "calendar",
                    iconColor: .gray
                )
            }

            if asset.isInspectionDue {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.orange)
                    Text("Inspection Overdue")
                        .font(.subheadline)
                        .foregroundColor(.orange)
                }
                .padding()
                .frame(maxWidth: .infinity)
                .background(Color.orange.opacity(0.1))
                .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Specifications Section
    private var specificationsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Specifications")
                .font(.headline)

            // Placeholder for specifications
            if asset.customFields?.isEmpty ?? true {
                Text("No specifications available")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else {
                ForEach(Array(asset.customFields?.keys ?? []), id: \.self) { key in
                    if let value = asset.customFields?[key] {
                        InfoRow(label: key, value: "\(value.value)")
                    }
                }
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Maintenance Section
    private var maintenanceSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Maintenance History")
                .font(.headline)

            // Placeholder for maintenance history
            Text("No maintenance records available")
                .font(.subheadline)
                .foregroundColor(.secondary)

            Button(action: {
                // Navigate to maintenance history
            }) {
                HStack {
                    Image(systemName: "wrench.and.screwdriver")
                    Text("Schedule Maintenance")
                    Spacer()
                    Image(systemName: "chevron.right")
                }
                .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Delete Button
    private var deleteButton: some View {
        Button(action: {
            showingDeleteAlert = true
        }) {
            HStack {
                Image(systemName: "trash")
                Text("Delete Asset")
            }
            .font(.headline)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.red)
            .cornerRadius(12)
        }
    }

    // MARK: - Helper Functions
    private func formatDate(_ dateString: String) -> String {
        let formatter = ISO8601DateFormatter()
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            displayFormatter.timeStyle = .none
            return displayFormatter.string(from: date)
        }
        return dateString
    }
}

// MARK: - Quick Action Button
struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)

                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(color.opacity(0.1))
            .cornerRadius(12)
        }
    }
}

// MARK: - Info Row
struct InfoRow: View {
    let label: String
    let value: String
    var icon: String? = nil
    var iconColor: Color = .blue

    var body: some View {
        HStack {
            if let icon = icon {
                Image(systemName: icon)
                    .foregroundColor(iconColor)
                    .frame(width: 24)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(value)
                    .font(.body)
            }

            Spacer()
        }
    }
}

// MARK: - Edit Asset View (Stub)
struct EditAssetView: View {
    let asset: Asset
    @ObservedObject var viewModel: AssetViewModel
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        NavigationView {
            Form {
                Text("Edit asset functionality coming soon")
            }
            .navigationTitle("Edit Asset")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    let sampleAsset = Asset(
        id: "1",
        tenantId: "tenant1",
        number: "T-1001",
        type: .trailer,
        name: "Utility Trailer 20ft",
        description: "Heavy duty utility trailer for equipment transport",
        serialNumber: "UT20-2024-001",
        make: "Big Tex",
        model: "14LX-20",
        status: .available,
        condition: .good,
        location: AssetLocation(lat: 28.5383, lng: -81.3792, address: "Orlando, FL", facility: "Main Yard"),
        assignedTo: nil,
        purchaseDate: "2024-01-15T00:00:00Z",
        purchaseCost: 8500.00,
        lastInspection: "2024-11-01T00:00:00Z",
        nextInspection: "2025-02-01T00:00:00Z",
        photos: [],
        documents: [],
        customFields: nil
    )

    return AssetDetailView(asset: sampleAsset, viewModel: AssetViewModel())
}
