//
//  DTCListView.swift
//  Fleet Manager
//
//  Diagnostic Trouble Codes list and detail view
//

import SwiftUI

struct DTCListView: View {
    let dtcs: [DiagnosticTroubleCode]
    let onClear: (DiagnosticTroubleCode) -> Void

    @State private var selectedDTC: DiagnosticTroubleCode?
    @State private var showingClearConfirmation = false
    @State private var dtcToClear: DiagnosticTroubleCode?

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                if dtcs.isEmpty {
                    noDTCsView
                } else {
                    // Summary
                    summarySection

                    // DTC List
                    ForEach(dtcs) { dtc in
                        DTCCard(dtc: dtc) {
                            selectedDTC = dtc
                        } onClear: {
                            dtcToClear = dtc
                            showingClearConfirmation = true
                        }
                    }
                }
            }
            .padding()
        }
        .sheet(item: $selectedDTC) { dtc in
            DTCDetailView(dtc: dtc)
        }
        .alert("Clear Diagnostic Code", isPresented: $showingClearConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Clear", role: .destructive) {
                if let dtc = dtcToClear {
                    onClear(dtc)
                }
            }
        } message: {
            Text("Are you sure you want to clear this diagnostic code? This action cannot be undone.")
        }
    }

    // MARK: - No DTCs View
    private var noDTCsView: some View {
        VStack(spacing: 20) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 80))
                .foregroundColor(.green)

            Text("No Active Codes")
                .font(.title2)
                .fontWeight(.bold)

            Text("Vehicle diagnostics are clear. No trouble codes detected.")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .frame(height: 300)
    }

    // MARK: - Summary Section
    private var summarySection: some View {
        HStack(spacing: 16) {
            SummaryCard(
                count: dtcs.filter { $0.severity == .critical }.count,
                label: "Critical",
                color: .red
            )

            SummaryCard(
                count: dtcs.filter { $0.severity == .warning }.count,
                label: "Warning",
                color: .orange
            )

            SummaryCard(
                count: dtcs.filter { $0.severity == .info }.count,
                label: "Info",
                color: .blue
            )
        }
    }
}

// MARK: - DTC Card
struct DTCCard: View {
    let dtc: DiagnosticTroubleCode
    let onTap: () -> Void
    let onClear: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: dtc.severity.icon)
                    .font(.title2)
                    .foregroundColor(dtc.severity.color)
                    .frame(width: 40)

                VStack(alignment: .leading, spacing: 4) {
                    Text(dtc.code)
                        .font(.headline)
                        .fontWeight(.bold)

                    HStack(spacing: 8) {
                        Label(dtc.codeType.rawValue, systemImage: "tag.fill")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Label(dtc.severity.rawValue.capitalized, systemImage: dtc.severity.icon)
                            .font(.caption)
                            .foregroundColor(dtc.severity.color)
                    }
                }

                Spacer()

                Button(action: onTap) {
                    Image(systemName: "chevron.right")
                        .foregroundColor(.secondary)
                }
            }

            Divider()

            // Description
            Text(dtc.description)
                .font(.body)
                .foregroundColor(.primary)
                .lineLimit(2)

            // Footer
            HStack {
                Label(
                    dtc.detectedAt.formatted(date: .abbreviated, time: .shortened),
                    systemImage: "clock.fill"
                )
                .font(.caption)
                .foregroundColor(.secondary)

                if let mileage = dtc.mileageWhenDetected {
                    Label("\(Int(mileage)) mi", systemImage: "gauge.high")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Button(action: onClear) {
                    Text("Clear")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(dtc.severity.color)
                        .cornerRadius(6)
                }
            }
        }
        .padding()
        .background(dtc.severity.color.opacity(0.1))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(dtc.severity.color.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - Summary Card
struct SummaryCard: View {
    let count: Int
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Text("\(count)")
                .font(.system(size: 32, weight: .bold, design: .rounded))
                .foregroundColor(color)

            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - DTC Detail View
struct DTCDetailView: View {
    let dtc: DiagnosticTroubleCode
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Code Header
                    codeHeaderSection

                    Divider()

                    // Description
                    descriptionSection

                    Divider()

                    // Details
                    detailsSection

                    Divider()

                    // Recommendations
                    recommendationsSection

                    Divider()

                    // Related Information
                    relatedInfoSection
                }
                .padding()
            }
            .navigationTitle("Diagnostic Code")
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

    // MARK: - Sections
    private var codeHeaderSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 8) {
                Text(dtc.code)
                    .font(.system(size: 36, weight: .bold, design: .rounded))

                HStack(spacing: 12) {
                    Label(dtc.codeType.rawValue, systemImage: "tag.fill")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Label(dtc.severity.rawValue.capitalized, systemImage: dtc.severity.icon)
                        .font(.subheadline)
                        .foregroundColor(dtc.severity.color)
                }
            }

            Spacer()

            Image(systemName: dtc.severity.icon)
                .font(.system(size: 50))
                .foregroundColor(dtc.severity.color)
        }
    }

    private var descriptionSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Description")
                .font(.headline)

            Text(dtc.description)
                .font(.body)
                .foregroundColor(.primary)
        }
    }

    private var detailsSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Details")
                .font(.headline)

            DetailRow(
                icon: "clock.fill",
                label: "Detected",
                value: dtc.detectedAt.formatted(date: .long, time: .shortened)
            )

            if let mileage = dtc.mileageWhenDetected {
                DetailRow(
                    icon: "gauge.high",
                    label: "Mileage",
                    value: "\(Int(mileage)) miles"
                )
            }

            DetailRow(
                icon: "calendar",
                label: "Age",
                value: timeAgo(from: dtc.detectedAt)
            )

            if let clearedAt = dtc.clearedAt {
                DetailRow(
                    icon: "checkmark.circle.fill",
                    label: "Cleared",
                    value: clearedAt.formatted(date: .long, time: .shortened),
                    valueColor: .green
                )
            } else {
                DetailRow(
                    icon: "exclamationmark.circle.fill",
                    label: "Status",
                    value: "Active",
                    valueColor: .red
                )
            }
        }
    }

    private var recommendationsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recommendations")
                .font(.headline)

            VStack(alignment: .leading, spacing: 8) {
                RecommendationRow(
                    icon: "wrench.and.screwdriver.fill",
                    text: getRecommendations(for: dtc)
                )
            }
            .padding()
            .background(Color.blue.opacity(0.1))
            .cornerRadius(12)
        }
    }

    private var relatedInfoSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Related Information")
                .font(.headline)

            VStack(spacing: 8) {
                InfoButton(
                    title: "OBD-II Code Library",
                    icon: "book.fill",
                    action: {}
                )

                InfoButton(
                    title: "Common Causes",
                    icon: "lightbulb.fill",
                    action: {}
                )

                InfoButton(
                    title: "Repair Procedures",
                    icon: "wrench.and.screwdriver.fill",
                    action: {}
                )
            }
        }
    }

    // MARK: - Helper Methods
    private func timeAgo(from date: Date) -> String {
        let interval = Date().timeIntervalSince(date)
        let days = Int(interval / 86400)
        let hours = Int((interval.truncatingRemainder(dividingBy: 86400)) / 3600)

        if days > 0 {
            return "\(days) day\(days == 1 ? "" : "s") ago"
        } else if hours > 0 {
            return "\(hours) hour\(hours == 1 ? "" : "s") ago"
        } else {
            return "Less than an hour ago"
        }
    }

    private func getRecommendations(for dtc: DiagnosticTroubleCode) -> String {
        switch dtc.severity {
        case .critical:
            return "This is a critical issue. Stop driving immediately and seek professional assistance. Continuing to drive may cause severe damage to the vehicle."
        case .warning:
            return "This issue should be addressed soon. Schedule a maintenance appointment within the next few days to prevent potential damage."
        case .info:
            return "This is an informational code. Monitor the vehicle's performance and address during the next scheduled maintenance."
        }
    }
}

// MARK: - Supporting Views
struct DetailRow: View {
    let icon: String
    let label: String
    let value: String
    var valueColor: Color = .primary

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 30)

            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(valueColor)
        }
    }
}

struct RecommendationRow: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.body)
                .foregroundColor(.blue)
                .frame(width: 24)

            Text(text)
                .font(.body)
                .foregroundColor(.primary)
        }
    }
}

struct InfoButton: View {
    let title: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.blue)
                    .frame(width: 30)

                Text(title)
                    .font(.body)

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding()
            .background(Color.secondary.opacity(0.1))
            .cornerRadius(8)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Preview
#Preview {
    DTCListView(
        dtcs: [
            DiagnosticTroubleCode(
                code: "P0420",
                description: "Catalyst System Efficiency Below Threshold (Bank 1)",
                severity: .warning,
                vehicleId: "test-1",
                mileageWhenDetected: 45230
            ),
            DiagnosticTroubleCode(
                code: "P0171",
                description: "System Too Lean (Bank 1)",
                severity: .critical,
                detectedAt: Date().addingTimeInterval(-86400),
                vehicleId: "test-1",
                mileageWhenDetected: 45180
            ),
            DiagnosticTroubleCode(
                code: "P0128",
                description: "Coolant Thermostat (Coolant Temperature Below Thermostat Regulating Temperature)",
                severity: .info,
                detectedAt: Date().addingTimeInterval(-3600),
                vehicleId: "test-1",
                mileageWhenDetected: 45250
            )
        ],
        onClear: { _ in }
    )
}
