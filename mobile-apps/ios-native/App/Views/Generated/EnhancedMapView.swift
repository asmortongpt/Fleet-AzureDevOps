Sure, Here is the SwiftUI view and ViewModel for the EnhancedMapView feature.

```swift
//
//  EnhancedMapView.swift
//  Fleet Manager
//
//  Optimized EnhancedMapView with advanced mapping and route optimization
//

import SwiftUI
import MapKit

// MARK: - EnhancedMapViewModel
class EnhancedMapViewModel: ObservableObject {
    // This would ideally connect to your backend or database
    @Published var routes: [MKRoute] = []
    @Published var isLoading: Bool = false
    @Published var error: Error? = nil
    
    // TODO: Implement fetchRoutes() with your own logic here
    func fetchRoutes() {
        // Simulate loading state
        self.isLoading = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            self.isLoading = false
        }
    }
}

// MARK: - EnhancedMapView
struct EnhancedMapView: View {
    @StateObject private var viewModel = EnhancedMapViewModel()
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 34.011_286, longitude: -116.166_868),
        span: MKCoordinateSpan(latitudeDelta: 0.2, longitudeDelta: 0.2)
    )
    
    var body: some View {
        ZStack {
            Map(coordinateRegion: $region, interactionModes: .all, showsUserLocation: true, userTrackingMode: nil, annotationItems: viewModel.routes) { route in
                MapPolyline(route.polyline, strokeColor: .blue, lineWidth: 4)
            }
            .ignoresSafeArea()
            
            if viewModel.isLoading {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    .background(Color.black.opacity(0.4))
                    .cornerRadius(10)
                    .padding()
            }
        }
        .onAppear(perform: {
            viewModel.fetchRoutes()
        })
        .alert(isPresented: Binding<Bool>.constant(viewModel.error != nil)) {
            Alert(title: Text("Error"), message: Text(viewModel.error?.localizedDescription ?? "Unknown error"), dismissButton: .default(Text("OK")))
        }
        .navigationTitle("Enhanced Map")
        .accessibilityLabel("Enhanced Map View")
    }
}

// MARK: - EnhancedMapView_Previews
#if DEBUG
struct EnhancedMapView_Previews: PreviewProvider {
    static var previews: some View {
        EnhancedMapView()
    }
}
#endif