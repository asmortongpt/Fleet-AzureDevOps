//
//  OfflineIndicatorView.swift
//  Fleet Manager - iOS Native App
//
//  UI components for displaying offline status and sync indicators
//  Provides visual feedback for network connectivity and sync operations
//

import SwiftUI
import Combine

// MARK: - Offline Indicator Banner
public struct OfflineIndicatorBanner: View {
    @ObservedObject private var networkMonitor = NetworkMonitor.shared
    @State private var isVisible = false

    public init() {}

    public var body: some View {
        VStack(spacing: 0) {
            if !networkMonitor.isConnected {
                HStack(spacing: 12) {
                    Image(systemName: "wifi.slash")
                        .font(.system(size: 16, weight: .semibold))

                    Text("You're offline")
                        .font(.system(size: 14, weight: .medium))

                    Spacer()

                    Text("Changes will sync when online")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.8))
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color.orange)
                .foregroundColor(.white)
                .transition(.move(edge: .top).combined(with: .opacity))
                .accessibilityElement(children: .combine)
                .accessibilityLabel("Offline mode. Changes will sync when online.")
            }
        }
        .animation(.easeInOut(duration: 0.3), value: networkMonitor.isConnected)
    }
}

// MARK: - Connection Status Badge
public struct ConnectionStatusBadge: View {
    @ObservedObject private var networkMonitor = NetworkMonitor.shared

    public init() {}

    public var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(statusColor)
                .frame(width: 8, height: 8)

            Text(statusText)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(12)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Connection status: \(statusText)")
    }

    private var statusColor: Color {
        switch networkMonitor.status {
        case .connected:
            return .green
        case .connecting:
            return .yellow
        case .disconnected:
            return .red
        }
    }

    private var statusText: String {
        networkMonitor.status.description
    }
}

// MARK: - Sync Status Indicator
public struct SyncStatusIndicator: View {
    @ObservedObject private var syncService = SyncService.shared
    @State private var rotationAngle: Double = 0

    public init() {}

    public var body: some View {
        HStack(spacing: 8) {
            // Sync icon
            Image(systemName: syncIcon)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(syncColor)
                .rotationEffect(.degrees(syncService.isSyncing ? rotationAngle : 0))
                .onAppear {
                    if syncService.isSyncing {
                        withAnimation(.linear(duration: 1).repeatForever(autoreverses: false)) {
                            rotationAngle = 360
                        }
                    }
                }
                .onChange(of: syncService.isSyncing) { isSyncing in
                    if isSyncing {
                        withAnimation(.linear(duration: 1).repeatForever(autoreverses: false)) {
                            rotationAngle = 360
                        }
                    } else {
                        withAnimation(.default) {
                            rotationAngle = 0
                        }
                    }
                }

            // Status text
            Text(syncStatusText)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(syncColor)

            // Pending count badge
            if pendingCount > 0 {
                Text("\(pendingCount)")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.orange)
                    .cornerRadius(8)
            }
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(syncBackgroundColor)
        .cornerRadius(12)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityText)
    }

    private var syncIcon: String {
        if syncService.isSyncing {
            return "arrow.triangle.2.circlepath"
        } else {
            switch syncService.syncStatus {
            case .synced:
                return "checkmark.circle.fill"
            case .error:
                return "exclamationmark.triangle.fill"
            case .conflict:
                return "exclamationmark.circle.fill"
            default:
                return "arrow.triangle.2.circlepath"
            }
        }
    }

    private var syncColor: Color {
        if syncService.isSyncing {
            return .blue
        } else {
            switch syncService.syncStatus {
            case .synced:
                return .green
            case .error:
                return .red
            case .conflict:
                return .orange
            default:
                return .gray
            }
        }
    }

    private var syncBackgroundColor: Color {
        syncColor.opacity(0.1)
    }

    private var syncStatusText: String {
        if syncService.isSyncing {
            return "Syncing..."
        } else {
            switch syncService.syncStatus {
            case .synced:
                return "Synced"
            case .syncing:
                return "Syncing"
            case .pending:
                return "Pending"
            case .error:
                return "Sync Error"
            case .conflict:
                return "Conflicts"
            }
        }
    }

    private var pendingCount: Int {
        let status = syncService.getSyncStatus()
        return status.pendingOperations
    }

    private var accessibilityText: String {
        var text = "Sync status: \(syncStatusText)"
        if pendingCount > 0 {
            text += ". \(pendingCount) pending operations"
        }
        return text
    }
}

// MARK: - Detailed Sync Status View
public struct DetailedSyncStatusView: View {
    @ObservedObject private var syncService = SyncService.shared
    @ObservedObject private var networkMonitor = NetworkMonitor.shared
    @State private var showingDetails = false

    public init() {}

    public var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Image(systemName: "arrow.triangle.2.circlepath.circle.fill")
                    .font(.system(size: 24))
                    .foregroundColor(.blue)

                Text("Sync Status")
                    .font(.title3)
                    .fontWeight(.semibold)

                Spacer()

                Button(action: {
                    withAnimation {
                        showingDetails.toggle()
                    }
                }) {
                    Image(systemName: showingDetails ? "chevron.up" : "chevron.down")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.secondary)
                }
            }

            // Summary
            HStack(spacing: 20) {
                // Network status
                StatusItem(
                    icon: networkMonitor.isConnected ? "wifi" : "wifi.slash",
                    title: "Network",
                    value: networkMonitor.isConnected ? "Online" : "Offline",
                    color: networkMonitor.isConnected ? .green : .orange
                )

                Divider()
                    .frame(height: 40)

                // Sync status
                StatusItem(
                    icon: "arrow.triangle.2.circlepath",
                    title: "Sync",
                    value: syncStatusValue,
                    color: syncStatusColor
                )

                Divider()
                    .frame(height: 40)

                // Pending operations
                StatusItem(
                    icon: "doc.text",
                    title: "Pending",
                    value: "\(statusInfo.pendingOperations)",
                    color: statusInfo.pendingOperations > 0 ? .orange : .gray
                )
            }

            // Detailed information
            if showingDetails {
                VStack(alignment: .leading, spacing: 12) {
                    Divider()

                    DetailRow(label: "Last Sync", value: lastSyncText)

                    if statusInfo.failedOperations > 0 {
                        DetailRow(
                            label: "Failed Operations",
                            value: "\(statusInfo.failedOperations)",
                            valueColor: .red
                        )
                    }

                    if statusInfo.unresolvedConflicts > 0 {
                        DetailRow(
                            label: "Unresolved Conflicts",
                            value: "\(statusInfo.unresolvedConflicts)",
                            valueColor: .orange
                        )
                    }

                    if let connectionType = networkMonitor.getConnectionType() {
                        DetailRow(label: "Connection Type", value: connectionType.description)
                    }

                    // Sync button
                    if networkMonitor.isConnected && !syncService.isSyncing {
                        Button(action: {
                            Task {
                                await syncService.forceSyncNow()
                            }
                        }) {
                            HStack {
                                Image(systemName: "arrow.triangle.2.circlepath")
                                Text("Sync Now")
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(8)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .transition(.opacity)
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
    }

    private var statusInfo: SyncStatusInfo {
        syncService.getSyncStatus()
    }

    private var syncStatusValue: String {
        if syncService.isSyncing {
            return "Syncing"
        }
        return statusInfo.status == .synced ? "Up to date" : "Pending"
    }

    private var syncStatusColor: Color {
        if syncService.isSyncing {
            return .blue
        }
        return statusInfo.status == .synced ? .green : .orange
    }

    private var lastSyncText: String {
        guard let lastSync = statusInfo.lastSyncDate else {
            return "Never"
        }

        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: lastSync, relativeTo: Date())
    }
}

// MARK: - Supporting Views

private struct StatusItem: View {
    let icon: String
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundColor(color)

            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            Text(value)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(.primary)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct DetailRow: View {
    let label: String
    let value: String
    var valueColor: Color = .primary

    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(valueColor)
        }
    }
}

// MARK: - Sync Progress View
public struct SyncProgressView: View {
    @ObservedObject private var syncService = SyncService.shared

    public init() {}

    public var body: some View {
        if syncService.isSyncing {
            VStack(spacing: 12) {
                HStack {
                    ProgressView(value: syncService.syncProgress)
                        .progressViewStyle(.linear)

                    Text("\(Int(syncService.syncProgress * 100))%")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.secondary)
                        .frame(width: 40, alignment: .trailing)
                }

                Text("Syncing changes...")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(Color(.systemBackground))
            .cornerRadius(8)
            .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
            .transition(.move(edge: .top).combined(with: .opacity))
        }
    }
}

// MARK: - Floating Sync Button
public struct FloatingSyncButton: View {
    @ObservedObject private var syncService = SyncService.shared
    @ObservedObject private var networkMonitor = NetworkMonitor.shared
    @State private var isPulsing = false

    public init() {}

    public var body: some View {
        Button(action: {
            Task {
                await syncService.forceSyncNow()
            }
        }) {
            ZStack {
                Circle()
                    .fill(buttonColor)
                    .frame(width: 56, height: 56)
                    .shadow(color: Color.black.opacity(0.2), radius: 8, x: 0, y: 4)

                if syncService.isSyncing {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    Image(systemName: buttonIcon)
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundColor(.white)
                }

                // Pending badge
                if pendingCount > 0 && !syncService.isSyncing {
                    Text("\(pendingCount)")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(.white)
                        .padding(4)
                        .background(Color.red)
                        .clipShape(Circle())
                        .offset(x: 20, y: -20)
                }
            }
            .scaleEffect(isPulsing ? 1.1 : 1.0)
            .animation(
                pendingCount > 0 ?
                    .easeInOut(duration: 0.8).repeatForever(autoreverses: true) :
                    .default,
                value: isPulsing
            )
        }
        .disabled(!networkMonitor.isConnected || syncService.isSyncing)
        .opacity(networkMonitor.isConnected ? 1.0 : 0.5)
        .onAppear {
            isPulsing = pendingCount > 0
        }
        .onChange(of: pendingCount) { count in
            isPulsing = count > 0
        }
        .accessibilityLabel(accessibilityLabel)
        .accessibilityHint("Double tap to sync changes")
    }

    private var buttonColor: Color {
        if !networkMonitor.isConnected {
            return .gray
        }
        return syncService.isSyncing ? .blue : .green
    }

    private var buttonIcon: String {
        syncService.isSyncing ? "arrow.triangle.2.circlepath" : "arrow.triangle.2.circlepath"
    }

    private var pendingCount: Int {
        syncService.getSyncStatus().pendingOperations
    }

    private var accessibilityLabel: String {
        if !networkMonitor.isConnected {
            return "Sync disabled. Offline"
        }
        if syncService.isSyncing {
            return "Syncing. \(Int(syncService.syncProgress * 100))% complete"
        }
        if pendingCount > 0 {
            return "Sync. \(pendingCount) pending changes"
        }
        return "Sync. No pending changes"
    }
}

// MARK: - Preview Helpers
#if DEBUG
struct OfflineIndicatorView_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 20) {
            OfflineIndicatorBanner()

            ConnectionStatusBadge()

            SyncStatusIndicator()

            DetailedSyncStatusView()

            SyncProgressView()

            Spacer()

            HStack {
                Spacer()
                FloatingSyncButton()
                    .padding()
            }
        }
        .padding()
    }
}
#endif
