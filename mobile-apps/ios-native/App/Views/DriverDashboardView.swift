//
//  DriverDashboardView.swift
//  Fleet Manager
//
//  Driver Dashboard - Mobile-First Optimized (No Scrolling)
//

import SwiftUI

struct DriverDashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject private var authManager: AuthenticationManager
    @Environment(\.verticalSizeClass) var verticalSizeClass

    var body: some View {
        VStack(spacing: 12) {
            // Compact Header
            compactHeader

            // Horizontal Stats Scroll
            horizontalStatsSection

            // My Vehicle & Today's Trip Combined
            compactVehicleAndTripSection

            // Quick Actions (Horizontal)
            compactQuickActionsSection

            Spacer()
        }
        .padding(.horizontal)
        .padding(.top, 8)
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Driver")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await viewModel.refresh()
        }
    }

    // MARK: - Compact Header
    private var compactHeader: some View {
        HStack(spacing: 12) {
            // Icon
            Image(systemName: "person.fill")
                .font(.system(size: 32))
                .foregroundColor(.blue)
                .frame(width: 50, height: 50)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(10)

            // Welcome Text
            VStack(alignment: .leading, spacing: 2) {
                Text("Welcome back")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(authManager.currentUser?.name ?? "Driver")
                    .font(.headline)
                    .lineLimit(1)
            }

            Spacer()

            // Quick Trip Status
            NavigationLink(destination: Text("Start Trip")) {
                Image(systemName: "play.circle.fill")
                    .font(.title2)
                    .foregroundColor(.green)
                    .frame(width: 44, height: 44)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }

    // MARK: - Horizontal Stats
    private var horizontalStatsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("My Stats")
                .font(.caption.bold())
                .foregroundColor(.secondary)
                .padding(.leading, 4)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    CompactStatCard(
                        title: "Today's Trips",
                        value: "3",
                        subtitle: "12.5 hours driven",
                        icon: "location.fill",
                        color: .green
                    )

                    CompactStatCard(
                        title: "My Vehicles",
                        value: "2",
                        subtitle: "Assigned to you",
                        icon: "car.fill",
                        color: .blue
                    )

                    CompactStatCard(
                        title: "Fuel Level",
                        value: "75%",
                        subtitle: "Primary vehicle",
                        icon: "fuelpump.fill",
                        color: .purple
                    )

                    CompactStatCard(
                        title: "Safety Score",
                        value: "95%",
                        subtitle: "Performance",
                        icon: "star.fill",
                        color: .orange
                    )
                }
                .padding(.horizontal, 4)
            }
        }
    }

    // MARK: - Vehicle & Trip Combined
    private var compactVehicleAndTripSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Current Status")
                    .font(.caption.bold())
                    .foregroundColor(.secondary)
                Spacer()
                NavigationLink(destination: Text("All Vehicles & Trips")) {
                    HStack(spacing: 2) {
                        Text("View All")
                            .font(.caption2)
                        Image(systemName: "chevron.right")
                            .font(.caption2)
                    }
                    .foregroundColor(.blue)
                }
            }
            .padding(.horizontal, 4)

            VStack(spacing: 12) {
                // Current Vehicle
                HStack(spacing: 12) {
                    Image(systemName: "car.fill")
                        .font(.caption)
                        .foregroundColor(.white)
                        .frame(width: 32, height: 32)
                        .background(Color.blue)
                        .cornerRadius(8)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Truck #101")
                            .font(.caption.bold())
                        Text("Ford F-150")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 2) {
                        HStack(spacing: 4) {
                            Image(systemName: "fuelpump.fill")
                                .font(.caption2)
                            Text("75%")
                                .font(.caption.bold())
                        }
                        .foregroundColor(.purple)

                        HStack(spacing: 2) {
                            Circle()
                                .fill(Color.green)
                                .frame(width: 5, height: 5)
                            Text("Available")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding(12)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(10)

                // Current Trip
                HStack(spacing: 12) {
                    Image(systemName: "location.fill")
                        .font(.caption)
                        .foregroundColor(.white)
                        .frame(width: 32, height: 32)
                        .background(Color.blue)
                        .cornerRadius(8)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Warehouse Run")
                            .font(.caption.bold())
                        Text("2:00 PM - 4:00 PM")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 2) {
                        Text("32.1 mi")
                            .font(.caption.bold())
                            .foregroundColor(.green)

                        HStack(spacing: 2) {
                            Circle()
                                .fill(Color.blue)
                                .frame(width: 5, height: 5)
                            Text("In Progress")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding(12)
                .background(Color(.secondarySystemGroupedBackground))
                .cornerRadius(10)
            }
        }
    }

    // MARK: - Compact Quick Actions
    private var compactQuickActionsSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Quick Actions")
                .font(.caption.bold())
                .foregroundColor(.secondary)
                .padding(.leading, 4)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    compactActionButton(icon: "play.circle.fill", title: "Start Trip", color: .green) {
                        viewModel.startNewTrip()
                    }

                    compactActionButton(icon: "exclamationmark.triangle.fill", title: "Report Issue", color: .orange) {
                        // Report issue
                    }

                    compactActionButton(icon: "checkmark.circle.fill", title: "Pre-Trip", color: .blue) {
                        // Pre-trip inspection
                    }

                    compactActionButton(icon: "calendar.fill", title: "Schedule", color: .purple) {
                        // View schedule
                    }
                }
                .padding(.horizontal, 4)
            }
        }
    }

    private func compactActionButton(icon: String, title: String, color: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)
                    .frame(width: 50, height: 50)
                    .background(color.opacity(0.15))
                    .cornerRadius(12)

                Text(title)
                    .font(.caption2.bold())
                    .foregroundColor(.primary)
            }
            .frame(width: 90)
        }
    }
}

// MARK: - Compact Stat Card
struct CompactStatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)
                Spacer()
            }

            Text(value)
                .font(.title2.bold())

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption2.bold())
                    .foregroundColor(.secondary)
                Text(subtitle)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .frame(width: 140, height: 120)
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

// MARK: - Preview
#Preview {
    DriverDashboardView()
        .environmentObject(AuthenticationManager.shared)
}
