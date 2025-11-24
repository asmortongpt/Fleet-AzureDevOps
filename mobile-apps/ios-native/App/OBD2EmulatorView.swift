import SwiftUI

// MARK: - OBD2 Emulator View
struct OBD2EmulatorView: View {
    @StateObject private var emulator = OBD2EmulatorService.shared

    @State private var selectedProfile: VehicleProfile = .sedan
    @State private var selectedScenario: DrivingScenario = .city
    @State private var vehicleId: Int = 1

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Connection Status
                connectionStatusCard

                // Emulator Controls
                emulatorControlsCard

                // Live Data Display
                if let data = emulator.currentData {
                    liveDataView(data: data)
                }

                // Error Display
                if let error = emulator.error {
                    errorCard(error: error)
                }
            }
            .padding()
        }
        .navigationTitle("OBD2 Emulator")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Connection Status Card
    private var connectionStatusCard: some View {
        HStack {
            Circle()
                .fill(emulator.isConnected ? Color.green : Color.gray)
                .frame(width: 12, height: 12)

            Text(emulator.isConnected ? "Connected" : "Disconnected")
                .font(.headline)

            Spacer()

            if let sessionId = emulator.sessionId {
                Text(String(sessionId.prefix(8)) + "...")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    // MARK: - Emulator Controls Card
    private var emulatorControlsCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Emulator Settings")
                .font(.headline)

            // Vehicle Profile Picker
            VStack(alignment: .leading, spacing: 4) {
                Text("Vehicle Profile")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Picker("Profile", selection: $selectedProfile) {
                    ForEach(VehicleProfile.allCases) { profile in
                        Text(profile.displayName).tag(profile)
                    }
                }
                .pickerStyle(.segmented)
                .disabled(emulator.isConnected)
            }

            // Driving Scenario Picker
            VStack(alignment: .leading, spacing: 4) {
                Text("Driving Scenario")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Picker("Scenario", selection: $selectedScenario) {
                    ForEach(DrivingScenario.allCases) { scenario in
                        Text(scenario.displayName).tag(scenario)
                    }
                }
                .pickerStyle(.segmented)
                .disabled(emulator.isConnected)
            }

            // Vehicle ID
            HStack {
                Text("Vehicle ID")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Spacer()

                Stepper("\(vehicleId)", value: $vehicleId, in: 1...100)
                    .disabled(emulator.isConnected)
            }

            // Start/Stop Button
            Button(action: toggleEmulator) {
                HStack {
                    if emulator.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Image(systemName: emulator.isConnected ? "stop.fill" : "play.fill")
                    }
                    Text(emulator.isConnected ? "Stop Emulator" : "Start Emulator")
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(emulator.isConnected ? Color.red : Color.blue)
                .foregroundColor(.white)
                .cornerRadius(12)
            }
            .disabled(emulator.isLoading)
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Live Data View
    private func liveDataView(data: EmulatedOBD2Data) -> some View {
        VStack(spacing: 16) {
            // Primary Gauges
            Text("Primary Metrics")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                GaugeView(
                    label: "RPM",
                    value: Double(data.engineRpm),
                    maxValue: 8000,
                    unit: "RPM",
                    color: .blue
                )

                GaugeView(
                    label: "Speed",
                    value: Double(data.vehicleSpeed),
                    maxValue: 150,
                    unit: "MPH",
                    color: .green
                )

                GaugeView(
                    label: "Throttle",
                    value: Double(data.throttlePosition),
                    maxValue: 100,
                    unit: "%",
                    color: .orange
                )

                GaugeView(
                    label: "Engine Load",
                    value: Double(data.engineLoad),
                    maxValue: 100,
                    unit: "%",
                    color: .purple
                )
            }

            Divider()

            // Temperature Section
            Text("Temperature")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                DataTile(label: "Coolant", value: "\(data.engineCoolantTemp)°F", warning: data.engineCoolantTemp > 220)
                DataTile(label: "Oil", value: "\(data.engineOilTemp)°F", warning: data.engineOilTemp > 250)
                DataTile(label: "Intake Air", value: "\(data.intakeAirTemp)°F")
                DataTile(label: "Catalyst", value: "\(data.catalystTemperature)°F")
            }

            Divider()

            // Fuel Section
            Text("Fuel System")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                GaugeView(
                    label: "Fuel Level",
                    value: Double(data.fuelLevel),
                    maxValue: 100,
                    unit: "%",
                    color: .yellow
                )

                DataTile(label: "Pressure", value: "\(data.fuelPressure) PSI")
                DataTile(label: "Consumption", value: String(format: "%.2f GPH", data.fuelConsumptionRate))
                DataTile(label: "Est. MPG", value: String(format: "%.1f", data.estimatedMpg))
            }

            Divider()

            // Electrical Section
            Text("Electrical")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                DataTile(label: "Battery", value: String(format: "%.1fV", data.batteryVoltage), warning: data.batteryVoltage < 12.0)
                DataTile(label: "Control Module", value: String(format: "%.1fV", data.controlModuleVoltage))
                DataTile(label: "MAF", value: String(format: "%.2f g/s", data.mafAirFlowRate))
                DataTile(label: "MAP", value: "\(data.intakeManifoldPressure) kPa")
            }

            Divider()

            // Trip Info
            Text("Trip Information")
                .font(.headline)
                .frame(maxWidth: .infinity, alignment: .leading)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                DataTile(label: "Distance", value: String(format: "%.2f mi", data.distanceTraveled))
                DataTile(label: "Trip Time", value: formatTime(data.tripTime))
                DataTile(label: "Timing", value: "\(data.timingAdvance)°")

                if let location = data.location {
                    DataTile(label: "Location", value: String(format: "%.4f, %.4f", location.latitude, location.longitude))
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(radius: 2)
    }

    // MARK: - Error Card
    private func errorCard(error: String) -> some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(.red)

            Text(error)
                .foregroundColor(.red)

            Spacer()

            Button("Dismiss") {
                emulator.error = nil
            }
            .font(.caption)
        }
        .padding()
        .background(Color.red.opacity(0.1))
        .cornerRadius(12)
    }

    // MARK: - Actions
    private func toggleEmulator() {
        if emulator.isConnected {
            emulator.stopEmulator()
        } else {
            emulator.startEmulator(
                vehicleId: vehicleId,
                profile: selectedProfile,
                scenario: selectedScenario
            ) { result in
                switch result {
                case .success(let session):
                    print("✅ Started emulator session: \(session.sessionId)")
                case .failure(let error):
                    print("❌ Failed to start emulator: \(error)")
                }
            }
        }
    }

    // MARK: - Helpers
    private func formatTime(_ seconds: Int) -> String {
        let hrs = seconds / 3600
        let mins = (seconds % 3600) / 60
        let secs = seconds % 60
        return String(format: "%02d:%02d:%02d", hrs, mins, secs)
    }
}

// MARK: - Gauge View
struct GaugeView: View {
    let label: String
    let value: Double
    let maxValue: Double
    let unit: String
    let color: Color

    var percentage: Double {
        min(value / maxValue, 1.0)
    }

    var body: some View {
        VStack(spacing: 8) {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)

            Text("\(Int(value))")
                .font(.title2)
                .fontWeight(.bold)

            Text(unit)
                .font(.caption2)
                .foregroundColor(.secondary)

            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.gray.opacity(0.2))
                        .frame(height: 8)

                    RoundedRectangle(cornerRadius: 4)
                        .fill(color)
                        .frame(width: geometry.size.width * percentage, height: 8)
                }
            }
            .frame(height: 8)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Data Tile
struct DataTile: View {
    let label: String
    let value: String
    var warning: Bool = false

    var body: some View {
        VStack(spacing: 4) {
            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)

            Text(value)
                .font(.headline)
                .foregroundColor(warning ? .red : .primary)
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(warning ? Color.red.opacity(0.1) : Color(.systemGray6))
        .cornerRadius(12)
    }
}

// MARK: - Preview
#Preview {
    NavigationView {
        OBD2EmulatorView()
    }
}
