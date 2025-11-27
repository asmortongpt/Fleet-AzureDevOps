Sure, here is a SwiftUI view that meets the requirements.

```swift
//
//  EnvironmentalDashboardView.swift
//  Fleet Manager
//
//  Created by Fleet Manager on 10/20/21.
//

import SwiftUI

// MARK: - Environmental Metrics
struct EnvironmentalMetric: Identifiable {
    let id = UUID()
    let title: String
    let carbonEmission: Double
    let sustainabilityIndex: Double
}

// ViewModel for EnvironmentalDashboard
class EnvironmentalDashboardViewModel: ObservableObject {
    @Published var metrics: [EnvironmentalMetric]
    @Published var isLoading: Bool = false
    @Published var isError: Bool = false

    // Initialize with dummy data (replace with real data fetch)
    init() {
        self.metrics = [
            EnvironmentalMetric(title: "Vehicle 1", carbonEmission: 1200.0, sustainabilityIndex: 80.0),
            EnvironmentalMetric(title: "Vehicle 2", carbonEmission: 900.0, sustainabilityIndex: 85.0),
            EnvironmentalMetric(title: "Vehicle 3", carbonEmission: 1500.0, sustainabilityIndex: 75.0)
        ]
    }
}

// EnvironmentalDashboardView
struct EnvironmentalDashboardView: View {
    @StateObject private var viewModel = EnvironmentalDashboardViewModel()

    var body: some View {
        NavigationView {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                } else if viewModel.isError {
                    Text("An error occurred")
                } else {
                    List {
                        ForEach(viewModel.metrics) { metric in
                            MetricCard(metric: metric)
                        }
                    }
                    .navigationTitle("Environmental Dashboard")
                }
            }
        }
    }
}

// MetricCard
struct MetricCard: View {
    let metric: EnvironmentalMetric

    var body: some View {
        VStack(alignment: .leading) {
            Text(metric.title)
                .font(.headline)
                .padding(.bottom, 1)
            HStack {
                Image(systemName: "leaf.arrow.circlepath")
                Text("Carbon Emission: \(metric.carbonEmission, specifier: "%.2f") kg")
            }
            HStack {
                Image(systemName: "gauge")
                Text("Sustainability Index: \(metric.sustainabilityIndex, specifier: "%.2f")")
            }
        }
        .padding()
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.gray, lineWidth: 0.5)
        )
        .accessibilityElement(children: .ignore)
        .accessibility(label: Text("Environmental metrics for \(metric.title) with carbon emission \(metric.carbonEmission, specifier: "%.2f") kg and sustainability index \(metric.sustainabilityIndex, specifier: "%.2f")"))
    }
}

#if DEBUG
struct EnvironmentalDashboardView_Previews: PreviewProvider {
    static var previews: some View {
        EnvironmentalDashboardView()
    }
}
#endif