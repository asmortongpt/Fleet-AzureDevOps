struct BudgetCard: View {
    let budget: BudgetPlan
    let isSelected: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(budget.name)
                .font(.subheadline)
                .fontWeight(.semibold)
                .lineLimit(1)

            HStack {
                Image(systemName: budget.status.icon)
                    .font(.caption)
                Text(budget.status.rawValue)
                    .font(.caption)
            }
            .foregroundColor(Color(budget.status.color))

            Text(String(format: "%.1f%% Used", budget.percentageUsed))
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(width: 140)
        .padding()
        .background(isSelected ? Color.blue.opacity(0.2) : Color(.secondarySystemBackground))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
        )
    }
}

struct CategoryCard: View {
    let allocation: BudgetAllocation

    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: allocation.category.icon)
                    .foregroundColor(Color(allocation.category.color))
                    .frame(width: 30)

                VStack(alignment: .leading, spacing: 4) {
                    Text(allocation.category.rawValue)
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    Text("\(allocation.formattedSpent) of \(allocation.formattedAllocated)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(String(format: "%.1f%%", allocation.percentageUsed))
                        .font(.subheadline)
                        .fontWeight(.bold)
                        .foregroundColor(allocation.percentageUsed >= 90 ? .red : .primary)

                    HStack(spacing: 4) {
                        Image(systemName: allocation.varianceStatus.icon)
                        Text(allocation.formattedRemaining)
                    }
                    .font(.caption)
                    .foregroundColor(Color(allocation.varianceStatus.color))
                }
            }

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 6)
                        .cornerRadius(3)

                    Rectangle()
                        .fill(Color(allocation.category.color))
                        .frame(width: min(geometry.size.width * CGFloat(allocation.percentageUsed / 100), geometry.size.width), height: 6)
                        .cornerRadius(3)
                }
            }
            .frame(height: 6)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }
}

struct MetricRow: View {
    let label: String
    let value: String
    let icon: String
    var valueColor: Color = .primary

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.secondary)
                .frame(width: 24)

            Text(label)
                .font(.subheadline)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.semibold)
                .foregroundColor(valueColor)
        }
    }
}

struct ActionButton: View {
    let icon: String
    let label: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
            Text(label)
                .font(.subheadline)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(color.opacity(0.1))
        .foregroundColor(color)
        .cornerRadius(10)
    }
}

struct BudgetFiltersSheet: View {
    @ObservedObject var viewModel: BudgetPlanningViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Fiscal Year")) {
                    Picker("Fiscal Year", selection: $viewModel.selectedFiscalYear) {
                        ForEach(viewModel.availableFiscalYears, id: \.self) { year in
                            Text("FY \(year)").tag(year)
                        }
                    }
                }

                Section(header: Text("Status")) {
                    Toggle("Show Only Active", isOn: $viewModel.showOnlyActive)
                }

                Section(header: Text("Department")) {
                    TextField("Department", text: Binding(
                        get: { viewModel.selectedDepartment ?? "" },
                        set: { viewModel.selectedDepartment = $0.isEmpty ? nil : $0 }
                    ))
                }

                Section {
                    Button("Apply Filters") {
                        Task {
                            await viewModel.applyFilters()
                            dismiss()
                        }
                    }

                    Button("Clear Filters") {
                        viewModel.clearFilters()
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Filters")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    BudgetPlanningView()
}
