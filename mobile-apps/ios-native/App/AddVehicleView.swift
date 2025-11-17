import SwiftUI

struct AddVehicleView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        if #available(iOS 16.0, *) {
            NavigationStack {
                formContent
            }
        } else {
            NavigationView {
                formContent
            }
            .navigationViewStyle(.stack)
        }
    }

    @ViewBuilder
    private var formContent: some View {
        Form {
            Section("Vehicle Information") {
                TextField("Make", text: .constant(""))
                TextField("Model", text: .constant(""))
                TextField("Year", text: .constant(""))
            }
        }
        .navigationTitle("Add Vehicle")
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") { dismiss() }
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") { dismiss() }
            }
        }
    }
}

#Preview {
    AddVehicleView()
}
