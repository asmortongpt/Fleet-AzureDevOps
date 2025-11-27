t
//
//  FleetOptimizerView.swift
//  Fleet Manager
//
//  AI-powered recommendations to optimize fleet operations
//
import SwiftUI
import Combine

struct FleetOptimizerView: View {
    @StateObject private var viewModel = FleetOptimizerViewModel()
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        NavigationView {
            VStack {
                if viewModel.isLoading {
                    ActivityIndicator(isAnimating: .constant(true), style: .large)
                } else {
                    List {
                        ForEach(viewModel.recommendations) { recommendation in
                            RecommendationCard(recommendation: recommendation)
                        }
                    }
                    .accessibility(label: Text("Fleet Optimization Recommendations"))
                }
            }
            .alert(isPresented: $viewModel.hasError) {
                Alert(
                    title: Text("Error"),
                    message: Text(viewModel.errorMessage),
                    dismissButton: .default(Text("OK"))
                )
            }
            .navigationTitle("Fleet Optimizer")
            .navigationBarItems(trailing:
                Button(action: {
                    viewModel.fetchRecommendations()
                }) {
                    Image(systemName: "arrow.clockwise")
                        .accessibility(label: Text("Reload Recommendations"))
                }
            )
        }
    }
}

// MARK: - FleetOptimizerViewModel
class FleetOptimizerViewModel: ObservableObject {
    @Published var recommendations: [RecommendationItem] = []
    @Published var isLoading = false
    @Published var hasError = false
    @Published var errorMessage = ""

    private var cancellables = Set<AnyCancellable>()

    init() {
        self.fetchRecommendations()
    }

    func fetchRecommendations() {
        self.isLoading = true
        // Use your data fetching logic here and update the recommendations array
    }
}

struct RecommendationItem: Identifiable {
    let id = UUID()
    let title: String
    let details: String
    let vehicleId: String
    let driverId: String
}

struct RecommendationCard: View {
    var recommendation: RecommendationItem

    var body: some View {
        VStack(alignment: .leading) {
            Text(recommendation.title)
                .font(.headline)
            Text(recommendation.details)
                .font(.subheadline)
        }
        .padding()
        .background(Color.white)
        .cornerRadius(8)
        .shadow(radius: 5)
    }
}

#if DEBUG
struct FleetOptimizerView_Previews: PreviewProvider {
    static var previews: some View {
        FleetOptimizerView()
    }
}
#endif