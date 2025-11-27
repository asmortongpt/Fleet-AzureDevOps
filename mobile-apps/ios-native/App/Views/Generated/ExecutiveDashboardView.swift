t
//
//  ExecutiveDashboardView.swift
//  Fleet Manager
//
//  SwiftUI View for an Executive Dashboard with high-level KPIs, interactive charts and trend indicators.
//

import SwiftUI
import Charts

// MARK: - Executive Dashboard ViewModel
class ExecutiveDashboardViewModel: ObservableObject {
    @Published var isLoading = true
    @Published var isError = false
    @Published var KPIs: [KPIItem] = []

    init() {
        loadKPIs()
    }

    func loadKPIs() {
        // Simulated network call to fetch KPIs
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            self.KPIs = MockData.sampleKPIs
            self.isLoading = false
        }
    }
}

// MARK: - Executive Dashboard View
struct ExecutiveDashboardView: View {
    @StateObject private var viewModel = ExecutiveDashboardViewModel()

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                        .progressViewStyle(CircularProgressViewStyle(tint: .blue))
                        .accessibility(label: Text("Loading Dashboard Data"))
                } else if viewModel.isError {
                    Text("Failed to load data. Please try again.")
                        .foregroundColor(.red)
                } else {
                    List(viewModel.KPIs) { kpi in
                        KPICardView(kpi: kpi)
                    }
                    .navigationTitle("Executive Dashboard")
                }
            }
        }
    }
}

// MARK: - KPI Card View
struct KPICardView: View {
    let kpi: KPIItem

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(kpi.title)
                .font(.headline)
                .accessibility(label: Text("\(kpi.title) KPI"))
            HStack {
                // KPI Value
                Text("\(kpi.value)")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .accessibility(label: Text("KPI Value is \(kpi.value)"))
                Spacer()
                // Trend Indicator
                Image(systemName: kpi.trend == .up ? "arrow.up" : "arrow.down")
                    .foregroundColor(kpi.trend == .up ? .green : .red)
                    .accessibility(label: Text("Trend is \(kpi.trend.rawValue)"))
            }
            Text(kpi.description)
                .font(.subheadline)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.2), radius: 5, x: 0, y: 5)
        .accessibilityElement(children: .combine)
    }
}

// MARK: - Preview Provider
#if DEBUG
struct ExecutiveDashboardView_Previews: PreviewProvider {
    static var previews: some View {
        ExecutiveDashboardView()
    }
}
#endif