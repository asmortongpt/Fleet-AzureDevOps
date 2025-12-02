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
