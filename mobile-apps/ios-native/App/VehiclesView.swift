import SwiftUI

struct VehiclesView: View {
    @StateObject private var viewModel = VehicleViewModel()

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.vehicles) { vehicle in
                    VehicleCard(vehicle: vehicle)
                }
            }
            .navigationTitle("Vehicles")
        }
    }
}

#if DEBUG
struct VehiclesView_Previews: PreviewProvider {
    static var previews: some View {
        VehiclesView()
    }
}
#endif
