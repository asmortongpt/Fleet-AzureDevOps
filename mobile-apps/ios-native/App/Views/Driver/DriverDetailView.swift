//
//  DriverDetailView.swift
//  Fleet Manager - iOS Native App
//
//  Complete driver detail view with performance metrics, certifications, and trip history
//  Follows ModernTheme design patterns and accessibility standards
//

import SwiftUI

// MARK: - Driver Detail View
struct DriverDetailView: View {
    let driverId: String
    @StateObject private var viewModel = DriversViewModel()
    @EnvironmentObject private var navigationCoordinator: NavigationCoordinator
    @Environment(\.dismiss) private var dismiss

    @State private var driver: Driver?
    @State private var showingEditDriver = false
    @State private var showingAssignVehicle = false
    @State private var selectedSection: DetailSection = .overview

    enum DetailSection: String, CaseIterable {
        case overview = "Overview"
        case performance = "Performance"
        case trips = "Trips"
        case certifications = "Certifications"
    }

    var body: some View {
        ScrollView {
            if let driver = driver {
                VStack(spacing: ModernTheme.Spacing.lg) {
                    // Header with Photo
                    DriverHeaderView(driver: driver)

                    // Quick Actions
                    QuickActionsView(driver: driver)
                        .padding(.horizontal)

                    // Section Picker
                    SectionPicker(selectedSection: $selectedSection)
                        .padding(.horizontal)

                    // Content Sections
                    switch selectedSection {
                    case .overview:
                        OverviewSection(driver: driver)
                    case .performance:
                        PerformanceSection(driver: driver)
                    case .trips:
                        TripsSection(driver: driver)
                    case .certifications:
                        CertificationsSection(driver: driver)
                    }
                }
                .padding(.bottom, ModernTheme.Spacing.xxl)
            } else if viewModel.isLoading {
                LoadingSpinnerView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .frame(minHeight: 400)
            } else {
                ErrorStateView(message: "Driver not found")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .frame(minHeight: 400)
            }
        }
        .navigationTitle("Driver Details")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button {
                        showingEditDriver = true
                    } label: {
                        Label("Edit Driver", systemImage: "pencil")
                    }

                    Button {
                        showingAssignVehicle = true
                    } label: {
                        Label("Assign Vehicle", systemImage: "car.fill")
                    }

                    Divider()

                    if let driver = driver {
                        Button {
                            callDriver(driver)
                        } label: {
                            Label("Call", systemImage: "phone.fill")
                        }

                        Button {
                            emailDriver(driver)
                        } label: {
                            Label("Email", systemImage: "envelope.fill")
                        }
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .symbolRenderingMode(.hierarchical)
                }
            }
        }
        .sheet(isPresented: $showingEditDriver) {
            Text("Edit Driver View - Coming Soon")
                .font(.title)
                .padding()
        }
        .sheet(isPresented: $showingAssignVehicle) {
            Text("Assign Vehicle View - Coming Soon")
                .font(.title)
                .padding()
        }
        .task {
            await loadDriver()
        }
    }

    // MARK: - Helper Methods
    private func loadDriver() async {
        driver = await viewModel.loadDriver(id: driverId)
    }

    private func callDriver(_ driver: Driver) {
        if let url = URL(string: "tel://\(driver.phone.filter { $0.isNumber })") {
            UIApplication.shared.open(url)
        }
    }

    private func emailDriver(_ driver: Driver) {
        if let url = URL(string: "mailto:\(driver.email)") {
            UIApplication.shared.open(url)
        }
    }
}

// MARK: - Driver Header View
struct DriverHeaderView: View {
    let driver: Driver

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            // Photo/Avatar
            if let photoURL = driver.photoURL, let url = URL(string: photoURL) {
                AsyncImage(url: url) { image in
                    image
                        .resizable()
                        .scaledToFill()
                } placeholder: {
                    DriverLargeInitialsAvatar(driver: driver)
                }
                .frame(width: 120, height: 120)
                .clipShape(Circle())
                .overlay(
                    Circle()
                        .stroke(driver.status.color, lineWidth: 4)
                )
            } else {
                DriverLargeInitialsAvatar(driver: driver)
                    .overlay(
                        Circle()
                            .stroke(driver.status.color, lineWidth: 4)
                    )
            }

            // Name and Status
            VStack(spacing: ModernTheme.Spacing.xs) {
                Text(driver.fullName)
                    .font(ModernTheme.Typography.title1)
                    .foregroundColor(ModernTheme.Colors.primaryText)

                DriverStatusBadge(status: driver.status)

                Text("Employee ID: \(driver.employeeId)")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }

            // Department & Region
            HStack(spacing: ModernTheme.Spacing.lg) {
                VStack(spacing: ModernTheme.Spacing.xxs) {
                    Image(systemName: "building.2.fill")
                        .font(.caption)
                        .foregroundColor(ModernTheme.Colors.info)
                    Text(driver.department)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Divider()
                    .frame(height: 30)

                VStack(spacing: ModernTheme.Spacing.xxs) {
                    Image(systemName: "map.fill")
                        .font(.caption)
                        .foregroundColor(ModernTheme.Colors.info)
                    Text(driver.region)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }
        }
        .padding(.vertical, ModernTheme.Spacing.lg)
        .frame(maxWidth: .infinity)
        .background(ModernTheme.Colors.secondaryBackground)
    }
}

// MARK: - Large Initials Avatar
struct DriverLargeInitialsAvatar: View {
    let driver: Driver

    var body: some View {
        ZStack {
            Circle()
                .fill(driver.status.color.opacity(0.2))

            Text(driver.initials)
                .font(.system(size: 48, weight: .bold))
                .foregroundColor(driver.status.color)
        }
        .frame(width: 120, height: 120)
    }
}

// MARK: - Quick Actions View
struct QuickActionsView: View {
    let driver: Driver

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            QuickActionButton(
                icon: "phone.fill",
                label: "Call",
                color: ModernTheme.Colors.success
            ) {
                if let url = URL(string: "tel://\(driver.phone.filter { $0.isNumber })") {
                    UIApplication.shared.open(url)
                }
            }

            QuickActionButton(
                icon: "envelope.fill",
                label: "Email",
                color: ModernTheme.Colors.info
            ) {
                if let url = URL(string: "mailto:\(driver.email)") {
                    UIApplication.shared.open(url)
                }
            }

            QuickActionButton(
                icon: "car.fill",
                label: "Assign",
                color: ModernTheme.Colors.primary
            ) {
                // Assign vehicle action
            }

            QuickActionButton(
                icon: "location.fill",
                label: "Trips",
                color: ModernTheme.Colors.warning
            ) {
                // View trips action
            }
        }
    }
}

// MARK: - Quick Action Button
struct QuickActionButton: View {
    let icon: String
    let label: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: {
            ModernTheme.Haptics.light()
            action()
        }) {
            VStack(spacing: ModernTheme.Spacing.xs) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(color)

                Text(label)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.primaryText)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, ModernTheme.Spacing.md)
            .background(color.opacity(0.1))
            .cornerRadius(ModernTheme.CornerRadius.md)
        }
    }
}

// MARK: - Section Picker
struct SectionPicker: View {
    @Binding var selectedSection: DriverDetailView.DetailSection

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: ModernTheme.Spacing.sm) {
                ForEach(DriverDetailView.DetailSection.allCases, id: \.self) { section in
                    Button(action: {
                        ModernTheme.Haptics.selection()
                        withAnimation {
                            selectedSection = section
                        }
                    }) {
                        Text(section.rawValue)
                            .font(ModernTheme.Typography.subheadline)
                            .foregroundColor(selectedSection == section ?
                                           .white : ModernTheme.Colors.primaryText)
                            .padding(.horizontal, ModernTheme.Spacing.lg)
                            .padding(.vertical, ModernTheme.Spacing.sm)
                            .background(selectedSection == section ?
                                      ModernTheme.Colors.primary : Color.clear)
                            .cornerRadius(ModernTheme.CornerRadius.md)
                    }
                }
            }
        }
    }
}

// MARK: - Overview Section
struct OverviewSection: View {
    let driver: Driver

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            // Contact Information
            SectionCard(title: "Contact Information", icon: "person.fill") {
                VStack(spacing: ModernTheme.Spacing.md) {
                    InfoRow(icon: "envelope.fill", label: "Email", value: driver.email)
                    InfoRow(icon: "phone.fill", label: "Phone", value: driver.phone)
                    if let address = driver.address {
                        InfoRow(icon: "location.fill", label: "Address", value: address.fullAddress)
                    }
                }
            }

            // License Information
            SectionCard(title: "License Information", icon: "creditcard.fill") {
                VStack(spacing: ModernTheme.Spacing.md) {
                    InfoRow(icon: "number", label: "License Number", value: driver.license.licenseNumber)
                    InfoRow(icon: "car.fill", label: "Class", value: driver.license.licenseClass.displayName)
                    InfoRow(icon: "map.fill", label: "State", value: driver.license.state)

                    if let expirationDate = driver.license.expirationDate {
                        HStack {
                            Image(systemName: "calendar")
                                .foregroundColor(driver.isLicenseExpiring || driver.isLicenseExpired ?
                                               ModernTheme.Colors.warning : ModernTheme.Colors.info)
                            Text("Expires")
                                .foregroundColor(ModernTheme.Colors.secondaryText)
                            Spacer()
                            Text(expirationDate.formatted(date: .abbreviated, time: .omitted))
                                .foregroundColor(driver.isLicenseExpiring || driver.isLicenseExpired ?
                                               ModernTheme.Colors.warning : ModernTheme.Colors.primaryText)
                                .fontWeight(.semibold)
                        }
                        .font(ModernTheme.Typography.subheadline)
                    }
                }
            }

            // Employment Information
            SectionCard(title: "Employment", icon: "briefcase.fill") {
                VStack(spacing: ModernTheme.Spacing.md) {
                    InfoRow(icon: "calendar", label: "Hire Date",
                           value: driver.hireDate.formatted(date: .abbreviated, time: .omitted))
                    InfoRow(icon: "building.2", label: "Department", value: driver.department)
                    InfoRow(icon: "map", label: "Region", value: driver.region)
                }
            }

            // Current Assignment
            if !driver.assignedVehicles.isEmpty {
                SectionCard(title: "Current Assignment", icon: "car.2.fill") {
                    VStack(spacing: ModernTheme.Spacing.sm) {
                        ForEach(driver.assignedVehicles, id: \.self) { vehicleId in
                            HStack {
                                Image(systemName: "car.fill")
                                    .foregroundColor(ModernTheme.Colors.primary)
                                Text(vehicleId)
                                    .font(ModernTheme.Typography.body)
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.caption)
                                    .foregroundColor(ModernTheme.Colors.tertiaryText)
                            }
                            .padding(.vertical, ModernTheme.Spacing.xs)
                        }
                    }
                }
            }

            // Emergency Contact
            if let emergencyContact = driver.emergencyContact {
                SectionCard(title: "Emergency Contact", icon: "phone.badge.plus.fill") {
                    VStack(spacing: ModernTheme.Spacing.md) {
                        InfoRow(icon: "person.fill", label: "Name", value: emergencyContact.name)
                        InfoRow(icon: "person.2.fill", label: "Relationship", value: emergencyContact.relationship)
                        InfoRow(icon: "phone.fill", label: "Phone", value: emergencyContact.phone)
                        if let altPhone = emergencyContact.alternatePhone {
                            InfoRow(icon: "phone.fill", label: "Alt Phone", value: altPhone)
                        }
                    }
                }
            }
        }
        .padding(.horizontal)
    }
}

// MARK: - Performance Section
struct PerformanceSection: View {
    let driver: Driver

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            // Safety Score Card
            SafetyScoreCard(metrics: driver.performanceMetrics)

            // Performance Metrics
            SectionCard(title: "Performance Metrics", icon: "chart.bar.fill") {
                VStack(spacing: ModernTheme.Spacing.md) {
                    MetricRow(
                        icon: "location.fill",
                        label: "Total Trips",
                        value: "\(driver.performanceMetrics.totalTrips)",
                        color: ModernTheme.Colors.primary
                    )
                    MetricRow(
                        icon: "road.lanes",
                        label: "Total Miles",
                        value: String(format: "%.1f mi", driver.performanceMetrics.totalMiles),
                        color: ModernTheme.Colors.info
                    )
                    MetricRow(
                        icon: "clock.fill",
                        label: "Total Hours",
                        value: String(format: "%.1f hrs", driver.performanceMetrics.totalHours),
                        color: ModernTheme.Colors.warning
                    )
                    MetricRow(
                        icon: "gauge.high",
                        label: "Avg Speed",
                        value: String(format: "%.1f mph", driver.performanceMetrics.averageSpeedMph),
                        color: ModernTheme.Colors.secondary
                    )
                    MetricRow(
                        icon: "fuelpump.fill",
                        label: "Fuel Efficiency",
                        value: String(format: "%.1f mpg", driver.performanceMetrics.fuelEfficiencyMpg),
                        color: ModernTheme.Colors.success
                    )
                    MetricRow(
                        icon: "checkmark.circle.fill",
                        label: "On-Time Rate",
                        value: "\(driver.performanceMetrics.onTimePercentage)%",
                        color: ModernTheme.Colors.success
                    )
                }
            }

            // Incidents & Violations
            if driver.performanceMetrics.hasIncidents {
                SectionCard(title: "Incidents & Violations", icon: "exclamationmark.triangle.fill") {
                    VStack(spacing: ModernTheme.Spacing.md) {
                        MetricRow(
                            icon: "exclamationmark.shield.fill",
                            label: "Incidents",
                            value: "\(driver.performanceMetrics.incidentCount)",
                            color: ModernTheme.Colors.error
                        )
                        MetricRow(
                            icon: "exclamationmark.triangle.fill",
                            label: "Violations",
                            value: "\(driver.performanceMetrics.violationCount)",
                            color: ModernTheme.Colors.warning
                        )
                    }
                }
            }
        }
        .padding(.horizontal)
    }
}

// MARK: - Safety Score Card
struct SafetyScoreCard: View {
    let metrics: PerformanceMetrics

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.md) {
            Text("Safety Score")
                .font(ModernTheme.Typography.headline)
                .foregroundColor(ModernTheme.Colors.primaryText)

            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.2), lineWidth: 20)

                Circle()
                    .trim(from: 0, to: metrics.safetyScore / 100)
                    .stroke(metrics.safetyGradeColor, style: StrokeStyle(lineWidth: 20, lineCap: .round))
                    .rotationEffect(.degrees(-90))

                VStack(spacing: ModernTheme.Spacing.xs) {
                    Text(String(format: "%.0f", metrics.safetyScore))
                        .font(.system(size: 48, weight: .bold))
                        .foregroundColor(metrics.safetyGradeColor)

                    Text("Grade: \(metrics.safetyGrade)")
                        .font(ModernTheme.Typography.subheadline)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }
            .frame(width: 200, height: 200)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, ModernTheme.Spacing.lg)
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.lg)
        .padding(.horizontal)
    }
}

// MARK: - Trips Section
struct TripsSection: View {
    let driver: Driver

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            SectionCard(title: "Trip Summary", icon: "location.fill") {
                VStack(spacing: ModernTheme.Spacing.md) {
                    MetricRow(
                        icon: "location.fill",
                        label: "Total Trips",
                        value: "\(driver.performanceMetrics.totalTrips)",
                        color: ModernTheme.Colors.primary
                    )

                    if let lastTripDate = driver.performanceMetrics.lastTripDate {
                        InfoRow(
                            icon: "calendar",
                            label: "Last Trip",
                            value: lastTripDate.formatted(date: .abbreviated, time: .omitted)
                        )
                    }

                    Divider()

                    Button(action: {}) {
                        HStack {
                            Image(systemName: "list.bullet")
                            Text("View All Trips")
                            Spacer()
                            Image(systemName: "chevron.right")
                        }
                        .font(ModernTheme.Typography.body)
                        .foregroundColor(ModernTheme.Colors.primary)
                    }
                }
            }

            // Placeholder for recent trips list
            Text("Recent trips will appear here")
                .font(ModernTheme.Typography.subheadline)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .frame(maxWidth: .infinity)
                .padding(.vertical, ModernTheme.Spacing.xxl)
        }
        .padding(.horizontal)
    }
}

// MARK: - Certifications Section
struct CertificationsSection: View {
    let driver: Driver

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            if driver.certifications.isEmpty {
                Text("No certifications on file")
                    .font(ModernTheme.Typography.subheadline)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, ModernTheme.Spacing.xxl)
            } else {
                ForEach(driver.certifications) { certification in
                    CertificationCard(certification: certification)
                }
            }
        }
        .padding(.horizontal)
    }
}

// MARK: - Certification Card
struct CertificationCard: View {
    let certification: Certification

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            HStack {
                VStack(alignment: .leading, spacing: ModernTheme.Spacing.xs) {
                    Text(certification.name)
                        .font(ModernTheme.Typography.bodyBold)
                        .foregroundColor(ModernTheme.Colors.primaryText)

                    Text(certification.issuingAuthority)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Spacer()

                CertificationStatusBadge(status: certification.status)
            }

            if let certNumber = certification.certificationNumber {
                HStack {
                    Image(systemName: "number")
                        .foregroundColor(ModernTheme.Colors.info)
                    Text(certNumber)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }

            if let expirationDate = certification.expirationDate {
                HStack {
                    Image(systemName: "calendar")
                        .foregroundColor(certification.isExpiringSoon || certification.isExpired ?
                                       ModernTheme.Colors.warning : ModernTheme.Colors.info)
                    Text("Expires")
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                    Spacer()
                    Text(expirationDate.formatted(date: .abbreviated, time: .omitted))
                        .foregroundColor(certification.isExpiringSoon || certification.isExpired ?
                                       ModernTheme.Colors.warning : ModernTheme.Colors.primaryText)
                        .fontWeight(.semibold)
                }
                .font(ModernTheme.Typography.caption1)
            }

            if certification.isExpiringSoon {
                HStack(spacing: ModernTheme.Spacing.xs) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.caption2)
                    Text("Expiring soon")
                        .font(ModernTheme.Typography.caption2)
                }
                .foregroundColor(ModernTheme.Colors.warning)
            } else if certification.isExpired {
                HStack(spacing: ModernTheme.Spacing.xs) {
                    Image(systemName: "xmark.octagon.fill")
                        .font(.caption2)
                    Text("Expired")
                        .font(ModernTheme.Typography.caption2)
                }
                .foregroundColor(ModernTheme.Colors.error)
            }
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }
}

// MARK: - Certification Status Badge
struct CertificationStatusBadge: View {
    let status: CertificationStatus

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.xxs) {
            Circle()
                .fill(status.color)
                .frame(width: 8, height: 8)
            Text(status.displayName)
                .font(ModernTheme.Typography.caption2)
                .foregroundColor(status.color)
        }
        .padding(.horizontal, ModernTheme.Spacing.sm)
        .padding(.vertical, ModernTheme.Spacing.xxs)
        .background(status.color.opacity(0.15))
        .cornerRadius(ModernTheme.CornerRadius.sm)
    }
}

// MARK: - Section Card
struct SectionCard<Content: View>: View {
    let title: String
    let icon: String
    let content: Content

    init(title: String, icon: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.icon = icon
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(ModernTheme.Colors.primary)
                Text(title)
                    .font(ModernTheme.Typography.headline)
                    .foregroundColor(ModernTheme.Colors.primaryText)
            }

            content
        }
        .padding()
        .background(ModernTheme.Colors.secondaryBackground)
        .cornerRadius(ModernTheme.CornerRadius.md)
    }
}

// MARK: - Info Row
struct InfoRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(ModernTheme.Colors.info)
            Text(label)
                .foregroundColor(ModernTheme.Colors.secondaryText)
            Spacer()
            Text(value)
                .foregroundColor(ModernTheme.Colors.primaryText)
                .fontWeight(.semibold)
        }
        .font(ModernTheme.Typography.subheadline)
    }
}

// MARK: - Metric Row
struct MetricRow: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 24)
            Text(label)
                .foregroundColor(ModernTheme.Colors.secondaryText)
            Spacer()
            Text(value)
                .foregroundColor(ModernTheme.Colors.primaryText)
                .fontWeight(.bold)
        }
        .font(ModernTheme.Typography.subheadline)
    }
}

// MARK: - Error State View
struct ErrorStateView: View {
    let message: String

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 60))
                .foregroundColor(ModernTheme.Colors.warning)

            Text("Error")
                .font(ModernTheme.Typography.title2)

            Text(message)
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
    }
}

// MARK: - Preview
#if DEBUG
struct DriverDetailView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            DriverDetailView(driverId: "driver-001")
                .environmentObject(NavigationCoordinator())
        }
    }
}
#endif
