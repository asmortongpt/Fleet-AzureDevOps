import SwiftUI

struct MoreView: View {
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator
    @State private var searchText = ""

    var body: some View {
        NavigationView {
            List {
                // MARK: - Operations & Fleet Management
                Section(header: Text("Operations & Fleet")) {
                    NavigationLink(destination: ScheduleView()) {
                        FeatureRow(
                            icon: "calendar",
                            iconColor: .blue,
                            title: "Schedule",
                            subtitle: "Manage fleet schedules and assignments"
                        )
                    }

                    NavigationLink(destination: RouteOptimizerView()) {
                        FeatureRow(
                            icon: "map.fill",
                            iconColor: .green,
                            title: "Route Optimizer",
                            subtitle: "Optimize routes and waypoints"
                        )
                    }

                    NavigationLink(destination: DispatchConsoleView()) {
                        FeatureRow(
                            icon: "antenna.radiowaves.left.and.right",
                            iconColor: .purple,
                            title: "Dispatch Console",
                            subtitle: "Real-time dispatch operations"
                        )
                    }

                    NavigationLink(destination: VehicleAssignmentView()) {
                        FeatureRow(
                            icon: "car.2.fill",
                            iconColor: .orange,
                            title: "Vehicle Assignments",
                            subtitle: "Manage vehicle allocations"
                        )
                    }
                }

                // MARK: - Checklists & Compliance
                Section(header: Text("Checklists & Compliance")) {
                    NavigationLink(destination: ChecklistManagementView()) {
                        FeatureRow(
                            icon: "checklist",
                            iconColor: .blue,
                            title: "Checklists",
                            subtitle: "Manage checklists and templates"
                        )
                    }

                    NavigationLink(destination: VehicleInspectionView()) {
                        FeatureRow(
                            icon: "magnifyingglass.circle.fill",
                            iconColor: .green,
                            title: "Vehicle Inspection",
                            subtitle: "Conduct vehicle inspections"
                        )
                    }

                    NavigationLink(destination: ComplianceDashboardView()) {
                        FeatureRow(
                            icon: "checkmark.shield.fill",
                            iconColor: .purple,
                            title: "Compliance Dashboard",
                            subtitle: "Track compliance status"
                        )
                    }

                    NavigationLink(destination: CertificationManagementView()) {
                        FeatureRow(
                            icon: "graduationcap.fill",
                            iconColor: .indigo,
                            title: "Certifications",
                            subtitle: "Manage driver certifications"
                        )
                    }
                }

                // MARK: - Maintenance & Diagnostics
                Section(header: Text("Maintenance & Diagnostics")) {
                    NavigationLink(destination: PredictiveMaintenanceView()) {
                        FeatureRow(
                            icon: "wrench.and.screwdriver.fill",
                            iconColor: .orange,
                            title: "Predictive Maintenance",
                            subtitle: "AI-powered maintenance forecasting"
                        )
                    }

                    NavigationLink(destination: TelemetryDashboardView()) {
                        FeatureRow(
                            icon: "gauge.high",
                            iconColor: .red,
                            title: "Telemetry Dashboard",
                            subtitle: "Real-time vehicle diagnostics"
                        )
                    }

                    NavigationLink(destination: WorkOrderListView()) {
                        FeatureRow(
                            icon: "doc.text.fill",
                            iconColor: .blue,
                            title: "Work Orders",
                            subtitle: "Manage maintenance work orders"
                        )
                    }

                    NavigationLink(destination: WarrantyManagementView()) {
                        FeatureRow(
                            icon: "shield.lefthalf.filled",
                            iconColor: .green,
                            title: "Warranty Management",
                            subtitle: "Track warranties and claims"
                        )
                    }
                }

                // MARK: - Analytics & Reports
                Section(header: Text("Analytics & Reports")) {
                    NavigationLink(destination: ExecutiveDashboardView()) {
                        FeatureRow(
                            icon: "chart.line.uptrend.xyaxis",
                            iconColor: .purple,
                            title: "Executive Dashboard",
                            subtitle: "High-level fleet metrics"
                        )
                    }

                    NavigationLink(destination: FleetAnalyticsView()) {
                        FeatureRow(
                            icon: "chart.bar.fill",
                            iconColor: .blue,
                            title: "Fleet Analytics",
                            subtitle: "Comprehensive fleet analysis"
                        )
                    }

                    NavigationLink(destination: TripAnalyticsView()) {
                        FeatureRow(
                            icon: "location.fill",
                            iconColor: .green,
                            title: "Trip Analytics",
                            subtitle: "Analyze trip patterns and behavior"
                        )
                    }

                    NavigationLink(destination: CustomReportBuilderView()) {
                        FeatureRow(
                            icon: "doc.badge.gearshape.fill",
                            iconColor: .orange,
                            title: "Custom Reports",
                            subtitle: "Build custom reports"
                        )
                    }

                    NavigationLink(destination: PredictiveAnalyticsView()) {
                        FeatureRow(
                            icon: "sparkles",
                            iconColor: .pink,
                            title: "Predictive Analytics",
                            subtitle: "AI-powered predictions"
                        )
                    }
                }

                // MARK: - Cost & Budget Management
                Section(header: Text("Cost & Budget")) {
                    NavigationLink(destination: CostAnalysisCenterView()) {
                        FeatureRow(
                            icon: "dollarsign.circle.fill",
                            iconColor: .green,
                            title: "Cost Analysis",
                            subtitle: "Track and analyze fleet costs"
                        )
                    }

                    NavigationLink(destination: BudgetPlanningView()) {
                        FeatureRow(
                            icon: "chart.pie.fill",
                            iconColor: .blue,
                            title: "Budget Planning",
                            subtitle: "Plan and manage budgets"
                        )
                    }

                    NavigationLink(destination: FleetOptimizerView()) {
                        FeatureRow(
                            icon: "arrow.triangle.2.circlepath",
                            iconColor: .purple,
                            title: "Fleet Optimizer",
                            subtitle: "Optimize fleet efficiency"
                        )
                    }
                }

                // MARK: - Inventory & Procurement
                Section(header: Text("Inventory & Procurement")) {
                    NavigationLink(destination: InventoryManagementView()) {
                        FeatureRow(
                            icon: "shippingbox.fill",
                            iconColor: .brown,
                            title: "Inventory Management",
                            subtitle: "Track parts and supplies"
                        )
                    }

                    NavigationLink(destination: VendorListView()) {
                        FeatureRow(
                            icon: "building.2.fill",
                            iconColor: .indigo,
                            title: "Vendors",
                            subtitle: "Manage vendor relationships"
                        )
                    }

                    NavigationLink(destination: PurchaseOrderListView()) {
                        FeatureRow(
                            icon: "cart.fill",
                            iconColor: .blue,
                            title: "Purchase Orders",
                            subtitle: "Manage procurement"
                        )
                    }
                }

                // MARK: - Driver & Training
                Section(header: Text("Driver & Training")) {
                    NavigationLink(destination: DriverListView()) {
                        FeatureRow(
                            icon: "person.fill",
                            iconColor: .blue,
                            title: "Drivers",
                            subtitle: "Manage driver information"
                        )
                    }

                    NavigationLink(destination: TrainingManagementView()) {
                        FeatureRow(
                            icon: "book.fill",
                            iconColor: .orange,
                            title: "Training",
                            subtitle: "Manage driver training programs"
                        )
                    }

                    NavigationLink(destination: ShiftManagementView()) {
                        FeatureRow(
                            icon: "clock.fill",
                            iconColor: .purple,
                            title: "Shift Management",
                            subtitle: "Manage driver shifts"
                        )
                    }
                }

                // MARK: - Communication
                Section(header: Text("Communication")) {
                    NavigationLink(destination: CommunicationCenterView()) {
                        FeatureRow(
                            icon: "message.fill",
                            iconColor: .blue,
                            title: "Communication Center",
                            subtitle: "Messages and announcements"
                        )
                    }

                    NavigationLink(destination: PushToTalkView()) {
                        FeatureRow(
                            icon: "mic.fill",
                            iconColor: .red,
                            title: "Push to Talk",
                            subtitle: "Voice communication"
                        )
                    }
                }

                // MARK: - Assets & Documents
                Section(header: Text("Assets & Documents")) {
                    NavigationLink(destination: AssetListView()) {
                        FeatureRow(
                            icon: "square.stack.3d.up.fill",
                            iconColor: .cyan,
                            title: "Assets",
                            subtitle: "Manage fleet assets"
                        )
                    }

                    NavigationLink(destination: DocumentBrowserView()) {
                        FeatureRow(
                            icon: "folder.fill",
                            iconColor: .yellow,
                            title: "Documents",
                            subtitle: "Browse and manage documents"
                        )
                    }
                }

                // MARK: - GIS & Mapping
                Section(header: Text("GIS & Mapping")) {
                    NavigationLink(destination: GISCommandCenterView()) {
                        FeatureRow(
                            icon: "map.fill",
                            iconColor: .green,
                            title: "GIS Command Center",
                            subtitle: "Advanced mapping and GIS"
                        )
                    }

                    NavigationLink(destination: GeofenceListView()) {
                        FeatureRow(
                            icon: "shield.lefthalf.filled.badge.checkmark",
                            iconColor: .purple,
                            title: "Geofences",
                            subtitle: "Manage geofence zones"
                        )
                    }

                    NavigationLink(destination: EnhancedMapView()) {
                        FeatureRow(
                            icon: "map.circle.fill",
                            iconColor: .blue,
                            title: "Enhanced Map",
                            subtitle: "Advanced map features"
                        )
                    }
                }

                // MARK: - Environmental & Sustainability
                Section(header: Text("Environmental")) {
                    NavigationLink(destination: EnvironmentalDashboardView()) {
                        FeatureRow(
                            icon: "leaf.fill",
                            iconColor: .green,
                            title: "Environmental Dashboard",
                            subtitle: "Track emissions and sustainability"
                        )
                    }
                }

                // MARK: - Data & Analysis
                Section(header: Text("Data Tools")) {
                    NavigationLink(destination: DataWorkbenchView()) {
                        FeatureRow(
                            icon: "tablecells.fill",
                            iconColor: .indigo,
                            title: "Data Workbench",
                            subtitle: "Advanced data analysis"
                        )
                    }

                    NavigationLink(destination: BenchmarkingView()) {
                        FeatureRow(
                            icon: "chart.bar.xaxis",
                            iconColor: .orange,
                            title: "Benchmarking",
                            subtitle: "Compare fleet performance"
                        )
                    }
                }

                // MARK: - Tasks & Work Management
                Section(header: Text("Tasks & Work")) {
                    NavigationLink(destination: TaskListView()) {
                        FeatureRow(
                            icon: "checkmark.circle.fill",
                            iconColor: .blue,
                            title: "Tasks",
                            subtitle: "Manage tasks and assignments"
                        )
                    }
                }

                // MARK: - Personal Use
                Section(header: Text("Personal Use")) {
                    NavigationLink(destination: PersonalUseDashboardView()) {
                        FeatureRow(
                            icon: "person.crop.circle.fill",
                            iconColor: .cyan,
                            title: "Personal Use",
                            subtitle: "Track personal vehicle usage"
                        )
                    }

                    NavigationLink(destination: ReimbursementQueueView()) {
                        FeatureRow(
                            icon: "dollarsign.circle.fill",
                            iconColor: .green,
                            title: "Reimbursements",
                            subtitle: "Manage reimbursement requests"
                        )
                    }
                }

                // MARK: - Support & Help
                Section(header: Text("Help & Support")) {
                    NavigationLink(destination: HelpCenterView()) {
                        FeatureRow(
                            icon: "questionmark.circle.fill",
                            iconColor: .blue,
                            title: "Help Center",
                            subtitle: "Get help and documentation"
                        )
                    }

                    NavigationLink(destination: SupportTicketView()) {
                        FeatureRow(
                            icon: "lifepreserver.fill",
                            iconColor: .orange,
                            title: "Support Tickets",
                            subtitle: "Submit and track support tickets"
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
            .searchable(text: $searchText, prompt: "Search features")
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
