//
//  WarrantyDetailView.swift
//  Fleet Manager - iOS Native App
//
//  Detailed view for a specific warranty showing coverage, terms, and claims
//

import SwiftUI

struct WarrantyDetailView: View {
    let warranty: Warranty
    @StateObject private var viewModel = WarrantyManagementViewModel()
    @State private var showingClaimSubmission = false
    @State private var showingShareSheet = false

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header Card
                headerCard

                // Status and Expiration
                statusSection

                // Coverage Details
                coverageSection

                // Provider Information
                providerSection

                // Claims History
                claimsSection

                // Value Information
                valueSection

                // Actions
                actionsSection
            }
            .padding()
        }
        .navigationTitle("Warranty Details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button {
                        showingShareSheet = true
                    } label: {
                        Label("Share", systemImage: "square.and.arrow.up")
                    }

                    if let url = warranty.documentURL {
                        Button {
                            openURL(url)
                        } label: {
                            Label("View Document", systemImage: "doc.text")
                        }
                    }

                    Button(role: .destructive) {
                        // Delete warranty
                    } label: {
                        Label("Delete", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingClaimSubmission) {
            ClaimSubmissionView(warranty: warranty)
        }
        .task {
            await viewModel.refresh()
        }
    }

    // MARK: - Header Card
    private var headerCard: some View {
        VStack(spacing: 16) {
            HStack {
                Image(systemName: warranty.type.icon)
                    .font(.largeTitle)
                    .foregroundColor(warranty.status.color)

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(warranty.status.displayName)
                        .font(.headline)
                        .foregroundColor(warranty.status.color)

                    if warranty.isActive {
                        Text("\(warranty.daysRemaining) days left")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }

            VStack(alignment: .leading, spacing: 8) {
                Text(warranty.component)
                    .font(.title2)
                    .fontWeight(.bold)

                Text(warranty.type.displayName)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Status Section
    private var statusSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Status & Timeline")
                    .font(.headline)
                Spacer()
            }

            VStack(spacing: 12) {
                InfoRow(label: "Start Date", value: formatDate(warranty.startDate))
                InfoRow(label: "End Date", value: formatDate(warranty.endDate))

                if let mileageLimit = warranty.mileageLimit {
                    InfoRow(label: "Mileage Limit", value: "\(formatNumber(mileageLimit)) miles")
                }

                Divider()

                // Expiration Alert
                if warranty.isActive {
                    HStack {
                        Image(systemName: warranty.expirationAlertLevel.icon)
                            .foregroundColor(warranty.expirationAlertLevel.color)

                        VStack(alignment: .leading, spacing: 4) {
                            Text(warranty.expirationAlertLevel.displayName)
                                .font(.subheadline)
                                .fontWeight(.medium)

                            ProgressView(value: warranty.coveragePercentage, total: 100)
                                .tint(warranty.expirationAlertLevel.color)
                        }

                        Spacer()

                        Text("\(Int(warranty.coveragePercentage))%")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
    }

    // MARK: - Coverage Section
    private var coverageSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Coverage Details")
                    .font(.headline)
                Spacer()
                Text("\(warranty.coverage.coverageCount) components")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            VStack(alignment: .leading, spacing: 12) {
                // Covered Components
                DisclosureGroup {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(warranty.coverage.coveredComponents, id: \.self) { component in
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.green)
                                    .font(.caption)
                                Text(component)
                                    .font(.subheadline)
                                Spacer()
                            }
                        }
                    }
                    .padding(.vertical, 8)
                } label: {
                    HStack {
                        Image(systemName: "checkmark.shield.fill")
                            .foregroundColor(.green)
                        Text("Covered Components")
                            .fontWeight(.medium)
                        Spacer()
                        Text("\(warranty.coverage.coverageCount)")
                            .foregroundColor(.secondary)
                    }
                }

                Divider()

                // Exclusions
                if !warranty.coverage.exclusions.isEmpty {
                    DisclosureGroup {
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(warranty.coverage.exclusions, id: \.self) { exclusion in
                                HStack {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.red)
                                        .font(.caption)
                                    Text(exclusion)
                                        .font(.subheadline)
                                    Spacer()
                                }
                            }
                        }
                        .padding(.vertical, 8)
                    } label: {
                        HStack {
                            Image(systemName: "exclamationmark.shield.fill")
                                .foregroundColor(.red)
                            Text("Exclusions")
                                .fontWeight(.medium)
                            Spacer()
                            Text("\(warranty.coverage.exclusionCount)")
                                .foregroundColor(.secondary)
                        }
                    }

                    Divider()
                }

                // Limitations
                if let limitations = warranty.coverage.limitations, !limitations.isEmpty {
                    DisclosureGroup {
                        VStack(alignment: .leading, spacing: 8) {
                            ForEach(limitations, id: \.self) { limitation in
                                HStack(alignment: .top) {
                                    Image(systemName: "info.circle.fill")
                                        .foregroundColor(.blue)
                                        .font(.caption)
                                    Text(limitation)
                                        .font(.subheadline)
                                    Spacer()
                                }
                            }
                        }
                        .padding(.vertical, 8)
                    } label: {
                        HStack {
                            Image(systemName: "info.circle.fill")
                                .foregroundColor(.blue)
                            Text("Limitations")
                                .fontWeight(.medium)
                            Spacer()
                        }
                    }
                }

                // Financial Limits
                if warranty.deductible != nil || warranty.coverage.maxClaimAmount != nil {
                    Divider()

                    VStack(spacing: 8) {
                        if let deductible = warranty.deductible {
                            InfoRow(label: "Deductible", value: formatCurrency(deductible))
                        }

                        if let maxClaim = warranty.coverage.maxClaimAmount {
                            InfoRow(label: "Max Claim Amount", value: formatCurrency(maxClaim))
                        }

                        if let aggregate = warranty.coverage.aggregateLimit {
                            InfoRow(label: "Aggregate Limit", value: formatCurrency(aggregate))
                        }
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
    }

    // MARK: - Provider Section
    private var providerSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Provider Information")
                    .font(.headline)
                Spacer()
            }

            VStack(spacing: 12) {
                InfoRow(label: "Provider", value: warranty.provider.name)

                if let rating = warranty.provider.rating {
                    HStack {
                        Text("Rating")
                            .foregroundColor(.secondary)
                        Spacer()
                        HStack(spacing: 2) {
                            ForEach(0..<5) { index in
                                Image(systemName: index < Int(rating) ? "star.fill" : "star")
                                    .foregroundColor(.yellow)
                                    .font(.caption)
                            }
                            Text(String(format: "%.1f", rating))
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }

                Divider()

                // Contact Information
                VStack(spacing: 8) {
                    Button {
                        callPhone(warranty.provider.contact.phone)
                    } label: {
                        HStack {
                            Image(systemName: "phone.fill")
                                .foregroundColor(.blue)
                            Text(warranty.provider.contact.phone)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    Button {
                        sendEmail(warranty.provider.contact.email)
                    } label: {
                        HStack {
                            Image(systemName: "envelope.fill")
                                .foregroundColor(.blue)
                            Text(warranty.provider.contact.email)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    if let website = warranty.provider.contact.website {
                        Button {
                            openURL(website)
                        } label: {
                            HStack {
                                Image(systemName: "globe")
                                    .foregroundColor(.blue)
                                Text("Visit Website")
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }

                if let hours = warranty.provider.contact.hours {
                    Divider()
                    InfoRow(label: "Hours", value: hours)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
    }

    // MARK: - Claims Section
    private var claimsSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Claims History")
                    .font(.headline)
                Spacer()
                let claims = viewModel.getClaimsForWarranty(warrantyId: warranty.id)
                Text("\(claims.count) claims")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            let claims = viewModel.getClaimsForWarranty(warrantyId: warranty.id)
            if claims.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "doc.text")
                        .font(.largeTitle)
                        .foregroundColor(.gray)

                    Text("No Claims Yet")
                        .font(.headline)
                        .foregroundColor(.secondary)

                    Text("Submit a claim if you need warranty service")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
            } else {
                VStack(spacing: 12) {
                    // Claims Summary
                    let summary = viewModel.getClaimStatusSummary(for: warranty.id)
                    claimsSummary(summary)

                    // Recent Claims
                    ForEach(claims.prefix(3)) { claim in
                        NavigationLink(destination: ClaimTrackingView(claim: claim)) {
                            ClaimCardView(claim: claim)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }

                    if claims.count > 3 {
                        NavigationLink(destination: ClaimTrackingView(claim: claims[0])) {
                            Text("View All \(claims.count) Claims")
                                .font(.subheadline)
                                .foregroundColor(.blue)
                        }
                    }
                }
            }
        }
    }

    private func claimsSummary(_ summary: ClaimStatusSummary) -> some View {
        HStack(spacing: 12) {
            VStack {
                Text("\(summary.total)")
                    .font(.title2)
                    .fontWeight(.bold)
                Text("Total")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)

            VStack {
                Text("\(summary.approved)")
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(.green)
                Text("Approved")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)

            VStack {
                Text(formatCurrency(summary.approvedAmount))
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
                Text("Paid Out")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    // MARK: - Value Section
    private var valueSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Warranty Value")
                    .font(.headline)
                Spacer()
            }

            VStack(spacing: 12) {
                if let purchasePrice = warranty.purchasePrice {
                    InfoRow(label: "Purchase Price", value: formatCurrency(purchasePrice))
                }

                InfoRow(
                    label: "Current Value",
                    value: formatCurrency(warranty.calculateWarrantyValue())
                )

                InfoRow(
                    label: "Coverage Remaining",
                    value: "\(Int(warranty.coveragePercentage))%"
                )
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
    }

    // MARK: - Actions Section
    private var actionsSection: some View {
        VStack(spacing: 12) {
            if warranty.isActive {
                Button {
                    showingClaimSubmission = true
                } label: {
                    HStack {
                        Image(systemName: "doc.text.fill")
                        Text("Submit Claim")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
            }

            if let portal = warranty.provider.claimProcess.onlinePortal {
                Button {
                    openURL(portal)
                } label: {
                    HStack {
                        Image(systemName: "arrow.up.right.square")
                        Text("Provider Portal")
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
    }

    // MARK: - Helper Functions
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
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

    private func sendEmail(_ email: String) {
        if let url = URL(string: "mailto:\(email)") {
            UIApplication.shared.open(url)
        }
    }

    private func openURL(_ urlString: String) {
        if let url = URL(string: urlString) {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - Info Row
struct InfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
    }
}

// MARK: - Preview
struct WarrantyDetailView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            WarrantyDetailView(warranty: sampleWarranty)
        }
    }

    static var sampleWarranty: Warranty {
        Warranty(
            id: "1",
            tenantId: "tenant1",
            vehicleId: "vehicle1",
            component: "Engine",
            provider: WarrantyProvider(
                name: "AutoShield",
                contact: ProviderContact(
                    phone: "1-800-555-0100",
                    email: "claims@autoshield.com",
                    website: "https://autoshield.com",
                    address: "123 Main St",
                    hours: "Mon-Fri 9AM-5PM"
                ),
                claimProcess: ClaimProcess(
                    submissionMethod: "Online",
                    requiredDocuments: ["Invoice", "Photos"],
                    averageProcessingDays: 10,
                    onlinePortal: "https://portal.autoshield.com"
                ),
                serviceLevel: "Premium",
                rating: 4.5
            ),
            type: .powertrain,
            startDate: Date().addingTimeInterval(-365*24*60*60),
            endDate: Date().addingTimeInterval(365*24*60*60),
            mileageLimit: 100000,
            coverage: WarrantyCoverage(
                coveredComponents: ["Engine", "Transmission", "Drivetrain"],
                exclusions: ["Wear and tear", "Modifications"],
                limitations: ["Must use certified repair shops"],
                maxClaimAmount: 5000,
                aggregateLimit: 15000
            ),
            terms: "Standard powertrain warranty terms",
            purchasePrice: 2500,
            deductible: 100,
            status: .active,
            documentURL: nil,
            notes: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}
