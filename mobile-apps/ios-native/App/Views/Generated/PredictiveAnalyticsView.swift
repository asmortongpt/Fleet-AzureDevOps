t
//
//  PredictiveAnalyticsView.swift
//  Fleet Manager
//
//  Displays AI predictions for maintenance, cost forecasting, and usage patterns
//

import SwiftUI
import Combine

// MARK: - View Model
class PredictiveAnalyticsViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: Error?
    @Published var predictions = [Prediction]()

    // Fetch predictions from the server
    func fetchPredictions() {
        self.isLoading = true
        // Replace with your actual data fetching logic
        // Ensure to validate inputs, use parameterized queries, and handle errors
    }
}

// MARK: - Prediction Model
struct Prediction: Identifiable {
    let id = UUID()
    let vehicleId: String
    let maintenanceDate: Date
    let cost: Double
    let usagePattern: String
}

// MARK: - Predictive Analytics View
struct PredictiveAnalyticsView: View {
    @StateObject private var viewModel = PredictiveAnalyticsViewModel()

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.predictions) { prediction in
                    VStack(alignment: .leading) {
                        Text("Vehicle ID: \(prediction.vehicleId)")
                            .font(.headline)
                        Text("Predicted Maintenance Date: \(prediction.maintenanceDate, formatter: DateFormatter())")
                        Text("Predicted Cost: \(prediction.cost, specifier: "%.2f")")
                        Text("Usage Pattern: \(prediction.usagePattern)")
                    }
                    .padding()
                }
            }
            .navigationTitle("Predictive Analytics")
            .onAppear(perform: viewModel.fetchPredictions)
        }
        .alert(isPresented: Binding<Bool>.constant((viewModel.error != nil))) {
            Alert(
                title: Text("Error"),
                message: Text(viewModel.error?.localizedDescription ?? "Unknown error"),
                dismissButton: .default(Text("OK")) {
                    viewModel.error = nil
                }
            )
        }
    }
}

// MARK: - Preview Provider
#if DEBUG
struct PredictiveAnalyticsView_Previews: PreviewProvider {
    static var previews: some View {
        PredictiveAnalyticsView()
    }
}
#endif