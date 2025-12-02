//
//  PersonalUseDashboardView.swift
//  Fleet Manager
//
//  Dashboard for personal use tracking with summary, charts, and navigation
//

import SwiftUI
import Charts

struct PersonalUseDashboardView: View {
    @StateObject private var viewModel = PersonalUseViewModel()
    @State private var showingMonthPicker = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Month Selector
                    monthSelector

                    // Summary Cards
                    if let summary = viewModel.monthlySummary {
                        summaryCards(summary: summary)
                    }

                    // Compliance Status
                    complianceStatusCard

                    // Mileage Chart
                    mileageChartCard

                    // Reimbursement Chart
                    reimbursementChartCard

                    // Recent Personal Trips
                    recentTripsCard

                    // Actions
                    actionButtons
                }
                .padding()
            }
            .navigationTitle("Personal Use")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button(action: { viewModel.showingPolicyDetails = true }) {
                            Label("View Policy", systemImage: "doc.text")
                        }
                        Button(action: { exportMonthlyReport() }) {
                            Label("Export Report", systemImage: "square.and.arrow.up")
                        }
                        Divider()
                        NavigationLink(destination: PersonalTripView()) {
                            Label("Log New Trip", systemImage: "plus.circle")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .refreshable {
                await viewModel.refresh()
            }
            .sheet(isPresented: $viewModel.showingPolicyDetails) {
                policyDetailsSheet
            }
        }
    }

    // MARK: - Month Selector
    private var monthSelector: some View {
        HStack {
            Button(action: previousMonth) {
                Image(systemName: "chevron.left.circle.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
            }

            Spacer()

            Button(action: { showingMonthPicker = true }) {
                VStack(spacing: 4) {
                    Text(monthYearText)
                        .font(.headline)
                    Text("Tap to change")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            Button(action: nextMonth) {
                Image(systemName: "chevron.right.circle.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
                    .opacity(isCurrentMonth ? 0.3 : 1.0)
            }
            .disabled(isCurrentMonth)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5)
    }

    // MARK: - Summary Cards
    private func summaryCards(summary: PersonalUseSummary) -> some View {
        VStack(spacing: 12) {
            HStack(spacing: 12) {
                summaryCard(
                    title: "Personal Miles",
                    value: summary.formattedPersonalMiles,
                    icon: "car.fill",
                    color: .purple
                )

                summaryCard(
                    title: "Business Miles",
                    value: summary.formattedBusinessMiles,
                    icon: "briefcase.fill",
                    color: .blue
                )
            }

            HStack(spacing: 12) {
                summaryCard(
                    title: "Reimbursement",
                    value: summary.formattedReimbursement,
                    icon: "dollarsign.circle.fill",
                    color: .green
                )

                summaryCard(
                    title: "Total Trips",
                    value: "\(summary.totalTrips)",
                    icon: "location.fill",
                    color: .orange
                )
            }
        }
    }

    private func summaryCard(title: String, value: String, icon: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Spacer()
            }

            Text(value)
                .font(.title2)
                .fontWeight(.bold)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5)
    }

    // MARK: - Compliance Status Card
    private var complianceStatusCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: viewModel.complianceStatus.icon)
                    .foregroundColor(Color(viewModel.complianceStatus.color))
                    .font(.title2)

                Text("Policy Compliance")
                    .font(.headline)

                Spacer()

                Text(viewModel.complianceStatus.rawValue)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color(viewModel.complianceStatus.color).opacity(0.2))
                    .foregroundColor(Color(viewModel.complianceStatus.color))
                    .cornerRadius(8)
            }

            Text(viewModel.complianceStatus.description)
                .font(.subheadline)
                .foregroundColor(.secondary)

            if let policy = viewModel.currentPolicy {
                VStack(alignment: .leading, spacing: 8) {
                    if let maxMiles = policy.maxMonthlyMiles {
                        ProgressView(
                            value: viewModel.totalPersonalMilesThisMonth,
                            total: maxMiles
                        ) {
                            HStack {
                                Text("Miles Used")
                                    .font(.caption)
                                Spacer()
                                Text("\(String(format: "%.0f", viewModel.totalPersonalMilesThisMonth)) / \(String(format: "%.0f", maxMiles))")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                            }
                        }
                        .tint(Color(viewModel.complianceStatus.color))
                    }

                    if let maxAmount = policy.maxMonthlyAmount {
                        ProgressView(
                            value: viewModel.estimatedReimbursementThisMonth,
                            total: maxAmount
                        ) {
                            HStack {
                                Text("Budget Used")
                                    .font(.caption)
                                Spacer()
                                Text("$\(String(format: "%.0f", viewModel.estimatedReimbursementThisMonth)) / $\(String(format: "%.0f", maxAmount))")
                                    .font(.caption)
                                    .fontWeight(.semibold)
                            }
                        }
                        .tint(Color(viewModel.complianceStatus.color))
                    }
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5)
    }

    // MARK: - Mileage Chart Card
    private var mileageChartCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Mileage Breakdown")
                .font(.headline)

            if viewModel.mileageChartData.isEmpty {
                Text("No mileage data available")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 40)
            } else {
                Chart {
                    ForEach(viewModel.mileageChartData) { data in
                        BarMark(
                            x: .value("Month", data.month),
                            y: .value("Miles", data.personalMiles)
                        )
                        .foregroundStyle(Color.purple.gradient)
                        .position(by: .value("Type", "Personal"))

                        BarMark(
                            x: .value("Month", data.month),
                            y: .value("Miles", data.businessMiles)
                        )
                        .foregroundStyle(Color.blue.gradient)
                        .position(by: .value("Type", "Business"))
                    }
                }
                .frame(height: 200)
                .chartLegend(position: .bottom)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5)
    }

    // MARK: - Reimbursement Chart Card
    private var reimbursementChartCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Reimbursement Trend")
                .font(.headline)

            if viewModel.reimbursementChartData.isEmpty {
                Text("No reimbursement data available")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 40)
            } else {
                Chart {
                    ForEach(viewModel.reimbursementChartData) { data in
                        LineMark(
                            x: .value("Month", data.month),
                            y: .value("Amount", data.amount)
                        )
                        .foregroundStyle(Color.green.gradient)
                        .symbol(Circle())

                        AreaMark(
                            x: .value("Month", data.month),
                            y: .value("Amount", data.amount)
                        )
                        .foregroundStyle(Color.green.opacity(0.2).gradient)
                    }
                }
                .frame(height: 180)
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5)
    }

    // MARK: - Recent Trips Card
    private var recentTripsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Recent Personal Trips")
                    .font(.headline)

                Spacer()

                NavigationLink(destination: PersonalTripView()) {
                    Text("View All")
                        .font(.caption)
                        .foregroundColor(.blue)
                }
            }

            if viewModel.filteredTrips.isEmpty {
                Text("No personal trips recorded this month")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding(.vertical, 20)
            } else {
                ForEach(Array(viewModel.filteredTrips.prefix(5))) { trip in
                    tripRow(trip: trip)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5)
    }

    private func tripRow(trip: PersonalTrip) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(trip.purpose)
                        .font(.subheadline)
                        .fontWeight(.medium)

                    Text(trip.formattedDate)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(trip.formattedMiles)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(.purple)

                    Text(trip.vehicleNumber)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            if let notes = trip.notes {
                Text(notes)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }
        }
        .padding(.vertical, 8)

        if trip.id != viewModel.filteredTrips.prefix(5).last?.id {
            Divider()
        }
    }

    // MARK: - Action Buttons
    private var actionButtons: some View {
        VStack(spacing: 12) {
            NavigationLink(destination: PersonalTripView()) {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Log New Trip")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.purple)
                .foregroundColor(.white)
                .cornerRadius(12)
            }

            NavigationLink(destination: ReimbursementView()) {
                HStack {
                    Image(systemName: "dollarsign.circle.fill")
                    Text("View Reimbursements")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.green)
                .foregroundColor(.white)
                .cornerRadius(12)
            }

            Button(action: { viewModel.showingSubmitRequest = true }) {
                HStack {
                    Image(systemName: "paperplane.fill")
                    Text("Submit Reimbursement Request")
                        .fontWeight(.semibold)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(viewModel.canSubmitRequest ? Color.blue : Color.gray)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(!viewModel.canSubmitRequest)

            // Manager-only button
            NavigationLink(destination: ReimbursementQueueView()) {
                HStack {
                    Image(systemName: "checkmark.circle.fill")
                    Text("Approval Queue")
                        .fontWeight(.semibold)
                    if !viewModel.pendingRequests.isEmpty {
                        Text("\(viewModel.pendingRequests.count)")
                            .font(.caption)
                            .fontWeight(.bold)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.white)
                            .foregroundColor(.orange)
                            .cornerRadius(10)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.orange)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
        }
    }

    // MARK: - Policy Details Sheet
    private var policyDetailsSheet: some View {
        NavigationView {
            ScrollView {
                if let policy = viewModel.currentPolicy {
                    VStack(alignment: .leading, spacing: 16) {
                        Text(policy.name)
                            .font(.title2)
                            .fontWeight(.bold)

                        Text(policy.description)
                            .font(.body)
                            .foregroundColor(.secondary)

                        Divider()

                        policyDetailRow(
                            title: "Reimbursement Rate",
                            value: policy.formattedRate,
                            icon: "dollarsign.circle.fill",
                            color: .green
                        )

                        if let maxMiles = policy.formattedMaxMiles {
                            policyDetailRow(
                                title: "Maximum Monthly Miles",
                                value: maxMiles,
                                icon: "speedometer",
                                color: .blue
                            )
                        }

                        if let maxAmount = policy.formattedMaxAmount {
                            policyDetailRow(
                                title: "Maximum Monthly Amount",
                                value: maxAmount,
                                icon: "creditcard.fill",
                                color: .purple
                            )
                        }

                        Divider()

                        VStack(alignment: .leading, spacing: 8) {
                            Text("Allowed Purposes")
                                .font(.headline)

                            ForEach(policy.allowedPurposes, id: \.self) { purpose in
                                HStack {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundColor(.green)
                                    Text(purpose)
                                        .font(.subheadline)
                                }
                            }
                        }

                        Divider()

                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Requires Approval")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                Text(policy.requiresApproval ? "Yes" : "No")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }

                            Spacer()

                            VStack(alignment: .leading, spacing: 4) {
                                Text("Documentation Required")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                Text(policy.requiresDocumentation ? "Yes" : "No")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding()
                } else {
                    Text("No policy information available")
                        .foregroundColor(.secondary)
                        .padding()
                }
            }
            .navigationTitle("Reimbursement Policy")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        viewModel.showingPolicyDetails = false
                    }
                }
            }
        }
    }

    private func policyDetailRow(title: String, value: String, icon: String, color: Color) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title3)
                .frame(width: 30)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Text(value)
                    .font(.headline)
            }

            Spacer()
        }
    }

    // MARK: - Helper Methods
    private var monthYearText: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter.string(from: viewModel.selectedMonth)
    }

    private var isCurrentMonth: Bool {
        let calendar = Calendar.current
        return calendar.isDate(viewModel.selectedMonth, equalTo: Date(), toGranularity: .month)
    }

    private func previousMonth() {
        let calendar = Calendar.current
        if let newDate = calendar.date(byAdding: .month, value: -1, to: viewModel.selectedMonth) {
            viewModel.selectedMonth = newDate
            Task {
                await viewModel.loadMonthlySummary()
            }
        }
    }

    private func nextMonth() {
        let calendar = Calendar.current
        if let newDate = calendar.date(byAdding: .month, value: 1, to: viewModel.selectedMonth),
           newDate <= Date() {
            viewModel.selectedMonth = newDate
            Task {
                await viewModel.loadMonthlySummary()
            }
        }
    }

    private func exportMonthlyReport() {
        Task {
            if let url = await viewModel.exportMonthlyReport() {
                // Present share sheet with the exported file
                print("Report exported to: \(url)")
            }
        }
    }
}

#Preview {
    PersonalUseDashboardView()
}
