import SwiftUI

struct ShiftSwapView: View {
    @ObservedObject var viewModel: ShiftManagementViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var selectedTab: SwapTab = .pending
    @State private var showingCreateRequest = false
    @State private var selectedRequest: ShiftSwapRequest?

    enum SwapTab: String, CaseIterable {
        case pending = "Pending"
        case approved = "Approved"
        case rejected = "Rejected"
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Tab Picker
                Picker("Tab", selection: $selectedTab) {
                    ForEach(SwapTab.allCases, id: \.self) { tab in
                        Text(tab.rawValue).tag(tab)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                // Swap Requests List
                ScrollView {
                    LazyVStack(spacing: 12) {
                        if filteredRequests.isEmpty {
                            emptyStateView
                        } else {
                            ForEach(filteredRequests) { request in
                                SwapRequestCard(request: request)
                                    .onTapGesture {
                                        selectedRequest = request
                                    }
                                    .contextMenu {
                                        if request.status == .pending {
                                            Button {
                                                approveRequest(request)
                                            } label: {
                                                Label("Approve", systemImage: "checkmark.circle")
                                            }

                                            Button(role: .destructive) {
                                                selectedRequest = request
                                            } label: {
                                                Label("Reject", systemImage: "xmark.circle")
                                            }
                                        }
                                    }
                            }
                        }
                    }
                    .padding()
                }
                .refreshable {
                    await viewModel.loadPendingSwapRequests()
                }
            }
            .navigationTitle("Shift Swaps")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingCreateRequest = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                    }
                }
            }
            .sheet(isPresented: $showingCreateRequest) {
                CreateSwapRequestView(viewModel: viewModel)
            }
            .sheet(item: $selectedRequest) { request in
                SwapRequestDetailView(request: request, viewModel: viewModel)
            }
            .task {
                await viewModel.loadPendingSwapRequests()
            }
        }
    }

    // MARK: - Empty State View
    private var emptyStateView: some View {
        VStack(spacing: 16) {
            Image(systemName: "arrow.left.arrow.right.circle")
                .font(.system(size: 48))
                .foregroundColor(.gray)

            Text("No \(selectedTab.rawValue) Requests")
                .font(.headline)
                .foregroundColor(.secondary)

            if selectedTab == .pending {
                Text("Tap + to create a swap request")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 60)
    }

    // MARK: - Computed Properties
    private var filteredRequests: [ShiftSwapRequest] {
        switch selectedTab {
        case .pending:
            return viewModel.shiftSwapRequests.filter { $0.status == .pending }
        case .approved:
            return viewModel.shiftSwapRequests.filter { $0.status == .approved }
        case .rejected:
            return viewModel.shiftSwapRequests.filter { $0.status == .rejected }
        }
    }

    // MARK: - Actions
    private func approveRequest(_ request: ShiftSwapRequest) {
        Task {
            try? await viewModel.approveShiftSwap(request)
        }
    }
}

// MARK: - Swap Request Card
struct SwapRequestCard: View {
    let request: ShiftSwapRequest

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: request.status.icon)
                    .foregroundColor(request.statusColor)

                VStack(alignment: .leading, spacing: 2) {
                    if let requestingDriver = request.requestingDriverName {
                        Text(requestingDriver)
                            .font(.headline)
                    }

                    Text("Requested \(formatDate(request.requestDate))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Text(request.status.displayName)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(request.statusColor.opacity(0.2))
                    .foregroundColor(request.statusColor)
                    .cornerRadius(8)
            }

            Divider()

            if let targetDriver = request.targetDriverName {
                HStack {
                    Image(systemName: "arrow.right")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text("Swap with: \(targetDriver)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            if let reason = request.reason {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "quote.bubble")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(reason)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
            }

            if request.status == .approved, let approvalDate = request.approvalDate {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.caption)
                        .foregroundColor(.green)

                    Text("Approved on \(formatDate(approvalDate))")
                        .font(.caption)
                        .foregroundColor(.green)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }

    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Create Swap Request View
struct CreateSwapRequestView: View {
    @ObservedObject var viewModel: ShiftManagementViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var selectedShiftId: String = ""
    @State private var selectedTargetDriverId: String = ""
    @State private var reason: String = ""
    @State private var showingError = false
    @State private var errorMessage = ""

    // Sample upcoming shifts
    private var upcomingShifts: [Shift] {
        viewModel.shifts.filter { shift in
            shift.status == .scheduled && shift.startTime > Date()
        }
    }

    // Sample drivers
    @State private var drivers: [(id: String, name: String)] = [
        ("driver-1", "John Smith"),
        ("driver-2", "Jane Doe"),
        ("driver-3", "Bob Johnson")
    ]

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Select Shift")) {
                    if upcomingShifts.isEmpty {
                        Text("No upcoming shifts available")
                            .foregroundColor(.secondary)
                    } else {
                        Picker("Shift", selection: $selectedShiftId) {
                            Text("Select Shift").tag("")
                            ForEach(upcomingShifts) { shift in
                                VStack(alignment: .leading) {
                                    if let vehicleName = shift.vehicleName {
                                        Text(vehicleName)
                                    }
                                    Text(dateFormatter.string(from: shift.startTime))
                                        .font(.caption)
                                }
                                .tag(shift.id)
                            }
                        }
                    }
                }

                Section(header: Text("Swap With")) {
                    Picker("Driver", selection: $selectedTargetDriverId) {
                        Text("Any Available Driver").tag("")
                        ForEach(drivers, id: \.id) { driver in
                            Text(driver.name).tag(driver.id)
                        }
                    }
                }

                Section(header: Text("Reason")) {
                    TextEditor(text: $reason)
                        .frame(height: 100)
                }

                Section {
                    Button("Request Swap") {
                        createSwapRequest()
                    }
                    .disabled(!isValid)
                    .frame(maxWidth: .infinity)
                }
            }
            .navigationTitle("Request Shift Swap")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .alert("Error", isPresented: $showingError) {
                Button("OK") { }
            } message: {
                Text(errorMessage)
            }
        }
    }

    private var isValid: Bool {
        !selectedShiftId.isEmpty && !reason.isEmpty
    }

    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }()

    private func createSwapRequest() {
        Task {
            do {
                try await viewModel.requestShiftSwap(
                    originalShiftId: selectedShiftId,
                    targetDriverId: selectedTargetDriverId.isEmpty ? nil : selectedTargetDriverId,
                    targetShiftId: nil,
                    reason: reason
                )
                dismiss()
            } catch {
                errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }
}

// MARK: - Swap Request Detail View
struct SwapRequestDetailView: View {
    let request: ShiftSwapRequest
    @ObservedObject var viewModel: ShiftManagementViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var showingRejectDialog = false
    @State private var rejectionReason = ""

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Status Header
                    VStack(spacing: 12) {
                        Image(systemName: request.status.icon)
                            .font(.system(size: 48))
                            .foregroundColor(request.statusColor)

                        Text(request.status.displayName)
                            .font(.title2)
                            .bold()

                        Text("Requested \(formatDate(request.requestDate))")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(request.statusColor.opacity(0.1))
                    .cornerRadius(12)

                    // Request Details
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Request Details")
                            .font(.headline)

                        if let requestingDriver = request.requestingDriverName {
                            InfoRow(label: "Requesting Driver", value: requestingDriver)
                        }

                        if let targetDriver = request.targetDriverName {
                            InfoRow(label: "Target Driver", value: targetDriver)
                        }

                        if let reason = request.reason {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Reason")
                                    .font(.caption)
                                    .foregroundColor(.secondary)

                                Text(reason)
                                    .font(.body)
                            }
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(color: Color.black.opacity(0.1), radius: 5)

                    // Shift Details
                    if let originalShift = request.originalShift {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Original Shift")
                                .font(.headline)

                            ShiftCard(shift: originalShift)
                        }
                    }

                    // Actions
                    if request.status == .pending {
                        VStack(spacing: 12) {
                            Button {
                                approveRequest()
                            } label: {
                                HStack {
                                    Image(systemName: "checkmark.circle.fill")
                                    Text("Approve Request")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                            }

                            Button {
                                showingRejectDialog = true
                            } label: {
                                HStack {
                                    Image(systemName: "xmark.circle.fill")
                                    Text("Reject Request")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.red)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                            }
                        }
                    }

                    // Approval/Rejection Info
                    if request.status == .approved, let approvalDate = request.approvalDate {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Approval Information")
                                .font(.headline)

                            InfoRow(label: "Approved On", value: dateFormatter.string(from: approvalDate))

                            if let approvedBy = request.approvedBy {
                                InfoRow(label: "Approved By", value: approvedBy)
                            }
                        }
                        .padding()
                        .background(Color.green.opacity(0.1))
                        .cornerRadius(12)
                    }
                }
                .padding()
            }
            .navigationTitle("Swap Request")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .alert("Reject Request", isPresented: $showingRejectDialog) {
                TextField("Reason", text: $rejectionReason)
                Button("Cancel", role: .cancel) { }
                Button("Reject", role: .destructive) {
                    rejectRequest()
                }
            } message: {
                Text("Please provide a reason for rejecting this swap request.")
            }
        }
    }

    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter
    }()

    private func formatDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        return formatter.localizedString(for: date, relativeTo: Date())
    }

    private func approveRequest() {
        Task {
            try? await viewModel.approveShiftSwap(request)
            dismiss()
        }
    }

    private func rejectRequest() {
        Task {
            try? await viewModel.rejectShiftSwap(request, reason: rejectionReason)
            dismiss()
        }
    }
}

// MARK: - Preview
struct ShiftSwapView_Previews: PreviewProvider {
    static var previews: some View {
        ShiftSwapView(viewModel: ShiftManagementViewModel())
    }
}
