//
//  PurchaseOrder.swift
//  Fleet Manager
//
//  Purchase Order model for procurement
//

import Foundation

// MARK: - Purchase Order Model
public struct PurchaseOrder: Identifiable, Codable, Equatable {
    public let id: String
    public let tenantId: String
    public var poNumber: String
    public var vendorId: String
    public var vendorName: String
    public var status: POStatus
    public var orderDate: Date
    public var expectedDeliveryDate: Date?
    public var actualDeliveryDate: Date?
    public var items: [POLineItem]
    public var subtotal: Double
    public var tax: Double
    public var shippingCost: Double
    public var total: Double
    public var deliveryAddress: String
    public var requestedBy: String
    public var approvedBy: String?
    public var approvalDate: Date?
    public var receivedBy: String?
    public var receivedDate: Date?
    public var notes: String?
    public var attachments: [String]?
    public var createdAt: Date
    public var updatedAt: Date

    // Computed properties
    public var isOverdue: Bool {
        guard let expectedDate = expectedDeliveryDate else { return false }
        return status == .ordered && Date() > expectedDate
    }

    public var isPending: Bool {
        status == .draft || status == .pendingApproval
    }

    public var canEdit: Bool {
        status == .draft
    }

    public var canApprove: Bool {
        status == .pendingApproval
    }

    public var canReceive: Bool {
        status == .ordered
    }

    public var statusColor: String {
        switch status {
        case .draft: return "gray"
        case .pendingApproval: return "orange"
        case .approved: return "blue"
        case .ordered: return "purple"
        case .partiallyReceived: return "teal"
        case .received: return "green"
        case .cancelled: return "red"
        case .closed: return "darkgray"
        }
    }

    public var formattedTotal: String {
        String(format: "$%.2f", total)
    }

    public var itemCount: Int {
        items.reduce(0) { $0 + $1.quantity }
    }
}

// MARK: - PO Status
public enum POStatus: String, Codable, CaseIterable {
    case draft = "Draft"
    case pendingApproval = "Pending Approval"
    case approved = "Approved"
    case ordered = "Ordered"
    case partiallyReceived = "Partially Received"
    case received = "Received"
    case cancelled = "Cancelled"
    case closed = "Closed"

    public var displayName: String {
        rawValue
    }

    public var icon: String {
        switch self {
        case .draft: return "doc.text"
        case .pendingApproval: return "clock.fill"
        case .approved: return "checkmark.circle.fill"
        case .ordered: return "shippingbox.fill"
        case .partiallyReceived: return "shippingbox.and.arrow.backward"
        case .received: return "checkmark.seal.fill"
        case .cancelled: return "xmark.circle.fill"
        case .closed: return "folder.fill"
        }
    }
}

// MARK: - PO Line Item
public struct POLineItem: Identifiable, Codable, Equatable {
    public let id: String
    public var partId: String?
    public var partNumber: String
    public var partName: String
    public var description: String?
    public var quantity: Int
    public var unitPrice: Double
    public var totalPrice: Double
    public var quantityReceived: Int
    public var notes: String?

    public var isFullyReceived: Bool {
        quantityReceived >= quantity
    }

    public var remainingQuantity: Int {
        max(0, quantity - quantityReceived)
    }

    public var receivedPercentage: Int {
        guard quantity > 0 else { return 0 }
        return Int((Double(quantityReceived) / Double(quantity)) * 100)
    }

    public var formattedUnitPrice: String {
        String(format: "$%.2f", unitPrice)
    }

    public var formattedTotalPrice: String {
        String(format: "$%.2f", totalPrice)
    }
}

// MARK: - PO Approval
public struct POApproval: Identifiable, Codable {
    public let id: String
    public let poId: String
    public let approverName: String
    public let approverId: String
    public let action: ApprovalAction
    public let comments: String?
    public let timestamp: Date

    public enum ApprovalAction: String, Codable {
        case approved = "Approved"
        case rejected = "Rejected"
        case requestChanges = "Request Changes"
    }
}

// MARK: - PO Receipt
public struct POReceipt: Identifiable, Codable {
    public let id: String
    public let poId: String
    public let poNumber: String
    public let receivedBy: String
    public let receivedDate: Date
    public var items: [POReceiptItem]
    public var notes: String?
    public var signature: String?
}

public struct POReceiptItem: Identifiable, Codable {
    public let id: String
    public let lineItemId: String
    public let partNumber: String
    public let partName: String
    public let quantityOrdered: Int
    public var quantityReceived: Int
    public var condition: ItemCondition
    public var notes: String?

    public enum ItemCondition: String, Codable {
        case good = "Good"
        case damaged = "Damaged"
        case incomplete = "Incomplete"
    }
}

// MARK: - API Response Models
public struct PurchaseOrdersResponse: Codable {
    public let orders: [PurchaseOrder]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct PurchaseOrderResponse: Codable {
    public let order: PurchaseOrder
}

public struct POApprovalsResponse: Codable {
    public let approvals: [POApproval]
}

public struct POReceiptsResponse: Codable {
    public let receipts: [POReceipt]
}
