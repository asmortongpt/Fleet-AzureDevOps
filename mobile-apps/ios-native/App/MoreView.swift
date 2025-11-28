import SwiftUI

// MARK: - Simple More View for initial app launch
struct MoreView: View {
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator
    @EnvironmentObject private var authManager: AuthenticationManager

    var body: some View {
        List {
            // User Profile Section
            Section {
                HStack(spacing: 16) {
                    Circle()
                        .fill(Color.blue.opacity(0.2))
                        .frame(width: 60, height: 60)
                        .overlay(
                            Text(authManager.currentUser?.name.prefix(2).uppercased() ?? "U")
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.blue)
                        )

                    VStack(alignment: .leading, spacing: 4) {
                        Text(authManager.currentUser?.name ?? "User")
                            .font(.headline)
                        Text(authManager.userRole.displayName)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    Spacer()
                }
                .padding(.vertical, 8)
            }

            Section("Account") {
                NavigationLink(destination: ProfileView()) {
                    Label("Profile", systemImage: "person.circle")
                }

                NavigationLink(destination: SettingsView()) {
                    Label("Settings", systemImage: "gearshape")
                }
            }

            // MARK: - Key Features Section
            Section("Key Features") {
                NavigationLink(destination: DamageReportView(vehicleId: "default")) {
                    Label("Report Damage", systemImage: "exclamationmark.triangle.fill")
                }

                NavigationLink(destination: IncidentReportView()) {
                    Label("Incident Reports", systemImage: "doc.text.fill")
                }

                NavigationLink(destination: VehicleReservationView()) {
                    Label("Vehicle Reservations", systemImage: "calendar.badge.clock")
                }

                NavigationLink(destination: FuelManagementView()) {
                    Label("Fuel Management", systemImage: "fuelpump.fill")
                }

                NavigationLink(destination: DriverManagementView()) {
                    Label("Driver Management", systemImage: "person.3.fill")
                }
            }

            Section("Inspections & Compliance") {
                NavigationLink(destination: VehicleInspectionScreenView(vehicleId: "default")) {
                    Label("Vehicle Inspection", systemImage: "checkmark.circle.fill")
                }

                NavigationLink(destination: Text("Checklist Management Coming Soon")) {
                    Label("Checklist Management", systemImage: "list.bullet.clipboard")
                }
            }

            Section("Diagnostics & Scanning") {
                NavigationLink(destination: CrashDetectionView()) {
                    Label("Crash Detection", systemImage: "antenna.radiowaves.left.and.right")
                }

                NavigationLink(destination: BarcodeScannerView()) {
                    Label("Barcode Scanner", systemImage: "barcode.viewfinder")
                }

                NavigationLink(destination: DocumentScannerView()) {
                    Label("Document Scanner", systemImage: "doc.viewfinder")
                }

                NavigationLink(destination: PhotoCaptureView()) {
                    Label("Photo Capture", systemImage: "camera.fill")
                }
            }

            Section("Maps & Navigation") {
                NavigationLink(destination: FleetMapView()) {
                    Label("Fleet Map", systemImage: "map.fill")
                }

                NavigationLink(destination: GeofencingView()) {
                    Label("Geofencing", systemImage: "mappin.circle")
                }

                NavigationLink(destination: MapNavigationView()) {
                    Label("Map Navigation", systemImage: "arrow.triangle.turn.up.right.circle")
                }
            }

            Section("Information") {
                NavigationLink(destination: HelpView()) {
                    Label("Help & Support", systemImage: "questionmark.circle")
                }

                NavigationLink(destination: AboutView()) {
                    Label("About", systemImage: "info.circle")
                }

                NavigationLink(destination: ReportsView()) {
                    Label("Reports", systemImage: "chart.bar.fill")
                }
            }

            Section {
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
