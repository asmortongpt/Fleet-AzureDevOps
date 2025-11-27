t
//
//  GeofenceListView.swift
//  Fleet Manager
//
//  A SwiftUI View for managing geofences with creation, editing, and monitoring
//

import SwiftUI
import MapKit

// MARK: - Geofence Item
struct GeofenceItem: Identifiable {
    let id = UUID()
    let name: String
    let radius: Double
    let coordinates: CLLocationCoordinate2D
}

class GeofenceListViewModel: ObservableObject {
    @Published var geofences: [GeofenceItem] = []
    // TODO: Implement loading and error state handling
}

struct GeofenceListView: View {
    @StateObject private var viewModel = GeofenceListViewModel()
    
    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.geofences) { geofence in
                    NavigationLink(destination: GeofenceDetailView(geofence: geofence)) {
                        HStack {
                            VStack(alignment: .leading) {
                                Text(geofence.name)
                                    .font(.headline)
                                    .accessibilityLabel("Geofence name: \(geofence.name)")
                                Text("Coordinates: \(geofence.coordinates.latitude), \(geofence.coordinates.longitude)")
                                    .font(.subheadline)
                                    .accessibilityLabel("Geofence coordinates: \(geofence.coordinates.latitude), \(geofence.coordinates.longitude)")
                                Text("Radius: \(geofence.radius) meters")
                                    .font(.subheadline)
                                    .accessibilityLabel("Geofence radius: \(geofence.radius) meters")
                            }
                            
                            Spacer()
                            
                            Image(systemName: "location.circle")
                                .resizable()
                                .frame(width: 30, height: 30)
                        }
                    }
                }
            }
            .navigationTitle("Geofences")
            .navigationBarItems(trailing: Button(action: {
                // TODO: Handle create new geofence
            }) {
                Image(systemName: "plus")
            })
        }
    }
}

#if DEBUG
struct GeofenceListView_Previews: PreviewProvider {
    static var previews: some View {
        GeofenceListView()
    }
}
#endif