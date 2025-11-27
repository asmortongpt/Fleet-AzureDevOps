/**
 * Error Recovery View
 * User-friendly interface for error recovery and system health
 * SECURITY: Displays sanitized error information, no sensitive data
 */

import SwiftUI

struct ErrorRecoveryView: View {
    @StateObject private var recoverySystem = ErrorRecoverySystem.shared

    var body: some View {
        NavigationView {
            List {
                // System Health Section
                systemHealthSection

                // Recent Recovery Attempts
                if !recoverySystem.recoveryAttempts.isEmpty {
                    recentAttemptsSection
                }

                // Manual Recovery Options
                manualRecoverySection
            }
            .navigationTitle("System Health")
            .navigationBarTitleDisplayMode(.large)
        }
    }

    // MARK: - System Health Section
    private var systemHealthSection: some View {
        Section("System Status") {
            HStack {
                Image(systemName: systemHealthIcon)
                    .font(.title)
                    .foregroundColor(recoverySystem.systemHealth.color)

                VStack(alignment: .leading, spacing: 4) {
                    Text(systemHealthTitle)
                        .font(.headline)

                    Text(systemHealthDescription)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                if recoverySystem.isRecovering {
                    ProgressView()
                }
            }
            .padding(.vertical, 8)
        }
    }

    private var systemHealthIcon: String {
        switch recoverySystem.systemHealth {
        case .healthy: return "checkmark.circle.fill"
        case .degraded: return "exclamationmark.triangle.fill"
        case .unhealthy: return "xmark.octagon.fill"
        case .critical: return "exclamationmark.octagon.fill"
        }
    }

    private var systemHealthTitle: String {
        switch recoverySystem.systemHealth {
        case .healthy: return "All Systems Operational"
        case .degraded: return "Degraded Performance"
        case .unhealthy: return "System Issues Detected"
        case .critical: return "Critical Issues"
        }
    }

    private var systemHealthDescription: String {
        switch recoverySystem.systemHealth {
        case .healthy:
            return "Everything is running smoothly"
        case .degraded:
            return "Minor issues detected, auto-recovery in progress"
        case .unhealthy:
            return "Multiple issues detected, attempting recovery"
        case .critical:
            return "Critical issues require attention"
        }
    }

    // MARK: - Recent Attempts Section
    private var recentAttemptsSection: some View {
        Section("Recent Recovery Actions") {
            ForEach(recoverySystem.recoveryAttempts.prefix(5)) { attempt in
                RecoveryAttemptRow(attempt: attempt)
            }
        }
    }

    // MARK: - Manual Recovery Section
    private var manualRecoverySection: some View {
        Section("Manual Actions") {
            Button(action: { Task { await performClearCache() } }) {
                Label("Clear Cache", systemImage: "trash")
            }

            Button(action: { Task { await performDataSync() } }) {
                Label("Sync Data", systemImage: "arrow.triangle.2.circlepath")
            }

            Button(action: { Task { await performNetworkReset() } }) {
                Label("Reset Network", systemImage: "network")
            }

            Button(action: { Task { await performFullReset() } }) {
                Label("Reset to Defaults", systemImage: "arrow.counterclockwise")
                    .foregroundColor(.red)
            }
        }
    }

    // MARK: - Manual Actions
    private func performClearCache() async {
        let result: Result<Void?, RecoveryResult> = await recoverySystem.handleError(
            NSError(domain: "ManualAction", code: 0),
            context: .configurationError,
            recovery: .clearCache
        )

        switch result {
        case .success:
            print("✅ Cache cleared successfully")
        case .failure(let error):
            print("❌ Cache clear failed: \(error)")
        }
    }

    private func performDataSync() async {
        let result: Result<Void?, RecoveryResult> = await recoverySystem.handleError(
            NSError(domain: "ManualAction", code: 0),
            context: .dataCorruption,
            recovery: .dataRevalidation
        )

        switch result {
        case .success:
            print("✅ Data synced successfully")
        case .failure(let error):
            print("❌ Data sync failed: \(error)")
        }
    }

    private func performNetworkReset() async {
        let result: Result<Void?, RecoveryResult> = await recoverySystem.handleError(
            NSError(domain: "ManualAction", code: 0),
            context: .networkFailure,
            recovery: .networkRefresh
        )

        switch result {
        case .success:
            print("✅ Network reset successfully")
        case .failure(let error):
            print("❌ Network reset failed: \(error)")
        }
    }

    private func performFullReset() async {
        let result: Result<Void?, RecoveryResult> = await recoverySystem.handleError(
            NSError(domain: "ManualAction", code: 0),
            context: .configurationError,
            recovery: .resetToDefaults
        )

        switch result {
        case .success:
            print("✅ Reset successful")
        case .failure(let error):
            print("❌ Reset failed: \(error)")
        }
    }
}

// MARK: - Recovery Attempt Row
struct RecoveryAttemptRow: View {
    let attempt: RecoveryAttempt

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Image(systemName: severityIcon)
                    .foregroundColor(severityColor)

                Text(attempt.context.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Spacer()

                Text(timeAgo)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Text("Strategy: \(attempt.strategy.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.vertical, 4)
    }

    private var severityIcon: String {
        switch attempt.severity {
        case .info: return "info.circle"
        case .warning: return "exclamationmark.triangle"
        case .error: return "xmark.circle"
        case .critical: return "exclamationmark.octagon"
        }
    }

    private var severityColor: Color {
        switch attempt.severity {
        case .info: return .blue
        case .warning: return .yellow
        case .error: return .orange
        case .critical: return .red
        }
    }

    private var timeAgo: String {
        let interval = Date().timeIntervalSince(attempt.timestamp)

        if interval < 60 {
            return "Just now"
        } else if interval < 3600 {
            let minutes = Int(interval / 60)
            return "\(minutes)m ago"
        } else {
            let hours = Int(interval / 3600)
            return "\(hours)h ago"
        }
    }
}

// MARK: - Preview
struct ErrorRecoveryView_Previews: PreviewProvider {
    static var previews: some View {
        ErrorRecoveryView()
    }
}
