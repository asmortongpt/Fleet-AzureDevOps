}

// MARK: - Preview
struct WarrantyDetailView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            WarrantyDetailView(warranty: sampleWarranty)
        }
    }

    static var sampleWarranty: Warranty {
        Warranty(
            id: "1",
            tenantId: "tenant1",
            vehicleId: "vehicle1",
            component: "Engine",
            provider: WarrantyProvider(
                name: "AutoShield",
                contact: ProviderContact(
                    phone: "1-800-555-0100",
                    email: "claims@autoshield.com",
                    website: "https://autoshield.com",
                    address: "123 Main St",
                    hours: "Mon-Fri 9AM-5PM"
                ),
                claimProcess: ClaimProcess(
                    submissionMethod: "Online",
                    requiredDocuments: ["Invoice", "Photos"],
                    averageProcessingDays: 10,
                    onlinePortal: "https://portal.autoshield.com"
                ),
                serviceLevel: "Premium",
                rating: 4.5
            ),
            type: .powertrain,
            startDate: Date().addingTimeInterval(-365*24*60*60),
            endDate: Date().addingTimeInterval(365*24*60*60),
            mileageLimit: 100000,
            coverage: WarrantyCoverage(
                coveredComponents: ["Engine", "Transmission", "Drivetrain"],
                exclusions: ["Wear and tear", "Modifications"],
                limitations: ["Must use certified repair shops"],
                maxClaimAmount: 5000,
                aggregateLimit: 15000
            ),
            terms: "Standard powertrain warranty terms",
            purchasePrice: 2500,
            deductible: 100,
            status: .active,
            documentURL: nil,
            notes: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}
