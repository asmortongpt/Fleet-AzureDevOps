t
//
//  DataWorkbenchView.swift
//  Fleet Manager
//
//  DataWorkbenchView lets users query and visualize fleet data.
//

import SwiftUI
import Charts

// MARK: - DataWorkbenchView
struct DataWorkbenchView: View {
    @StateObject private var viewModel = DataWorkbenchViewModel()
    @State private var selectedQuery: String = ""

    var body: some View {
        NavigationView {
            VStack {
                Form {
                    Section(header: Text("Query Builder")) {
                        TextField("Enter your SQL query", text: $selectedQuery)
                            .accessibilityLabel("SQL Query Input")
                        Button("Run Query") {
                            viewModel.runQuery(query: selectedQuery)
                        }
                        .accessibilityLabel("Run Query Button")
                        .disabled(!viewModel.canRunQuery)
                    }
                    
                    Section(header: Text("Results")) {
                        if viewModel.isLoading {
                            ProgressView()
                                .accessibilityLabel("Loading Results")
                        } else if let error = viewModel.error {
                            Text("Error: \(error.localizedDescription)")
                                .foregroundColor(.red)
                                .accessibilityLabel("Error Message")
                        } else if let data = viewModel.queryResult {
                            ResultChartView(data: data)
                                .accessibilityLabel("Query Results Visualization")
                        } else {
                            Text("No data to display.")
                                .foregroundColor(.gray)
                                .accessibilityLabel("No Data Message")
                        }
                    }
                }
                .navigationTitle("Data Workbench")
            }
        }
    }
}

// MARK: - DataWorkbenchViewModel
class DataWorkbenchViewModel: ObservableObject {
    @Published var queryResult: [ChartDataEntry]?
    @Published var isLoading: Bool = false
    @Published var error: Error?
    @Published var canRunQuery: Bool = false

    func runQuery(query: String) {
        isLoading = true
        error = nil
        // Parameterize and validate input query here,
        // then execute it asynchronously using SQL client library
        // On completion, update isLoading, error, and queryResult as appropriate
    }
}

// MARK: - Preview Provider
#if DEBUG
struct DataWorkbenchView_Previews: PreviewProvider {
    static var previews: some View {
        DataWorkbenchView()
    }
}
#endif