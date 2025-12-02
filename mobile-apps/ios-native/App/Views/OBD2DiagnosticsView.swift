import SwiftUI

// MARK: - OBD-II Diagnostics View
struct OBD2DiagnosticsView: View {
    @State private var isConnected: Bool = false
    @State private var isRefreshing: Bool = false
    @State private var diagnosticData: OBD2Data = .sample
    @State private var showConnectSheet: Bool = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: ModernTheme.Spacing.lg) {
                    // Connection Status Card
                    ConnectionStatusCard(
                        isConnected: isConnected,
                        onConnect: {
                            showConnectSheet = true
                        },
                        onDisconnect: {
                            disconnect()
                        }
                    )
                    .padding(.horizontal)

                    if isConnected {
                        // Live Metrics Section
                        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                            Text("Live Metrics")
                                .font(ModernTheme.Typography.title3)
                                .padding(.horizontal)

                            LazyVGrid(columns: [
                                GridItem(.flexible()),
                                GridItem(.flexible())
                            ], spacing: ModernTheme.Spacing.md) {
                                MetricCard(
                                    icon: "speedometer",
                                    label: "Speed",
                                    value: "\(diagnosticData.speed)",
                                    unit: "mph",
                                    color: ModernTheme.Colors.primary
                                )

                                MetricCard(
                                    icon: "gauge.medium",
                                    label: "RPM",
                                    value: "\(diagnosticData.engineRPM)",
                                    unit: "rpm",
                                    color: diagnosticData.engineRPM > 3000 ? ModernTheme.Colors.warning : ModernTheme.Colors.success
                                )

                                MetricCard(
                                    icon: "thermometer",
                                    label: "Coolant Temp",
                                    value: "\(diagnosticData.coolantTemp)",
                                    unit: "°F",
                                    color: diagnosticData.coolantTemp > 220 ? ModernTheme.Colors.error : ModernTheme.Colors.info
                                )

                                MetricCard(
                                    icon: "slider.horizontal.3",
                                    label: "Throttle",
                                    value: "\(diagnosticData.throttlePosition)",
                                    unit: "%",
                                    color: ModernTheme.Colors.accent
                                )

                                MetricCard(
                                    icon: "fuelpump.fill",
                                    label: "Fuel Level",
                                    value: "\(diagnosticData.fuelLevel)",
                                    unit: "%",
                                    color: diagnosticData.fuelLevel < 25 ? ModernTheme.Colors.warning : ModernTheme.Colors.success
                                )

                                MetricCard(
                                    icon: "battery.100",
                                    label: "Battery",
                                    value: String(format: "%.1f", diagnosticData.batteryVoltage),
                                    unit: "V",
                                    color: diagnosticData.batteryVoltage < 12.0 ? ModernTheme.Colors.warning : ModernTheme.Colors.success
                                )
                            }
                            .padding(.horizontal)
                        }

                        // Check Engine Light Status
                        CheckEngineLightCard(isOn: diagnosticData.checkEngineLight)
                            .padding(.horizontal)

                        // Diagnostic Trouble Codes
                        if !diagnosticData.troubleCodes.isEmpty {
                            VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                                Text("Diagnostic Trouble Codes")
                                    .font(ModernTheme.Typography.title3)
                                    .padding(.horizontal)

                                VStack(spacing: ModernTheme.Spacing.sm) {
                                    ForEach(diagnosticData.troubleCodes) { code in
                                        DTCCard(code: code)
                                    }
                                }
                                .padding(.horizontal)
                            }
                        }

                        // Additional Info
                        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                            Text("Additional Information")
                                .font(ModernTheme.Typography.title3)
                                .padding(.horizontal)

                            VStack(spacing: ModernTheme.Spacing.xs) {
                                InfoRow(label: "VIN", value: diagnosticData.vin)
                                InfoRow(label: "Protocol", value: diagnosticData.protocol)
                                InfoRow(label: "Last Updated", value: diagnosticData.lastUpdate.formatted())
                            }
                            .padding()
                            .background(ModernTheme.Colors.secondaryBackground)
                            .cornerRadius(ModernTheme.CornerRadius.md)
                            .padding(.horizontal)
                        }

                        // Refresh Button
                        Button {
                            refreshData()
                        } label: {
                            HStack {
                                if isRefreshing {
                                    ProgressView()
                                        .progressViewStyle(.circular)
                                } else {
                                    Image(systemName: "arrow.clockwise")
                                }
                                Text(isRefreshing ? "Refreshing..." : "Refresh Data")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(ModernTheme.Colors.primary)
                            .foregroundColor(.white)
                            .cornerRadius(ModernTheme.CornerRadius.md)
                        }
                        .disabled(isRefreshing)
                        .padding(.horizontal)
                        .padding(.bottom)
                    } else {
                        // Not connected view
                        VStack(spacing: ModernTheme.Spacing.lg) {
                            Image(systemName: "cable.connector.slash")
                                .font(.system(size: 60))
                                .foregroundColor(ModernTheme.Colors.secondaryText)

                            Text("Not Connected")
                                .font(ModernTheme.Typography.title2)

                            Text("Connect to a vehicle's OBD-II port to view diagnostic information")
                                .font(ModernTheme.Typography.body)
                                .foregroundColor(ModernTheme.Colors.secondaryText)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        }
                        .frame(maxHeight: .infinity)
                        .padding()
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("OBD-II Diagnostics")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showConnectSheet) {
                ConnectOBD2Sheet(isConnected: $isConnected)
            }
        }
    }

    // MARK: - Actions

    private func disconnect() {
        ModernTheme.Haptics.light()
        withAnimation {
            isConnected = false
        }
    }

    private func refreshData() {
        ModernTheme.Haptics.light()
        isRefreshing = true

        // Simulate data refresh
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            withAnimation {
                diagnosticData = OBD2Data(
                    speed: Int.random(in: 0...75),
                    engineRPM: Int.random(in: 800...3500),
                    coolantTemp: Int.random(in: 180...210),
                    throttlePosition: Int.random(in: 0...100),
                    fuelLevel: Int.random(in: 20...100),
                    batteryVoltage: Double.random(in: 12.0...14.5),
                    checkEngineLight: diagnosticData.checkEngineLight,
                    troubleCodes: diagnosticData.troubleCodes,
                    vin: diagnosticData.vin,
                    protocol: diagnosticData.protocol,
                    lastUpdate: Date()
                )
                isRefreshing = false
            }
        }
    }
}

// MARK: - Connection Status Card
struct ConnectionStatusCard: View {
    let isConnected: Bool
    let onConnect: () -> Void
    let onDisconnect: () -> Void

    var body: some View {
        HStack {
            HStack(spacing: ModernTheme.Spacing.md) {
                Image(systemName: isConnected ? "cable.connector" : "cable.connector.slash")
                    .font(.title2)
                    .foregroundColor(isConnected ? ModernTheme.Colors.success : ModernTheme.Colors.secondaryText)

                VStack(alignment: .leading, spacing: 4) {
                    Text(isConnected ? "Connected" : "Not Connected")
                        .font(ModernTheme.Typography.headline)

                    Text(isConnected ? "Receiving live data" : "Tap to connect")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }

            Spacer()

            Button(isConnected ? "Disconnect" : "Connect") {
                ModernTheme.Haptics.medium()
                if isConnected {
                    onDisconnect()
                } else {
                    onConnect()
                }
            }
            .buttonStyle(.borderedProminent)
            .tint(isConnected ? ModernTheme.Colors.error : ModernTheme.Colors.primary)
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }
}

// MARK: - Metric Card
struct MetricCard: View {
    let icon: String
    let label: String
    let value: String
    let unit: String
    let color: Color

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.sm) {
            Image(systemName: icon)
                .font(.title)
                .foregroundColor(color)

            Text(label)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(value)
                    .font(ModernTheme.Typography.title2)
                    .fontWeight(.bold)
                    .foregroundColor(color)

                Text(unit)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }
}

// MARK: - Check Engine Light Card
struct CheckEngineLightCard: View {
    let isOn: Bool

    var body: some View {
        HStack {
            Image(systemName: isOn ? "exclamationmark.triangle.fill" : "checkmark.circle.fill")
                .font(.title)
                .foregroundColor(isOn ? ModernTheme.Colors.warning : ModernTheme.Colors.success)

            VStack(alignment: .leading, spacing: 4) {
                Text("Check Engine Light")
                    .font(ModernTheme.Typography.headline)

                Text(isOn ? "Active - Service required" : "Inactive - All systems normal")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }

            Spacer()
        }
        .padding()
        .background(isOn ? ModernTheme.Colors.warning.opacity(0.1) : ModernTheme.Colors.success.opacity(0.1))
        .cornerRadius(ModernTheme.CornerRadius.md)
    }
}

// MARK: - DTC Card
struct DTCCard: View {
    let code: DiagnosticTroubleCode

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                Text(code.code)
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(code.severity.color)

                Spacer()

                Text(code.severity.displayName)
                    .font(ModernTheme.Typography.caption1)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(code.severity.color.opacity(0.2))
                    .foregroundColor(code.severity.color)
                    .cornerRadius(8)
            }

            Text(code.description)
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.primaryText)

            if let suggestion = code.suggestedAction {
                Text(suggestion)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .italic()
            }
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }
}

// MARK: - Info Row
struct InfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Spacer()

            Text(value)
                .font(ModernTheme.Typography.subheadline)
                .fontWeight(.medium)
        }
    }
}

// MARK: - Connect OBD2 Sheet
struct ConnectOBD2Sheet: View {
    @Binding var isConnected: Bool
    @Environment(\.dismiss) private var dismiss
    @State private var isConnecting: Bool = false

    var body: some View {
        NavigationView {
            VStack(spacing: ModernTheme.Spacing.xl) {
                Image(systemName: "cable.connector")
                    .font(.system(size: 80))
                    .foregroundColor(ModernTheme.Colors.primary)
                    .padding(.top, 40)

                VStack(spacing: ModernTheme.Spacing.md) {
                    Text("Connect to OBD-II")
                        .font(ModernTheme.Typography.title1)

                    Text("Make sure the OBD-II adapter is plugged into the vehicle's diagnostic port")
                        .font(ModernTheme.Typography.body)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }

                Spacer()

                Button {
                    connect()
                } label: {
                    HStack {
                        if isConnecting {
                            ProgressView()
                                .progressViewStyle(.circular)
                                .tint(.white)
                        }
                        Text(isConnecting ? "Connecting..." : "Connect")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(ModernTheme.Colors.primary)
                    .foregroundColor(.white)
                    .cornerRadius(ModernTheme.CornerRadius.md)
                }
                .disabled(isConnecting)
                .padding()
            }
            .navigationTitle("OBD-II Connection")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                    .disabled(isConnecting)
                }
            }
        }
    }

    private func connect() {
        ModernTheme.Haptics.medium()
        isConnecting = true

        // Simulate connection delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            isConnected = true
            isConnecting = false
            ModernTheme.Haptics.success()
            dismiss()
        }
    }
}

// MARK: - OBD2 Data Model
struct OBD2Data {
    var speed: Int // mph
    var engineRPM: Int
    var coolantTemp: Int // Fahrenheit
    var throttlePosition: Int // percentage
    var fuelLevel: Int // percentage
    var batteryVoltage: Double
    var checkEngineLight: Bool
    var troubleCodes: [DiagnosticTroubleCode]
    var vin: String
    var `protocol`: String
    var lastUpdate: Date

    static let sample = OBD2Data(
        speed: 45,
        engineRPM: 2100,
        coolantTemp: 195,
        throttlePosition: 35,
        fuelLevel: 68,
        batteryVoltage: 13.8,
        checkEngineLight: true,
        troubleCodes: [
            DiagnosticTroubleCode(
                code: "P0420",
                description: "Catalyst System Efficiency Below Threshold (Bank 1)",
                severity: .medium,
                suggestedAction: "Check catalytic converter and oxygen sensors"
            ),
            DiagnosticTroubleCode(
                code: "P0171",
                description: "System Too Lean (Bank 1)",
                severity: .low,
                suggestedAction: "Inspect for vacuum leaks and check fuel pressure"
            )
        ],
        vin: "1HGBH41JXMN109186",
        protocol: "ISO 15765-4 (CAN 11/500)",
        lastUpdate: Date()
    )
}

// MARK: - Diagnostic Trouble Code Model
struct DiagnosticTroubleCode: Identifiable {
    let id = UUID()
    let code: String
    let description: String
    let severity: DTCSeverity
    let suggestedAction: String?

    enum DTCSeverity {
        case low
        case medium
        case high
        case critical

        var displayName: String {
            switch self {
            case .low: return "Low"
            case .medium: return "Medium"
            case .high: return "High"
            case .critical: return "Critical"
            }
        }

        var color: Color {
            switch self {
            case .low: return ModernTheme.Colors.info
            case .medium: return ModernTheme.Colors.warning
            case .high: return Color.orange
            case .critical: return ModernTheme.Colors.error
            }
        }
    }
}

// MARK: - Preview
#if DEBUG
struct OBD2DiagnosticsView_Previews: PreviewProvider {
    static var previews: some View {
        OBD2DiagnosticsView()
    }
}
#endif
