import SwiftUI

/// DOT Certification Management View
struct CertificationManagementView: View {
    @State private var certifications: [Certification] = []
    @State private var selectedCategory: CertificationCategory = .driver
    @State private var showingAddCert = false

    var filteredCerts: [Certification] {
        certifications.filter { $0.type.category == selectedCategory }
    }

    var body: some View {
        NavigationView {
            VStack {
                Picker("Category", selection: $selectedCategory) {
                    Text("Driver").tag(CertificationCategory.driver)
                    Text("Vehicle").tag(CertificationCategory.vehicle)
                    Text("Company").tag(CertificationCategory.company)
                }
                .pickerStyle(.segmented)
                .padding()

                if filteredCerts.isEmpty {
                    emptyStateView
                } else {
                    List {
                        ForEach(filteredCerts) { cert in
                            certificationRow(cert)
                        }
                    }
                }
            }
            .navigationTitle("Certifications")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingAddCert = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingAddCert) {
                AddCertificationView()
            }
            .task {
                loadCertifications()
            }
        }
    }

    private func certificationRow(_ cert: Certification) -> some View {
        HStack {
            Image(systemName: cert.type.icon)
                .font(.title2)
                .foregroundColor(colorForStatus(cert.status))
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 4) {
                Text(cert.type.displayName)
                    .font(.headline)

                Text(cert.number)
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                HStack {
                    Image(systemName: cert.status.icon)
                        .font(.caption)

                    Text(cert.status.displayName)
                        .font(.caption)

                    if let daysLeft = cert.expiresWithinDays {
                        Text("• \(daysLeft) days")
                            .font(.caption)
                            .foregroundColor(.orange)
                    }
                }
                .foregroundColor(colorForStatus(cert.status))
            }

            Spacer()

            VStack(alignment: .trailing) {
                Text("Expires")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text(cert.expirationDate, style: .date)
                    .font(.caption)
                    .fontWeight(.medium)
            }
        }
        .padding(.vertical, 4)
    }

    private var emptyStateView: some View {
        VStack(spacing: 20) {
            Image(systemName: "doc.badge.ellipsis")
                .font(.system(size: 60))
                .foregroundColor(.secondary)

            Text("No Certifications")
                .font(.title2)
                .fontWeight(.bold)

            Button {
                showingAddCert = true
            } label: {
                Label("Add Certification", systemImage: "plus")
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
        }
    }

    private func loadCertifications() {
        certifications = Certification.mockData
    }

    private func colorForStatus(_ status: CertificationStatus) -> Color {
        switch status {
        case .active: return .green
        case .expiring: return .orange
        case .expired, .revoked: return .red
        case .suspended: return .gray
        }
    }
}

struct AddCertificationView: View {
    @Environment(\.dismiss) var dismiss
    @State private var certType: CertificationType = .cdl
    @State private var certNumber = ""
    @State private var issuedDate = Date()
    @State private var expirationDate = Date().addingTimeInterval(365 * 24 * 3600)

    var body: some View {
        NavigationView {
            Form {
                Picker("Type", selection: $certType) {
                    ForEach(CertificationType.allCases, id: \.self) { type in
                        Text(type.displayName).tag(type)
                    }
                }

                TextField("Certificate Number", text: $certNumber)

                DatePicker("Issued Date", selection: $issuedDate, displayedComponents: .date)

                DatePicker("Expiration Date", selection: $expirationDate, displayedComponents: .date)
            }
            .navigationTitle("Add Certification")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") { saveCertification() }
                        .disabled(certNumber.isEmpty)
                }
            }
        }
    }

    private func saveCertification() {
        // Save to backend
        dismiss()
    }
}

struct CertificationManagementView_Previews: PreviewProvider {
    static var previews: some View {
        CertificationManagementView()
    }
}
