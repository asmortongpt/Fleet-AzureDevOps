import SwiftUI

// MARK: - Compact More View - Mobile-First Optimized
struct MoreView: View {
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator
    @EnvironmentObject private var authManager: AuthenticationManager

    var body: some View {
        List {
            // User Profile Section (Compact)
            Section {
                HStack(spacing: 12) {
                    Circle()
                        .fill(Color.blue.opacity(0.2))
                        .frame(width: 50, height: 50)
                        .overlay(
                            Text(authManager.currentUser?.name.prefix(2).uppercased() ?? "U")
                                .font(.headline)
                                .fontWeight(.semibold)
                                .foregroundColor(.blue)
                        )

                    VStack(alignment: .leading, spacing: 2) {
                        Text(authManager.currentUser?.name ?? "User")
                            .font(.subheadline.bold())
                        Text(authManager.userRole.displayName)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Spacer()
                }
                .padding(.vertical, 4)
            }

            // Account + Essential Features (Combined)
            Section("Account & Features") {
                NavigationLink(destination: ProfileView()) {
                    Label("Profile", systemImage: "person.circle")
                }

                NavigationLink(destination: SettingsView()) {
                    Label("Settings", systemImage: "gearshape")
                }

                NavigationLink(destination: DamageReportView()) {
                    Label("Report Damage", systemImage: "exclamationmark.triangle.fill")
                }

                NavigationLink(destination: VehicleInspectionScreenView()) {
                    Label("Vehicle Inspection", systemImage: "checkmark.circle.fill")
                }
            }

            // Fleet Management (Consolidated)
            Section("Fleet Management") {
                NavigationLink(destination: IncidentReportView()) {
                    Label("Incident Reports", systemImage: "doc.text.fill")
                }

                NavigationLink(destination: VehicleReservationView()) {
                    Label("Reservations", systemImage: "calendar.badge.clock")
                }

                NavigationLink(destination: FuelManagementView()) {
                    Label("Fuel Management", systemImage: "fuelpump.fill")
                }

                NavigationLink(destination: DriverManagementView()) {
                    Label("Driver Management", systemImage: "person.3.fill")
                }
            }

            // Tools (Consolidated from Diagnostics & Maps)
            Section("Tools") {
                NavigationLink(destination: FleetMapView()) {
                    Label("Fleet Map", systemImage: "map.fill")
                }

                NavigationLink(destination: BarcodeScannerView(onScan: { _, _ in })) {
                    Label("Barcode Scanner", systemImage: "barcode.viewfinder")
                }

                NavigationLink(destination: DocumentScannerView(
                    documentType: .general,
                    onComplete: { _ in },
                    onCancel: {}
                )) {
                    Label("Document Scanner", systemImage: "doc.viewfinder")
                }

                NavigationLink(destination: PhotoCaptureView(onComplete: { _ in })) {
                    Label("Photo Capture", systemImage: "camera.fill")
                }
            }

            // Info & Sign Out
            Section {
                NavigationLink(destination: ReportsView()) {
                    Label("Reports", systemImage: "chart.bar.fill")
                }

                NavigationLink(destination: HelpView()) {
                    Label("Help & Support", systemImage: "questionmark.circle")
                }

                Button(action: {
                    Task {
                        await authManager.logout()
                    }
                }) {
                    Label("Sign Out", systemImage: "arrow.right.square")
                        .foregroundColor(.red)
                }
            }
        }
        .listStyle(.insetGrouped)
        .navigationTitle("More")
    }
}

// MARK: - Preview
struct MoreView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            MoreView()
                .environmentObject(NavigationCoordinator())
                .environmentObject(AuthenticationManager.shared)
        }
    }
}
