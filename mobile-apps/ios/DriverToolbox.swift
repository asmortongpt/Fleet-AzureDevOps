//
//  DriverToolbox.swift
//  Fleet Manager - Digital Driver Toolbox
//
//  Comprehensive driver dashboard with inspections, reports, HOS, and more
//

import SwiftUI
import CoreLocation
import Vision

// MARK: - Driver Toolbox Main View

struct DriverToolboxView: View {
    @StateObject private var viewModel = DriverToolboxViewModel()
    @State private var selectedTab = 0

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header with driver info
                DriverHeaderView(viewModel: viewModel)

                // Tab selector
                TabSelectorView(selectedTab: $selectedTab)

                // Content based on selected tab
                TabView(selection: $selectedTab) {
                    InspectionView(viewModel: viewModel)
                        .tag(0)

                    ReportsView(viewModel: viewModel)
                        .tag(1)

                    HOSLogsView(viewModel: viewModel)
                        .tag(2)

                    VehicleDocsView(viewModel: viewModel)
                        .tag(3)

                    SettingsView(viewModel: viewModel)
                        .tag(4)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
            }
            .navigationTitle("Driver Toolbox")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    SyncIndicatorView(viewModel: viewModel)
                }
            }
        }
        .onAppear {
            viewModel.loadData()
        }
    }
}

// MARK: - Driver Header

struct DriverHeaderView: View {
    @ObservedObject var viewModel: DriverToolboxViewModel

    var body: some View {
        VStack(spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(viewModel.driverName)
                        .font(.headline)
                    Text(viewModel.vehicleInfo)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(viewModel.isOnDuty ? Color.green : Color.gray)
                            .frame(width: 8, height: 8)
                        Text(viewModel.isOnDuty ? "On Duty" : "Off Duty")
                            .font(.caption)
                    }

                    Text(viewModel.hosRemaining)
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }
            .padding()

            // Quick stats
            HStack(spacing: 20) {
                StatCard(title: "Today's Miles", value: viewModel.todaysMiles)
                StatCard(title: "Pending Sync", value: "\(viewModel.pendingSyncCount)")
                StatCard(title: "Last Inspection", value: viewModel.lastInspection)
            }
            .padding(.horizontal)
        }
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.1), radius: 5, y: 2)
    }
}

struct StatCard: View {
    let title: String
    let value: String

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.system(.title2, design: .rounded).weight(.bold))
            Text(title)
                .font(.caption)
                .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(Color(.secondarySystemBackground))
        .cornerRadius(8)
    }
}

// MARK: - Tab Selector

struct TabSelectorView: View {
    @Binding var selectedTab: Int

    let tabs = ["Inspection", "Reports", "HOS", "Docs", "Settings"]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                ForEach(0..<tabs.count, id: \.self) { index in
                    Button(action: {
                        withAnimation {
                            selectedTab = index
                        }
                    }) {
                        Text(tabs[index])
                            .font(.subheadline.weight(.medium))
                            .foregroundColor(selectedTab == index ? .white : .primary)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(selectedTab == index ? Color.blue : Color(.tertiarySystemBackground))
                            .cornerRadius(20)
                    }
                }
            }
            .padding()
        }
    }
}

// MARK: - Inspection View

struct InspectionView: View {
    @ObservedObject var viewModel: DriverToolboxViewModel
    @State private var showingNewInspection = false

    var body: some View {
        VStack(spacing: 16) {
            // Quick actions
            HStack(spacing: 12) {
                QuickActionButton(
                    icon: "checkmark.circle",
                    title: "Pre-Trip",
                    color: .green
                ) {
                    viewModel.startInspection(type: "pre-trip")
                }

                QuickActionButton(
                    icon: "moon.circle",
                    title: "Post-Trip",
                    color: .orange
                ) {
                    viewModel.startInspection(type: "post-trip")
                }

                QuickActionButton(
                    icon: "calendar.circle",
                    title: "Daily",
                    color: .blue
                ) {
                    viewModel.startInspection(type: "daily")
                }
            }
            .padding()

            // Recent inspections
            List {
                Section(header: Text("Recent Inspections")) {
                    ForEach(viewModel.recentInspections) { inspection in
                        InspectionRowView(inspection: inspection)
                    }
                }
            }
            .listStyle(.insetGrouped)
        }
        .sheet(isPresented: $viewModel.showingInspection) {
            InspectionFormView(viewModel: viewModel)
        }
    }
}

struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 30))
                Text(title)
                    .font(.caption)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(color.opacity(0.1))
            .foregroundColor(color)
            .cornerRadius(12)
        }
    }
}

struct InspectionRowView: View {
    let inspection: InspectionItem

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(inspection.type.capitalized)
                    .font(.headline)
                Text(inspection.timestamp.formatted())
                    .font(.caption)
                    .foregroundColor(.gray)
            }

            Spacer()

            HStack(spacing: 8) {
                if inspection.syncStatus == .pending {
                    Image(systemName: "arrow.triangle.2.circlepath")
                        .foregroundColor(.orange)
                } else if inspection.syncStatus == .synced {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.green)
                }

                Image(systemName: "chevron.right")
                    .foregroundColor(.gray)
            }
        }
    }
}

// MARK: - Inspection Form View

struct InspectionFormView: View {
    @ObservedObject var viewModel: DriverToolboxViewModel
    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Vehicle Information")) {
                    Text("Vehicle: \(viewModel.vehicleInfo)")
                    Text("Odometer: \(viewModel.currentOdometer) mi")
                }

                Section(header: Text("Inspection Checklist")) {
                    ForEach(viewModel.checklistItems.indices, id: \.self) { index in
                        ChecklistItemRow(
                            item: viewModel.checklistItems[index],
                            isChecked: viewModel.checklistStatus[index]
                        ) { checked in
                            viewModel.checklistStatus[index] = checked
                        }
                    }
                }

                Section(header: Text("Photos")) {
                    Button(action: {
                        viewModel.addPhoto()
                    }) {
                        HStack {
                            Image(systemName: "camera")
                            Text("Add Photo")
                        }
                    }

                    ForEach(viewModel.inspectionPhotos, id: \.self) { photo in
                        Image(uiImage: UIImage(data: photo) ?? UIImage())
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(height: 100)
                    }
                }

                Section(header: Text("Notes")) {
                    TextEditor(text: $viewModel.inspectionNotes)
                        .frame(height: 100)
                }
            }
            .navigationTitle("Vehicle Inspection")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Submit") {
                        viewModel.submitInspection()
                        dismiss()
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }
}

struct ChecklistItemRow: View {
    let item: String
    let isChecked: Bool
    let onToggle: (Bool) -> Void

    var body: some View {
        HStack {
            Text(item)
            Spacer()
            Button(action: {
                onToggle(!isChecked)
            }) {
                Image(systemName: isChecked ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(isChecked ? .green : .gray)
                    .font(.title3)
            }
        }
    }
}

// MARK: - Reports View

struct ReportsView: View {
    @ObservedObject var viewModel: DriverToolboxViewModel

    var body: some View {
        VStack(spacing: 16) {
            // Report types
            HStack(spacing: 12) {
                ReportTypeButton(icon: "fuelpump.fill", title: "Fuel", color: .blue) {
                    viewModel.startReport(type: "fuel")
                }

                ReportTypeButton(icon: "dollarsign.circle", title: "Expense", color: .green) {
                    viewModel.startReport(type: "expense")
                }

                ReportTypeButton(icon: "wrench.fill", title: "Maintenance", color: .orange) {
                    viewModel.startReport(type: "maintenance")
                }

                ReportTypeButton(icon: "exclamationmark.triangle", title: "Incident", color: .red) {
                    viewModel.startReport(type: "incident")
                }
            }
            .padding()

            // Recent reports
            List {
                Section(header: Text("Recent Reports")) {
                    ForEach(viewModel.recentReports) { report in
                        ReportRowView(report: report)
                    }
                }
            }
            .listStyle(.insetGrouped)
        }
    }
}

struct ReportTypeButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 24))
                Text(title)
                    .font(.caption2)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(color.opacity(0.1))
            .foregroundColor(color)
            .cornerRadius(12)
        }
    }
}

struct ReportRowView: View {
    let report: ReportItem

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(report.type.capitalized)
                    .font(.headline)
                if let amount = report.amount {
                    Text("$\(amount, specifier: "%.2f")")
                        .font(.subheadline)
                        .foregroundColor(.green)
                }
                Text(report.timestamp.formatted())
                    .font(.caption)
                    .foregroundColor(.gray)
            }

            Spacer()

            if report.syncStatus == .pending {
                Image(systemName: "arrow.triangle.2.circlepath")
                    .foregroundColor(.orange)
            }
        }
    }
}

// MARK: - HOS Logs View

struct HOSLogsView: View {
    @ObservedObject var viewModel: DriverToolboxViewModel

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // HOS Status Cards
                VStack(spacing: 12) {
                    HOSStatusCard(
                        title: "Drive Time Remaining",
                        value: viewModel.driveTimeRemaining,
                        color: .blue
                    )

                    HOSStatusCard(
                        title: "On-Duty Remaining",
                        value: viewModel.onDutyRemaining,
                        color: .green
                    )

                    HOSStatusCard(
                        title: "Cycle Remaining",
                        value: viewModel.cycleRemaining,
                        color: .orange
                    )
                }
                .padding()

                // Duty status selector
                VStack(alignment: .leading, spacing: 12) {
                    Text("Change Status")
                        .font(.headline)
                        .padding(.horizontal)

                    HStack(spacing: 12) {
                        DutyStatusButton(status: "Off Duty", icon: "bed.double.fill", isActive: viewModel.currentStatus == "off") {
                            viewModel.changeDutyStatus("off")
                        }

                        DutyStatusButton(status: "Sleeper", icon: "moon.fill", isActive: viewModel.currentStatus == "sleeper") {
                            viewModel.changeDutyStatus("sleeper")
                        }

                        DutyStatusButton(status: "Driving", icon: "car.fill", isActive: viewModel.currentStatus == "driving") {
                            viewModel.changeDutyStatus("driving")
                        }

                        DutyStatusButton(status: "On Duty", icon: "person.fill", isActive: viewModel.currentStatus == "on") {
                            viewModel.changeDutyStatus("on")
                        }
                    }
                    .padding(.horizontal)
                }

                // Recent logs
                VStack(alignment: .leading, spacing: 12) {
                    Text("Today's Log")
                        .font(.headline)
                        .padding(.horizontal)

                    ForEach(viewModel.hosLogs) { log in
                        HOSLogRow(log: log)
                    }
                }
                .padding()
                .background(Color(.secondarySystemBackground))
                .cornerRadius(12)
                .padding()
            }
        }
    }
}

struct HOSStatusCard: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.gray)
                Text(value)
                    .font(.title2.weight(.bold))
                    .foregroundColor(color)
            }
            Spacer()
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(12)
    }
}

struct DutyStatusButton: View {
    let status: String
    let icon: String
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.title3)
                Text(status)
                    .font(.caption2)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(isActive ? Color.blue : Color(.tertiarySystemBackground))
            .foregroundColor(isActive ? .white : .primary)
            .cornerRadius(10)
        }
    }
}

struct HOSLogRow: View {
    let log: HOSLogItem

    var body: some View {
        HStack {
            Image(systemName: log.icon)
                .foregroundColor(log.color)
            VStack(alignment: .leading, spacing: 2) {
                Text(log.status)
                    .font(.subheadline.weight(.medium))
                Text(log.timestamp.formatted())
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            Spacer()
            Text(log.duration)
                .font(.caption)
                .foregroundColor(.gray)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
    }
}

// MARK: - Vehicle Docs View

struct VehicleDocsView: View {
    @ObservedObject var viewModel: DriverToolboxViewModel

    var body: some View {
        List {
            Section(header: Text("Vehicle Documents")) {
                ForEach(viewModel.vehicleDocs) { doc in
                    DocumentRow(document: doc)
                }
            }

            Section(header: Text("Driver Documents")) {
                ForEach(viewModel.driverDocs) { doc in
                    DocumentRow(document: doc)
                }
            }
        }
        .listStyle(.insetGrouped)
    }
}

struct DocumentRow: View {
    let document: DocumentItem

    var body: some View {
        HStack {
            Image(systemName: document.icon)
                .foregroundColor(document.color)
            VStack(alignment: .leading, spacing: 4) {
                Text(document.title)
                    .font(.subheadline)
                if let expiry = document.expiryDate {
                    Text("Expires: \(expiry.formatted())")
                        .font(.caption)
                        .foregroundColor(document.isExpiringSoon ? .red : .gray)
                }
            }
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundColor(.gray)
        }
    }
}

// MARK: - Settings View

struct SettingsView: View {
    @ObservedObject var viewModel: DriverToolboxViewModel

    var body: some View {
        Form {
            Section(header: Text("Sync")) {
                HStack {
                    Text("Auto Sync")
                    Spacer()
                    Toggle("", isOn: $viewModel.autoSyncEnabled)
                }

                Button("Sync Now") {
                    viewModel.forceSyncNow()
                }
            }

            Section(header: Text("Offline Storage")) {
                ForEach(viewModel.storageStats, id: \.key) { stat in
                    HStack {
                        Text(stat.key)
                        Spacer()
                        Text(stat.value)
                            .foregroundColor(.gray)
                    }
                }

                Button("Clear Offline Data") {
                    viewModel.clearOfflineData()
                }
                .foregroundColor(.red)
            }

            Section(header: Text("About")) {
                HStack {
                    Text("Version")
                    Spacer()
                    Text("1.0.0")
                        .foregroundColor(.gray)
                }
            }
        }
    }
}

// MARK: - Sync Indicator

struct SyncIndicatorView: View {
    @ObservedObject var viewModel: DriverToolboxViewModel

    var body: some View {
        HStack(spacing: 4) {
            if viewModel.isSyncing {
                ProgressView()
                    .scaleEffect(0.8)
            } else {
                Circle()
                    .fill(viewModel.isOnline ? Color.green : Color.gray)
                    .frame(width: 8, height: 8)
            }
        }
    }
}

// MARK: - View Model

class DriverToolboxViewModel: ObservableObject {
    private let storage = OfflineStorageManager.shared
    private let syncService = SyncService.shared

    @Published var driverName = "John Driver"
    @Published var vehicleInfo = "Truck #1234"
    @Published var isOnDuty = true
    @Published var hosRemaining = "8h 30m"
    @Published var todaysMiles = "245"
    @Published var pendingSyncCount = 0
    @Published var lastInspection = "2h ago"

    @Published var recentInspections: [InspectionItem] = []
    @Published var recentReports: [ReportItem] = []
    @Published var hosLogs: [HOSLogItem] = []
    @Published var vehicleDocs: [DocumentItem] = []
    @Published var driverDocs: [DocumentItem] = []

    @Published var showingInspection = false
    @Published var checklistItems = ["Tires", "Lights", "Brakes", "Fluid Levels", "Mirrors", "Horn"]
    @Published var checklistStatus = [false, false, false, false, false, false]
    @Published var inspectionNotes = ""
    @Published var inspectionPhotos: [Data] = []
    @Published var currentOdometer = "125,430"

    @Published var driveTimeRemaining = "8h 15m"
    @Published var onDutyRemaining = "10h 45m"
    @Published var cycleRemaining = "45h 30m"
    @Published var currentStatus = "driving"

    @Published var autoSyncEnabled = true
    @Published var storageStats: [(key: String, value: String)] = []
    @Published var isSyncing = false
    @Published var isOnline = true

    func loadData() {
        loadInspections()
        loadReports()
        loadHOSLogs()
        loadDocuments()
        updateStorageStats()
        updateSyncStatus()
    }

    func loadInspections() {
        let records = storage.getInspections()
        recentInspections = records.prefix(10).map { record in
            InspectionItem(
                id: record.id,
                type: record.inspectionType,
                timestamp: Date(timeIntervalSince1970: TimeInterval(record.timestamp)),
                syncStatus: record.syncStatus
            )
        }
    }

    func loadReports() {
        let records = storage.getReports()
        recentReports = records.prefix(10).map { record in
            ReportItem(
                id: record.id,
                type: record.reportType,
                timestamp: Date(timeIntervalSince1970: TimeInterval(record.timestamp)),
                amount: record.amount,
                syncStatus: record.syncStatus
            )
        }
    }

    func loadHOSLogs() {
        hosLogs = [
            HOSLogItem(id: "1", status: "Driving", timestamp: Date(), duration: "2h 30m", icon: "car.fill", color: .blue),
            HOSLogItem(id: "2", status: "On Duty", timestamp: Date().addingTimeInterval(-10800), duration: "1h 15m", icon: "person.fill", color: .green),
            HOSLogItem(id: "3", status: "Off Duty", timestamp: Date().addingTimeInterval(-18000), duration: "8h 00m", icon: "bed.double.fill", color: .gray)
        ]
    }

    func loadDocuments() {
        vehicleDocs = [
            DocumentItem(id: "1", title: "Registration", expiryDate: Date().addingTimeInterval(7776000), icon: "doc.text", color: .blue),
            DocumentItem(id: "2", title: "Insurance", expiryDate: Date().addingTimeInterval(15552000), icon: "shield", color: .green),
            DocumentItem(id: "3", title: "Inspection Report", expiryDate: Date().addingTimeInterval(2592000), icon: "checkmark.seal", color: .orange)
        ]

        driverDocs = [
            DocumentItem(id: "4", title: "CDL License", expiryDate: Date().addingTimeInterval(31536000), icon: "person.text.rectangle", color: .blue),
            DocumentItem(id: "5", title: "Medical Card", expiryDate: Date().addingTimeInterval(15552000), icon: "cross.case", color: .red)
        ]
    }

    func updateStorageStats() {
        let stats = storage.getStorageStats()
        storageStats = [
            (key: "Inspections", value: "\(stats["inspections_total"] ?? 0)"),
            (key: "Reports", value: "\(stats["reports_total"] ?? 0)"),
            (key: "Photos", value: "\(stats["photos_total"] ?? 0)"),
            (key: "Database Size", value: String(format: "%.1f MB", stats["database_size_mb"] as? Double ?? 0))
        ]
    }

    func updateSyncStatus() {
        let stats = storage.getStorageStats()
        pendingSyncCount = (stats["inspections_pending"] as? Int ?? 0) +
                          (stats["reports_pending"] as? Int ?? 0) +
                          (stats["photos_pending"] as? Int ?? 0)
    }

    func startInspection(type: String) {
        showingInspection = true
        checklistStatus = [false, false, false, false, false, false]
        inspectionNotes = ""
        inspectionPhotos = []
    }

    func submitInspection() {
        let checklistData = Dictionary(uniqueKeysWithValues: zip(checklistItems, checklistStatus))

        let inspection = InspectionRecord(
            id: UUID().uuidString,
            vehicleId: "V1234",
            driverId: "D5678",
            timestamp: Date(),
            inspectionType: "pre-trip",
            checklistData: checklistData,
            notes: inspectionNotes.isEmpty ? nil : inspectionNotes,
            photoIds: [],
            syncStatus: .pending,
            lastModified: Date()
        )

        _ = storage.saveInspection(inspection)
        loadInspections()
        updateSyncStatus()
    }

    func addPhoto() {
        // Trigger camera/photo picker
    }

    func startReport(type: String) {
        // Show report form
    }

    func changeDutyStatus(_ status: String) {
        currentStatus = status
        isOnDuty = status == "driving" || status == "on"
    }

    func forceSyncNow() {
        isSyncing = true
        syncService.forceSyncNow()

        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            self.isSyncing = false
            self.updateSyncStatus()
        }
    }

    func clearOfflineData() {
        storage.clearAllData()
        loadData()
    }
}

// MARK: - Data Models

struct InspectionItem: Identifiable {
    let id: String
    let type: String
    let timestamp: Date
    let syncStatus: SyncStatus
}

struct ReportItem: Identifiable {
    let id: String
    let type: String
    let timestamp: Date
    let amount: Double?
    let syncStatus: SyncStatus
}

struct HOSLogItem: Identifiable {
    let id: String
    let status: String
    let timestamp: Date
    let duration: String
    let icon: String
    let color: Color
}

struct DocumentItem: Identifiable {
    let id: String
    let title: String
    let expiryDate: Date?
    let icon: String
    let color: Color

    var isExpiringSoon: Bool {
        guard let expiry = expiryDate else { return false }
        return expiry.timeIntervalSinceNow < 2592000 // 30 days
    }
}
