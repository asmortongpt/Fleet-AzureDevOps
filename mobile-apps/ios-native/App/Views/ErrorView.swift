import SwiftUI

// MARK: - Error View
/// User-friendly error display with retry and support options
struct ErrorView: View {

    // MARK: - Properties
    let error: Error
    let context: String
    let onRetry: (() -> Void)?
    let onDismiss: (() -> Void)?

    private let errorHandler = ErrorHandler.shared

    @State private var isRetrying = false
    @State private var showDetails = false

    // MARK: - Initialization
    init(
        error: Error,
        context: String = "Unknown",
        onRetry: (() -> Void)? = nil,
        onDismiss: (() -> Void)? = nil
    ) {
        self.error = error
        self.context = context
        self.onRetry = onRetry
        self.onDismiss = onDismiss
    }

    // MARK: - Body
    var body: some View {
        VStack(spacing: 24) {
            // Error Icon
            errorIcon
                .font(.system(size: 60))
                .foregroundColor(.red)

            // Error Message
            VStack(spacing: 8) {
                Text("Oops!")
                    .font(.title2)
                    .fontWeight(.bold)

                Text(errorHandler.getUserFriendlyMessage(for: error))
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)
                    .padding(.horizontal)
            }

            // Action Buttons
            VStack(spacing: 12) {
                // Retry Button
                if let onRetry = onRetry {
                    Button(action: handleRetry) {
                        HStack {
                            if isRetrying {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                            } else {
                                Image(systemName: "arrow.clockwise")
                            }
                            Text(isRetrying ? "Retrying..." : "Try Again")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(isRetrying)
                }

                // Dismiss Button
                if let onDismiss = onDismiss {
                    Button(action: onDismiss) {
                        Text("Dismiss")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.gray.opacity(0.2))
                            .foregroundColor(.primary)
                            .cornerRadius(12)
                    }
                }

                // Contact Support Button
                Button(action: contactSupport) {
                    HStack {
                        Image(systemName: "envelope")
                        Text("Contact Support")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.gray.opacity(0.2))
                    .foregroundColor(.primary)
                    .cornerRadius(12)
                }
            }
            .padding(.horizontal)

            // Show Details Toggle
            Button(action: { showDetails.toggle() }) {
                HStack {
                    Text("Technical Details")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Image(systemName: showDetails ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Technical Details
            if showDetails {
                VStack(alignment: .leading, spacing: 8) {
                    detailRow(label: "Context", value: context)
                    detailRow(label: "Error Type", value: String(describing: type(of: error)))
                    detailRow(label: "Description", value: error.localizedDescription)

                    if let nsError = error as NSError? {
                        detailRow(label: "Domain", value: nsError.domain)
                        detailRow(label: "Code", value: String(nsError.code))
                    }
                }
                .font(.caption)
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(8)
                .padding(.horizontal)
            }
        }
        .padding(.vertical, 32)
    }

    // MARK: - Computed Properties
    private var errorIcon: some View {
        Image(systemName: errorHandler.getErrorIcon(for: error))
    }

    // MARK: - Helper Views
    private func detailRow(label: String, value: String) -> some View {
        HStack(alignment: .top) {
            Text("\(label):")
                .fontWeight(.semibold)
                .frame(width: 80, alignment: .leading)
            Text(value)
                .foregroundColor(.secondary)
            Spacer()
        }
    }

    // MARK: - Actions
    private func handleRetry() {
        isRetrying = true

        // Simulate async operation
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            isRetrying = false
            onRetry?()
        }
    }

    private func contactSupport() {
        // Generate support email with error details
        let subject = "Fleet Management - Error Report"
        let body = generateSupportEmailBody()

        if let url = createMailtoURL(subject: subject, body: body) {
            if UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url)
            }
        }
    }

    private func generateSupportEmailBody() -> String {
        var body = "Error Report\n\n"
        body += "Context: \(context)\n"
        body += "Error Type: \(String(describing: type(of: error)))\n"
        body += "Description: \(error.localizedDescription)\n"

        if let nsError = error as NSError? {
            body += "Domain: \(nsError.domain)\n"
            body += "Code: \(nsError.code)\n"
        }

        body += "\nApp Version: \(Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown")\n"
        body += "Build: \(Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "Unknown")\n"
        body += "iOS Version: \(UIDevice.current.systemVersion)\n"
        body += "Device Model: \(UIDevice.current.model)\n"

        return body
    }

    private func createMailtoURL(subject: String, body: String) -> URL? {
        let encodedSubject = subject.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let encodedBody = body.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        let mailtoString = "mailto:support@fleet.com?subject=\(encodedSubject)&body=\(encodedBody)"

        return URL(string: mailtoString)
    }
}

// MARK: - Inline Error View
/// Compact error view for inline display
struct InlineErrorView: View {
    let error: Error
    let onRetry: (() -> Void)?

    private let errorHandler = ErrorHandler.shared

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: errorHandler.getErrorIcon(for: error))
                .font(.title3)
                .foregroundColor(.red)

            VStack(alignment: .leading, spacing: 4) {
                Text("Error")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)

                Text(errorHandler.getUserFriendlyMessage(for: error))
                    .font(.subheadline)
                    .foregroundColor(.primary)
            }

            Spacer()

            if let onRetry = onRetry {
                Button(action: onRetry) {
                    Image(systemName: "arrow.clockwise")
                        .font(.title3)
                        .foregroundColor(.blue)
                }
            }
        }
        .padding()
        .background(Color.red.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Error Banner View
/// Banner view for non-intrusive error display
struct ErrorBannerView: View {
    let error: Error
    let onDismiss: () -> Void

    @State private var offset: CGFloat = -100
    private let errorHandler = ErrorHandler.shared

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: errorHandler.getErrorIcon(for: error))
                .foregroundColor(.white)

            Text(errorHandler.getUserFriendlyMessage(for: error))
                .font(.subheadline)
                .foregroundColor(.white)
                .lineLimit(2)

            Spacer()

            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .foregroundColor(.white)
            }
        }
        .padding()
        .background(Color.red)
        .cornerRadius(12)
        .shadow(radius: 4)
        .padding(.horizontal)
        .offset(y: offset)
        .onAppear {
            withAnimation(.spring()) {
                offset = 0
            }

            // Auto-dismiss after 5 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
                dismissBanner()
            }
        }
    }

    private func dismissBanner() {
        withAnimation(.spring()) {
            offset = -100
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            onDismiss()
        }
    }
}

// MARK: - Error State View
/// View for empty states with errors
struct ErrorStateView: View {
    let title: String
    let message: String
    let icon: String
    let actionTitle: String?
    let action: (() -> Void)?

    init(
        title: String = "Something went wrong",
        message: String = "We encountered an error. Please try again.",
        icon: String = "exclamationmark.triangle",
        actionTitle: String? = "Try Again",
        action: (() -> Void)? = nil
    ) {
        self.title = title
        self.message = message
        self.icon = icon
        self.actionTitle = actionTitle
        self.action = action
    }

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: icon)
                .font(.system(size: 60))
                .foregroundColor(.gray)

            VStack(spacing: 8) {
                Text(title)
                    .font(.title2)
                    .fontWeight(.semibold)

                Text(message)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            if let actionTitle = actionTitle, let action = action {
                Button(action: action) {
                    Text(actionTitle)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .padding(.horizontal, 32)
                        .padding(.vertical, 12)
                        .background(Color.blue)
                        .cornerRadius(8)
                }
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - View Extension for Error Handling
extension View {
    /// Display error banner
    func errorBanner(error: Binding<Error?>) -> some View {
        ZStack(alignment: .top) {
            self

            if let errorValue = error.wrappedValue {
                ErrorBannerView(error: errorValue) {
                    error.wrappedValue = nil
                }
                .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
    }

    /// Display error alert
    func errorAlert(error: Binding<Error?>, onRetry: (() -> Void)? = nil) -> some View {
        let errorHandler = ErrorHandler.shared

        return alert(
            isPresented: Binding<Bool>(
                get: { error.wrappedValue != nil },
                set: { if !$0 { error.wrappedValue = nil } }
            )
        ) {
            Alert(
                title: Text("Error"),
                message: Text(error.wrappedValue.map { errorHandler.getUserFriendlyMessage(for: $0) } ?? "An error occurred"),
                primaryButton: .default(Text("OK")) {
                    error.wrappedValue = nil
                },
                secondaryButton: .default(Text("Retry")) {
                    onRetry?()
                    error.wrappedValue = nil
                }
            )
        }
    }
}

// MARK: - Preview
struct ErrorView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // Full Error View
            ErrorView(
                error: FleetError.networkError("Connection failed"),
                context: "Loading vehicles",
                onRetry: {},
                onDismiss: {}
            )
            .previewDisplayName("Full Error View")

            // Inline Error View
            InlineErrorView(
                error: APIError.serverError,
                onRetry: {}
            )
            .previewLayout(.sizeThatFits)
            .padding()
            .previewDisplayName("Inline Error View")

            // Error State View
            ErrorStateView(
                title: "No Vehicles Found",
                message: "You don't have any vehicles in your fleet yet.",
                icon: "car.fill",
                actionTitle: "Add Vehicle",
                action: {}
            )
            .previewDisplayName("Error State View")

            // Error Banner
            ZStack {
                Color.gray.opacity(0.1)
                    .ignoresSafeArea()

                VStack {
                    ErrorBannerView(
                        error: FleetError.timeout,
                        onDismiss: {}
                    )
                    Spacer()
                }
            }
            .previewDisplayName("Error Banner")
        }
    }
}
import SwiftUI

// MARK: - Placeholder Views for Missing Components
// These are temporary placeholders to allow the app to build
// Each should be replaced with full implementation

// MARK: - Route Views
struct RouteOptimizerView: View {
    var body: some View {
        Text("Route Optimizer")
            .navigationTitle("Route Optimizer")
    }
}

// MARK: - Data Views
struct DataGridView: View {
    var body: some View {
        Text("Data Grid")
            .navigationTitle("Data Grid")
    }
}

// MARK: - Assignment Views
struct VehicleAssignmentView: View {
    var body: some View {
        Text("Vehicle Assignments")
            .navigationTitle("Vehicle Assignments")
    }
}

struct CreateAssignmentView: View {
    var body: some View {
        Text("Create Assignment")
            .navigationTitle("Create Assignment")
    }
}

struct AssignmentRequestView: View {
    var body: some View {
        Text("Assignment Request")
            .navigationTitle("Assignment Request")
    }
}

struct AssignmentHistoryView: View {
    var body: some View {
        Text("Assignment History")
            .navigationTitle("Assignment History")
    }
}

// MARK: - Compliance Views
struct ComplianceDashboardView: View {
    var body: some View {
        Text("Compliance Dashboard")
            .navigationTitle("Compliance Dashboard")
    }
}

struct ViolationsListView: View {
    var body: some View {
        Text("Violations List")
            .navigationTitle("Violations List")
    }
}

struct ExpiringItemsView: View {
    var body: some View {
        Text("Expiring Items")
            .navigationTitle("Expiring Items")
    }
}

struct CertificationManagementView: View {
    var body: some View {
        Text("Certification Management")
            .navigationTitle("Certification Management")
    }
}

// MARK: - Shift Management Views
struct ShiftManagementView: View {
    var body: some View {
        Text("Shift Management")
            .navigationTitle("Shift Management")
    }
}

struct CreateShiftView: View {
    var body: some View {
        Text("Create Shift")
            .navigationTitle("Create Shift")
    }
}

struct ClockInOutView: View {
    var body: some View {
        Text("Clock In/Out")
            .navigationTitle("Clock In/Out")
    }
}

struct ShiftSwapView: View {
    var body: some View {
        Text("Shift Swap")
            .navigationTitle("Shift Swap")
    }
}

struct ShiftReportView: View {
    var body: some View {
        Text("Shift Report")
            .navigationTitle("Shift Report")
    }
}

// MARK: - Telemetry Views
struct TelemetryDashboardView: View {
    var body: some View {
        Text("Telemetry Dashboard")
            .navigationTitle("Telemetry Dashboard")
    }
}

struct DTCListView: View {
    var body: some View {
        Text("Diagnostic Trouble Codes")
            .navigationTitle("DTC List")
    }
}

struct ComponentHealthView: View {
    var body: some View {
        Text("Component Health")
            .navigationTitle("Component Health")
    }
}

struct HistoricalChartsView: View {
    var body: some View {
        Text("Historical Charts")
            .navigationTitle("Historical Charts")
    }
}

// MARK: - Analytics Views
struct PredictiveAnalyticsView: View {
    var body: some View {
        Text("Predictive Analytics")
            .navigationTitle("Predictive Analytics")
    }
}

struct PredictionDetailView: View {
    var body: some View {
        Text("Prediction Detail")
            .navigationTitle("Prediction Detail")
    }
}

// MARK: - Inventory Views
struct InventoryManagementView: View {
    var body: some View {
        Text("Inventory Management")
            .navigationTitle("Inventory Management")
    }
}

struct StockMovementView: View {
    var body: some View {
        Text("Stock Movement")
            .navigationTitle("Stock Movement")
    }
}

struct InventoryAlertsView: View {
    var body: some View {
        Text("Inventory Alerts")
            .navigationTitle("Inventory Alerts")
    }
}

struct InventoryReportView: View {
    var body: some View {
        Text("Inventory Report")
            .navigationTitle("Inventory Report")
    }
}

// MARK: - Budget Views
struct BudgetPlanningView: View {
    var body: some View {
        Text("Budget Planning")
            .navigationTitle("Budget Planning")
    }
}

struct BudgetEditorView: View {
    var body: some View {
        Text("Budget Editor")
            .navigationTitle("Budget Editor")
    }
}

struct BudgetVarianceView: View {
    var body: some View {
        Text("Budget Variance")
            .navigationTitle("Budget Variance")
    }
}

struct BudgetForecastView: View {
    var body: some View {
        Text("Budget Forecast")
            .navigationTitle("Budget Forecast")
    }
}

// MARK: - Warranty Views
struct WarrantyManagementView: View {
    var body: some View {
        Text("Warranty Management")
            .navigationTitle("Warranty Management")
    }
}

struct WarrantyDetailView: View {
    var body: some View {
        Text("Warranty Detail")
            .navigationTitle("Warranty Detail")
    }
}

struct ClaimSubmissionView: View {
    var body: some View {
        Text("Claim Submission")
            .navigationTitle("Claim Submission")
    }
}

struct ClaimTrackingView: View {
    var body: some View {
        Text("Claim Tracking")
            .navigationTitle("Claim Tracking")
    }
}

// MARK: - Benchmarking Views
struct BenchmarkingView: View {
    var body: some View {
        Text("Benchmarking")
            .navigationTitle("Benchmarking")
    }
}

struct BenchmarkDetailView: View {
    var body: some View {
        Text("Benchmark Detail")
            .navigationTitle("Benchmark Detail")
    }
}

// MARK: - Schedule Views
struct ScheduleView: View {
    var body: some View {
        Text("Schedule")
            .navigationTitle("Schedule")
    }
}

// MARK: - Checklist Views
struct ChecklistManagementView: View {
    var body: some View {
        Text("Checklist Management")
            .navigationTitle("Checklist Management")
    }
}

struct ActiveChecklistView: View {
    var body: some View {
        Text("Active Checklist")
            .navigationTitle("Active Checklist")
    }
}

struct ChecklistHistoryView: View {
    var body: some View {
        Text("Checklist History")
            .navigationTitle("Checklist History")
    }
}

struct ChecklistTemplateEditorView: View {
    var body: some View {
        Text("Checklist Template Editor")
            .navigationTitle("Template Editor")
    }
}

// MARK: - Vehicle Inspection Views
struct VehicleInspectionView: View {
    var body: some View {
        Text("Vehicle Inspection")
            .navigationTitle("Vehicle Inspection")
    }
}

// MARK: - Report Views
struct CustomReportBuilderView: View {
    var body: some View {
        Text("Custom Report Builder")
            .navigationTitle("Report Builder")
    }
}

// MARK: - Fuel Management Views
struct FuelManagementView: View {
    var body: some View {
        Text("Fuel Management")
            .navigationTitle("Fuel Management")
    }
}

// MARK: - Document Management Views
struct DocumentManagementView: View {
    var body: some View {
        Text("Document Management")
            .navigationTitle("Document Management")
    }
}

// MARK: - Incident/Damage Views
struct IncidentReportView: View {
    var body: some View {
        Text("Incident Report")
            .navigationTitle("Incident Report")
    }
}

struct DamageReportView: View {
    var body: some View {
        Text("Damage Report")
            .navigationTitle("Damage Report")
    }
}

// MARK: - Hardware Integration Views
struct TripTrackingView: View {
    var body: some View {
        Text("Trip Tracking")
            .navigationTitle("Trip Tracking")
    }
}

struct OBD2DiagnosticsView: View {
    var body: some View {
        Text("OBD2 Diagnostics")
            .navigationTitle("OBD2 Diagnostics")
    }
}

struct GeofencingView: View {
    var body: some View {
        Text("Geofencing")
            .navigationTitle("Geofencing")
    }
}
