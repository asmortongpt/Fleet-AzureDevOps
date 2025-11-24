import SwiftUI

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
                    NavigationLink(destination: ChecklistManagementView()) {
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

#Preview {
    MoreView()
}
