t
//
//  CertificationManagementView.swift
//  Fleet Manager
//
//  A SwiftUI view for managing driver certifications in a fleet.
//

import SwiftUI
import Combine

// MARK: - Certification Item
struct CertificationItem: Identifiable {
    let id = UUID()
    let driverId: String
    let certificationType: String
    let expirationDate: Date
}

// MARK: - CertificationManagementViewModel
class CertificationManagementViewModel: ObservableObject {
    @Published var certificationItems = [CertificationItem]()
    
    // TODO: Add your data loading logic here
    // Make sure to use parameterized SQL queries and validate all inputs
}

// MARK: - CertificationManagementView
struct CertificationManagementView: View {
    @StateObject private var viewModel = CertificationManagementViewModel()
    
    var body: some View {
        NavigationView {
            List(viewModel.certificationItems) { item in
                CertificationCard(certification: item)
            }
            .navigationTitle("Certifications")
            .accessibility(label: Text("Certifications list"))
            .padding()
        }
    }
}

// MARK: - Certification Card
struct CertificationCard: View {
    var certification: CertificationItem
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(certification.certificationType)
                    .font(.headline)
                    .accessibility(label: Text("\(certification.certificationType) certification"))
                Text("Expires on \(certification.expirationDate, style: .date)")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .accessibility(label: Text("Expiration date: \(certification.expirationDate, style: .long)"))
            }
            Spacer()
            Image(systemName: "info.circle")
                .accessibility(label: Text("More information"))
        }
        .padding()
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(Color.gray, lineWidth: 1)
        )
        .padding(.horizontal)
    }
}

// MARK: - Preview
#if DEBUG
struct CertificationManagementView_Previews: PreviewProvider {
    static var previews: some View {
        CertificationManagementView()
    }
}
#endif