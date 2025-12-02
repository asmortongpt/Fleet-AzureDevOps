//
//  ProcurementViewModels.swift
//  Fleet Manager
//
//  ViewModels for Procurement Module
//

import Foundation
import Combine
import SwiftUI

// MARK: - Vendor View Model
@MainActor
class VendorViewModel: RefreshableViewModel {
    @Published var vendors: [Vendor] = []
    @Published var selectedVendor: Vendor?
    @Published var filteredVendors: [Vendor] = []
    @Published var selectedCategory: VendorCategory?
    @Published var selectedStatus: VendorStatus?

    private let networkManager = AzureNetworkManager()

    override init() {
        super.init()
        loadMockData()
    }

    // MARK: - Fetch Vendors
    func fetchVendors() async {
        startLoading()

        do {
            // In production, this would call the API
            // let response: VendorsResponse = try await networkManager.get(endpoint: "/api/vendors")
            // vendors = response.vendors

            // For now, use mock data
            try await Task.sleep(nanoseconds: 500_000_000)
            applyFilters()
            finishLoading()
        } catch {
            handleError(error)
        }
    }

    override func refresh() async {
        await fetchVendors()
    }

    // MARK: - Filtering
    func applyFilters() {
        var filtered = vendors

        if let category = selectedCategory {
            filtered = filtered.filter { $0.category == category }
        }

        if let status = selectedStatus {
            filtered = filtered.filter { $0.status == status }
        }

        if !searchText.isEmpty {
            filtered = filtered.filter {
                $0.name.localizedCaseInsensitiveContains(searchText) ||
                $0.contactName.localizedCaseInsensitiveContains(searchText)
            }
        }

        filteredVendors = filtered.sorted { $0.totalSpend > $1.totalSpend }
    }

    override func performSearch() {
        applyFilters()
    }

    func selectCategory(_ category: VendorCategory?) {
        selectedCategory = category
        applyFilters()
    }

    func selectStatus(_ status: VendorStatus?) {
        selectedStatus = status
        applyFilters()
    }

    // MARK: - Mock Data
    private func loadMockData() {
        vendors = [
            Vendor(
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
                notes: "Preferred parts supplier",
                tags: ["parts", "automotive"],
                createdAt: Date().addingTimeInterval(-86400 * 365),
                updatedAt: Date()
            ),
            Vendor(
                id: "v2",
                tenantId: "tenant1",
                name: "Fleet Tire & Service",
                category: .tires,
                contactName: "Sarah Johnson",
                email: "sarah.j@fleettire.com",
                phone: "(555) 234-5678",
                address: VendorAddress(street: "456 Oak Ave", city: "Nashville", state: "TN", zipCode: "37201", country: "USA"),
                paymentTerms: PaymentTerms(netDays: 15, discountPercent: nil, discountDays: nil, acceptsCreditCard: true, acceptsACH: true, acceptsCheck: false),
                rating: 5.0,
                status: .active,
                totalSpend: 89320.00,
                orderCount: 45,
                notes: "Excellent tire service",
                tags: ["tires", "service"],
                createdAt: Date().addingTimeInterval(-86400 * 200),
                updatedAt: Date()
            ),
            Vendor(
                id: "v3",
                tenantId: "tenant1",
                name: "Premium Fleet Maintenance",
                category: .maintenance,
                contactName: "Mike Davis",
                email: "mike@premiumfleet.com",
                phone: "(555) 345-6789",
                address: VendorAddress(street: "789 Industrial Blvd", city: "Knoxville", state: "TN", zipCode: "37901", country: "USA"),
                paymentTerms: PaymentTerms(netDays: 30, discountPercent: nil, discountDays: nil, acceptsCreditCard: true, acceptsACH: true, acceptsCheck: true),
                rating: 4.0,
                status: .active,
                totalSpend: 67890.00,
                orderCount: 32,
                notes: nil,
                tags: ["maintenance"],
                createdAt: Date().addingTimeInterval(-86400 * 150),
                updatedAt: Date()
            )
        ]
        filteredVendors = vendors
    }
}

// MARK: - Parts View Model
@MainActor
class PartsViewModel: RefreshableViewModel {
    @Published var parts: [Part] = []
    @Published var selectedPart: Part?
    @Published var filteredParts: [Part] = []
    @Published var selectedCategory: PartCategory?
    @Published var showLowStockOnly = false

    private let networkManager = AzureNetworkManager()

    var lowStockParts: [Part] {
        parts.filter { $0.isLowStock }
    }

    var outOfStockParts: [Part] {
        parts.filter { $0.isOutOfStock }
    }

    override init() {
        super.init()
        loadMockData()
    }

    // MARK: - Fetch Parts
    func fetchParts() async {
        startLoading()

        do {
            try await Task.sleep(nanoseconds: 500_000_000)
            applyFilters()
            finishLoading()
        } catch {
            handleError(error)
        }
    }

    override func refresh() async {
        await fetchParts()
    }

    // MARK: - Filtering
    func applyFilters() {
        var filtered = parts

        if let category = selectedCategory {
            filtered = filtered.filter { $0.category == category }
        }

        if showLowStockOnly {
            filtered = filtered.filter { $0.isLowStock }
        }

        if !searchText.isEmpty {
            filtered = filtered.filter {
                $0.name.localizedCaseInsensitiveContains(searchText) ||
                $0.partNumber.localizedCaseInsensitiveContains(searchText)
            }
        }

        filteredParts = filtered.sorted { $0.name < $1.name }
    }

    override func performSearch() {
        applyFilters()
    }

    func selectCategory(_ category: PartCategory?) {
        selectedCategory = category
        applyFilters()
    }

    func toggleLowStockFilter() {
        showLowStockOnly.toggle()
        applyFilters()
    }

    // MARK: - Mock Data
    private func loadMockData() {
        parts = [
            Part(id: "p1", tenantId: "tenant1", partNumber: "BRK-001", name: "Brake Pads - Front", description: "High-performance ceramic brake pads", category: .brakes, manufacturer: "Brembo", vendorId: "v1", vendorName: "AutoZone Fleet Services", unitPrice: 89.99, quantityOnHand: 24, reorderPoint: 10, reorderQuantity: 20, location: "Shelf A-12", compatibleVehicles: ["Ford F-150", "Chevrolet Silverado"], notes: nil, status: .active, createdAt: Date(), updatedAt: Date()),
            Part(id: "p2", tenantId: "tenant1", partNumber: "OIL-001", name: "Engine Oil Filter", description: "Premium oil filter", category: .filters, manufacturer: "Fram", vendorId: "v1", vendorName: "AutoZone Fleet Services", unitPrice: 12.99, quantityOnHand: 8, reorderPoint: 15, reorderQuantity: 30, location: "Shelf B-5", compatibleVehicles: nil, notes: "Low stock - reorder soon", status: .active, createdAt: Date(), updatedAt: Date()),
            Part(id: "p3", tenantId: "tenant1", partNumber: "TIRE-001", name: "All-Season Tire 225/65R17", description: "Durable all-season tire", category: .tires, manufacturer: "Michelin", vendorId: "v2", vendorName: "Fleet Tire & Service", unitPrice: 145.00, quantityOnHand: 32, reorderPoint: 12, reorderQuantity: 24, location: "Warehouse C", compatibleVehicles: ["Toyota RAV4", "Honda CR-V"], notes: nil, status: .active, createdAt: Date(), updatedAt: Date()),
            Part(id: "p4", tenantId: "tenant1", partNumber: "BAT-001", name: "12V Heavy Duty Battery", description: "Cold cranking amps: 800", category: .electrical, manufacturer: "Interstate", vendorId: "v1", vendorName: "AutoZone Fleet Services", unitPrice: 189.99, quantityOnHand: 0, reorderPoint: 5, reorderQuantity: 10, location: "Shelf D-3", compatibleVehicles: nil, notes: "OUT OF STOCK - urgent reorder", status: .active, createdAt: Date(), updatedAt: Date())
        ]
        filteredParts = parts
    }
}

// MARK: - Purchase Order View Model
@MainActor
class PurchaseOrderViewModel: RefreshableViewModel {
    @Published var purchaseOrders: [PurchaseOrder] = []
    @Published var selectedOrder: PurchaseOrder?
    @Published var filteredOrders: [PurchaseOrder] = []
    @Published var selectedStatus: POStatus?

    private let networkManager = AzureNetworkManager()

    var pendingApproval: [PurchaseOrder] {
        purchaseOrders.filter { $0.status == .pendingApproval }
    }

    var overdue: [PurchaseOrder] {
        purchaseOrders.filter { $0.isOverdue }
    }

    override init() {
        super.init()
        loadMockData()
    }

    // MARK: - Fetch Purchase Orders
    func fetchPurchaseOrders() async {
        startLoading()

        do {
            try await Task.sleep(nanoseconds: 500_000_000)
            applyFilters()
            finishLoading()
        } catch {
            handleError(error)
        }
    }

    override func refresh() async {
        await fetchPurchaseOrders()
    }

    // MARK: - Filtering
    func applyFilters() {
        var filtered = purchaseOrders

        if let status = selectedStatus {
            filtered = filtered.filter { $0.status == status }
        }

        if !searchText.isEmpty {
            filtered = filtered.filter {
                $0.poNumber.localizedCaseInsensitiveContains(searchText) ||
                $0.vendorName.localizedCaseInsensitiveContains(searchText)
            }
        }

        filteredOrders = filtered.sorted { $0.orderDate > $1.orderDate }
    }

    override func performSearch() {
        applyFilters()
    }

    func selectStatus(_ status: POStatus?) {
        selectedStatus = status
        applyFilters()
    }

    // MARK: - Mock Data
    private func loadMockData() {
        let lineItems1 = [
            POLineItem(id: "li1", partId: "p1", partNumber: "BRK-001", partName: "Brake Pads - Front", description: nil, quantity: 20, unitPrice: 89.99, totalPrice: 1799.80, quantityReceived: 0, notes: nil),
            POLineItem(id: "li2", partId: "p2", partNumber: "OIL-001", partName: "Engine Oil Filter", description: nil, quantity: 30, unitPrice: 12.99, totalPrice: 389.70, quantityReceived: 0, notes: nil)
        ]

        purchaseOrders = [
            PurchaseOrder(id: "po1", tenantId: "tenant1", poNumber: "PO-2025-001", vendorId: "v1", vendorName: "AutoZone Fleet Services", status: .pendingApproval, orderDate: Date(), expectedDeliveryDate: Date().addingTimeInterval(86400 * 7), actualDeliveryDate: nil, items: lineItems1, subtotal: 2189.50, tax: 175.16, shippingCost: 50.00, total: 2414.66, deliveryAddress: "123 Fleet Street, Memphis, TN", requestedBy: "John Manager", approvedBy: nil, approvalDate: nil, receivedBy: nil, receivedDate: nil, notes: "Rush order for brake service", attachments: nil, createdAt: Date(), updatedAt: Date()),
            PurchaseOrder(id: "po2", tenantId: "tenant1", poNumber: "PO-2025-002", vendorId: "v2", vendorName: "Fleet Tire & Service", status: .ordered, orderDate: Date().addingTimeInterval(-86400 * 3), expectedDeliveryDate: Date().addingTimeInterval(86400 * 2), actualDeliveryDate: nil, items: [], subtotal: 3480.00, tax: 278.40, shippingCost: 0, total: 3758.40, deliveryAddress: "123 Fleet Street, Memphis, TN", requestedBy: "John Manager", approvedBy: "Sarah Director", approvalDate: Date().addingTimeInterval(-86400 * 2), receivedBy: nil, receivedDate: nil, notes: "24 tires for winter season", attachments: nil, createdAt: Date().addingTimeInterval(-86400 * 3), updatedAt: Date())
        ]
        filteredOrders = purchaseOrders
    }
}

// MARK: - Invoice View Model
@MainActor
class InvoiceViewModel: RefreshableViewModel {
    @Published var invoices: [Invoice] = []
    @Published var selectedInvoice: Invoice?
    @Published var filteredInvoices: [Invoice] = []
    @Published var selectedStatus: InvoiceStatus?

    private let networkManager = AzureNetworkManager()

    var pendingApproval: [Invoice] {
        invoices.filter { $0.status == .pendingApproval }
    }

    var overdue: [Invoice] {
        invoices.filter { $0.isOverdue }
    }

    var totalDue: Double {
        invoices.filter { $0.status == .pending || $0.status == .approved }.reduce(0) { $0 + $1.amountDue }
    }

    override init() {
        super.init()
        loadMockData()
    }

    // MARK: - Fetch Invoices
    func fetchInvoices() async {
        startLoading()

        do {
            try await Task.sleep(nanoseconds: 500_000_000)
            applyFilters()
            finishLoading()
        } catch {
            handleError(error)
        }
    }

    override func refresh() async {
        await fetchInvoices()
    }

    // MARK: - Filtering
    func applyFilters() {
        var filtered = invoices

        if let status = selectedStatus {
            filtered = filtered.filter { $0.status == status }
        }

        if !searchText.isEmpty {
            filtered = filtered.filter {
                $0.invoiceNumber.localizedCaseInsensitiveContains(searchText) ||
                $0.vendorName.localizedCaseInsensitiveContains(searchText)
            }
        }

        filteredInvoices = filtered.sorted { $0.invoiceDate > $1.invoiceDate }
    }

    override func performSearch() {
        applyFilters()
    }

    func selectStatus(_ status: InvoiceStatus?) {
        selectedStatus = status
        applyFilters()
    }

    // MARK: - Mock Data
    private func loadMockData() {
        let items1 = [
            InvoiceLineItem(id: "ili1", description: "Brake service and parts", partNumber: "BRK-001", quantity: 4, unitPrice: 89.99, totalPrice: 359.96, poLineItemId: nil, notes: nil),
            InvoiceLineItem(id: "ili2", description: "Labor - 3 hours", partNumber: nil, quantity: 3, unitPrice: 95.00, totalPrice: 285.00, poLineItemId: nil, notes: nil)
        ]

        invoices = [
            Invoice(id: "inv1", tenantId: "tenant1", invoiceNumber: "INV-2025-0015", vendorId: "v1", vendorName: "AutoZone Fleet Services", purchaseOrderId: "po1", poNumber: "PO-2025-001", status: .pendingApproval, invoiceDate: Date(), dueDate: Date().addingTimeInterval(86400 * 30), paidDate: nil, items: items1, subtotal: 644.96, tax: 51.60, total: 696.56, amountPaid: 0, amountDue: 696.56, paymentMethod: nil, paymentReference: nil, approvedBy: nil, approvalDate: nil, paidBy: nil, notes: "Matches PO-2025-001", attachments: nil, createdAt: Date(), updatedAt: Date()),
            Invoice(id: "inv2", tenantId: "tenant1", invoiceNumber: "INV-2025-0012", vendorId: "v2", vendorName: "Fleet Tire & Service", purchaseOrderId: nil, poNumber: nil, status: .pending, invoiceDate: Date().addingTimeInterval(-86400 * 15), dueDate: Date().addingTimeInterval(-86400 * 5), paidDate: nil, items: [], subtotal: 1250.00, tax: 100.00, total: 1350.00, amountPaid: 0, amountDue: 1350.00, paymentMethod: nil, paymentReference: nil, approvedBy: "Sarah Director", approvalDate: Date().addingTimeInterval(-86400 * 10), paidBy: nil, notes: "OVERDUE - No matching PO", attachments: nil, createdAt: Date().addingTimeInterval(-86400 * 15), updatedAt: Date())
        ]
        filteredInvoices = invoices
    }
}
