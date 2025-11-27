/**
 * Vehicle Details View
 * Displays comprehensive information about a vehicle
 * Shown after vehicle request approval or when viewing vehicle details
 */

import SwiftUI
import MapKit

struct VehicleDetailsView: View {
    let vehicle: Vehicle
    @Environment(\.dismiss) private var dismiss
    @State private var region: MKCoordinateRegion

    init(vehicle: Vehicle) {
        self.vehicle = vehicle
        self._region = State(initialValue: MKCoordinateRegion(
            center: vehicle.location.coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
        ))
    }

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                        private func colorFromString(_ colorString: String) -> Color {
        switch colorString.lowercased() {
        case "green": return .green
        case "orange": return .orange
        case "blue": return .blue
        case "yellow": return .yellow
        case "gray": return .gray
        case "red": return .red
        default: return .gray
        }
    }
}

// MARK: - Preview

#Preview {
    VehicleDetailsView(vehicle: Vehicle.sampleAvailable)
}
