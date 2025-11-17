import SwiftUI
import PhotosUI

struct FuelManagementView: View {
    @StateObject private var viewModel = FuelViewModel()
    @State private var showingFilters = false
    @State private var showingAnalytics = false
    @State private var showingCardManager = false
    @State private var selectedTab: FuelTab = .purchases

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Tab Selector
                Picker("View", selection: $selectedTab) {
                    ForEach(FuelTab.allCases, id: \.self) { tab in
                        Label(tab.rawValue, systemImage: tab.icon)
                            .tag(tab)
                    }
                }
                .pickerStyle(.segmented)
                .padding()

                // Content
                TabView(selection: $selectedTab) {
                    purchasesView
                        .tag(FuelTab.purchases)

                    analyticsView
                        .tag(FuelTab.analytics)

                    cardsView
                        .tag(FuelTab.cards)
                }
                .tabViewStyle(.page(indexDisplayMode: .never))
            }
            .navigationTitle("Fuel Management")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Menu {
                        Button {
                            viewModel.showingAddPurchase = true
                        } label: {
                            Label("Add Purchase", systemImage: "fuelpump.fill")
                        }

                        Button {
                            showingFilters = true
                        } label: {
                            Label("Filters", systemImage: "line.3.horizontal.decrease.circle")
                        }

                        Button {
                            Task {
                                await viewModel.refresh()
                            }
                        } label: {
                            Label("Refresh", systemImage: "arrow.clockwise")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
            .sheet(isPresented: $viewModel.showingAddPurchase) {
                AddFuelPurchaseView(viewModel: viewModel)
            }
            .sheet(isPresented: $showingFilters) {
                FuelFiltersView(viewModel: viewModel)
            }
        }
    }

    // MARK: - Purchases View
    private var purchasesView: View {
        VStack {
            if viewModel.loadingState.isLoading && viewModel.purchases.isEmpty {
                ProgressView("Loading fuel purchases...")
                    .padding()
            } else if viewModel.filteredPurchases.isEmpty {
                emptyPurchasesView
            } else {
                ScrollView {
                    LazyVStack(spacing: ModernTheme.Spacing.md) {
                        // Summary Cards
                        summaryCardsView

                        // Purchase List
                        ForEach(viewModel.filteredPurchases) { purchase in
                            FuelPurchaseCard(purchase: purchase)
                                .onTapGesture {
                                    viewModel.selectedPurchase = purchase
                                }
                                .contextMenu {
                                    Button(role: .destructive) {
                                        Task {
                                            await viewModel.deletePurchase(purchase)
                                        }
                                    } label: {
                                        Label("Delete", systemImage: "trash")
                                    }
                                }
                        }
                    }
                    .padding()
                }
                .refreshable {
                    await viewModel.refresh()
                }
            }
        }
    }

    private var summaryCardsView: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            SummaryCard(
                title: "Total Spent",
                value: String(format: "$%.2f", viewModel.totalSpending),
                icon: "dollarsign.circle.fill",
                color: ModernTheme.Colors.primary
            )

            SummaryCard(
                title: "Total Gallons",
                value: String(format: "%.1f", viewModel.totalGallons),
                icon: "fuelpump.fill",
                color: ModernTheme.Colors.secondary
            )

            SummaryCard(
                title: "Avg Price",
                value: String(format: "$%.2f", viewModel.averagePricePerGallon),
                icon: "chart.line.uptrend.xyaxis",
                color: ModernTheme.Colors.info
            )
        }
    }

    private var emptyPurchasesView: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            Image(systemName: "fuelpump.slash")
                .font(.system(size: 60))
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text("No Fuel Purchases")
                .font(ModernTheme.Typography.title2)

            Text("Tap + to add your first fuel purchase")
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Button {
                viewModel.showingAddPurchase = true
            } label: {
                Text("Add Purchase")
            }
            .primaryButton()
            .padding(.horizontal, 40)
        }
        .padding()
    }

    // MARK: - Analytics View
    private var analyticsView: View {
        ScrollView {
            VStack(spacing: ModernTheme.Spacing.lg) {
                if let analytics = viewModel.analytics {
                    // Fleet Overview
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                        Text("Fleet Overview")
                            .font(ModernTheme.Typography.title2)

                        HStack(spacing: ModernTheme.Spacing.md) {
                            AnalyticsCard(
                                title: "Fleet Avg MPG",
                                value: String(format: "%.1f", analytics.fleetAverageMPG),
                                icon: "gauge.high",
                                color: ModernTheme.Colors.success
                            )

                            AnalyticsCard(
                                title: "Avg Fill-Up",
                                value: String(format: "$%.2f", analytics.averageFillUpCost),
                                icon: "fuelpump.fill",
                                color: ModernTheme.Colors.warning
                            )
                        }
                    }

                    // Cost Trend Chart
                    VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                        Text("Monthly Spending Trend")
                            .font(ModernTheme.Typography.title3)

                        // Placeholder for chart
                        RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                            .fill(ModernTheme.Colors.secondaryBackground)
                            .frame(height: 200)
                            .overlay(
                                Text("Chart visualization")
                                    .foregroundColor(ModernTheme.Colors.secondaryText)
                            )
                    }
                    .modernCard()

                    // Efficiency Rankings
                    if !analytics.topPerformingVehicles.isEmpty {
                        VStack(alignment: .leading, spacing: ModernTheme.Spacing.md) {
                            Text("Top Performers")
                                .font(ModernTheme.Typography.title3)

                            ForEach(analytics.topPerformingVehicles) { vehicle in
                                VehicleEfficiencyRow(vehicle: vehicle, isTop: true)
                            }
                        }
                        .modernCard()
                    }
                } else {
                    ProgressView("Loading analytics...")
                }
            }
            .padding()
        }
        .refreshable {
            await viewModel.refresh()
        }
    }

    // MARK: - Cards View
    private var cardsView: View {
        VStack {
            if viewModel.fuelCards.isEmpty {
                emptyCardsView
            } else {
                ScrollView {
                    LazyVStack(spacing: ModernTheme.Spacing.md) {
                        // Active Cards Section
                        if !viewModel.activeCards.isEmpty {
                            Section {
                                ForEach(viewModel.activeCards) { card in
                                    FuelCardRow(card: card)
                                }
                            } header: {
                                HStack {
                                    Text("Active Cards")
                                        .font(ModernTheme.Typography.title3)
                                    Spacer()
                                }
                            }
                        }

                        // Alerts Section
                        if !viewModel.expiringCards.isEmpty || !viewModel.overLimitCards.isEmpty {
                            Section {
                                if !viewModel.expiringCards.isEmpty {
                                    ForEach(viewModel.expiringCards) { card in
                                        AlertCardRow(
                                            card: card,
                                            alertType: .expiring,
                                            message: "Expires soon"
                                        )
                                    }
                                }

                                if !viewModel.overLimitCards.isEmpty {
                                    ForEach(viewModel.overLimitCards) { card in
                                        AlertCardRow(
                                            card: card,
                                            alertType: .overLimit,
                                            message: "Over monthly limit"
                                        )
                                    }
                                }
                            } header: {
                                HStack {
                                    Text("Alerts")
                                        .font(ModernTheme.Typography.title3)
                                        .foregroundColor(ModernTheme.Colors.error)
                                    Spacer()
                                }
                            }
                        }
                    }
                    .padding()
                }
            }
        }
    }

    private var emptyCardsView: some View {
        VStack(spacing: ModernTheme.Spacing.lg) {
            Image(systemName: "creditcard.slash")
                .font(.system(size: 60))
                .foregroundColor(ModernTheme.Colors.secondaryText)

            Text("No Fuel Cards")
                .font(ModernTheme.Typography.title2)

            Text("Add fuel cards to track spending limits")
                .font(ModernTheme.Typography.body)
                .foregroundColor(ModernTheme.Colors.secondaryText)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

// MARK: - Supporting Views
struct FuelPurchaseCard: View {
    let purchase: FuelPurchase

    var body: some View {
        VStack(alignment: .leading, spacing: ModernTheme.Spacing.sm) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(purchase.vehicleNumber)
                        .font(ModernTheme.Typography.headline)

                    Text(purchase.driverName)
                        .font(ModernTheme.Typography.subheadline)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(purchase.formattedCost)
                        .font(ModernTheme.Typography.title3)
                        .foregroundColor(ModernTheme.Colors.primary)

                    Text(purchase.formattedDate)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }

            Divider()

            HStack(spacing: ModernTheme.Spacing.lg) {
                Label(purchase.formattedQuantity, systemImage: "fuelpump.fill")
                    .font(ModernTheme.Typography.caption1)

                Label(String(format: "$%.2f/gal", purchase.pricePerUnit), systemImage: "dollarsign.circle")
                    .font(ModernTheme.Typography.caption1)

                Label(purchase.location.name, systemImage: "mappin.circle")
                    .font(ModernTheme.Typography.caption1)
                    .lineLimit(1)
            }
            .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
                .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
        )
    }
}

struct SummaryCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(spacing: ModernTheme.Spacing.sm) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)

            Text(value)
                .font(ModernTheme.Typography.title3)
                .fontWeight(.bold)

            Text(title)
                .font(ModernTheme.Typography.caption1)
                .foregroundColor(ModernTheme.Colors.secondaryText)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.secondaryBackground)
        )
    }
}

struct AnalyticsCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title)
                .foregroundColor(color)
                .frame(width: 50, height: 50)
                .background(color.opacity(0.1))
                .cornerRadius(ModernTheme.CornerRadius.md)

            VStack(alignment: .leading, spacing: 4) {
                Text(value)
                    .font(ModernTheme.Typography.title2)
                    .fontWeight(.bold)

                Text(title)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }

            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.secondaryBackground)
        )
    }
}

struct VehicleEfficiencyRow: View {
    let vehicle: VehicleEfficiency
    let isTop: Bool

    var body: some View {
        HStack {
            Image(systemName: isTop ? "arrow.up.circle.fill" : "arrow.down.circle.fill")
                .foregroundColor(isTop ? ModernTheme.Colors.success : ModernTheme.Colors.error)

            VStack(alignment: .leading, spacing: 4) {
                Text(vehicle.vehicleNumber)
                    .font(ModernTheme.Typography.bodyBold)

                Text("\(vehicle.vehicleMake) \(vehicle.vehicleModel)")
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(String(format: "%.1f MPG", vehicle.averageMPG))
                    .font(ModernTheme.Typography.bodyBold)

                Text(String(format: "$%.3f/mi", vehicle.costPerMile))
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(ModernTheme.Colors.secondaryText)
            }
        }
        .padding(.vertical, ModernTheme.Spacing.sm)
    }
}

struct FuelCardRow: View {
    let card: FuelCard

    var body: some View {
        HStack(spacing: ModernTheme.Spacing.md) {
            Image(systemName: card.provider.icon)
                .font(.title2)
                .foregroundColor(ModernTheme.Colors.primary)
                .frame(width: 40, height: 40)
                .background(ModernTheme.Colors.primaryVariant.opacity(0.1))
                .cornerRadius(ModernTheme.CornerRadius.sm)

            VStack(alignment: .leading, spacing: 4) {
                Text(card.cardNumber)
                    .font(ModernTheme.Typography.bodyBold)

                if let driver = card.assignedDriverName {
                    Text(driver)
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }

                if let limit = card.monthlyLimit {
                    ProgressView(value: card.currentMonthSpending, total: limit)
                        .tint(card.limitPercentage > 90 ? ModernTheme.Colors.error : ModernTheme.Colors.success)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(String(format: "$%.2f", card.currentMonthSpending))
                    .font(ModernTheme.Typography.bodyBold)

                if let limit = card.monthlyLimit {
                    Text("of $\(Int(limit))")
                        .font(ModernTheme.Typography.caption1)
                        .foregroundColor(ModernTheme.Colors.secondaryText)
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(ModernTheme.Colors.background)
                .shadow(color: ModernTheme.Shadow.small.color, radius: ModernTheme.Shadow.small.radius)
        )
    }
}

struct AlertCardRow: View {
    let card: FuelCard
    let alertType: AlertType
    let message: String

    enum AlertType {
        case expiring
        case overLimit

        var color: Color {
            switch self {
            case .expiring: return ModernTheme.Colors.warning
            case .overLimit: return ModernTheme.Colors.error
            }
        }

        var icon: String {
            switch self {
            case .expiring: return "clock.badge.exclamationmark"
            case .overLimit: return "exclamationmark.triangle.fill"
            }
        }
    }

    var body: some View {
        HStack {
            Image(systemName: alertType.icon)
                .foregroundColor(alertType.color)

            VStack(alignment: .leading, spacing: 4) {
                Text(card.cardNumber)
                    .font(ModernTheme.Typography.bodyBold)

                Text(message)
                    .font(ModernTheme.Typography.caption1)
                    .foregroundColor(alertType.color)
            }

            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: ModernTheme.CornerRadius.md)
                .fill(alertType.color.opacity(0.1))
        )
    }
}

// MARK: - Add Purchase View
struct AddFuelPurchaseView: View {
    @ObservedObject var viewModel: FuelViewModel
    @Environment(\.dismiss) private var dismiss

    @State private var vehicleId = ""
    @State private var vehicleNumber = ""
    @State private var driverName = ""
    @State private var quantity = ""
    @State private var pricePerUnit = ""
    @State private var odometer = ""
    @State private var stationName = ""
    @State private var isTankFull = true
    @State private var notes = ""
    @State private var selectedImage: PhotosPickerItem?
    @State private var receiptImage: UIImage?

    var body: some View {
        NavigationStack {
            Form {
                Section("Vehicle Information") {
                    TextField("Vehicle Number", text: $vehicleNumber)
                    TextField("Driver Name", text: $driverName)
                    TextField("Odometer Reading", text: $odometer)
                        .keyboardType(.decimalPad)
                }

                Section("Fuel Details") {
                    TextField("Quantity (gallons)", text: $quantity)
                        .keyboardType(.decimalPad)

                    TextField("Price per Gallon", text: $pricePerUnit)
                        .keyboardType(.decimalPad)

                    Toggle("Tank Full", isOn: $isTankFull)
                }

                Section("Station") {
                    TextField("Station Name", text: $stationName)

                    Button {
                        // Use current location
                    } label: {
                        Label("Use Current Location", systemImage: "location.fill")
                    }
                }

                Section("Receipt") {
                    if let receiptImage {
                        Image(uiImage: receiptImage)
                            .resizable()
                            .scaledToFit()
                            .frame(maxHeight: 200)
                    }

                    PhotosPicker(selection: $selectedImage, matching: .images) {
                        Label("Add Receipt Photo", systemImage: "camera.fill")
                    }
                }

                Section("Notes") {
                    TextEditor(text: $notes)
                        .frame(minHeight: 100)
                }
            }
            .navigationTitle("Add Fuel Purchase")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        savePurchase()
                    }
                    .disabled(!isValid)
                }
            }
            .onChange(of: selectedImage) { _, newValue in
                Task {
                    if let data = try? await newValue?.loadTransferable(type: Data.self),
                       let image = UIImage(data: data) {
                        receiptImage = image
                    }
                }
            }
        }
    }

    private var isValid: Bool {
        !vehicleNumber.isEmpty && !driverName.isEmpty &&
        !quantity.isEmpty && !pricePerUnit.isEmpty &&
        !odometer.isEmpty && !stationName.isEmpty
    }

    private func savePurchase() {
        guard let qty = Double(quantity),
              let price = Double(pricePerUnit),
              let odom = Double(odometer) else { return }

        let purchase = FuelPurchase(
            id: UUID().uuidString,
            vehicleId: vehicleId,
            vehicleNumber: vehicleNumber,
            driverName: driverName,
            purchaseDate: Date(),
            fuelType: .gasoline,
            quantity: qty,
            pricePerUnit: price,
            totalCost: qty * price,
            odometer: odom,
            location: FuelStationLocation(
                name: stationName,
                address: "",
                city: "",
                state: "",
                zipCode: "",
                latitude: 0,
                longitude: 0
            ),
            fuelCardId: nil,
            receiptImageUrl: nil,
            receiptImageData: receiptImage?.jpegData(compressionQuality: 0.8),
            notes: notes.isEmpty ? nil : notes,
            isTankFull: isTankFull
        )

        Task {
            await viewModel.addPurchase(purchase)
            dismiss()
        }
    }
}

// MARK: - Filters View
struct FuelFiltersView: View {
    @ObservedObject var viewModel: FuelViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Sort By") {
                    Picker("Sort", selection: $viewModel.sortOption) {
                        ForEach(SortOption.allCases, id: \.self) { option in
                            Label(option.rawValue, systemImage: option.icon)
                                .tag(option)
                        }
                    }
                }

                Section("Date Range") {
                    Picker("Range", selection: $viewModel.selectedDateRange) {
                        ForEach(DateRange.allCases, id: \.self) { range in
                            Text(range.rawValue)
                                .tag(range)
                        }
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Tab Enum
enum FuelTab: String, CaseIterable {
    case purchases = "Purchases"
    case analytics = "Analytics"
    case cards = "Cards"

    var icon: String {
        switch self {
        case .purchases: return "fuelpump.fill"
        case .analytics: return "chart.bar.fill"
        case .cards: return "creditcard.fill"
        }
    }
}

// MARK: - Preview
#Preview {
    FuelManagementView()
}
