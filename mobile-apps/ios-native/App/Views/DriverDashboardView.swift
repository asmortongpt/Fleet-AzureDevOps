//
//  DriverDashboardView.swift
//  Fleet Manager
//
//  Driver Dashboard - Simplified view for drivers with assigned vehicles and trips
//

import SwiftUI

struct DriverDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject private var authManager: AuthenticationManager

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                // Welcome Header
                welcomeHeader

                // Driver Quick Stats
                driverStatsSection

                // My Assigned Vehicles
                myVehiclesSection

                // Today's Trips
                todaysTripsSection

                // Quick Actions
                quickActionsSection

                // Recent Activity
                recentActivitySection
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("My Dashboard")
        .refreshable {
            await viewModel.refresh()
        }
    }

    // MARK: - Welcome Header
    private var welcomeHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Welcome back,")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    Text(authManager.currentUser?.name ?? "Driver")
                        .font(.title.bold())
                }
                Spacer()
                Image(systemName: "person.fill")
                    .font(.system(size: 40))
                    .foregroundColor(.blue)
            }
            .padding()
            .background(Color(.secondarySystemGroupedBackground))
            .cornerRadius(12)
        }
    }

    // MARK: - Driver Stats
    private var driverStatsSection: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
            StatCard(
                title: "Today's Trips",
                value: "3",
                subtitle: "12.5 hours driven",
                icon: "location.fill",
                color: .green,
                trend: nil
            )

            StatCard(
                title: "My Vehicles",
                value: "2",
                subtitle: "Assigned to you",
                icon: "car.fill",
                color: .blue,
                trend: nil
            )

            StatCard(
                title: "Fuel Level",
                value: "75%",
                subtitle: "Primary vehicle",
                icon: "fuelpump.fill",
                color: .purple,
                trend: nil
            )

            StatCard(
                title: "Performance",
                value: "95%",
                subtitle: "Safety score",
                icon: "star.fill",
                color: .orange,
                trend: .up(5)
            )
        }
    }

    // MARK: - My Vehicles
    private var myVehiclesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("My Assigned Vehicles")
                    .font(.headline)
                Spacer()
                NavigationLink(destination: Text("All My Vehicles")) {
                    HStack(spacing: 4) {
                        Text("View All")
                            .font(.caption)
                        Image(systemName: "chevron.right")
                            .font(.caption2)
                    }
                }
            }

            VStack(spacing: 12) {
                vehicleCard(
                    name: "Truck #101",
                    type: "Ford F-150",
                    status: "Available",
                    fuel: 75,
                    statusColor: .green
                )

                vehicleCard(
                    name: "Van #205",
                    type: "Mercedes Sprinter",
                    status: "In Use",
                    fuel: 60,
                    statusColor: .blue
                )
            }
        }
    }

    private func vehicleCard(name: String, type: String, status: String, fuel: Int, statusColor: Color) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(name)
                    .font(.subheadline.bold())
                Text(type)
                    .font(.caption)
                    .foregroundColor(.secondary)

                HStack(spacing: 4) {
                    Circle()
                        .fill(statusColor)
                        .frame(width: 6, height: 6)
                    Text(status)
                        .font(.caption)
                        .foregroundColor(statusColor)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Image(systemName: "fuelpump.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text("\(fuel)%")
                    .font(.caption.bold())
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Today's Trips
    private var todaysTripsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Today's Trips")
                    .font(.headline)
                Spacer()
                NavigationLink(destination: Text("Trip History")) {
                    HStack(spacing: 4) {
                        Text("View All")
                            .font(.caption)
                        Image(systemName: "chevron.right")
                            .font(.caption2)
                    }
                }
            }

            VStack(spacing: 12) {
                tripCard(
                    destination: "Downtown Delivery",
                    time: "8:00 AM - 10:30 AM",
                    distance: "25.3 mi",
                    status: "Completed",
                    statusColor: .green
                )

                tripCard(
                    destination: "Airport Pickup",
                    time: "11:00 AM - 12:45 PM",
                    distance: "18.7 mi",
                    status: "Completed",
                    statusColor: .green
                )

                tripCard(
                    destination: "Warehouse Run",
                    time: "2:00 PM - 4:00 PM",
                    distance: "32.1 mi",
                    status: "In Progress",
                    statusColor: .blue
                )
            }
        }
    }

    private func tripCard(destination: String, time: String, distance: String, status: String, statusColor: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(destination)
                    .font(.subheadline.bold())
                Spacer()
                HStack(spacing: 4) {
                    Circle()
                        .fill(statusColor)
                        .frame(width: 6, height: 6)
                    Text(status)
                        .font(.caption)
                        .foregroundColor(statusColor)
                }
            }

            HStack {
                Label(time, systemImage: "clock.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Label(distance, systemImage: "location.fill")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Quick Actions
    private var quickActionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                QuickActionButton(title: "Start Trip", icon: "play.circle.fill", color: .green) {
                    viewModel.startNewTrip()
                }

                QuickActionButton(title: "Report Issue", icon: "exclamationmark.triangle.fill", color: .orange) {
                    // Report issue
                }

                QuickActionButton(title: "Pre-Trip Check", icon: "checkmark.circle.fill", color: .blue) {
                    // Pre-trip inspection
                }

                QuickActionButton(title: "My Schedule", icon: "calendar.fill", color: .purple) {
                    // View schedule
                }
            }
        }
    }

    // MARK: - Recent Activity
    private var recentActivitySection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Activity")
                .font(.headline)

            if viewModel.recentActivity.isEmpty {
                EmptyStateCard(
                    icon: "tray.fill",
                    title: "No Recent Activity",
                    message: "Your activity will appear here"
                )
            } else {
                LazyVStack(spacing: 8) {
                    ForEach(viewModel.recentActivity.prefix(5)) { activity in
                        ActivityRow(activity: activity)
                    }
                }
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(12)
            }
        }
    }
}

// MARK: - Preview
#Preview {
    DriverDashboardView()
        .environmentObject(AuthenticationManager.shared)
}
