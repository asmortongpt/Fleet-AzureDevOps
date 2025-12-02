t
//  ClockInOutView.swift
//  Fleet Manager
//
//  This view allows drivers to clock in and out, and records their geolocation when they do so.

import SwiftUI
import CoreLocation

// ViewModel for the ClockInOutView
class ClockInOutViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var error: Error?
    @Published var location: CLLocation?
    
    private let locationManager = CLLocationManager()
    
    init() {
        locationManager.requestWhenInUseAuthorization()
        locationManager.startUpdatingLocation()
    }
    
    func clockInOut() {
        isLoading = true
        
        // TODO: Add geolocation and clock in/out logic here
        // Be sure to handle errors and update `self.error` as needed
        
        isLoading = false
    }
}

struct ClockInOutView: View {
    @StateObject private var viewModel = ClockInOutViewModel()
    
    var body: some View {
        VStack {
            if viewModel.isLoading {
                ProgressView()
            } else {
                Button(action: {
                    viewModel.clockInOut()
                }) {
                    HStack {
                        Image(systemName: "clock")
                        Text("Clock In/Out")
                    }
                }
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(8)
            }
            
            if let error = viewModel.error {
                Text("Error: \(error.localizedDescription)")
                    .foregroundColor(.red)
            }
        }
        .padding()
        .navigationTitle("Clock In/Out")
        .accessibility(label: Text("Clock in or out"))
    }
}

#if DEBUG
struct ClockInOutView_Previews: PreviewProvider {
    static var previews: some View {
        ClockInOutView()
    }
}
#endif