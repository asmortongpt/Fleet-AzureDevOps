t
//
//  DispatchConsoleView.swift
//  Fleet Manager
//
//  Central dispatch hub with real-time vehicle tracking, driver communication, and job assignment
//

import SwiftUI
import MapKit
import Combine

// MARK: - DispatchConsoleView
struct DispatchConsoleView: View {
    @StateObject private var viewModel = DispatchConsoleViewModel()
    
    var body: some View {
        NavigationView {
            VStack {
                MapView(coordinate: viewModel.location)
                    .edgesIgnoringSafeArea(.top)
                    .frame(height: 300)
                
                List {
                    ForEach(viewModel.vehicles) { vehicle in
                        NavigationLink(destination: VehicleDetailView(vehicle: vehicle)) {
                            VehicleCard(vehicle: vehicle)
                        }
                    }
                }
                .navigationTitle("Dispatch Console")
            }
        }
    }
}

// MARK: - DispatchConsoleViewModel
class DispatchConsoleViewModel: ObservableObject {
    
    // Current location of the fleet. 
    @Published var location: CLLocationCoordinate2D = CLLocationCoordinate2D()
    
    // List of Vehicles in the fleet.
    @Published var vehicles: [Vehicle] = []
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        // Fetch location and vehicles from database
        fetchLocation()
        fetchVehicles()
    }
    
    func fetchLocation() {
        // Fetch location logic here. For demo purpose, we are using hardcoded value
        self.location = CLLocationCoordinate2D(latitude: 34.011_286, longitude: -116.166_868)
    }
    
    func fetchVehicles() {
        // Fetch vehicle logic here. For demo purpose, we are using hardcoded value
        self.vehicles = [
            Vehicle(id: UUID(), name: "Vehicle 1", status: "Running"),
            Vehicle(id: UUID(), name: "Vehicle 2", status: "Idle")
        ]
    }
}

// Vehicle Model
struct Vehicle: Identifiable {
    var id: UUID
    var name: String
    var status: String
}

// MARK: - MapView
struct MapView: UIViewRepresentable {
    var coordinate: CLLocationCoordinate2D

    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        return mapView
    }

    func updateUIView(_ view: MKMapView, context: Context) {
        let region = MKCoordinateRegion(center: coordinate, latitudinalMeters: 10000, longitudinalMeters: 10000)
        view.setRegion(region, animated: true)
    }
}

// MARK: - Previews
#if DEBUG
struct DispatchConsoleView_Previews: PreviewProvider {
    static var previews: some View {
        DispatchConsoleView()
    }
}
#endif