//
//  ComponentHealthView.swift
//  Fleet Manager
//
//  Detailed component health view with trend analysis
//

import SwiftUI
import Charts

struct ComponentHealthView: View {
    let vehicleId: String
    let componentHealth: [ComponentHealth]

    @State private var selectedComponent: ComponentHealth?
    @State private var showTrendDetails = false
    @State private var selectedCategory: ComponentCategory?

    var filteredHealth: [ComponentHealth] {
        guard let category = selectedCategory else {
            return componentHealth
        }
        return componentHealth.filter { $0.component.category == category }
    }

    var groupedByCategory: [ComponentCategory: [ComponentHealth]] {
        Dictionary(grouping: filteredHealth) { $0.component.category }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Overall Health Summary
                overallHealthCard

                // Category Filter
                categoryFilter

                // Component Cards by Category
                ForEach(Array(groupedByCategory.keys).sorted(by: { $0.displayName < $1.displayName }), id: \.self) { category in
                    categorySection(category: category, components: groupedByCategory[category] ?? [])
                }
            }
            .padding()
        }
        .navigationTitle("Component Health")
        .sheet(item: $selectedComponent) { component in
            ComponentDetailSheet(component: component)
        }
    }

    // MARK: - Overall Health Card
    private var overallHealthCard: some View {
        VStack(spacing: 16) {
            Text("Overall Vehicle Health")
                .font(.headline)

            // Health Score Gauge
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 20)
                    .frame(width: 180, height: 180)

                Circle()
                    .trim(from: 0, to: averageHealth / 100)
                    .stroke(
                        healthGradient,
                        style: StrokeStyle(lineWidth: 20, lineCap: .round)
                    )
                    .frame(width: 180, height: 180)
                    .rotationEffect(.degrees(-90))

                VStack(spacing: 4) {
                    Text("\(Int(averageHealth))%")
                        .font(.system(size: 48, weight: .bold))
                        .foregroundColor(healthColor(averageHealth))

                    Text(healthStatusText(averageHealth))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Stats Row
            HStack(spacing: 20) {
                statItem(icon: "checkmark.circle.fill", value: "\(excellentCount)", label: "Excellent", color: .green)
                statItem(icon: "exclamationmark.circle.fill", value: "\(needsAttentionCount)", label: "Attention", color: .orange)
                statItem(icon: "xmark.circle.fill", value: "\(criticalCount)", label: "Critical", color: .red)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(16)
        .shadow(radius: 3)
    }

    private func statItem(icon: String, value: String, label: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title3)

            Text(value)
                .font(.title2)
                .fontWeight(.bold)

            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }

    // MARK: - Category Filter
    private var categoryFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                filterButton(category: nil, label: "All")

                ForEach([ComponentCategory.safety, .powertrain, .electrical, .maintenance, .consumable], id: \.self) { category in
                    filterButton(category: category, label: category.displayName)
                }
            }
            .padding(.horizontal)
        }
    }

    private func filterButton(category: ComponentCategory?, label: String) -> some View {
        Button {
            selectedCategory = category
        } label: {
            Text(label)
                .font(.subheadline)
                .fontWeight(.medium)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(selectedCategory == category ? Color.blue : Color(.secondarySystemBackground))
                .foregroundColor(selectedCategory == category ? .white : .primary)
                .cornerRadius(20)
        }
    }

    // MARK: - Category Section
    private func categorySection(category: ComponentCategory, components: [ComponentHealth]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(category.displayName)
                    .font(.headline)

                Spacer()

                Text("\(components.count) items")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            ForEach(components.sorted(by: { $0.healthScore < $1.healthScore })) { component in
                Button {
                    selectedComponent = component
                } label: {
                    componentHealthCard(component)
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Component Health Card
    private func componentHealthCard(_ health: ComponentHealth) -> some View {
        VStack(spacing: 12) {
            HStack {
                // Icon & Name
                HStack(spacing: 12) {
                    Image(systemName: health.component.icon)
                        .font(.title2)
                        .foregroundColor(health.statusColor)
                        .frame(width: 44, height: 44)
                        .background(health.statusColor.opacity(0.15))
                        .cornerRadius(10)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(health.component.displayName)
                            .font(.subheadline)
                            .fontWeight(.semibold)

                        Text(health.healthStatus.displayName)
                            .font(.caption)
                            .foregroundColor(health.statusColor)
                    }
                }

                Spacer()

                // Health Score
                VStack(alignment: .trailing, spacing: 4) {
                    Text("\(Int(health.healthScore))%")
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundColor(health.statusColor)

                    if let lastInspection = health.lastInspectionDate {
                        Text(lastInspection, style: .relative)
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }

            // Progress Bar
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 8)
                        .cornerRadius(4)

                    Rectangle()
                        .fill(
                            LinearGradient(
                                colors: [health.statusColor.opacity(0.7), health.statusColor],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .frame(width: geometry.size.width * (health.healthScore / 100), height: 8)
                        .cornerRadius(4)
                }
            }
            .frame(height: 8)

            // Additional Info
            if !health.issuesDetected.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(.orange)
                            .font(.caption)

                        Text("Issues Detected:")
                            .font(.caption)
                            .fontWeight(.medium)
                    }

                    ForEach(health.issuesDetected.prefix(2), id: \.self) { issue in
                        Text("• \(issue)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    if health.issuesDetected.count > 2 {
                        Text("+ \(health.issuesDetected.count - 2) more")
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                }
                .padding(.top, 4)
            }

            // Metadata Row
            HStack(spacing: 16) {
                if let lastReplacement = health.lastReplacementDate {
                    metadataItem(icon: "calendar", text: lastReplacement.formatted(date: .abbreviated, time: .omitted))
                }

                if let nextInspection = health.nextInspectionDate {
                    metadataItem(icon: "bell", text: "Next: \(nextInspection.formatted(date: .abbreviated, time: .omitted))")
                }

                Spacer()

                metadataItem(icon: "gauge", text: "\(Int(health.currentMileage)) mi")
            }
            .font(.caption)
            .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(10)
    }

    private func metadataItem(icon: String, text: String) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
            Text(text)
        }
    }

    // MARK: - Computed Properties
    private var averageHealth: Double {
        guard !componentHealth.isEmpty else { return 0 }
        return componentHealth.reduce(0) { $0 + $1.healthScore } / Double(componentHealth.count)
    }

    private var excellentCount: Int {
        componentHealth.filter { $0.healthStatus == .excellent || $0.healthStatus == .good }.count
    }

    private var needsAttentionCount: Int {
        componentHealth.filter { $0.healthStatus == .fair || $0.healthStatus == .poor }.count
    }

    private var criticalCount: Int {
        componentHealth.filter { $0.healthStatus == .critical }.count
    }

    private var healthGradient: AngularGradient {
        AngularGradient(
            gradient: Gradient(colors: [.red, .orange, .yellow, .green]),
            center: .center,
            startAngle: .degrees(0),
            endAngle: .degrees(360 * (averageHealth / 100))
        )
    }

    // MARK: - Helper Functions
    private func healthColor(_ health: Double) -> Color {
        switch health {
        case 80...100: return .green
        case 60..<80: return .blue
        case 40..<60: return .yellow
        case 20..<40: return .orange
        default: return .red
        }
    }

    private func healthStatusText(_ health: Double) -> String {
        switch health {
        case 80...100: return "Excellent"
        case 60..<80: return "Good"
        case 40..<60: return "Fair"
        case 20..<40: return "Poor"
        default: return "Critical"
        }
    }
}

// MARK: - Component Detail Sheet
struct ComponentDetailSheet: View {
    let component: ComponentHealth

    @Environment(\.dismiss) var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 12) {
                        Image(systemName: component.component.icon)
                            .font(.system(size: 60))
                            .foregroundColor(component.statusColor)

                        Text(component.component.displayName)
                            .font(.title2)
                            .fontWeight(.bold)

                        Text("\(Int(component.healthScore))% Health")
                            .font(.title3)
                            .foregroundColor(component.statusColor)
                    }
                    .padding()

                    // Details
                    VStack(alignment: .leading, spacing: 16) {
                        detailRow(icon: "calendar", label: "Age", value: "\(component.ageInDays) days")
                        detailRow(icon: "gauge", label: "Current Mileage", value: String(format: "%.0f mi", component.currentMileage))

                        if let lastReplacement = component.lastReplacementDate {
                            detailRow(icon: "arrow.clockwise", label: "Last Replacement", value: lastReplacement.formatted(date: .long, time: .omitted))
                        }

                        if let lastReplacementMileage = component.lastReplacementMileage {
                            detailRow(icon: "speedometer", label: "Replacement Mileage", value: String(format: "%.0f mi", lastReplacementMileage))
                        }

                        if let nextInspection = component.nextInspectionDate {
                            detailRow(icon: "bell", label: "Next Inspection", value: nextInspection.formatted(date: .long, time: .omitted))
                        }
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)

                    // Issues
                    if !component.issuesDetected.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            Label("Detected Issues", systemImage: "exclamationmark.triangle.fill")
                                .font(.headline)
                                .foregroundColor(.orange)

                            ForEach(component.issuesDetected, id: \.self) { issue in
                                HStack(alignment: .top, spacing: 8) {
                                    Image(systemName: "circle.fill")
                                        .font(.system(size: 6))
                                        .foregroundColor(.orange)
                                        .padding(.top, 6)

                                    Text(issue)
                                        .font(.subheadline)
                                }
                            }
                        }
                        .padding()
                        .background(Color.orange.opacity(0.1))
                        .cornerRadius(12)
                    }
                }
                .padding()
            }
            .navigationTitle("Component Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func detailRow(icon: String, label: String, value: String) -> some View {
        HStack {
            Label(label, systemImage: icon)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .fontWeight(.medium)
        }
    }
}

// MARK: - Preview
struct ComponentHealthView_Previews: PreviewProvider {
    static var sampleHealth: [ComponentHealth] = [
        ComponentHealth(
            id: "1",
            vehicleId: "v1",
            component: .battery,
            healthScore: 85,
            lastInspectionDate: Date().addingTimeInterval(-86400 * 30),
            lastReplacementDate: Date().addingTimeInterval(-86400 * 365),
            lastReplacementMileage: 35000,
            currentMileage: 45000,
            ageInDays: 365,
            issuesDetected: [],
            nextInspectionDate: Date().addingTimeInterval(86400 * 60)
        ),
        ComponentHealth(
            id: "2",
            vehicleId: "v1",
            component: .brakes,
            healthScore: 45,
            lastInspectionDate: Date().addingTimeInterval(-86400 * 15),
            lastReplacementDate: Date().addingTimeInterval(-86400 * 730),
            lastReplacementMileage: 25000,
            currentMileage: 45000,
            ageInDays: 730,
            issuesDetected: ["Worn brake pads", "Low brake fluid"],
            nextInspectionDate: Date().addingTimeInterval(86400 * 7)
        )
    ]

    static var previews: some View {
        NavigationView {
            ComponentHealthView(vehicleId: "v1", componentHealth: sampleHealth)
        }
    }
}
