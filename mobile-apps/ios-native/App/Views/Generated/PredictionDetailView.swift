t
//
//  PredictionDetailView.swift
//  Fleet Manager
//
//  Detailed predictions with confidence scores and trend analysis
//

import SwiftUI
import Combine

// MARK: - Prediction Detail
struct PredictionDetail: Identifiable {
    let id = UUID()
    let title: String
    let confidence: Double
    let trend: TrendType
}

enum TrendType: String {
    case increasing = "Increasing"
    case decreasing = "Decreasing"
    case stable = "Stable"
}

// MARK: - PredictionDetailView
struct PredictionDetailView: View {
    @StateObject private var viewModel = PredictionDetailViewModel()

    var body: some View {
        NavigationView {
            List(viewModel.predictions) { prediction in
                PredictionCard(prediction: prediction)
            }
            .navigationTitle("Predictions")
            .accessibility(identifier: "PredictionDetailList")
            .navigationBarItems(trailing: Button(action: viewModel.loadPredictions) {
                Image(systemName: "arrow.clockwise")
                    .accessibility(label: Text("Refresh Predictions"))
            })
        }
    }
}

struct PredictionCard: View {
    let prediction: PredictionDetail

    var body: some View {
        VStack(alignment: .leading) {
            Text(prediction.title)
                .font(.headline)
                .accessibility(identifier: "PredictionTitle")
            HStack {
                Text("Confidence: \(prediction.confidence, specifier: "%.2f")")
                    .font(.subheadline)
                    .accessibility(identifier: "PredictionConfidence")
                Spacer()
                Text("Trend: \(prediction.trend.rawValue)")
                    .font(.subheadline)
                    .accessibility(identifier: "PredictionTrend")
            }
            .padding(.top, 2)
        }
        .padding(.vertical, 8)
    }
}

// MARK: - PredictionDetailViewModel
class PredictionDetailViewModel: ObservableObject {
    @Published var predictions = [PredictionDetail]()

    private var cancellables = Set<AnyCancellable>()

    init() {
        loadPredictions()
    }

    func loadPredictions() {
        // Fetch data from server and populate `predictions`
        // This is just a placeholder, replace with actual data fetching code
        let dummyData = (1...10).map { _ in
            PredictionDetail(title: "Dummy Prediction", confidence: Double.random(in: 0...1), trend: .stable)
        }
        predictions = dummyData
    }
}

// MARK: - Preview
#if DEBUG
struct PredictionDetailView_Previews: PreviewProvider {
    static var previews: some View {
        PredictionDetailView()
    }
}
#endif