//
//  Invoice.swift
//  Fleet Manager
//
//  Invoice model for procurement and accounts payable
//

import Foundation

// MARK: - Invoice Model
public struct Invoice: Identifiable, Codable, Equatable {
    public let id: String
    public let tenantId: String
    public var invoiceNumber: String
    public var vendorId: String
    public var vendorName: String
    public var purchaseOrderId: String?
    public var poNumber: String?
    public var status: InvoiceStatus
    public var invoiceDate: Date
    public var dueDate: Date
    public var paidDate: Date?
    public var items: [InvoiceLineItem]
    public var subtotal: Double
    public var tax: Double
    public var total: Double
    public var amountPaid: Double
    public var amountDue: Double
    public var paymentMethod: PaymentMethod?
    public var paymentReference: String?
    public var approvedBy: String?
    public var approvalDate: Date?
    public var paidBy: String?
    public var notes: String?
    public var attachments: [String]?
    public var createdAt: Date
    public var updatedAt: Date

    // Computed properties
    public var isOverdue: Bool {
        status == .pending && Date() > dueDate
    }

    public var isPaid: Bool {
        status == .paid
    }

    public var canApprove: Bool {
        status == .pendingApproval
    }

    public var canPay: Bool {
        status == .approved && amountDue > 0
    }

    public var daysOverdue: Int {
        guard isOverdue else { return 0 }
        return Calendar.current.dateComponents([.day], from: dueDate, to: Date()).day ?? 0
    }

    public var statusColor: String {
        switch status {
        case .draft: return "gray"
        case .pendingApproval: return "orange"
        case .approved: return "blue"
        case .pending: return isOverdue ? "red" : "purple"
        case .partiallyPaid: return "teal"
        case .paid: return "green"
        case .cancelled: return "red"
        case .disputed: return "darkred"
        }
    }

    public var formattedTotal: String {
        String(format: "$%.2f", total)
    }

    public var formattedAmountDue: String {
        String(format: "$%.2f", amountDue)
    }

    public var formattedAmountPaid: String {
        String(format: "$%.2f", amountPaid)
    }

    public var matchesPO: Bool {
        purchaseOrderId != nil
    }
}

// MARK: - Invoice Status
public enum InvoiceStatus: String, Codable, CaseIterable {
    case draft = "Draft"
    case pendingApproval = "Pending Approval"
    case approved = "Approved"
    case pending = "Pending Payment"
    case partiallyPaid = "Partially Paid"
    case paid = "Paid"
    case cancelled = "Cancelled"
    case disputed = "Disputed"

    public var displayName: String {
        rawValue
    }

    public var icon: String {
        switch self {
        case .draft: return "doc.text"
        case .pendingApproval: return "clock.fill"
        case .approved: return "checkmark.circle.fill"
        case .pending: return "hourglass"
        case .partiallyPaid: return "dollarsign.circle.fill"
        case .paid: return "checkmark.seal.fill"
        case .cancelled: return "xmark.circle.fill"
        case .disputed: return "exclamationmark.triangle.fill"
        }
    }
}

// MARK: - Payment Method
public enum PaymentMethod: String, Codable, CaseIterable {
    case check = "Check"
    case ach = "ACH"
    case wire = "Wire Transfer"
    case creditCard = "Credit Card"
    case cash = "Cash"
    case other = "Other"

    public var displayName: String {
        rawValue
    }

    public var icon: String {
        switch self {
        case .check: return "doc.text.fill"
        case .ach: return "building.columns.fill"
        case .wire: return "arrow.left.arrow.right"
        case .creditCard: return "creditcard.fill"
        case .cash: return "dollarsign.circle.fill"
        case .other: return "ellipsis.circle.fill"
        }
    }
}

// MARK: - Invoice Line Item
public struct InvoiceLineItem: Identifiable, Codable, Equatable {
    public let id: String
    public var description: String
    public var partNumber: String?
    public var quantity: Int
    public var unitPrice: Double
    public var totalPrice: Double
    public var poLineItemId: String?
    public var notes: String?

    public var formattedUnitPrice: String {
        String(format: "$%.2f", unitPrice)
    }

    public var formattedTotalPrice: String {
        String(format: "$%.2f", totalPrice)
    }
}

// MARK: - Invoice Payment
public struct InvoicePayment: Identifiable, Codable {
    public let id: String
    public let invoiceId: String
    public let invoiceNumber: String
    public var amount: Double
    public var paymentDate: Date
    public var paymentMethod: PaymentMethod
    public var reference: String?
    public var paidBy: String
    public var notes: String?

    public var formattedAmount: String {
        String(format: "$%.2f", amount)
    }
}

// MARK: - Invoice Matching
public struct InvoiceMatch: Codable {
    public let invoiceId: String
    public let poId: String
    public var matchedItems: [MatchedLineItem]
    public var discrepancies: [String]?
    public var matchPercentage: Double

    public var hasDiscrepancies: Bool {
        guard let discrepancies = discrepancies else { return false }
        return !discrepancies.isEmpty
    }
}

public struct MatchedLineItem: Codable, Identifiable {
    public let id: String
    public let invoiceItemId: String
    public let poItemId: String
    public var quantityMatch: Bool
    public var priceMatch: Bool
    public var notes: String?
}

// MARK: - Invoice Approval
public struct InvoiceApproval: Identifiable, Codable {
    public let id: String
    public let invoiceId: String
    public let approverName: String
    public let approverId: String
    public let action: ApprovalAction
    public let comments: String?
    public let timestamp: Date

    public enum ApprovalAction: String, Codable {
        case approved = "Approved"
        case rejected = "Rejected"
        case requestChanges = "Request Changes"
        case dispute = "Dispute"
    }
}

// MARK: - API Response Models
public struct InvoicesResponse: Codable {
    public let invoices: [Invoice]
    public let total: Int
    public let page: Int?
    public let limit: Int?
}

public struct InvoiceResponse: Codable {
    public let invoice: Invoice
}

public struct InvoicePaymentsResponse: Codable {
    public let payments: [InvoicePayment]
}

public struct InvoiceApprovalsResponse: Codable {
    public let approvals: [InvoiceApproval]
}
