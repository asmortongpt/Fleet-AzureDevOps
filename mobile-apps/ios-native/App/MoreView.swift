import SwiftUI

struct MoreView: View {
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator

    var body: some View {
        NavigationView {
            List {
                // MARK: - Data Capture & Documentation
                Section(header: Text("Data Capture & Documentation")) {
                    NavigationLink(destination: VehicleInspectionView()) {
                        FeatureRow(
                            icon: "checklist",
                            iconColor: .blue,
                            title: "Vehicle Inspection",
                            subtitle: "Complete pre-trip and post-trip inspections"
                        )
                    }

                    NavigationLink(destination: PhotoCaptureView()) {
                        FeatureRow(
                            icon: "camera.fill",
                            iconColor: .purple,
                            title: "Photo Capture",
                            subtitle: "Capture photos for inspections and incidents"
                        )
                    }

                    NavigationLink(destination: VideoCaptureView()) {
                        FeatureRow(
                            icon: "video.fill",
                            iconColor: .red,
                            title: "Video Recording",
                            subtitle: "Record video documentation"
                        )
                    }

                    NavigationLink(destination: BarcodeScannerView()) {
                        FeatureRow(
                            icon: "barcode.viewfinder",
                            iconColor: .orange,
                            title: "Barcode Scanner",
                            subtitle: "Scan barcodes and QR codes"
                        )
                    }

                    NavigationLink(destination: VINScannerView()) {
                        FeatureRow(
                            icon: "doc.text.viewfinder",
                            iconColor: .indigo,
                            title: "VIN Scanner",
                            subtitle: "Scan vehicle identification numbers"
                        )
                    }

                    NavigationLink(destination: DocumentScannerView()) {
                        FeatureRow(
                            icon: "doc.text.magnifyingglass",
                            iconColor: .green,
                            title: "Document Scanner",
                            subtitle: "Scan and digitize documents"
                        )
                    }

                    NavigationLink(destination: ReceiptCaptureView()) {
                        FeatureRow(
                            icon: "receipt.fill",
                            iconColor: .cyan,
                            title: "Receipt Capture",
                            subtitle: "Capture fuel and maintenance receipts"
                        )
                    }

                    NavigationLink(destination: SignaturePadView()) {
                        FeatureRow(
                            icon: "signature",
                            iconColor: .brown,
                            title: "Digital Signature",
                            subtitle: "Capture digital signatures"
                        )
                    }

                    NavigationLink(destination: DamageReportView()) {
                        FeatureRow(
                            icon: "exclamationmark.triangle.fill",
                            iconColor: .orange,
                            title: "Damage Report",
                            subtitle: "Document vehicle damage"
                        )
                    }

                    NavigationLink(destination: IncidentReportView()) {
                        FeatureRow(
                            icon: "exclamationmark.octagon.fill",
                            iconColor: .red,
                            title: "Incident Report",
                            subtitle: "Report accidents and incidents"
                        )
                    }
                }

                // MARK: - Trip & Location Tracking
                Section(header: Text("Trip & Location Tracking")) {
                    NavigationLink(destination: TripTrackingView()) {
                        FeatureRow(
                            icon: "location.fill",
                            iconColor: .blue,
                            title: "Trip Tracking",
                            subtitle: "Track trips with GPS"
                        )
                    }

                    NavigationLink(destination: EnhancedTripTrackingView()) {
                        FeatureRow(
                            icon: "map.fill",
                            iconColor: .green,
                            title: "Enhanced Trip Tracking",
                            subtitle: "Advanced trip tracking and analytics"
                        )
                    }

                    NavigationLink(destination: StartTripView()) {
                        FeatureRow(
                            icon: "play.circle.fill",
                            iconColor: .green,
                            title: "Start Trip",
                            subtitle: "Quick trip start"
                        )
                    }

                    NavigationLink(destination: TripHistoryView()) {
                        FeatureRow(
                            icon: "clock.fill",
                            iconColor: .purple,
                            title: "Trip History",
                            subtitle: "View past trips and routes"
                        )
                    }

                    NavigationLink(destination: GeofencingView()) {
                        FeatureRow(
                            icon: "circle.dotted",
                            iconColor: .cyan,
                            title: "Geofencing",
                            subtitle: "Manage geofence alerts"
                        )
                    }

                    NavigationLink(destination: MapNavigationView()) {
                        FeatureRow(
                            icon: "arrow.triangle.turn.up.right.circle.fill",
                            iconColor: .blue,
                            title: "Navigation",
                            subtitle: "Turn-by-turn directions"
                        )
                    }
                }

                // MARK: - Vehicle Management
                Section(header: Text("Vehicle Management")) {
                    NavigationLink(destination: VehicleListView()) {
                        FeatureRow(
                            icon: "car.2.fill",
                            iconColor: .blue,
                            title: "Vehicle List",
                            subtitle: "Browse all vehicles"
                        )
                    }

                    NavigationLink(destination: VehicleDetailsView()) {
                        FeatureRow(
                            icon: "car.fill",
                            iconColor: .green,
                            title: "Vehicle Details",
                            subtitle: "View vehicle information"
                        )
                    }

                    NavigationLink(destination: VehicleIdentificationView()) {
                        FeatureRow(
                            icon: "magnifyingglass.circle.fill",
                            iconColor: .purple,
                            title: "Vehicle Identification",
                            subtitle: "Identify and verify vehicles"
                        )
                    }

                    NavigationLink(destination: VehicleRequestView()) {
                        FeatureRow(
                            icon: "hand.raised.fill",
                            iconColor: .orange,
                            title: "Vehicle Request",
                            subtitle: "Request vehicle assignment"
                        )
                    }

                    NavigationLink(destination: VehicleReservationView()) {
                        FeatureRow(
                            icon: "calendar.badge.plus",
                            iconColor: .cyan,
                            title: "Vehicle Reservation",
                            subtitle: "Reserve vehicles in advance"
                        )
                    }

                    NavigationLink(destination: AddVehicleView()) {
                        FeatureRow(
                            icon: "plus.circle.fill",
                            iconColor: .green,
                            title: "Add Vehicle",
                            subtitle: "Add new vehicle to fleet"
                        )
                    }

                    NavigationLink(destination: FuelManagementView()) {
                        FeatureRow(
                            icon: "fuelpump.fill",
                            iconColor: .red,
                            title: "Fuel Management",
                            subtitle: "Log fuel purchases and track consumption"
                        )
                    }

                    NavigationLink(destination: VehicleIdlingView()) {
                        FeatureRow(
                            icon: "gauge.with.dots.needle.67percent",
                            iconColor: .yellow,
                            title: "Vehicle Idling",
                            subtitle: "Monitor excessive idling"
                        )
                    }
                }

                // MARK: - Maintenance & Diagnostics
                Section(header: Text("Maintenance & Diagnostics")) {
                    NavigationLink(destination: MaintenanceSubmissionView()) {
                        FeatureRow(
                            icon: "wrench.fill",
                            iconColor: .orange,
                            title: "Submit Maintenance",
                            subtitle: "Report maintenance needs"
                        )
                    }

                    NavigationLink(destination: ScheduleMaintenanceView()) {
                        FeatureRow(
                            icon: "calendar.badge.clock",
                            iconColor: .blue,
                            title: "Schedule Maintenance",
                            subtitle: "Schedule service appointments"
                        )
                    }

                    NavigationLink(destination: VehicleMaintenancePhotoView()) {
                        FeatureRow(
                            icon: "camera.metering.center.weighted",
                            iconColor: .purple,
                            title: "Maintenance Photos",
                            subtitle: "Document maintenance with photos"
                        )
                    }

                    NavigationLink(destination: OBD2DiagnosticsView()) {
                        FeatureRow(
                            icon: "cable.connector",
                            iconColor: .green,
                            title: "OBD-II Diagnostics",
                            subtitle: "Read vehicle diagnostic codes"
                        )
                    }

                    NavigationLink(destination: OBD2EmulatorView()) {
                        FeatureRow(
                            icon: "antenna.radiowaves.left.and.right",
                            iconColor: .cyan,
                            title: "OBD-II Emulator",
                            subtitle: "Test OBD-II connections"
                        )
                    }

                    NavigationLink(destination: DeviceManagementView()) {
                        FeatureRow(
                            icon: "sensor.fill",
                            iconColor: .indigo,
                            title: "Device Management",
                            subtitle: "Manage OBD-II and tracking devices"
                        )
                    }
                }

                // MARK: - Checklists
                Section(header: Text("Checklists & Inspections")) {
                    NavigationLink(destination: ChecklistManagementView()) {
                        FeatureRow(
                            icon: "checklist",
                            iconColor: .blue,
                            title: "Checklist Management",
                            subtitle: "Manage inspection checklists"
                        )
                    }

                    NavigationLink(destination: ActiveChecklistView()) {
                        FeatureRow(
                            icon: "list.bullet.clipboard.fill",
                            iconColor: .green,
                            title: "Active Checklists",
                            subtitle: "View and complete active checklists"
                        )
                    }

                    NavigationLink(destination: ChecklistHistoryView()) {
                        FeatureRow(
                            icon: "clock.arrow.circlepath",
                            iconColor: .purple,
                            title: "Checklist History",
                            subtitle: "View completed checklists"
                        )
                    }

                    NavigationLink(destination: ChecklistTemplateEditorView()) {
                        FeatureRow(
                            icon: "square.and.pencil",
                            iconColor: .orange,
                            title: "Template Editor",
                            subtitle: "Create and edit checklist templates"
                        )
                    }

                    NavigationLink(destination: VehicleChecklistMetricsView()) {
                        FeatureRow(
                            icon: "chart.bar.fill",
                            iconColor: .cyan,
                            title: "Vehicle Checklist Metrics",
                            subtitle: "View vehicle checklist statistics"
                        )
                    }

                    NavigationLink(destination: DriverChecklistMetricsView()) {
                        FeatureRow(
                            icon: "person.text.rectangle.fill",
                            iconColor: .indigo,
                            title: "Driver Checklist Metrics",
                            subtitle: "View driver checklist performance"
                        )
                    }
                }

                // MARK: - Driver Features
                Section(header: Text("Driver Features")) {
                    NavigationLink(destination: DriverManagementView()) {
                        FeatureRow(
                            icon: "person.3.fill",
                            iconColor: .blue,
                            title: "Driver Management",
                            subtitle: "Manage driver roster"
                        )
                    }

                    NavigationLink(destination: DriverPreferencesView()) {
                        FeatureRow(
                            icon: "person.crop.circle.badge.checkmark",
                            iconColor: .green,
                            title: "Driver Preferences",
                            subtitle: "Configure driver settings"
                        )
                    }

                    NavigationLink(destination: CrashDetectionView()) {
                        FeatureRow(
                            icon: "sensor.tag.radiowaves.forward.fill",
                            iconColor: .red,
                            title: "Crash Detection",
                            subtitle: "Automatic crash detection and reporting"
                        )
                    }
                }

                // MARK: - Schedule & Tasks
                Section(header: Text("Schedule & Tasks")) {
                    NavigationLink(destination: ScheduleView()) {
                        FeatureRow(
                            icon: "calendar",
                            iconColor: .blue,
                            title: "Schedule",
                            subtitle: "View your schedule"
                        )
                    }

                    NavigationLink(destination: DayScheduleView()) {
                        FeatureRow(
                            icon: "calendar.day.timeline.left",
                            iconColor: .green,
                            title: "Day View",
                            subtitle: "View daily schedule"
                        )
                    }

                    NavigationLink(destination: WeekScheduleView()) {
                        FeatureRow(
                            icon: "calendar.day.timeline.leading",
                            iconColor: .purple,
                            title: "Week View",
                            subtitle: "View weekly schedule"
                        )
                    }

                    NavigationLink(destination: MonthScheduleView()) {
                        FeatureRow(
                            icon: "calendar",
                            iconColor: .orange,
                            title: "Month View",
                            subtitle: "View monthly schedule"
                        )
                    }

                    NavigationLink(destination: AgendaScheduleView()) {
                        FeatureRow(
                            icon: "list.bullet.rectangle",
                            iconColor: .cyan,
                            title: "Agenda View",
                            subtitle: "View schedule in agenda format"
                        )
                    }

                    NavigationLink(destination: AddScheduleView()) {
                        FeatureRow(
                            icon: "calendar.badge.plus",
                            iconColor: .green,
                            title: "Add Appointment",
                            subtitle: "Schedule new appointments"
                        )
                    }

                    NavigationLink(destination: TaskListView()) {
                        FeatureRow(
                            icon: "list.bullet",
                            iconColor: .blue,
                            title: "Task List",
                            subtitle: "Manage your tasks"
                        )
                    }

                    NavigationLink(destination: CreateTaskView()) {
                        FeatureRow(
                            icon: "plus.square.fill",
                            iconColor: .green,
                            title: "Create Task",
                            subtitle: "Add new tasks"
                        )
                    }
                }

                // MARK: - Communication
                Section(header: Text("Communication")) {
                    NavigationLink(destination: PushToTalkView()) {
                        FeatureRow(
                            icon: "mic.fill",
                            iconColor: .red,
                            title: "Push-to-Talk",
                            subtitle: "Radio communication with fleet"
                        )
                    }

                    NavigationLink(destination: MessagesView()) {
                        FeatureRow(
                            icon: "message.fill",
                            iconColor: .blue,
                            title: "Messages",
                            subtitle: "Send and receive messages"
                        )
                    }

                    NavigationLink(destination: AnnouncementView()) {
                        FeatureRow(
                            icon: "megaphone.fill",
                            iconColor: .orange,
                            title: "Announcements",
                            subtitle: "View fleet announcements"
                        )
                    }
                }

                // MARK: - Reports & Analytics
                Section(header: Text("Reports & Analytics")) {
                    NavigationLink(destination: ReportsView()) {
                        FeatureRow(
                            icon: "chart.bar.doc.horizontal.fill",
                            iconColor: .blue,
                            title: "Reports",
                            subtitle: "Generate and view reports"
                        )
                    }

                    NavigationLink(destination: ChecklistReportsView()) {
                        FeatureRow(
                            icon: "doc.text.fill",
                            iconColor: .green,
                            title: "Checklist Reports",
                            subtitle: "View checklist completion reports"
                        )
                    }

                    NavigationLink(destination: CustomReportBuilderView()) {
                        FeatureRow(
                            icon: "wand.and.stars",
                            iconColor: .purple,
                            title: "Custom Report Builder",
                            subtitle: "Create custom reports"
                        )
                    }
                }

                // MARK: - Hardware Features
                Section(header: Text("Hardware Features")) {
                    NavigationLink(destination: LiDARScannerView()) {
                        FeatureRow(
                            icon: "lidar.fill",
                            iconColor: .purple,
                            title: "LiDAR Scanner",
                            subtitle: "3D scanning with LiDAR"
                        )
                    }

                    NavigationLink(destination: CameraView()) {
                        FeatureRow(
                            icon: "camera.fill",
                            iconColor: .blue,
                            title: "Camera",
                            subtitle: "Access device camera"
                        )
                    }

                    NavigationLink(destination: HardwareQuickActionsView()) {
                        FeatureRow(
                            icon: "bolt.fill",
                            iconColor: .yellow,
                            title: "Hardware Quick Actions",
                            subtitle: "Quick access to hardware features"
                        )
                    }
                }

                // MARK: - Account & Settings
                Section(header: Text("Account & Settings")) {
                    NavigationLink(destination: ProfileView()) {
                        FeatureRow(
                            icon: "person.circle.fill",
                            iconColor: .blue,
                            title: "Profile",
                            subtitle: "View and edit your profile"
                        )
                    }

                    NavigationLink(destination: NotificationsView()) {
                        FeatureRow(
                            icon: "bell.fill",
                            iconColor: .orange,
                            title: "Notifications",
                            subtitle: "Manage notification settings"
                        )
                    }

                    NavigationLink(destination: SettingsView()) {
                        FeatureRow(
                            icon: "gear",
                            iconColor: .gray,
                            title: "Settings",
                            subtitle: "App settings and preferences"
                        )
                    }

                    NavigationLink(destination: AppearanceSettingsView()) {
                        FeatureRow(
                            icon: "paintbrush.fill",
                            iconColor: .purple,
                            title: "Appearance",
                            subtitle: "Customize app appearance"
                        )
                    }
                }

                // MARK: - Help & Support
                Section(header: Text("Help & Support")) {
                    NavigationLink(destination: HelpCenterView()) {
                        FeatureRow(
                            icon: "questionmark.circle.fill",
                            iconColor: .green,
                            title: "Help Center",
                            subtitle: "Get help and support"
                        )
                    }

                    NavigationLink(destination: OnboardingView()) {
                        FeatureRow(
                            icon: "book.fill",
                            iconColor: .blue,
                            title: "Onboarding",
                            subtitle: "View app tutorial"
                        )
                    }

                    NavigationLink(destination: SupportTicketView()) {
                        FeatureRow(
                            icon: "ticket.fill",
                            iconColor: .orange,
                            title: "Support Ticket",
                            subtitle: "Submit support requests"
                        )
                    }

                    NavigationLink(destination: AboutView()) {
                        FeatureRow(
                            icon: "info.circle.fill",
                            iconColor: .blue,
                            title: "About",
                            subtitle: "App version and information"
                        )
                    }
                }

                // MARK: - Sign Out
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
}

// MARK: - Feature Row Component
struct FeatureRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let subtitle: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(iconColor)
                .frame(width: 30)
                .font(.title3)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.body)
                    .fontWeight(.medium)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 2)
    }
}

#Preview {
    MoreView()
        .environmentObject(NavigationCoordinator())
}
