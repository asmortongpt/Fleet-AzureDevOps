//
//  VendorDetailView.swift
//  Fleet Manager
//
//  Detailed vendor view with contact actions
//

import SwiftUI

struct VendorDetailView: View {
    let vendor: Vendor
    @State private var showingEditVendor = false
    @State private var selectedTab = 0

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header Card
                vendorHeaderCard

                // Quick Actions
                quickActionsSection

                // Tabs
                tabsSection

                // Content based on selected tab
                Group {
                    switch selectedTab {
                    case 0:
                        partsSuppliedSection
                    case 1:
                        purchaseOrdersSection
                    case 2:
                        invoicesSection
                    case 3:
                        performanceSection
                    default:
                        EmptyView()
                    }
                }
            }
            .padding()
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle(vendor.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingEditVendor = true }) {
                    Image(systemName: "pencil")
                }
            }
        }
        .sheet(isPresented: $showingEditVendor) {
            AddVendorView()
        }
    }

    // MARK: - Header Card
    private var vendorHeaderCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Status and Rating
            HStack {
                HStack(spacing: 4) {
                    ForEach(0..<5) { index in
                        Image(systemName: index < vendor.ratingStars ? "star.fill" : "star")
                            .font(.caption)
                            .foregroundColor(index < vendor.ratingStars ? .yellow : .gray)
                    }
                    Text(String(format: "%.1f", vendor.rating))
                        .font(.caption.bold())
                }

                Spacer()

                Text(vendor.status.rawValue)
                    .font(.caption.bold())
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color(vendor.statusColor).opacity(0.2))
                    .foregroundColor(Color(vendor.statusColor))
                    .cornerRadius(12)
            }

            Divider()

            // Category
            HStack {
                Image(systemName: vendor.category.icon)
                    .foregroundColor(.blue)
                Text(vendor.category.rawValue)
                    .font(.subheadline)
                Spacer()
            }

            // Contact Information
            VStack(alignment: .leading, spacing: 8) {
                InfoRow(icon: "person.fill", label: "Contact", value: vendor.contactName)
                InfoRow(icon: "envelope.fill", label: "Email", value: vendor.email)
                InfoRow(icon: "phone.fill", label: "Phone", value: vendor.phone)
                InfoRow(icon: "mappin.circle.fill", label: "Address", value: vendor.address.fullAddress)
            }

            Divider()

            // Payment Terms
            VStack(alignment: .leading, spacing: 8) {
                Text("Payment Terms")
                    .font(.caption.bold())
                    .foregroundColor(.secondary)

                Text(vendor.paymentTerms.displayTerms)
                    .font(.subheadline)

                HStack(spacing: 12) {
                    if vendor.paymentTerms.acceptsCreditCard {
                        PaymentMethodBadge(icon: "creditcard.fill", label: "Card")
                    }
                    if vendor.paymentTerms.acceptsACH {
                        PaymentMethodBadge(icon: "building.columns.fill", label: "ACH")
                    }
                    if vendor.paymentTerms.acceptsCheck {
                        PaymentMethodBadge(icon: "doc.text.fill", label: "Check")
                    }
                }
            }

            // Statistics
            HStack(spacing: 20) {
                StatBox(
                    icon: "dollarsign.circle.fill",
                    label: "Total Spend",
                    value: vendor.formattedTotalSpend,
                    color: .green
                )

                StatBox(
                    icon: "shippingbox.fill",
                    label: "Orders",
                    value: "\(vendor.orderCount)",
                    color: .blue
                )
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }

    // MARK: - Quick Actions
    private var quickActionsSection: some View {
        HStack(spacing: 12) {
            ActionButton(
                icon: "phone.fill",
                label: "Call",
                color: .green
            ) {
                if let url = URL(string: "tel://\(vendor.phone.filter { $0.isNumber })") {
                    UIApplication.shared.open(url)
                }
            }

            ActionButton(
                icon: "envelope.fill",
                label: "Email",
                color: .blue
            ) {
                if let url = URL(string: "mailto:\(vendor.email)") {
                    UIApplication.shared.open(url)
                }
            }

            ActionButton(
                icon: "map.fill",
                label: "Directions",
                color: .orange
            ) {
                // Open maps with address
            }

            ActionButton(
                icon: "plus.circle.fill",
                label: "New PO",
                color: .purple
            ) {
                // Create new purchase order
            }
        }
    }

    // MARK: - Tabs Section
    private var tabsSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                TabButton(title: "Parts", isSelected: selectedTab == 0) {
                    selectedTab = 0
                }
                TabButton(title: "Orders", isSelected: selectedTab == 1) {
                    selectedTab = 1
                }
                TabButton(title: "Invoices", isSelected: selectedTab == 2) {
                    selectedTab = 2
                }
                TabButton(title: "Performance", isSelected: selectedTab == 3) {
                    selectedTab = 3
                }
            }
        }
    }

    // MARK: - Parts Supplied Section
    private var partsSuppliedSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Parts Supplied")
                .font(.headline)
                .padding(.horizontal)

            VStack(spacing: 8) {
                PartRowView(partNumber: "BRK-001", partName: "Brake Pads - Front", price: "$89.99")
                PartRowView(partNumber: "OIL-001", partName: "Engine Oil Filter", price: "$12.99")
                PartRowView(partNumber: "AIR-001", partName: "Air Filter", price: "$24.99")
            }
        }
    }

    // MARK: - Purchase Orders Section
    private var purchaseOrdersSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Purchase Orders")
                .font(.headline)
                .padding(.horizontal)

            VStack(spacing: 8) {
                PORowView(poNumber: "PO-2025-001", date: "Nov 25, 2025", amount: "$2,414.66", status: "Pending")
                PORowView(poNumber: "PO-2024-125", date: "Nov 20, 2025", amount: "$1,250.00", status: "Received")
                PORowView(poNumber: "PO-2024-118", date: "Nov 15, 2025", amount: "$850.00", status: "Received")
            }
        }
    }

    // MARK: - Invoices Section
    private var invoicesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Invoices")
                .font(.headline)
                .padding(.horizontal)

            VStack(spacing: 8) {
                InvoiceRowView(invoiceNumber: "INV-2025-0015", date: "Nov 25, 2025", amount: "$696.56", status: "Pending")
                InvoiceRowView(invoiceNumber: "INV-2024-0089", date: "Nov 18, 2025", amount: "$1,200.00", status: "Paid")
            }
        }
    }

    // MARK: - Performance Section
    private var performanceSection: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Performance Metrics")
                .font(.headline)
                .padding(.horizontal)

            VStack(spacing: 12) {
                PerformanceMetricCard(
                    title: "On-Time Delivery",
                    value: "95%",
                    icon: "clock.fill",
                    color: .green
                )

                PerformanceMetricCard(
                    title: "Average Lead Time",
                    value: "5 days",
                    icon: "calendar",
                    color: .blue
                )

                PerformanceMetricCard(
                    title: "Quality Rating",
                    value: "4.5/5.0",
                    icon: "star.fill",
                    color: .yellow
                )

                PerformanceMetricCard(
                    title: "Total Orders (YTD)",
                    value: "\(vendor.orderCount)",
                    icon: "shippingbox.fill",
                    color: .purple
                )
            }
            .padding(.horizontal)
        }
    }
}

// MARK: - Supporting Views

struct InfoRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundColor(.blue)
                .frame(width: 20)

            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(value)
                    .font(.subheadline)
            }
        }
    }
}

struct PaymentMethodBadge: View {
    let icon: String
    let label: String

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption2)
            Text(label)
                .font(.caption2)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.blue.opacity(0.1))
        .foregroundColor(.blue)
        .cornerRadius(8)
    }
}

struct StatBox: View {
    let icon: String
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(color)

            Text(value)
                .font(.title3.bold())

            Text(label)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(.tertiarySystemGroupedBackground))
        .cornerRadius(10)
    }
}

struct ActionButton: View {
    let icon: String
    let label: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.title3)
                Text(label)
                    .font(.caption)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(color.opacity(0.1))
            .foregroundColor(color)
            .cornerRadius(12)
        }
    }
}

struct TabButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline.bold())
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(isSelected ? Color.blue : Color(.secondarySystemGroupedBackground))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(20)
        }
    }
}

struct PartRowView: View {
    let partNumber: String
    let partName: String
    let price: String

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(partName)
                    .font(.subheadline)
                Text(partNumber)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
            Text(price)
                .font(.subheadline.bold())
                .foregroundColor(.green)
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(10)
    }
}

struct PORowView: View {
    let poNumber: String
    let date: String
    let amount: String
    let status: String

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(poNumber)
                    .font(.subheadline.bold())
                Text(date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(amount)
                    .font(.subheadline.bold())
                Text(status)
                    .font(.caption)
                    .foregroundColor(status == "Received" ? .green : .orange)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(10)
    }
}

struct InvoiceRowView: View {
    let invoiceNumber: String
    let date: String
    let amount: String
    let status: String

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(invoiceNumber)
                    .font(.subheadline.bold())
                Text(date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text(amount)
                    .font(.subheadline.bold())
                Text(status)
                    .font(.caption)
                    .foregroundColor(status == "Paid" ? .green : .orange)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(10)
    }
}

struct PerformanceMetricCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
                Text(value)
                    .font(.title3.bold())
            }

            Spacer()
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
    }
}

#Preview {
    NavigationStack {
        VendorDetailView(vendor: Vendor(
            id: "v1",
            tenantId: "tenant1",
            name: "AutoZone Fleet Services",
            category: .parts,
            contactName: "John Smith",
            email: "john.smith@autozone.com",
            phone: "(555) 123-4567",
            address: VendorAddress(street: "123 Main St", city: "Memphis", state: "TN", zipCode: "38103", country: "USA"),
            paymentTerms: PaymentTerms(netDays: 30, discountPercent: 2, discountDays: 10, acceptsCreditCard: true, acceptsACH: true, acceptsCheck: true),
            rating: 4.5,
            status: .active,
            totalSpend: 125450.00,
            orderCount: 87,
            notes: nil,
            tags: nil,
            createdAt: Date(),
            updatedAt: Date()
        ))
    }
}
