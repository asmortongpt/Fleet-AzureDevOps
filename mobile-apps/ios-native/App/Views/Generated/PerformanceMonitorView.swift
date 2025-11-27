t
//
//  PerformanceMonitorView.swift
//  Fleet Manager
//
//  View for monitoring application performance metrics and diagnostics
//

import SwiftUI

enum PerformanceMetric: String, CaseIterable {
    case cpuUsage = "CPU Usage"
    case memoryUsage = "Memory Usage"
    case networkUsage = "Network Usage"
    case diskUsage = "Disk Usage"
}

struct PerformanceMonitorView: View {
    @StateObject private var viewModel = PerformanceMonitorViewModel()
    
    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.metrics, id: \.self) { metric in
                    HStack {
                        Text(metric.rawValue)
                            .font(.headline)
                        Spacer()
                        Text(viewModel.getMetricValue(metric))
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 10)
                }
            }
            .navigationTitle("Performance Metrics")
            .accessibilityLabel("Performance Metrics List")
        }
    }
}

// MARK: - Performance Monitor ViewModel
class PerformanceMonitorViewModel: ObservableObject {
    @Published var metrics = PerformanceMetric.allCases
    
    func getMetricValue(_ metric: PerformanceMetric) -> String {
        switch metric {
        case .cpuUsage:
            return "\(Int.random(in: 1...100))%"
        case .memoryUsage:
            return "\(Int.random(in: 500...2000)) MB"
        case .networkUsage:
            return "\(Int.random(in: 100...500)) KB/s"
        case .diskUsage:
            return "\(Int.random(in: 1...100))%"
        }
    }
}

#if DEBUG
struct PerformanceMonitorView_Previews: PreviewProvider {
    static var previews: some View {
        PerformanceMonitorView()
    }
}
#endif