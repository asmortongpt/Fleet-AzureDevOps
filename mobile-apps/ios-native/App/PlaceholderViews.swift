import SwiftUI

// MARK: - Placeholder Views for Missing Features
// These views provide a "Coming Soon" message until the full implementation is ready

struct DamageReportView: View {
    var body: some View {
        FeatureComingSoonView(featureName: "Damage Reporting")
    }
}

struct IncidentReportView: View {
    var body: some View {
        FeatureComingSoonView(featureName: "Incident Reports")
    }
}

struct VehicleReservationView: View {
    var body: some View {
        FeatureComingSoonView(featureName: "Vehicle Reservations")
    }
}

struct FuelManagementView: View {
    var body: some View {
        FeatureComingSoonView(featureName: "Fuel Management")
    }
}

struct CrashDetectionView: View {
    var body: some View {
        FeatureComingSoonView(featureName: "Crash Detection")
    }
}

struct GeofencingView: View {
    var body: some View {
        FeatureComingSoonView(featureName: "Geofencing")
    }
}

struct MapNavigationView: View {
    var body: some View {
        FeatureComingSoonView(featureName: "Map Navigation")
    }
}

struct AdminDashboardView: View {
    var body: some View {
        FeatureComingSoonView(featureName: "Admin Dashboard")
    }
}

struct ManagerDashboardView: View {
    var body: some View {
        FeatureComingSoonView(featureName: "Manager Dashboard")
    }
}

struct DriverDashboardView: View {
    var body: some View {
        FeatureComingSoonView(featureName: "Driver Dashboard")
    }
}

struct ViewerDashboardView: View {
    var body: some View {
        FeatureComingSoonView(featureName: "Viewer Dashboard")
    }
}

// MARK: - Generic Coming Soon View
struct FeatureComingSoonView: View {
    let featureName: String

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "hammer.fill")
                .font(.system(size: 60))
                .foregroundColor(.orange)

            Text(featureName)
                .font(.title)
                .fontWeight(.bold)

            Text("This feature is under development")
                .font(.body)
                .foregroundColor(.secondary)

            Text("Check back soon!")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .navigationTitle(featureName)
    }
}
