//
//  InvoiceListView.swift
//  Fleet Manager
//
//  Invoice management with payment tracking
//

import SwiftUI

struct InvoiceListView: View {
    @StateObject private var viewModel = InvoiceViewModel()
    @State private var showingAddInvoice = false

    var body: some View {
        ZStack {
            if viewModel.loadingState.isLoading && viewModel.invoices.isEmpty {
                ProgressView("Loading invoices...")
            } else if viewModel.filteredInvoices.isEmpty {
                emptyStateView
            } else {
                invoiceListContent
            }
        }
        .navigationTitle("Invoices")
        .navigationBarTitleDisplayMode(.large)
        .searchable(text: $viewModel.searchText, prompt: "Search invoices")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { showingAddInvoice = true }) {
                    Image(systemName: "plus.circle.fill")
                        .symbolRenderingMode(.hierarchical)
                }
            }
        }
        .sheet(isPresented: $showingAddInvoice) {
            AddInvoiceView()
        }
        .refreshable {
            await viewModel.refresh()
        }
        .task {
            await viewModel.fetchInvoices()
        }
    }

    // MARK: - Invoice List Content
    private var invoiceListContent: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Alerts
                if !viewModel.pendingApproval.isEmpty || !viewModel.overdue.isEmpty {
                    alertsSection
                }

                // Filters
                filtersSection

                // Summary Cards
                summaryCardsSection

                // Invoice List
                LazyVStack(spacing: 12) {
                    ForEach(viewModel.filteredInvoices) { invoice in
                        NavigationLink(destination: InvoiceDetailView(invoice: invoice)) {
                            InvoiceCard(invoice: invoice)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal)
            }
            .padding(.vertical)
        }
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Alerts Section
    private var alertsSection: some View {
        VStack(spacing: 12) {
            if !viewModel.pendingApproval.isEmpty {
                AlertBanner(
                    title: "Pending Approval",
                    message: "\(viewModel.pendingApproval.count) invoices awaiting approval",
                    icon: "clock.fill",
                    color: .orange
                )
            }

            if !viewModel.overdue.isEmpty {
                AlertBanner(
                    title: "Overdue Invoices",
                    message: "\(viewModel.overdue.count) invoices past due date",
                    icon: "exclamationmark.triangle.fill",
                    color: .red
                )
            }
        }
        .padding(.horizontal)
    }

    // MARK: - Filters Section
    private var filtersSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                Menu {
                    Button("All Statuses") {
                        viewModel.selectStatus(nil)
                    }
                    ForEach(InvoiceStatus.allCases, id: \.self) { status in
                        Button(action: {
                            viewModel.selectStatus(status)
                        }) {
                            Label(status.rawValue, systemImage: status.icon)
                        }
                    }
                } label: {
                    HStack {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                        Text(viewModel.selectedStatus?.rawValue ?? "Status")
                        Image(systemName: "chevron.down")
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(viewModel.selectedStatus != nil ? Color.blue : Color(.secondarySystemGroupedBackground))
                    .foregroundColor(viewModel.selectedStatus != nil ? .white : .primary)
                    .cornerRadius(20)
                }
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Summary Cards Section
    private var summaryCardsSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                SummaryCard(
                    title: "Total Invoices",
                    value: "\(viewModel.invoices.count)",
                    icon: "doc.text.fill",
                    color: .blue
                )

                SummaryCard(
                    title: "Pending Approval",
                    value: "\(viewModel.pendingApproval.count)",
                    icon: "clock.fill",
                    color: .orange
                )

                SummaryCard(
                    title: "Overdue",
                    value: "\(viewModel.overdue.count)",
                    icon: "exclamationmark.triangle.fill",
                    color: .red
                )

                SummaryCard(
                    title: "Amount Due",
                    value: String(format: "$%.0fK", viewModel.totalDue / 1000),
                    icon: "dollarsign.circle.fill",
                    color: .purple
                )
            }
            .padding(.horizontal)
        }
    }

    // MARK: - Empty State
    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "doc.text")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Invoices")
                .font(.title2.bold())

            Text("Add invoices to track payments")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)

            Button(action: { showingAddInvoice = true }) {
                Label("Add Invoice", systemImage: "plus.circle.fill")
                    .font(.headline)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(12)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Invoice Card
struct InvoiceCard: View {
    let invoice: Invoice

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(invoice.invoiceNumber)
                        .font(.headline)
                        .foregroundColor(.primary)

                    Text(invoice.vendorName)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(invoice.formattedTotal)
                        .font(.headline)
                        .foregroundColor(invoice.isPaid ? .green : .primary)

                    HStack(spacing: 4) {
                        Image(systemName: invoice.status.icon)
                            .font(.caption2)
                        Text(invoice.status.rawValue)
                            .font(.caption2)
                    }
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color(invoice.statusColor).opacity(0.2))
                    .foregroundColor(Color(invoice.statusColor))
                    .cornerRadius(8)
                }
            }

            Divider()

            // Details
            HStack(spacing: 20) {
                InvoiceMetric(
                    icon: "calendar",
                    label: "Invoice Date",
                    value: invoice.invoiceDate.formatted(date: .abbreviated, time: .omitted)
                )

                InvoiceMetric(
                    icon: "calendar.badge.clock",
                    label: "Due Date",
                    value: invoice.dueDate.formatted(date: .abbreviated, time: .omitted)
                )

                if invoice.amountDue > 0 {
                    InvoiceMetric(
                        icon: "dollarsign.circle",
                        label: "Amount Due",
                        value: invoice.formattedAmountDue
                    )
                }
            }

            // PO Match
            if let poNumber = invoice.poNumber {
                HStack(spacing: 8) {
                    Image(systemName: "link.circle.fill")
                        .font(.caption)
                        .foregroundColor(.blue)
                    Text("Matched to \(poNumber)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            } else {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.circle.fill")
                        .font(.caption)
                        .foregroundColor(.orange)
                    Text("No matching PO")
                        .font(.caption)
                        .foregroundColor(.orange)
                }
            }

            // Overdue Warning
            if invoice.isOverdue {
                HStack(spacing: 8) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundColor(.red)
                    Text("Overdue by \(invoice.daysOverdue) days")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }

            // Payment Info
            if invoice.isPaid, let paidDate = invoice.paidDate {
                HStack(spacing: 8) {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.caption)
                        .foregroundColor(.green)
                    Text("Paid on \(paidDate.formatted(date: .abbreviated, time: .omitted))")
                        .font(.caption)
                        .foregroundColor(.green)
                }
            } else if invoice.amountPaid > 0 {
                HStack(spacing: 8) {
                    Image(systemName: "dollarsign.circle.fill")
                        .font(.caption)
                        .foregroundColor(.blue)
                    Text("Partially paid: \(invoice.formattedAmountPaid)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Invoice Metric
struct InvoiceMetric: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption2)
                    .foregroundColor(.blue)
                Text(label)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            Text(value)
                .font(.caption.bold())
                .foregroundColor(.primary)
        }
    }
}

// MARK: - Invoice Detail View
struct InvoiceDetailView: View {
    let invoice: Invoice

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                // Header
                VStack(alignment: .leading, spacing: 8) {
                    Text(invoice.invoiceNumber)
                        .font(.title2.bold())
                    Text(invoice.vendorName)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                .padding()

                // Status
                HStack {
                    Image(systemName: invoice.status.icon)
                    Text(invoice.status.rawValue)
                        .font(.headline)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color(invoice.statusColor).opacity(0.2))
                .foregroundColor(Color(invoice.statusColor))
                .cornerRadius(12)
                .padding(.horizontal)

                // Payment Summary
                VStack(alignment: .leading, spacing: 12) {
                    Text("Payment Summary")
                        .font(.headline)
                        .padding(.horizontal)

                    VStack(spacing: 0) {
                        HStack {
                            Text("Total Amount")
                            Spacer()
                            Text(invoice.formattedTotal)
                                .font(.headline)
                        }
                        .padding()
                        .background(Color(.secondarySystemGroupedBackground))

                        Divider()

                        HStack {
                            Text("Amount Paid")
                            Spacer()
                            Text(invoice.formattedAmountPaid)
                                .foregroundColor(.green)
                        }
                        .padding()
                        .background(Color(.secondarySystemGroupedBackground))

                        Divider()

                        HStack {
                            Text("Amount Due")
                                .font(.headline)
                            Spacer()
                            Text(invoice.formattedAmountDue)
                                .font(.headline)
                                .foregroundColor(invoice.amountDue > 0 ? .red : .green)
                        }
                        .padding()
                        .background(Color(.tertiarySystemGroupedBackground))
                    }
                    .cornerRadius(12)
                    .padding(.horizontal)
                }

                // Line Items
                VStack(alignment: .leading, spacing: 12) {
                    Text("Line Items")
                        .font(.headline)
                        .padding(.horizontal)

                    ForEach(invoice.items) { item in
                        InvoiceLineItemCard(item: item)
                    }
                }

                // Dates
                VStack(alignment: .leading, spacing: 12) {
                    Text("Important Dates")
                        .font(.headline)
                        .padding(.horizontal)

                    VStack(spacing: 8) {
                        DateRow(label: "Invoice Date", date: invoice.invoiceDate)
                        DateRow(label: "Due Date", date: invoice.dueDate)
                        if let paidDate = invoice.paidDate {
                            DateRow(label: "Paid Date", date: paidDate)
                        }
                    }
                    .padding()
                    .background(Color(.secondarySystemGroupedBackground))
                    .cornerRadius(12)
                    .padding(.horizontal)
                }

                // Actions
                if invoice.canApprove {
                    VStack(spacing: 12) {
                        Button(action: {}) {
                            Label("Approve Payment", systemImage: "checkmark.circle.fill")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }

                        Button(action: {}) {
                            Label("Dispute Invoice", systemImage: "exclamationmark.triangle.fill")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.orange)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                    }
                    .padding(.horizontal)
                } else if invoice.canPay {
                    Button(action: {}) {
                        Label("Record Payment", systemImage: "dollarsign.circle.fill")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(12)
                    }
                    .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
        .navigationTitle("Invoice Details")
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Invoice Line Item Card
struct InvoiceLineItemCard: View {
    let item: InvoiceLineItem

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(item.description)
                    .font(.subheadline.bold())
                Spacer()
                Text(item.formattedTotalPrice)
                    .font(.subheadline.bold())
                    .foregroundColor(.green)
            }

            HStack {
                if let partNumber = item.partNumber {
                    Text(partNumber)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                Spacer()
                Text("Qty: \(item.quantity) × \(item.formattedUnitPrice)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemGroupedBackground))
        .cornerRadius(10)
        .padding(.horizontal)
    }
}

// MARK: - Date Row
struct DateRow: View {
    let label: String
    let date: Date

    var body: some View {
        HStack {
            Text(label)
                .foregroundColor(.secondary)
            Spacer()
            Text(date.formatted(date: .long, time: .omitted))
        }
    }
}

// MARK: - Add Invoice View (Placeholder)
struct AddInvoiceView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("Invoice Information") {
                    TextField("Invoice Number", text: .constant(""))
                    Text("Select Vendor")
                    DatePicker("Invoice Date", selection: .constant(Date()), displayedComponents: .date)
                    DatePicker("Due Date", selection: .constant(Date()), displayedComponents: .date)
                }

                Section("Amount") {
                    TextField("Total Amount", text: .constant(""))
                        .keyboardType(.decimalPad)
                }

                Section("Purchase Order") {
                    Toggle("Match to PO", isOn: .constant(false))
                }
            }
            .navigationTitle("Add Invoice")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { dismiss() }
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        InvoiceListView()
    }
}
