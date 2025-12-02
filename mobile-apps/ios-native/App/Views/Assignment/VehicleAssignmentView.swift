    init(status: RequestStatus) {
        switch status {
        case .pending:
            self.status = .pending
        case .approved:
            self.status = .active
        case .denied:
            self.status = .cancelled
        case .cancelled:
            self.status = .cancelled
        }
    }

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: status.icon)
                .font(.caption)
            Text(status.displayName)
                .font(.caption)
                .fontWeight(.medium)
        }
        .foregroundColor(status.color)
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            Capsule()
                .fill(status.color.opacity(0.15))
        )
    }
}

// MARK: - Empty State View
struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String
    var iconColor: Color = .gray

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 60))
                .foregroundColor(iconColor.opacity(0.5))

            Text(title)
                .font(.title2)
                .fontWeight(.semibold)

            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Loading Overlay
struct LoadingOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.3)
                .ignoresSafeArea()

            ProgressView()
                .scaleEffect(1.5)
                .progressViewStyle(CircularProgressViewStyle(tint: .white))
        }
    }
}

// MARK: - Assignment Detail View Placeholder
struct AssignmentDetailView: View {
    let assignment: VehicleAssignment
    @ObservedObject var viewModel: VehicleAssignmentViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Assignment Details")
                    .font(.title)
                    .fontWeight(.bold)

                VStack(alignment: .leading, spacing: 12) {
                    DetailRow(label: "Vehicle", value: "Vehicle Name")
                    DetailRow(label: "Driver", value: "Driver Name")
                    DetailRow(label: "Start Date", value: "Date")
                    DetailRow(label: "Status", value: "Active")
                }
            }
            .padding()
        }
        .navigationTitle("Assignment Detail")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Preview
#Preview {
    VehicleAssignmentView()
}
