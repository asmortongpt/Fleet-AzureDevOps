t
//
//  TelemetryDashboardView.swift
//  Fleet Manager
//
//  Real-time vehicle telemetry data view
//

import SwiftUI
import Combine

// MARK: - Telemetry Data Model
struct TelemetryData: Identifiable {
    let id = UUID()
    let vehicleId: String
    let rpm: Double
    let speed: Double
    let fuelLevel: Double
    let coolantTemp: Double
    let engineLoad: Double
}

// MARK: - Telemetry Dashboard View Model
final class TelemetryDashboardViewModel: ObservableObject {
    @Published var telemetryData: [TelemetryData] = []
    @Published var error: Error?
    @Published var isLoading: Bool = false
    
    private var cancellables = Set<AnyCancellable>()
    
    // Fetch telemetry data method
    func fetchTelemetryData(for vehicleId: String) {
        // Implement API call to fetch telemetry data
    }
}

// MARK: - Telemetry Dashboard View
struct TelemetryDashboardView: View {
    @StateObject private var viewModel = TelemetryDashboardViewModel()
    
    var body: some View {
        NavigationView {
            VStack {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    List(viewModel.telemetryData) { data in
                        VStack(alignment: .leading) {
                            Text("RPM: \(data.rpm)")
                            Text("Speed: \(data.speed)")
                            Text("Fuel Level: \(data.fuelLevel)")
                            Text("Coolant Temperature: \(data.coolantTemp)")
                            Text("Engine Load: \(data.engineLoad)")
                        }
                        .padding()
                        .background(Color(.systemGroupedBackground))
                        .cornerRadius(10)
                        .shadow(color: Color(.separator), radius: 1, x: 0, y: 1)
                    }
                    .navigationTitle("Telemetry Dashboard")
                    .alert(item: $viewModel.error) { error in
                        Alert(title: Text("Error"), message: Text(error.localizedDescription), dismissButton: .default(Text("OK")))
                    }
                }
            }
            .padding()
        }
        .onAppear { viewModel.fetchTelemetryData(for: "vehicleId") }
    }
}

// MARK: - Telemetry Dashboard View Previews
#if DEBUG
struct TelemetryDashboardView_Previews: PreviewProvider {
    static var previews: some View {
        TelemetryDashboardView()
    }
}
#endif