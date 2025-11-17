import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var authManager: AuthManager
    @StateObject private var viewModel = DashboardViewModel()

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    if viewModel.isLoading {
                        ProgressView("Loading dashboard...")
                            .padding()
                    } else if let metrics = viewModel.metrics {
                        // Metrics Grid
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                            MetricCard(title: "Total Vehicles", value: "\(metrics.totalVehicles)", icon: "car.2.fill", color: .blue)
                            MetricCard(title: "Active Trips", value: "\(metrics.activeTrips)", icon: "map.fill", color: .green)
                            MetricCard(title: "Alerts", value: "\(metrics.unreadAlerts)", icon: "bell.fill", color: .orange)
                            MetricCard(title: "Fuel Level", value: "\(Int(metrics.averageFuelLevel * 100))%", icon: "fuel.fill", color: .purple)
                        }
                        .padding(.horizontal)

                        // Recent Activity
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Recent Activity")
                                .font(.headline)
                                .padding(.horizontal)

                            ForEach(metrics.recentActivity) { activity in
                                ActivityRow(activity: activity)
                            }
                        }
                        .padding(.top)
                    } else {
                        Text("Unable to load dashboard")
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.top)
            }
            .navigationTitle("Dashboard")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { authManager.logout() }) {
                        Image(systemName: "rectangle.portrait.and.arrow.right")
                    }
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .task {
                await viewModel.loadDashboard()
            }
        }
    }
}

struct MetricCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(value)
                .font(.title)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct ActivityRow: View {
    let activity: DashboardMetrics.Activity

    var body: some View {
        HStack {
            Image(systemName: activityIcon)
                .foregroundColor(.blue)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 4) {
                Text(activity.message)
                    .font(.subheadline)

                Text(activity.timestamp, style: .relative)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
        .padding(.horizontal)
    }

    private var activityIcon: String {
        switch activity.type {
        case "trip_start": return "location.fill"
        case "maintenance": return "wrench.fill"
        case "alert": return "exclamationmark.triangle.fill"
        default: return "info.circle.fill"
        }
    }
}

#Preview {
    DashboardView()
        .environmentObject(AuthManager.shared)
}
