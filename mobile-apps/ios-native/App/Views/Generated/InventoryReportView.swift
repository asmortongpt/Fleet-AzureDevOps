t
//
//  InventoryReportView.swift
//  Fleet Manager
//
//  Inventory reports with usage trends and valuation
//

import SwiftUI
import Combine

// MARK: - Inventory Report Model
struct InventoryReport: Identifiable {
    let id = UUID()
    let vehicleId: String
    let usageTrend: Double
    let valuation: Double
}

// MARK: - Inventory Report ViewModel
class InventoryReportViewModel: ObservableObject {
    @Published var reports = [InventoryReport]()
    @Published var isLoading = false
    @Published var error: Error?

    private var cancellables = Set<AnyCancellable>()

    init() {
        loadReports()
    }

    func loadReports() {
        self.isLoading = true
        // Fetch reports from your data source here
        // Make sure to use parameterized SQL queries or similar
        // to prevent SQL injection attacks
    }
}

// MARK: - Inventory Report View
struct InventoryReportView: View {
    @StateObject private var viewModel = InventoryReportViewModel()

    var body: some View {
        NavigationView {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                } else if let error = viewModel.error {
                    Text(error.localizedDescription)
                } else {
                    List(viewModel.reports) { report in
                        VStack(alignment: .leading) {
                            Text("Vehicle ID: \(report.vehicleId)")
                            Text("Usage Trend: \(report.usageTrend)")
                            Text("Valuation: \(report.valuation)")
                        }
                        .padding()
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel("Inventory report for vehicle \(report.vehicleId)")
                    }
                    .navigationTitle("Inventory Reports")
                }
            }
        }
    }
}

#if DEBUG
struct InventoryReportView_Previews: PreviewProvider {
    static var previews: some View {
        InventoryReportView()
    }
}
#endif