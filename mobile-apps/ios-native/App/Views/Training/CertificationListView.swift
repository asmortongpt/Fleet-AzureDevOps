//
//  CertificationListView.swift
//  Fleet Manager
//
//  Certification tracking with expiration alerts and renewal management
//

import SwiftUI

struct CertificationListView: View {
    @ObservedObject var viewModel: TrainingManagementViewModel
    @State private var selectedFilter: CertificationFilter = .all
    @State private var showExportSheet = false

    var body: some View {
        VStack(spacing: 0) {
            // Filter Selector
            Picker("Filter", selection: $selectedFilter) {
                ForEach(CertificationFilter.allCases, id: \.self) { filter in
                    Text(filter.displayName).tag(filter)
                }
            }
            .pickerStyle(SegmentedPickerStyle())
            .padding()

            // Alert Summary Banner
            if selectedFilter == .all || selectedFilter == .expiring {
                AlertSummaryBanner(viewModel: viewModel)
            }

            // Certification List
            if filteredCertifications.isEmpty {
                EmptyStateView(
                    icon: "doc.badge.ellipsis",
                    title: "No Certifications",
                    message: getCertificationEmptyMessage()
                )
            } else {
                List {
                    ForEach(groupedCertifications.keys.sorted(), id: \.self) { key in
                        Section(header: Text(key)) {
                            ForEach(groupedCertifications[key] ?? []) { certification in
                                CertificationDetailRow(
                                    certification: certification,
                                    viewModel: viewModel
                                )
                            }
                        }
                    }
                }
                .listStyle(InsetGroupedListStyle())
            }
        }
        .navigationTitle("Certifications")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button(action: { showExportSheet = true }) {
                        Label("Export Report", systemImage: "square.and.arrow.up")
                    }

                    Button(action: {
                        Task {
                            try? await viewModel.sendExpirationReminders()
                        }
                    }) {
                        Label("Send Reminders", systemImage: "bell.badge")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showExportSheet) {
            ExportSheet(viewModel: viewModel)
        }
    }

    private var filteredCertifications: [CourseCompletion] {
        switch selectedFilter {
        case .all:
            return viewModel.completions.filter { $0.status == .completed }
        case .active:
            return viewModel.completions.filter { $0.isValid }
        case .expiring:
            return viewModel.expiringCertifications
        case .expired:
            return viewModel.expiredCertifications
        }
    }

    private var groupedCertifications: [String: [CourseCompletion]] {
        Dictionary(grouping: filteredCertifications) { certification in
            if selectedFilter == .expiring || selectedFilter == .expired {
                return certification.driverName ?? "Unknown Driver"
            } else {
                // Group by category if we have course data
                return "All Certifications"
            }
        }
    }

    private func getCertificationEmptyMessage() -> String {
        switch selectedFilter {
        case .all:
            return "No certifications on record"
        case .active:
            return "No active certifications"
        case .expiring:
            return "No certifications expiring soon"
        case .expired:
            return "No expired certifications"
        }
    }
}

// MARK: - Certification Filter
enum CertificationFilter: String, CaseIterable {
    case all
    case active
    case expiring
    case expired

    var displayName: String {
        switch self {
        case .all: return "All"
        case .active: return "Active"
        case .expiring: return "Expiring"
        case .expired: return "Expired"
        }
    }
}

// MARK: - Alert Summary Banner
struct AlertSummaryBanner: View {
    @ObservedObject var viewModel: TrainingManagementViewModel

    var body: some View {
        if !viewModel.expiredCertifications.isEmpty || !viewModel.expiringCertifications.isEmpty {
            VStack(spacing: 8) {
                if !viewModel.expiredCertifications.isEmpty {
                    HStack {
                        Image(systemName: "xmark.shield.fill")
                            .foregroundColor(.red)
                        Text("\(viewModel.expiredCertifications.count) expired certifications require immediate attention")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        Spacer()
                    }
                    .padding()
                    .background(Color.red.opacity(0.1))
                    .cornerRadius(8)
                }

                if !viewModel.expiringCertifications.isEmpty {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.orange)
                        Text("\(viewModel.expiringCertifications.count) certifications expiring within 30 days")
                            .font(.subheadline)
                            .fontWeight(.medium)
                        Spacer()
                    }
                    .padding()
                    .background(Color.orange.opacity(0.1))
                    .cornerRadius(8)
                }
            }
            .padding()
        }
    }
}

// MARK: - Certification Detail Row
struct CertificationDetailRow: View {
    let certification: CourseCompletion
    @ObservedObject var viewModel: TrainingManagementViewModel
    @State private var showActionSheet = false

    var certificationStatus: CertificationStatus {
        viewModel.getCertificationStatus(completion: certification)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(certification.courseName ?? "Unknown Course")
                        .font(.headline)

                    if let driverName = certification.driverName {
                        HStack(spacing: 4) {
                            Image(systemName: "person.fill")
                                .font(.caption2)
                            Text(driverName)
                                .font(.caption)
                        }
                        .foregroundColor(.secondary)
                    }
                }

                Spacer()

                StatusIndicator(status: certificationStatus)
            }

            // Certification Details
            VStack(spacing: 8) {
                if let completionDate = certification.completionDate {
                    DetailItem(
                        icon: "checkmark.circle.fill",
                        title: "Completed",
                        value: formatDate(completionDate),
                        color: .green
                    )
                }

                if let expirationDate = certification.expirationDate {
                    DetailItem(
                        icon: certification.isExpired ? "xmark.circle.fill" : "calendar.badge.clock",
                        title: "Expires",
                        value: formatDate(expirationDate),
                        color: certification.isExpired ? .red : (certification.isExpiringSoon ? .orange : .blue)
                    )

                    if let daysUntilExpiration = certification.daysUntilExpiration,
                       daysUntilExpiration >= 0 {
                        DetailItem(
                            icon: "clock.fill",
                            title: "Days Remaining",
                            value: "\(daysUntilExpiration) days",
                            color: daysUntilExpiration <= 30 ? .red : .secondary
                        )
                    }
                }

                if let score = certification.score {
                    DetailItem(
                        icon: "chart.bar.fill",
                        title: "Score",
                        value: "\(certification.formattedScore) (\(certification.grade))",
                        color: .purple
                    )
                }

                if let certificateId = certification.certificateId {
                    DetailItem(
                        icon: "doc.badge.ellipsis",
                        title: "Certificate ID",
                        value: certificateId,
                        color: .indigo
                    )
                }
            }

            // Action Buttons
            HStack(spacing: 12) {
                if let certificateUrl = certification.certificateUrl {
                    Button(action: {
                        // Open certificate
                    }) {
                        HStack {
                            Image(systemName: "doc.text.fill")
                            Text("View Certificate")
                        }
                        .font(.caption)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.blue.opacity(0.1))
                        .foregroundColor(.blue)
                        .cornerRadius(8)
                    }
                }

                if certification.isExpired || certification.isExpiringSoon {
                    Button(action: {
                        // Renew certification
                    }) {
                        HStack {
                            Image(systemName: "arrow.clockwise.circle.fill")
                            Text("Renew")
                        }
                        .font(.caption)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color.orange.opacity(0.1))
                        .foregroundColor(.orange)
                        .cornerRadius(8)
                    }
                }

                Spacer()

                Button(action: {
                    showActionSheet = true
                }) {
                    Image(systemName: "ellipsis.circle.fill")
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(.vertical, 8)
        .actionSheet(isPresented: $showActionSheet) {
            ActionSheet(
                title: Text(certification.courseName ?? "Certification"),
                buttons: [
                    .default(Text("Send Reminder")) {
                        sendReminder()
                    },
                    .default(Text("Export Details")) {
                        exportDetails()
                    },
                    .cancel()
                ]
            )
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }

    private func sendReminder() {
        guard let daysUntilExpiration = certification.daysUntilExpiration else { return }
        Task {
            try? await viewModel.sendReminder(
                to: certification.driverId,
                courseName: certification.courseName ?? "Course",
                daysRemaining: daysUntilExpiration
            )
        }
    }

    private func exportDetails() {
        // Export certification details
    }
}

// MARK: - Status Indicator
struct StatusIndicator: View {
    let status: CertificationStatus

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: status.icon)
                .font(.caption)
            Text(status.displayName)
                .font(.caption)
                .fontWeight(.semibold)
        }
        .foregroundColor(.white)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(status.color)
        .cornerRadius(12)
    }
}

// MARK: - Detail Item
struct DetailItem: View {
    let icon: String
    let title: String
    let value: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 20)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.caption)
                .fontWeight(.medium)
        }
    }
}

// MARK: - Export Sheet
struct ExportSheet: View {
    @ObservedObject var viewModel: TrainingManagementViewModel
    @Environment(\.presentationMode) var presentationMode
    @State private var selectedDriverId = ""
    @State private var isExporting = false

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Export Options")) {
                    TextField("Driver ID (optional)", text: $selectedDriverId)
                        .autocapitalization(.none)
                }

                Section {
                    Button(action: exportData) {
                        if isExporting {
                            HStack {
                                Spacer()
                                ProgressView()
                                Spacer()
                            }
                        } else {
                            Text("Export to CSV")
                                .frame(maxWidth: .infinity)
                                .foregroundColor(.white)
                        }
                    }
                    .disabled(isExporting)
                    .listRowBackground(Color.blue)
                }
            }
            .navigationTitle("Export Certifications")
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

    private func exportData() {
        isExporting = true

        Task {
            let driverId = selectedDriverId.isEmpty ? nil : selectedDriverId
            if let data = await viewModel.exportTrainingHistory(driverId: driverId ?? "") {
                // Save or share the CSV data
                await MainActor.run {
                    isExporting = false
                    presentationMode.wrappedValue.dismiss()
                }
            }
        }
    }
}

// MARK: - Certification Statistics View
struct CertificationStatsView: View {
    @ObservedObject var viewModel: TrainingManagementViewModel

    var totalCertifications: Int {
        viewModel.completions.filter { $0.status == .completed }.count
    }

    var activeCertifications: Int {
        viewModel.completions.filter { $0.isValid }.count
    }

    var expiringCount: Int {
        viewModel.expiringCertifications.count
    }

    var expiredCount: Int {
        viewModel.expiredCertifications.count
    }

    var body: some View {
        VStack(spacing: 16) {
            Text("Certification Overview")
                .font(.headline)

            HStack(spacing: 20) {
                StatCard(
                    value: "\(totalCertifications)",
                    label: "Total",
                    color: .blue,
                    icon: "doc.badge.ellipsis"
                )

                StatCard(
                    value: "\(activeCertifications)",
                    label: "Active",
                    color: .green,
                    icon: "checkmark.shield.fill"
                )

                StatCard(
                    value: "\(expiringCount)",
                    label: "Expiring",
                    color: .orange,
                    icon: "exclamationmark.triangle.fill"
                )

                StatCard(
                    value: "\(expiredCount)",
                    label: "Expired",
                    color: .red,
                    icon: "xmark.shield.fill"
                )
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

struct StatCard: View {
    let value: String
    let label: String
    let color: Color
    let icon: String

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(value)
                .font(.title3)
                .fontWeight(.bold)

            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

#Preview {
    NavigationView {
        CertificationListView(viewModel: TrainingManagementViewModel())
    }
}
