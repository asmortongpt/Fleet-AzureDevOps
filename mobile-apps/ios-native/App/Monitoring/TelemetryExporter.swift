import Foundation
import Combine

// MARK: - Telemetry Export Format
public enum TelemetryExportFormat {
    case json
    case csv
    case txt
}

// MARK: - Telemetry Export Destination
public enum TelemetryExportDestination {
    case file(URL)
    case remote(URL)
    case console
}

// MARK: - Telemetry Exporter
/// Exports collected telemetry data to various destinations
/// Uses KeychainManager for secure credential storage when uploading to remote endpoints
public class TelemetryExporter {

    // MARK: - Singleton
    public static let shared = TelemetryExporter()

    // MARK: - Properties
    private let metricsCollector = MetricsCollector.shared
    private let fileManager = FileManager.default
    private var cancellables = Set<AnyCancellable>()

    // Export configuration
    private var isAutoExportEnabled: Bool = false
    private var autoExportInterval: TimeInterval = 3600 // 1 hour
    private var autoExportTimer: Timer?

    // MARK: - Initialization
    private init() {}

    // MARK: - Public Methods - Export

    /// Export telemetry data to a destination
    /// - Parameters:
    ///   - destination: Where to export the data
    ///   - format: Format of the exported data
    /// - Returns: Success status
    public func exportTelemetry(
        to destination: TelemetryExportDestination,
        format: TelemetryExportFormat = .json
    ) async throws -> Bool {

        // Generate export data
        let data = try generateExportData(format: format)

        // Export to destination
        switch destination {
        case .file(let url):
            return try exportToFile(data: data, url: url)

        case .remote(let url):
            return try await exportToRemote(data: data, url: url)

        case .console:
            return exportToConsole(data: data)
        }
    }

    /// Export telemetry to a file
    /// - Parameters:
    ///   - format: Export format
    ///   - filename: Optional filename (auto-generated if nil)
    /// - Returns: URL of the exported file
    public func exportToFile(
        format: TelemetryExportFormat = .json,
        filename: String? = nil
    ) throws -> URL {

        // Generate filename
        let timestamp = ISO8601DateFormatter().string(from: Date())
        let fileExtension = getFileExtension(for: format)
        let fileName = filename ?? "telemetry_\(timestamp).\(fileExtension)"

        // Get documents directory
        guard let documentsDirectory = fileManager.urls(
            for: .documentDirectory,
            in: .userDomainMask
        ).first else {
            throw TelemetryExporterError.fileSystemError
        }

        let fileURL = documentsDirectory.appendingPathComponent(fileName)

        // Generate and write data
        let data = try generateExportData(format: format)
        try data.write(to: fileURL)

        print("📤 TelemetryExporter: Exported to file: \(fileURL.path)")
        return fileURL
    }

    /// Enable automatic periodic export
    /// - Parameters:
    ///   - interval: Export interval in seconds
    ///   - destination: Export destination
    ///   - format: Export format
    public func enableAutoExport(
        interval: TimeInterval,
        destination: TelemetryExportDestination,
        format: TelemetryExportFormat = .json
    ) {
        guard !isAutoExportEnabled else { return }

        isAutoExportEnabled = true
        autoExportInterval = interval

        autoExportTimer = Timer.scheduledTimer(
            withTimeInterval: interval,
            repeats: true
        ) { [weak self] _ in
            Task {
                do {
                    _ = try await self?.exportTelemetry(to: destination, format: format)
                } catch {
                    print("❌ TelemetryExporter: Auto-export failed: \(error)")
                }
            }
        }

        print("📤 TelemetryExporter: Auto-export enabled (interval: \(interval)s)")
    }

    /// Disable automatic export
    public func disableAutoExport() {
        isAutoExportEnabled = false
        autoExportTimer?.invalidate()
        autoExportTimer = nil
        print("📤 TelemetryExporter: Auto-export disabled")
    }

    // MARK: - Private Methods - Data Generation

    private func generateExportData(format: TelemetryExportFormat) throws -> Data {
        switch format {
        case .json:
            return try generateJSONExport()
        case .csv:
            return try generateCSVExport()
        case .txt:
            return try generateTextExport()
        }
    }

    private func generateJSONExport() throws -> Data {
        let report = metricsCollector.generateSummaryReport()

        guard let data = try? JSONSerialization.data(
            withJSONObject: report,
            options: .prettyPrinted
        ) else {
            throw TelemetryExporterError.serializationError
        }

        return data
    }

    private func generateCSVExport() throws -> Data {
        var csvLines: [String] = []

        // Header
        csvLines.append("Metric Name,Value,Timestamp")

        // Add custom metrics
        let metrics = metricsCollector.getAllMetrics()
        let timestamp = ISO8601DateFormatter().string(from: Date())

        for (key, value) in metrics {
            csvLines.append("\"\(key)\",\"\(value)\",\"\(timestamp)\"")
        }

        // Add trace statistics
        let traces = metricsCollector.getCompletedTraces()
        for trace in traces {
            csvLines.append("\"\(trace.name)\",\"\(trace.duration)\",\"\(ISO8601DateFormatter().string(from: trace.startTime))\"")
        }

        let csvString = csvLines.joined(separator: "\n")

        guard let data = csvString.data(using: .utf8) else {
            throw TelemetryExporterError.serializationError
        }

        return data
    }

    private func generateTextExport() throws -> Data {
        var lines: [String] = []

        lines.append("=== Fleet Manager Telemetry Report ===")
        lines.append("Generated: \(Date())")
        lines.append("")

        // Custom metrics
        lines.append("--- Custom Metrics ---")
        let metrics = metricsCollector.getAllMetrics()
        for (key, value) in metrics {
            lines.append("\(key): \(value)")
        }
        lines.append("")

        // Trace statistics
        lines.append("--- Trace Statistics ---")
        let traces = metricsCollector.getCompletedTraces()
        lines.append("Total Traces: \(traces.count)")

        let traceNames = Set(traces.map { $0.name })
        for name in traceNames {
            let nameTraces = traces.filter { $0.name == name }
            let avgDuration = nameTraces.map { $0.duration }.reduce(0, +) / Double(nameTraces.count)
            lines.append("\(name): \(nameTraces.count) executions, avg \(String(format: "%.2f", avgDuration))s")
        }

        let textString = lines.joined(separator: "\n")

        guard let data = textString.data(using: .utf8) else {
            throw TelemetryExporterError.serializationError
        }

        return data
    }

    // MARK: - Private Methods - Export Destinations

    private func exportToFile(data: Data, url: URL) throws -> Bool {
        try data.write(to: url)
        print("📤 TelemetryExporter: Exported to file: \(url.path)")
        return true
    }

    private func exportToRemote(data: Data, url: URL) async throws -> Bool {
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = data
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Try to get API key from keychain if available
        if let apiKey = await getAPIKeyFromKeychain() {
            request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        }

        let (responseData, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw TelemetryExporterError.uploadFailed
        }

        print("📤 TelemetryExporter: Uploaded to remote endpoint: \(url)")
        print("📤 Response: \(String(data: responseData, encoding: .utf8) ?? "No response")")

        return true
    }

    private func exportToConsole(data: Data) -> Bool {
        if let jsonString = String(data: data, encoding: .utf8) {
            print("📤 TelemetryExporter: Console Export:")
            print("===================================")
            print(jsonString)
            print("===================================")
            return true
        }
        return false
    }

    // MARK: - Private Methods - Helpers

    private func getFileExtension(for format: TelemetryExportFormat) -> String {
        switch format {
        case .json: return "json"
        case .csv: return "csv"
        case .txt: return "txt"
        }
    }

    private func getAPIKeyFromKeychain() async -> String? {
        // Try to retrieve API key from keychain using KeychainManager async API
        do {
            return try await KeychainManager.shared.retrieve(
                for: .accessToken,
                requireBiometric: false
            )
        } catch {
            print("⚠️ TelemetryExporter: Could not retrieve API key from keychain: \(error)")
            return nil
        }
    }
}

// MARK: - Telemetry Exporter Error
public enum TelemetryExporterError: Error, LocalizedError {
    case serializationError
    case fileSystemError
    case uploadFailed
    case invalidDestination

    public var errorDescription: String? {
        switch self {
        case .serializationError:
            return "Failed to serialize telemetry data"
        case .fileSystemError:
            return "File system error occurred"
        case .uploadFailed:
            return "Failed to upload telemetry data"
        case .invalidDestination:
            return "Invalid export destination"
        }
    }
}
