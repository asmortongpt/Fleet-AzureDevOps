# Fleet Application - Financial Operations Module Documentation

**Document Version:** 1.0  
**Last Updated:** November 11, 2025  
**Status:** Comprehensive Analysis

---

## Executive Summary

The Fleet Application includes four integrated Financial Operations features that manage vendor relationships, procurement processes, invoice tracking, and employee reimbursement. These modules provide end-to-end financial process management with approval workflows, real-time tracking, and comprehensive reporting capabilities.

**Key Financial Modules:**
1. **Invoices.tsx** - Vendor invoice tracking and payment management
2. **PurchaseOrders.tsx** - Procurement process with approval workflow
3. **MileageReimbursement.tsx** - Employee mileage reimbursement requests
4. **VendorManagement.tsx** - Supplier relationship management

---

## 1. INVOICES & BILLING MODULE

### Feature Name and Description
**Invoices & Billing** - A comprehensive invoice management system for tracking vendor invoices, monitoring payment status, and managing accounts payable.

**File Location:** `/home/user/Fleet/src/components/modules/Invoices.tsx` (7,717 bytes)

### Target Users
- **Finance Managers:** Track and pay invoices, reconcile accounts
- **Accounts Payable Specialists:** Process and manage invoice payments
- **Department Managers:** Monitor spending by vendor and approval status
- **CFO/Finance Director:** Analyze financial trends and outstanding obligations

### User Stories

**Story 1: Finance Manager Invoice Tracking**
- As a Finance Manager, I want to view all vendor invoices with their current payment status, so that I can understand our accounts payable position and identify overdue payments.
- Acceptance Criteria:
  - View all invoices in a searchable table with invoice number, vendor, dates, and amounts
  - Filter invoices by status (draft, pending, paid, overdue, disputed, cancelled)
  - See at-a-glance metrics: Total Invoiced, Total Paid, Outstanding Balance
  - Highlight overdue invoices in red for immediate attention

**Story 2: Accounts Payable Processing**
- As an AP specialist, I want to record partial or full payments against invoices, so that I can keep accurate payment records and reconcile vendor statements.
- Acceptance Criteria:
  - Update amount paid and track remaining balance automatically
  - Record payment methods and dates
  - Update invoice status to "paid" when balance reaches zero
  - Maintain audit trail of all payment transactions

**Story 3: Dispute Management**
- As a Finance Manager, I want to mark invoices as disputed and track resolution, so that I can manage discrepancies with vendors.
- Acceptance Criteria:
  - Change invoice status to "disputed"
  - Add notes explaining the dispute reason
  - Track which invoices are in dispute
  - View dispute history for each invoice

**Story 4: Financial Reporting**
- As a CFO, I want to see summary metrics of invoicing, so that I can understand cash flow and payment obligations.
- Acceptance Criteria:
  - Dashboard shows Total Invoiced amount across all vendors
  - See Total Paid amount and payment trend
  - View Outstanding Balance and overdue count
  - Export data for financial analysis

### Key Workflows

#### Workflow 1: Standard Invoice Tracking
```
Step 1: Invoice Reception
  ├─ Vendor sends invoice (email, system submission)
  ├─ Invoice details captured: vendor name, invoice #, amount, due date
  └─ Status set to "pending"

Step 2: Invoice Entry
  ├─ Finance staff enters invoice into system
  ├─ System validates invoice number uniqueness
  ├─ Links invoice to Purchase Order if applicable
  └─ Status: "pending"

Step 3: Invoice Approval (Optional)
  ├─ System checks if amount matches PO
  ├─ If discrepancy, mark as "disputed"
  └─ If match, status ready for payment

Step 4: Payment Processing
  ├─ Select payment method
  ├─ Record payment amount (partial or full)
  ├─ Update amountPaid field
  ├─ Calculate remaining balance
  └─ If balance = 0, status = "paid"

Step 5: Reconciliation
  ├─ Verify payment cleared with vendor
  ├─ Update payment date
  ├─ Final status: "paid"
  └─ Close invoice record
```

#### Workflow 2: Overdue Invoice Management
```
Step 1: Due Date Monitoring (Automated)
  ├─ System compares current date with dueDate
  ├─ If current date > dueDate AND status ≠ "paid"
  └─ Status changes to "overdue"

Step 2: Notification (Alert)
  ├─ Highlight overdue invoices in red
  ├─ Show overdue count on dashboard
  └─ Send notification to Finance Manager

Step 3: Follow-up Action
  ├─ Contact vendor for payment negotiation
  ├─ Document communication
  └─ Update status to "disputed" if needed

Step 4: Payment or Resolution
  ├─ Process payment immediately, OR
  ├─ Resolve dispute with vendor, OR
  ├─ Extend due date if agreed
  └─ Update status accordingly
```

#### Workflow 3: Search and Filter
```
Step 1: User Initiates Search
  ├─ Enters search term in search box
  └─ System searches invoiceNumber and vendorName

Step 2: Real-time Filtering
  ├─ Searches as user types (debounced)
  ├─ Filters by status (all, draft, pending, paid, etc.)
  └─ Results update dynamically

Step 3: Results Display
  ├─ Shows matching invoices in table
  ├─ Maintains all formatting (colors, badges)
  └─ Shows record count of filtered results
```

### Core Functionality and Features

#### 1. Invoice Dashboard (KPI Cards)
- **Total Invoiced:** Sum of all invoice totals
- **Total Paid:** Sum of all amountPaid values
- **Outstanding:** Sum of balance (total - amountPaid)
- **Overdue Count:** Number of invoices past due date without "paid" status

#### 2. Invoice Table Display
| Column | Description | Data Type | Notes |
|--------|-------------|-----------|-------|
| Invoice # | Unique invoice identifier | String (mono font) | Links to vendor |
| Vendor | Vendor name | String | Searchable |
| Date | Invoice date | ISO Date | Formatted display |
| Due Date | Payment due date | ISO Date | Red if overdue |
| Total | Invoice amount | Currency | Bold display |
| Paid | Amount paid to date | Currency | Green text |
| Balance | Remaining amount | Currency | Yellow if > 0 |
| Status | Current status | Badge | Color-coded |
| Actions | View details | Button | Opens detail view |

#### 3. Invoice Status Management
```javascript
Status Options:
├─ draft: Invoice not yet submitted (gray)
├─ pending: Awaiting payment (yellow)
├─ paid: Fully paid (green)
├─ overdue: Past due date, unpaid (red)
├─ disputed: Amount or details in question (orange)
└─ cancelled: Voided or rejected (gray)
```

#### 4. Search and Filter
- **Search Fields:** invoiceNumber, vendorName
- **Filter Field:** status (dropdown)
- **Case-Insensitive:** Yes
- **Real-time:** Yes

### Data Inputs and Outputs

#### Inputs
```typescript
Invoice Data Structure:
{
  id: string                    // System-generated UUID
  invoiceNumber: string         // e.g., "INV-2025-001234"
  vendorId: string             // Link to Vendor entity
  vendorName: string           // Vendor display name
  poId?: string                // Link to Purchase Order (optional)
  date: string                 // ISO date string (YYYY-MM-DD)
  dueDate: string              // ISO date string (YYYY-MM-DD)
  status: string               // One of status enum
  items: InvoiceItem[]         // Line item details
  subtotal: number             // Pre-tax total
  tax: number                  // Tax amount
  total: number                // subtotal + tax
  amountPaid: number           // Payment received to date
  balance: number              // total - amountPaid
  paymentMethod?: string       // How payment was made
  paidDate?: string            // When payment received
  notes?: string               // Additional context
  attachments?: string[]       // Document references
}

InvoiceItem Structure:
{
  id: string
  description: string          // Line item description
  quantity: number
  unitPrice: number
  total: number               // quantity × unitPrice
}
```

#### Outputs
1. **Invoice List View** - Filtered/searched invoices table
2. **Dashboard Metrics** - Summary statistics
3. **Report Data** - For export/analysis
4. **Audit Trail** - Payment history for compliance

### Integration Points with Other Systems

#### 1. Purchase Orders Integration
```
Connection Type: One-to-Many (PO → Invoices)
├─ Field: poId references PurchaseOrder.id
├─ Workflow:
│  ├─ PO created with expected cost
│  ├─ Vendor sends invoice matching PO
│  ├─ Invoice linked to PO via poId
│  ├─ Amount validation (invoice vs. PO total)
│  └─ On full payment, PO marked as "received"
└─ Benefits: Ensures invoices match orders
```

#### 2. Vendor Management Integration
```
Connection Type: Many-to-One (Invoices → Vendor)
├─ Field: vendorId references Vendor.id
├─ Data Sync:
│  ├─ Vendor name pulled from Vendor record
│  ├─ Total spend calculated from invoice totals
│  ├─ Invoice count tracked per vendor
│  └─ Payment terms referenced for due date calculation
└─ Benefits: Centralized vendor info, spend tracking
```

#### 3. Financial Reporting System
```
Connection Type: Data Source
├─ Uses: Invoice totals, payment status, dates
├─ Outputs:
│  ├─ Accounts Payable aging report
│  ├─ Vendor spending analysis
│  ├─ Cash flow projections
│  └─ Budget vs. actual tracking
└─ Frequency: Real-time available, monthly reports
```

#### 4. Work Order / Maintenance Integration
```
Connection Type: Reference (Optional)
├─ Some invoices relate to WorkOrder completions
├─ Links invoice to related maintenance work
└─ Helps correlate costs with specific fleet maintenance
```

---

## 2. PURCHASE ORDERS MODULE

### Feature Name and Description
**Purchase Orders** - A procurement management system with approval workflows, item tracking, delivery monitoring, and vendor communication.

**File Location:** `/home/user/Fleet/src/components/modules/PurchaseOrders.tsx` (25,693 bytes)

### Target Users
- **Procurement Manager:** Create and manage purchase orders
- **Department Managers:** Request parts and services
- **Approvers:** Review and approve POs within budget authority
- **Vendor Coordinators:** Communicate delivery status with vendors
- **Receiving/Inventory:** Record receipt of goods
- **Finance:** Track procurement spending

### User Stories

**Story 1: Parts Procurement Request**
- As a Fleet Manager, I want to create a purchase order for replacement parts from a vendor, so that I can ensure timely delivery and track costs.
- Acceptance Criteria:
  - Select vendor from existing vendor list or add new vendor
  - Add multiple line items with part number, description, quantity, and unit price
  - System calculates total cost automatically
  - Set expected delivery date (default: 7 days from today)
  - Specify shipping address
  - Add special instructions or notes
  - Submit for approval

**Story 2: Approval Workflow**
- As an Approval Manager, I want to review pending purchase orders and approve/reject them, so that I can control spending and ensure quality standards.
- Acceptance Criteria:
  - View all pending approval orders in a dedicated view
  - See requester name and department
  - Review order details including items and total cost
  - Approve order (status changes to "approved")
  - Reject order with documented reason
  - Rejection reason is appended to order notes
  - Approver name recorded on approval

**Story 3: Order Status Tracking**
- As a Procurement Coordinator, I want to track the status of orders from approval through delivery, so that I can follow up with vendors and ensure on-time delivery.
- Acceptance Criteria:
  - Track status transitions: pending-approval → approved → ordered → received
  - Update status when order is placed with vendor
  - Record actual delivery date
  - Compare expected vs. actual delivery
  - Alert if delivery is late
  - Final status shows "received" with completion date

**Story 4: Vendor Order Management**
- As a Vendor Contact, I want to see my company's open orders and delivery schedules, so that I can plan production and delivery efficiently.
- Acceptance Criteria:
  - View all active orders with expected delivery dates
  - See detailed item specifications
  - Track order history and volume patterns
  - Communicate delivery status changes
  - Receive order notifications

### Key Workflows

#### Workflow 1: Complete Purchase Order Lifecycle
```
Step 1: Purchase Order Creation
  ├─ User clicks "Create Purchase Order" button
  ├─ Opens create dialog with form
  ├─ Required fields:
  │  ├─ Vendor Name (required)
  │  ├─ Expected Delivery Date (default: +7 days)
  │  ├─ Items (at least 1)
  │  ├─ Shipping Address (required)
  │  └─ Notes (optional)
  ├─ For each item:
  │  ├─ Description (required)
  │  ├─ Part Number (optional)
  │  ├─ Quantity (required, ≥ 1)
  │  └─ Unit Price (required)
  ├─ System validates: vendor name + at least 1 item
  └─ Status: "pending-approval"

Step 2: Purchase Order Assignment
  ├─ Auto-populated fields:
  │  ├─ poNumber: PO-{last6 of timestamp}
  │  ├─ id: po-{timestamp}
  │  ├─ date: current date
  │  ├─ requestedBy: "Current User"
  │  ├─ department: "Fleet Maintenance"
  │  └─ status: "pending-approval"
  └─ Total calculated: sum of (quantity × unitPrice)

Step 3: Approval Phase
  ├─ PO appears in approver's pending queue
  ├─ Approver opens PO details
  ├─ Options:
  │  ├─ APPROVE:
  │  │  ├─ Status changes to "approved"
  │  │  ├─ approvedBy field set to approver name
  │  │  ├─ approvedDate recorded
  │  │  └─ Next step: "Place Order"
  │  └─ REJECT:
  │     ├─ Dialog prompts for rejection reason
  │     ├─ Reason appended to order notes
  │     ├─ Status changes to "cancelled"
  │     └─ Requestor notified
  └─ Toast notification confirms action

Step 4: Order Placement with Vendor
  ├─ After approval, order can be "placed"
  ├─ Procurement team sends order details to vendor
  ├─ Status changes to "ordered"
  ├─ Vendor receives order details via:
  │  ├─ Email with order summary
  │  ├─ System notification (if vendor has login)
  │  └─ Phone/direct contact
  └─ Expected delivery date communicated

Step 5: Delivery Tracking
  ├─ Vendor provides delivery estimate
  ├─ Order status remains "ordered"
  ├─ System monitors delivery date
  ├─ If delivery late:
  │  ├─ Status may change to "overdue" (if implemented)
  │  └─ Alert generated
  └─ Receiving confirms arrival

Step 6: Goods Receipt
  ├─ Receiving team inspects delivery
  ├─ Confirms items match order
  ├─ Records actual delivery date
  ├─ Updates quantity received
  ├─ Status changes to "received"
  ├─ receivedBy field recorded
  ├─ receivedDate field recorded
  └─ Inventory updated with new stock

Step 7: Closure & Invoice
  ├─ Final status: "received"
  ├─ Creates matching invoice from vendor
  ├─ PO linked to invoice (poId)
  ├─ Accounting reconciles PO cost vs. invoice
  └─ Order closed
```

#### Workflow 2: Item Management
```
Step 1: Add Item to PO
  ├─ User clicks "Add Item" button
  ├─ New empty item row added
  ├─ Item has fields:
  │  ├─ Description (text input)
  │  ├─ Part Number (text input)
  │  ├─ Quantity (number, min=1)
  │  └─ Unit Price (number, decimal)
  └─ Line total calculated: Qty × UnitPrice

Step 2: Item Validation
  ├─ Description required for item inclusion in order
  ├─ Empty items filtered before submission
  ├─ Quantity must be > 0
  ├─ Unit Price can be 0 (for estimates)
  └─ Line totals must be numeric

Step 3: Item Modification
  ├─ User can edit any field in-place
  ├─ Total recalculates automatically
  ├─ Grand total updates in real-time
  └─ Visual feedback: line highlights on edit

Step 4: Item Removal
  ├─ User clicks trash icon
  ├─ Item deleted from list
  ├─ Minimum 1 item required (delete disabled if last item)
  └─ Grand total updates immediately
```

#### Workflow 3: Search and Filter
```
Step 1: PO Search
  ├─ User types in search field
  ├─ Searches: poNumber, vendorName
  ├─ Case-insensitive matching
  └─ Real-time results update

Step 2: Status Filtering
  ├─ User selects status from dropdown
  ├─ Options: all, draft, pending-approval, approved, ordered, received, cancelled
  ├─ Results filtered immediately
  └─ Combines with search (AND logic)

Step 3: Results Display
  ├─ Shows filtered POs in table
  ├─ Maintains all formatting
  └─ Updates count in header
```

### Core Functionality and Features

#### 1. Purchase Order Dashboard (KPI Cards)
```
Card 1: Total Orders
├─ Metric: Count of all POs
├─ Icon: ShoppingCart
└─ Period: All time

Card 2: Total Spend
├─ Metric: Sum of all PO totals
├─ Display: Currency format with commas
├─ Icon: TrendUp (green)
└─ Period: Cumulative

Card 3: Pending Approval
├─ Metric: Count of status="pending-approval"
├─ Display: Yellow highlight
├─ Icon: Package
├─ Alert: "Awaiting review"
└─ Action: Direct link to review

Card 4: Active Orders
├─ Metric: Count of status in ["approved", "ordered"]
├─ Display: Blue highlight
├─ Icon: ShoppingCart
├─ Note: "In progress"
└─ Detail: Excludes draft and cancelled
```

#### 2. Purchase Order Table
| Column | Description | Sortable | Filterable |
|--------|-------------|----------|-----------|
| PO Number | Unique identifier (PO-XXXXXX) | Yes | Yes |
| Vendor | Vendor name | Yes | Yes |
| Date | Order creation date | Yes | No |
| Expected Delivery | Promised delivery date | Yes | No |
| Items | Number of line items | No | No |
| Total | Order total amount | Yes | No |
| Status | Current status badge | No | Yes |
| Actions | View Details button | No | No |

#### 3. Status Color Coding
```javascript
Status Colors:
├─ draft: "bg-gray-100 text-gray-700"
├─ pending-approval: "bg-yellow-100 text-yellow-700"
├─ approved: "bg-blue-100 text-blue-700"
├─ ordered: "bg-purple-100 text-purple-700"
├─ received: "bg-green-100 text-green-700"
└─ cancelled: "bg-red-100 text-red-700"
```

#### 4. Purchase Order Details View
When user clicks "View Details":
- Full order information displayed in modal
- Two-column layout with order info and dates
- Items table with part numbers and line totals
- Requestor information section
- Notes display (read-only in detail view)
- Shipping address display
- Action buttons context-sensitive:
  - If pending-approval: [Reject] [Approve Order]
  - If approved: [Place Order]
  - If other status: [Close] button only

#### 5. Rejection Workflow
- Dialog prompts for rejection reason
- Reason text required (non-empty)
- Reason appended to order notes with timestamp
- Status set to "cancelled"
- User notification sent
- Cannot be re-approved (must create new PO)

### Data Inputs and Outputs

#### Inputs
```typescript
PurchaseOrder Data Structure:
{
  id: string                    // System-generated: po-{timestamp}
  poNumber: string              // Human-readable: PO-{last 6 digits of timestamp}
  vendorId?: string             // Link to Vendor entity (optional)
  vendorName: string            // Required for order placement
  date: string                  // Order creation date (ISO)
  expectedDelivery: string      // Promise date (ISO)
  deliveryDate?: string         // Actual delivery date (set on receipt)
  status: string                // Enum: draft|pending-approval|approved|ordered|received|cancelled
  items: PurchaseOrderItem[]    // Array of line items
  subtotal?: number             // Pre-tax total (calculated)
  tax?: number                  // Tax amount (optional)
  shipping?: number             // Shipping cost (optional)
  total: number                 // Full order total
  notes?: string                // Internal comments/instructions
  shippingAddress: string       // Delivery location
  requestedBy: string           // Person who created PO
  department?: string           // Department charging order
  approvedBy?: string           // Manager who approved
  approvedDate?: string         // Approval timestamp (ISO)
  receivedBy?: string           // Person who received goods
  receivedDate?: string         // Receipt date (ISO)
  attachments?: string[]        // Document references
}

PurchaseOrderItem Structure:
{
  description: string           // Item description (required)
  partNumber: string            // Supplier part number (optional)
  quantity: number              // Order quantity (required, > 0)
  unitPrice: number             // Price per unit (required)
}
```

#### Outputs
1. **PO List** - Searchable/filterable table of all orders
2. **PO Details** - Complete order information view
3. **Approval Queue** - List of pending-approval items
4. **Vendor Communication** - Order summary for vendor
5. **Invoice Matching** - PO data linked to invoice

### Integration Points with Other Systems

#### 1. Vendor Management Integration
```
Relationship: Many-to-One (PO → Vendor)
├─ Field: vendorName references Vendor.name
├─ Data Flow:
│  ├─ Create PO form suggests existing vendors
│  ├─ Vendor contact info retrieved for communication
│  ├─ PO total accumulates to Vendor.totalSpend
│  ├─ Invoice count incremented on vendor
│  └─ PO tracked in Vendor.lastOrderDate
└─ Bidirectional: Vendor can view their POs
```

#### 2. Inventory Management Integration
```
Relationship: Creates inventory transactions
├─ When PO status = "received":
│  ├─ For each item: create InventoryTransaction
│  ├─ Type: "purchase"
│  ├─ Quantity: received amount
│  ├─ Cost: line item total / quantity = unit cost
│  └─ Update part stock levels
└─ Enables: Part availability tracking
```

#### 3. Invoice Management Integration
```
Relationship: One-to-One (PO → Invoice)
├─ Field: Invoice.poId references PurchaseOrder.id
├─ Workflow:
│  ├─ After PO received and goods delivered
│  ├─ Vendor sends invoice with PO reference
│  ├─ Accounting matches invoice to PO
│  ├─ Amount validation (no invoice line-item variance)
│  └─ Invoice linked to PO for reconciliation
└─ Benefits: Three-way matching (PO-Receipt-Invoice)
```

#### 4. Budget Tracking Integration
```
Relationship: Data source for budget management
├─ Uses: PO.total from all orders
├─ Calculations:
│  ├─ Department spending by status
│  ├─ Committed spend (approved + ordered)
│  ├─ Actual spend (received items)
│  └─ Budget vs. actual analysis
└─ Frequency: Real-time updates
```

#### 5. Approval Workflow Engine
```
Relationship: Uses enterprise approval rules
├─ PO.total triggers approval level:
│  ├─ < $1,000: Supervisor approval
│  ├─ $1,000-$5,000: Manager approval
│  ├─ $5,000-$25,000: Director approval
│  └─ > $25,000: VP/Executive approval
├─ Notification: Route to appropriate approver queue
└─ Audit: All approval decisions logged
```

---

## 3. MILEAGE REIMBURSEMENT MODULE

### Feature Name and Description
**Mileage Reimbursement** - An employee reimbursement system for tracking business mileage and processing reimbursement requests based on IRS standard rates.

**File Location:** `/home/user/Fleet/src/components/modules/MileageReimbursement.tsx` (14,150 bytes)

### Target Users
- **Employees/Drivers:** Submit mileage reimbursement requests
- **Finance/HR Managers:** Approve reimbursement requests
- **Finance Administrator:** Process approved reimbursements for payment
- **Payroll Specialist:** Integrate reimbursements into payroll
- **CFO:** Track employee reimbursement expenses

### User Stories

**Story 1: Mileage Submission**
- As an Employee, I want to submit a mileage reimbursement request for business travel, so that I can be compensated for using my personal vehicle.
- Acceptance Criteria:
  - Fill form with employee name, trip date, start/end locations
  - Enter number of miles traveled
  - Specify trip purpose (business context)
  - Select vehicle type used
  - System calculates reimbursement automatically (miles × IRS rate)
  - Submit request with status "submitted"
  - Receive confirmation notification

**Story 2: Reimbursement Approval**
- As a Manager, I want to review and approve mileage reimbursement requests from my team, so that employees are compensated promptly and appropriately.
- Acceptance Criteria:
  - See pending reimbursement requests in a queue
  - Review request details (employee, trip, mileage, amount)
  - Approve or reject request with one click
  - Request status changes to "approved" or "rejected"
  - Approver name and date recorded on request
  - Employee notification sent of decision

**Story 3: Payment Processing**
- As a Finance Administrator, I want to process approved reimbursements for payment, so that employees receive compensation promptly.
- Acceptance Criteria:
  - View all approved but unpaid reimbursements
  - Mark request as "paid" when payment sent
  - Record payment date and method
  - Create accounting entry for reimbursement expense
  - Summary shows total paid in current period

**Story 4: Expense Reporting**
- As a CFO, I want to see mileage reimbursement trends and totals, so that I can forecast personnel expense budgets.
- Acceptance Criteria:
  - Dashboard shows submitted, approved, and paid totals
  - Current IRS rate displayed (updated annually)
  - Count of requests in each status
  - Identify top requestors and frequent routes (for cost optimization)
  - Export data for financial analysis

### Key Workflows

#### Workflow 1: Complete Reimbursement Request Lifecycle
```
Step 1: Employee Initiates Request
  ├─ Clicks "New Request" button
  ├─ Form appears inline in card
  ├─ Enters required information:
  │  ├─ Employee Name (required)
  │  ├─ Trip Date (required, past date)
  │  ├─ Start Location (required)
  │  ├─ End Location (required)
  │  ├─ Miles Traveled (required, number)
  │  ├─ Vehicle Type (required, dropdown)
  │  │  ├─ Sedan
  │  │  ├─ SUV
  │  │  ├─ Truck
  │  │  ├─ Van
  │  │  └─ Personal Vehicle
  │  └─ Trip Purpose (required, text area)
  ├─ System validates all required fields present
  └─ Auto-calculates estimated reimbursement

Step 2: Calculation & Preview
  ├─ Formula: Miles × REIMBURSEMENT_RATE
  ├─ REIMBURSEMENT_RATE = 0.655 (IRS standard)
  ├─ Example: 100 miles × $0.655 = $65.50
  ├─ Displayed in preview section
  ├─ User can review before submission
  └─ Format: Currency with 2 decimals

Step 3: Submission
  ├─ User clicks "Submit Request"
  ├─ System validates:
  │  ├─ All required fields present
  │  ├─ Miles is positive number
  │  ├─ Trip Date is valid
  │  └─ Locations specified
  ├─ Creates MileageReimbursement record
  ├─ Auto-generated fields:
  │  ├─ id: mr-{timestamp}
  │  ├─ employeeId: EMP{random 1-10000}
  │  ├─ submittedDate: today's date (ISO)
  │  ├─ status: "submitted"
  │  └─ amount: miles × rate (rounded to cents)
  ├─ Toast notification: "Reimbursement request submitted"
  └─ Form reset for next entry

Step 4: Manager Review
  ├─ Request appears in manager's approval queue
  ├─ Status: "submitted" (orange/warning badge)
  ├─ Manager views request details:
  │  ├─ Employee name and ID
  │  ├─ Trip details (date, locations, purpose)
  │  ├─ Mileage and calculated amount
  │  └─ Vehicle type
  ├─ Manager can:
  │  ├─ APPROVE: Click "Approve" button
  │  │  ├─ Status → "approved"
  │  │  ├─ approvedDate → today
  │  │  └─ approvalManger → manager name
  │  └─ REJECT: Click "Reject" button
  │     ├─ Status → "rejected"
  │     └─ Employee notified of rejection
  └─ Toast confirms action

Step 5: Finance Processing
  ├─ Finance team views approved requests
  ├─ Status: "approved" (green/success badge)
  ├─ Verifies amount is correct
  ├─ Creates payment record
  ├─ Clicks "Mark Paid" button
  ├─ Status → "paid"
  ├─ Employee notified of payment
  └─ Request removed from active queue

Step 6: Closure & Accounting
  ├─ Reimbursement fully processed
  ├─ Status: "paid"
  ├─ Accounting entry created:
  │  ├─ Debit: Mileage Reimbursement Expense
  │  ├─ Credit: Cash/Payables
  │  └─ Amount: Total mileage reimbursement
  ├─ Included in employee's pay period
  └─ Historical record maintained
```

#### Workflow 2: Status Transitions
```
Possible Transitions:
├─ DRAFT → SUBMITTED (initial submission)
├─ SUBMITTED → APPROVED (manager approval)
├─ SUBMITTED → REJECTED (manager rejection)
├─ APPROVED → PAID (finance processes)
└─ REJECTED → (terminal state, cannot revert)

Status Colors:
├─ draft: Gray (internal use only)
├─ submitted: Orange/Warning (pending approval)
├─ approved: Green/Success (ready to pay)
├─ rejected: Red/Destructive (action required)
└─ paid: Blue/Accent (completed)
```

#### Workflow 3: Real-time Calculation
```
Step 1: Miles Entry
  ├─ User enters miles in input field
  ├─ OnChange event triggers calculation
  └─ Preview updates immediately

Step 2: Amount Calculation
  ├─ Parse miles as float
  ├─ Multiply by REIMBURSEMENT_RATE (0.655)
  ├─ Result: exact decimal (e.g., 65.5)
  └─ Format: $XX.XX (always 2 decimals)

Step 3: Display
  ├─ Show in preview box: "Estimated Reimbursement: $XX.XX"
  ├─ Large font, metric-number class
  ├─ Updates as user types
  └─ Visible until miles value entered

Step 4: Final Rounding
  ├─ On submit: Math.round(amount * 100) / 100
  ├─ Ensures exactly 2 decimal places
  └─ Examples:
      65.5 → $65.50
      99.9999 → $100.00
      0.655 → $0.66 (rounds up)
```

### Core Functionality and Features

#### 1. Reimbursement Dashboard (KPI Cards)
```
Card 1: Submitted Requests
├─ Metric: Count of status="submitted"
├─ Total: Sum of amounts for submitted requests
├─ Display: Currency format
├─ Icon: Clock (pending)
├─ Color: Warning/Orange
└─ Action: Links to submitted list

Card 2: Approved Requests
├─ Metric: Count of status="approved"
├─ Total: Sum of amounts for approved requests
├─ Display: Currency format
├─ Icon: CheckCircle (success)
├─ Color: Success/Green
└─ Action: Links to approved list

Card 3: Paid Requests
├─ Metric: Count of status="paid"
├─ Total: Sum of amounts for paid requests
├─ Display: Currency format
├─ Icon: CurrencyDollar (completed)
├─ Color: Accent
└─ Action: Links to paid list

Card 4: Standard Rate
├─ Display: IRS Standard Mileage Rate
├─ Value: $0.655/mile
├─ Icon: Receipt
├─ Note: "IRS standard rate"
└─ Updated: Annually (maintained in constant)
```

#### 2. Reimbursement Request Form
Form appears in Card when "New Request" clicked:
```
Fields (2-column layout on larger screens):
├─ Column 1:
│  ├─ Employee Name (text input, required)
│  ├─ Trip Date (date picker, required)
│  └─ Start Location (text input, required)
├─ Column 2:
│  ├─ Vehicle Type (dropdown, required)
│  │  └─ Options: Sedan, SUV, Truck, Van, Personal Vehicle
│  ├─ Miles Traveled (number input, required)
│  └─ End Location (text input, required)
└─ Full width:
   ├─ Trip Purpose (textarea, required)
   │  └─ Placeholder: "Describe the business purpose of this trip"
   └─ [Submit Request] [Cancel] buttons
```

#### 3. Request List Display
After submission, requests shown as cards in list:
```
Card Layout for Each Request:
├─ Left: Vehicle icon + Badge
├─ Center: 
│  ├─ Employee Name (bold)
│  ├─ Meta line:
│  │  ├─ Calendar: Trip Date
│  │  ├─ MapPin: Mileage amount
│  │  └─ Car: Vehicle Type
│  └─ Route: Start Location → End Location
├─ Right:
│  ├─ Reimbursement Amount ($XXX.XX, large)
│  ├─ Status Badge (colored)
│  └─ Action buttons (context-sensitive)
      ├─ If submitted: [Approve] [Reject]
      ├─ If approved: [Mark Paid]
      └─ If rejected/paid: (no actions)
```

### Data Inputs and Outputs

#### Inputs
```typescript
MileageReimbursement Data Structure:
{
  id: string                    // System-generated: mr-{timestamp}
  employeeId: string            // Employee identifier
  employeeName: string          // Full name of employee (required)
  vehicleType: string           // Type of vehicle used (required)
                                // Options: sedan|suv|truck|van|personal
  tripDate: string              // Date of trip (ISO format, required)
  startLocation: string         // Trip origin (required)
  endLocation: string           // Trip destination (required)
  miles: number                 // Miles traveled (required, > 0)
  purpose: string               // Business purpose (required)
  rate: number                  // Reimbursement rate (default: 0.655)
  amount: number                // Calculated: miles × rate
  status: string                // Enum: draft|submitted|approved|rejected|paid
  submittedDate: string         // ISO date of submission
  approvedBy?: string           // Manager who approved (optional)
  approvedDate?: string         // Date of approval (ISO, optional)
  paidDate?: string             // Date payment processed (optional)
}
```

#### Outputs
1. **Request List** - All submitted reimbursement requests
2. **Approval Queue** - Requests pending manager approval
3. **Payment Queue** - Requests ready for payment
4. **Summary Report** - Dashboard metrics
5. **Payroll Integration** - Paid reimbursements for payroll processing

### Integration Points with Other Systems

#### 1. Employee/Driver Integration
```
Relationship: Many-to-One (Requests → Employee)
├─ Field: employeeId, employeeName
├─ Data Sync:
│  ├─ Employee name auto-populated if logged in
│  ├─ Employee ID linked to Driver or Staff record
│  ├─ Department derived from employee record
│  └─ Manager identity verified for approval
└─ Benefits: Accurate employee tracking
```

#### 2. Payroll System Integration
```
Relationship: Feeding into payroll processing
├─ When: status = "paid"
├─ Data sent to payroll:
│  ├─ employeeId
│  ├─ amount (reimbursement to be paid)
│  ├─ paidDate
│  └─ transaction reference
├─ Payroll processing:
│  ├─ Added to employee's pay period
│  ├─ Non-taxable reimbursement
│  └─ Shown on pay stub as separate line item
└─ Reconciliation: Audit trail maintained
```

#### 3. Expense Management Integration
```
Relationship: Tracks employee out-of-pocket costs
├─ Type: Mileage-based expense reimbursement
├─ Accounting:
│  ├─ Debit: Mileage Reimbursement Expense
│  ├─ Credit: Employee Reimbursement Payable/Cash
│  └─ Frequency: As paid
├─ Reporting:
│  ├─ Employee mileage expense report
│  ├─ Department mileage allocation
│  └─ Year-to-date by employee
└─ Compliance: Maintains IRS documentation
```

#### 4. Budget/Cost Tracking
```
Relationship: Monitors personnel expenses
├─ Uses: Total mileage reimbursement amounts
├─ Analytics:
│  ├─ Monthly spending trend
│  ├─ Cost per mile by vehicle type
│  ├─ Highest requestors
│  └─ Department allocation
└─ Forecasting: Project annual mileage expense
```

#### 5. Audit & Compliance
```
Relationship: Maintains compliance records
├─ Fields tracked:
│  ├─ IRS rate used (0.655)
│  ├─ Trip purpose (business validation)
│  ├─ All approval/rejection dates
│  └─ Employee and approver identities
├─ Reporting: Audit trail for tax purposes
└─ Retention: Historical records (7+ years)
```

---

## 4. VENDOR MANAGEMENT MODULE

### Feature Name and Description
**Vendor Management** - A comprehensive supplier relationship management system for onboarding, evaluating, and maintaining relationships with parts suppliers, service providers, fuel stations, and other vendors.

**File Location:** `/home/user/Fleet/src/components/modules/VendorManagement.tsx` (23,605 bytes)

### Target Users
- **Procurement Manager:** Onboard and manage vendors
- **Fleet Manager:** Track vendor performance and spending
- **Finance/Accounts Payable:** Process vendor payments
- **Department Heads:** Rate vendor performance
- **Executives:** Analyze vendor relationships and costs
- **Vendor Contacts:** View their company information and orders

### User Stories

**Story 1: Vendor Onboarding**
- As a Procurement Manager, I want to add a new vendor to the system, so that I can begin ordering parts or services from them.
- Acceptance Criteria:
  - Create vendor record with required information (name, type, contact, email, phone)
  - Specify vendor type (parts supplier, service provider, fuel, insurance, etc.)
  - Record payment terms (Net 30, Net 60, etc.)
  - Store tax ID for accounting purposes
  - Specify services provided or certifications
  - Set initial status to "active"
  - System generates unique vendor ID

**Story 2: Vendor Performance Tracking**
- As a Fleet Manager, I want to rate vendors and track their performance metrics, so that I can identify reliable partners and those needing replacement.
- Acceptance Criteria:
  - Assign vendor rating (1-5 stars)
  - Track total spend amount
  - Count number of invoices/orders processed
  - Monitor on-time delivery percentage
  - See quality score and response time metrics
  - Generate performance report by vendor

**Story 3: Vendor Communication**
- As a Procurement Coordinator, I want quick access to vendor contact information, so that I can reach out regarding orders and issues.
- Acceptance Criteria:
  - View vendor contact person name
  - See email and phone in vendor details
  - One-click email button (opens email client)
  - One-click phone button (initiates call)
  - Maintain communication history
  - Track follow-up dates

**Story 4: Vendor Search and Filtering**
- As a Finance Manager, I want to search and filter vendors by type and name, so that I can find specific suppliers quickly.
- Acceptance Criteria:
  - Search by vendor name or contact person
  - Filter by vendor type (parts, service, fuel, etc.)
  - Real-time search results update
  - View count of filtered vendors
  - Multi-vendor selection (for bulk actions)

### Key Workflows

#### Workflow 1: Vendor Onboarding
```
Step 1: Initiate Vendor Addition
  ├─ Click "Add Vendor" button
  ├─ Dialog opens with form
  ├─ Required fields marked with asterisk (*)
  └─ Form sections:
     ├─ Basic Information
     ├─ Contact Information
     ├─ Address Information
     ├─ Payment Terms & Tax
     └─ Certifications (optional)

Step 2: Basic Information Entry
  ├─ Vendor Name (required)
  │  └─ Example: "Acme Auto Parts"
  ├─ Type (required, dropdown)
  │  ├─ Parts Supplier
  │  ├─ Service Provider
  │  ├─ Fuel Station
  │  ├─ Insurance
  │  ├─ Leasing Company
  │  ├─ Towing Service
  │  └─ Other
  └─ Contact Person Name (required)
     └─ Example: "John Smith"

Step 3: Contact Information Entry
  ├─ Email (required, validated)
  │  └─ Format check: valid email syntax
  ├─ Phone (required)
  │  └─ Format: (555) 123-4567
  └─ Website (optional)
     └─ Format: https://vendor.com

Step 4: Address Information
  ├─ Address (optional, textarea)
  │  └─ Allows multi-line address entry
  └─ Used for: mailing, shipping, location reference

Step 5: Financial & Legal Details
  ├─ Payment Terms (dropdown)
  │  ├─ Due on Receipt
  │  ├─ Net 15
  │  ├─ Net 30 (default)
  │  ├─ Net 60
  │  └─ Net 90
  └─ Tax ID (optional)
     └─ Format: XX-XXXXXXX (EIN format in US)

Step 6: Validation & Submission
  ├─ System validates:
  │  ├─ Name: not empty
  │  ├─ Type: selected
  │  ├─ Contact Person: not empty
  │  ├─ Email: valid format
  │  └─ Phone: not empty
  ├─ If validation fails:
  │  └─ Toast error: "Please fill in required fields"
  ├─ On success:
  │  ├─ Create Vendor record
  │  ├─ Auto-generated fields:
  │  │  ├─ id: vendor-{timestamp}
  │  │  ├─ tenantId: "default-tenant"
  │  │  ├─ rating: 0 (initially unrated)
  │  │  ├─ status: "active"
  │  │  ├─ totalSpend: 0
  │  │  └─ invoiceCount: 0
  │  ├─ Add to vendor list
  │  ├─ Dialog closes
  │  ├─ Toast: "Vendor added successfully"
  │  └─ Form resets
```

#### Workflow 2: Vendor Information Management
```
Step 1: View Vendor Details
  ├─ From vendor list, click "View Details"
  ├─ Details dialog opens (max-width: 768px)
  ├─ Displays all vendor information
  └─ Read-only view (no edit in current version)

Step 2: Vendor Details Display (6 sections)
  ├─ Section 1: Basic Information
  │  ├─ Vendor Name
  │  ├─ Type (with color badge)
  │  └─ Status (with color badge)
  ├─ Section 2: Contact Information
  │  ├─ Contact Person
  │  ├─ Email (with email button)
  │  ├─ Phone (with call button)
  │  └─ Website (if exists, clickable link)
  ├─ Section 3: Address
  │  ├─ MapPin icon
  │  └─ Full address text
  ├─ Section 4: Financial Information
  │  ├─ Payment Terms
  │  ├─ Tax ID
  │  ├─ Total Spend ($)
  │  └─ Invoice Count
  ├─ Section 5: Performance
  │  ├─ Star rating (1-5 with filled stars)
  │  └─ Performance metrics (if available)
  └─ Section 6: Services & Certifications
     ├─ Services Provided (badges)
     └─ Certifications (badges, if any)

Step 3: Contact Actions
  ├─ Email button: Initiates mailto:{email}
  ├─ Phone button: Initiates tel:{phone}
  └─ Website link: Opens in new tab
```

#### Workflow 3: Vendor Search and Filter
```
Step 1: Search by Name/Contact
  ├─ User types in search box
  ├─ Real-time search (as user types)
  ├─ Searches: vendor.name, vendor.contactPerson
  ├─ Case-insensitive matching
  ├─ Partial matches included
  └─ Results update dynamically

Step 2: Filter by Vendor Type
  ├─ User selects from type dropdown
  ├─ Options: All Types, Parts Supplier, Service, Fuel, etc.
  ├─ Single selection (not multi-select)
  ├─ Immediately filters results
  └─ Combines with search (AND logic)

Step 3: Results Display
  ├─ Table updated with matching vendors
  ├─ Maintains all formatting
  ├─ Count shows filtered total (e.g., "Vendors (3)")
  └─ If no results: "No vendors found" message
```

#### Workflow 4: Vendor Performance Rating
```
Step 1: Initial Rating
  ├─ New vendors have rating = 0
  ├─ Display: "Unrated"
  └─ No star display

Step 2: Update Rating
  ├─ After interactions (orders, invoices), update rating
  ├─ Based on:
  │  ├─ On-time delivery %
  │  ├─ Quality of parts/service
  │  ├─ Responsiveness to issues
  │  └─ Pricing competitiveness
  └─ Rating scale: 0-5 stars

Step 3: Display Rating
  ├─ In vendor table: filled star + number (e.g., ★ 4.5)
  ├─ In vendor details: large star display + detailed metrics
  └─ Used for: vendor ranking and selection
```

### Core Functionality and Features

#### 1. Vendor Dashboard Elements
```
Vendor List Display:
├─ Total vendor count
├─ Filterable by type and searchable by name
├─ Color-coded by vendor type
└─ Sortable by various columns

Quick Actions:
├─ Add Vendor button (opens form)
├─ Search field (real-time)
└─ Type filter dropdown
```

#### 2. Vendor Type Color Coding
```javascript
Type Colors:
├─ parts: "bg-blue-100 text-blue-700"
├─ service: "bg-green-100 text-green-700"
├─ fuel: "bg-orange-100 text-orange-700"
├─ insurance: "bg-purple-100 text-purple-700"
├─ leasing: "bg-pink-100 text-pink-700"
├─ towing: "bg-yellow-100 text-yellow-700"
└─ other: "bg-gray-100 text-gray-700"
```

#### 3. Vendor Status Color Coding
```javascript
Status Colors:
├─ active: "bg-green-100 text-green-700" (operational)
├─ inactive: "bg-gray-100 text-gray-700" (not in use)
└─ suspended: "bg-red-100 text-red-700" (temporarily unavailable)
```

#### 4. Vendor Table Columns
| Column | Description | Format | Filterable |
|--------|-------------|--------|-----------|
| Vendor | Name + Contact Person | Text | Yes (search) |
| Type | Vendor type | Badge (color) | Yes (dropdown) |
| Contact | Email + Phone | Icons + text | No |
| Rating | Star rating | Stars + number | No |
| Total Spend | Cumulative spending | Currency | No |
| Status | Active/Inactive/Suspended | Badge (color) | No |
| Actions | Call/Email/View Details | Buttons | No |

#### 5. Action Buttons
```
In Vendor Table:
├─ Call Button: window.location.href = "tel:{phone}"
├─ Email Button: window.location.href = "mailto:{email}"
└─ View Details: Opens details dialog

In Details Dialog:
├─ Email Button: Opens email client
├─ Phone Button: Initiates call
└─ Close Button: Closes dialog
```

### Data Inputs and Outputs

#### Inputs
```typescript
Vendor Data Structure:
{
  id: string                    // System-generated: vendor-{timestamp}
  tenantId: string              // Multi-tenant support (default: "default-tenant")
  name: string                  // Vendor company name (required)
  type: string                  // Vendor type (required)
                                // Options: parts|service|fuel|insurance|leasing|towing|other
  contactPerson: string         // Primary contact name (required)
  email: string                 // Email address (required, validated)
  phone: string                 // Phone number (required)
  address: string               // Physical address (optional)
  website?: string              // Company website URL (optional, http/https)
  rating: number                // Performance rating (0-5 stars)
  status: string                // Current status (active|inactive|suspended)
  services: string[]            // Services/products provided (array)
  paymentTerms: string          // Payment terms (e.g., "Net 30")
  taxId: string                 // Tax/EIN number (optional)
  certifications: string[]      // Certifications held (array)
  contractStart?: string        // Contract start date (ISO, optional)
  contractEnd?: string          // Contract end date (ISO, optional)
  lastOrderDate?: string        // Date of last purchase order (ISO, optional)
  totalSpend: number            // Cumulative spending ($)
  invoiceCount: number          // Total invoices from vendor
  performanceMetrics?: {
    onTimeDelivery: number      // % on-time deliveries (0-100)
    qualityScore: number        // Quality rating (0-100)
    responseTime: number        // Avg response time (hours)
  }
}
```

#### Outputs
1. **Vendor List** - Searchable/filterable table of all vendors
2. **Vendor Details** - Complete vendor information view
3. **Contact Directory** - Quick vendor contact access
4. **Vendor Performance Report** - Rating and metrics analysis
5. **Spending Summary** - Total spend by vendor

### Integration Points with Other Systems

#### 1. Purchase Order Integration
```
Relationship: One vendor → Many purchase orders
├─ Field: PurchaseOrder.vendorName references Vendor.name
├─ Data Flow:
│  ├─ When creating PO, user selects vendor
│  ├─ Vendor details (address, contact) auto-populate
│  ├─ PO total accumulates to Vendor.totalSpend
│  ├─ Invoice count incremented
│  └─ lastOrderDate updated
└─ Benefits: Single source of vendor info
```

#### 2. Invoice Management Integration
```
Relationship: One vendor → Many invoices
├─ Field: Invoice.vendorId references Vendor.id
├─ Data Sync:
│  ├─ Invoice payment terms from vendor record
│  ├─ Vendor rating affects invoice priority
│  └─ Invoice count incremented on vendor
└─ Usage: Track vendor financial performance
```

#### 3. Parts Inventory Integration
```
Relationship: Vendor supplies parts
├─ Field: Part.preferredVendorId, Part.alternateVendors
├─ Workflow:
│  ├─ Parts have preferred vendor for ordering
│  ├─ Alternate vendors for shortage scenarios
│  ├─ Vendor contact auto-populated when ordering
│  └─ Historical order data maintained
└─ Benefits: Streamlined reordering
```

#### 4. Work Order / Maintenance Integration
```
Relationship: Service vendors handle maintenance
├─ Field: WorkOrder.assignedVendorId
├─ Usage:
│  ├─ Service vendors assigned to work orders
│  ├─ Contact info available for scheduling
│  ├─ Cost tracked against vendor performance
│  └─ Quality scoring based on work quality
└─ Outcome: Performance metrics for vendor
```

#### 5. Expense Tracking Integration
```
Relationship: Track spending by vendor
├─ Aggregate invoice and PO totals
├─ Calculations:
│  ├─ Total lifetime spend per vendor
│  ├─ Spending trend over time
│  ├─ Cost per service type
│  └─ Budget allocation by vendor
└─ Reporting: Vendor contribution to total costs
```

#### 6. Communication Log Integration
```
Relationship: Track vendor interactions
├─ Store: Email, phone calls, meetings
├─ Fields:
│  ├─ relatedVendorId references Vendor.id
│  ├─ Type: email|teams|phone|sms|in-person
│  ├─ Date and participants
│  └─ Subject and summary
└─ Benefits: Vendor relationship history
```

---

## COMPREHENSIVE INTEGRATION ARCHITECTURE

### Cross-Module Data Flow
```
VENDOR MANAGEMENT
     ↓ (supplies goods/services to)
PURCHASE ORDERS
     ↓ (generates)
INVOICES
     ├─ (triggers payment)
     └─ (tracks spending for)
VENDOR PERFORMANCE METRICS

EMPLOYEE MILEAGE REIMBURSEMENT
     ↓ (feeds into)
PAYROLL SYSTEM
     └─ (expense reported to)
FINANCIAL REPORTING
```

### Approval Workflows
```
Purchase Order Workflow:
  draft → pending-approval → approved → ordered → received → [invoice]

Mileage Reimbursement Workflow:
  draft → submitted → approved → paid → [payroll integration]

Invoice Workflow:
  draft → pending → paid ✓ (or) overdue/disputed → resolution
```

### Financial Reconciliation
```
Three-Way Matching (for PO-based purchases):
  1. Purchase Order (commitment)
     ├─ Specifies items, quantities, prices
     └─ Status: "ordered"
  2. Receipt/Delivery
     ├─ Goods received and inspected
     └─ Status: "received"
  3. Invoice (from vendor)
     ├─ Billed amount should match PO
     └─ Status: "pending" → "paid"
  Result: Ensures accurate billing and payment
```

---

## TEST SCENARIOS

### 1. INVOICES MODULE TEST SCENARIOS

**Test Scenario 1: Create and Track Invoice Lifecycle**
```gherkin
Given a new vendor "AutoZone Parts"
When I create invoice INV-001 for $5,000 with due date 30 days out
And I record a partial payment of $3,000
And I mark the remaining as paid
Then the invoice status should be "paid"
And the balance should be $0
And the total paid should equal the total amount
```

**Test Scenario 2: Overdue Invoice Detection**
```gherkin
Given invoice INV-002 with due date 10 days ago
And status "pending"
When the system checks the invoice
Then the status should automatically change to "overdue"
And the invoice should appear highlighted in red
And the overdue count should increment
```

**Test Scenario 3: Search and Filter**
```gherkin
Given 10 invoices from different vendors
When I search for "AutoZone"
Then only invoices from AutoZone should display
When I filter by status "paid"
Then only paid invoices display
When I combine search and filter
Then results should match both conditions
```

**Test Scenario 4: Disputed Invoice Management**
```gherkin
Given invoice with amount $5,000
When vendor sends corrected invoice for $4,500
And I mark original as "disputed"
And I add dispute reason "Amount mismatch"
Then the invoice appears in disputed queue
And the original cannot be marked paid
And a resolution must be documented
```

---

### 2. PURCHASE ORDERS MODULE TEST SCENARIOS

**Test Scenario 5: Complete PO Approval Workflow**
```gherkin
Given I'm in procurement role
When I create a PO for 5 items totaling $2,000
And the PO requires approval
And an approver reviews and clicks "Approve"
Then the status changes to "approved"
And the approver name is recorded
And I can then "Place Order" with vendor
And status changes to "ordered"
```

**Test Scenario 6: PO Item Management**
```gherkin
Given an empty PO form
When I add 3 items:
  | Item | Qty | Price | Total |
  | Wheel | 4 | $150 | $600 |
  | Brake | 2 | $300 | $600 |
  | Filter | 10 | $20 | $200 |
And the system calculates total as $1,400
When I remove the Filter item
Then total recalculates to $1,200
And minimum 1 item is required
```

**Test Scenario 7: PO Rejection with Reason**
```gherkin
Given a PO in "pending-approval" status
When an approver clicks "Reject"
And enters reason "Budget exceeded"
Then a dialog appears asking for rejection reason
And the reason is appended to PO notes
And status changes to "cancelled"
And cannot be recovered (must create new PO)
```

**Test Scenario 8: PO Delivery Tracking**
```gherkin
Given PO with expected delivery date
When status is "ordered"
And vendor provides delivery confirmation
And actual delivery date is recorded
Then the system compares expected vs. actual
If delayed, then notification is sent
And status changes to "received"
And inventory is updated
```

---

### 3. MILEAGE REIMBURSEMENT MODULE TEST SCENARIOS

**Test Scenario 9: Mileage Request Submission and Approval**
```gherkin
Given an employee named "John Smith"
When John submits a mileage request:
  | Field | Value |
  | Trip Date | 2025-11-10 |
  | Start Location | Office |
  | End Location | Client Site |
  | Miles | 50 |
  | Purpose | Client meeting |
  | Vehicle | Sedan |
And system calculates: 50 × $0.655 = $32.75
And status is "submitted"
When a manager approves the request
Then status changes to "approved"
And manager name is recorded
When finance marks as paid
Then status changes to "paid"
And amount is sent to payroll
```

**Test Scenario 10: IRS Rate Calculation Accuracy**
```gherkin
Given REIMBURSEMENT_RATE = 0.655
When employee travels:
  | Scenario | Miles | Expected Amount |
  | 1 | 100 | $65.50 |
  | 2 | 50 | $32.75 |
  | 3 | 1 | $0.66 (rounded) |
Then the calculations are accurate to cents
And all amounts are formatted as currency
```

**Test Scenario 11: Request Status Transitions**
```gherkin
Given request in "submitted" status
Then can be "approved" or "rejected"
Given request in "approved" status
Then can be "paid"
Given request in "paid" status
Then is terminal (no further changes)
Given request in "rejected" status
Then is terminal (employee must resubmit)
```

**Test Scenario 12: Vehicle Type Selection**
```gherkin
Given vehicle type dropdown
When employee selects:
  | Type | Purpose |
  | Sedan | Standard vehicle |
  | SUV | Larger vehicle |
  | Truck | Commercial vehicle |
  | Van | Transport vehicle |
  | Personal Vehicle | Own car |
Then the selection is recorded
And affects reimbursement rate (currently same for all)
And used for reporting/analysis
```

---

### 4. VENDOR MANAGEMENT MODULE TEST SCENARIOS

**Test Scenario 13: Complete Vendor Onboarding**
```gherkin
Given the Add Vendor dialog
When I fill in required fields:
  | Field | Value | Required |
  | Name | "Superior Auto Parts" | Yes |
  | Type | "Parts Supplier" | Yes |
  | Contact Person | "Jane Doe" | Yes |
  | Email | "jane@parts.com" | Yes |
  | Phone | "(555) 123-4567" | Yes |
  | Website | "https://parts.com" | No |
  | Address | "123 Main St" | No |
  | Payment Terms | "Net 30" | No |
  | Tax ID | "12-3456789" | No |
And I click "Add Vendor"
Then a new vendor record is created
And tenantId, id, rating, status are auto-set
And vendor appears in the list
And toast shows "Vendor added successfully"
```

**Test Scenario 14: Vendor Validation**
```gherkin
Given incomplete vendor form
When I click "Add Vendor" without:
  | Required Field |
  | Vendor Name |
  | Contact Person |
  | Email |
  | Phone |
Then an error toast shows "Please fill in required fields"
And the vendor is not created
```

**Test Scenario 15: Vendor Search and Filter**
```gherkin
Given 15 vendors of different types
When I search for "AutoZone"
Then only "AutoZone" related vendors display
When I filter by type "Parts Supplier"
Then all "Parts Supplier" vendors display
When I combine search and filter
Then vendors matching both criteria display
And count shows filtered results
```

**Test Scenario 16: Quick Contact Actions**
```gherkin
Given vendor "Auto Service Co"
When I click "Call" button
Then initiates tel:{phone} action
When I click "Email" button
Then opens mailto:{email} in email client
When I click "View Details"
Then displays full vendor information dialog
And I can access email/call from details
```

**Test Scenario 17: Vendor Performance Rating**
```gherkin
Given a vendor with 0 rating
When the vendor supplies parts
And we track:
  | Metric | Value |
  | On-time deliveries | 95% |
  | Quality issues | 0 |
  | Response time | < 4 hours |
Then rating is updated to 4.8/5.0
When vendor fails a delivery
Then rating may decrease
And performance is tracked for future decisions
```

---

## USER EXPERIENCE & UI PATTERNS

### Common UI Components Used
1. **Cards** - Information containers for dashboards and details
2. **Badges** - Status indicators (color-coded)
3. **Dialogs/Modals** - Forms, confirmations, details views
4. **Tables** - List views with sorting and filtering
5. **Buttons** - Actions (primary, secondary, destructive)
6. **Input Fields** - Text, number, date, email, phone
7. **Textareas** - Multi-line text entry
8. **Dropdowns/Select** - Options selection
9. **Toast Notifications** - User feedback (success/error)
10. **Icons** - Visual indicators (Phosphor icons)

### Design Patterns
- **Master-Detail:** List view with detail dialog
- **CRUD Operations:** Create (forms), Read (lists/details), Update (inline), Delete
- **Search + Filter:** Combined search and category filtering
- **Status Tracking:** Color-coded badges for status visibility
- **Progressive Disclosure:** Show details on demand
- **Confirmation:** Dialog for destructive actions
- **Real-time Feedback:** Toast notifications for actions

---

## SECURITY & COMPLIANCE CONSIDERATIONS

### Data Access Control
- Vendor names and contact info: All authenticated users
- Invoice details: Finance staff only
- PO approvals: Approvers per budget authority
- Reimbursement approval: Managers only
- Payment processing: Finance/accounting only

### Audit Logging
- All invoice payments logged with user, amount, date
- PO approvals recorded with approver name, date
- Reimbursement approvals tracked
- Vendor data changes logged (for compliance)
- Financial transactions tied to user identity

### Compliance Requirements
- **IRS Compliance:** Mileage rate ($0.655) matches current standard
- **SOX Compliance:** Audit trail for financial transactions
- **Tax Reporting:** Vendor tax IDs, payment dates for 1099 reporting
- **3-way Matching:** PO-Receipt-Invoice validation
- **Approval Authority:** Spending limits enforced by status
- **Data Retention:** 7+ years for financial records

---

## PERFORMANCE METRICS & MONITORING

### Key Performance Indicators (KPIs)

**Invoice Management:**
- Average payment time (invoice date to paid date)
- Overdue invoice ratio (overdue / total)
- Disputed invoice resolution time
- Cash flow (total outstanding balance)

**Purchase Orders:**
- Order fulfillment time (ordered to received)
- On-time delivery rate by vendor
- Average order value
- Approval cycle time

**Mileage Reimbursement:**
- Average reimbursement per request
- Approval rate (approved / submitted)
- Monthly reimbursement spend
- Employee participation rate

**Vendor Management:**
- Vendor spending concentration (top N vendors % of spend)
- Vendor rating distribution
- New vendor onboarding time
- Vendor retention rate

---

## FUTURE ENHANCEMENT OPPORTUNITIES

1. **Automation:**
   - Auto-match invoices to POs
   - Automatic payment scheduling
   - Recurring reimbursement requests

2. **Analytics:**
   - Predictive analytics for overdue invoices
   - Vendor performance trending
   - Spend forecasting by category

3. **Integration:**
   - QuickBooks / accounting system sync
   - Email attachment parsing (invoices)
   - OCR for invoice data extraction

4. **Mobile:**
   - Mobile app for approvals
   - Receipt scanning for mileage
   - Vendor directory on mobile

5. **Reporting:**
   - 1099 report generation
   - Aging reports (invoice, AP)
   - Reconciliation reports

6. **Workflow:**
   - Multi-level approval chains
   - Conditional approval based on amount
   - Auto-rejection for policy violations

---

## SUMMARY

The Financial Operations module in the Fleet Application provides comprehensive tools for managing vendor relationships, procurement, invoicing, and employee reimbursement. The four integrated features work together to create a complete financial management ecosystem with proper controls, audit trails, and approval workflows.

**Key Strengths:**
- Intuitive user interfaces with clear status indicators
- Real-time calculations and automatic status updates
- Multi-stage approval workflows for control
- Comprehensive audit trails for compliance
- Integrated vendor and financial data

**Integration Points:**
- Vendors ↔ Purchase Orders ↔ Invoices
- Employees ↔ Mileage Reimbursement ↔ Payroll
- Financial data feeds reporting and budgeting systems

**Compliance Features:**
- IRS-standard mileage rates
- Three-way invoice matching (PO-Receipt-Invoice)
- Approval authority enforcement
- Complete audit logging
- Multi-tenant support with data isolation

