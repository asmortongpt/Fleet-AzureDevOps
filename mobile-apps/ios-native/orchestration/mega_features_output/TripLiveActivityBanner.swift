To create an iOS Live Activity for active trip information using ActivityKit and SwiftUI, we'll follow the steps outlined in your requirements. This includes setting up the necessary models, views, and controllers to handle the live activity, updating it in real-time, and ensuring it works seamlessly on both the lock screen and Dynamic Island.

### Step 1: Define Activity Attributes and Content State

First, we define the attributes and content state for our live activity using the `ActivityAttributes` protocol.

```swift
import ActivityKit
import Foundation

struct TripActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        var elapsedTime: String
        var currentSpeed: String
        var distanceTraveled: String
        var currentLocation: String
        var eta: String
    }
    
    var destination: String
}
```

### Step 2: Create SwiftUI Views for Live Activity

We need two views: one for the compact state (Dynamic Island) and one for the expanded state.

```swift
import SwiftUI

struct TripActivityCompactView: View {
    let context: ActivityViewContext<TripActivityAttributes>
    
    var body: some View {
        HStack {
            Image(systemName: "car.fill")
            Text(context.state.elapsedTime)
                .bold()
        }
    }
}

struct TripActivityExpandedView: View {
    let context: ActivityViewContext<TripActivityAttributes>
    
    var body: some View {
        VStack {
            Text("Destination: \(context.attributes.destination)")
            Text("Elapsed Time: \(context.state.elapsedTime)")
            Text("Speed: \(context.state.currentSpeed) km/h")
            Text("Distance: \(context.state.distanceTraveled) km")
            Text("ETA: \(context.state.eta)")
            Text("Location: \(context.state.currentLocation)")
        }
        .padding()
    }
}
```

### Step 3: Manage Live Activity Lifecycle

We need to manage the lifecycle of the live activity, including starting, updating, and ending it.

```swift
import UIKit
import CoreLocation

class TripManager {
    private var activity: Activity<TripActivityAttributes>?
    private var locationManager = CLLocationManager()
    
    func startTrip(destination: String) {
        let attributes = TripActivityAttributes(destination: destination)
        let initialState = TripActivityAttributes.ContentState(
            elapsedTime: "00:00:00", currentSpeed: "0", distanceTraveled: "0 km",
            currentLocation: "Starting Point", eta: "Calculating"
        )
        
        do {
            activity = try Activity<TripActivityAttributes>.request(
                attributes: attributes, contentState: initialState,
                pushType: .timeInterval(1)
            )
        } catch {
            print("Failed to start activity: \(error)")
        }
        
        // Configure location updates
        locationManager.delegate = self
        locationManager.startUpdatingLocation()
    }
    
    func updateActivity() {
        guard let activity = activity else { return }
        
        // Update logic here (fetch new data)
        let newState = TripActivityAttributes.ContentState(
            elapsedTime: "Updated Time", currentSpeed: "Updated Speed",
            distanceTraveled: "Updated Distance", currentLocation: "Updated Location",
            eta: "Updated ETA"
        )
        
        activity.update(using: newState)
    }
    
    func endTrip() {
        activity?.end(dismissalPolicy: .immediate)
    }
}

extension TripManager: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        // Handle location updates
        updateActivity()
    }
}
```

### Step 4: Handle User Interactions

You can handle user interactions such as taps and long presses by adding gesture recognizers or buttons in your SwiftUI views. For the stop button, you can add a button in the `TripActivityExpandedView` that calls `endTrip()`.

### Final Notes

- Ensure you handle permissions for location services.
- Implement error handling and state restoration as needed.
- Optimize battery usage by adjusting the frequency of location updates and activity updates based on the app's state and system recommendations.

This code provides a basic structure for your iOS Live Activity using ActivityKit and SwiftUI. You'll need to expand upon this with more detailed implementation specific to your app's requirements and handle various edge cases and permissions.