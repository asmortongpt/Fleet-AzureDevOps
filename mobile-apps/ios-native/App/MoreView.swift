import SwiftUI

// Placeholder for ChecklistViewModel
class ChecklistViewModel: ObservableObject {
    @Published var pendingChecklists: [String] = []
}

// Placeholder for RoleManager
class RoleManager: ObservableObject {
    static let shared = RoleManager()

    var currentRole: UserRole = .driver

    func getRoleBadge() -> (color: String, icon: String) {
        return ("blue", "person")
    }

    func hasPermission(_ permission: Permission) -> Bool {
        return true
    }

    func shouldShowFeature(_ feature: MoreViewFeature) -> Bool {
        return true
    }
}

enum UserRole {
    case driver
    case manager
    case admin

    var displayName: String {
        switch self {
        case .driver: return "Driver"
        case .manager: return "Manager"
        case .admin: return "Admin"
        }
    }

    var description: String {
        switch self {
        case .driver: return "Fleet Driver"
        case .manager: return "Fleet Manager"
        case .admin: return "System Administrator"
        }
    }

    var icon: String {
        switch self {
        case .driver: return "person"
        case .manager: return "person.2"
        case .admin: return "person.3"
        }
    }
}

enum Permission {
    case vehicleViewOwn
    case vehicleViewGlobal
    case fuelTransactionCreateOwn
    case userManagement
}

enum MoreViewFeature {
    case captureReceipts
    case reportDamage
    case reserveVehicles
    case navigation
    case vehicleAssignment
    case scheduling
    case userManagement
    case vehicleDiagnostics
}

struct MoreView: View {
    @StateObject private var checklistViewModel = ChecklistViewModel()
    @ObservedObject private var roleManager = RoleManager.shared
    @State private var pendingChecklistCount: Int = 0

    var body: some View {
        NavigationView {
            List {
                // Role Badge Section
                Section {
                    HStack {
                        Image(systemName: roleManager.currentRole.icon)
                            .foregroundColor(roleColorFromString(roleManager.getRoleBadge().color))
                            .font(.title2)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(roleManager.currentRole.displayName)
                                .font(.headline)
                            Text(roleManager.currentRole.description)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(.gray)
                            .font(.caption)
                    }
                    .padding(.vertical, 4)
                }

                // Mobile Actions Section (Driver-level features)
                if roleManager.hasPermission(.vehicleViewOwn) || roleManager.hasPermission(.fuelTransactionCreateOwn) {
                    Section(header: Text("Mobile Actions")) {
                        // Push-To-Talk Radio
                        NavigationLink(destination: NavigationDestinationView(destination: .pushToTalk)) {
                            HStack {
                                Image(systemName: "radio.fill")
                                    .foregroundColor(.blue)
                                    .frame(width: 30)
                                VStack(alignment: .leading) {
                                    Text("Push-To-Talk Radio")
                                        .font(.body)
                                    Text("Dispatch radio communication")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }

                        if roleManager.shouldShowFeature(.captureReceipts) {
                            NavigationLink(destination: ReceiptCaptureView()) {
                                HStack {
                                    Image(systemName: "doc.text.viewfinder")
                                        .foregroundColor(.green)
                                        .frame(width: 30)
                                    VStack(alignment: .leading) {
                                        Text("Capture Receipt")
                                            .font(.body)
                                        Text("Scan fuel & maintenance receipts")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                            }
                        }

                        if roleManager.shouldShowFeature(.reportDamage) {
                            NavigationLink(destination: DamageReportView(vehicleId: "")) {
                                HStack {
                                    Image(systemName: "exclamationmark.triangle.fill")
                                        .foregroundColor(.orange)
                                        .frame(width: 30)
                                    VStack(alignment: .leading) {
                                        Text("Report Damage")
                                            .font(.body)
                                        Text("Photos, videos, or 3D LiDAR scans")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                            }
                        }

                        if roleManager.shouldShowFeature(.reserveVehicles) {
                            NavigationLink(destination: VehicleRequestView()) {
                                HStack {
                                    Image(systemName: "car.fill")
                                        .foregroundColor(.blue)
                                        .frame(width: 30)
                                    VStack(alignment: .leading) {
                                        Text("Request Vehicle")
                                            .font(.body)
                                        Text("Book vehicles or request via Microsoft")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                            }
                        }

                        if roleManager.shouldShowFeature(.navigation) {
                            NavigationLink(destination: MapNavigationView()) {
                                HStack {
                                    Image(systemName: "map.fill")
                                        .foregroundColor(.red)
                                        .frame(width: 30)
                                    VStack(alignment: .leading) {
                                        Text("Navigation")
                                            .font(.body)
                                        Text("Directions, traffic & route planning")
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                            }
                        }

                        // Crash Detection - Available to all drivers
                        NavigationLink(destination: CrashDetectionView()) {
                            HStack {
                                Image(systemName: "exclamationmark.shield.fill")
                                    .foregroundColor(.red)
                                    .frame(width: 30)
                                VStack(alignment: .leading) {
                                    Text("Crash Detection")
                                        .font(.body)
                                    Text("Automatic emergency response")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                }

                // Management Section (Role-based features)
                Section(header: Text("Management")) {
                    if roleManager.shouldShowFeature(.vehicleAssignment) {
                        NavigationLink(destination: VehicleIdentificationView()) {
                            HStack {
                                Image(systemName: "car.circle")
                                    .foregroundColor(.blue)
                                    .frame(width: 30)
                                VStack(alignment: .leading) {
                                    Text("Vehicle Assignment")
                                        .font(.body)
                                    Text("Scan VIN, plate, or QR code")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }

                    // Checklists - Always visible (internal feature)
                    NavigationLink(destination: Text("Checklists - Coming Soon")) {
                        HStack {
                            Image(systemName: "checklist")
                                .foregroundColor(.purple)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Checklists")
                                    .font(.body)
                                Text("Smart location-based checklists")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            if checklistViewModel.pendingChecklists.count > 0 {
                                Text("\(checklistViewModel.pendingChecklists.count)")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.red)
                                    .cornerRadius(10)
                            }
                        }
                    }

                    if roleManager.shouldShowFeature(.scheduling) {
                        NavigationLink(destination: ScheduleView()) {
                            HStack {
                                Image(systemName: "calendar")
                                    .foregroundColor(.green)
                                    .frame(width: 30)
                                VStack(alignment: .leading) {
                                    Text("Schedule")
                                        .font(.body)
                                    Text("Shifts, maintenance & appointments")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }

                    if roleManager.shouldShowFeature(.userManagement) {
                        NavigationLink(destination: DriverManagementView()) {
                            HStack {
                                Image(systemName: "person.2.fill")
                                    .foregroundColor(.purple)
                                    .frame(width: 30)
                                VStack(alignment: .leading) {
                                    Text("Drivers")
                                        .font(.body)
                                    Text("Manage drivers and assignments")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }

                    if roleManager.shouldShowFeature(.vehicleDiagnostics) {
                        NavigationLink(destination: DeviceManagementView()) {
                            HStack {
                                Image(systemName: "antenna.radiowaves.left.and.right")
                                    .foregroundColor(.orange)
                                    .frame(width: 30)
                                VStack(alignment: .leading) {
                                    Text("Device Management")
                                        .font(.body)
                                    Text("OBD2 devices & emulator")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }

                    // Vehicle Idling Monitor - Available to managers and admins
                    if roleManager.hasPermission(.vehicleViewGlobal) {
                        NavigationLink(destination: VehicleIdlingView()) {
                            HStack {
                                Image(systemName: "gauge.with.dots.needle.bottom.50percent")
                                    .foregroundColor(.red)
                                    .frame(width: 30)
                                VStack(alignment: .leading) {
                                    Text("Idling Monitor")
                                        .font(.body)
                                    Text("Track fuel waste & emissions")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                }

                // Settings Section
                Section(header: Text("Settings")) {
                    NavigationLink(destination: ProfileView()) {
                        HStack {
                            Image(systemName: "person.circle.fill")
                                .foregroundColor(.blue)
                                .frame(width: 30)
                            Text("Profile")
                        }
                    }

                    NavigationLink(destination: NotificationsView()) {
                        HStack {
                            Image(systemName: "bell.fill")
                                .foregroundColor(.orange)
                                .frame(width: 30)
                            Text("Notifications")
                        }
                    }

                    NavigationLink(destination: AppearanceSettingsView()) {
                        HStack {
                            Image(systemName: "paintbrush.fill")
                                .foregroundColor(.purple)
                                .frame(width: 30)
                            Text("Appearance")
                        }
                    }
                }

                // About Section
                Section(header: Text("About")) {
                    NavigationLink(destination: AboutView()) {
                        HStack {
                            Image(systemName: "info.circle.fill")
                                .foregroundColor(.blue)
                                .frame(width: 30)
                            Text("App Info")
                        }
                    }

                    NavigationLink(destination: HelpView()) {
                        HStack {
                            Image(systemName: "questionmark.circle.fill")
                                .foregroundColor(.green)
                                .frame(width: 30)
                            Text("Help & Support")
                        }
                    }
                }

                // Sign Out Section
                Section {
                    Button(action: {
                        Task {
                            await AuthenticationManager.shared.logout()
                        }
                    }) {
                        HStack {
                            Image(systemName: "arrow.right.square.fill")
                                .foregroundColor(.red)
                                .frame(width: 30)
                            Text("Sign Out")
                                .foregroundColor(.red)
                        }
                    }
                }
            }
            .navigationTitle("More")
            .listStyle(InsetGroupedListStyle())
        }
    }

    // Helper function to convert color string to SwiftUI Color
    private func roleColorFromString(_ colorString: String) -> Color {
        switch colorString.lowercased() {
        case "blue": return .blue
        case "purple": return .purple
        case "orange": return .orange
        case "green": return .green
        case "red": return .red
        case "yellow": return .yellow
        case "indigo": return .indigo
        case "gray": return .gray
        case "brown": return .brown
        default: return .blue
        }
    }
}

// MARK: - Placeholder Views (inline to avoid project configuration issues)

struct NavigationDestinationView: View {
    enum Destination {
        case pushToTalk
    }
    let destination: Destination
    var body: some View {
        Text("Push-To-Talk Coming Soon").navigationTitle("Radio")
    }
}

struct ReceiptCaptureView: View {
    var body: some View {
        Text("Receipt Capture Coming Soon").navigationTitle("Capture Receipt")
    }
}

struct DamageReportView: View {
    let vehicleId: String
    var body: some View {
        Text("Damage Report Coming Soon").navigationTitle("Report Damage")
    }
}

struct VehicleRequestView: View {
    var body: some View {
        Text("Vehicle Request Coming Soon").navigationTitle("Request Vehicle")
    }
}

struct MapNavigationView: View {
    var body: some View {
        Text("Navigation Coming Soon").navigationTitle("Navigation")
    }
}

struct CrashDetectionView: View {
    var body: some View {
        Text("Crash Detection Coming Soon").navigationTitle("Crash Detection")
    }
}

struct VehicleIdentificationView: View {
    var body: some View {
        Text("Vehicle Assignment Coming Soon").navigationTitle("Vehicle Assignment")
    }
}

struct ScheduleView: View {
    var body: some View {
        Text("Schedule Coming Soon").navigationTitle("Schedule")
    }
}

struct DeviceManagementView: View {
    var body: some View {
        Text("Device Management Coming Soon").navigationTitle("Device Management")
    }
}

struct VehicleIdlingView: View {
    var body: some View {
        Text("Idling Monitor Coming Soon").navigationTitle("Idling Monitor")
    }
}

struct AppearanceSettingsView: View {
    var body: some View {
        Text("Appearance Settings Coming Soon").navigationTitle("Appearance")
    }
}

#Preview {
    MoreView()
}
