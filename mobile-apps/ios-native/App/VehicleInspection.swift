import SwiftUI

// Vehicle Inspection View
// Allows drivers to perform pre-trip and post-trip vehicle inspections
struct VehicleInspectionScreenView: View {
    @Environment(\.presentationMode) var presentationMode: Binding<PresentationMode>
    @State private var selectedVehicle: Vehicle?
    @State private var inspectionType: InspectionType = .preTrip
    @State private var notes: String = ""
    @State private var checklistItems: [InspectionItem] = []

    enum InspectionType: String, CaseIterable {
        case preTrip = "Pre-Trip"
        case postTrip = "Post-Trip"
        case routine = "Routine"
    }

    struct InspectionItem: Identifiable {
        let id = UUID()
        var name: String
        var isChecked: Bool = false
        var notes: String = ""
    }

    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Inspection Type")) {
                    Picker("Type", selection: $inspectionType) {
                        ForEach(InspectionType.allCases, id: \.self) { type in
                            Text(type.rawValue).tag(type)
                        }
                    }
                    .pickerStyle(.segmented)
                }

                Section(header: Text("Checklist")) {
                    ForEach($checklistItems) { $item in
                        HStack {
                            Image(systemName: item.isChecked ? "checkmark.square.fill" : "square")
                                .foregroundColor(item.isChecked ? .green : .gray)
                                .onTapGesture {
                                    item.isChecked.toggle()
                                }

                            Text(item.name)

                            Spacer()
                        }
                    }
                }

                Section(header: Text("Notes")) {
                    TextEditor(text: $notes)
                        .frame(minHeight: 100)
                }
            }
            .navigationTitle("Vehicle Inspection")
            .navigationBarItems(
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                },
                trailing: Button("Complete") {
                    completeInspection()
                }
            )
        }
        .onAppear {
            loadChecklistItems()
        }
    }

    private func loadChecklistItems() {
        checklistItems = [
            InspectionItem(name: "Tires and wheels"),
            InspectionItem(name: "Lights and signals"),
            InspectionItem(name: "Fluid levels"),
            InspectionItem(name: "Brakes"),
            InspectionItem(name: "Mirrors and windows"),
            InspectionItem(name: "Emergency equipment"),
            InspectionItem(name: "Interior condition"),
            InspectionItem(name: "Exterior condition")
        ]
    }

    private func completeInspection() {
        // Save inspection data
        presentationMode.wrappedValue.dismiss()
    }
}

#if DEBUG
struct VehicleInspection_Previews: PreviewProvider {
    static var previews: some View {
        VehicleInspectionScreenView()
    }
}
#endif
