import SwiftUI

struct MoreView: View {
    // @StateObject private var checklistViewModel = ChecklistViewModel() // Disabled until ChecklistViewModel is fixed
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator

    var body: some View {
        NavigationView {
            List {
                // GPS Features Section
                Section(header: Text("GPS Features")) {
                    NavigationLink(destination: GeofenceListView()) {
                        HStack {
                            Image(systemName: "mappin.circle.fill")
                                .foregroundColor(.blue)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Geofences")
                                    .font(.body)
                                Text("Create zones and monitor vehicle locations")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }

                    NavigationLink(destination: RouteListView()) {
                        HStack {
                            Image(systemName: "point.3.connected.trianglepath.dotted")
                                .foregroundColor(.orange)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Routes")
                                    .font(.body)
                                Text("Plan and save common routes with waypoints")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }

                    NavigationLink(destination: EnhancedFleetMapView()) {
                        HStack {
                            Image(systemName: "map.fill")
                                .foregroundColor(.green)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Fleet Map")
                                    .font(.body)
                                Text("Real-time vehicle location tracking")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }

                    NavigationLink(destination: TripTrackingView()) {
                        HStack {
                            Image(systemName: "location.fill.viewfinder")
                                .foregroundColor(.purple)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Trip Tracking")
                                    .font(.body)
                                Text("Track and record vehicle trips")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }

                // Financial Section
                Section(header: Text("Financial")) {
                    NavigationLink(destination: CostAnalysisCenterView()) {
                        HStack {
                            Image(systemName: "dollarsign.circle.fill")
                                .foregroundColor(.green)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Cost Analysis Center")
                                    .font(.body)
                                Text("TCO, cost per mile, and budget tracking")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }

                // Analytics Section
                Section(header: Text("Analytics")) {
                    NavigationLink(destination: FleetAnalyticsView()) {
                        HStack {
                            Image(systemName: "chart.bar.fill")
                                .foregroundColor(.blue)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Fleet Analytics")
                                    .font(.body)
                                Text("Usage trends, costs, and efficiency metrics")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }

                // Maintenance Section
                Section(header: Text("Maintenance")) {
                    NavigationLink(destination: WorkOrderListView()) {
                        HStack {
                            Image(systemName: "wrench.and.screwdriver.fill")
                                .foregroundColor(.orange)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Work Orders")
                                    .font(.body)
                                Text("Create, assign, and track work orders")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                }

                // Management Section
                Section(header: Text("Management")) {
                    NavigationLink(destination: DispatchConsoleView()) {
                        HStack {
                            Image(systemName: "antenna.radiowaves.left.and.right")
                                .foregroundColor(.red)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Dispatch Console")
                                    .font(.body)
                                Text("Real-time fleet management and assignments")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }

                    NavigationLink(destination: DriverListView()) {
                        HStack {
                            Image(systemName: "person.3.fill")
                                .foregroundColor(.blue)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Drivers")
                                    .font(.body)
                                Text("Manage driver roster and performance")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }

                    NavigationLink(destination: AssetListView()) {
                        HStack {
                            Image(systemName: "cube.box.fill")
                                .foregroundColor(.purple)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Assets")
                                    .font(.body)
                                Text("Track trailers, equipment, and tools")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }

                    NavigationLink(destination: Text("Checklists coming soon")) {
                        HStack {
                            Image(systemName: "checklist")
                                .foregroundColor(.orange)
                                .frame(width: 30)
                            VStack(alignment: .leading) {
                                Text("Checklists")
                                    .font(.body)
                                Text("Smart location-based checklists")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            Spacer()
                            // Badge disabled until ChecklistViewModel is fixed
                            // if checklistViewModel.pendingChecklists.count > 0 {
                            //     Text("\(checklistViewModel.pendingChecklists.count)")
                            //         .font(.caption)
                            //         .fontWeight(.semibold)
                            //         .foregroundColor(.white)
                            //         .padding(.horizontal, 8)
                            //         .padding(.vertical, 4)
                            //         .background(Color.red)
                            //         .cornerRadius(10)
                            // }
                        }
                    }

                    NavigationLink(destination: Text("Schedule coming soon")) {
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

                    NavigationLink(destination: Text("Appearance settings coming soon")) {
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
}

#Preview {
    MoreView()
}
