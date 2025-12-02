t
//
//  TripTrackingView.swift
//  Fleet Manager
//
//  This view provides real-time GPS tracking, trip start/stop controls, distance and time tracking, route visualization
//

import SwiftUI
import MapKit

// MARK: - TripTrackingView
struct TripTrackingView: View {
    
    @StateObject private var viewModel = TripTrackingViewModel()
    
    var body: some View {
        NavigationView {
            VStack {
                MapView(route: $viewModel.route)
                    .accessibility(label: Text("Route Map"))
                List {
                    Section(header: Text("Trip Details")) {
                        HStack {
                            Text("Distance")
                            Spacer()
                            Text("\(viewModel.distance, specifier: "%.2f") km")
                        }
                        HStack {
                            Text("Time")
                            Spacer()
                            Text("\(viewModel.time, specifier: "%.2f") hr")
                        }
                    }
                    Section(header: Text("Controls")) {
                        Button(action: {
                            viewModel.startTrip()
                        }) {
                            HStack {
                                Image(systemName: "play.fill")
                                Text("Start Trip")
                            }
                        }
                        .accessibility(label: Text("Start Trip"))
                        
                        Button(action: {
                            viewModel.stopTrip()
                        }) {
                            HStack {
                                Image(systemName: "stop.fill")
                                Text("Stop Trip")
                            }
                        }
                        .accessibility(label: Text("Stop Trip"))
                    }
                }
                .listStyle(GroupedListStyle())
            }
            .navigationTitle("Trip Tracking")
        }
    }
}

// MARK: - TripTrackingViewModel
class TripTrackingViewModel: ObservableObject {
    
    @Published var route: MKPolyline? = nil
    @Published var distance = 0.0
    @Published var time = 0.0
    
    func startTrip() {
        // Start tracking and update route, distance, time
    }
    
    func stopTrip() {
        // Stop tracking and update route, distance, time
    }
}

// MARK: - MapView
struct MapView: UIViewRepresentable {
    
    @Binding var route: MKPolyline?
    
    func makeUIView(context: Context) -> MKMapView {
        let mapView = MKMapView()
        mapView.delegate = context.coordinator
        return mapView
    }
    
    func updateUIView(_ uiView: MKMapView, context: Context) {
        if let route = route {
            uiView.addOverlay(route)
        }
    }
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, MKMapViewDelegate {
        var parent: MapView
        
        init(_ parent: MapView) {
            self.parent = parent
        }
        
        func mapView(_ mapView: MKMapView, rendererFor overlay: MKOverlay) -> MKOverlayRenderer {
            let renderer = MKPolylineRenderer(overlay: overlay)
            renderer.strokeColor = .blue
            renderer.lineWidth = 2
            return renderer
        }
    }
}

#if DEBUG
struct TripTrackingView_Previews: PreviewProvider {
    static var previews: some View {
        TripTrackingView()
    }
}
#endif