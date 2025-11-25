//
//  ReimbursementQueueView.swift
//  Fleet Manager
//
//  Manager view for approving/rejecting reimbursement requests
//

import SwiftUI

struct ReimbursementQueueView: View {
    @StateObject private var viewModel = PersonalUseViewModel()
    @State private var showingApprovalSheet = false
    @State private var showingRejectionSheet = false
    @State private var showingBatchApproval = false
    @State private var selectedRequestForAction: ReimbursementRequest?
    @State private var rejectionReason = ""
    @State private var approverName = "Current Manager"

    var body: some View {
        VStack(spacing: 0) {
            // Summary Header
            summaryHeader

            // Selection Mode Toggle
            if !viewModel.pendingRequests.isEmpty {
                selectionToggle
            }

            // Requests List
            if viewModel.loadingState.isLoading {
                ProgressView("Loading pending requests...")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else if viewModel.pendingRequests.isEmpty {
                emptyState
            } else {
                List {
                    ForEach(viewModel.pendingRequests) { request in
                        requestRow(request: request)
                            .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                            .listRowSeparator(.hidden)
                    }
                }
                .listStyle(.plain)
            }

            // Batch Action Bar
            if !viewModel.selectedRequestIds.isEmpty {
                batchActionBar
            }
        }
        .navigationTitle("Approval Queue")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button(action: { selectAll() }) {
                        Label("Select All", systemImage: "checkmark.circle")
                    }

                    Button(action: { deselectAll() }) {
                        Label("Deselect All", systemImage: "circle")
                    }

                    Divider()

                    Button(action: { exportQueueReport() }) {
                        Label("Export Report", systemImage: "square.and.arrow.up")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingApprovalSheet) {
            if let request = selectedRequestForAction {
                approvalSheet(request: request)
            }
        }
        .sheet(isPresented: $showingRejectionSheet) {
            if let request = selectedRequestForAction {
                rejectionSheet(request: request)
            }
        }
        .sheet(isPresented: $showingBatchApproval) {
            batchApprovalSheet
        }
        .refreshable {
            await viewModel.refresh()
        }
    }

    // MARK: - Summary Header
    private var summaryHeader: some View {
        VStack(spacing: 12) {
            HStack(spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Pending Requests")
                        .font(.headline)

                    Text("\(viewModel.pendingRequests.count) requests awaiting approval")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("Total Amount")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    let totalAmount = viewModel.pendingRequests.reduce(0) { $0 + $1.totalAmount }
                    Text(String(format: "$%.2f", totalAmount))
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                }
            }

            if !viewModel.selectedRequestIds.isEmpty {
                HStack {
                    Text("\(viewModel.selectedRequestIds.count) selected")
                        .font(.caption)
                        .foregroundColor(.blue)

                    Spacer()

                    let selectedTotal = viewModel.pendingRequests
                        .filter { viewModel.selectedRequestIds.contains($0.id) }
                        .reduce(0) { $0 + $1.totalAmount }

                    Text("Selected: \(String(format: "$%.2f", selectedTotal))")
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.blue)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.1), radius: 5)
    }

    // MARK: - Selection Toggle
    private var selectionToggle: some View {
        HStack {
            Text("Select Mode")
                .font(.subheadline)

            Spacer()

            Toggle("", isOn: .constant(!viewModel.selectedRequestIds.isEmpty))
                .labelsHidden()
                .onChange(of: viewModel.selectedRequestIds.isEmpty) { isEmpty in
                    if !isEmpty {
                        // Selection mode active
                    }
                }
        }
        .padding()
        .background(Color(.systemGray6))
    }

    // MARK: - Request Row
    private func requestRow(request: ReimbursementRequest) -> some View {
        HStack(spacing: 12) {
            // Selection Checkbox
            Button(action: { toggleSelection(request: request) }) {
                Image(systemName: viewModel.selectedRequestIds.contains(request.id) ?
                      "checkmark.circle.fill" : "circle")
                    .foregroundColor(viewModel.selectedRequestIds.contains(request.id) ? .blue : .gray)
                    .font(.title3)
            }

            // Request Card
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(request.driverName)
                            .font(.headline)

                        Text("Request #\(request.id)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    Text(request.formattedAmount)
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(.green)
                }

                Divider()

                // Details
                VStack(alignment: .leading, spacing: 6) {
                    detailRow(icon: "calendar", value: request.formattedPeriod)
                    detailRow(icon: "location.fill", value: request.formattedMiles)
                    detailRow(icon: "clock", value: request.formattedRequestDate)
                }

                // Action Buttons
                HStack(spacing: 12) {
                    Button(action: {
                        selectedRequestForAction = request
                        showingApprovalSheet = true
                    }) {
                        HStack {
                            Image(systemName: "checkmark.circle.fill")
                            Text("Approve")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }

                    Button(action: {
                        selectedRequestForAction = request
                        showingRejectionSheet = true
                    }) {
                        HStack {
                            Image(systemName: "xmark.circle.fill")
                            Text("Reject")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 10)
                        .background(Color.red)
                        .foregroundColor(.white)
                        .cornerRadius(8)
                    }
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.1), radius: 5)
        }
    }

    private func detailRow(icon: String, value: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .frame(width: 16)

            Text(value)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    // MARK: - Batch Action Bar
    private var batchActionBar: some View {
        HStack(spacing: 12) {
            Button(action: { showingBatchApproval = true }) {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                    Text("Approve (\(viewModel.selectedRequestIds.count))")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.green)
                .foregroundColor(.white)
                .cornerRadius(12)
            }

            Button(action: { deselectAll() }) {
                HStack {
                    Image(systemName: "xmark.circle.fill")
                    Text("Cancel")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.gray)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.1), radius: 5, y: -2)
    }

    // MARK: - Empty State
    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 60))
                .foregroundColor(.green)

            Text("All Caught Up!")
                .font(.title2)
                .fontWeight(.semibold)

            Text("There are no pending reimbursement requests at this time")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Approval Sheet
    private func approvalSheet(request: ReimbursementRequest) -> some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Request Summary
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Request Summary")
                            .font(.headline)

                        summaryRow(label: "Driver", value: request.driverName)
                        summaryRow(label: "Amount", value: request.formattedAmount)
                        summaryRow(label: "Miles", value: request.formattedMiles)
                        summaryRow(label: "Rate", value: request.formattedRate)
                        summaryRow(label: "Period", value: request.formattedPeriod)
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    // Approval Details
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Approval Details")
                            .font(.headline)

                        TextField("Approver Name", text: $approverName)
                            .textFieldStyle(.roundedBorder)

                        Picker("Payment Method", selection: .constant(PaymentMethod.directDeposit)) {
                            ForEach(PaymentMethod.allCases, id: \.self) { method in
                                HStack {
                                    Image(systemName: method.icon)
                                    Text(method.displayName)
                                }
                                .tag(method)
                            }
                        }
                        .pickerStyle(.menu)
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)

                    // Confirmation
                    VStack(spacing: 12) {
                        Button(action: {
                            approveRequest(request)
                        }) {
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Approve Request")
                                    .fontWeight(.semibold)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.green)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                    }
                }
                .padding()
            }
            .navigationTitle("Approve Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        showingApprovalSheet = false
                    }
                }
            }
        }
    }

    // MARK: - Rejection Sheet
    private func rejectionSheet(request: ReimbursementRequest) -> some View {
        NavigationView {
            VStack(spacing: 20) {
                // Request Summary
                VStack(alignment: .leading, spacing: 12) {
                    Text("Request Summary")
                        .font(.headline)

                    summaryRow(label: "Driver", value: request.driverName)
                    summaryRow(label: "Amount", value: request.formattedAmount)
                    summaryRow(label: "Period", value: request.formattedPeriod)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)

                // Rejection Reason
                VStack(alignment: .leading, spacing: 8) {
                    Text("Rejection Reason")
                        .font(.headline)

                    TextEditor(text: $rejectionReason)
                        .frame(height: 120)
                        .padding(8)
                        .background(Color(.systemGray6))
                        .cornerRadius(8)

                    Text("Please provide a clear reason for rejection")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Confirmation
                Button(action: {
                    rejectRequest(request)
                }) {
                    HStack {
                        Image(systemName: "xmark.circle.fill")
                        Text("Reject Request")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(rejectionReason.isEmpty ? Color.gray : Color.red)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
                .disabled(rejectionReason.isEmpty)
            }
            .padding()
            .navigationTitle("Reject Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        rejectionReason = ""
                        showingRejectionSheet = false
                    }
                }
            }
        }
    }

    // MARK: - Batch Approval Sheet
    private var batchApprovalSheet: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Summary
                VStack(alignment: .leading, spacing: 12) {
                    Text("Batch Approval Summary")
                        .font(.headline)

                    let selectedRequests = viewModel.pendingRequests
                        .filter { viewModel.selectedRequestIds.contains($0.id) }

                    summaryRow(label: "Requests", value: "\(selectedRequests.count)")

                    let totalAmount = selectedRequests.reduce(0) { $0 + $1.totalAmount }
                    summaryRow(label: "Total Amount", value: String(format: "$%.2f", totalAmount))

                    let totalMiles = selectedRequests.reduce(0) { $0 + $1.totalMiles }
                    summaryRow(label: "Total Miles", value: String(format: "%.1f mi", totalMiles))
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)

                // Approval Details
                VStack(alignment: .leading, spacing: 12) {
                    Text("Approval Details")
                        .font(.headline)

                    TextField("Approver Name", text: $approverName)
                        .textFieldStyle(.roundedBorder)
                }
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(12)

                Spacer()

                // Confirmation
                Button(action: {
                    batchApprove()
                }) {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                        Text("Approve All Selected")
                            .fontWeight(.semibold)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.green)
                    .foregroundColor(.white)
                    .cornerRadius(12)
                }
            }
            .padding()
            .navigationTitle("Batch Approval")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        showingBatchApproval = false
                    }
                }
            }
        }
    }

    private func summaryRow(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
        }
    }

    // MARK: - Helper Methods
    private func toggleSelection(request: ReimbursementRequest) {
        if viewModel.selectedRequestIds.contains(request.id) {
            viewModel.selectedRequestIds.remove(request.id)
        } else {
            viewModel.selectedRequestIds.insert(request.id)
        }
    }

    private func selectAll() {
        viewModel.selectedRequestIds = Set(viewModel.pendingRequests.map { $0.id })
    }

    private func deselectAll() {
        viewModel.selectedRequestIds.removeAll()
    }

    private func approveRequest(_ request: ReimbursementRequest) {
        Task {
            await viewModel.approveRequest(request, approvedBy: approverName)
            showingApprovalSheet = false
            selectedRequestForAction = nil
        }
    }

    private func rejectRequest(_ request: ReimbursementRequest) {
        Task {
            await viewModel.rejectRequest(request, reason: rejectionReason)
            rejectionReason = ""
            showingRejectionSheet = false
            selectedRequestForAction = nil
        }
    }

    private func batchApprove() {
        Task {
            let requestIds = Array(viewModel.selectedRequestIds)
            await viewModel.batchApproveRequests(requestIds, approvedBy: approverName)
            showingBatchApproval = false
        }
    }

    private func exportQueueReport() {
        // Export queue report implementation
        print("Exporting queue report...")
    }
}

#Preview {
    NavigationView {
        ReimbursementQueueView()
    }
}
