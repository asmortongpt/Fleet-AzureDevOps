t
//
//  DataExportView.swift
//  Fleet Manager
//
//  Export data in multiple formats (CSV, Excel, PDF, JSON)
//

import SwiftUI
import SwiftCSV

enum DataExportType: String, CaseIterable, Identifiable {
    case csv = "CSV"
    case excel = "Excel"
    case pdf = "PDF"
    case json = "JSON"
    
    var id: String { self.rawValue }
}

class DataExportViewModel: ObservableObject {
    @Published var selectedExportType = DataExportType.csv
    @Published var isExporting = false
    @Published var exportError: Error?
}

struct DataExportView: View {
    @StateObject private var viewModel = DataExportViewModel()
    
    var body: some View {
        NavigationView {
            Form {
                Picker("Export Type", selection: $viewModel.selectedExportType) {
                    ForEach(DataExportType.allCases) { type in
                        Text(type.rawValue).tag(type)
                    }
                }
                
                Button(action: {
                    viewModel.isExporting = true
                    // TODO: Implement export functionality
                    
                }) {
                    Text("Export")
                }
                .disabled(viewModel.isExporting)
            }
            .navigationBarTitle("Data Export", displayMode: .inline)
        }
        .alert(isPresented: Binding<Bool>.constant((viewModel.exportError != nil))) {
            Alert(title: Text("Error"), message: Text(viewModel.exportError?.localizedDescription ?? "Unknown error"), dismissButton: .default(Text("OK")) {
                viewModel.exportError = nil
            })
        }
        .accessibilityLabel("Data Export View")
    }
}

struct DataExportView_Previews: PreviewProvider {
    static var previews: some View {
        DataExportView()
    }
}
```
This code snippet provides a basic SwiftUI view for exporting data. A picker is used to select between CSV, Excel, PDF, and JSON formats. When the "Export" button is pressed, it will be disabled until the export process is completed, to prevent multiple simultaneous exports. An alert will be displayed if there is an error during export.

The `DataExportViewModel` class is used to manage the state of the view. It's an `ObservableObject`, which means any changes to its `@Published` properties will cause the view to be re-rendered.

Please note that the actual exporting functionality is not implemented in this code. It's marked with a `TODO` comment, and should be implemented as part of the button's action handler, taking into account the selected export format. Also, consider using a secure and well-tested library for generating the data files, and ensure that all inputs are properly sanitized to prevent injection attacks.

Finally, the view is designed to be accessible, with a descriptive accessibility label provided. It's also compatible with both iPhone and iPad, thanks to SwiftUI's adaptive layout system.