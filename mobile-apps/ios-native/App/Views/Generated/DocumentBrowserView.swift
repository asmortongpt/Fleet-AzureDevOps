t
//  
//  DocumentBrowserView.swift
//  Fleet Manager
//
//  Document browser with search, preview, and organization
//

import SwiftUI
import Combine

// MARK: - DocumentItem Model
struct DocumentItem: Identifiable {
    let id: UUID
    let name: String
    let description: String
    let date: Date
    let url: URL
}

// MARK: - DocumentBrowserViewModel
class DocumentBrowserViewModel: ObservableObject {
    @Published var documents = [DocumentItem]()
    @Published var searchQuery = ""
    @Published var isLoading = false
    @Published var error: Error?

    private var cancellables = Set<AnyCancellable>()

    init() {
        fetchDocuments()
    }

    private func fetchDocuments() {
        // Fetching logic here
        // Handle loading state, errors, and secure fetching of documents
    }
}

// MARK: - DocumentBrowserView
struct DocumentBrowserView: View {
    @StateObject private var viewModel = DocumentBrowserViewModel()

    var body: some View {
        NavigationView {
            List {
                SearchBar(text: $viewModel.searchQuery)
                ForEach(viewModel.documents) { document in
                    DocumentCard(document: document)
                }
            }
            .navigationTitle("Documents")
        }
        .overlay(
            Group {
                if viewModel.isLoading {
                    ProgressView()
                } else if let error = viewModel.error {
                    Text("Error: \(error.localizedDescription)")
                }
            }
        )
    }
}

// MARK: - DocumentCard
struct DocumentCard: View {
    let document: DocumentItem

    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(document.name)
                    .font(.headline)
                Text(document.description)
                    .font(.subheadline)
            }
            Spacer()
            Text("\(document.date, formatter: DateFormatter.shortDate)")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}

// MARK: - DocumentBrowserView_Previews
#if DEBUG
struct DocumentBrowserView_Previews: PreviewProvider {
    static var previews: some View {
        DocumentBrowserView()
    }
}
#endif