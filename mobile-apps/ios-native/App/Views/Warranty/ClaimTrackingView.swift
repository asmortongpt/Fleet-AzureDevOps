//
//  ClaimTrackingView.swift
//  Fleet Manager - iOS Native App
//
//  View for tracking warranty claim status and progress
//

import SwiftUI

struct ClaimTrackingView: View {
    let claim: WarrantyClaim
    @StateObject private var viewModel = WarrantyManagementViewModel()
    @State private var showingNotes = false
    @State private var additionalNotes = ""

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Status Header
                statusHeader

                // Timeline
                claimTimeline

                // Claim Details
                claimDetailsSection

                // Financial Information
                financialSection

                // Repair Shop Information
                if let shop = claim.repairShop {
                    repairShopSection(shop)
                }

                // Documents
                documentsSection

                // Actions
                actionsSection

                // Notes
                notesSection
            }
            .padding()
        }
        .navigationTitle("Claim Details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button {
                        // Share claim
                    } label: {
                        Label("Share", systemImage: "square.and.arrow.up")
                    }

                    Button {
                        // Download PDF
                    } label: {
                        Label("Download PDF", systemImage: "arrow.down.doc")
                    }

                    if !claim.isResolved {
                        Button(role: .destructive) {
                            // Cancel claim
                        } label: {
                            Label("Cancel Claim", systemImage: "xmark.circle")
                        }
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .task {
            await viewModel.refresh()
        }
    }

    // MARK: - Status Header
    private var statusHeader: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(claim.statusColor.opacity(0.2))
                    .frame(width: 80, height: 80)

                Image(systemName: claim.status.icon)
                    .font(.system(size: 40))
                    .foregroundColor(claim.statusColor)
            }

            VStack(spacing: 4) {
                Text(claim.status.displayName)
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Claim #\(claim.id.prefix(8))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            if !claim.isResolved {
                Text("Processing for \(claim.processingDays) days")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            } else if let resolvedDate = claim.resolvedAt {
                Text("Resolved on \(formatDate(resolvedDate))")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Claim Timeline
    private var claimTimeline: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Claim Timeline")
                    .font(.headline)
                Spacer()
            }

            VStack(spacing: 0) {
                TimelineEvent(
                    title: "Claim Submitted",
                    date: claim.submittedAt,
                    isCompleted: true,
                    isCurrent: false,
                    isLast: false
                )

                if claim.status == .underReview || claim.status.rawValue > ClaimStatus.submitted.rawValue {
                    TimelineEvent(
                        title: "Under Review",
                        date: claim.updatedAt,
                        isCompleted: claim.status.rawValue > ClaimStatus.underReview.rawValue,
                        isCurrent: claim.status == .underReview,
                        isLast: false
                    )
                }

                if claim.status == .approved || claim.status == .paid {
                    TimelineEvent(
                        title: "Approved",
                        date: claim.resolvedAt ?? claim.updatedAt,
                        isCompleted: true,
                        isCurrent: claim.status == .approved,
                        isLast: claim.status == .approved
                    )
                }

                if claim.status == .paid {
                    TimelineEvent(
                        title: "Payment Processed",
                        date: claim.resolvedAt ?? claim.updatedAt,
                        isCompleted: true,
                        isCurrent: true,
                        isLast: true
                    )
                }

                if claim.status == .denied {
                    TimelineEvent(
                        title: "Denied",
                        date: claim.resolvedAt ?? claim.updatedAt,
                        isCompleted: true,
                        isCurrent: true,
                        isLast: true,
                        isDenied: true
                    )
                }

                if claim.status == .pendingDocuments {
                    TimelineEvent(
                        title: "Pending Documents",
                        date: claim.updatedAt,
                        isCompleted: false,
                        isCurrent: true,
                        isLast: true,
                        isWarning: true
                    )
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
    }

    // MARK: - Claim Details Section
    private var claimDetailsSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Claim Details")
                    .font(.headline)
                Spacer()
            }

            VStack(spacing: 12) {
                InfoRow(label: "Component", value: claim.component)
                InfoRow(label: "Failure Date", value: formatDate(claim.failureDate))

                if let mileage = claim.mileageAtFailure {
                    InfoRow(label: "Mileage", value: "\(formatNumber(mileage)) miles")
                }

                Divider()

                VStack(alignment: .leading, spacing: 8) {
                    Text("Issue Description")
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    Text(claim.issueDescription)
                        .font(.body)
                }

                if let denialReason = claim.denialReason {
                    Divider()

                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.red)
                            Text("Denial Reason")
                                .font(.subheadline)
                                .foregroundColor(.red)
                        }

                        Text(denialReason)
                            .font(.body)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
    }

    // MARK: - Financial Section
    private var financialSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Financial Information")
                    .font(.headline)
                Spacer()
            }

            VStack(spacing: 12) {
                if let claimAmount = claim.claimAmount {
                    HStack {
                        Text("Claim Amount")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(formatCurrency(claimAmount))
                            .fontWeight(.semibold)
                    }
                }

                if let approvedAmount = claim.approvedAmount {
                    HStack {
                        Text("Approved Amount")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(formatCurrency(approvedAmount))
                            .fontWeight(.semibold)
                            .foregroundColor(.green)
                    }
                }

                if let deductible = claim.deductiblePaid {
                    HStack {
                        Text("Deductible Paid")
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(formatCurrency(deductible))
                            .fontWeight(.semibold)
                            .foregroundColor(.orange)
                    }
                }

                if let approved = claim.approvedAmount,
                   let deductible = claim.deductiblePaid {
                    Divider()
                    HStack {
                        Text("Net Payout")
                            .fontWeight(.medium)
                        Spacer()
                        Text(formatCurrency(approved - deductible))
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
    }

    // MARK: - Repair Shop Section
    private func repairShopSection(_ shop: RepairShop) -> some View {
        VStack(spacing: 16) {
            HStack {
                Text("Repair Shop")
                    .font(.headline)
                Spacer()
                if shop.certified {
                    Label("Certified", systemImage: "checkmark.seal.fill")
                        .font(.caption)
                        .foregroundColor(.green)
                }
            }

            VStack(spacing: 12) {
                InfoRow(label: "Name", value: shop.name)
                InfoRow(label: "Phone", value: shop.phone)
                InfoRow(label: "Address", value: shop.address)
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
    }

    // MARK: - Documents Section
    private var documentsSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Supporting Documents")
                    .font(.headline)
                Spacer()
                Text("\(claim.documents.count)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            if claim.documents.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "doc")
                        .font(.largeTitle)
                        .foregroundColor(.gray)

                    Text("No documents uploaded")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
            } else {
                VStack(spacing: 12) {
                    ForEach(claim.documents) { document in
                        DocumentRow(document: document)
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
            }
        }
    }

    // MARK: - Actions Section
    private var actionsSection: some View {
        VStack(spacing: 12) {
            if claim.status == .pendingDocuments {
                Button {
                    // Upload additional documents
                } label: {
                    HStack {
                        Image(systemName: "doc.badge.plus")
                        Text("Upload Documents")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
            }

            if claim.status == .denied {
                Button {
                    // Appeal claim
                } label: {
                    HStack {
                        Image(systemName: "arrow.counterclockwise")
                        Text("Appeal Decision")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
            }

            Button {
                // Contact provider
                if let warranty = viewModel.warranties.first(where: { $0.id == claim.warrantyId }) {
                    callPhone(warranty.provider.contact.phone)
                }
            } label: {
                HStack {
                    Image(systemName: "phone.fill")
                    Text("Contact Provider")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemGray6))
                .foregroundColor(.blue)
                .cornerRadius(12)
            }
        }
    }

    // MARK: - Notes Section
    private var notesSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Notes")
                    .font(.headline)
                Spacer()
                Button {
                    showingNotes.toggle()
                } label: {
                    Image(systemName: showingNotes ? "chevron.up" : "chevron.down")
                        .foregroundColor(.blue)
                }
            }

            if showingNotes {
                VStack(spacing: 12) {
                    if let notes = claim.notes, !notes.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Existing Notes")
                                .font(.caption)
                                .foregroundColor(.secondary)

                            Text(notes)
                                .font(.body)
                                .padding()
                                .background(Color(.systemGray6))
                                .cornerRadius(8)
                        }
                    }

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Add Note")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        TextEditor(text: $additionalNotes)
                            .frame(minHeight: 80)
                            .padding(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color(.separator), lineWidth: 1)
                            )

                        Button {
                            // Save note
                        } label: {
                            Text("Save Note")
                                .font(.subheadline)
                                .fontWeight(.semibold)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(8)
                        }
                        .disabled(additionalNotes.isEmpty)
                    }
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
            }
        }
    }

    // MARK: - Helper Functions
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }

    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }

    private func formatNumber(_ number: Int) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: number)) ?? "\(number)"
    }

    private func callPhone(_ phone: String) {
        if let url = URL(string: "tel://\(phone)") {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - Timeline Event
struct TimelineEvent: View {
    let title: String
    let date: Date
    let isCompleted: Bool
    let isCurrent: Bool
    let isLast: Bool
    var isDenied: Bool = false
    var isWarning: Bool = false

    private var color: Color {
        if isDenied { return .red }
        if isWarning { return .orange }
        if isCompleted { return .green }
        if isCurrent { return .blue }
        return .gray
    }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(spacing: 0) {
                ZStack {
                    Circle()
                        .fill(color.opacity(0.2))
                        .frame(width: 32, height: 32)

                    if isCompleted {
                        Image(systemName: isDenied ? "xmark.circle.fill" : "checkmark.circle.fill")
                            .foregroundColor(color)
                    } else if isCurrent {
                        Circle()
                            .fill(color)
                            .frame(width: 12, height: 12)
                    } else {
                        Circle()
                            .stroke(color, lineWidth: 2)
                            .frame(width: 12, height: 12)
                    }
                }

                if !isLast {
                    Rectangle()
                        .fill(isCompleted ? color.opacity(0.3) : Color.gray.opacity(0.2))
                        .frame(width: 2, height: 40)
                }
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .fontWeight(isCurrent ? .semibold : .regular)

                Text(formatDate(date))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Document Row
struct DocumentRow: View {
    let document: ClaimDocument

    var body: some View {
        Button {
            // View document
        } label: {
            HStack {
                Image(systemName: document.type.icon)
                    .foregroundColor(.blue)
                    .frame(width: 24)

                VStack(alignment: .leading, spacing: 4) {
                    Text(document.name)
                        .font(.subheadline)
                        .foregroundColor(.primary)

                    Text(document.type.displayName + " • " + formatDate(document.uploadedAt))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Preview
struct ClaimTrackingView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            ClaimTrackingView(claim: sampleClaim)
        }
    }

    static var sampleClaim: WarrantyClaim {
        WarrantyClaim(
            id: "claim123",
            warrantyId: "warranty1",
            vehicleId: "vehicle1",
            issueDescription: "Engine making unusual noise and losing power",
            component: "Engine",
            failureDate: Date().addingTimeInterval(-7*24*60*60),
            mileageAtFailure: 45000,
            status: .underReview,
            claimAmount: 2500,
            approvedAmount: nil,
            deductiblePaid: nil,
            repairShop: RepairShop(
                name: "AutoCare Center",
                phone: "555-0100",
                address: "123 Main St, City, ST 12345",
                certified: true
            ),
            documents: [
                ClaimDocument(
                    id: "doc1",
                    type: .photo,
                    name: "engine_photo.jpg",
                    url: nil,
                    uploadedAt: Date()
                ),
                ClaimDocument(
                    id: "doc2",
                    type: .diagnostic,
                    name: "diagnostic_report.pdf",
                    url: nil,
                    uploadedAt: Date()
                )
            ],
            notes: "Initial inspection shows possible timing belt issue",
            submittedAt: Date().addingTimeInterval(-5*24*60*60),
            updatedAt: Date().addingTimeInterval(-2*24*60*60),
            resolvedAt: nil,
            denialReason: nil
        )
    }
}
