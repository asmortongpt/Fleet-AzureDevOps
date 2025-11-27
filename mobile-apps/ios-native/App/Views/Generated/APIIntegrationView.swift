t
//
//  APIIntegrationView.swift
//  Fleet Manager
//
//  A view for managing API integration with webhook configuration
//

import SwiftUI
import Combine

// MARK: - APIIntegrationViewModel
@MainActor
class APIIntegrationViewModel: ObservableObject {
    @Published var isLoading: Bool = false
    @Published var errorMessage: String = ""
    @Published var webhookConfig: WebhookConfig? = nil

    private var cancellables = Set<AnyCancellable>()

    // Fetch webhook configuration from API
    func fetchWebhookConfig() {
        isLoading = true

        // APIManager is a hypothetical API class for managing API calls
        APIManager.fetchWebhookConfig()
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isLoading = false
                if case let .failure(error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
            } receiveValue: { [weak self] config in
                self?.webhookConfig = config
            }
            .store(in: &cancellables)
    }
}

// MARK: - APIIntegrationView
struct APIIntegrationView: View {
    @StateObject private var viewModel = APIIntegrationViewModel()

    var body: some View {
        NavigationView {
            Form {
                if viewModel.isLoading {
                    ProgressView()
                        .accessibilityLabel("Loading API configuration")
                } else {
                    Section(header: Text("Webhook Configuration")) {
                        if let config = viewModel.webhookConfig {
                            Text("URL: \(config.url)")
                            Text("Secret Key: \(config.secret)")
                        } else {
                            Text("No Configuration Found")
                        }
                    }
                }
            }
            .navigationTitle("API Integration")
            .alert(isPresented: .constant(!viewModel.errorMessage.isEmpty), content: {
                Alert(title: Text("Error"), message: Text(viewModel.errorMessage), dismissButton: .default(Text("OK")))
            })
            .onAppear(perform: {
                viewModel.fetchWebhookConfig()
            })
        }
    }
}

// MARK: - APIIntegrationView_Previews
#if DEBUG
struct APIIntegrationView_Previews: PreviewProvider {
    static var previews: some View {
        APIIntegrationView()
    }
}
#endif