import SwiftUI

struct AlertsView: View {
    @State private var alerts: [Alert] = []
    @State private var isLoading = true

    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    ProgressView("Loading alerts...")
                } else if alerts.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "bell.fill")
                            .font(.system(size: 64))
                            .foregroundColor(.gray)
                        Text("No alerts")
                            .font(.headline)
                            .foregroundColor(.secondary)
                        Text("All clear!")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                } else {
                    List {
                        ForEach(alerts) { alert in
                            AlertRow(alert: alert)
                        }
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Alerts")
            .task {
                await loadAlerts()
            }
        }
    }

    private func loadAlerts() async {
        // Simulate loading
        try? await Task.sleep(nanoseconds: 500_000_000)

        // Mock data
        alerts = [
            Alert(
                id: "1",
                vehicleId: "1",
                type: .maintenance,
                priority: .high,
                message: "Vehicle FL-1234 requires oil change",
                createdAt: Date().addingTimeInterval(-3600),
                isRead: false
            ),
            Alert(
                id: "2",
                vehicleId: "2",
                type: .fuelLow,
                priority: .medium,
                message: "Vehicle FL-5678 has low fuel (25%)",
                createdAt: Date().addingTimeInterval(-7200),
                isRead: false
            ),
            Alert(
                id: "3",
                vehicleId: "3",
                type: .inspection,
                priority: .low,
                message: "Annual inspection due for FL-9012",
                createdAt: Date().addingTimeInterval(-86400),
                isRead: true
            )
        ]

        isLoading = false
    }
}

struct AlertRow: View {
    let alert: Alert

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: alert.type.icon)
                .font(.title3)
                .foregroundColor(priorityColor)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 4) {
                Text(alert.message)
                    .font(.subheadline)
                    .fontWeight(alert.isRead ? .regular : .semibold)

                HStack {
                    Text(alert.createdAt, style: .relative)
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Spacer()

                    PriorityBadge(priority: alert.priority)
                }
            }

            if !alert.isRead {
                Circle()
                    .fill(Color.blue)
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.vertical, 8)
        .opacity(alert.isRead ? 0.6 : 1.0)
    }

    private var priorityColor: Color {
        switch alert.priority.color {
        case "green": return .green
        case "yellow": return .yellow
        case "orange": return .orange
        case "red": return .red
        default: return .gray
        }
    }
}

struct PriorityBadge: View {
    let priority: Alert.AlertPriority

    var body: some View {
        Text(priority.rawValue.uppercased())
            .font(.caption2)
            .fontWeight(.bold)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(priorityColor.opacity(0.2))
            .foregroundColor(priorityColor)
            .cornerRadius(4)
    }

    private var priorityColor: Color {
        switch priority.color {
        case "green": return .green
        case "yellow": return .yellow
        case "orange": return .orange
        case "red": return .red
        default: return .gray
        }
    }
}

#Preview {
    AlertsView()
}
