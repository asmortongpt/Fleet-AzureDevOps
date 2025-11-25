//
//  ReimbursementView.swift
//  Fleet Manager
//
//  View for viewing and managing reimbursement requests
//

import SwiftUI

struct ReimbursementView: View {
    @StateObject private var viewModel = PersonalUseViewModel()
    @State private var showingFilterSheet = false
    @State private var showingRequestDetail = false
    @State private var selectedRequest: ReimbursementRequest?

    var body: some View {
        VStack(spacing: 0) {
            // Summary Card
            summaryCard

            // Filter Bar
            filterBar

            // Requests List
            if viewModel.loadingState.isLoading {
                ProgressView("Loading requests...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.filteredRequests.isEmpty {
                emptyState
            } else {
                List {
                    ForEach(viewModel.filteredRequests) { request in
                        requestCard(request: request)
                            .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                            .listRowSeparator(.hidden)
                            .onTapGesture {
                                selectedRequest = request
                                showingRequestDetail = true
                            }
                    }
                }
                .listStyle(.plain)
            }
        }
        .navigationTitle("Reimbursements")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button(action: { showingFilterSheet = true }) {
                        Label("Filter", systemImage: "line.3.horizontal.decrease.circle")
                    }

                    Button(action: { viewModel.showingSubmitRequest = true }) {
                        Label("Submit Request", systemImage: "paperplane.fill")
                    }
                    .disabled(!viewModel.canSubmitRequest)

                    Divider()

                    ForEach(ReimbursementStatus.allCases, id: \.self) { status in
                        Button(action: { viewModel.filterByStatus = status }) {
                            Label(status.displayName, systemImage: status.icon)
                        }
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingRequestDetail) {
            if let request = selectedRequest {
                ReimbursementDetailView(request: request, viewModel: viewModel)
            }
        }
        .sheet(isPresented: $showingFilterSheet) {
            filterSheet
        }
        .refreshable {
            await viewModel.refresh()
        }
    }

    // MARK: - Summary Card
    private var summaryCard: some View {
        HStack(spacing: 16) {
            summaryItem(
                title: "Pending",
                count: viewModel.reimbursementRequests.filter { $0.status == .pending }.count,
                color: .orange
            )

            Divider()

            summaryItem(
                title: "Approved",
                count: viewModel.reimbursementRequests.filter { $0.status == .approved }.count,
                color: .blue
            )

            Divider()

            summaryItem(
                title: "Paid",
                count: viewModel.reimbursementRequests.filter { $0.status == .paid }.count,
                color: .green
            )
        }
        .padding()
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.1), radius: 5)
    }

    private func summaryItem(title: String, count: Int, color: Color) -> some View {
        VStack(spacing: 4) {
            Text("\(count)")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    // MARK: - Filter Bar
    private var filterBar: some View {
        VStack(spacing: 12) {
            // Search Bar
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.secondary)

                TextField("Search requests...", text: $viewModel.searchText)
                    .textFieldStyle(.plain)

                if !viewModel.searchText.isEmpty {
                    Button(action: { viewModel.searchText = "" }) {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(10)

            // Active Filters
            if viewModel.filterByStatus != nil {
                HStack {
                    Text("Filters:")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    if let status = viewModel.filterByStatus {
                        filterChip(text: status.displayName) {
                            viewModel.filterByStatus = nil
                        }
                    }

                    Spacer()

                    Button("Clear All") {
                        viewModel.clearSearch()
                    }
                    .font(.caption)
                    .foregroundColor(.blue)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
    }

    private func filterChip(text: String, onRemove: @escaping () -> Void) -> some View {
        HStack(spacing: 4) {
            Text(text)
            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
            }
        }
        .font(.caption)
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(Color.blue.opacity(0.2))
        .foregroundColor(.blue)
        .cornerRadius(8)
    }

    // MARK: - Request Card
    private func requestCard(request: ReimbursementRequest) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Request #\(request.id)")
                        .font(.headline)

                    Text(request.driverName)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(request.formattedAmount)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.green)

                    Label(request.status.displayName, systemImage: request.status.icon)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(Color(request.statusColor))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color(request.statusColor).opacity(0.2))
                        .cornerRadius(8)
                }
            }

            Divider()

            // Request Details
            VStack(alignment: .leading, spacing: 8) {
                detailRow(
                    icon: "calendar",
                    label: "Period",
                    value: request.formattedPeriod
                )

                detailRow(
                    icon: "location.fill",
                    label: "Miles",
                    value: request.formattedMiles
                )

                detailRow(
                    icon: "dollarsign.circle",
                    label: "Rate",
                    value: request.formattedRate
                )

                detailRow(
                    icon: "clock",
                    label: "Submitted",
                    value: request.formattedRequestDate
                )
            }

            // Approval Info (if applicable)
            if request.status == .approved || request.status == .paid {
                if let approvedBy = request.approvedBy, let approvedDate = request.approvedDate {
                    Divider()

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Approved by \(approvedBy)")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        let formatter = DateFormatter()
                        formatter.dateStyle = .medium
                        Text("on \(formatter.string(from: approvedDate))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }

            // Rejection Reason (if rejected)
            if request.status == .rejected, let reason = request.rejectedReason {
                Divider()

                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.red)

                    Text(reason)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 12)
                .background(Color.red.opacity(0.1))
                .cornerRadius(8)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5)
    }

    private func detailRow(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 20)

            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
    }

    // MARK: - Empty State
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "dollarsign.circle")
                .font(.system(size: 60))
                .foregroundColor(.secondary)

            Text("No Reimbursement Requests")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Submit a reimbursement request to track your personal vehicle use compensation")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            if viewModel.canSubmitRequest {
                Button(action: { viewModel.showingSubmitRequest = true }) {
                    HStack {
                        Image(systemName: "paperplane.fill")
                        Text("Submit Request")
                            .fontWeight(.semibold)
                    }
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .padding(.top, 8)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Filter Sheet
    private var filterSheet: some View {
        NavigationView {
            Form {
                Section(header: Text("Status")) {
                    Picker("Status", selection: $viewModel.filterByStatus) {
                        Text("All").tag(nil as ReimbursementStatus?)
                        ForEach(ReimbursementStatus.allCases, id: \.self) { status in
                            Text(status.displayName).tag(status as ReimbursementStatus?)
                        }
                    }
                    .pickerStyle(.inline)
                }

                Section(header: Text("Sort By")) {
                    Picker("Sort", selection: $viewModel.sortOption) {
                        ForEach(SortOption.allCases, id: \.self) { option in
                            HStack {
                                Image(systemName: option.icon)
                                Text(option.rawValue)
                            }
                            .tag(option)
                        }
                    }
                    .pickerStyle(.inline)
                }
            }
            .navigationTitle("Filter & Sort")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Reset") {
                        viewModel.clearSearch()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        showingFilterSheet = false
                    }
                }
            }
        }
    }
}

// MARK: - Reimbursement Detail View
struct ReimbursementDetailView: View {
    @Environment(\.dismiss) var dismiss
    let request: ReimbursementRequest
    @ObservedObject var viewModel: PersonalUseViewModel
    @State private var showingCancelAlert = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Status Badge
                    HStack {
                        Spacer()
                        Label(request.status.displayName, systemImage: request.status.icon)
                            .font(.title3)
                            .fontWeight(.semibold)
                            .foregroundColor(Color(request.statusColor))
                            .padding(.horizontal, 20)
                            .padding(.vertical, 10)
                            .background(Color(request.statusColor).opacity(0.2))
                            .cornerRadius(12)
                        Spacer()
                    }

                    // Amount
                    VStack(spacing: 8) {
                        Text("Reimbursement Amount")
                            .font(.subheadline)
                            .foregroundColor(.secondary)

                        Text(request.formattedAmount)
                            .font(.system(size: 48, weight: .bold))
                            .foregroundColor(.green)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    // Details
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Details")
                            .font(.headline)

                        detailRow(label: "Request ID", value: request.id)
                        detailRow(label: "Driver", value: request.driverName)
                        detailRow(label: "Period", value: request.formattedPeriod)
                        detailRow(label: "Total Miles", value: request.formattedMiles)
                        detailRow(label: "Rate", value: request.formattedRate)
                        detailRow(label: "Submitted", value: request.formattedRequestDate)

                        if let email = request.driverEmail {
                            detailRow(label: "Email", value: email)
                        }
                    }

                    // Trips
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Included Trips")
                            .font(.headline)

                        Text("\(request.tripIds.count) trips included in this request")
                            .font(.subheadline)
                            .foregroundColor(.secondary)

                        // Could expand to show trip details
                    }

                    // Approval/Payment Info
                    if request.status == .approved || request.status == .paid {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Approval Information")
                                .font(.headline)

                            if let approvedBy = request.approvedBy, let approvedDate = request.approvedDate {
                                detailRow(label: "Approved By", value: approvedBy)

                                let formatter = DateFormatter()
                                formatter.dateStyle = .medium
                                formatter.timeStyle = .short
                                detailRow(label: "Approved On", value: formatter.string(from: approvedDate))
                            }

                            if request.status == .paid {
                                if let paidDate = request.paidDate {
                                    let formatter = DateFormatter()
                                    formatter.dateStyle = .medium
                                    detailRow(label: "Paid On", value: formatter.string(from: paidDate))
                                }

                                if let paymentMethod = request.paymentMethod {
                                    detailRow(label: "Payment Method", value: paymentMethod.displayName)
                                }
                            }
                        }
                    }

                    // Rejection Info
                    if request.status == .rejected {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Rejection Information")
                                .font(.headline)

                            if let reason = request.rejectedReason {
                                HStack(alignment: .top, spacing: 12) {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .foregroundColor(.red)

                                    Text(reason)
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                }
                                .padding()
                                .background(Color.red.opacity(0.1))
                                .cornerRadius(10)
                            }
                        }
                    }

                    // Notes
                    if let notes = request.notes {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Notes")
                                .font(.headline)

                            Text(notes)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }

                    // Actions
                    if request.canEdit {
                        VStack(spacing: 12) {
                            Button(action: { exportReceipt() }) {
                                HStack {
                                    Image(systemName: "arrow.down.circle.fill")
                                    Text("Download Receipt")
                                        .fontWeight(.semibold)
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                            }

                            if request.status == .pending {
                                Button(action: { showingCancelAlert = true }) {
                                    HStack {
                                        Image(systemName: "xmark.circle.fill")
                                        Text("Cancel Request")
                                            .fontWeight(.semibold)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color.red)
                                    .foregroundColor(.white)
                                    .cornerRadius(12)
                                }
                            }
                        }
                        .padding(.top, 20)
                    }
                }
                .padding()
            }
            .navigationTitle("Request Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .alert("Cancel Request", isPresented: $showingCancelAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Confirm", role: .destructive) {
                    // Would cancel the request
                    dismiss()
                }
            } message: {
                Text("Are you sure you want to cancel this reimbursement request?")
            }
        }
    }

    private func detailRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
        .padding(.vertical, 4)
    }

    private func exportReceipt() {
        Task {
            if let url = await viewModel.exportReimbursementReceipt(for: request) {
                // Present share sheet with the exported file
                print("Receipt exported to: \(url)")
            }
        }
    }
}

#Preview {
    NavigationView {
        ReimbursementView()
    }
}
