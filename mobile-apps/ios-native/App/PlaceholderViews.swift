import SwiftUI

// MARK: - Placeholder Views for MoreView

struct NavigationDestinationView: View {
    enum Destination {
        case pushToTalk
    }

    let destination: Destination

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "radio.fill")
                .font(.system(size: 60))
                .foregroundColor(.blue)
            Text("Push-To-Talk Radio")
                .font(.title)
            Text("Coming Soon")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .navigationTitle("Radio")
    }
}

struct ReceiptCaptureView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "doc.text.viewfinder")
                .font(.system(size: 60))
                .foregroundColor(.green)
            Text("Receipt Capture")
                .font(.title)
            Text("Coming Soon")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .navigationTitle("Capture Receipt")
    }
}

struct DamageReportView: View {
    let vehicleId: String

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 60))
                .foregroundColor(.orange)
            Text("Damage Report")
                .font(.title)
            Text("Coming Soon")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .navigationTitle("Report Damage")
    }
}

struct VehicleRequestView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "car.fill")
                .font(.system(size: 60))
                .foregroundColor(.blue)
            Text("Vehicle Request")
                .font(.title)
            Text("Coming Soon")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .navigationTitle("Request Vehicle")
    }
}

struct MapNavigationView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "map.fill")
                .font(.system(size: 60))
                .foregroundColor(.red)
            Text("Navigation")
                .font(.title)
            Text("Coming Soon")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .navigationTitle("Navigation")
    }
}

struct CrashDetectionView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "exclamationmark.shield.fill")
                .font(.system(size: 60))
                .foregroundColor(.red)
            Text("Crash Detection")
                .font(.title)
            Text("Coming Soon")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .navigationTitle("Crash Detection")
    }
}

struct VehicleIdentificationView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "car.circle")
                .font(.system(size: 60))
                .foregroundColor(.blue)
            Text("Vehicle Assignment")
                .font(.title)
            Text("Coming Soon")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .navigationTitle("Vehicle Assignment")
    }
}

struct ScheduleView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "calendar")
                .font(.system(size: 60))
                .foregroundColor(.green)
            Text("Schedule")
                .font(.title)
            Text("Coming Soon")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .navigationTitle("Schedule")
    }
}

struct DeviceManagementView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "antenna.radiowaves.left.and.right")
                .font(.system(size: 60))
                .foregroundColor(.orange)
            Text("Device Management")
                .font(.title)
            Text("Coming Soon")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .navigationTitle("Device Management")
    }
}

struct VehicleIdlingView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "gauge.with.dots.needle.bottom.50percent")
                .font(.system(size: 60))
                .foregroundColor(.red)
            Text("Idling Monitor")
                .font(.title)
            Text("Coming Soon")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .navigationTitle("Idling Monitor")
    }
}

struct AppearanceSettingsView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "paintbrush.fill")
                .font(.system(size: 60))
                .foregroundColor(.purple)
            Text("Appearance Settings")
                .font(.title)
            Text("Coming Soon")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .navigationTitle("Appearance")
    }
}
