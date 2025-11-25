//
//  WarrantyManagementView.swift
//  Fleet Manager - iOS Native App
//
//  Main view for warranty management - displays all warranties with filtering and search
//

import SwiftUI

struct WarrantyManagementView: View {
    @StateObject private var viewModel = WarrantyManagementViewModel()
    @State private var showingAddWarranty = false
    @State private var showingFilterSheet = false
    @State private var selectedTab: WarrantyTab = .warranties

    enum WarrantyTab {
        case warranties
        case claims
        case statistics
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab Selector
                tabSelector

                // Content based on selected tab
                Group {
                    switch selectedTab {
                    case .warranties:
                        warrantiesView
                    case .claims:
                        claimsView
                    case .statistics:
                        statisticsView
                    }
                }
            }
            .navigationTitle("Warranties")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button {
                            showingFilterSheet = true
                        } label: {
                            Label("Filter", systemImage: "line.3.horizontal.decrease.circle")
                        }

                        Button {
                            viewModel.showExpiredWarranties.toggle()
                        } label: {
                            Label(
                                viewModel.showExpiredWarranties ? "Hide Expired" : "Show Expired",
                                systemImage: viewModel.showExpiredWarranties ? "eye.slash" : "eye"
                            )
                        }

                        Menu("Sort By") {
                            ForEach(WarrantySortOption.allCases, id: \.self) { option in
                                Button {
                                    viewModel.setSortOption(option)
                                } label: {
                                    HStack {
                                        Text(option.displayName)
                                        if viewModel.sortOption == option {
                                            Image(systemName: "checkmark")
                                        }
                                    }
                                }
                            }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddWarranty = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                    }
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .sheet(isPresented: $showingAddWarranty) {
                AddWarrantyView()
            }
            .sheet(isPresented: $showingFilterSheet) {
                filterSheet
            }
            .task {
                if viewModel.warranties.isEmpty {
                    await viewModel.refresh()
                }
            }
        }
    }

    // MARK: - Tab Selector
    private var tabSelector: some View {
        HStack(spacing: 0) {
            TabButton(
                title: "Warranties",
                icon: "shield.fill",
                count: viewModel.filteredWarranties.count,
                isSelected: selectedTab == .warranties
            ) {
                selectedTab = .warranties
            }

            TabButton(
                title: "Claims",
                icon: "doc.text.fill",
                count: viewModel.filteredClaims.count,
                isSelected: selectedTab == .claims
            ) {
                selectedTab = .claims
            }

            TabButton(
                title: "Stats",
                icon: "chart.bar.fill",
                count: nil,
                isSelected: selectedTab == .statistics
            ) {
                selectedTab = .statistics
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
        .overlay(
            Divider()
                .background(Color(.separator)),
            alignment: .bottom
        )
    }

    // MARK: - Warranties View
    private var warrantiesView: some View {
        VStack(spacing: 0) {
            // Search Bar
            SearchBar(text: $viewModel.searchText, placeholder: "Search warranties...")
                .padding(.horizontal)
                .padding(.vertical, 8)

            // Expiring Warranties Alert
            if !viewModel.expiringWarranties.isEmpty && viewModel.filterType != .expiring {
                expiringWarrantiesAlert
            }

            // Warranties List
            if viewModel.loadingState.isLoading {
                ProgressView("Loading warranties...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.filteredWarranties.isEmpty {
                emptyWarrantiesView
            } else {
                warrantyList
            }
        }
    }

    private var warrantyList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.filteredWarranties) { warranty in
                    NavigationLink(destination: WarrantyDetailView(warranty: warranty)) {
                        WarrantyCardView(warranty: warranty)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding()
        }
    }

    private var expiringWarrantiesAlert: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundColor(.orange)
                Text("Warranties Expiring Soon")
                    .font(.headline)
                Spacer()
                Button("View All") {
                    viewModel.setFilter(.expiring)
                }
                .font(.subheadline)
            }

            Text("\(viewModel.expiringWarranties.count) warranties expiring in the next 90 days")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.orange.opacity(0.1))
        .cornerRadius(12)
        .padding(.horizontal)
    }

    private var emptyWarrantiesView: some View {
        VStack(spacing: 16) {
            Image(systemName: "shield.slash")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Warranties Found")
                .font(.title2)
                .fontWeight(.semibold)

            Text(viewModel.searchText.isEmpty ?
                 "Add a warranty to start tracking coverage" :
                 "No warranties match your search")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            if viewModel.searchText.isEmpty {
                Button {
                    showingAddWarranty = true
                } label: {
                    Label("Add Warranty", systemImage: "plus.circle.fill")
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .padding(.top)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }

    // MARK: - Claims View
    private var claimsView: some View {
        VStack(spacing: 0) {
            // Search Bar
            SearchBar(text: $viewModel.searchText, placeholder: "Search claims...")
                .padding(.horizontal)
                .padding(.vertical, 8)

            // Active Claims Summary
            if !viewModel.activeClaims.isEmpty {
                activeClaimsSummary
            }

            // Claims List
            if viewModel.filteredClaims.isEmpty {
                emptyClaimsView
            } else {
                claimsList
            }
        }
    }

    private var claimsList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.filteredClaims) { claim in
                    NavigationLink(destination: ClaimTrackingView(claim: claim)) {
                        ClaimCardView(claim: claim)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
            .padding()
        }
    }

    private var activeClaimsSummary: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "doc.text.magnifyingglass")
                    .foregroundColor(.blue)
                Text("Active Claims")
                    .font(.headline)
                Spacer()
                Text("\(viewModel.activeClaims.count)")
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundColor(.blue)
            }

            HStack {
                Label("\(viewModel.claims.filter { $0.status == .underReview }.count) Under Review",
                      systemImage: "magnifyingglass.circle.fill")
                    .font(.caption)
                    .foregroundColor(.orange)
                Spacer()
                Label("\(viewModel.claims.filter { $0.status == .submitted }.count) Submitted",
                      systemImage: "paperplane.fill")
                    .font(.caption)
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .background(Color.blue.opacity(0.1))
        .cornerRadius(12)
        .padding(.horizontal)
    }

    private var emptyClaimsView: some View {
        VStack(spacing: 16) {
            Image(systemName: "doc.text")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Claims")
                .font(.title2)
                .fontWeight(.semibold)

            Text(viewModel.searchText.isEmpty ?
                 "Submit a claim when you need warranty service" :
                 "No claims match your search")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }

    // MARK: - Statistics View
    private var statisticsView: some View {
        ScrollView {
            VStack(spacing: 20) {
                if let stats = viewModel.statistics {
                    // Overview Cards
                    warrantyStatsOverview(stats: stats)

                    // Claims Statistics
                    claimsStatsSection(stats: stats)

                    // Financial Summary
                    financialSummarySection(stats: stats)
                } else {
                    ProgressView("Loading statistics...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .padding()
        }
    }

    private func warrantyStatsOverview(stats: WarrantyStatistics) -> some View {
        VStack(spacing: 12) {
            Text("Warranty Overview")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 12) {
                StatCard(
                    title: "Total",
                    value: "\(stats.totalWarranties)",
                    icon: "shield.fill",
                    color: .blue
                )

                StatCard(
                    title: "Active",
                    value: "\(stats.activeWarranties)",
                    icon: "checkmark.shield.fill",
                    color: .green
                )

                StatCard(
                    title: "Expiring",
                    value: "\(stats.expiringWarranties)",
                    icon: "exclamationmark.triangle.fill",
                    color: .orange
                )
            }
        }
    }

    private func claimsStatsSection(stats: WarrantyStatistics) -> some View {
        VStack(spacing: 12) {
            Text("Claims Statistics")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            VStack(spacing: 12) {
                HStack {
                    Text("Total Claims")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(stats.totalClaims)")
                        .fontWeight(.semibold)
                }

                HStack {
                    Text("Pending")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(stats.pendingClaims)")
                        .fontWeight(.semibold)
                        .foregroundColor(.orange)
                }

                HStack {
                    Text("Approved")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(stats.approvedClaims)")
                        .fontWeight(.semibold)
                        .foregroundColor(.green)
                }

                HStack {
                    Text("Denied")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(stats.deniedClaims)")
                        .fontWeight(.semibold)
                        .foregroundColor(.red)
                }

                Divider()

                HStack {
                    Text("Approval Rate")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(String(format: "%.1f%%", stats.approvalRate))
                        .fontWeight(.semibold)
                        .foregroundColor(stats.approvalRate > 75 ? .green : .orange)
                }

                HStack {
                    Text("Avg Processing Time")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text("\(Int(stats.averageProcessingDays)) days")
                        .fontWeight(.semibold)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
    }

    private func financialSummarySection(stats: WarrantyStatistics) -> some View {
        VStack(spacing: 12) {
            Text("Financial Summary")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            VStack(spacing: 12) {
                HStack {
                    Text("Total Claimed")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(formatCurrency(stats.totalClaimAmount))
                        .fontWeight(.semibold)
                }

                HStack {
                    Text("Approved Amount")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(formatCurrency(stats.approvedClaimAmount))
                        .fontWeight(.semibold)
                        .foregroundColor(.green)
                }

                HStack {
                    Text("Total Warranty Value")
                        .foregroundColor(.secondary)
                    Spacer()
                    Text(formatCurrency(viewModel.calculateTotalWarrantyValue()))
                        .fontWeight(.semibold)
                        .foregroundColor(.blue)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
        }
    }

    // MARK: - Filter Sheet
    private var filterSheet: some View {
        NavigationView {
            Form {
                Section(header: Text("Filter Type")) {
                    Button {
                        viewModel.setFilter(.all)
                        showingFilterSheet = false
                    } label: {
                        HStack {
                            Text("All Warranties")
                            Spacer()
                            if case .all = viewModel.filterType {
                                Image(systemName: "checkmark")
                            }
                        }
                    }

                    Button {
                        viewModel.setFilter(.active)
                        showingFilterSheet = false
                    } label: {
                        HStack {
                            Text("Active Only")
                            Spacer()
                            if case .active = viewModel.filterType {
                                Image(systemName: "checkmark")
                            }
                        }
                    }

                    Button {
                        viewModel.setFilter(.expiring)
                        showingFilterSheet = false
                    } label: {
                        HStack {
                            Text("Expiring Soon")
                            Spacer()
                            if case .expiring = viewModel.filterType {
                                Image(systemName: "checkmark")
                            }
                        }
                    }

                    Button {
                        viewModel.setFilter(.expired)
                        showingFilterSheet = false
                    } label: {
                        HStack {
                            Text("Expired")
                            Spacer()
                            if case .expired = viewModel.filterType {
                                Image(systemName: "checkmark")
                            }
                        }
                    }
                }

                Section(header: Text("Warranty Type")) {
                    ForEach(WarrantyType.allCases, id: \.self) { type in
                        Button {
                            viewModel.setFilter(.byType(type))
                            showingFilterSheet = false
                        } label: {
                            HStack {
                                Text(type.displayName)
                                Spacer()
                                if case .byType(let selectedType) = viewModel.filterType,
                                   selectedType == type {
                                    Image(systemName: "checkmark")
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("Filter Warranties")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showingFilterSheet = false
                    }
                }
            }
        }
    }

    // MARK: - Helper Functions
    private func formatCurrency(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
    }
}

// MARK: - Warranty Card View
struct WarrantyCardView: View {
    let warranty: Warranty

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: warranty.type.icon)
                    .foregroundColor(warranty.status.color)
                    .frame(width: 24)

                VStack(alignment: .leading, spacing: 4) {
                    Text(warranty.component)
                        .font(.headline)
                        .foregroundColor(.primary)

                    Text(warranty.type.displayName)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Image(systemName: warranty.expirationAlertLevel.icon)
                        .foregroundColor(warranty.expirationAlertLevel.color)

                    Text(warranty.status.displayName)
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(warranty.status.color.opacity(0.2))
                        .foregroundColor(warranty.status.color)
                        .cornerRadius(8)
                }
            }

            Divider()

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Provider")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(warranty.provider.name)
                        .font(.subheadline)
                        .fontWeight(.medium)
                }

                Spacer()

                if warranty.isActive {
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("Expires in")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text("\(warranty.daysRemaining) days")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(warranty.expirationAlertLevel.color)
                    }
                } else {
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("Ended")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(formatDate(warranty.endDate))
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                }
            }

            // Coverage Progress Bar
            if warranty.isActive {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("Coverage")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Spacer()
                        Text(String(format: "%.0f%% remaining", warranty.coveragePercentage))
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            Rectangle()
                                .fill(Color.gray.opacity(0.2))
                                .frame(height: 4)

                            Rectangle()
                                .fill(warranty.expirationAlertLevel.color)
                                .frame(width: geometry.size.width * CGFloat(warranty.coveragePercentage / 100), height: 4)
                        }
                    }
                    .frame(height: 4)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
}

// MARK: - Claim Card View
struct ClaimCardView: View {
    let claim: WarrantyClaim

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: claim.status.icon)
                    .foregroundColor(claim.statusColor)
                    .frame(width: 24)

                VStack(alignment: .leading, spacing: 4) {
                    Text(claim.component)
                        .font(.headline)
                        .foregroundColor(.primary)

                    Text(claim.issueDescription)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }

                Spacer()

                Text(claim.status.displayName)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(claim.statusColor.opacity(0.2))
                    .foregroundColor(claim.statusColor)
                    .cornerRadius(8)
            }

            Divider()

            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Submitted")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(formatDate(claim.submittedAt))
                        .font(.subheadline)
                        .fontWeight(.medium)
                }

                Spacer()

                if let amount = claim.claimAmount {
                    VStack(alignment: .trailing, spacing: 4) {
                        Text("Amount")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        Text(formatCurrency(amount))
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

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
}

// MARK: - Tab Button
struct TabButton: View {
    let title: String
    let icon: String
    let count: Int?
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                HStack(spacing: 4) {
                    Image(systemName: icon)
                        .font(.caption)
                    if let count = count {
                        Text("\(count)")
                            .font(.caption)
                            .fontWeight(.semibold)
                    }
                }
                .foregroundColor(isSelected ? .blue : .secondary)

                Text(title)
                    .font(.caption)
                    .foregroundColor(isSelected ? .blue : .secondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
            .background(isSelected ? Color.blue.opacity(0.1) : Color.clear)
            .cornerRadius(8)
        }
    }
}

// MARK: - Stat Card
struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(value)
                .font(.title)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Search Bar
struct SearchBar: View {
    @Binding var text: String
    let placeholder: String

    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)

            TextField(placeholder, text: $text)
                .textFieldStyle(PlainTextFieldStyle())

            if !text.isEmpty {
                Button(action: {
                    text = ""
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(8)
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

// MARK: - Add Warranty View Placeholder
struct AddWarrantyView: View {
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section {
                    Text("Add warranty form coming soon...")
                }
            }
            .navigationTitle("Add Warranty")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Preview
struct WarrantyManagementView_Previews: PreviewProvider {
    static var previews: some View {
        WarrantyManagementView()
    }
}
