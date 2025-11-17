import SwiftUI

struct AddTripView: View {
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
            Section("Trip Information") {
                TextField("Destination", text: .constant(""))
                TextField("Purpose", text: .constant(""))
            }
        }
        .navigationTitle("Add Trip")
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
    AddTripView()
}
