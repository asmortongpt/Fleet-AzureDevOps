struct AlertBanner: View {
    let icon: String
    let text: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
            Text(text)
                .font(.subheadline)
                .fontWeight(.medium)
            Spacer()
        }
        .padding()
        .background(color.opacity(0.1))
        .cornerRadius(8)
    }
}

struct StatItem: View {
    let value: String
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

struct ExpirationColumn: View {
    let count: Int
    let label: String
    let color: Color

    var body: some View {
        VStack(spacing: 4) {
            Text("\(count)")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(color)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct CategoryProgressRow: View {
    let category: CategoryReport

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: category.category.icon)
                    .foregroundColor(category.category.color)
                    .frame(width: 20)

                Text(category.category.displayName)
                    .font(.subheadline)

                Spacer()

                Text("\(Int(category.completionPercentage))%")
                    .font(.subheadline)
                    .fontWeight(.medium)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 6)
                        .cornerRadius(3)

                    Rectangle()
                        .fill(category.category.color)
                        .frame(width: geometry.size.width * (category.completionPercentage / 100), height: 6)
                        .cornerRadius(3)
                }
            }
            .frame(height: 6)
        }
    }
}

struct DepartmentProgressRow: View {
    let department: DepartmentReport

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(department.department)
                    .font(.subheadline)

                Spacer()

                Text("\(Int(department.compliancePercentage))%")
                    .font(.subheadline)
                    .fontWeight(.medium)

                Text("(\(department.compliantDrivers)/\(department.totalDrivers))")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 6)
                        .cornerRadius(3)

                    Rectangle()
                        .fill(department.compliancePercentage >= 80 ? .green : .orange)
                        .frame(width: geometry.size.width * (department.compliancePercentage / 100), height: 6)
                        .cornerRadius(3)
                }
            }
            .frame(height: 6)
        }
    }
}

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 64))
                .foregroundColor(.gray)

            Text(title)
                .font(.headline)

            Text(message)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
}

// Placeholder views to be created
struct ScheduleDetailView: View {
    let schedule: TrainingSchedule
    @ObservedObject var viewModel: TrainingManagementViewModel

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Schedule Details")
                    .font(.title2)
                    .fontWeight(.bold)

                VStack(alignment: .leading, spacing: 8) {
                    DetailRow(label: "Title", value: schedule.title)
                    DetailRow(label: "Type", value: schedule.trainingType)
                    DetailRow(label: "Status", value: schedule.status.rawValue)
                }
            }
            .padding()
        }
        .navigationTitle("Schedule Detail")
    }
}

#Preview {
    TrainingManagementView()
}
